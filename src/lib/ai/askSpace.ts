/**
 * AI Intelligence Core - Ask Space (RAG)
 * 
 * The main RAG implementation for answering user questions.
 * 
 * SECURITY FLOW:
 * 1. Build user context (permissions)
 * 2. Retrieve relevant documents (permission-filtered)
 * 3. Build prompt with ONLY permitted context
 * 4. Call LLM with strict instructions
 * 5. Return answer with sources
 */

import type {
  UserContext,
  AskSpaceRequest,
  AskSpaceResponse,
  ConversationMessage,
  DocumentChunk
} from './types'
import { openai, AI_CONFIG, SYSTEM_PROMPTS, isAIEnabled } from './config'
import { buildUserContext, logAIAccess } from './permissions'
import { retrieveDocuments, getIndexStats } from './retrieval'
import { syncAllDataForUser } from './dataSync'

// Cache for sync timestamps to avoid re-syncing on every query
const syncCache = new Map<string, number>()

/**
 * Main Ask Space function
 * This is the entry point for RAG queries
 */
export async function askSpace(request: AskSpaceRequest): Promise<AskSpaceResponse> {
  const startTime = Date.now()
  
  // Validate AI is enabled
  if (!isAIEnabled() || !openai) {
    return {
      answer: "Hmm, looks like my AI brain isn't plugged in right now 🔌 The OpenAI API key might not be configured. Check with the team!",
      sources: [],
      permissionScope: 'AI not configured',
      tokensUsed: 0,
      processingTimeMs: Date.now() - startTime
    }
  }
  
  const { query, userContext, conversationHistory = [], maxSources = AI_CONFIG.topK, providerToken } = request
  
  // Step 1: Always sync data for fresh context
  console.log('[Ask Space] Syncing data sources...')
  const syncResult = await syncAllDataForUser(userContext.userId, providerToken)
  console.log('[Ask Space] Sync complete:', JSON.stringify(syncResult, null, 2))
  
  const stats = getIndexStats()
  console.log('[Ask Space] Index stats:', JSON.stringify(stats, null, 2))
  
  // Step 2: Retrieve relevant documents with permission filtering
  const retrieval = await retrieveDocuments(query, userContext, { topK: maxSources })
  console.log('[Ask Space] Retrieved', retrieval.chunks.length, 'chunks')
  console.log('[Ask Space] Sources:', retrieval.sources.map(s => s.title).join(', '))
  
  // Step 3: Build the context from retrieved documents
  const context = buildContext(retrieval.chunks)
  console.log('[Ask Space] Context length:', context.length, 'chars')
  
  // Step 4: Build the messages array for the LLM
  const hasContext = context.length > 0 && context !== 'No relevant documents found.'
  const messages = buildMessages(query, context, conversationHistory, userContext, hasContext)
  
  // Step 5: Call the LLM with timeout protection
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 25000) // 25s timeout

    const response = await openai.chat.completions.create(
      {
        model: AI_CONFIG.chatModel,
        messages,
        temperature: AI_CONFIG.temperature,
        max_tokens: AI_CONFIG.maxResponseTokens,
        presence_penalty: AI_CONFIG.presencePenalty,
        frequency_penalty: AI_CONFIG.frequencyPenalty,
      },
      { signal: controller.signal as any }
    )

    clearTimeout(timeoutId)
    
    let answer = response.choices[0]?.message?.content || 'Unable to generate response.'
    const tokensUsed = response.usage?.total_tokens || 0

    // If we had limited/no context, ensure the answer acknowledges it and asks a follow-up
    if (!hasContext && !answer.toLowerCase().includes('context') && !answer.toLowerCase().includes('don\'t have')) {
      const followUp = generateSmartFollowUp(query)
      answer = `${answer}\n\n${followUp}`
    }
    
    // Log the access
    await logAIAccess(
      userContext.userId,
      'askSpace',
      retrieval.chunks.map(c => c.id),
      query
    )
    
    return {
      answer,
      sources: retrieval.sources,
      permissionScope: retrieval.permissionScope,
      tokensUsed,
      processingTimeMs: Date.now() - startTime
    }
  } catch (error: any) {
    console.error('[Ask Space] LLM error:', error)
    
    // If timeout, return helpful fallback
    if (error.name === 'AbortError' || error.message === 'TIMEOUT') {
      return {
        answer: "Whoa, that query took a bit too long to process ⏱️ Let me give you a quick answer based on what I have:\n\n" + 
                generateFallbackAnswer(query, userContext, hasContext) +
                `\n\nWant me to dig deeper? Try a more specific question!`,
        sources: retrieval.sources,
        permissionScope: retrieval.permissionScope,
        tokensUsed: 0,
        processingTimeMs: Date.now() - startTime
      }
    }
    
    // Re-throw to be caught by API route handler
    throw error
  }
}

