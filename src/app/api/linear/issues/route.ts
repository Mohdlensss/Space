import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

const LINEAR_API_URL = 'https://api.linear.app/graphql'

// Simple in-memory cache (5 minutes)
const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000

function getLinearToken(): string | null {
  return process.env.LINEAR_API_KEY || null
}

export async function GET(request: Request) {
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
          message: 'Linear API key not found.'
        },
        { status: 503 }
      )
    }

    // Check for force refresh
    const { searchParams } = new URL(request.url)
    const forceRefresh = searchParams.get('refresh') === 'true'

    // Check cache (unless force refresh)
    const cacheKey = `linear-issues-${user.id}`
    if (!forceRefresh) {
      const cached = cache.get(cacheKey)
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return NextResponse.json(cached.data)
      }
    } else {
      cache.delete(cacheKey)
    }

    // Fetch assigned issues
    const issuesQuery = `
      query {
        viewer {
          assignedIssues(
            filter: { state: { type: { neq: "completed" } } }
            first: 50
          ) {
            nodes {
              id
              identifier
              title
              description
              priority
              state {
                id
                name
                type
              }
              assignee {
                id
                name
                email
              }
              createdAt
              updatedAt
              dueDate
              url
            }
          }
        }
      }
    `

    const response = await fetch(LINEAR_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': linearToken,
      },
      body: JSON.stringify({ query: issuesQuery }),
    })

    if (!response.ok) {
      throw new Error(`Linear API error: ${response.statusText}`)
    }

    const data = await response.json()

    if (data.errors) {
      throw new Error(`Linear GraphQL error: ${data.errors[0]?.message || 'Unknown error'}`)
    }

    const issues = data.data?.viewer?.assignedIssues?.nodes || []

    // Group by status
    const byStatus = issues.reduce((acc: any, issue: any) => {
      const statusName = issue.state?.name || 'Unassigned'
      if (!acc[statusName]) {
        acc[statusName] = []
      }
      acc[statusName].push(issue)
      return acc
    }, {})

    // Get "What's Next" (Todo/Backlog) and "In Progress"
    const whatsNext = issues
      .filter((i: any) => i.state?.type === 'unstarted' || i.state?.type === 'backlog')
      .slice(0, 5)
      .map((i: any) => ({
        id: i.id,
        identifier: i.identifier,
        title: i.title,
        priority: i.priority,
        url: i.url,
      }))

    const inProgress = issues
      .filter((i: any) => i.state?.type === 'started')
      .slice(0, 5)
      .map((i: any) => ({
        id: i.id,
        identifier: i.identifier,
        title: i.title,
        priority: i.priority,
        url: i.url,
      }))

    const result = {
      connected: true,
      total: issues.length,
      byStatus,
      whatsNext,
      inProgress,
      all: issues.map((i: any) => ({
        id: i.id,
        identifier: i.identifier,
        title: i.title,
        description: i.description,
        priority: i.priority,
        state: i.state?.name,
        stateType: i.state?.type,
        dueDate: i.dueDate,
        url: i.url,
        updatedAt: i.updatedAt,
      })),
    }

    // Cache the response
    cache.set(cacheKey, { data: result, timestamp: Date.now() })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Linear issues API error:', error)
    
    return NextResponse.json(
      { 
        connected: false,
        error: 'Failed to fetch Linear issues',
        message: error.message || 'Unknown error'
      },
      { status: 500 }
    )
  }
}
