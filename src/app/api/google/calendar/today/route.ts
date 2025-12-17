import { NextResponse } from 'next/server'
import { getGoogleTokens } from '@/lib/google/tokens'
import { getCurrentUser } from '@/lib/auth'

// Simple in-memory cache (60 seconds)
const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 60 * 1000

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
    const cacheKey = `calendar-today-${user.id}`
    if (!forceRefresh) {
      const cached = cache.get(cacheKey)
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return NextResponse.json(cached.data)
      }
    } else {
      cache.delete(cacheKey)
    }

    // Check if tokens exist
    const tokens = await getGoogleTokens(user.id)
    
    if (!tokens) {
      return NextResponse.json(
        { 
          error: 'Google not connected',
          reason: 'no_tokens',
          message: 'Please reconnect your Google account to access calendar events.'
        },
        { status: 401 }
      )
    }

    // Fetch today's events from Google Calendar API
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    
    const calendarResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
      `timeMin=${startOfDay.toISOString()}&` +
      `timeMax=${endOfDay.toISOString()}&` +
      `singleEvents=true&` +
      `orderBy=startTime`,
      {
        headers: {
          'Authorization': `Bearer ${tokens.accessToken}`,
        },
        cache: 'no-store'
      }
    )

    if (!calendarResponse.ok) {
      const errorText = await calendarResponse.text()
      console.error('[Calendar API] Error:', calendarResponse.status, errorText)
      
      if (calendarResponse.status === 401) {
        return NextResponse.json(
          { 
            error: 'Google token expired',
            reason: 'token_expired',
            message: 'Please reconnect your Google account.'
          },
          { status: 401 }
        )
      }
      
      if (calendarResponse.status === 403) {
        return NextResponse.json(
          { 
            error: 'Calendar API not enabled',
            reason: 'api_not_enabled',
            message: 'Calendar API needs to be enabled in Google Cloud Console.'
          },
          { status: 503 }
        )
      }
      
      throw new Error(`Google Calendar API error: ${calendarResponse.status}`)
    }

    const eventsData = await calendarResponse.json()
    
    // Transform to simpler format
    const events = (eventsData.items || []).map((event: any) => ({
      id: event.id,
      title: event.summary || 'No title',
      start: event.start?.dateTime || event.start?.date,
      end: event.end?.dateTime || event.end?.date,
      location: event.location || null,
      description: event.description || null,
      attendees: event.attendees?.length || 0,
      meetLink: event.hangoutLink || event.conferenceData?.entryPoints?.[0]?.uri || null,
    }))

    const response = {
      connected: true,
      events,
      count: events.length,
    }

    // Cache the response
    cache.set(cacheKey, { data: response, timestamp: Date.now() })

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Calendar API error:', error)

    return NextResponse.json(
      { 
        error: 'Failed to fetch calendar events',
        message: error.message || 'Unknown error'
      },
      { status: 500 }
    )
  }
}
