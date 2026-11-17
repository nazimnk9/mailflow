import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { APP_CONFIG } from '@/lib/config'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const backendRes = await fetch(`${APP_CONFIG.apiBaseUrl}/auth/login`, {
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

    const token = data?.data?.access_token
    const cookieStore = await cookies()
    const isHttps = request.url.startsWith('https:')

    if (token) {
      // 1. Store the secret JWT strictly in an HttpOnly cookie (inaccessible to JavaScript / XSS proof)
      cookieStore.set('metromail_access_token', token, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        secure: isHttps,
      })

      // 2. Set client session indicator (safe to read by UI, contains no secret)
      cookieStore.set('metromail_session', 'authenticated', {
        httpOnly: false,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
        secure: isHttps,
      })
    }

    // Mask the raw token from client-side JS exposure to prevent any memory or devtools snooping
    const sanitizedData = {
      ...data,
      data: {
        ...data?.data,
        access_token: token ? 'http-only-protected' : '',
        email: body.email,
      },
    }

    return NextResponse.json(sanitizedData, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Login failed to connect to authentication server' },
      { status: 500 }
    )
  }
}

