import { redirect } from 'next/navigation'
import { getCurrentProfile, getCurrentUser } from '@/lib/auth'
import { OnboardingWizard } from '@/components/onboarding/wizard'
import Image from 'next/image'

export default async function OnboardingPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/login')
  }
  
  const profile = await getCurrentProfile()
  
  // If already onboarded, redirect to home
  if (profile?.is_onboarded) {
    redirect('/home')
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-background via-background to-secondary/30" />
      
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Image 
            src="/doo-logo.svg" 
            alt="DOO" 
            width={60} 
            height={60}
            priority
          />
        </div>
        
        <OnboardingWizard 
          initialName={profile?.full_name || user.user_metadata?.full_name || ''} 
          initialAvatarUrl={profile?.avatar_url || user.user_metadata?.avatar_url || ''}
          role={profile?.role || 'Team Member'}
          department={profile?.department || 'Unassigned'}
        />
      </div>
    </div>
  )
}
