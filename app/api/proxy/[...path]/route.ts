import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { APP_CONFIG } from '@/lib/config'

async function handleProxyRequest(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params
    const endpointPath = path.join('/')

    const cookieStore = await cookies()
    const token = cookieStore.get('metromail_access_token')?.value

    const url = new URL(request.url)
    const backendUrl = `${APP_CONFIG.apiBaseUrl.replace(/\/+$/, '')}/${endpointPath}${url.search}`

    const headers = new Headers(request.headers)
    headers.delete('host')
    headers.delete('cookie')
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }

    const init: RequestInit = {
      method: request.method,
      headers,
    }

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      const contentType = request.headers.get('content-type') || ''
      if (contentType.includes('application/json')) {
        const bodyText = await request.text()
        if (bodyText) init.body = bodyText
      } else {
        const arrayBuffer = await request.arrayBuffer()
        if (arrayBuffer.byteLength > 0) init.body = arrayBuffer
      }
    }

    const backendRes = await fetch(backendUrl, init)
    const text = await backendRes.text()

    let data: any
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }

    return NextResponse.json(data, { status: backendRes.status })
  } catch (error: any) {
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

