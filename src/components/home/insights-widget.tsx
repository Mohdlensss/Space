'use client'

import { useEffect, useState } from 'react'
import { GlassCarousel, InsightCard, EmptyStateCard } from '@/components/ui/glass-carousel'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'

interface Insight {
  id: string
  type: 'health' | 'workload' | 'impact' | 'risk' | 'action'
  title: string
  insight: string
  why: string
  scope: string
  trend?: 'up' | 'down' | 'stable'
}

export function InsightsWidget() {
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchInsights() {
      try {
        const res = await fetch('/api/insights')
        const data = await res.json()
        if (data.ok) {
          // Show only top 4 insights on home
          setInsights(data.insights.slice(0, 4))
        }
      } catch (e) {
        console.error('Failed to fetch insights:', e)
      } finally {
        setLoading(false)
      }
    }
    fetchInsights()
  }, [])

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  }

  if (insights.length === 0) {
    return null
  }

  return (
    <div className="mt-8">
      <GlassCarousel 
        title="Quick Insights" 
        subtitle="Your personalized workspace intelligence"
      >
        {insights.map(insight => (
          <InsightCard
            key={insight.id}
            title={insight.title}
            insight={insight.insight}
            why={insight.why}
            scope={insight.scope}
            type={insight.type}
            trend={insight.trend}
          />
        ))}
        
        {/* View all link */}
        <Link href="/insights">
          <div className="flex-shrink-0 snap-start w-[200px] min-h-[180px] p-6 rounded-[24px] 
                          bg-gradient-to-br from-violet-500/10 to-purple-500/10 
                          backdrop-blur-xl border border-violet-200/30
                          flex items-center justify-center
                          transition-all duration-500 hover:translate-y-[-4px] hover:border-violet-300/50
                          cursor-pointer">
            <div className="text-center">
              <p className="text-sm font-medium text-violet-700 mb-1">View All</p>
              <p className="text-xs text-violet-500">See full insights →</p>
            </div>
          </div>
        </Link>
      </GlassCarousel>
    </div>
  )
}

