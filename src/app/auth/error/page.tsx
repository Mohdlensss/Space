'use client'

import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { AlertCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'

function ErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const errorMessages: Record<string, { title: string; message: string }> = {
    unauthorized_domain: {
      title: 'Access Denied',
      message: 'Only @doo.ooo email addresses are allowed to access Space. Please sign in with your DOO account.',
    },
    auth_failed: {
      title: 'Authentication Failed',
      message: 'We couldn\'t complete the sign-in process. Please try again.',
    },
    default: {
      title: 'Something Went Wrong',
      message: 'An unexpected error occurred. Please try again.',
    },
  }

  const { title, message } = errorMessages[error || 'default'] || errorMessages.default

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-strong rounded-3xl p-8 md:p-12 max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/20 mb-6">
          <AlertCircle className="w-8 h-8 text-destructive" />
        </div>
        
        <h1 className="text-2xl font-semibold mb-2">{title}</h1>
        <p className="text-muted-foreground mb-8">{message}</p>
        
        <Link href="/login">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </Button>
        </Link>
      </div>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-strong rounded-3xl p-12 text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <ErrorContent />
    </Suspense>
  )
}


