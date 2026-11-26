import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import {
  REFRESH_TOKEN_COOKIE,
  clearAuthCookies,
  isHttpsRequest,
  refreshAccessTokenSingleFlight,
  setAuthCookies,
} from '@/lib/server-auth'

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    let refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value || ''

    if (!refreshToken) {
      try {
        const body = await request.json()
        if (typeof body?.refresh_token === 'string') {
          refreshToken = body.refresh_token
        }
      } catch {
        // Empty body is fine when refresh token is in HttpOnly cookie
      }
    }

    if (!refreshToken) {
      const res = NextResponse.json(
        { success: false, message: 'Refresh token not provided.', data: null, errors: null },
        { status: 401 }
      )
      clearAuthCookies(res)
      return res
    }

    const result = await refreshAccessTokenSingleFlight(refreshToken)

    if (!result.ok || !result.accessToken) {
      const res = NextResponse.json(
        result.data || {
          success: false,
          message: 'Invalid or expired refresh token.',
          data: null,
          errors: null,
        },
        { status: result.status || 401 }
      )
      clearAuthCookies(res)
      return res
    }

    const isHttps = isHttpsRequest(request)
    const response = NextResponse.json(
      {
        success: true,
        message: 'Token refreshed.',
        data: {
          access_token: 'http-only-protected',
          refresh_token: 'http-only-protected',
        },
        errors: null,
      },
      { status: 200 }
    )

    setAuthCookies(response, {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      isHttps,
    })

    return response
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to refresh token' },
      { status: 500 }
    )
  }
}
