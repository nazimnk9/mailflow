import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { APP_CONFIG } from '@/lib/config'
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, clearAuthCookies } from '@/lib/server-auth'

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value
    let refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value || ''

    if (!refreshToken) {
      try {
        const body = await request.json()
        if (typeof body?.refresh_token === 'string') {
          refreshToken = body.refresh_token
        }
      } catch {
        // Optional body
      }
    }

    // Revoke refresh_token on backend (POST /api/auth/logout)
    if (refreshToken) {
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        }
        if (accessToken) {
          headers['Authorization'] = `Bearer ${accessToken}`
        }

        await fetch(`${APP_CONFIG.apiBaseUrl.replace(/\/+$/, '')}/auth/logout`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ refresh_token: refreshToken }),
        })
      } catch {
        // Always clear local cookies even if backend logout fails or token already expired
      }
    }

    const response = NextResponse.json({
      success: true,
      message: 'Logged out.',
      data: null,
      errors: null,
    })
    clearAuthCookies(response)
    return response
  } catch (error: any) {
    const response = NextResponse.json(
      { success: false, message: error?.message || 'Failed to logout' },
      { status: 500 }
    )
    clearAuthCookies(response)
    return response
  }
}
