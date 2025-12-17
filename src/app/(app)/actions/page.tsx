'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Laptop, Calendar, Receipt, FileText, Clock, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { RemoteWorkForm } from '@/components/actions/remote-work-form'
import { LeaveRequestForm } from '@/components/actions/leave-request-form'
import { ReimbursementForm } from '@/components/actions/reimbursement-form'

type ActionType = 'remote' | 'leave' | 'expense' | null

const QUICK_ACTIONS = [
  {
    id: 'remote' as const,
    title: 'Remote Work',
    description: 'Request to work from home or another location',
    icon: Laptop,
    gradient: 'from-blue-500 to-cyan-500',
    bgLight: 'bg-blue-50',
    bgDark: 'dark:bg-blue-900/20',
  },
  {
    id: 'leave' as const,
    title: 'Leave Request',
    description: 'Request annual, sick, or emergency leave',
    icon: Calendar,
    gradient: 'from-emerald-500 to-teal-500',
    bgLight: 'bg-emerald-50',
    bgDark: 'dark:bg-emerald-900/20',
  },
  {
    id: 'expense' as const,
    title: 'Reimbursement',
    description: 'Submit expenses for reimbursement',
    icon: Receipt,
    gradient: 'from-amber-500 to-orange-500',
    bgLight: 'bg-amber-50',
    bgDark: 'dark:bg-amber-900/20',
  },
]

export default function ActionsPage() {
  const [activeAction, setActiveAction] = useState<ActionType>(null)

  const handleSuccess = () => {
    setActiveAction(null)
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quick Actions</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Submit requests and manage your work
        </p>
      </header>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {QUICK_ACTIONS.map((action, index) => {
          const Icon = action.icon
          return (
            <motion.button
              key={action.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => setActiveAction(action.id)}
              className={cn(
                'relative p-6 rounded-2xl text-left transition-all group',
                'bg-white dark:bg-gray-900',
                'border border-gray-100 dark:border-gray-800',
                'hover:shadow-lg hover:scale-[1.02]',
                'hover:border-gray-200 dark:hover:border-gray-700'
              )}
            >
              {/* Gradient accent */}
              <div className={cn(
                'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity',
                'bg-gradient-to-br rounded-2xl',
                action.gradient,
                'blur-xl -z-10'
              )} 
              style={{ transform: 'scale(0.9)' }}
              />
              
              <div className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center mb-4',
                action.bgLight,
                action.bgDark
              )}>
                <Icon className={cn(
                  'w-6 h-6 bg-gradient-to-r bg-clip-text',
                  action.gradient.replace('from-', 'text-').split(' ')[0]
                )} />
              </div>
              
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                {action.title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {action.description}
              </p>
            </motion.button>
          )
        })}
      </div>

      {/* Recent Requests */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-gray-400" />
          Recent Requests
        </h2>
        <div className={cn(
          'p-8 rounded-2xl text-center',
          'bg-gray-50 dark:bg-gray-900/50',
          'border border-gray-100 dark:border-gray-800'
        )}>
          <FileText className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No recent requests</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Your submitted requests will appear here
          </p>
        </div>
      </section>

      {/* Modal for Forms */}
      <AnimatePresence>
        {activeAction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setActiveAction(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={cn(
                'w-full max-w-lg max-h-[90vh] overflow-y-auto',
                'bg-white dark:bg-gray-900 rounded-2xl shadow-2xl',
                'p-6'
              )}
            >
              {/* Close button */}
              <button
                onClick={() => setActiveAction(null)}
                className={cn(
                  'absolute top-4 right-4 p-2 rounded-full',
                  'hover:bg-gray-100 dark:hover:bg-gray-800',
                  'transition-colors'
                )}
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>

              {activeAction === 'remote' && (
                <RemoteWorkForm 
                  onSuccess={handleSuccess} 
                  onCancel={() => setActiveAction(null)} 
                />
              )}
              {activeAction === 'leave' && (
                <LeaveRequestForm 
                  onSuccess={handleSuccess} 
                  onCancel={() => setActiveAction(null)} 
                />
              )}
              {activeAction === 'expense' && (
                <ReimbursementForm 
                  onSuccess={handleSuccess} 
                  onCancel={() => setActiveAction(null)} 
                />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

