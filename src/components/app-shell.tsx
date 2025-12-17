'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { 
  Home, 
  Users, 
  MessageSquare, 
  Calendar,
  Mail,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  ChevronDown,
  Plug,
  Sparkles,
  Shield,
  BarChart3
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Profile } from '@/lib/database.types'

interface AppShellProps {
  profile: Profile
  children: React.ReactNode
}

const mainNav = [
  { name: 'Home', href: '/home', icon: Home },
  { name: 'DOO Chat', href: '/messages', icon: MessageSquare },
  { name: 'Insights', href: '/insights', icon: BarChart3 },
  { name: 'Directory', href: '/directory', icon: Users },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Email', href: '/email', icon: Mail },
]

const utilityNav = [
  { name: 'Integrations', href: '/integrations', icon: Plug },
  { name: 'Privacy & Data', href: '/privacy', icon: Shield },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function AppShell({ profile, children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const initials = profile.full_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="min-h-screen flex bg-background">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64
        bg-card shadow-xl border-r border-border/50
        transform transition-transform duration-200 ease-out
        lg:relative lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-5 border-b border-border/50">
            <Link href="/home" className="flex items-center gap-3 group">
              <Image 
                src="/doo-logo.svg" 
                alt="DOO" 
                width={28} 
                height={28}
                priority
                className="transition-transform duration-200 group-hover:scale-110"
              />
              <span className="font-semibold text-foreground">Space</span>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-8 w-8"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Ask Space - Prominent at top */}
          <div className="px-3 pt-4 pb-2">
            <Link
              href="/ask"
              onClick={() => setSidebarOpen(false)}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
                bg-gradient-to-r from-violet-500/10 to-purple-500/10 
                border border-violet-500/20
                transition-all duration-200
                hover:from-violet-500/20 hover:to-purple-500/20
                hover:border-violet-500/30
                hover:shadow-md hover:shadow-violet-500/10
                hover:-translate-y-0.5
                ${pathname === '/ask' ? 'from-violet-500/20 to-purple-500/20 border-violet-500/30 shadow-md shadow-violet-500/10' : ''}
              `}
            >
              <Sparkles className="w-4 h-4 text-violet-500" />
              <span className="text-foreground">Ask Space</span>
              <kbd className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-background/50 text-muted-foreground">
                ⌘K
              </kbd>
            </Link>
          </div>

          {/* Main Navigation */}
          <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
            {mainNav.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium
                    transition-all duration-200
                    hover:-translate-y-0.5 hover:shadow-sm
                    ${isActive 
                      ? 'bg-primary text-primary-foreground shadow-md' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                    }
                  `}
                >
                  <item.icon className={`w-4 h-4 transition-transform duration-200 ${!isActive ? 'group-hover:scale-110' : ''}`} />
                  {item.name}
                </Link>
              )
            })}
            
            <div className="h-px bg-border/50 my-3" />
            
            {utilityNav.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium
                    transition-all duration-200
                    hover:-translate-y-0.5 hover:shadow-sm
                    ${isActive 
                      ? 'bg-primary text-primary-foreground shadow-md' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                    }
                  `}
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* User Profile */}
          <div className="p-3 border-t border-border/50">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-secondary transition-all duration-200 text-left hover:-translate-y-0.5 hover:shadow-sm">
                  <Avatar className="w-9 h-9 shadow-sm ring-2 ring-background">
                    <AvatarImage src={profile.avatar_url || undefined} alt={profile.full_name} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{profile.full_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{profile.role}</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer">
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleSignOut} 
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-14 bg-card/80 backdrop-blur-md border-b border-border/50 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-9 w-9 hover:scale-105 transition-transform"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            
            {/* Ask Space Bar - Header (desktop) */}
            <Link
              href="/ask"
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary/50 border border-border/50 w-64 lg:w-96 cursor-pointer hover:bg-secondary hover:border-border transition-all duration-200 hover:shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-violet-500" />
              <span className="text-sm text-muted-foreground flex-1">Ask Space anything...</span>
              <kbd className="hidden lg:inline-flex items-center px-2 py-0.5 text-[10px] font-medium text-muted-foreground bg-background rounded-md">
                ⌘K
              </kbd>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative h-9 w-9 rounded-xl hover:scale-105 transition-transform"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full animate-pulse" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="sm:hidden h-9 w-9 rounded-xl hover:scale-105 transition-transform" 
              asChild
            >
              <Link href="/ask">
                <Sparkles className="w-4 h-4 text-violet-500" />
              </Link>
            </Button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
