'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Calendar, Mail, CheckSquare, Users, Zap, TrendingUp, AlertCircle, Lightbulb } from 'lucide-react'

interface ResponseBubbleProps {
  type: 'insight' | 'task' | 'event' | 'email' | 'action' | 'metric' | 'warning' | 'tip'
  title: string
  content: string
  index: number
  total: number
}

const iconMap = {
  insight: Lightbulb,
  task: CheckSquare,
  event: Calendar,
  email: Mail,
  action: Zap,
  metric: TrendingUp,
  warning: AlertCircle,
  tip: Users,
}

const colorMap = {
  insight: 'from-violet-500/20 to-purple-500/20 border-violet-300/50',
  task: 'from-blue-500/20 to-cyan-500/20 border-blue-300/50',
  event: 'from-emerald-500/20 to-teal-500/20 border-emerald-300/50',
  email: 'from-orange-500/20 to-amber-500/20 border-orange-300/50',
  action: 'from-pink-500/20 to-rose-500/20 border-pink-300/50',
  metric: 'from-green-500/20 to-lime-500/20 border-green-300/50',
  warning: 'from-red-500/20 to-orange-500/20 border-red-300/50',
  tip: 'from-indigo-500/20 to-blue-500/20 border-indigo-300/50',
}

const iconColorMap = {
  insight: 'text-violet-600',
  task: 'text-blue-600',
  event: 'text-emerald-600',
  email: 'text-orange-600',
  action: 'text-pink-600',
  metric: 'text-green-600',
  warning: 'text-red-600',
  tip: 'text-indigo-600',
}

export function ResponseBubble({ type, title, content, index, total }: ResponseBubbleProps) {
  const Icon = iconMap[type]
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ 
        duration: 0.5, 
        delay: index * 0.15,
        type: 'spring',
        stiffness: 200,
        damping: 20
      }}
      className={cn(
        'relative p-4 rounded-2xl',
        'bg-gradient-to-br backdrop-blur-xl',
        'border shadow-lg',
        'hover:scale-[1.02] transition-transform duration-300',
        'cursor-default',
        colorMap[type]
      )}
    >
      {/* Glow effect */}
      <div className="absolute inset-0 rounded-2xl bg-white/40 blur-xl -z-10" />
      
      {/* Icon */}
      <div className={cn(
        'w-8 h-8 rounded-xl flex items-center justify-center mb-3',
        'bg-white/60 backdrop-blur-sm',
        iconColorMap[type]
      )}>
        <Icon className="w-4 h-4" />
      </div>
      
      {/* Title */}
      <h4 className="text-sm font-semibold text-gray-800 mb-1 line-clamp-1">
        {title}
      </h4>
      
      {/* Content */}
      <p className="text-xs text-gray-600 line-clamp-3">
        {content}
      </p>
      
      {/* Index indicator */}
      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white/60 flex items-center justify-center">
        <span className="text-[10px] font-medium text-gray-500">{index + 1}</span>
      </div>
    </motion.div>
  )
}

export function ResponseBubbleGrid({ bubbles }: { bubbles: ResponseBubbleProps[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
      {bubbles.map((bubble, i) => (
        <ResponseBubble key={i} {...bubble} index={i} total={bubbles.length} />
      ))}
    </div>
  )
}

