'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Receipt, CheckCircle, Loader2, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ReimbursementFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

const EXPENSE_CATEGORIES = [
  { id: 'travel', label: 'Travel & Transport', icon: '✈️' },
  { id: 'meals', label: 'Meals & Entertainment', icon: '🍽️' },
  { id: 'supplies', label: 'Office Supplies', icon: '📦' },
  { id: 'software', label: 'Software & Tools', icon: '💻' },
  { id: 'training', label: 'Training & Books', icon: '📚' },
  { id: 'other', label: 'Other', icon: '📋' },
]

export function ReimbursementForm({ onSuccess, onCancel }: ReimbursementFormProps) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    category: 'travel',
    amount: '',
    currency: 'BHD',
    date: '',
    description: '',
    vendor: '',
  })

  const selectedCategory = EXPENSE_CATEGORIES.find(c => c.id === formData.category)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'expense',
          title: `${selectedCategory?.label} - ${formData.currency} ${formData.amount}`,
          description: `Vendor: ${formData.vendor}\nDate: ${formData.date}\n\n${formData.description}`,
          start_date: formData.date,
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
        <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
          <CheckCircle className="w-8 h-8 text-amber-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Expense Submitted!
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Finance will review and process your reimbursement.
        </p>
      </motion.div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-gray-800">
        <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
          <Receipt className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">Expense Reimbursement</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">Submit receipts for reimbursement</p>
        </div>
      </div>

      {/* Category Selection */}
      <div className="space-y-2">
        <Label>Category</Label>
        <div className="grid grid-cols-3 gap-2">
          {EXPENSE_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setFormData({ ...formData, category: cat.id })}
              className={cn(
                'p-3 rounded-xl border text-center transition-all',
                formData.category === cat.id
                  ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              )}
            >
              <span className="text-xl">{cat.icon}</span>
              <span className="block text-xs font-medium text-gray-700 dark:text-gray-300 mt-1">{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <div className="flex gap-2">
            <select
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              className="w-20 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 px-2 text-sm"
            >
              <option value="BHD">BHD</option>
              <option value="USD">USD</option>
              <option value="SAR">SAR</option>
              <option value="AED">AED</option>
            </select>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              required
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="flex-1 dark:bg-gray-800 dark:border-gray-700"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="date">Expense Date</Label>
          <Input
            id="date"
            type="date"
            required
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="dark:bg-gray-800 dark:border-gray-700"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="vendor">Vendor / Merchant</Label>
        <Input
          id="vendor"
          placeholder="e.g., Gulf Air, Amazon, Jarir"
          required
          value={formData.vendor}
          onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
          className="dark:bg-gray-800 dark:border-gray-700"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="What was this expense for?"
          required
          rows={2}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="dark:bg-gray-800 dark:border-gray-700"
        />
      </div>

      {/* Receipt Upload (placeholder) */}
      <div className="space-y-2">
        <Label>Receipt</Label>
        <div className={cn(
          'border-2 border-dashed rounded-xl p-6 text-center',
          'border-gray-200 dark:border-gray-700',
          'hover:border-gray-300 dark:hover:border-gray-600',
          'transition-colors cursor-pointer'
        )}>
          <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Drag & drop receipt or click to upload
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            PDF, JPG, PNG up to 5MB
          </p>
        </div>
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
            'flex-1 bg-gradient-to-r from-amber-600 to-orange-600',
            'hover:from-amber-700 hover:to-orange-700'
          )}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            'Submit Expense'
          )}
        </Button>
      </div>
    </form>
  )
}

