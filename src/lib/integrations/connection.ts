import { createClient } from '@/lib/supabase/server'
import { getGoogleTokens } from '@/lib/google/tokens'

export interface ConnectionStatus {
  connected: boolean
  lastSync?: string
  error?: string
}

/**
 * Check if user has Google OAuth with Gmail + Calendar scopes
 */
export async function checkGoogleConnection(userId: string): Promise<ConnectionStatus> {
  try {
    const tokens = await getGoogleTokens(userId)
    
    if (!tokens || !tokens.accessToken) {
      return {
        connected: false,
        error: 'No Google tokens found. Please reconnect your Google account.',
      }
    }
    
    // Test if we can actually access Gmail API (lightweight check)
    try {
      const testResponse = await fetch(
        'https://gmail.googleapis.com/gmail/v1/users/me/profile',
        {
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
          },
        }
      )
      
      if (testResponse.status === 401 || testResponse.status === 403) {
        return {
          connected: false,
          error: 'Token expired or insufficient permissions. Please reconnect.',
        }
      }
      
      if (!testResponse.ok) {
        return {
          connected: false,
          error: 'Unable to verify Google connection.',
        }
      }
      
      return {
        connected: true,
        lastSync: new Date().toISOString(),
      }
    } catch (error) {
      return {
        connected: false,
        error: 'Failed to verify Google connection.',
      }
    }
  } catch (error) {
    return {
      connected: false,
      error: 'Google connection check failed.',
    }
  }
}

/**
 * Check if Linear is connected
 * This checks if we have Linear API key configured and can make requests
 */
export async function checkLinearConnection(): Promise<ConnectionStatus> {
  // For now, we'll check if the API key exists in environment
  // In the future, we could store Linear tokens per user
  const linearApiKey = process.env.LINEAR_API_KEY
  
  if (!linearApiKey) {
    return {
      connected: false,
      error: 'Linear API key not configured.',
    }
  }
  
  // Test Linear API connection
  try {
    const response = await fetch('https://api.linear.app/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: linearApiKey,
      },
      body: JSON.stringify({
        query: '{ viewer { id name } }',
      }),
    })
    
    if (response.status === 401 || response.status === 403) {
      return {
        connected: false,
        error: 'Linear API key invalid. Please check configuration.',
      }
    }
    
    if (!response.ok) {
      return {
        connected: false,
        error: 'Unable to connect to Linear.',
      }
    }
    
    return {
      connected: true,
      lastSync: new Date().toISOString(),
    }
  } catch (error) {
    return {
      connected: false,
      error: 'Linear connection check failed.',
    }
  }
}

/**
 * Check if user's session has the required Google scopes
 */
export async function checkGoogleScopes(userId: string): Promise<{
  hasGmail: boolean
  hasCalendar: boolean
  hasAll: boolean
}> {
  const tokens = await getGoogleTokens(userId)
  
  if (!tokens) {
    return { hasGmail: false, hasCalendar: false, hasAll: false }
  }
  
  // Test Gmail scope
  let hasGmail = false
  try {
    const gmailTest = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/profile',
      {
        headers: { Authorization: `Bearer ${tokens.accessToken}` },
      }
    )
    hasGmail = gmailTest.ok
  } catch {
    hasGmail = false
  }
  
  // Test Calendar scope
  let hasCalendar = false
  try {
    const calendarTest = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary',
      {
        headers: { Authorization: `Bearer ${tokens.accessToken}` },
      }
    )
    hasCalendar = calendarTest.ok
  } catch {
    hasCalendar = false
  }
  
  return {
    hasGmail,
    hasCalendar,
    hasAll: hasGmail && hasCalendar,
  }
}

/**
 * Get all integration statuses for a user
 */
export async function getAllIntegrationStatuses(userId: string): Promise<{
  google: ConnectionStatus
  linear: ConnectionStatus
}> {
  const [google, linear] = await Promise.all([
    checkGoogleConnection(userId),
    checkLinearConnection(),
  ])
  
  return { google, linear }
}
