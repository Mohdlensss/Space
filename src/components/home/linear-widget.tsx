'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCw, ExternalLink, AlertCircle, Circle, Play } from 'lucide-react'
import Link from 'next/link'

interface LinearIssue {
  id: string
  identifier: string
  title: string
  priority: number
  url: string
}

interface LinearData {
  connected: boolean
  total: number
  whatsNext: LinearIssue[]
  inProgress: LinearIssue[]
  error?: string
  message?: string
}

const priorityDot: Record<number, string> = {
  0: 'bg-neutral-300',
  1: 'bg-red-500',
  2: 'bg-orange-500',
  3: 'bg-yellow-500',
  4: 'bg-blue-500',
}

export function LinearWidget() {
  const [data, setData] = useState<LinearData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchLinear = useCallback(async (forceRefresh = false) => {
    if (forceRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }
    
    try {
      const url = forceRefresh 
        ? '/api/linear/issues?refresh=true' 
        : '/api/linear/issues'
      const response = await fetch(url)
      const result = await response.json()
      setData(result)
    } catch {
      setData({ connected: false, total: 0, whatsNext: [], inProgress: [], error: 'Failed to load' })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchLinear()
  }, [fetchLinear])

  const handleRefresh = () => {
    fetchLinear(true)
  }

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-11 rounded-lg bg-secondary animate-pulse" />
        ))}
      </div>
    )
  }

  if (!data?.connected || data.error) {
    return (
      <div className="py-6 text-center">
        <AlertCircle className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
        <p className="text-xs text-muted-foreground mb-3">
          {data?.message || 'Linear not configured'}
        </p>
        <Link href="/integrations">
          <Button variant="outline" size="sm" className="h-8 text-xs">
            Configure
          </Button>
        </Link>
      </div>
    )
  }

  const hasIssues = data.whatsNext.length > 0 || data.inProgress.length > 0

  if (!hasIssues) {
    return (
      <div className="py-6 text-center">
        <p className="text-xs text-muted-foreground">No active issues assigned to you</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* In Progress */}
      {data.inProgress.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Play className="w-3 h-3 text-blue-600" />
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              In Progress
            </span>
            <span className="text-[11px] text-muted-foreground">({data.inProgress.length})</span>
          </div>
          <div className="space-y-1">
            {data.inProgress.slice(0, 3).map((issue) => (
              <a
                key={issue.id}
                href={issue.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-2.5 rounded-lg hover:bg-secondary transition-colors"
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[11px] font-mono text-muted-foreground">{issue.identifier}</span>
                  {issue.priority > 0 && (
                    <div className={`w-1.5 h-1.5 rounded-full ${priorityDot[issue.priority] || 'bg-neutral-300'}`} />
                  )}
                </div>
                <p className="text-sm truncate">{issue.title}</p>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* What's Next */}
      {data.whatsNext.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Circle className="w-3 h-3 text-muted-foreground" />
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              What&apos;s Next
            </span>
            <span className="text-[11px] text-muted-foreground">({data.whatsNext.length})</span>
          </div>
          <div className="space-y-1">
            {data.whatsNext.slice(0, 3).map((issue) => (
              <a
                key={issue.id}
                href={issue.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-2.5 rounded-lg hover:bg-secondary transition-colors"
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[11px] font-mono text-muted-foreground">{issue.identifier}</span>
                  {issue.priority > 0 && (
                    <div className={`w-1.5 h-1.5 rounded-full ${priorityDot[issue.priority] || 'bg-neutral-300'}`} />
                  )}
                </div>
                <p className="text-sm truncate">{issue.title}</p>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-border">
        <span className="text-[11px] text-muted-foreground">{data.total} total assigned</span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`w-3 h-3 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? '...' : 'Refresh'}
          </Button>
          <Link href="https://linear.app" target="_blank">
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground">
              Open
              <ExternalLink className="w-3 h-3 ml-1" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
