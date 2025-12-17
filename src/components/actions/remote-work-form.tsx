'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Laptop, Calendar, CheckCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RemoteWorkFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export function RemoteWorkForm({ onSuccess, onCancel }: RemoteWorkFormProps) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    reason: '',
    location: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'remote_work',
          title: 'Remote Work Request',
          description: `Location: ${formData.location}\nReason: ${formData.reason}`,
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
          Request Submitted!
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Your manager will be notified for approval.
        </p>
      </motion.div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-gray-800">
        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
          <Laptop className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">Remote Work Request</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">Request to work from home or another location</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">Start Date</Label>
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
          <Label htmlFor="endDate">End Date</Label>
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
        <Label htmlFor="location">Work Location</Label>
        <Input
          id="location"
          placeholder="e.g., Home, Coffee shop, Client office"
          required
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          className="dark:bg-gray-800 dark:border-gray-700"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="reason">Reason</Label>
        <Textarea
          id="reason"
          placeholder="Why do you need to work remotely?"
          required
          rows={3}
          value={formData.reason}
          onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
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
            'flex-1 bg-gradient-to-r from-blue-600 to-cyan-600',
            'hover:from-blue-700 hover:to-cyan-700'
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

