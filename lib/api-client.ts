import { APP_CONFIG } from '@/lib/config'
import { authToken } from '@/lib/auth-token'

export class ApiError extends Error {
  public status: number
  public errors?: string
  public data?: unknown

  constructor(message: string, status: number, errors?: string, data?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors
    this.data = data
  }
}

type RequestOptions = RequestInit & {
  params?: Record<string, string | number | boolean | undefined>
  skipAuth?: boolean
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { params, skipAuth = false, headers, ...customConfig } = options

  const cleanEndpoint = endpoint.replace(/^\/+/, '')
  let url: string

  if (typeof window !== 'undefined') {
    // In browser: route through Next.js BFF server routes for maximum HttpOnly cookie protection
    if (cleanEndpoint.startsWith('auth/')) {
      url = `/api/${cleanEndpoint}`
    } else {
      url = `/api/proxy/${cleanEndpoint}`
    }
  } else {
    // In server environment: route directly to backend API
    const baseUrl = APP_CONFIG.apiBaseUrl.replace(/\/+$/, '')
    url = `${baseUrl}/${cleanEndpoint}`
  }

  if (params) {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined) searchParams.append(key, String(val))
    })
    const queryString = searchParams.toString()
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString
    }
  }

  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }

  // Include direct token if available in fallback or non-HttpOnly context
  const token = skipAuth ? null : authToken.get()
  if (token && token !== 'http-only-cookie-active' && token !== 'http-only-protected') {
    ;(defaultHeaders as Record<string, string>)['Authorization'] = `Bearer ${token}`
  }

  const config: RequestInit = {
    ...customConfig,
    credentials: 'same-origin',
    headers: {
      ...defaultHeaders,
      ...headers,
    },
  }

  try {
    const response = await fetch(url, config)
    let json: any = null

    const text = await response.text()
    if (text) {
      try {
        json = JSON.parse(text)
      } catch {
        json = { message: text }
      }
    }

    if (!response.ok) {
      const errorMessage =
        json?.message ||
        json?.errors ||
        json?.detail ||
        `Request failed with status ${response.status}`
      throw new ApiError(errorMessage, response.status, json?.errors, json?.data)
    }

    return json as T
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    const message = error instanceof Error ? error.message : 'A network error occurred'
    throw new ApiError(message, 0)
  }
}
