'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  Shield,
  Eye,
  EyeOff,
  Lock,
  Users,
  Building2,
  MessageSquare,
  Calendar,
  Mail,
  CheckSquare,
  FileText,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Info,
  AlertCircle,
  Check,
  Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface DataCategory {
  id: string
  name: string
  icon: React.ElementType
  description: string
  examples: string[]
  isPrivate: boolean
  usedForInsights: boolean
  canOptOut: boolean
}

const DATA_CATEGORIES: DataCategory[] = [
  {
    id: 'messages',
    name: 'Channel Messages',
    icon: MessageSquare,
    description: 'Messages you send in public and private channels',
    examples: ['#general discussions', '#engineering updates', 'Team announcements'],
    isPrivate: false,
    usedForInsights: true,
    canOptOut: false
  },
  {
    id: 'dms',
    name: 'Direct Messages',
    icon: Lock,
    description: 'Private conversations between you and other team members',
    examples: ['1:1 conversations', 'Private discussions'],
    isPrivate: true,
    usedForInsights: false,
    canOptOut: false
  },
  {
    id: 'tasks',
    name: 'Tasks & Issues',
    icon: CheckSquare,
    description: 'Linear issues and tasks assigned to you or your team',
    examples: ['Your assigned tasks', 'Team project issues', 'Cycle objectives'],
    isPrivate: false,
    usedForInsights: true,
    canOptOut: false
  },
  {
    id: 'calendar',
    name: 'Calendar Events',
    icon: Calendar,
    description: 'Meetings and events from your connected calendar',
    examples: ['Team meetings', 'Syncs', 'Events you created'],
    isPrivate: false,
    usedForInsights: true,
    canOptOut: true
  },
  {
    id: 'emails',
    name: 'Work Emails',
    icon: Mail,
    description: 'Emails classified as work-related (not personal)',
    examples: ['Customer emails', 'Team communications', 'Work notifications'],
    isPrivate: true,
    usedForInsights: false,
    canOptOut: false
  },
  {
    id: 'documents',
    name: 'Shared Documents',
    icon: FileText,
    description: 'Documents shared with you or your team',
    examples: ['Shared files', 'Team documentation', 'Public resources'],
    isPrivate: false,
    usedForInsights: true,
    canOptOut: false
  }
]

const ACCESS_LEVELS = [
  {
    icon: Eye,
    title: 'What You Can Access',
    description: 'Data visible to you in Ask Space queries',
    items: [
      'All your own messages and content',
      'Messages in channels you belong to',
      'Tasks assigned to you or your team',
      'Shared documents and resources',
      'Your calendar events'
    ],
    color: 'text-green-500',
    bgColor: 'bg-green-500/10'
  },
  {
    icon: EyeOff,
    title: 'What Stays Private',
    description: 'Data that is never shared or analyzed',
    items: [
      'Your direct messages (DMs)',
      'Personal emails',
      "Other users' private content",
      'Channels you don\'t belong to',
      'Personal notes and drafts'
    ],
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10'
  },
  {
    icon: Users,
    title: 'What Is Aggregated',
    description: 'Data used for team/org insights (anonymized)',
    items: [
      'Team mood trends (no individual scores)',
      'Collaboration health metrics',
      'Workload indicators',
      'Discussion themes (no attribution)',
      'Organization-wide patterns'
    ],
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10'
  }
]

