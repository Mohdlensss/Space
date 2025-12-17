'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Laptop, Calendar, Receipt, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { RemoteWorkForm } from '@/components/actions/remote-work-form'
import { LeaveRequestForm } from '@/components/actions/leave-request-form'
import { ReimbursementForm } from '@/components/actions/reimbursement-form'

type ActionType = 'remote' | 'leave' | 'expense' | null

const QUICK_ACTIONS = [
  {
    id: 'remote' as const,
    label: 'Remote Work',
    icon: Laptop,
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'leave' as const,
    label: 'Request Leave',
    icon: Calendar,
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    id: 'expense' as const,
    label: 'Expense',
    icon: Receipt,
    gradient: 'from-amber-500 to-orange-500',
  },
]

export function QuickActions() {
  const [activeAction, setActiveAction] = useState<ActionType>(null)

  return (
    <>
      <div className="flex gap-2">
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon
          return (
            <motion.button
              key={action.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveAction(action.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl',
                'bg-white dark:bg-gray-900',
                'border border-gray-100 dark:border-gray-800',
                'hover:shadow-md transition-shadow',
                'text-sm font-medium'
              )}
            >
              <div className={cn(
                'w-6 h-6 rounded-lg flex items-center justify-center',
                'bg-gradient-to-r',
                action.gradient
              )}>
                <Icon className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-gray-700 dark:text-gray-300">{action.label}</span>
            </motion.button>
          )
        })}
      </div>

      {/* Modal */}
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
                'relative w-full max-w-lg max-h-[90vh] overflow-y-auto',
                'bg-white dark:bg-gray-900 rounded-2xl shadow-2xl',
                'p-6'
              )}
            >
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
                  onSuccess={() => setActiveAction(null)} 
                  onCancel={() => setActiveAction(null)} 
                />
              )}
              {activeAction === 'leave' && (
                <LeaveRequestForm 
                  onSuccess={() => setActiveAction(null)} 
                  onCancel={() => setActiveAction(null)} 
                />
              )}
              {activeAction === 'expense' && (
                <ReimbursementForm 
                  onSuccess={() => setActiveAction(null)} 
                  onCancel={() => setActiveAction(null)} 
                />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

