'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Mail, RefreshCw, AlertCircle, AlertTriangle, Star, Sparkles, ArrowRight } from 'lucide-react'
import Link from 'next/link'

type EmailPriority = 'critical' | 'important' | 'normal' | 'low'

interface ClassifiedEmail {
  id: string
  subject: string
  from: string
  snippet: string
  date: string
  priority: EmailPriority
  category: string
  priorityReason: string
}

interface EmailData {
  connected: boolean
  emails: ClassifiedEmail[]
  stats: { critical: number; important: number; normal: number; low: number; total: number }
  aiPowered: boolean
  error?: string
  message?: string
}

const PRIORITY_ICONS = {
  critical: AlertTriangle,
  important: Star,
  normal: Mail,
  low: Mail,
}

const PRIORITY_COLORS = {
  critical: 'text-red-500',
  important: 'text-amber-500',
  normal: 'text-muted-foreground',
  low: 'text-muted-foreground/50',
}

export function GmailWidget() {
  const [data, setData] = useState<EmailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchGmail = useCallback(async (forceRefresh = false) => {
    if (forceRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }
    
    try {
      const url = forceRefresh 
        ? '/api/google/gmail/smart?refresh=true' 
        : '/api/google/gmail/smart'
      const response = await fetch(url)
      const result = await response.json()
      setData(result)
    } catch {
      setData({ 
        connected: false, 
        emails: [], 
        stats: { critical: 0, important: 0, normal: 0, low: 0, total: 0 }, 
        aiPowered: false, 
        error: 'Failed to load' 
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchGmail()
  }, [fetchGmail])

  const handleRefresh = () => {
    fetchGmail(true)
  }

  const formatSender = (from: string) => {
    const match = from.match(/^(.+?)\s*</)
    if (match) return match[1].replace(/"/g, '').trim()
    return from.split('@')[0]
  }

  if (loading) {
    return (
      <div className="neu-flat p-6 rounded-2xl">
        <div className="flex items-center gap-2 mb-4">
          <Mail className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Inbox</h3>
        </div>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-14 rounded-xl bg-secondary animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!data?.connected || data.error) {
    return (
      <div className="neu-flat p-6 rounded-2xl">
        <div className="flex items-center gap-2 mb-4">
          <Mail className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Inbox</h3>
        </div>
        <div className="py-8 text-center">
          <AlertCircle className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground mb-4">
            {data?.message || 'Gmail not connected'}
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

  // Show critical + important first, then normal (skip low priority in widget)
  const priorityEmails = [
    ...data.emails.filter(e => e.priority === 'critical'),
    ...data.emails.filter(e => e.priority === 'important'),
  ].slice(0, 4)
  
  const displayEmails = priorityEmails.length > 0 
    ? priorityEmails 
    : data.emails.filter(e => e.priority !== 'low').slice(0, 3)

  return (
    <div className="neu-flat p-6 rounded-2xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Mail className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Inbox</h3>
          {data.aiPowered && (
            <Sparkles className="w-4 h-4 text-amber-500" />
          )}
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

      {/* Priority Alert */}
      {data.stats.critical > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 mb-4">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          <span className="text-xs font-medium text-red-700">
            {data.stats.critical} critical email{data.stats.critical > 1 ? 's' : ''}
          </span>
        </div>
      )}

      {displayEmails.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-sm text-muted-foreground">
            {data.stats.low > 0 
              ? `${data.stats.low} low priority emails filtered`
              : 'No messages'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {displayEmails.map((email) => {
            const Icon = PRIORITY_ICONS[email.priority]
            const colorClass = PRIORITY_COLORS[email.priority]
            
            return (
              <div
                key={email.id}
                className={`p-3 rounded-xl transition-colors cursor-pointer ${
                  email.priority === 'critical' 
                    ? 'bg-red-50 hover:bg-red-100' 
                    : 'bg-secondary hover:bg-secondary/80'
                }`}
              >
                <div className="flex items-start gap-2">
                  <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${colorClass}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-xs font-medium text-muted-foreground truncate">
                        {formatSender(email.from)}
                      </p>
                      {email.category && email.priority !== 'normal' && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                          email.priority === 'critical' 
                            ? 'bg-red-100 text-red-700' 
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {email.category}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-foreground truncate">{email.subject || '(No subject)'}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Stats summary */}
      {data.stats.low > 0 && (
        <p className="text-[10px] text-muted-foreground text-center mt-3">
          {data.stats.low} promotional/low priority hidden
        </p>
      )}

      {/* View All Link */}
      <Link 
        href="/email" 
        className="flex items-center justify-center gap-1 text-sm font-medium text-primary mt-4 pt-4 border-t border-border hover:underline"
      >
        View all emails
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  )
}
