/**
 * AI Intelligence Core - Type Definitions
 * 
 * SECURITY: These types enforce the permission model.
 * LLM never has direct database access.
 */

// ============ USER CONTEXT ============

export interface UserContext {
  userId: string
  email: string
  role: string
  department: string
  reportingLine: string[] // User IDs of managers up the chain
  channelMemberships: string[] // Channel IDs the user belongs to
  isLeadership: boolean
  isManager: boolean
}

// ============ PERMISSION SCOPE ============

export type PermissionLevel = 'personal' | 'team' | 'department' | 'organization'

export interface PermissionScope {
  // What the user can access
  canAccessOwnData: true // Always true
  canAccessChannels: string[] // Channel IDs
  canAccessTeamArtifacts: boolean // Linear issues, shared docs
  canAccessDepartmentData: boolean
  canAccessOrgInsights: boolean // Aggregated only
  
  // Explicit exclusions
  excludePrivateEmails: true // Always exclude
  excludePrivateDMs: true // Always exclude unless own
  excludeOtherUsersPersonalData: true // Always exclude
}

// ============ DOCUMENT TYPES ============

export type DocumentSource = 
  | 'chat_message'
  | 'linear_issue'
  | 'calendar_event'
  | 'email' // Only user's own, already classified
  | 'shared_document'
  | 'announcement'

export interface Document {
  id: string
  content: string
  source: DocumentSource
  sourceId: string // Original ID in source system
  channelId?: string
  ownerId: string
  isPrivate: boolean
  department?: string
  createdAt: Date
  metadata: Record<string, unknown>
}

export interface DocumentChunk {
  id: string
  documentId: string
  content: string
  embedding?: number[]
  source: DocumentSource
  sourceId: string
  channelId?: string
  ownerId: string
  isPrivate: boolean
  createdAt: Date
  similarity?: number // Set during retrieval
}

// ============ ASK SPACE ============

export interface AskSpaceRequest {
  query: string
  userContext: UserContext
  conversationHistory?: ConversationMessage[]
  maxSources?: number
  providerToken?: string // Google OAuth token for accessing Calendar/Gmail
}

export interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface AskSpaceResponse {
  answer: string
  sources: SourceReference[]
  permissionScope: string // Human-readable explanation
  tokensUsed: number
  processingTimeMs: number
}

export interface SourceReference {
  id: string
  source: DocumentSource
  title: string
  snippet: string
  url?: string
  relevance: number // 0-1 score
}

// ============ SENTIMENT & INSIGHTS ============

export type SentimentLevel = 'very_positive' | 'positive' | 'neutral' | 'negative' | 'very_negative'

export interface SentimentTrend {
  period: string // e.g., "last_7_days"
  overallSentiment: SentimentLevel
  score: number // -1 to 1
  trend: 'improving' | 'stable' | 'declining'
  sampleSize: number // How many data points
}

export interface TeamInsight {
  teamId: string
  teamName: string
  period: string
  
  // Aggregated metrics only - no individual data
  moodTrend: SentimentTrend
  collaborationHealth: number // 0-100
  workloadIndicator: 'balanced' | 'heavy' | 'light'
  frictionSignals: string[] // High-level themes, no names
  
  // NEVER include:
  // - Individual sentiment scores
  // - Who said what
  // - Personal attribution
}

export interface PersonalInsight {
  userId: string
  period: string
  
  // Personal data - visible only to the user
  myMoodTrend: SentimentTrend
  myWorkloadEstimate: 'balanced' | 'heavy' | 'light'
  myTopPriorities: string[]
  myRecentAchievements: string[]
  suggestedFocus: string[]
}

export interface OrgInsight {
  period: string
  
  // Organization-wide aggregates only
  overallMorale: SentimentTrend
  crossTeamCollaboration: number // 0-100
  topOrgThemes: string[] // What's being discussed
  alertIndicators: string[] // High-level concerns, no attribution
}

// ============ DATA TRANSPARENCY ============

export interface DataUsageReport {
  userId: string
  generatedAt: Date
  
  // What Space knows
  dataCategories: {
    category: string
    description: string
    examples: string[]
    isPrivate: boolean
    usedForInsights: boolean
  }[]
  
  // User's permissions
  whatYouCanAccess: string[]
  whatIsPrivate: string[]
  whatIsAggregated: string[]
  
  // Opt-out status
  optedOutOfSentiment: boolean
}

