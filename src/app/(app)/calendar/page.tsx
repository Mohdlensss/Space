'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw, 
  MapPin, 
  Users, 
  Video,
  Clock,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'

interface CalendarEvent {
  id: string
  title: string
  start: string
  end: string
  allDay: boolean
  location: string | null
  attendees: { email: string; name: string; responseStatus: string }[]
  meetLink: string | null
}

interface CalendarData {
  connected: boolean
  events: CalendarEvent[]
  eventsByDate: Record<string, CalendarEvent[]>
  weekStart: string
  weekEnd: string
  count: number
  error?: string
  message?: string
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const FULL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function CalendarPage() {
  const [data, setData] = useState<CalendarData | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentWeekStart, setCurrentWeekStart] = useState(getMonday(new Date()))
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  useEffect(() => {
    fetchCalendar()
  }, [currentWeekStart])

  const fetchCalendar = async () => {
    setLoading(true)
    try {
      const weekEnd = new Date(currentWeekStart)
      weekEnd.setDate(weekEnd.getDate() + 7)
      
      const response = await fetch(
        `/api/google/calendar/week?start=${currentWeekStart.toISOString()}&end=${weekEnd.toISOString()}`
      )
      const result = await response.json()
      setData(result)
      
      // Auto-select today if in current week
      const today = new Date().toISOString().split('T')[0]
      if (!selectedDate && result.eventsByDate?.[today]) {
        setSelectedDate(today)
      }
    } catch {
      setData({ connected: false, events: [], eventsByDate: {}, weekStart: '', weekEnd: '', count: 0, error: 'Failed to load' })
    } finally {
      setLoading(false)
    }
  }

  const prevWeek = () => {
    const prev = new Date(currentWeekStart)
    prev.setDate(prev.getDate() - 7)
    setCurrentWeekStart(prev)
    setSelectedDate(null)
  }

  const nextWeek = () => {
    const next = new Date(currentWeekStart)
    next.setDate(next.getDate() + 7)
    setCurrentWeekStart(next)
    setSelectedDate(null)
  }

  const goToToday = () => {
    setCurrentWeekStart(getMonday(new Date()))
    setSelectedDate(new Date().toISOString().split('T')[0])
  }

  const formatTime = (dateString: string) => {
    if (!dateString.includes('T')) return 'All day'
    return new Date(dateString).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  const formatDateHeader = () => {
    const end = new Date(currentWeekStart)
    end.setDate(end.getDate() + 6)
    const startMonth = currentWeekStart.toLocaleDateString('en-US', { month: 'short' })
    const endMonth = end.toLocaleDateString('en-US', { month: 'short' })
    const year = currentWeekStart.getFullYear()
    
    if (startMonth === endMonth) {
      return `${startMonth} ${currentWeekStart.getDate()} - ${end.getDate()}, ${year}`
    }
    return `${startMonth} ${currentWeekStart.getDate()} - ${endMonth} ${end.getDate()}, ${year}`
  }

  const getWeekDates = () => {
    const dates = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart)
      date.setDate(date.getDate() + i)
      dates.push(date)
    }
    return dates
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const weekDates = getWeekDates()

  if (!data?.connected && !loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto animate-fade-in">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold mb-1">Calendar</h1>
          <p className="text-sm text-muted-foreground">Your schedule and meetings</p>
        </div>
        
        <Card className="card-elevated rounded-xl">
          <CardContent className="p-12 text-center">
            <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <h2 className="text-lg font-semibold mb-2">Calendar Not Connected</h2>
            <p className="text-sm text-muted-foreground mb-4">
              {data?.message || 'Connect your Google account to view your calendar'}
            </p>
            <Link href="/integrations">
              <Button>Connect Google Calendar</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Calendar</h1>
          <p className="text-sm text-muted-foreground">Your schedule and meetings</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
          <div className="flex items-center">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={prevWeek}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={nextWeek}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <span className="text-sm font-medium min-w-[180px] text-center">{formatDateHeader()}</span>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={fetchCalendar}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Week Grid */}
        <Card className="card-elevated rounded-xl lg:col-span-3">
          <CardContent className="p-4">
            {/* Days Header */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDates.map((date, i) => {
                const dateKey = date.toISOString().split('T')[0]
                const eventsForDate = data?.eventsByDate?.[dateKey]
                const hasEvents = eventsForDate && eventsForDate.length > 0
                const isSelected = selectedDate === dateKey
                const todayClass = isToday(date)
                
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDate(dateKey)}
                    className={`
                      p-3 rounded-lg text-center transition-all
                      ${isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'}
                      ${todayClass && !isSelected ? 'ring-1 ring-primary' : ''}
                    `}
                  >
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      {DAYS[i]}
                    </p>
                    <p className={`text-lg font-semibold ${isSelected ? '' : ''}`}>
                      {date.getDate()}
                    </p>
                    {hasEvents && !isSelected && (
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mx-auto mt-1" />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Events List */}
            {loading ? (
              <div className="space-y-2 mt-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 rounded-lg bg-secondary animate-pulse" />
                ))}
              </div>
            ) : selectedDate && data?.eventsByDate?.[selectedDate] ? (
              <div className="mt-4 space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </h3>
                {data.eventsByDate[selectedDate].map(event => (
                  <div
                    key={event.id}
                    className="p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="min-w-[60px] text-xs text-muted-foreground pt-0.5">
                        {formatTime(event.start)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{event.title}</p>
                        {event.location && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate">{event.location}</span>
                          </div>
                        )}
                        {event.attendees.length > 0 && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                            <Users className="w-3 h-3" />
                            <span>{event.attendees.length} attendees</span>
                          </div>
                        )}
                      </div>
                      {event.meetLink && (
                        <a
                          href={event.meetLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0"
                        >
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                            <Video className="w-3 h-3 mr-1" />
                            Join
                          </Button>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 py-8 text-center text-sm text-muted-foreground">
                {selectedDate ? 'No events on this day' : 'Select a day to view events'}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sidebar - Upcoming (only future events) */}
        <div className="space-y-4">
          <Card className="card-elevated rounded-xl">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Upcoming
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-12 rounded-lg bg-secondary animate-pulse" />
                  ))}
                </div>
              ) : (() => {
                // Filter to only show events from NOW onwards
                const now = new Date()
                const upcomingEvents = (data?.events || []).filter(event => {
                  const eventStart = new Date(event.start)
                  // For all-day events, check if the date is today or later
                  if (event.allDay) {
                    const eventDate = event.start.split('T')[0]
                    const todayDate = now.toISOString().split('T')[0]
                    return eventDate >= todayDate
                  }
                  // For timed events, check if start time is after now
                  return eventStart >= now
                })
                
                return upcomingEvents.length > 0 ? (
                  <div className="space-y-2">
                    {upcomingEvents.slice(0, 5).map(event => (
                      <div key={event.id} className="p-2 rounded-lg hover:bg-secondary transition-colors">
                        <p className="text-sm font-medium truncate">{event.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(event.start).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          {' · '}
                          {formatTime(event.start)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    No upcoming events
                  </p>
                )
              })()}
            </CardContent>
          </Card>

          <Card className="card-elevated rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">This week</span>
                <span className="text-lg font-semibold">{data?.count || 0}</span>
              </div>
              <p className="text-xs text-muted-foreground">events scheduled</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function getMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}
