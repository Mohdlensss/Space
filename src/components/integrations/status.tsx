'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle, RefreshCw, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface IntegrationStatusProps {
  type: 'google' | 'linear'
}

interface StatusData {
  connected: boolean
  hasTokens?: boolean
  hasRefreshToken?: boolean
  isExpired?: boolean
  message?: string
  error?: string
}

export function IntegrationStatus({ type }: IntegrationStatusProps) {
  const [status, setStatus] = useState<StatusData | null>(null)
  const [loading, setLoading] = useState(true)
  const [reconnecting, setReconnecting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchStatus()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchStatus = async () => {
    setLoading(true)
    try {
      const endpoint = type === 'google' ? '/api/google/status' : '/api/linear/status'
      const response = await fetch(endpoint)
      const data = await response.json()
      setStatus(data)
    } catch (error) {
      console.error(`Failed to fetch ${type} status:`, error)
      setStatus({ connected: false, error: 'Failed to check status' })
    } finally {
      setLoading(false)
    }
  }

  const handleReconnect = async () => {
    setReconnecting(true)
    if (type === 'google') {
      await supabase.auth.signOut()
      router.push('/login?reconnect=true')
    } else {
      await fetchStatus()
      setReconnecting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground py-3">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Checking...</span>
      </div>
    )
  }

  const isConnected = status?.connected === true

  return (
    <div className="space-y-4">
      {/* Status indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isConnected ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-600">Connected</span>
            </>
          ) : (
            <>
              <XCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm font-medium text-red-500">Not connected</span>
            </>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={fetchStatus}
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Status message */}
      {status?.message && !isConnected && (
        <p className="text-sm text-muted-foreground">
          {status.message}
        </p>
      )}

      {/* Google-specific status */}
      {type === 'google' && status && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between py-1.5 text-sm">
            <span className="text-muted-foreground">Gmail access</span>
            <span className={status.hasTokens ? 'text-green-600 font-medium' : 'text-muted-foreground'}>
              {status.hasTokens ? 'Active' : 'Not available'}
            </span>
          </div>
          <div className="flex items-center justify-between py-1.5 text-sm">
            <span className="text-muted-foreground">Calendar access</span>
            <span className={status.hasTokens ? 'text-green-600 font-medium' : 'text-muted-foreground'}>
              {status.hasTokens ? 'Active' : 'Not available'}
            </span>
          </div>
          {status.hasRefreshToken === false && isConnected && (
            <div className="p-3 rounded-lg bg-amber-50 text-xs text-amber-700 mt-2">
              Refresh token missing. Please reconnect for long-term access.
            </div>
          )}
        </div>
      )}

      {/* Reconnect button */}
      {(!isConnected || (type === 'google' && status?.hasRefreshToken === false)) && (
        <div className="pt-3 border-t border-border">
          <Button 
            onClick={handleReconnect} 
            disabled={reconnecting}
            className="w-full h-9 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {reconnecting ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            {type === 'google' ? 'Reconnect Google' : 'Refresh Status'}
          </Button>
        </div>
      )}
    </div>
  )
}
