import { redirect } from 'next/navigation'
import { getCurrentProfile } from '@/lib/auth'
import { AppShell } from '@/components/app-shell'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await getCurrentProfile()
  
  if (!profile) {
    redirect('/login')
  }
  
  // If not onboarded, redirect to onboarding
  if (!profile.is_onboarded) {
    redirect('/onboarding')
  }
  
  return <AppShell profile={profile}>{children}</AppShell>
}


