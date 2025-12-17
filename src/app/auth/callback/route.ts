import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/home'

  if (code) {
    const supabase = await createClient()
    const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && sessionData.session) {
      const session = sessionData.session
      const user = session.user
      
      if (user) {
        // Verify domain restriction
        if (!user.email?.endsWith('@doo.ooo')) {
          await supabase.auth.signOut()
          return NextResponse.redirect(`${origin}/auth/error?error=unauthorized_domain`)
        }
        
        // ✅ CRITICAL: Store Google OAuth tokens for API access
        if (session.provider_token) {
          console.log('[Auth] Storing Google OAuth tokens for user:', user.email)
          
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              google_access_token: session.provider_token,
              google_refresh_token: session.provider_refresh_token || null,
              google_token_expires_at: new Date(Date.now() + 3600 * 1000).toISOString(), // 1 hour from now
              updated_at: new Date().toISOString(),
            })
            .eq('id', user.id)
          
          if (updateError) {
            console.error('[Auth] Failed to store Google tokens:', updateError)
          } else {
            console.log('[Auth] ✅ Google tokens stored successfully')
          }
        }
        
        // Check if profile exists and is onboarded
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_onboarded')
          .eq('id', user.id)
          .single()
        
        // If no profile or not onboarded, redirect to onboarding
        if (!profile || !profile.is_onboarded) {
          return NextResponse.redirect(`${origin}/onboarding`)
        }
      }
      
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Return to login on error
  return NextResponse.redirect(`${origin}/auth/error?error=auth_failed`)
}


