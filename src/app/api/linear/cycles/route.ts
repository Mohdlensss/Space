import { NextResponse } from 'next/server'

// Simple cache
const cache = new Map<string, { data: any; expires: number }>()

export async function GET() {
  const apiKey = process.env.LINEAR_API_KEY
  
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Linear API key not configured', code: 'NOT_CONFIGURED' },
      { status: 503 }
    )
  }
  
  try {
    // Check cache
    const cacheKey = 'linear-cycles'
    const cached = cache.get(cacheKey)
    if (cached && cached.expires > Date.now()) {
      return NextResponse.json({ ...cached.data, cached: true })
    }
    
    const response = await fetch('https://api.linear.app/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': apiKey,
      },
      body: JSON.stringify({
        query: `
          query {
            cycles(filter: { isActive: { eq: true } }, first: 5) {
              nodes {
                id
                name
                number
                startsAt
                endsAt
                completedAt
                progress
                team {
                  name
                  key
                }
              }
            }
          }
        `,
      }),
    })
    
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch Linear cycles', code: 'API_ERROR' },
        { status: response.status }
      )
    }
    
    const data = await response.json()
    const cycles = data.data?.cycles?.nodes || []
    
    // Cache for 5 minutes
    cache.set(cacheKey, {
      data: { cycles },
      expires: Date.now() + 5 * 60 * 1000,
    })
    
    return NextResponse.json({ cycles, cached: false })
  } catch (error: any) {
    console.error('Linear cycles route error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch Linear cycles', code: 'UNKNOWN_ERROR' },
      { status: 500 }
    )
  }
}
