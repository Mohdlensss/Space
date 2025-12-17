'use client'

import { cn } from '@/lib/utils'

interface SpacingOutLoaderProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  text?: string
}

/**
 * Unified "Spacing out" loading component
 * Uses a purple outline sparkle accent, not a spinner
 */
export function SpacingOutLoader({ className, size = 'md', text = 'Spacing out' }: SpacingOutLoaderProps) {
  const sizes = {
    sm: { container: 'gap-2', icon: 'w-4 h-4', text: 'text-xs' },
    md: { container: 'gap-3', icon: 'w-5 h-5', text: 'text-sm' },
    lg: { container: 'gap-4', icon: 'w-6 h-6', text: 'text-base' },
  }

  const s = sizes[size]

  return (
    <div className={cn('flex items-center', s.container, className)}>
      {/* Purple outline sparkle - not a circle spinner */}
      <div className="relative">
        {/* Core sparkle shape */}
        <svg 
          className={cn(s.icon, 'text-violet-500')} 
          viewBox="0 0 24 24" 
          fill="none"
        >
          <path 
            d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" 
            stroke="currentColor" 
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-pulse"
          />
        </svg>
        
        {/* Outer glow ring - purple outline accent */}
        <div className="absolute inset-[-4px] rounded-full border border-violet-300/40 animate-ping" 
             style={{ animationDuration: '2s' }} />
        <div className="absolute inset-[-2px] rounded-full border border-violet-400/30 animate-pulse" 
             style={{ animationDuration: '1.5s' }} />
      </div>

      {/* Text with shimmer effect */}
      <span className={cn(
        s.text,
        'text-gray-500 italic',
        'bg-gradient-to-r from-gray-500 via-violet-400 to-gray-500 bg-clip-text',
        'animate-shimmer bg-[length:200%_100%]'
      )}>
        {text}...
      </span>
    </div>
  )
}

/**
 * Full-screen version for page loading
 */
export function SpacingOutFullScreen({ text }: { text?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <SpacingOutLoader size="lg" text={text} />
      </div>
    </div>
  )
}

/**
 * Inline version for cards/widgets
 */
export function SpacingOutInline({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center py-8', className)}>
      <SpacingOutLoader size="md" />
    </div>
  )
}

/**
 * Skeleton card with spacing out effect
 */
export function SpacingOutCard({ className }: { className?: string }) {
  return (
    <div className={cn(
      'rounded-2xl p-6',
      'bg-white/40 backdrop-blur-sm',
      'border border-gray-100',
      'animate-pulse',
      className
    )}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gray-100/80" />
        <div className="flex-1">
          <div className="h-4 bg-gray-100/80 rounded w-2/3 mb-2" />
          <div className="h-3 bg-gray-100/60 rounded w-1/2" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-gray-100/60 rounded w-full" />
        <div className="h-3 bg-gray-100/60 rounded w-4/5" />
        <div className="h-3 bg-gray-100/60 rounded w-3/5" />
      </div>
    </div>
  )
}

