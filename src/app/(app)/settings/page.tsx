import { getCurrentProfile } from '@/lib/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { User, Bell, Shield, Palette, FileText, Download, BookOpen } from 'lucide-react'
import Link from 'next/link'
import { AIStatusCard } from '@/components/ai-status-card'

export default async function SettingsPage() {
  const profile = await getCurrentProfile()
  
  const initials = profile?.full_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '??'

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Manage your Space preferences
        </p>
      </div>

      <div className="space-y-6">
        {/* Profile Section */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Profile
            </CardTitle>
            <CardDescription>Your public profile information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-6">
              <Avatar className="w-20 h-20">
                <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name} />
                <AvatarFallback className="bg-primary/20 text-primary text-xl">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-3">
                <div>
                  <p className="text-xl font-semibold">{profile?.full_name}</p>
                  <p className="text-muted-foreground">{profile?.email}</p>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline">{profile?.role}</Badge>
                  <Badge variant="outline">{profile?.department}</Badge>
                </div>
              </div>
            </div>
            
            <Separator className="my-6" />
            
            <div>
              <h4 className="text-sm font-medium mb-3">Focus Areas</h4>
              <div className="flex flex-wrap gap-2">
                {profile?.focus_areas && profile.focus_areas.length > 0 ? (
                  profile.focus_areas.map((area) => (
                    <Badge key={area} className="bg-primary/20 text-primary border-primary/30">
                      {area}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No focus areas selected</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications
            </CardTitle>
            <CardDescription>Configure how you receive updates</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Notification settings coming soon...
            </p>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Appearance
            </CardTitle>
            <CardDescription>Customize the look of Space</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Space uses a dark theme designed for focus and calm. Additional themes coming soon...
            </p>
          </CardContent>
        </Card>

        {/* AI Status */}
        <AIStatusCard />

        {/* Security */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Security & Privacy
            </CardTitle>
            <CardDescription>Manage your account security</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Your account is secured through Google Workspace. Contact IT for security concerns.
            </p>
          </CardContent>
        </Card>

        {/* Company Policies */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Company Policies
            </CardTitle>
            <CardDescription>Official DOO documents and policies</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 border border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">HR Policy 2025</p>
                  <p className="text-sm text-muted-foreground">Official Human Resources policies and procedures</p>
                </div>
              </div>
              <Link href="/api/doo/hr-policy" download>
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="w-4 h-4" />
                  Download
                </Button>
              </Link>
            </div>
            
            <p className="text-xs text-muted-foreground">
              💡 Tip: Ask Space AI any question about DOO policies! Try: "What's the leave policy?" or "How many sick days do I get?"
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