/**
 * Generate a smart follow-up question when context is limited
 */
function generateSmartFollowUp(query: string): string {
  const queryLower = query.toLowerCase()
  
  if (queryLower.includes('priority') || queryLower.includes('task')) {
    return "💡 To give you better task insights, try asking: \"What Linear issues are assigned to me?\" or \"Show me my calendar for today\""
  }
  
  if (queryLower.includes('meeting') || queryLower.includes('calendar')) {
    return "💡 For calendar details, try: \"What meetings do I have today?\" Make sure Google Calendar is connected in Integrations."
  }
  
  if (queryLower.includes('email') || queryLower.includes('message')) {
    return "💡 For email insights, try: \"What important emails do I have?\" Make sure Gmail is connected in Integrations."
  }
  
  if (queryLower.includes('update') || queryLower.includes('latest') || queryLower.includes('what')) {
    return "💡 Try asking: \"What are my Linear tasks?\" or \"Summarize my calendar this week\" to get specific updates."
  }
  
  return "💡 Try asking about specific data: \"What are my tasks?\", \"Show my calendar\", or \"What emails need my attention?\""
}

/**
 * Generate a fallback answer when LLM fails or context is missing
 */
function generateFallbackAnswer(query: string, userContext: any, hasContext: boolean): string {
  const queryLower = query.toLowerCase()
  
  if (queryLower.includes('priority') || queryLower.includes('task')) {
    return `Based on your role as ${userContext.role}, I'd suggest checking your Linear board for assigned issues. ` +
           `You can also ask me: "What Linear tasks are assigned to me?"`
  }
  
  if (queryLower.includes('meeting') || queryLower.includes('calendar')) {
    return `I don't have access to your calendar right now. Make sure Google Calendar is connected in Settings → Integrations. ` +
           `Then try: "What meetings do I have today?"`
  }
  
  if (queryLower.includes('update') || queryLower.includes('latest')) {
    return `I'm limited on context right now. Here's what I can help with:\n` +
           `• Your Linear tasks (if connected)\n` +
           `• Your calendar events (if Google is connected)\n` +
           `• DOO company policies and culture\n\n` +
           `Try asking: "What are my tasks?" or "Tell me about DOO's leave policy"`
  }
  
  return `I'm Space, DOO's AI assistant! I help with tasks, calendar, emails, and company info. ` +
         `Right now my context is limited, but try asking about:\n` +
         `• Your tasks: "What Linear issues do I have?"\n` +
         `• Your schedule: "What meetings today?"\n` +
         `• DOO info: "What's the leave policy?"`
}

/**
 * Ask Space with just user ID (convenience wrapper)
 */
export async function askSpaceByUserId(
  userId: string,
  query: string,
  conversationHistory?: ConversationMessage[]
): Promise<AskSpaceResponse> {
  const userContext = await buildUserContext(userId)
  
  if (!userContext) {
    return {
      answer: 'Unable to verify your permissions. Please try again.',
      sources: [],
      permissionScope: 'Authentication required',
      tokensUsed: 0,
      processingTimeMs: 0
    }
  }
  
  return askSpace({
    query,
    userContext,
    conversationHistory
  })
}

/**
 * Build context string from document chunks
 */
function buildContext(chunks: DocumentChunk[]): string {
  if (chunks.length === 0) {
    return 'No relevant documents found.'
  }
  
  const contextParts = chunks.map((chunk, index) => {
    const sourceLabel = getSourceLabel(chunk.source)
    return `[Source ${index + 1}: ${sourceLabel}]\n${chunk.content}`
  })
  
  return contextParts.join('\n\n---\n\n')
}

