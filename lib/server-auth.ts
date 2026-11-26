import { NextResponse } from 'next/server'
import { APP_CONFIG } from '@/lib/config'

export const ACCESS_TOKEN_COOKIE = 'metromail_access_token'
export const REFRESH_TOKEN_COOKIE = 'metromail_refresh_token'
export const SESSION_COOKIE = 'metromail_session'

const ACCESS_TOKEN_MAX_AGE = 60 * 60 * 24 * 7 // 7 days
const REFRESH_TOKEN_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

export interface RefreshTokenResult {
  ok: boolean
  status: number
  accessToken?: string
  refreshToken?: string
  data?: unknown
}

// Single-flight lock keyed by refresh token to prevent concurrent 401s from colliding on token rotation
const inFlightRefreshes = new Map<string, Promise<RefreshTokenResult>>()

export function isHttpsRequest(request: Request): boolean {
  const forwardedProto = request.headers.get('x-forwarded-proto') || ''
  return forwardedProto.split(',')[0].trim() === 'https' || request.url.startsWith('https:')
}

export function setAuthCookies(
  response: NextResponse,
  options: {
    accessToken: string
    refreshToken?: string
    isHttps: boolean
  }
) {
  const { accessToken, refreshToken, isHttps } = options

  response.cookies.set(ACCESS_TOKEN_COOKIE, accessToken, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: ACCESS_TOKEN_MAX_AGE,
    secure: isHttps,
  })

  if (refreshToken) {
    response.cookies.set(REFRESH_TOKEN_COOKIE, refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: REFRESH_TOKEN_MAX_AGE,
      secure: isHttps,
    })
  }

  response.cookies.set(SESSION_COOKIE, 'authenticated', {
    httpOnly: false,
    sameSite: 'lax',
    path: '/',
    maxAge: REFRESH_TOKEN_MAX_AGE,
    secure: isHttps,
  })
}

export function clearAuthCookies(response: NextResponse) {
  response.cookies.set(ACCESS_TOKEN_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
  response.cookies.set(REFRESH_TOKEN_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
  response.cookies.set(SESSION_COOKIE, '', {
    httpOnly: false,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
}

/**
 * Calls POST /api/auth/refresh-token with single-flight deduplication
 */
export async function refreshAccessTokenSingleFlight(
  refreshToken: string
): Promise<RefreshTokenResult> {
  const existing = inFlightRefreshes.get(refreshToken)
  if (existing) {
    return existing
  }

  const refreshPromise = (async (): Promise<RefreshTokenResult> => {
    try {
      const baseUrl = APP_CONFIG.apiBaseUrl.replace(/\/+$/, '')
      const backendRes = await fetch(`${baseUrl}/auth/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      })

      const text = await backendRes.text()
      let parsed: any = null
      try {
        parsed = JSON.parse(text)
      } catch {
        parsed = { message: text }
      }

      const newAccessToken = parsed?.data?.access_token
      const newRefreshToken = parsed?.data?.refresh_token

      if (!backendRes.ok || !parsed?.success || !newAccessToken) {
        return {
          ok: false,
          status: backendRes.status || 401,
          data: parsed,
        }
      }

      return {
        ok: true,
        status: 200,
        accessToken: newAccessToken,
        refreshToken: newRefreshToken || refreshToken,
        data: parsed,
      }
    } catch (err: any) {
      return {
        ok: false,
        status: 500,
        data: { success: false, message: err?.message || 'Failed to refresh token' },
      }
    } finally {
      inFlightRefreshes.delete(refreshToken)
    }
  })()

  inFlightRefreshes.set(refreshToken, refreshPromise)
  return refreshPromise
}
