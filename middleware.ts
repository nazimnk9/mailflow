import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if session or access token cookie is present
  const hasAuthToken =
    request.cookies.has('metromail_access_token') ||
    request.cookies.get('metromail_session')?.value === 'authenticated'

  // 1. Protected routes (Customer Panel: /app/*, /dashboard/*)
  const isProtectedPath = pathname.startsWith('/app') || pathname.startsWith('/dashboard')
  if (isProtectedPath) {
    if (!hasAuthToken) {
      const response = NextResponse.redirect(new URL('/login', request.url))
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
      response.headers.set('Pragma', 'no-cache')
      response.headers.set('Expires', '0')
      return response
    }
    return NextResponse.next()
  }

  // 2. Auth routes when already logged in (/login, /signup)
  const isAuthPath = pathname === '/login' || pathname === '/signup'
  if (isAuthPath && hasAuthToken) {
    const response = NextResponse.redirect(new URL('/app/overview', request.url))
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/app/:path*',
    '/dashboard/:path*',
    '/login',
    '/signup',
  ],
}