/**
 * Get human-readable source label
 */
function getSourceLabel(source: string): string {
  const labels: Record<string, string> = {
    'chat_message': 'Team Chat',
    'linear_issue': 'Linear Issue',
    'calendar_event': 'Calendar',
    'email': 'Email',
    'shared_document': 'Document',
    'announcement': 'Announcement'
  }
  return labels[source] || source
}

/**
 * Build messages array for LLM
 */
function buildMessages(
  query: string,
  context: string,
  conversationHistory: ConversationMessage[],
  userContext: UserContext,
  hasContext: boolean = true
): { role: 'system' | 'user' | 'assistant'; content: string }[] {
  const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = []
  
  // Build the user profile section
  const userProfile = `
## WHO YOU'RE TALKING TO
- Name: ${userContext.email.split('@')[0].replace(/\./g, ' ')}
- Email: ${userContext.email}
- Role: ${userContext.role}
- Department: ${userContext.department}
- Is Leadership: ${userContext.isLeadership ? 'Yes - they need strategic, high-level insights' : 'No'}
- Is Manager: ${userContext.isManager ? 'Yes - they care about team performance' : 'No'}
- Channels they can see: #${userContext.channelMemberships.join(', #')}
`
  
  // System prompt with context-aware instructions
  let contextSection = ''
  if (hasContext) {
    contextSection = `
## DATA AVAILABLE FOR THIS QUERY
The following is real data from their workspace. Use it to answer their question:

---
${context}
---`
  } else {
    contextSection = `
## DATA AVAILABLE FOR THIS QUERY
⚠️ LIMITED CONTEXT: You don't have specific data retrieved for this query, but you still have your DOO company knowledge.

You should:
1. Answer based on your DOO knowledge and general guidance
2. Acknowledge the limited context clearly
3. Suggest ONE specific follow-up question they could ask to get better data
4. Be helpful and encouraging, not apologetic`
  }
  
  const systemPrompt = `${SYSTEM_PROMPTS.askSpace}

${userProfile}

${contextSection}

IMPORTANT RULES:
- ALWAYS provide a useful answer, even with limited context
- If context is missing, acknowledge it and suggest what to ask next
- Never say "I don't know" - say what you CAN help with`
  
  messages.push({ role: 'system', content: systemPrompt })
  
  // Add conversation history (limited)
  const historyLimit = 5
  const recentHistory = conversationHistory.slice(-historyLimit * 2)
  for (const msg of recentHistory) {
    messages.push({ role: msg.role, content: msg.content })
  }
  
  // Add current query
  messages.push({ role: 'user', content: query })
  
  return messages
}

/**
 * Generate suggested questions based on user context
 */
export async function getSuggestedQuestions(userContext: UserContext): Promise<string[]> {
  const suggestions: string[] = []
  
  // Common questions
  suggestions.push('What are my priorities today?')
  suggestions.push('Summarize recent team updates')
  suggestions.push("What's blocking the team?")
  
  // Role-specific questions
  if (userContext.isLeadership) {
    suggestions.push('How is team morale across departments?')
    suggestions.push('What are the key risks this quarter?')
  }
  
  if (userContext.isManager) {
    suggestions.push('What does my team need help with?')
    suggestions.push("How is the team's workload?")
  }
  
  suggestions.push('What meetings do I have today?')
  suggestions.push('Show me recent announcements')
  
  return suggestions.slice(0, 6)
}

/**
 * Quick summary generation
 */
export async function generateSummary(
  userId: string,
  type: 'today' | 'week' | 'priorities'
): Promise<AskSpaceResponse> {
  const queries: Record<string, string> = {
    today: "Summarize what's important for me today, including meetings, tasks, and any urgent messages.",
    week: "Give me a summary of this week's key activities, progress, and upcoming deadlines.",
    priorities: "What should I focus on right now? List my top priorities based on urgency and importance."
  }
  
  return askSpaceByUserId(userId, queries[type])
}

