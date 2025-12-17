'use client'

import { cn } from '@/lib/utils'
import { Sparkles, TrendingUp, TrendingDown, Minus, Calendar, Mail, CheckSquare, Users, AlertCircle, Target } from 'lucide-react'

// Glass Panel - Base container with white morphism
export function GlassPanel({ 
  children, 
  className,
  hover = true
}: { 
  children: React.ReactNode
  className?: string
  hover?: boolean
}) {
  return (
    <div className={cn(
      'rounded-3xl p-6',
      'bg-white/60 backdrop-blur-xl',
      'border border-white/40',
      'shadow-[0_8px_32px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.6)]',
      hover && 'transition-all duration-500 hover:translate-y-[-2px] hover:shadow-[0_16px_48px_rgba(0,0,0,0.08)]',
      className
    )}>
      {children}
    </div>
  )
}

// Stat Card - For showing metrics with trends
interface StatCardProps {
  label: string
  value: string | number
  trend?: 'up' | 'down' | 'stable'
  trendValue?: string
  icon?: 'calendar' | 'mail' | 'tasks' | 'team' | 'alert' | 'target' | 'sparkles'
  className?: string
}

const icons = {
  calendar: Calendar,
  mail: Mail,
  tasks: CheckSquare,
  team: Users,
  alert: AlertCircle,
  target: Target,
  sparkles: Sparkles
}

export function StatCard({ label, value, trend, trendValue, icon, className }: StatCardProps) {
  const Icon = icon ? icons[icon] : null
  
  return (
    <GlassPanel className={cn('min-w-[200px]', className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {trend && trendValue && (
            <div className={cn(
              'flex items-center gap-1 mt-2 text-sm font-medium',
              trend === 'up' && 'text-emerald-600',
              trend === 'down' && 'text-rose-500',
              trend === 'stable' && 'text-gray-500'
            )}>
              {trend === 'up' && <TrendingUp className="w-4 h-4" />}
              {trend === 'down' && <TrendingDown className="w-4 h-4" />}
              {trend === 'stable' && <Minus className="w-4 h-4" />}
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
            <Icon className="w-5 h-5 text-violet-600" />
          </div>
        )}
      </div>
    </GlassPanel>
  )
}

// Progress Ring - Circular progress indicator
interface ProgressRingProps {
  value: number // 0-100
  size?: number
  strokeWidth?: number
  label?: string
  sublabel?: string
  className?: string
}

export function ProgressRing({ 
  value, 
  size = 120, 
  strokeWidth = 8, 
  label,
  sublabel,
  className 
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (value / 100) * circumference

  return (
    <GlassPanel className={cn('flex flex-col items-center justify-center', className)}>
      <div className="relative" style={{ width: size, height: size }}>
        {/* Background circle */}
        <svg className="transform -rotate-90" width={size} height={size}>
          <circle
            className="text-gray-100"
            strokeWidth={strokeWidth}
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
          {/* Progress circle */}
          <circle
            className="text-violet-500 transition-all duration-1000 ease-out"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-gray-900">{value}%</span>
        </div>
      </div>
      {label && <p className="text-sm font-medium text-gray-700 mt-3">{label}</p>}
      {sublabel && <p className="text-xs text-gray-500">{sublabel}</p>}
    </GlassPanel>
  )
}

// Activity Item - For showing recent activities
interface ActivityItemProps {
  icon: React.ReactNode
  title: string
  subtitle: string
  time: string
  status?: 'success' | 'warning' | 'error' | 'neutral'
}

export function ActivityItem({ icon, title, subtitle, time, status = 'neutral' }: ActivityItemProps) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-white/40 hover:bg-white/60 transition-colors">
      <div className={cn(
        'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
        status === 'success' && 'bg-emerald-100 text-emerald-600',
        status === 'warning' && 'bg-amber-100 text-amber-600',
        status === 'error' && 'bg-rose-100 text-rose-600',
        status === 'neutral' && 'bg-gray-100 text-gray-600'
      )}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{title}</p>
        <p className="text-xs text-gray-500 truncate">{subtitle}</p>
      </div>
      <span className="text-xs text-gray-400 flex-shrink-0">{time}</span>
    </div>
  )
}

// Quick Action Button
interface QuickActionProps {
  icon: React.ReactNode
  label: string
  onClick?: () => void
  href?: string
  variant?: 'default' | 'primary' | 'ghost'
}

export function QuickAction({ icon, label, onClick, href, variant = 'default' }: QuickActionProps) {
  const Component = href ? 'a' : 'button'
  
  return (
    <Component
      href={href}
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-2 p-4 rounded-2xl transition-all duration-300',
        'hover:translate-y-[-2px]',
        variant === 'default' && 'bg-white/60 backdrop-blur-sm border border-white/40 hover:bg-white/80 hover:shadow-lg',
        variant === 'primary' && 'bg-violet-500 text-white hover:bg-violet-600 shadow-lg shadow-violet-500/20',
        variant === 'ghost' && 'hover:bg-white/40'
      )}
    >
      <div className={cn(
        'w-12 h-12 rounded-xl flex items-center justify-center',
        variant === 'primary' ? 'bg-white/20' : 'bg-violet-50'
      )}>
        {icon}
      </div>
      <span className="text-xs font-medium">{label}</span>
    </Component>
  )
}

// Notification Badge
interface NotificationBadgeProps {
  count: number
  className?: string
}

export function NotificationBadge({ count, className }: NotificationBadgeProps) {
  if (count <= 0) return null
  
  return (
    <span className={cn(
      'absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1',
      'flex items-center justify-center',
      'text-[10px] font-bold text-white',
      'bg-rose-500 rounded-full',
      'shadow-sm',
      className
    )}>
      {count > 99 ? '99+' : count}
    </span>
  )
}

// Skeleton Loader
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn(
      'rounded-3xl p-6',
      'bg-white/40 backdrop-blur-sm',
      'border border-white/30',
      'animate-pulse',
      className
    )}>
      <div className="space-y-3">
        <div className="h-4 bg-gray-200/50 rounded w-1/3" />
        <div className="h-8 bg-gray-200/50 rounded w-1/2" />
        <div className="h-3 bg-gray-200/50 rounded w-2/3" />
      </div>
    </div>
  )
}

// Floating Action Button
interface FABProps {
  icon: React.ReactNode
  onClick?: () => void
  label?: string
  className?: string
}

export function FAB({ icon, onClick, label, className }: FABProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'fixed bottom-6 right-6 z-40',
        'w-14 h-14 rounded-2xl',
        'bg-gradient-to-br from-violet-600 to-purple-600',
        'text-white shadow-xl shadow-violet-500/30',
        'flex items-center justify-center',
        'transition-all duration-300',
        'hover:scale-105 hover:shadow-2xl hover:shadow-violet-500/40',
        'active:scale-95',
        className
      )}
      title={label}
    >
      {icon}
    </button>
  )
}