export default function PrivacyPage() {
  const [loading, setLoading] = useState(true)
  const [optedOutOfSentiment, setOptedOutOfSentiment] = useState(false)
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    // Simulate loading user preferences
    const timer = setTimeout(() => {
      setLoading(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  const handleOptOutChange = async (value: boolean) => {
    setOptedOutOfSentiment(value)
    setSaving(true)
    // In a real app, save to database
    await new Promise(resolve => setTimeout(resolve, 500))
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container max-w-4xl py-8 px-4">
      {/* Header */}
      <div className="flex items-start gap-4 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0">
          <Shield className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold mb-1">What Space Knows About You</h1>
          <p className="text-muted-foreground">
            Full transparency on how your data is used by Space AI.
            Your privacy and trust are our top priority.
          </p>
        </div>
      </div>

      {/* Trust Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-violet-500/10 to-purple-600/10 border border-violet-500/20 mb-8">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-violet-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold mb-1">Our Commitment</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-green-500" />
                AI never accesses data you don&apos;t have permission to see
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-green-500" />
                Private messages and emails are never analyzed
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-green-500" />
                Team insights are always aggregated — no individual identification
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-green-500" />
                You can opt out of sentiment analysis
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Access Levels */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {ACCESS_LEVELS.map((level, i) => (
          <div
            key={i}
            className="p-4 rounded-xl border border-border bg-card"
          >
            <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center mb-3', level.bgColor)}>
              <level.icon className={cn('w-5 h-5', level.color)} />
            </div>
            <h3 className="font-semibold mb-1">{level.title}</h3>
            <p className="text-xs text-muted-foreground mb-3">{level.description}</p>
            <ul className="text-xs space-y-1.5">
              {level.items.map((item, j) => (
                <li key={j} className="flex items-start gap-2">
                  <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Data Categories */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Data Categories</h2>
        <div className="space-y-2">
          {DATA_CATEGORIES.map((category) => (
            <div
              key={category.id}
              className="border border-border rounded-xl overflow-hidden bg-card"
            >
              <button
                onClick={() => setExpandedCategory(
                  expandedCategory === category.id ? null : category.id
                )}
                className="w-full flex items-center gap-4 p-4 hover:bg-secondary/50 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                  <category.icon className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{category.name}</span>
                    {category.isPrivate && (
                      <span className="px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-500 text-[10px] font-medium">
                        Private
                      </span>
                    )}
                    {category.usedForInsights && (
                      <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 text-[10px] font-medium">
                        Used for insights
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{category.description}</p>
                </div>
                <ChevronDown
                  className={cn(
                    'w-4 h-4 text-muted-foreground transition-transform',
                    expandedCategory === category.id && 'rotate-180'
                  )}
                />
              </button>
              {expandedCategory === category.id && (
                <div className="px-4 pb-4 pt-0">
                  <div className="p-3 rounded-lg bg-secondary/50">
                    <p className="text-xs text-muted-foreground mb-2">Examples:</p>
                    <ul className="text-xs space-y-1">
                      {category.examples.map((example, j) => (
                        <li key={j} className="flex items-center gap-2">
                          <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                          {example}
                        </li>
                      ))}
                    </ul>
                    {category.isPrivate && (
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border text-xs text-orange-500">
                        <Lock className="w-3.5 h-3.5" />
                        <span>This data is never shared or analyzed for insights</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Opt-out Section */}
      <div className="p-6 rounded-xl border border-border bg-card">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Sentiment Analysis Opt-out</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Your public channel messages may be used for aggregated team sentiment analysis.
                You can opt out if you prefer.
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Info className="w-3.5 h-3.5" />
                <span>Even when opted in, your data is only used in aggregate — never individually identified</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {saving && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
            {saved && <span className="text-xs text-green-500">Saved</span>}
            <Switch
              checked={optedOutOfSentiment}
              onCheckedChange={handleOptOutChange}
              disabled={saving}
            />
          </div>
        </div>
        {optedOutOfSentiment && (
          <div className="mt-4 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
            <p className="text-xs text-orange-600 dark:text-orange-400">
              You have opted out of sentiment analysis. Your public messages will not be included in team mood trends or insights.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-xs text-muted-foreground mb-4">
          Have questions about your data? Contact the DOO team.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <a href="/ask">
              <Sparkles className="w-4 h-4 mr-2" />
              Ask Space
            </a>
          </Button>
        </div>
      </div>
    </div>
  )
}

