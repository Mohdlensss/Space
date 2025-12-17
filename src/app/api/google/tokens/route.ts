import { NextResponse } from 'next/server'
import { getGoogleTokens } from '@/lib/google/tokens'
import { getCurrentUser } from '@/lib/auth'

/**
 * API route to check if Google tokens are available.
 * This is for debugging/verification only - never expose actual tokens to client.
 */
export async function GET() {
  const user = await getCurrentUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }
  
  const tokens = await getGoogleTokens(user.id)
  
  if (!tokens) {
    return NextResponse.json({ 
      hasTokens: false,
      message: 'No Google tokens found. User may need to re-authenticate with consent.'
    })
  }
  
  return NextResponse.json({
    hasTokens: true,
    hasRefreshToken: !!tokens.refreshToken,
    // Never expose actual tokens - just confirmation they exist
    message: 'Google tokens available for Gmail and Calendar API calls.'
  })
}


