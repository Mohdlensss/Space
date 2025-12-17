import { NextResponse } from 'next/server'
import { getGoogleTokens } from '@/lib/google/tokens'
import { getCurrentUser } from '@/lib/auth'
// Note: We use a local googleFetch function below with the tokens
import { classifyEmails, getFilteredAndSortedEmails, getEmailStats } from '@/lib/ai/email-classifier'

// Cache for 2 minutes (reduced for fresher data)
const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 120 * 1000

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Check for force refresh
    const { searchParams } = new URL(request.url)
    const forceRefresh = searchParams.get('refresh') === 'true'

    // Check cache (unless force refresh)
    const cacheKey = `gmail-smart-${user.id}`
    if (!forceRefresh) {
      const cached = cache.get(cacheKey)
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return NextResponse.json(cached.data)
      }
    } else {
      cache.delete(cacheKey)
    }

    const tokens = await getGoogleTokens(user.id)
    
    if (!tokens) {
      return NextResponse.json(
        { 
          connected: false,
          error: 'Google not connected',
          message: 'Please reconnect your Google account.'
        },
        { status: 401 }
      )
    }

    // Helper function for Google API calls
    const googleFetch = async (url: string) => {
      return fetch(url, {
        headers: { 'Authorization': `Bearer ${tokens.accessToken}` },
        cache: 'no-store'
      })
    }

    // Fetch more messages for better analysis
    const messagesResponse = await googleFetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=40&q=in:inbox`
    )

    if (!messagesResponse.ok) {
      const errorText = await messagesResponse.text()
      console.error('[Gmail API] Error:', messagesResponse.status, errorText)
      
      if (messagesResponse.status === 401) {
        return NextResponse.json(
          { connected: false, error: 'Token expired', message: 'Please reconnect Google.' },
          { status: 401 }
        )
      }
      
      if (messagesResponse.status === 403) {
        return NextResponse.json(
          { connected: false, error: 'API not enabled', message: 'Enable Gmail API in Google Cloud Console.' },
          { status: 503 }
        )
      }
      
      throw new Error(`Gmail API error: ${messagesResponse.status}`)
    }

    const messagesData = await messagesResponse.json()
    const messageIds = (messagesData.messages || []).slice(0, 40)

    // Fetch message details including CC
    const messages = await Promise.all(
      messageIds.map(async (msg: { id: string }) => {
        try {
          const msgResponse = await googleFetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date&metadataHeaders=To&metadataHeaders=Cc`
          )
          
          if (!msgResponse.ok) return null

          const msgData = await msgResponse.json()
          const headers = msgData.payload?.headers || []
          
          const getHeader = (name: string) => 
            headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || ''

          return {
            id: msg.id,
            subject: getHeader('Subject') || '(No subject)',
            from: getHeader('From') || 'Unknown',
            date: getHeader('Date') || '',
            to: getHeader('To') || '',
            cc: getHeader('Cc') || '',
            snippet: msgData.snippet || '',
            threadId: msgData.threadId,
          }
        } catch {
          return null
        }
      })
    )

    const validMessages = messages.filter((m): m is NonNullable<typeof m> => m !== null)

    // AI Classification
    const classifiedEmails = classifyEmails(validMessages)
    const sortedEmails = getFilteredAndSortedEmails(classifiedEmails, false) // Don't exclude low priority
    const stats = getEmailStats(classifiedEmails)

    // Group by priority
    const grouped = {
      critical: sortedEmails.filter(e => e.priority === 'critical'),
      important: sortedEmails.filter(e => e.priority === 'important'),
      normal: sortedEmails.filter(e => e.priority === 'normal'),
      low: sortedEmails.filter(e => e.priority === 'low'),
    }

    const response = {
      connected: true,
      emails: sortedEmails,
      grouped,
      stats,
      aiPowered: true,
      lastRefreshed: new Date().toISOString(),
    }

    cache.set(cacheKey, { data: response, timestamp: Date.now() })

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Smart Gmail API error:', error)

    return NextResponse.json(
      { connected: false, error: 'Failed to fetch emails', message: error.message },
      { status: 500 }
    )
  }
}
