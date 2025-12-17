/**
 * Google OAuth Token Management
 * 
 * Handles storing, retrieving, and refreshing Google OAuth tokens
 * for Calendar, Gmail, and Drive API access.
 */

import { createClient } from '@/lib/supabase/server'

interface GoogleTokens {
  accessToken: string
  refreshToken: string | null
  expiresAt: Date | null
}

/**
 * Get Google tokens for a user, refreshing if expired
 */
export async function getGoogleTokens(userId: string): Promise<GoogleTokens | null> {
  const supabase = await createClient()
  
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('google_access_token, google_refresh_token, google_token_expires_at')
    .eq('id', userId)
    .single()
  
  if (error || !profile?.google_access_token) {
    console.log('[Google Tokens] No tokens found for user:', userId)
    return null
  }
  
  const expiresAt = profile.google_token_expires_at 
    ? new Date(profile.google_token_expires_at) 
    : null
  
  // Check if token is expired or about to expire (5 min buffer)
  const isExpired = expiresAt && expiresAt.getTime() < Date.now() + 5 * 60 * 1000
  
  if (isExpired && profile.google_refresh_token) {
    console.log('[Google Tokens] Token expired, refreshing...')
    const refreshed = await refreshGoogleToken(userId, profile.google_refresh_token)
    if (refreshed) {
      return refreshed
    }
    // If refresh failed, return null - user needs to re-auth
    console.log('[Google Tokens] Refresh failed, user needs to re-authenticate')
    return null
  }
  
  return {
    accessToken: profile.google_access_token,
    refreshToken: profile.google_refresh_token,
    expiresAt
  }
}

/**
 * Refresh Google access token using refresh token
 */
async function refreshGoogleToken(userId: string, refreshToken: string): Promise<GoogleTokens | null> {
  try {
    // Google's token endpoint
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Google Tokens] Refresh failed:', errorText)
      return null
    }
    
    const data = await response.json()
    const newExpiresAt = new Date(Date.now() + data.expires_in * 1000)
    
    // Store the new access token
    const supabase = await createClient()
    await supabase
      .from('profiles')
      .update({
        google_access_token: data.access_token,
        google_token_expires_at: newExpiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
    
    console.log('[Google Tokens] ✅ Token refreshed successfully')
    
    return {
      accessToken: data.access_token,
      refreshToken: refreshToken,
      expiresAt: newExpiresAt
    }
  } catch (error) {
    console.error('[Google Tokens] Error refreshing token:', error)
    return null
  }
}

/**
 * Check if user has valid Google tokens
 */
export async function hasValidGoogleTokens(userId: string): Promise<boolean> {
  const tokens = await getGoogleTokens(userId)
  return tokens !== null
}

/**
 * Clear Google tokens (for disconnect/re-auth)
 */
export async function clearGoogleTokens(userId: string): Promise<void> {
  const supabase = await createClient()
  await supabase
    .from('profiles')
    .update({
      google_access_token: null,
      google_refresh_token: null,
      google_token_expires_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
}

/**
 * Helper to make authenticated Google API requests
 */
export async function googleFetch(
  userId: string,
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const tokens = await getGoogleTokens(userId)
  
  if (!tokens) {
    throw new Error('Google not connected')
  }
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${tokens.accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  
  return response
}
