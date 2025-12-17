import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

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
      return NextResponse.json({
        connected: false,
        hasToken: false,
        message: 'Linear API key not configured. Add LINEAR_API_KEY to environment variables.',
      })
    }

    // Try a simple query to verify token works
    try {
      const response = await fetch('https://api.linear.app/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': linearToken,
        },
        body: JSON.stringify({ query: '{ viewer { id name } }' }),
      })

      if (!response.ok) {
        return NextResponse.json({
          connected: false,
          hasToken: true,
          message: 'Linear token is invalid or expired.',
        })
      }

      const data = await response.json()
      
      if (data.errors) {
        return NextResponse.json({
          connected: false,
          hasToken: true,
          message: `Linear API error: ${data.errors[0]?.message || 'Unknown error'}`,
        })
      }

      return NextResponse.json({
        connected: true,
        hasToken: true,
        viewer: data.data?.viewer || null,
        message: 'Linear is connected and working.',
      })
    } catch (error: any) {
      return NextResponse.json({
        connected: false,
        hasToken: true,
        message: `Failed to verify Linear connection: ${error.message}`,
      })
    }
  } catch (error: any) {
    console.error('Linear status error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to check Linear status',
        message: error.message || 'Unknown error'
      },
      { status: 500 }
    )
  }
}

