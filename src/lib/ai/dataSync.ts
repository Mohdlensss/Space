/**
 * AI Intelligence Core - Data Synchronization
 * 
 * Fetches data from all integrations and indexes it for Ask Space.
 * This enables the AI to have real context about the user's work.
 */

import { indexDocument, getIndexStats, clearDocumentStore } from './retrieval'
import type { DocumentSource } from './types'
import { getGoogleTokens } from '@/lib/google/tokens'
import { ALL_DOO_KNOWLEDGE } from './doo-knowledge'
import { DOO_PRODUCTS } from './doo-products'

// Get Linear API key at runtime
function getLinearApiKey(): string | undefined {
  return process.env.LINEAR_API_KEY
}

interface CalendarEvent {
  id: string
  summary: string
  start: { dateTime?: string; date?: string }
  end: { dateTime?: string; date?: string }
  attendees?: { email: string; displayName?: string }[]
  location?: string
  description?: string
}

interface LinearIssue {
  id: string
  identifier: string
  title: string
  description?: string
  state: { name: string }
  priority: number
  assignee?: { name: string; email: string }
  dueDate?: string
  labels?: { nodes: { name: string }[] }
  cycle?: { name: string; startsAt: string; endsAt: string }
}

interface TeamMember {
  id: string
  full_name: string
  email: string
  role: string
  department: string
}

// Sync cache to avoid repeated syncs
const syncCache = new Map<string, { timestamp: number; result: any }>()
const SYNC_CACHE_TTL = 2 * 60 * 1000 // 2 minutes

/**
 * Sync all data sources for a user
 */
export async function syncAllDataForUser(
  userId: string,
  accessToken?: string
): Promise<{
  synced: { source: string; count: number }[]
  errors: string[]
}> {
  // Check cache first
  const cached = syncCache.get(userId)
  if (cached && Date.now() - cached.timestamp < SYNC_CACHE_TTL) {
    console.log('[Data Sync] Using cached sync result')
    return cached.result
  }

  const results: { source: string; count: number }[] = []
  const errors: string[] = []
  
  clearDocumentStore()
  console.log('[Data Sync] ====== Starting full sync ======')
  
  const linearApiKey = getLinearApiKey()
  console.log('[Data Sync] LINEAR_API_KEY configured:', !!linearApiKey)
  
  // Try to get Google tokens
  let googleToken = accessToken
  if (!googleToken) {
    try {
      const tokens = await getGoogleTokens(userId)
      if (tokens) {
        googleToken = tokens.accessToken
        console.log('[Data Sync] ✅ Found Google token in database')
      }
    } catch (e) {
      console.log('[Data Sync] Could not get Google tokens:', e)
    }
  }
  console.log('[Data Sync] Google token available:', !!googleToken)
  
  // 1. Sync Linear Issues
  if (linearApiKey) {
    try {
      const linearCount = await syncLinearIssues(userId)
      results.push({ source: 'linear', count: linearCount })
      console.log('[Data Sync] ✅ Linear synced:', linearCount, 'issues')
    } catch (error) {
      console.error('[Data Sync] Linear error:', error)
      errors.push(`Linear sync failed: ${(error as Error).message}`)
    }
  }
  
  // 2. Sync Team Info
  try {
    const teamCount = await syncTeamInfo(userId)
    results.push({ source: 'team', count: teamCount })
  } catch (error) {
    errors.push(`Team sync failed: ${(error as Error).message}`)
  }
  
  // 3. Sync Calendar Events
  if (googleToken) {
    try {
      const calendarCount = await syncCalendarEvents(userId, googleToken)
      results.push({ source: 'calendar', count: calendarCount })
      console.log('[Data Sync] ✅ Calendar synced:', calendarCount, 'events')
    } catch (error) {
      console.error('[Data Sync] Calendar error:', error)
      errors.push(`Calendar sync failed: ${(error as Error).message}`)
    }
    
    // 4. Sync Emails
    try {
      const emailCount = await syncEmails(userId, googleToken)
      results.push({ source: 'email', count: emailCount })
      console.log('[Data Sync] ✅ Email synced:', emailCount, 'messages')
    } catch (error) {
      console.error('[Data Sync] Email error:', error)
      errors.push(`Email sync failed: ${(error as Error).message}`)
    }
  }
  
  // 5. Add context
  await addContextualDocs(userId, !!googleToken)
  results.push({ source: 'context', count: 1 })
  
  // 6. Add DOO knowledge
  await addDOOKnowledge(userId)
  results.push({ source: 'doo_knowledge', count: 1 })
  
  const totalIndexed = results.reduce((sum, r) => sum + r.count, 0)
  console.log('[Data Sync] ====== Sync Complete ======')
  console.log('[Data Sync] Total indexed:', totalIndexed)
  
  const syncResult = { synced: results, errors }
  syncCache.set(userId, { timestamp: Date.now(), result: syncResult })
  
  return syncResult
}

