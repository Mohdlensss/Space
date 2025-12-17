import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Do not write any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make your app
  // vulnerable to security issues.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Public routes that don't require auth
  const publicRoutes = ['/login', '/auth/callback', '/auth/error', '/api/ai/health']
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))
  
  // API routes handle their own auth - don't redirect them
  const isApiRoute = pathname.startsWith('/api/')

  // If no user and trying to access protected route (not API)
  if (!user && !isPublicRoute && !isApiRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // If user exists, enforce @doo.ooo domain restriction
  if (user) {
    const email = user.email
    if (!email || !email.endsWith('@doo.ooo')) {
      // Sign out and redirect to error
      await supabase.auth.signOut()
      const url = request.nextUrl.clone()
      url.pathname = '/auth/error'
      url.searchParams.set('error', 'unauthorized_domain')
      return NextResponse.redirect(url)
    }

    // If user is on login page, redirect to home
    if (pathname === '/login') {
      const url = request.nextUrl.clone()
      url.pathname = '/home'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}


