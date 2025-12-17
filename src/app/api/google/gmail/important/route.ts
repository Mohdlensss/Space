import { NextResponse } from 'next/server'
import { getGoogleTokens, googleFetch } from '@/lib/google/tokens'
import { getCurrentUser } from '@/lib/auth'

// Simple in-memory cache (180 seconds for email)
const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 180 * 1000

export async function GET() {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Check cache
    const cacheKey = `gmail-important-${user.id}`
    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data)
    }

    // Check if tokens exist
    const tokens = await getGoogleTokens(user.id)
    
    if (!tokens) {
      return NextResponse.json(
        { 
          error: 'Google not connected',
          reason: 'no_tokens',
          message: 'Please reconnect your Google account to access email.'
        },
        { status: 401 }
      )
    }

    // Fetch messages from inbox (important or recent)
    const messagesResponse = await googleFetch(
      user.id,
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10&q=in:inbox`
    )

    if (!messagesResponse.ok) {
      const errorText = await messagesResponse.text()
      throw new Error(`Gmail API error: ${errorText}`)
    }

    const messagesData = await messagesResponse.json()
    const messageIds = (messagesData.messages || []).slice(0, 10)

    // Fetch full message details
    const messages = await Promise.all(
      messageIds.map(async (msg: { id: string }) => {
        try {
          const msgResponse = await googleFetch(
            user.id,
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`
          )
          
          if (!msgResponse.ok) {
            return null
          }

          const msgData = await msgResponse.json()
          const headers = msgData.payload?.headers || []
          
          const getHeader = (name: string) => 
            headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || ''

          return {
            id: msg.id,
            subject: getHeader('Subject') || '(No subject)',
            from: getHeader('From') || 'Unknown',
            date: getHeader('Date') || '',
            snippet: msgData.snippet || '',
            threadId: msgData.threadId,
          }
        } catch (err) {
          console.error(`Error fetching message ${msg.id}:`, err)
          return null
        }
      })
    )

    const validMessages = messages.filter((m): m is NonNullable<typeof m> => m !== null)

    const response = {
      connected: true,
      messages: validMessages,
      count: validMessages.length,
    }

    // Cache the response
    cache.set(cacheKey, { data: response, timestamp: Date.now() })

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Gmail API error:', error)
    
    if (error.message?.includes('401') || error.message?.includes('token')) {
      return NextResponse.json(
        { 
          error: 'Google token expired',
          reason: 'token_expired',
          message: 'Please reconnect your Google account.'
        },
        { status: 401 }
      )
    }

    // Check for API not enabled error
    if (error.message?.includes('403') || error.message?.includes('PERMISSION_DENIED') || error.message?.includes('SERVICE_DISABLED')) {
      return NextResponse.json(
        { 
          error: 'Gmail API not enabled',
          reason: 'api_not_enabled',
          message: 'Gmail API needs to be enabled in Google Cloud Console. Visit /integrations for instructions.'
        },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { 
        error: 'Failed to fetch email',
        message: error.message || 'Unknown error'
      },
      { status: 500 }
    )
  }
}
