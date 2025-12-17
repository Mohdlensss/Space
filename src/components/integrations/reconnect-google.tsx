'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { RefreshCw, Loader2 } from 'lucide-react'

export function ReconnectGoogleButton() {
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  const handleReconnect = async () => {
    setIsLoading(true)
    
    // Sign out first
    await supabase.auth.signOut()
    
    // Small delay to ensure signout completes
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Trigger new login with all scopes
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: 'openid email profile https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/calendar',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent', // Force re-consent to ensure we get all scopes
        },
      },
    })
    
    if (error) {
      console.error('Reconnect error:', error)
      setIsLoading(false)
    }
    // If successful, user will be redirected, so we don't reset loading state
  }

  return (
    <Button
      onClick={handleReconnect}
      disabled={isLoading}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Connecting...
        </>
      ) : (
        <>
          <RefreshCw className="w-4 h-4" />
          Reconnect Google
        </>
      )}
    </Button>
  )
}

