'use client'

import { useState, useEffect } from 'react'
import { SpaceOnboarding } from '@/components/onboarding/space-onboarding'

interface HomeWrapperProps {
  children: React.ReactNode
  userName: string
  userRole: string
}

export function HomeWrapper({ children, userName, userRole }: HomeWrapperProps) {
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const complete = localStorage.getItem('space-onboarding-complete')
    if (!complete) {
      setShowOnboarding(true)
    }
  }, [])

  const handleOnboardingComplete = () => {
    setShowOnboarding(false)
    localStorage.setItem('space-onboarding-complete', 'true')
  }

  if (!mounted) return <>{children}</>

  return (
    <>
      {showOnboarding && (
        <SpaceOnboarding 
          userName={userName} 
          userRole={userRole} 
          onComplete={handleOnboardingComplete} 
        />
      )}
      {children}
    </>
  )
}

