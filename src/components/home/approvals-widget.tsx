'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { GlassPanel } from '@/components/ui/glass-elements'
import { SpacingOutInline } from '@/components/ui/spacing-out-loader'
import { Check, X, Clock, User, Calendar, Briefcase, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ApprovalRequest {
  id: string
  type: 'remote_work' | 'leave' | 'expense' | 'other'
  requester_email: string
  requester_name: string
  status: 'pending' | 'approved' | 'rejected'
  title: string
  description: string
  start_date?: string
  end_date?: string
  created_at: string
}

const typeIcons = {
  remote_work: Briefcase,
  leave: Calendar,
  expense: AlertCircle,
  other: Clock,
}

const typeLabels = {
  remote_work: 'Remote Work',
  leave: 'Leave',
  expense: 'Expense',
  other: 'Request',
}

export function ApprovalsWidget() {
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)

  const fetchApprovals = async () => {
    try {
      const res = await fetch('/api/approvals')
      const data = await res.json()
      if (data.ok) {
        setApprovals(data.pendingForMe || [])
      }
    } catch (e) {
      console.error('Failed to fetch approvals:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchApprovals()
  }, [])

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    setProcessing(id)
    try {
      const res = await fetch(`/api/approvals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const data = await res.json()
      if (data.ok) {
        // Remove from list
        setApprovals(prev => prev.filter(a => a.id !== id))
      }
    } catch (e) {
      console.error('Action failed:', e)
    } finally {
      setProcessing(null)
    }
  }

  if (loading) {
    return <SpacingOutInline />
  }

  if (approvals.length === 0) {
    return null // Don't show if no pending approvals
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
        <h3 className="text-sm font-semibold text-gray-700">
          Pending Approvals ({approvals.length})
        </h3>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {approvals.map(approval => {
          const Icon = typeIcons[approval.type] || Clock
          const isProcessing = processing === approval.id

          return (
            <GlassPanel 
              key={approval.id}
              className={cn(
                'flex-shrink-0 w-[320px] p-5',
                'bg-gradient-to-br from-amber-50/80 to-orange-50/60',
                'border-amber-200/50'
              )}
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {approval.title}
                  </p>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                    <User className="w-3 h-3" />
                    {approval.requester_name}
                  </p>
                </div>
                <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-amber-100 text-amber-700">
                  {typeLabels[approval.type]}
                </span>
              </div>

              {approval.description && (
                <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                  {approval.description}
                </p>
              )}

              {(approval.start_date || approval.end_date) && (
                <div className="flex items-center gap-1 text-xs text-gray-500 mb-4">
                  <Calendar className="w-3 h-3" />
                  <span>
                    {approval.start_date && new Date(approval.start_date).toLocaleDateString()}
                    {approval.end_date && ` - ${new Date(approval.end_date).toLocaleDateString()}`}
                  </span>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 gap-1 bg-white/50 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200"
                  onClick={() => handleAction(approval.id, 'reject')}
                  disabled={isProcessing}
                >
                  <X className="w-4 h-4" />
                  Reject
                </Button>
                <Button
                  size="sm"
                  className="flex-1 gap-1 bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => handleAction(approval.id, 'approve')}
                  disabled={isProcessing}
                >
                  <Check className="w-4 h-4" />
                  Approve
                </Button>
              </div>
            </GlassPanel>
          )
        })}
      </div>
    </div>
  )
}

