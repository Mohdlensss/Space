'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Mail, 
  RefreshCw, 
  AlertCircle, 
  Sparkles, 
  AlertTriangle,
  Star,
  Inbox,
  Archive,
  Filter
} from 'lucide-react'
import Link from 'next/link'

type EmailPriority = 'critical' | 'important' | 'normal' | 'low' | 'filtered'
type FilterablePriority = 'critical' | 'important' | 'normal' | 'low'

interface ClassifiedEmail {
  id: string
  subject: string
  from: string
  snippet: string
  date: string
  threadId: string
  priority: EmailPriority
  priorityReason: string
  category: string
}

interface EmailStats {
  total: number
  critical: number
  important: number
  normal: number
  low: number
  filtered: number
}

interface EmailData {
  connected: boolean
  emails: ClassifiedEmail[]
  grouped: {
    critical: ClassifiedEmail[]
    important: ClassifiedEmail[]
    normal: ClassifiedEmail[]
    low: ClassifiedEmail[]
  }
  stats: EmailStats
  aiPowered: boolean
  error?: string
  message?: string
}

const PRIORITY_CONFIG: Record<EmailPriority, { label: string; icon: typeof AlertTriangle; color: string; bg: string }> = {
  critical: {
    label: 'Critical',
    icon: AlertTriangle,
    color: 'text-red-500',
    bg: 'bg-red-50',
  },
  important: {
    label: 'Important',
    icon: Star,
    color: 'text-amber-500',
    bg: 'bg-amber-50',
  },
  normal: {
    label: 'Normal',
    icon: Inbox,
    color: 'text-blue-500',
    bg: 'bg-blue-50',
  },
  low: {
    label: 'Low Priority',
    icon: Archive,
    color: 'text-gray-400',
    bg: 'bg-gray-50',
  },
  filtered: {
    label: 'Filtered',
    icon: Filter,
    color: 'text-gray-400',
    bg: 'bg-gray-50',
  },
}

export default function EmailPage() {
  const [data, setData] = useState<EmailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeFilter, setActiveFilter] = useState<EmailPriority | 'all'>('all')

  const fetchEmails = useCallback(async (forceRefresh = false) => {
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
        grouped: { critical: [], important: [], normal: [], low: [] },
        stats: { total: 0, critical: 0, important: 0, normal: 0, low: 0, filtered: 0 },
        aiPowered: false,
        error: 'Failed to load' 
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchEmails()
  }, [fetchEmails])

  const handleRefresh = () => {
    fetchEmails(true)
  }

  const formatSender = (from: string) => {
    const match = from.match(/^(.+?)\s*</)
    if (match) return match[1].replace(/"/g, '').trim()
    return from.split('@')[0]
  }

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      const now = new Date()
      const diff = now.getTime() - date.getTime()
      
      if (diff < 60 * 60 * 1000) {
        return `${Math.floor(diff / 60000)}m ago`
      }
      if (diff < 24 * 60 * 60 * 1000) {
        return `${Math.floor(diff / 3600000)}h ago`
      }
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    } catch {
      return ''
    }
  }

  const getFilteredEmails = () => {
    if (activeFilter === 'all') return data?.emails || []
    if (activeFilter === 'filtered') return []
    return data?.grouped?.[activeFilter] || []
  }
  const filteredEmails = getFilteredEmails()

  if (!data?.connected && !loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto animate-fade-in">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">Email</h1>
          <p className="text-muted-foreground">AI-powered email intelligence</p>
        </div>
        
        <div className="neu-flat p-12 rounded-2xl text-center">
          <AlertCircle className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Gmail Not Connected</h2>
          <p className="text-muted-foreground mb-6">
            {data?.message || 'Connect your Google account to enable smart email filtering'}
          </p>
          <Link href="/integrations">
            <Button size="lg" className="rounded-xl">Connect Gmail</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-foreground">Email</h1>
            {data?.aiPowered && (
              <Badge variant="secondary" className="text-xs gap-1 rounded-full">
                <Sparkles className="w-3 h-3" />
                AI Powered
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">
            Intelligent email classification and filtering
          </p>
        </div>
        
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading || refreshing} className="rounded-xl">
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* Stats Cards */}
      {data?.stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="neu-flat p-4 rounded-xl cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveFilter('critical')}>
            <div className="flex items-center justify-between">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <span className="text-2xl font-bold text-foreground">{data.stats.critical}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Critical</p>
          </div>
          
          <div className="neu-flat p-4 rounded-xl cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveFilter('important')}>
            <div className="flex items-center justify-between">
              <Star className="w-5 h-5 text-amber-500" />
              <span className="text-2xl font-bold text-foreground">{data.stats.important}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Important</p>
          </div>
          
          <div className="neu-flat p-4 rounded-xl cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveFilter('normal')}>
            <div className="flex items-center justify-between">
              <Inbox className="w-5 h-5 text-blue-500" />
              <span className="text-2xl font-bold text-foreground">{data.stats.normal}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Normal</p>
          </div>
          
          <div className="neu-flat p-4 rounded-xl cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveFilter('low')}>
            <div className="flex items-center justify-between">
              <Archive className="w-5 h-5 text-gray-400" />
              <span className="text-2xl font-bold text-foreground">{data.stats.low}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Low Priority</p>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        <Button
          variant={activeFilter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveFilter('all')}
          className="rounded-xl"
        >
          All ({data?.emails?.length || 0})
        </Button>
        {(['critical', 'important', 'normal', 'low'] as FilterablePriority[]).map(priority => {
          const config = PRIORITY_CONFIG[priority]
          const count = data?.grouped?.[priority]?.length || 0
          
          return (
            <Button
              key={priority}
              variant={activeFilter === priority ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveFilter(priority)}
              className="gap-1.5 rounded-xl"
            >
              <config.icon className="w-3.5 h-3.5" />
              {config.label} ({count})
            </Button>
          )
        })}
      </div>

      {/* Email List */}
      <div className="neu-flat rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-20 rounded-xl bg-secondary animate-pulse" />
            ))}
          </div>
        ) : filteredEmails.length === 0 ? (
          <div className="p-12 text-center">
            <Mail className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {activeFilter === 'all' ? 'No emails found' : `No ${PRIORITY_CONFIG[activeFilter]?.label.toLowerCase()} emails`}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredEmails.map(email => {
              const config = PRIORITY_CONFIG[email.priority]
              
              return (
                <div
                  key={email.id}
                  className={`p-4 hover:bg-secondary/50 transition-colors cursor-pointer ${
                    email.priority === 'critical' ? 'bg-red-50/50' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`shrink-0 w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center`}>
                      <config.icon className={`w-5 h-5 ${config.color}`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-foreground truncate">
                          {formatSender(email.from)}
                        </span>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {formatDate(email.date)}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-foreground truncate mb-1">{email.subject}</p>
                      <p className="text-xs text-muted-foreground truncate">{email.snippet}</p>
                      
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-[10px] rounded-full">
                          {email.category}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {email.priorityReason}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* AI Note */}
      {(data?.stats?.filtered ?? 0) > 0 && (
        <div className="neu-flat p-4 rounded-2xl mt-6">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              <strong>{data?.stats?.filtered ?? 0}</strong> emails filtered out (spam/promotional)
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
