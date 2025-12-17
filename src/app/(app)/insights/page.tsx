'use client'

import { useEffect, useState } from 'react'
import { GlassCarousel, InsightCard, RoleBadge, EmptyStateCard } from '@/components/ui/glass-carousel'
import { Loader2, RefreshCw, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface Insight {
  id: string
  type: 'health' | 'workload' | 'impact' | 'risk' | 'action'
  title: string
  insight: string
  why: string
  scope: string
  trend?: 'up' | 'down' | 'stable'
  department?: string
}

interface InsightsData {
  ok: boolean
  insights: Insight[]
  user: {
    name: string
    role: string
    department: string
    isCoFounder: boolean
    isLeadership: boolean
  }
  permissions: {
    scopes: string[]
    canSeeOrgAggregates: boolean
    canSeeDepartmentAggregates: boolean
  }
  error?: string
}

export default function InsightsPage() {
  const [data, setData] = useState<InsightsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchInsights = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/insights')
      const result = await response.json()
      
      if (!result.ok) {
        setError(result.error || 'Failed to load insights')
      } else {
        setData(result)
      }
    } catch (e: any) {
      setError(e.message || 'Failed to connect')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInsights()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F6F7F9] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#F6F7F9] flex items-center justify-center p-8">
        <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-white/40 shadow-lg p-8 max-w-md text-center">
          <p className="text-gray-600 mb-4">{error || 'Unable to load insights'}</p>
          <Button onClick={fetchInsights} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  const { insights, user, permissions } = data

  // Group insights by type
  const healthInsights = insights.filter(i => i.type === 'health')
  const workloadInsights = insights.filter(i => i.type === 'workload')
  const impactInsights = insights.filter(i => i.type === 'impact')
  const riskInsights = insights.filter(i => i.type === 'risk')
  const actionInsights = insights.filter(i => i.type === 'action')

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  }

  return (
    <div className="min-h-screen bg-[#F6F7F9]">
      {/* Subtle gradient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-violet-200/20 to-transparent blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-blue-200/20 to-transparent blur-3xl" />
      </div>

      <div className="relative z-10 p-6 lg:p-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-10">
          <div className="flex items-center gap-4">
            <Avatar className="w-14 h-14 ring-2 ring-white shadow-lg">
              <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white text-lg font-semibold">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-3">
                {user.name}
                <RoleBadge 
                  role={user.role} 
                  isCoFounder={user.isCoFounder} 
                  isLeadership={user.isLeadership} 
                />
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {user.role} • {user.department || 'DOO'}
              </p>
            </div>
          </div>
          
          <Button 
            onClick={fetchInsights} 
            variant="ghost" 
            size="icon" 
            className="rounded-full hover:bg-white/50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Scope indicator */}
        <div className="mb-8 flex items-center gap-2 text-sm text-gray-500">
          <Sparkles className="w-4 h-4 text-violet-500" />
          <span>
            Showing insights for: <span className="font-medium text-gray-700">{permissions.scopes.join(', ')}</span>
          </span>
        </div>

        {/* Insights Carousels */}
        <div className="space-y-10">
          {/* Team Health */}
          {healthInsights.length > 0 && (
            <GlassCarousel title="Team Health" subtitle="Morale and engagement trends">
              {healthInsights.map(insight => (
                <InsightCard
                  key={insight.id}
                  title={insight.title}
                  insight={insight.insight}
                  why={insight.why}
                  scope={insight.scope}
                  type="health"
                  trend={insight.trend}
                />
              ))}
            </GlassCarousel>
          )}

          {/* Workload Balance */}
          {workloadInsights.length > 0 && (
            <GlassCarousel title="Workload Balance" subtitle="Capacity and focus indicators">
              {workloadInsights.map(insight => (
                <InsightCard
                  key={insight.id}
                  title={insight.title}
                  insight={insight.insight}
                  why={insight.why}
                  scope={insight.scope}
                  type="workload"
                  trend={insight.trend}
                />
              ))}
            </GlassCarousel>
          )}

          {/* Impact Snapshots */}
          {impactInsights.length > 0 && (
            <GlassCarousel title="Impact Snapshots" subtitle="Positive contributions this week">
              {impactInsights.map(insight => (
                <InsightCard
                  key={insight.id}
                  title={insight.title}
                  insight={insight.insight}
                  why={insight.why}
                  scope={insight.scope}
                  type="impact"
                  trend={insight.trend}
                />
              ))}
            </GlassCarousel>
          )}

          {/* Risks & Blockers */}
          {riskInsights.length > 0 && (
            <GlassCarousel title="Risks & Blockers" subtitle="Systemic issues requiring attention">
              {riskInsights.map(insight => (
                <InsightCard
                  key={insight.id}
                  title={insight.title}
                  insight={insight.insight}
                  why={insight.why}
                  scope={insight.scope}
                  type="risk"
                  trend={insight.trend}
                />
              ))}
            </GlassCarousel>
          )}

          {/* Recommended Actions */}
          {actionInsights.length > 0 && (
            <GlassCarousel title="Recommended Actions" subtitle="Leadership actions to consider">
              {actionInsights.map(insight => (
                <InsightCard
                  key={insight.id}
                  title={insight.title}
                  insight={insight.insight}
                  why={insight.why}
                  scope={insight.scope}
                  type="action"
                />
              ))}
            </GlassCarousel>
          )}

          {/* Empty state if no insights */}
          {insights.length === 0 && (
            <div className="flex items-center justify-center py-20">
              <EmptyStateCard
                title="No insights available"
                message="Check back later for organizational insights"
              />
            </div>
          )}
        </div>

        {/* Footer - Scope explanation */}
        <div className="mt-16 pt-8 border-t border-gray-200/50">
          <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/30 p-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">About these insights</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Insights are generated from authorized signals: DOO Chat activity (based on your channel memberships), 
              Linear tasks, and calendar patterns. Personal data remains private. Leadership sees aggregated trends only, 
              never individual private content. All insights include "Why" (signals used) and "Scope" (who can see this).
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

