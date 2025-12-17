/**
 * AI Intelligence Core - Module Exports
 * 
 * This is the main entry point for the AI service layer.
 * Import from here for all AI-related functionality.
 */

// Configuration
export { AI_CONFIG, isAIEnabled } from './config'

// Types
export type {
  UserContext,
  PermissionScope,
  PermissionLevel,
  Document,
  DocumentChunk,
  DocumentSource,
  AskSpaceRequest,
  AskSpaceResponse,
  ConversationMessage,
  SourceReference,
  SentimentLevel,
  SentimentTrend,
  TeamInsight,
  PersonalInsight,
  OrgInsight,
  DataUsageReport
} from './types'

// Permissions
export {
  buildUserContext,
  computePermissionScope,
  canAccessDocument,
  filterDocumentsByPermission,
  describePermissionScope,
  logAIAccess,
  isLeadershipRole,
  isManagerRole
} from './permissions'

// Embeddings
export { generateEmbedding } from './embeddings'

// Retrieval
export { retrieveDocuments, clearDocumentStore, getIndexStats } from './retrieval'

// Ask Space (RAG)
export { askSpace } from './askSpace'

// Sentiment & Insights
export {
  getPersonalInsights,
  getTeamInsights,
  getOrgInsights
} from './sentiment'

// Data Sync
export {
  syncAllDataForUser
} from './dataSync'

