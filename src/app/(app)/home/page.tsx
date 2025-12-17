import { getCurrentProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Users,
  ArrowRight,
  Zap,
} from 'lucide-react'
import { CalendarWidget } from '@/components/home/calendar-widget'
import { GmailWidget } from '@/components/home/gmail-widget'
import { LinearWidget } from '@/components/home/linear-widget'
import { InsightsWidget } from '@/components/home/insights-widget'
import { ApprovalsWidget } from '@/components/home/approvals-widget'
import { QuickActions } from '@/components/home/quick-actions'
import { HomeWrapper } from '@/components/home/home-wrapper'
import Image from 'next/image'
import Link from 'next/link'

// Roles that should see Linear widget
const LINEAR_VISIBLE_ROLES = [
  'CEO', 'COO', 'CTO', 'CFO',
  'Chief', 'Co-founder', 'Founder',
  'Product', 'Engineer', 'Developer', 
  'Designer', 'AI', 'Machine Learning',
  'Data', 'Technical', 'Tech Lead',
  'Software', 'DevOps', 'QA',
]

// Departments that should see Linear
const LINEAR_VISIBLE_DEPTS = [
  'Engineering', 'Product', 'Technology', 
  'AI', 'Research', 'Design', 'Tech',
  'Leadership',
]

function shouldShowLinear(role: string, department: string): boolean {
  const roleUpper = role?.toUpperCase() || ''
  const deptUpper = department?.toUpperCase() || ''
  
  const hasLinearRole = LINEAR_VISIBLE_ROLES.some(r => roleUpper.includes(r.toUpperCase()))
  const hasLinearDept = LINEAR_VISIBLE_DEPTS.some(d => deptUpper.includes(d.toUpperCase()))
  
  return hasLinearRole || hasLinearDept
}

export default async function HomePage() {
  const profile = await getCurrentProfile()
  const supabase = await createClient()
  
  const { count: teamCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
  
  const firstName = profile?.full_name.split(' ')[0] || 'there'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const role = profile?.role || 'Team Member'
  const department = profile?.department || ''
  const showLinear = shouldShowLinear(role, department)

  return (
    <HomeWrapper userName={profile?.full_name || 'there'} userRole={role}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto animate-fade-in">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Image 
              src="/doo-logo.svg" 
              alt="DOO" 
              width={32} 
              height={32}
              priority
            />
            <span className="text-xs font-semibold text-muted-foreground tracking-widest uppercase">Space</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
            {greeting}, {firstName}
          </h1>
        <p className="text-muted-foreground">
          Here&apos;s your overview for today
        </p>
      </header>

      {/* Approvals Section - First for approvers */}
      <div className="mb-6">
        <ApprovalsWidget />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Identity Card */}
          <div className="neu-flat p-6 rounded-2xl">
            <div className="flex items-start gap-4">
              <Avatar className="w-14 h-14 shadow-md">
                <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name} />
                <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                  {profile?.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold text-foreground">{profile?.full_name}</h2>
                <p className="text-sm text-muted-foreground">{role}{department && ` · ${department}`}</p>
                {profile?.focus_areas && profile.focus_areas.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {profile.focus_areas.slice(0, 5).map((area) => (
                      <span 
                        key={area} 
                        className="inline-flex items-center px-3 py-1 rounded-full bg-secondary text-xs font-medium text-muted-foreground"
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Linear Widget - Only for tech/leadership roles */}
          {showLinear && (
            <div className="neu-flat p-6 rounded-2xl">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-md linear-bg flex items-center justify-center">
                  <svg viewBox="0 0 20 20" fill="white" className="w-3.5 h-3.5">
                    <path d="M2.5 2.5L10 17.5L17.5 2.5H12.5L10 7.5L7.5 2.5H2.5Z"/>
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-foreground">Linear Tasks</h3>
              </div>
              <LinearWidget />
            </div>
          )}

          {/* Quick Actions */}
          <div className="neu-flat p-6 rounded-2xl">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Quick Actions</h3>
            </div>
            <QuickActions />
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <CalendarWidget />
          <GmailWidget />

          {/* Team Card */}
          <div className="neu-flat p-6 rounded-2xl">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Team</h3>
            </div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-3xl font-bold text-foreground tabular-nums">{teamCount || 0}</p>
                <p className="text-xs text-muted-foreground">members</p>
              </div>
              <div className="flex -space-x-2">
                {[0, 1, 2].map((i) => (
                  <Avatar key={i} className="w-8 h-8 ring-2 ring-card shadow-sm">
                    <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
                      {String.fromCharCode(65 + i)}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
            </div>
            <Link 
              href="/directory" 
              className="inline-flex items-center text-sm font-medium text-primary hover:underline"
            >
              View directory
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </div>
      </div>

        {/* Insights Carousel */}
        <InsightsWidget />
      </div>
    </HomeWrapper>
  )
}
