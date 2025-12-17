/**
 * AI Intelligence Core - Permission-First Retrieval
 * 
 * CRITICAL: This module implements the retrieval pipeline.
 * ALL permission checks happen BEFORE any LLM call.
 * 
 * Pipeline:
 * 1. Compute permission scope
 * 2. Query documents with filters
 * 3. Filter by permissions
 * 4. Generate query embedding
 * 5. Vector similarity search on PERMITTED docs only
 * 6. Return top-k chunks with metadata
 */

import type { UserContext, DocumentChunk, DocumentSource, SourceReference } from './types'
import { filterDocumentsByPermission, computePermissionScope, logAIAccess } from './permissions'
import { generateEmbedding, cosineSimilarity } from './embeddings'
import { AI_CONFIG } from './config'

// In-memory document store (in production, use Supabase with pgvector)
interface StoredDocument {
  id: string
  content: string
  embedding?: number[]
  source: DocumentSource
  sourceId: string
  channelId?: string
  ownerId: string
  isPrivate: boolean
  department?: string
  title?: string
  url?: string
  createdAt: Date
}

// Document store (would be in Supabase in production)
const documentStore: Map<string, StoredDocument> = new Map()

/**
 * Index a document for retrieval
 * Called when new content is created
 */
export async function indexDocument(doc: {
  id: string
  content: string
  source: DocumentSource
  sourceId: string
  channelId?: string
  ownerId: string
  isPrivate: boolean
  department?: string
  title?: string
  url?: string
}): Promise<void> {
  const embedding = await generateEmbedding(doc.content)
  
  const storedDoc: StoredDocument = {
    ...doc,
    embedding: embedding || undefined,
    createdAt: new Date()
  }
  
  documentStore.set(doc.id, storedDoc)
}

/**
 * Remove a document from the index
 */
export function removeDocument(id: string): void {
  documentStore.delete(id)
}

/**
 * Clear all documents from the index
 * Call this before a full re-sync
 */
export function clearDocumentStore(): void {
  documentStore.clear()
  console.log('[Retrieval] Document store cleared')
}

/**
 * The main retrieval pipeline
 * PERMISSION-FIRST: Filters happen before vector search
 */
