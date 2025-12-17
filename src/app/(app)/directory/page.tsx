import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/auth'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Search, Mail } from 'lucide-react'

interface ProfileData {
  id: string
  email: string
  full_name: string
  avatar_url: string | null
  role: string
  department: string
  focus_areas: string[]
}

function groupByDepartment(profiles: ProfileData[]) {
  return profiles.reduce((acc, profile) => {
    const dept = profile.department || 'Unassigned'
    if (!acc[dept]) acc[dept] = []
    acc[dept].push(profile)
    return acc
  }, {} as Record<string, ProfileData[]>)
}

export default async function DirectoryPage() {
  const supabase = await createClient()
  const currentProfile = await getCurrentProfile()
  
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .order('full_name')
  
  const grouped = groupByDepartment((profiles as ProfileData[]) || [])
  const departments = Object.keys(grouped).sort()

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-1">Directory</h1>
        <p className="text-sm text-muted-foreground">
          {profiles?.length || 0} team members
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder="Search by name, role, or department..."
          className="pl-10 h-10 bg-card border-border"
        />
      </div>

      {/* Departments */}
      <div className="space-y-8">
        {departments.map((department) => (
          <div key={department}>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-sm font-semibold">{department}</h2>
              <span className="text-xs text-muted-foreground">
                ({grouped[department].length})
              </span>
            </div>
            
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {grouped[department].map((profile) => {
                const initials = profile.full_name
                  .split(' ')
                  .map(n => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()
                
                const isCurrentUser = profile.id === currentProfile?.id

                return (
                  <Card 
                    key={profile.id} 
                    className={`card-elevated rounded-xl ${isCurrentUser ? 'ring-1 ring-border' : ''}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="w-10 h-10 ring-1 ring-border">
                          <AvatarImage src={profile.avatar_url || undefined} alt={profile.full_name} />
                          <AvatarFallback className="bg-secondary text-foreground text-xs font-medium">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-sm truncate">{profile.full_name}</h3>
                            {isCurrentUser && (
                              <span className="text-[10px] text-muted-foreground">(you)</span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {profile.role}
                          </p>
                          <a 
                            href={`mailto:${profile.email}`}
                            className="inline-flex items-center gap-1 text-xs text-muted-foreground mt-2 hover:text-foreground transition-colors"
                          >
                            <Mail className="w-3 h-3" />
                            <span className="truncate">{profile.email}</span>
                          </a>
                        </div>
                      </div>
                      
                      {profile.focus_areas && profile.focus_areas.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {profile.focus_areas.slice(0, 3).map((area) => (
                            <span 
                              key={area}
                              className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-secondary text-muted-foreground"
                            >
                              {area}
                            </span>
                          ))}
                          {profile.focus_areas.length > 3 && (
                            <span className="text-[10px] text-muted-foreground">
                              +{profile.focus_areas.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        ))}

        {departments.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">
              No team members found. The directory will populate as people sign in.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
