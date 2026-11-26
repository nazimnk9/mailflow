import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { APP_CONFIG } from '@/lib/config'
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  clearAuthCookies,
  isHttpsRequest,
  refreshAccessTokenSingleFlight,
  setAuthCookies,
} from '@/lib/server-auth'

async function handleProxyRequest(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const startTime = Date.now()
  try {
    const { path } = await params
    const endpointPath = path.join('/')

    const cookieStore = await cookies()
    let accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value
    const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value

    const url = new URL(request.url)
    const backendUrl = `${APP_CONFIG.apiBaseUrl.replace(/\/+$/, '')}/${endpointPath}${url.search}`

    const baseHeaders = new Headers(request.headers)
    baseHeaders.delete('host')
    baseHeaders.delete('cookie')
    baseHeaders.delete('content-length')
    baseHeaders.delete('connection')

    // Read body once so it can be replayed cleanly if access_token needs refresh
    let bufferedBody: string | ArrayBuffer | undefined
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      const contentType = request.headers.get('content-type') || ''
      if (contentType.includes('application/json')) {
        const bodyText = await request.text()
        if (bodyText) bufferedBody = bodyText
      } else {
        const arrayBuffer = await request.arrayBuffer()
        if (arrayBuffer.byteLength > 0) bufferedBody = arrayBuffer
      }
    }

    let refreshedTokens: { accessToken: string; refreshToken?: string } | null = null
    let shouldClearCookies = false

    // If access token cookie is missing/expired but refresh token exists, refresh proactively
    if (!accessToken && refreshToken) {
      const proactive = await refreshAccessTokenSingleFlight(refreshToken)
      if (proactive.ok && proactive.accessToken) {
        accessToken = proactive.accessToken
        refreshedTokens = {
          accessToken: proactive.accessToken,
          refreshToken: proactive.refreshToken,
        }
      } else {
        shouldClearCookies = true
      }
    }

    const executeFetch = async (tokenToUse?: string) => {
      const reqHeaders = new Headers(baseHeaders)
      const clientAuth = request.headers.get('authorization')
      if (tokenToUse) {
        reqHeaders.set('Authorization', `Bearer ${tokenToUse}`)
      } else if (clientAuth) {
        reqHeaders.set('Authorization', clientAuth)
      }

      const init: RequestInit = {
        method: request.method,
        headers: reqHeaders,
      }
      if (bufferedBody !== undefined) {
        init.body = bufferedBody
      }
      return fetch(backendUrl, init)
    }

    let backendRes = await executeFetch(accessToken)

    // Automatic transparent retry on 401 using refresh_token
    if (backendRes.status === 401 && refreshToken && !refreshedTokens) {
      const refreshResult = await refreshAccessTokenSingleFlight(refreshToken)
      if (refreshResult.ok && refreshResult.accessToken) {
        refreshedTokens = {
          accessToken: refreshResult.accessToken,
          refreshToken: refreshResult.refreshToken,
        }
        backendRes = await executeFetch(refreshResult.accessToken)
      } else {
        shouldClearCookies = true
      }
    }

    const text = await backendRes.text()
    let data: any
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }

    const duration = Date.now() - startTime
    const isDev = process.env.NODE_ENV !== 'production'

    if (isDev) {
      console.log(
        `[PROXY] ${request.method} /api/proxy/${endpointPath} -> ${backendUrl} [${backendRes.status}] (${duration}ms)${
          refreshedTokens ? ' [TOKEN REFRESHED]' : ''
        }`
      )
      if (backendRes.status >= 400) {
        console.warn(`[PROXY BACKEND ERROR] ${request.method} /${endpointPath}:`, data)
      }
    }

    const responseHeaders: Record<string, string> = {}
    if (isDev) {
      responseHeaders['x-backend-url'] = backendUrl
      responseHeaders['x-backend-status'] = String(backendRes.status)
      responseHeaders['x-proxy-duration-ms'] = `${duration}ms`
    }

    const response = NextResponse.json(data, {
      status: backendRes.status,
      headers: responseHeaders,
    })

    if (refreshedTokens) {
      setAuthCookies(response, {
        accessToken: refreshedTokens.accessToken,
        refreshToken: refreshedTokens.refreshToken,
        isHttps: isHttpsRequest(request),
      })
    } else if (shouldClearCookies || (backendRes.status === 401 && !refreshToken)) {
      clearAuthCookies(response)
    }

    return response
  } catch (error: any) {
    const duration = Date.now() - startTime
    if (process.env.NODE_ENV !== 'production') {
      console.error(`[PROXY ERROR] (${duration}ms):`, error?.message || error)
    }
    return NextResponse.json(
      { success: false, message: error?.message || 'Proxy request failed' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request, context: { params: Promise<{ path: string[] }> }) {
  return handleProxyRequest(request, context)
}

export async function POST(request: Request, context: { params: Promise<{ path: string[] }> }) {
  return handleProxyRequest(request, context)
}

export async function PUT(request: Request, context: { params: Promise<{ path: string[] }> }) {
  return handleProxyRequest(request, context)
}

export async function PATCH(request: Request, context: { params: Promise<{ path: string[] }> }) {
  return handleProxyRequest(request, context)
}

export async function DELETE(request: Request, context: { params: Promise<{ path: string[] }> }) {
  return handleProxyRequest(request, context)
}