export async function retrieveDocuments(
  query: string,
  userContext: UserContext,
  options: {
    topK?: number
    threshold?: number
    sources?: DocumentSource[]
  } = {}
): Promise<{
  chunks: DocumentChunk[]
  sources: SourceReference[]
  permissionScope: string
}> {
  const {
    topK = 10, // Increased from 5
    threshold = 0.3, // Lowered from 0.7 to be more inclusive
    sources
  } = options
  
  // Step 1: Compute permission scope
  const scope = computePermissionScope(userContext)
  
  // Step 2: Get all documents from store
  const allDocs = Array.from(documentStore.values())
  console.log('[Retrieval] Total docs in store:', allDocs.length)
  
  // Step 3: Filter by source type if specified
  let filteredDocs = sources 
    ? allDocs.filter(doc => sources.includes(doc.source))
    : allDocs
  
  // Step 4: CRITICAL - Filter by permissions BEFORE any AI processing
  filteredDocs = filterDocumentsByPermission(userContext, filteredDocs)
  console.log('[Retrieval] Docs after permission filter:', filteredDocs.length)
  
  // For general queries like "updates", "tasks", "priorities" - just return all relevant docs
  const generalQueries = ['update', 'task', 'priority', 'todo', 'what', 'summary', 'overview']
  const isGeneralQuery = generalQueries.some(q => query.toLowerCase().includes(q))
  
  if (isGeneralQuery && filteredDocs.length > 0) {
    console.log('[Retrieval] General query detected, returning all relevant docs')
    // Return all docs sorted by recency for general queries
    const sortedDocs = filteredDocs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    const topDocs = sortedDocs.slice(0, topK)
    
    const chunks: DocumentChunk[] = topDocs.map(doc => ({
      id: doc.id,
      documentId: doc.id,
      content: doc.content,
      source: doc.source,
      sourceId: doc.sourceId,
      channelId: doc.channelId,
      ownerId: doc.ownerId,
      isPrivate: doc.isPrivate,
      createdAt: doc.createdAt,
      similarity: 1.0
    }))
    
    const sourceRefs: SourceReference[] = topDocs.map(doc => ({
      id: doc.id,
      source: doc.source,
      title: doc.title || getDefaultTitle(doc),
      snippet: doc.content.slice(0, 150) + '...',
      url: doc.url,
      relevance: 1.0
    }))
    
    return {
      chunks,
      sources: sourceRefs,
      permissionScope: describeRetrievalScope(userContext, filteredDocs.length, chunks.length)
    }
  }
  
  // Step 5: Generate query embedding for specific queries
  const queryEmbedding = await generateEmbedding(query)
  
  if (!queryEmbedding) {
    // Fallback to keyword matching if embeddings unavailable
    console.log('[Retrieval] No embedding, using keyword fallback')
    return keywordFallback(query, filteredDocs, userContext, topK)
  }
  
  // Step 6: Vector similarity search on PERMITTED docs only
  const docsWithEmbeddings = filteredDocs.filter(doc => doc.embedding)
  console.log('[Retrieval] Docs with embeddings:', docsWithEmbeddings.length)
  
  const similarities = docsWithEmbeddings.map(doc => ({
    doc,
    similarity: cosineSimilarity(queryEmbedding, doc.embedding!)
  }))
  
  // Sort and take top results (lower threshold)
  const topDocs = similarities
    .filter(s => s.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK)
  
  console.log('[Retrieval] Top docs found:', topDocs.length, 'with threshold', threshold)
  
  // Step 7: Build response
  const chunks: DocumentChunk[] = topDocs.map(({ doc, similarity }) => ({
    id: doc.id,
    documentId: doc.id,
    content: doc.content,
    source: doc.source,
    sourceId: doc.sourceId,
    channelId: doc.channelId,
    ownerId: doc.ownerId,
    isPrivate: doc.isPrivate,
    createdAt: doc.createdAt,
    similarity
  }))
  
  const sourceRefs: SourceReference[] = topDocs.map(({ doc, similarity }) => ({
    id: doc.id,
    source: doc.source,
    title: doc.title || getDefaultTitle(doc),
    snippet: doc.content.slice(0, 150) + '...',
    url: doc.url,
    relevance: similarity
  }))
  
  // Log access for audit
  await logAIAccess(
    userContext.userId,
    'retrieval',
    chunks.map(c => c.id),
    query
  )
  
  return {
    chunks,
    sources: sourceRefs,
    permissionScope: describeRetrievalScope(userContext, filteredDocs.length, chunks.length)
  }
}

/**
 * Keyword-based fallback when embeddings unavailable
 */
function keywordFallback(
  query: string,
  docs: StoredDocument[],
  userContext: UserContext,
  topK: number
): {
  chunks: DocumentChunk[]
  sources: SourceReference[]
  permissionScope: string
} {
  const queryWords = query.toLowerCase().split(/\s+/)
  
  const scored = docs.map(doc => {
    const contentLower = doc.content.toLowerCase()
    const matches = queryWords.filter(word => contentLower.includes(word)).length
    return { doc, score: matches / queryWords.length }
  })
  
  const topDocs = scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
  
  const chunks: DocumentChunk[] = topDocs.map(({ doc, score }) => ({
    id: doc.id,
    documentId: doc.id,
    content: doc.content,
    source: doc.source,
    sourceId: doc.sourceId,
    channelId: doc.channelId,
    ownerId: doc.ownerId,
    isPrivate: doc.isPrivate,
    createdAt: doc.createdAt,
    similarity: score
  }))
  
  const sources: SourceReference[] = topDocs.map(({ doc, score }) => ({
    id: doc.id,
    source: doc.source,
    title: doc.title || getDefaultTitle(doc),
    snippet: doc.content.slice(0, 150) + '...',
    url: doc.url,
    relevance: score
  }))
  
  return {
    chunks,
    sources,
    permissionScope: describeRetrievalScope(userContext, docs.length, chunks.length)
  }
}