/**
 * Sync calendar events
 */
async function syncCalendarEvents(userId: string, accessToken: string): Promise<number> {
  try {
    const now = new Date()
    const weekFromNow = new Date(now)
    weekFromNow.setDate(weekFromNow.getDate() + 7)
    
    const params = new URLSearchParams({
      timeMin: now.toISOString(),
      timeMax: weekFromNow.toISOString(),
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: '20'
    })
    
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
      {
        headers: { 'Authorization': `Bearer ${accessToken}` },
        cache: 'no-store'
      }
    )
    
    if (!response.ok) {
      console.error('[Calendar Sync] Error:', response.status)
      return 0
    }
    
    const data = await response.json()
    const events: CalendarEvent[] = data.items || []
    
    for (const event of events) {
      const startTime = event.start?.dateTime || event.start?.date || ''
      const attendees = event.attendees?.map(a => a.displayName || a.email).join(', ') || 'No attendees'
      
      const content = `📅 Calendar Event: ${event.summary || 'Untitled'}
When: ${formatDateTime(startTime)}
Attendees: ${attendees}
${event.location ? `Location: ${event.location}` : ''}
${event.description ? `Notes: ${event.description.substring(0, 200)}` : ''}`
      
      await indexDocument({
        id: `calendar-${event.id}`,
        source: 'calendar_event',
        sourceId: event.id,
        title: event.summary || 'Untitled Event',
        content,
        ownerId: userId,
        isPrivate: true,
      })
    }
    
    return events.length
  } catch (error) {
    console.error('[Calendar Sync] Error:', error)
    return 0
  }
}

/**
 * Sync emails
 */
