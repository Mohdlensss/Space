import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import type { Profile } from '@/lib/database.types'

/**
 * Get the current authenticated user and their profile.
 * Returns null if not authenticated.
 */
export async function getCurrentUser() {
  const supabase = await createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return null
  }
  
  return user
}

/**
 * Get the current user's profile from the database.
 * Creates a profile if one doesn't exist (first login).
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient()
  const adminClient = await createAdminClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    return null
  }
  
  // Try to get existing profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  
  if (profile) {
    return profile as Profile
  }
  
  // Profile doesn't exist - create one
  // First, check if there's a seed for this email
  const { data: seed } = await adminClient
    .from('profile_seeds')
    .select('*')
    .eq('email', user.email)
    .single()
  
  // Get the user's name from Google auth metadata
  const googleName = user.user_metadata?.full_name || 
                     user.user_metadata?.name || 
                     user.email?.split('@')[0] || 
                     'Unknown'
  
  const newProfile: Omit<Profile, 'created_at' | 'updated_at'> = {
    id: user.id,
    email: user.email!,
    full_name: seed?.full_name || googleName,
    avatar_url: user.user_metadata?.avatar_url || null,
    role: seed?.role || 'Team Member',
    department: seed?.department || 'Unassigned',
    reports_to_id: null, // Will be set during onboarding or by admin
    focus_areas: [],
    is_onboarded: false,
  }
  
  // If we have a seed with reports_to_email, try to resolve it to an ID
  if (seed?.reports_to_email) {
    const { data: manager } = await adminClient
      .from('profiles')
      .select('id')
      .eq('email', seed.reports_to_email)
      .single()
    
    if (manager) {
      newProfile.reports_to_id = manager.id
    }
  }
  
  // Insert the new profile using admin client to bypass RLS
  const { data: createdProfile, error: createError } = await adminClient
    .from('profiles')
    .insert(newProfile)
    .select()
    .single()
  
  if (createError) {
    console.error('Failed to create profile:', createError)
    return null
  }
  
  return createdProfile as Profile
}

/**
 * Update the current user's profile.
 */
export async function updateProfile(updates: Partial<Profile>): Promise<Profile | null> {
  const supabase = await createClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    return null
  }
  
  const { data: profile, error } = await supabase
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)
    .select()
    .single()
  
  if (error) {
    console.error('Failed to update profile:', error)
    return null
  }
  
  return profile as Profile
}

/**
 * Complete onboarding for the current user.
 */
export async function completeOnboarding(data: {
  full_name: string
  avatar_url?: string
  focus_areas: string[]
}): Promise<Profile | null> {
  return updateProfile({
    full_name: data.full_name,
    avatar_url: data.avatar_url,
    focus_areas: data.focus_areas,
    is_onboarded: true,
  })
}

/**
 * Sign in with Google OAuth.
 * This is called from the client-side.
 */
export function getGoogleOAuthUrl(redirectTo: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  
  // Build OAuth URL with additional scopes for Gmail and Calendar
  const scopes = [
    'openid',
    'email',
    'profile',
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/calendar.readonly',
  ].join(' ')
  
  const params = new URLSearchParams({
    provider: 'google',
    redirect_to: redirectTo,
    scopes: scopes,
    // Request offline access for refresh tokens
    access_type: 'offline',
    // Always show consent to ensure we get refresh token
    prompt: 'consent',
  })
  
  return `${supabaseUrl}/auth/v1/authorize?${params}`
}


