/**
 * Ask Space API Route
 * 
 * POST /api/ai/ask
 * 
 * NEVER fails silently. Always returns a response.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { askSpace } from '@/lib/ai/askSpace'
import { buildUserContext } from '@/lib/ai/permissions'
import { isAIEnabled } from '@/lib/ai/config'

// Request logging (minimal)
const requestLogs = new Map<string, { userId: string; query: string; status: string; timestamp: number }>()

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(7)}`
}

function logRequest(requestId: string, userId: string, query: string, status: string) {
  requestLogs.set(requestId, { userId, query: query.substring(0, 100), status, timestamp: Date.now() })
  // Keep only last 100 logs
  if (requestLogs.size > 100) {
    const firstKey = requestLogs.keys().next().value
    if (firstKey) requestLogs.delete(firstKey)
  }
}

export async function POST(request: NextRequest) {
  const requestId = generateRequestId()
  let userId = 'unknown'
  let query = ''

  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      logRequest(requestId, 'unknown', '', 'unauthorized')
      return NextResponse.json({
        ok: false,
        error_code: 'UNAUTHORIZED',
        message: 'Authentication required',
        request_id: requestId,
      }, { status: 401 })
    }
    
    userId = user.id

    // Check AI health first
    if (!isAIEnabled()) {
      logRequest(requestId, userId, '', 'ai_not_enabled')
      return NextResponse.json({
        ok: false,
        error_code: 'AI_NOT_ENABLED',
        message: 'AI service is not configured. Please check /api/ai/health for details.',
        request_id: requestId,
        suggestion: 'Contact IT to configure OpenAI API key',
      }, { status: 503 })
    }
    
    // Parse request body
    let body
    try {
      body = await request.json()
    } catch (e) {
      logRequest(requestId, userId, '', 'invalid_json')
      return NextResponse.json({
        ok: false,
        error_code: 'INVALID_REQUEST',
        message: 'Invalid JSON body',
        request_id: requestId,
      }, { status: 400 })
    }
    
    query = body.query || ''
    
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      logRequest(requestId, userId, '', 'missing_query')
      return NextResponse.json({
        ok: false,
        error_code: 'MISSING_QUERY',
        message: 'Query is required and cannot be empty',
        request_id: requestId,
      }, { status: 400 })
    }
    
    if (query.length > 1000) {
      logRequest(requestId, userId, query.substring(0, 50), 'query_too_long')
      return NextResponse.json({
        ok: false,
        error_code: 'QUERY_TOO_LONG',
        message: 'Query too long (max 1000 characters)',
        request_id: requestId,
      }, { status: 400 })
    }
    
    // Get user context with permissions
    let userContext
    try {
      userContext = await buildUserContext(user.id)
    } catch (ctxError) {
      console.error(`[AskSpace] [${requestId}] Failed to build user context:`, ctxError)
      logRequest(requestId, userId, query.substring(0, 50), 'context_error')
      return NextResponse.json({
        ok: false,
        error_code: 'CONTEXT_ERROR',
        message: 'Failed to build user context',
        details: (ctxError as Error).message,
        request_id: requestId,
      }, { status: 500 })
    }
    
    if (!userContext) {
      logRequest(requestId, userId, query.substring(0, 50), 'profile_not_found')
      return NextResponse.json({
        ok: false,
        error_code: 'PROFILE_NOT_FOUND',
        message: 'User profile not found. Please ensure your profile exists in the database.',
        request_id: requestId,
      }, { status: 404 })
    }
    
    // Get session for provider token (needed for Google APIs)
    const { data: { session } } = await supabase.auth.getSession()
    const providerToken = session?.provider_token
    
    // Call Ask Space with timeout protection
    let result
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30s timeout

      result = await Promise.race([
        askSpace({
          query,
          userContext,
          conversationHistory: body.conversationHistory || [],
          maxSources: body.maxSources || 10,
          providerToken: providerToken || undefined,
        }),
        new Promise((_, reject) => {
          controller.signal.addEventListener('abort', () => reject(new Error('TIMEOUT')))
        }),
      ]) as any

      clearTimeout(timeoutId)
      logRequest(requestId, userId, query.substring(0, 50), 'success')
    } catch (aiError: any) {
      console.error(`[AskSpace] [${requestId}] AI processing error:`, aiError)
      
      let errorCode = 'AI_ERROR'
      let message = 'AI processing failed'
      let statusCode = 500

      if (aiError.message === 'TIMEOUT') {
        errorCode = 'AI_TIMEOUT'
        message = 'AI response took too long (>30s). Please try a simpler query.'
        statusCode = 504
      } else if (aiError.message?.includes('OpenAI') || aiError.message?.includes('401')) {
        errorCode = 'OPENAI_AUTH_ERROR'
        message = 'OpenAI API authentication failed. Please check /api/ai/health'
        statusCode = 503
      } else if (aiError.message?.includes('rate limit') || aiError.message?.includes('429')) {
        errorCode = 'RATE_LIMIT'
        message = 'AI service is rate-limited. Please try again in a moment.'
        statusCode = 429
      }

      logRequest(requestId, userId, query.substring(0, 50), errorCode.toLowerCase())

      return NextResponse.json({
        ok: false,
        error_code: errorCode,
        message,
        details: aiError.message || 'Unknown error',
        request_id: requestId,
        suggestion: 'Try again or check /api/ai/health for system status',
      }, { status: statusCode })
    }
    
    // Always return a response, even if retrieval was empty
    return NextResponse.json({
      ok: true,
      answer: result.answer,
      sources: result.sources || [],
      queryProcessed: query,
      permissionScope: result.permissionScope || 'No scope information available',
      request_id: requestId,
      tokensUsed: result.tokensUsed || 0,
      processingTimeMs: result.processingTimeMs || 0,
    })
    
  } catch (error: any) {
    console.error(`[AskSpace] [${requestId}] Unexpected error:`, error)
    logRequest(requestId, userId, query.substring(0, 50), 'unexpected_error')
    
    return NextResponse.json({
      ok: false,
      error_code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      details: error.message || 'Unknown error',
      request_id: requestId,
      suggestion: 'Please try again or contact support',
    }, { status: 500 })
  }
}

/**
 * GET /api/ai/ask
 * Returns status and example queries
 */
export async function GET() {
  return NextResponse.json({
    status: 'ready',
    description: 'Ask Space AI - Your intelligent workspace assistant',
    exampleQueries: [
      'What are my priorities today?',
      "What's blocking the team?",
      'Summarize today',
      'What meetings do I have this week?',
      'What are the latest updates?',
    ],
    limits: {
      maxQueryLength: 1000,
      maxSourcesReturned: 10,
    },
  })
}
