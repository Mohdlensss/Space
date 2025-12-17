/**
 * Ask Space Streaming API
 * POST /api/ai/ask/stream
 * 
 * Returns streaming responses for real-time text display
 */

import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildUserContext } from '@/lib/ai/permissions'
import { openai, AI_CONFIG, isAIEnabled, SYSTEM_PROMPTS } from '@/lib/ai/config'
import { retrieveDocuments } from '@/lib/ai/retrieval'
import { syncAllDataForUser } from '@/lib/ai/dataSync'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    if (!isAIEnabled() || !openai) {
      return new Response(JSON.stringify({ error: 'AI not configured' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const body = await request.json()
    const { query } = body

    if (!query || typeof query !== 'string') {
      return new Response(JSON.stringify({ error: 'Query required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Get user context
    const userContext = await buildUserContext(user.id)
    if (!userContext) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Get provider token for Google APIs
    const { data: { session } } = await supabase.auth.getSession()
    const providerToken = session?.provider_token

    // Sync data sources
    await syncAllDataForUser(userContext.userId, providerToken || undefined)

    // Retrieve relevant documents
    const retrieval = await retrieveDocuments(query, userContext, { topK: 10 })
    
    // Build context
    const chunks = retrieval.chunks
    const context = chunks.length > 0 
      ? chunks.map((c, i) => `[Source ${i + 1}: ${c.source}]\n${c.content}`).join('\n\n---\n\n')
      : 'No specific context available. Use your knowledge of DOO to help.'

    // Build user profile
    const userProfile = `
## WHO YOU'RE TALKING TO
- Name: ${userContext.email.split('@')[0].replace(/[._]/g, ' ')}
- Email: ${userContext.email}
- Role: ${userContext.role}
- Department: ${userContext.department}
- Leadership: ${userContext.isLeadership ? 'Yes' : 'No'}
- Manager: ${userContext.isManager ? 'Yes' : 'No'}
`

    // Create streaming response
    const stream = await openai.chat.completions.create({
      model: AI_CONFIG.chatModel,
      stream: true,
      messages: [
        {
          role: 'system',
          content: `${SYSTEM_PROMPTS.askSpace}

${userProfile}

## CONTEXT FROM THEIR WORKSPACE
${context}

CRITICAL RULES:
- Always provide valuable, actionable insights
- Be specific with dates, names, and numbers when available
- If you don't have specific data, give smart predictions based on patterns
- Never say "I don't have access" - instead, provide intelligent guidance
- Reference specific sources when possible
- Be concise but comprehensive`
        },
        { role: 'user', content: query }
      ],
      temperature: 0.7,
      max_tokens: 1500,
    })

    // Convert to ReadableStream
    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content || ''
            if (text) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
            }
          }
          
          // Send sources at the end
          if (retrieval.sources.length > 0) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
              sources: retrieval.sources,
              done: true 
            })}\n\n`))
          } else {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`))
          }
          
          controller.close()
        } catch (error) {
          controller.error(error)
        }
      }
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    })

  } catch (error: any) {
    console.error('[Ask Space Stream] Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