async function syncEmails(userId: string, accessToken: string): Promise<number> {
  try {
    const response = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=15&q=in:inbox is:important OR is:unread`,
      {
        headers: { 'Authorization': `Bearer ${accessToken}` },
        cache: 'no-store'
      }
    )
    
    if (!response.ok) {
      console.error('[Email Sync] Error:', response.status)
      return 0
    }
    
    const data = await response.json()
    const messageIds = (data.messages || []).slice(0, 15)
    
    let indexed = 0
    for (const msg of messageIds) {
      try {
        const msgResponse = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
          {
            headers: { 'Authorization': `Bearer ${accessToken}` },
            cache: 'no-store'
          }
        )
        
        if (!msgResponse.ok) continue
        
        const msgData = await msgResponse.json()
        const headers = msgData.payload?.headers || []
        
        const getHeader = (name: string) => 
          headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || ''
        
        const subject = getHeader('Subject')
        const from = getHeader('From')
        const date = getHeader('Date')
        
        const content = `📧 Email: ${subject}
From: ${from}
Date: ${date}`
        
        await indexDocument({
          id: `email-${msg.id}`,
          source: 'email',
          sourceId: msg.id,
          title: subject || 'No Subject',
          content,
          ownerId: userId,
          isPrivate: true,
        })
        
        indexed++
      } catch (e) {
        // Skip individual errors
      }
    }
    
    return indexed
  } catch (error) {
    console.error('[Email Sync] Error:', error)
    return 0
  }
}

/**
 * Sync Linear issues
 */
async function syncLinearIssues(userId: string): Promise<number> {
  const apiKey = getLinearApiKey()
  if (!apiKey) return 0
  
  try {
    const response = await fetch('https://api.linear.app/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': apiKey,
      },
      body: JSON.stringify({
        query: `{
          issues(first: 30, filter: { state: { type: { nin: ["completed", "canceled"] } } }) {
            nodes {
              id
              identifier
              title
              description
              priority
              dueDate
              state { name }
              assignee { name email }
              labels { nodes { name } }
              cycle { name startsAt endsAt }
            }
          }
        }`
      }),
    })
    
    if (!response.ok) return 0
    
    const data = await response.json()
    const issues: LinearIssue[] = data.data?.issues?.nodes || []
    
    for (const issue of issues) {
      const priorityLabel = ['None', 'Urgent', 'High', 'Medium', 'Low'][issue.priority] || 'Unknown'
      const labels = issue.labels?.nodes?.map(l => l.name).join(', ') || 'No labels'
      
      const content = `📋 Linear Issue: ${issue.identifier} - ${issue.title}
Status: ${issue.state.name}
Priority: ${priorityLabel}
${issue.assignee ? `Assigned to: ${issue.assignee.name}` : 'Unassigned'}
${issue.dueDate ? `Due: ${issue.dueDate}` : ''}
${issue.cycle ? `Sprint: ${issue.cycle.name}` : ''}
Labels: ${labels}
${issue.description ? `Description: ${issue.description.substring(0, 300)}` : ''}`
      
      await indexDocument({
        id: `linear-${issue.id}`,
        source: 'linear_issue',
        sourceId: issue.id,
        title: `${issue.identifier}: ${issue.title}`,
        content,
        ownerId: userId,
        isPrivate: false, // Linear issues are org-visible
      })
    }
    
    return issues.length
  } catch (error) {
    console.error('[Linear Sync] Error:', error)
    return 0
  }
}

/**
 * Sync team info
 */
async function syncTeamInfo(userId: string): Promise<number> {
  const team = [
    { name: 'Ali Mohsen', email: 'ali@doo.ooo', role: 'CEO & Co-Founder' },
    { name: 'Mohamed Alkhabbaz', email: 'mohamed@doo.ooo', role: 'COO & Co-Founder' },
    { name: 'Hussain Haji', email: 'hh@doo.ooo', role: 'Chief Growth Officer' },
    { name: 'Hesham Alshoala', email: 'hesham@doo.ooo', role: 'VP of Digital Growth' },
    { name: 'Ali AlToblani', email: 'at@doo.ooo', role: 'Regional Director of BD' },
    { name: 'Yusuf Alhamad', email: 'yusuf@doo.ooo', role: 'Product Engineering Lead' },
    { name: 'Ahmed Haffadh', email: 'ahmedh@doo.ooo', role: 'AI Success Lead' },
    { name: 'Nawaf Haffadh', email: 'nawaf@doo.ooo', role: 'Finance Analyst' },
    { name: 'Faisal Khamdan', email: 'faisal@doo.ooo', role: 'Legal & Compliance' },
  ]
  
  const teamSummary = team.map(m => `- ${m.name} (${m.role}) - ${m.email}`).join('\n')
  
  await indexDocument({
    id: 'team-directory',
    source: 'shared_document',
    sourceId: 'team-directory',
    title: 'DOO Team Directory',
    content: `DOO Team Members:\n${teamSummary}`,
    ownerId: 'system',
    isPrivate: false,
  })
  
  return 1
}

/**
 * Add contextual docs
 */
async function addContextualDocs(userId: string, hasGoogleToken: boolean): Promise<void> {
  const now = new Date()
  const dayName = now.toLocaleDateString('en-US', { weekday: 'long' })
  const dateStr = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  
  const integrationStatus = hasGoogleToken 
    ? 'Google Calendar and Gmail are connected.'
    : 'Google Calendar and Gmail are NOT connected. Reconnect in Integrations for full access.'
  
  const content = `📆 Current Context:
Today is ${dayName}, ${dateStr}
Current time: ${now.toLocaleTimeString()}

Integration Status:
${integrationStatus}
Linear is connected.`
  
  await indexDocument({
    id: 'context-current',
    source: 'shared_document',
    sourceId: 'context',
    title: 'Current Context',
    content,
    ownerId: 'system',
    isPrivate: false,
  })
}

/**
 * Add DOO knowledge
 */
async function addDOOKnowledge(userId: string): Promise<void> {
  // HR Policies
  await indexDocument({
    id: 'doo-knowledge',
    source: 'shared_document',
    sourceId: 'doo-knowledge',
    title: 'DOO Company Policies & Information',
    content: `DOO Company Knowledge Base:\n\n${ALL_DOO_KNOWLEDGE}`,
    ownerId: 'system',
    isPrivate: false,
  })
  
  // Products & Company Info
  await indexDocument({
    id: 'doo-products',
    source: 'shared_document',
    sourceId: 'doo-products',
    title: 'DOO Products & Company Overview',
    content: DOO_PRODUCTS,
    ownerId: 'system',
    isPrivate: false,
  })
}

function formatDateTime(isoString: string): string {
  if (!isoString) return 'No date'
  try {
    const date = new Date(isoString)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  } catch {
    return isoString
  }
}
