'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Calendar, CheckCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LeaveRequestFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

const LEAVE_TYPES = [
  { id: 'annual', label: 'Annual Leave', days: 30, description: 'Paid vacation time' },
  { id: 'sick', label: 'Sick Leave', days: 15, description: 'Medical certificate required for 3+ days' },
  { id: 'emergency', label: 'Emergency Leave', days: 3, description: 'For urgent personal matters' },
  { id: 'compassionate', label: 'Compassionate Leave', days: 3, description: 'Death of immediate family' },
  { id: 'unpaid', label: 'Unpaid Leave', days: 0, description: 'Subject to management approval' },
]

export function LeaveRequestForm({ onSuccess, onCancel }: LeaveRequestFormProps) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    leaveType: 'annual',
    startDate: '',
    endDate: '',
    reason: '',
    handoverNotes: '',
  })

  const selectedType = LEAVE_TYPES.find(t => t.id === formData.leaveType)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'leave',
          title: `${selectedType?.label} Request`,
          description: `Reason: ${formData.reason}\n\nHandover: ${formData.handoverNotes}`,
          start_date: formData.startDate,
          end_date: formData.endDate,
        }),
      })

      if (res.ok) {
        setSuccess(true)
        setTimeout(() => onSuccess?.(), 2000)
      }
    } catch (error) {
      console.error('Failed to submit:', error)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex flex-col items-center justify-center py-12 text-center"
      >
        <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
          <CheckCircle className="w-8 h-8 text-emerald-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Leave Request Submitted!
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Your manager will review and respond soon.
        </p>
      </motion.div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-gray-800">
        <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
          <Calendar className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">Leave Request</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">Request time off from work</p>
        </div>
      </div>

      {/* Leave Type Selection */}
      <div className="space-y-2">
        <Label>Leave Type</Label>
        <div className="grid grid-cols-2 gap-2">
          {LEAVE_TYPES.map(type => (
            <button
              key={type.id}
              type="button"
              onClick={() => setFormData({ ...formData, leaveType: type.id })}
              className={cn(
                'p-3 rounded-xl border text-left transition-all',
                formData.leaveType === type.id
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              )}
            >
              <span className="text-sm font-medium text-gray-900 dark:text-white">{type.label}</span>
              <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {type.days > 0 ? `Up to ${type.days} days/year` : type.description}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">From</Label>
          <Input
            id="startDate"
            type="date"
            required
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            className="dark:bg-gray-800 dark:border-gray-700"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">To</Label>
          <Input
            id="endDate"
            type="date"
            required
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            className="dark:bg-gray-800 dark:border-gray-700"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="reason">Reason</Label>
        <Textarea
          id="reason"
          placeholder="Brief reason for leave..."
          required
          rows={2}
          value={formData.reason}
          onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
          className="dark:bg-gray-800 dark:border-gray-700"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="handover">Handover Notes (Optional)</Label>
        <Textarea
          id="handover"
          placeholder="Who will cover your responsibilities?"
          rows={2}
          value={formData.handoverNotes}
          onChange={(e) => setFormData({ ...formData, handoverNotes: e.target.value })}
          className="dark:bg-gray-800 dark:border-gray-700"
        />
      </div>

      <div className="flex gap-3 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
        )}
        <Button 
          type="submit" 
          disabled={loading}
          className={cn(
            'flex-1 bg-gradient-to-r from-emerald-600 to-teal-600',
            'hover:from-emerald-700 hover:to-teal-700'
          )}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            'Submit Request'
          )}
        </Button>
      </div>
    </form>
  )
}

