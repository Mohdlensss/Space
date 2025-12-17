/**
 * Ask Space Streaming API
 * Server-Sent Events for real-time AI responses
 */

import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { askSpace } from '@/lib/ai/askSpace'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Not authenticated' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const body = await request.json()
    const { query } = body

    if (!query || typeof query !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Query required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Create streaming response
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Get AI response
          const result = await askSpace({
            query,
            userContext: {
              userId: user.id,
              email: user.email || '',
              role: 'employee',
              department: 'General',
              reportingLine: [],
              channelMemberships: [],
              isLeadership: false,
              isManager: false,
            },
            providerToken: undefined,
          })

          // Stream the response word by word for typewriter effect
          const words = result.answer.split(' ')
          
          for (let i = 0; i < words.length; i++) {
            const word = words[i] + (i < words.length - 1 ? ' ' : '')
            const data = JSON.stringify({ content: word })
            controller.enqueue(encoder.encode(`data: ${data}\n\n`))
            
            // Small delay for typewriter effect
            await new Promise(resolve => setTimeout(resolve, 30))
          }

          // Send completion signal with sources
          const doneData = JSON.stringify({ 
            done: true, 
            sources: result.sources.map(s => s.title)
          })
          controller.enqueue(encoder.encode(`data: ${doneData}\n\n`))
          
        } catch (error: any) {
          console.error('[Ask Stream] Error:', error)
          const errorData = JSON.stringify({ 
            error: true, 
            content: 'I had a moment there. Let me try again... What would you like to know?' 
          })
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`))
        } finally {
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })

  } catch (error: any) {
    console.error('[Ask Stream] Fatal error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