/**
 * Generate default title for a document
 */
function getDefaultTitle(doc: StoredDocument): string {
  switch (doc.source) {
    case 'chat_message':
      return `Message in #${doc.channelId || 'channel'}`
    case 'linear_issue':
      return 'Linear Issue'
    case 'calendar_event':
      return 'Calendar Event'
    case 'email':
      return 'Email'
    case 'shared_document':
      return 'Shared Document'
    case 'announcement':
      return 'Announcement'
    default:
      return 'Document'
  }
}

/**
 * Describe what was searched for transparency
 */
function describeRetrievalScope(
  userContext: UserContext,
  totalSearched: number,
  resultsFound: number
): string {
  const scope = computePermissionScope(userContext)
  const parts: string[] = []
  
  parts.push(`Searched ${totalSearched} documents you have access to.`)
  parts.push(`Found ${resultsFound} relevant results.`)
  parts.push('')
  parts.push('Search included:')
  
  if (scope.canAccessChannels.length > 0) {
    parts.push(`• Channels: #${scope.canAccessChannels.join(', #')}`)
  }
  
  parts.push('• Your own data and shared team artifacts')
  
  parts.push('')
  parts.push('Excluded (private):')
  parts.push("• Other users' emails and DMs")
  
  return parts.join('\n')
}

/**
 * Seed the document store with some initial data
 * This would normally come from syncing with external systems
 */
export async function seedDocuments(userId: string): Promise<void> {
  // Seed some example documents for demo purposes
  const sampleDocs = [
    {
      id: 'doc-1',
      content: 'Q4 priorities include launching the new dashboard, improving performance by 20%, and completing the mobile app beta. The team should focus on user feedback integration.',
      source: 'announcement' as DocumentSource,
      sourceId: 'ann-1',
      channelId: 'announcements',
      ownerId: userId,
      isPrivate: false,
      title: 'Q4 Priorities'
    },
    {
      id: 'doc-2',
      content: 'The engineering team has completed the API refactoring. Next steps are to migrate the database and update the frontend integration. Expected completion: next week.',
      source: 'chat_message' as DocumentSource,
      sourceId: 'msg-2',
      channelId: 'engineering',
      ownerId: userId,
      isPrivate: false,
      title: 'Engineering Update'
    },
    {
      id: 'doc-3',
      content: 'Product roadmap update: We are prioritizing the AI features for Space. The goal is to have Ask Space ready by end of month. User research shows high demand for intelligent search.',
      source: 'chat_message' as DocumentSource,
      sourceId: 'msg-3',
      channelId: 'product',
      ownerId: userId,
      isPrivate: false,
      title: 'Product Roadmap'
    },
    {
      id: 'doc-4',
      content: 'Team meeting summary: Discussed blockers for the current sprint. Main issues are the dependency on external API and need for additional testing resources. Action items assigned.',
      source: 'linear_issue' as DocumentSource,
      sourceId: 'linear-4',
      ownerId: userId,
      isPrivate: false,
      title: 'Sprint Blockers'
    },
    {
      id: 'doc-5',
      content: 'Welcome to DOO! Our mission is to build the future of work. Key values: Move fast, stay focused, help each other, and always prioritize user needs.',
      source: 'shared_document' as DocumentSource,
      sourceId: 'doc-5',
      ownerId: userId,
      isPrivate: false,
      title: 'Company Values'
    }
  ]
  
  for (const doc of sampleDocs) {
    await indexDocument(doc)
  }
}

/**
 * Get statistics about indexed documents
 */
export function getIndexStats(): { total: number; bySource: Record<string, number> } {
  const docs = Array.from(documentStore.values())
  const bySource: Record<string, number> = {}
  
  for (const doc of docs) {
    bySource[doc.source] = (bySource[doc.source] || 0) + 1
  }
  
  return {
    total: docs.length,
    bySource
  }
}

