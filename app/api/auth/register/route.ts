import { NextResponse } from 'next/server'
import { APP_CONFIG } from '@/lib/config'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const backendRes = await fetch(`${APP_CONFIG.apiBaseUrl}/auth/register`, {
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

    return NextResponse.json(data, { status: backendRes.status })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to connect to authentication server' },
      { status: 500 }
    )
  }
}

