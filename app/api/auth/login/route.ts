import { NextResponse } from 'next/server'
import { APP_CONFIG } from '@/lib/config'
import { isHttpsRequest, setAuthCookies } from '@/lib/server-auth'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const backendRes = await fetch(`${APP_CONFIG.apiBaseUrl.replace(/\/+$/, '')}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    })

    const text = await backendRes.text()
    let data: any
    try {
      data = JSON.parse(text)
    } catch {
      data = { message: text }
    }

    if (!backendRes.ok || !data?.success) {
      return NextResponse.json(data, { status: backendRes.status })
    }

    const accessToken = data?.data?.access_token
    const refreshToken = data?.data?.refresh_token
    const isHttps = isHttpsRequest(request)

    // Mask raw tokens from client-side JS exposure (stored strictly in HttpOnly cookies)
    const sanitizedData = {
      ...data,
      data: {
        ...data?.data,
        access_token: accessToken ? 'http-only-protected' : '',
        refresh_token: refreshToken ? 'http-only-protected' : '',
        email: body.email,
      },
    }

    const response = NextResponse.json(sanitizedData, { status: 200 })

    if (accessToken) {
      setAuthCookies(response, {
        accessToken,
        refreshToken,
        isHttps,
      })
    }

    return response
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Login failed to connect to authentication server' },
      { status: 500 }
    )
  }
}
