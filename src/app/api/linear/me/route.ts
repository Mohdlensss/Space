import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

const LINEAR_API_URL = 'https://api.linear.app/graphql'

// Simple in-memory cache (2 minutes)
const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 2 * 60 * 1000

// Check for Linear token in environment
function getLinearToken(): string | null {
  return process.env.LINEAR_API_KEY || null
}

export async function GET() {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const linearToken = getLinearToken()
    
    if (!linearToken) {
      return NextResponse.json(
        { 
          connected: false,
          error: 'Linear not configured',
          message: 'Linear API key not found. Please configure LINEAR_API_KEY in environment variables.'
        },
        { status: 503 }
      )
    }

    // Check cache
    const cacheKey = `linear-me-${user.id}`
    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data)
    }

    // Fetch viewer info
    const viewerQuery = `
      query {
        viewer {
          id
          name
          email
          displayName
        }
      }
    `

    const response = await fetch(LINEAR_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': linearToken,
      },
      body: JSON.stringify({ query: viewerQuery }),
    })

    if (!response.ok) {
      throw new Error(`Linear API error: ${response.statusText}`)
    }

    const data = await response.json()

    if (data.errors) {
      throw new Error(`Linear GraphQL error: ${data.errors[0]?.message || 'Unknown error'}`)
    }

    const result = {
      connected: true,
      viewer: data.data?.viewer || null,
    }

    // Cache the response
    cache.set(cacheKey, { data: result, timestamp: Date.now() })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Linear API error:', error)
    
    return NextResponse.json(
      { 
        connected: false,
        error: 'Failed to connect to Linear',
        message: error.message || 'Unknown error'
      },
      { status: 500 }
    )
  }
}
