/**
 * AI Health Diagnostic Endpoint
 * GET /api/ai/health
 * 
 * Checks OpenAI API configuration and connectivity
 */

import { NextResponse } from 'next/server'
import { openai, AI_CONFIG, isAIEnabled } from '@/lib/ai/config'

export async function GET() {
  const health: {
    ok: boolean
    error_code?: string
    message: string
    missing_env: string[]
    model_info?: {
      chat_model: string
      embedding_model: string
    }
    api_test?: {
      success: boolean
      error?: string
    }
  } = {
    ok: false,
    message: '',
    missing_env: [],
  }

  // Check environment variables
  const required = {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_CHAT_MODEL: process.env.OPENAI_CHAT_MODEL || AI_CONFIG.chatModel,
    OPENAI_EMBEDDING_MODEL: process.env.OPENAI_EMBEDDING_MODEL || AI_CONFIG.embeddingModel,
  }

  for (const [key, value] of Object.entries(required)) {
    if (!value) {
      health.missing_env.push(key)
    }
  }

  if (health.missing_env.length > 0) {
    health.error_code = 'MISSING_ENV'
    health.message = `Missing environment variables: ${health.missing_env.join(', ')}`
    return NextResponse.json(health, { status: 503 })
  }

  health.model_info = {
    chat_model: required.OPENAI_CHAT_MODEL,
    embedding_model: required.OPENAI_EMBEDDING_MODEL,
  }

  // Test OpenAI API with minimal call
  if (!isAIEnabled() || !openai) {
    health.error_code = 'OPENAI_NOT_ENABLED'
    health.message = 'OpenAI client not initialized'
    return NextResponse.json(health, { status: 503 })
  }

  try {
    // Minimal test call with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5s timeout

    const response = await openai.chat.completions.create(
      {
        model: required.OPENAI_CHAT_MODEL,
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 5,
      },
      { signal: controller.signal as any }
    )

    clearTimeout(timeoutId)

    if (response.choices?.[0]?.message) {
      health.ok = true
      health.message = 'AI service is healthy and responding'
      health.api_test = { success: true }
    } else {
      health.error_code = 'API_INVALID_RESPONSE'
      health.message = 'OpenAI API returned invalid response'
      health.api_test = { success: false, error: 'Invalid response structure' }
    }
  } catch (error: any) {
    if (error.name === 'AbortError') {
      health.error_code = 'API_TIMEOUT'
      health.message = 'OpenAI API call timed out (>5s)'
      health.api_test = { success: false, error: 'Timeout' }
    } else if (error.response?.status === 401) {
      health.error_code = 'API_UNAUTHORIZED'
      health.message = 'OpenAI API key is invalid or expired'
      health.api_test = { success: false, error: 'Unauthorized' }
    } else if (error.response?.status === 429) {
      health.error_code = 'API_RATE_LIMIT'
      health.message = 'OpenAI API rate limit exceeded'
      health.api_test = { success: false, error: 'Rate limited' }
    } else {
      health.error_code = 'API_ERROR'
      health.message = `OpenAI API error: ${error.message || 'Unknown error'}`
      health.api_test = { success: false, error: error.message }
    }
  }

  return NextResponse.json(health, {
    status: health.ok ? 200 : 503,
  })
}

