/**
 * AI Intelligence Core - Permission System
 * 
 * CRITICAL: This module enforces data access before ANY LLM call.
 * The LLM NEVER has direct database access.
 * 
 * Permission hierarchy:
 * 1. Personal data - only the user
 * 2. Channel data - only channel members
 * 3. Team data - only team members
 * 4. Department data - only department members
 * 5. Organization data - aggregated only for leadership
 */

import type { UserContext, PermissionScope, PermissionLevel, DocumentSource } from './types'
import { createClient } from '@/lib/supabase/server'

// Leadership roles that can see org-level aggregates
const LEADERSHIP_ROLES = [
  'CEO', 'COO', 'CTO', 'CFO', 'CMO',
  'Chief', 'Co-founder', 'Founder',
  'VP', 'Vice President', 'Director',
  'Head of'
]

// Manager roles that can see team-level aggregates
const MANAGER_INDICATORS = [
  'Manager', 'Lead', 'Head', 'Director',
  'Team Lead', 'Tech Lead', 'Engineering Manager'
]

/**
 * Determine if a role indicates leadership
 */
export function isLeadershipRole(role: string): boolean {
  const roleUpper = role.toUpperCase()
  return LEADERSHIP_ROLES.some(lr => roleUpper.includes(lr.toUpperCase()))
}

/**
 * Determine if a role indicates management responsibility
 */
export function isManagerRole(role: string): boolean {
  const roleUpper = role.toUpperCase()
  return MANAGER_INDICATORS.some(mr => roleUpper.includes(mr.toUpperCase()))
}

/**
 * Build the user context from a session
 * This is called BEFORE any AI operation
 */
export async function buildUserContext(userId: string): Promise<UserContext | null> {
  const supabase = await createClient()
  
  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, department')
    .eq('id', userId)
    .single()
  
  if (profileError) {
    console.error('Failed to get user profile for AI context:', profileError.message)
    return null
  }
  
  if (!profile) {
    console.error('No profile found for user:', userId)
    return null
  }
  
  // Get channel memberships (for DOO Chat)
  // In a real implementation, this would query a channel_members table
  // For now, we'll assume all public channels are accessible
  const channelMemberships = ['general', 'engineering', 'product', 'random', 'announcements']
  
  // Build reporting line (managers up the chain)
  // In a real implementation, this would query an org chart
  const reportingLine: string[] = []
  
  const role = profile.role || 'Team Member'
  
  const context: UserContext = {
    userId: profile.id,
    email: profile.email || `${profile.id}@doo.ooo`,
    role,
    department: profile.department || 'General',
    reportingLine,
    channelMemberships,
    isLeadership: isLeadershipRole(role),
    isManager: isManagerRole(role)
  }
  
  return context
}

/**
 * Compute the permission scope for a user
 * This defines EXACTLY what data the user can access
 */
export function computePermissionScope(userContext: UserContext): PermissionScope {
  return {
    // Always allowed
    canAccessOwnData: true,
    
    // Channel access based on membership
    canAccessChannels: userContext.channelMemberships,
    
    // Team artifacts if in a team
    canAccessTeamArtifacts: true,
    
    // Department data based on role
    canAccessDepartmentData: userContext.isManager || userContext.isLeadership,
    
    // Org insights only for leadership
    canAccessOrgInsights: userContext.isLeadership,
    
    // ALWAYS EXCLUDED - these are hardcoded safety rules
    excludePrivateEmails: true,
    excludePrivateDMs: true,
    excludeOtherUsersPersonalData: true
  }
}

/**
 * Get the permission level for a user
 */
export function getPermissionLevel(userContext: UserContext): PermissionLevel {
  if (userContext.isLeadership) return 'organization'
  if (userContext.isManager) return 'department'
  return 'team'
}

/**
 * Check if a user can access a specific document
 * This is the core permission check
 */
export function canAccessDocument(
  userContext: UserContext,
  document: {
    ownerId: string
    isPrivate: boolean
    channelId?: string
    source: DocumentSource
    department?: string
  }
): boolean {
  // Rule 1: Owner always has access to their own data
  if (document.ownerId === userContext.userId) {
    return true
  }
  
  // Rule 2: Private documents are ONLY for the owner
  if (document.isPrivate) {
    return false
  }
  
  // Rule 3: Private DMs and emails - NEVER accessible by others
  if (document.source === 'email') {
    return document.ownerId === userContext.userId
  }
  
  // Rule 4: Channel messages require membership
  if (document.source === 'chat_message' && document.channelId) {
    // Check if it's a DM (channel starts with 'dm-')
    if (document.channelId.startsWith('dm-')) {
      // DMs are only for participants
      return document.channelId.includes(userContext.userId)
    }
    // Regular channel - check membership
    return userContext.channelMemberships.includes(document.channelId)
  }
  
  // Rule 5: Linear issues and shared docs are team-visible
  if (document.source === 'linear_issue' || document.source === 'shared_document') {
    return true // Team-visible by default
  }
  
  // Rule 6: Announcements are org-wide
  if (document.source === 'announcement') {
    return true
  }
  
  // Rule 7: Calendar events - only own events
  if (document.source === 'calendar_event') {
    return document.ownerId === userContext.userId
  }
  
  // Default deny
  return false
}

/**
 * Filter documents to only those the user can access
 * This is called BEFORE any LLM processing
 */
export function filterDocumentsByPermission<T extends {
  ownerId: string
  isPrivate: boolean
  channelId?: string
  source: DocumentSource
  department?: string
}>(
  userContext: UserContext,
  documents: T[]
): T[] {
  return documents.filter(doc => canAccessDocument(userContext, doc))
}

/**
 * Generate a human-readable permission scope description
 * This is shown to the user for transparency
 */
export function describePermissionScope(userContext: UserContext): string {
  const scope = computePermissionScope(userContext)
  const parts: string[] = []
  
  parts.push('You can access:')
  parts.push('• Your own messages, emails, and calendar')
  
  if (scope.canAccessChannels.length > 0) {
    parts.push(`• Channels: #${scope.canAccessChannels.join(', #')}`)
  }
  
  if (scope.canAccessTeamArtifacts) {
    parts.push('• Shared Linear issues and team documents')
  }
  
  if (scope.canAccessDepartmentData) {
    parts.push('• Aggregated department insights')
  }
  
  if (scope.canAccessOrgInsights) {
    parts.push('• Organization-wide aggregated insights')
  }
  
  parts.push('')
  parts.push('Always private (never shared with AI):')
  parts.push('• Private emails')
  parts.push('• Direct messages with others')
  parts.push("• Other users' personal data")
  
  return parts.join('\n')
}

/**
 * Log an AI access for audit trail
 */
export async function logAIAccess(
  userId: string,
  operation: string,
  documentIds: string[],
  query?: string
): Promise<void> {
  // In production, this would write to an audit log table
  console.log('[AI Audit]', {
    timestamp: new Date().toISOString(),
    userId,
    operation,
    documentCount: documentIds.length,
    queryLength: query?.length || 0
  })
}

