'use client'

import { useRef, useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface GlassCarouselProps {
  children: React.ReactNode
  className?: string
  title?: string
  subtitle?: string
}

export function GlassCarousel({ children, className, title, subtitle }: GlassCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
    }
  }

  useEffect(() => {
    checkScroll()
    window.addEventListener('resize', checkScroll)
    return () => window.removeEventListener('resize', checkScroll)
  }, [])

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.7
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  return (
    <div className={cn('relative', className)}>
      {/* Header */}
      {(title || subtitle) && (
        <div className="mb-6 px-1">
          {title && <h2 className="text-xl font-semibold text-foreground">{title}</h2>}
          {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
        </div>
      )}

      {/* Navigation Buttons */}
      {canScrollLeft && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full
                     bg-white/80 backdrop-blur-lg shadow-lg border border-white/30
                     flex items-center justify-center
                     transition-all duration-300 hover:scale-110 hover:bg-white
                     -ml-5"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
      )}
      {canScrollRight && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full
                     bg-white/80 backdrop-blur-lg shadow-lg border border-white/30
                     flex items-center justify-center
                     transition-all duration-300 hover:scale-110 hover:bg-white
                     -mr-5"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      )}

      {/* Scrollable Container */}
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex gap-5 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory pb-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {children}
      </div>
    </div>
  )
}

interface GlassCardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

export function GlassCard({ children, className, onClick }: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        // Base glass card
        'relative flex-shrink-0 snap-start',
        'w-[320px] min-h-[180px] p-6',
        'rounded-[24px]',
        // Glass effect - white morphism
        'bg-white/60 backdrop-blur-xl',
        'border border-white/40',
        // Subtle inner glow
        'shadow-[0_8px_32px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.6)]',
        // Hover state - gentle lift
        'transition-all duration-500 ease-out',
        'hover:translate-y-[-4px] hover:shadow-[0_16px_48px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.8)]',
        'hover:bg-white/70',
        // Cursor
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  )
}

interface InsightCardProps {
  title: string
  insight: string
  why: string
  scope: string
  type?: 'health' | 'workload' | 'impact' | 'risk' | 'action'
  trend?: 'up' | 'down' | 'stable'
  className?: string
}

const typeStyles = {
  health: 'from-emerald-500/10 to-teal-500/10 border-emerald-500/20',
  workload: 'from-blue-500/10 to-cyan-500/10 border-blue-500/20',
  impact: 'from-violet-500/10 to-purple-500/10 border-violet-500/20',
  risk: 'from-amber-500/10 to-orange-500/10 border-amber-500/20',
  action: 'from-rose-500/10 to-pink-500/10 border-rose-500/20',
}

const trendIcons = {
  up: '↑',
  down: '↓',
  stable: '→',
}

const trendColors = {
  up: 'text-emerald-600',
  down: 'text-rose-500',
  stable: 'text-gray-500',
}

export function InsightCard({ title, insight, why, scope, type = 'health', trend, className }: InsightCardProps) {
  return (
    <GlassCard className={cn('bg-gradient-to-br', typeStyles[type], className)}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{title}</span>
          {trend && (
            <span className={cn('text-lg font-semibold', trendColors[trend])}>
              {trendIcons[trend]}
            </span>
          )}
        </div>

        {/* Primary Insight */}
        <p className="text-base font-medium text-gray-800 leading-relaxed flex-1">
          {insight}
        </p>

        {/* Why - Signal Summary */}
        <div className="mt-4 pt-3 border-t border-gray-200/50">
          <p className="text-xs text-gray-500 leading-relaxed">
            <span className="font-medium">Why:</span> {why}
          </p>
        </div>

        {/* Scope Badge */}
        <div className="mt-3 flex justify-end">
          <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-gray-100/80 text-gray-500 uppercase tracking-wider">
            {scope}
          </span>
        </div>
      </div>
    </GlassCard>
  )
}

interface RoleBadgeProps {
  role: string
  isCoFounder?: boolean
  isLeadership?: boolean
  className?: string
}

export function RoleBadge({ role, isCoFounder, isLeadership, className }: RoleBadgeProps) {
  if (isCoFounder) {
    return (
      <span className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold',
        'bg-gradient-to-r from-amber-100 via-yellow-100 to-amber-100',
        'text-amber-800 border border-amber-200/60',
        'shadow-[0_2px_8px_rgba(251,191,36,0.15),inset_0_1px_0_rgba(255,255,255,0.8)]',
        className
      )}>
        <span className="text-amber-500">✦</span>
        Co-Founder
      </span>
    )
  }

  if (isLeadership) {
    return (
      <span className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold',
        'bg-gradient-to-r from-violet-100 via-purple-100 to-violet-100',
        'text-violet-800 border border-violet-200/60',
        'shadow-[0_2px_8px_rgba(139,92,246,0.15),inset_0_1px_0_rgba(255,255,255,0.8)]',
        className
      )}>
        <span className="text-violet-500">◆</span>
        Leadership
      </span>
    )
  }

  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
      'bg-gray-100 text-gray-700 border border-gray-200/60',
      className
    )}>
      {role}
    </span>
  )
}

interface EmptyStateCardProps {
  title: string
  message: string
  className?: string
}

export function EmptyStateCard({ title, message, className }: EmptyStateCardProps) {
  return (
    <GlassCard className={cn('flex items-center justify-center', className)}>
      <div className="text-center">
        <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
        <p className="text-xs text-gray-400">{message}</p>
      </div>
    </GlassCard>
  )
}

