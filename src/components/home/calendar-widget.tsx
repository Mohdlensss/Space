'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Calendar, MapPin, RefreshCw, AlertCircle, Clock } from 'lucide-react'
import Link from 'next/link'

interface CalendarEvent {
  id: string
  title: string
  start: string
  end: string
  location?: string | null
  attendees?: number
}

interface CalendarData {
  connected: boolean
  events: CalendarEvent[]
  count: number
  error?: string
  message?: string
}

export function CalendarWidget() {
  const [data, setData] = useState<CalendarData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchCalendar = useCallback(async (forceRefresh = false) => {
    if (forceRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }
    
    try {
      const url = forceRefresh 
        ? '/api/google/calendar/today?refresh=true' 
        : '/api/google/calendar/today'
      const response = await fetch(url)
      const result = await response.json()
      setData(result)
    } catch {
      setData({ connected: false, events: [], count: 0, error: 'Failed to load' })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchCalendar()
  }, [fetchCalendar])

  const handleRefresh = () => {
    fetchCalendar(true)
  }

  const formatTime = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })
    } catch {
      return ''
    }
  }

  const formatTimeRange = (start: string, end: string) => {
    const startTime = formatTime(start)
    const endTime = formatTime(end)
    return `${startTime} – ${endTime}`
  }

  if (loading) {
    return (
      <div className="neu-flat p-6 rounded-2xl">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Today</h3>
        </div>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-secondary animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!data?.connected || data.error) {
    return (
      <div className="neu-flat p-6 rounded-2xl">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Today</h3>
        </div>
        <div className="py-8 text-center">
          <AlertCircle className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground mb-4">
            {data?.message || 'Calendar not connected'}
          </p>
          <Link href="/integrations">
            <Button size="sm" className="rounded-xl">
              Connect
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="neu-flat p-6 rounded-2xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Today</h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>
      
      {data.events.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-sm text-muted-foreground">No events today</p>
        </div>
      ) : (
        <div className="space-y-2">
          {data.events.slice(0, 4).map((event) => (
            <div
              key={event.id}
              className="p-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
            >
              <p className="text-sm font-medium text-foreground truncate mb-1">{event.title}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                <span>{formatTimeRange(event.start, event.end)}</span>
              </div>
              {event.location && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="truncate">{event.location}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
