import { NextResponse } from 'next/server'
import { getGoogleTokens } from '@/lib/google/tokens'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const tokens = await getGoogleTokens(user.id)
    
    if (!tokens) {
      return NextResponse.json({
        connected: false,
        hasTokens: false,
        scopes: [],
        message: 'Google account not connected. Please reconnect to access Gmail and Calendar.',
      })
    }

    // Check if we have refresh token (indicates proper consent)
    const hasRefreshToken = !!tokens.refreshToken
    const isExpired = tokens.expiresAt ? Date.now() >= tokens.expiresAt.getTime() : false

    return NextResponse.json({
      connected: true,
      hasTokens: true,
      hasRefreshToken,
      isExpired,
      expiresAt: tokens.expiresAt,
      scopes: ['gmail.readonly', 'gmail.send', 'calendar'], // We request these, but can't verify without calling Google
      message: hasRefreshToken 
        ? 'Google account connected with full permissions.'
        : 'Google account connected, but may need re-authentication for refresh token.',
    })
  } catch (error: any) {
    console.error('Google status error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to check Google status',
        message: error.message || 'Unknown error'
      },
      { status: 500 }
    )
  }
}

