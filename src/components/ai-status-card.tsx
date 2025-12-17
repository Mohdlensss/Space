'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sparkles, CheckCircle2, XCircle, RefreshCw, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface AIHealthStatus {
  ok: boolean
  message: string
  missing_env: string[]
  model_info?: {
    chat_model: string
    embedding_model: string
  }
  error_code?: string
}

export function AIStatusCard() {
  const [status, setStatus] = useState<AIHealthStatus | null>(null)
  const [loading, setLoading] = useState(true)

  const checkHealth = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/ai/health')
      const data = await res.json()
      setStatus(data)
    } catch (e) {
      setStatus({
        ok: false,
        message: 'Could not reach AI health endpoint',
        missing_env: [],
        error_code: 'CONNECTION_ERROR'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkHealth()
  }, [])

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          AI Status
        </CardTitle>
        <CardDescription>Space AI (Ask Space) health status</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Checking AI health...
          </div>
        ) : status ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {status.ok ? (
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-rose-600" />
                </div>
              )}
              <div>
                <p className="font-medium">
                  {status.ok ? 'AI is healthy' : 'AI needs attention'}
                </p>
                <p className="text-sm text-muted-foreground">{status.message}</p>
              </div>
            </div>

            {status.model_info && (
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="text-xs">
                  Chat: {status.model_info.chat_model}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Embeddings: {status.model_info.embedding_model}
                </Badge>
              </div>
            )}

            {status.missing_env.length > 0 && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-sm">
                <p className="font-medium text-rose-800 mb-1">Missing configuration:</p>
                <ul className="text-rose-600 list-disc list-inside">
                  {status.missing_env.map(env => (
                    <li key={env}>{env}</li>
                  ))}
                </ul>
              </div>
            )}

            <Button 
              variant="outline" 
              size="sm" 
              onClick={checkHealth}
              disabled={loading}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh status
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

