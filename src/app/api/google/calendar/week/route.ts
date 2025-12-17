import { NextResponse } from 'next/server'
import { getGoogleTokens } from '@/lib/google/tokens'
import { getCurrentUser } from '@/lib/auth'

// Cache for 2 minutes
const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 120 * 1000

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get date range from query params
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('start')
    const endDate = searchParams.get('end')

    // Default to current week
    const now = new Date()
    const weekStart = startDate ? new Date(startDate) : getStartOfWeek(now)
    const weekEnd = endDate ? new Date(endDate) : getEndOfWeek(now)

    const cacheKey = `calendar-week-${user.id}-${weekStart.toISOString()}`
    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data)
    }

    const tokens = await getGoogleTokens(user.id)
    
    if (!tokens) {
      return NextResponse.json(
        { connected: false, error: 'Google not connected', message: 'Please reconnect your Google account.' },
        { status: 401 }
      )
    }

    // Fetch calendar events
    const params = new URLSearchParams({
      timeMin: weekStart.toISOString(),
      timeMax: weekEnd.toISOString(),
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: '100',
    })

    const eventsResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
      {
        headers: { 'Authorization': `Bearer ${tokens.accessToken}` },
        cache: 'no-store'
      }
    )

    if (!eventsResponse.ok) {
      const errorText = await eventsResponse.text()
      console.error('[Calendar API] Error:', eventsResponse.status, errorText)
      
      if (eventsResponse.status === 401) {
        return NextResponse.json(
          { connected: false, error: 'Token expired', message: 'Please reconnect Google.' },
          { status: 401 }
        )
      }
      
      if (eventsResponse.status === 403) {
        return NextResponse.json(
          { connected: false, error: 'API not enabled', message: 'Enable Calendar API in Google Cloud Console.' },
          { status: 503 }
        )
      }
      
      throw new Error(`Calendar API error: ${eventsResponse.status}`)
    }

    const eventsData = await eventsResponse.json()
    
    const events = (eventsData.items || []).map((event: any) => ({
      id: event.id,
      title: event.summary || 'No title',
      start: event.start?.dateTime || event.start?.date,
      end: event.end?.dateTime || event.end?.date,
      allDay: !event.start?.dateTime,
      location: event.location || null,
      description: event.description || null,
      attendees: (event.attendees || []).map((a: any) => ({
        email: a.email,
        name: a.displayName || a.email,
        responseStatus: a.responseStatus,
      })),
      organizer: event.organizer?.email || null,
      meetLink: event.hangoutLink || null,
      color: event.colorId || null,
    }))

    // Group events by date
    const eventsByDate: Record<string, typeof events> = {}
    events.forEach((event: any) => {
      const dateKey = event.start.split('T')[0]
      if (!eventsByDate[dateKey]) {
        eventsByDate[dateKey] = []
      }
      eventsByDate[dateKey].push(event)
    })

    const response = {
      connected: true,
      events,
      eventsByDate,
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
      count: events.length,
    }

    cache.set(cacheKey, { data: response, timestamp: Date.now() })

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Calendar week API error:', error)

    return NextResponse.json(
      { connected: false, error: 'Failed to fetch calendar', message: error.message },
      { status: 500 }
    )
  }
}

function getStartOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Monday start
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function getEndOfWeek(date: Date): Date {
  const d = getStartOfWeek(date)
  d.setDate(d.getDate() + 7)
  d.setHours(23, 59, 59, 999)
  return d
}
