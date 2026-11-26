import { APP_CONFIG } from '@/lib/config'
import { authToken } from '@/lib/auth-token'

/**
 * Recursively parses and extracts human-readable error messages from nested objects/arrays.
 * Handles FastAPI, Django/DRF, Laravel, Express, etc.
 */
function parseNestedErrors(val: any): string | null {
  if (!val) return null

  // 1. Primitive string
  if (typeof val === 'string') {
    const trimmed = val.trim()
    return trimmed && trimmed !== '[object Object]' ? trimmed : null
  }

  // 2. Array of errors (e.g. ["This domain is already registered."], or FastAPI detail array)
  if (Array.isArray(val)) {
    const messages: string[] = []
    for (const item of val) {
      if (typeof item === 'string') {
        const trimmed = item.trim()
        if (trimmed && trimmed !== '[object Object]') messages.push(trimmed)
      } else if (item && typeof item === 'object') {
        if (typeof item.msg === 'string') {
          // FastAPI / Pydantic validation error: { loc: ["body", "name"], msg: "..." }
          const field = Array.isArray(item.loc)
            ? item.loc.filter((p: any) => p !== 'body').join('.')
            : ''
          messages.push(field ? `${field}: ${item.msg}` : item.msg)
        } else if (typeof item.message === 'string') {
          messages.push(item.message)
        } else {
          const sub = parseNestedErrors(item)
          if (sub) messages.push(sub)
        }
      }
    }
    return messages.filter(Boolean).join(', ') || null
  }

  // 3. Object with field errors (e.g. { name: ["This domain is already registered."] })
  if (typeof val === 'object') {
    // If it is a JS Error instance, return its message
    if (val instanceof Error) {
      return val.message || null
    }

    const messages: string[] = []
    const entries = Object.entries(val)

    for (const [key, subVal] of entries) {
      // Skip internal technical properties only
      if (['stack', 'statusCode', 'status'].includes(key) && typeof subVal !== 'string') {
        continue
      }

      if (typeof subVal === 'string') {
        const trimmed = subVal.trim()
        if (!trimmed || trimmed === '[object Object]') continue
        if (['detail', 'message', 'error', 'errors', 'msg', '0'].includes(key.toLowerCase())) {
          messages.push(trimmed)
        } else if (entries.length === 1) {
          // Single field error (e.g. { name: "This domain is already registered." }) -> show the message directly
          messages.push(trimmed)
        } else {
          messages.push(`${key}: ${trimmed}`)
        }
      } else if (Array.isArray(subVal)) {
        const subMessages = subVal
          .map((item) => (typeof item === 'string' ? item.trim() : parseNestedErrors(item)))
          .filter((msg): msg is string => Boolean(msg && msg !== '[object Object]'))

        if (subMessages.length > 0) {
          const joined = subMessages.join(', ')
          if (['detail', 'message', 'error', 'errors', 'msg', '0'].includes(key.toLowerCase())) {
            messages.push(joined)
          } else if (entries.length === 1) {
            // Single field (e.g. { name: ["This domain is already registered."] }) -> show the exact message!
            messages.push(joined)
          } else {
            messages.push(`${key}: ${joined}`)
          }
        }
      } else if (subVal && typeof subVal === 'object') {
        const sub = parseNestedErrors(subVal)
        if (sub) {
          if (
            entries.length === 1 ||
            ['detail', 'message', 'error', 'errors', 'msg'].includes(key.toLowerCase())
          ) {
            messages.push(sub)
          } else {
            messages.push(`${key}: ${sub}`)
          }
        }
      }
    }

    return messages.filter(Boolean).join(' | ') || null
  }

  return null
}

/**
 * Extracts a guaranteed human-readable string error from any error object, API response, or exception.
 * Prioritizes the REAL backend root-cause reason (e.g. from `errors` or `detail`) over generic messages like "Validation failed."
 */
export function formatApiErrorMessage(
  err: unknown,
  fallback = 'An unexpected error occurred'
): string {
  if (!err) return fallback

  // 1. Primitive string
  if (typeof err === 'string') {
    const trimmed = err.trim()
    if (trimmed && trimmed !== '[object Object]') return trimmed
    return fallback
  }

  if (typeof err === 'object') {
    const errorObj = err as any

    // 2. First check specific field-level errors (e.g. { errors: { name: ["This domain is already registered."] } })
    // This gives the exact, granular reason why the request was rejected!
    if (errorObj.errors) {
      const parsedErrors = parseNestedErrors(errorObj.errors)
      if (parsedErrors) {
        return parsedErrors
      }
    }

    // 3. Next check FastAPI style detail
    if (errorObj.detail) {
      const parsedDetail = parseNestedErrors(errorObj.detail)
      if (parsedDetail) {
        return parsedDetail
      }
    }

    // 4. Check if errorObj has an explicit message (e.g. "Validation failed.")
    // If message is generic (like "Validation failed." or "Request failed"), prioritize field-level errors
    if (typeof errorObj.message === 'string') {
      const msg = errorObj.message.trim()
      const isGeneric =
        !msg ||
        msg === '[object Object]' ||
        /^(validation\s*(failed|error)|request\s*failed|bad\s*request|error)$/i.test(msg)

      if (!isGeneric) {
        return msg
      }
    }

    // 5. Try parsing the object directly
    const directParsed = parseNestedErrors(errorObj)
    if (directParsed) {
      return directParsed
    }

    // 6. If message was generic and nothing else yielded, return message if available
    if (
      typeof errorObj.message === 'string' &&
      errorObj.message.trim() &&
      errorObj.message !== '[object Object]'
    ) {
      return errorObj.message.trim()
    }
  }

  return fallback
}

export class ApiError extends Error {
  public status: number
  public errors?: string
  public data?: unknown

  constructor(message: string, status: number, errors?: string, data?: unknown) {
    const cleanMessage = formatApiErrorMessage(message)
    super(cleanMessage)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors ? formatApiErrorMessage(errors) : cleanMessage
    this.data = data
  }
}

type RequestOptions = RequestInit & {
  params?: Record<string, string | number | boolean | undefined>
  skipAuth?: boolean
  _retriedAfterRefresh?: boolean
}

let clientRefreshPromise: Promise<boolean> | null = null

async function refreshClientSession(): Promise<boolean> {
  if (typeof window === 'undefined') return false
  if (clientRefreshPromise) return clientRefreshPromise

  clientRefreshPromise = (async () => {
    try {
      const res = await fetch('/api/auth/refresh-token', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { Accept: 'application/json' },
      })
      if (!res.ok) return false
      const json = await res.json().catch(() => null)
      return Boolean(json?.success)
    } catch {
      return false
    } finally {
      clientRefreshPromise = null
    }
  })()

  return clientRefreshPromise
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { params, skipAuth = false, _retriedAfterRefresh = false, headers, ...customConfig } = options

  const cleanEndpoint = endpoint.replace(/^\/+/, '')
  let url: string

  if (typeof window !== 'undefined') {
    // In browser: route cookie-managing auth requests through custom Next.js BFF routes,
    // and all other API calls through the secure proxy (which automatically attaches HttpOnly JWT)
    const isCustomAuthRoute =
      cleanEndpoint === 'auth/login' ||
      cleanEndpoint === 'auth/register' ||
      cleanEndpoint === 'auth/resend-otp' ||
      cleanEndpoint === 'auth/verify-otp' ||
      cleanEndpoint === 'auth/refresh-token' ||
      cleanEndpoint === 'auth/logout' ||
      cleanEndpoint === 'auth/session'

    if (isCustomAuthRoute) {
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

  const isFormData = Boolean(
    customConfig.body &&
      typeof customConfig.body === 'object' &&
      typeof (customConfig.body as any).append === 'function'
  )

  const defaultHeaders: HeadersInit = {
    Accept: 'application/json',
  }

  if (!isFormData) {
    ;(defaultHeaders as Record<string, string>)['Content-Type'] = 'application/json'
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

    const isFailure =
      !response.ok || (json && typeof json === 'object' && json.success === false)

    const isDev = process.env.NODE_ENV !== 'production' && typeof window !== 'undefined'
    const targetBackendUrl = `${APP_CONFIG.apiBaseUrl.replace(/\/+$/, '')}/${cleanEndpoint}`

    if (isDev) {
      const isOk = !isFailure
      const method = (customConfig.method || 'GET').toUpperCase()
      const statusText = !response.ok
        ? response.status
        : json?.success === false
        ? '400 (Error)'
        : response.status
      const color = isOk ? '#10b981' : '#ef4444'

      console.groupCollapsed(
        `%c[API ${method}] %c/${cleanEndpoint} %c(${statusText})`,
        'color: #3b82f6; font-weight: bold;',
        'color: #0f172a; font-weight: 600;',
        `color: ${color}; font-weight: bold;`
      )
      console.log('%cDirect Backend URL:%c', 'font-weight: bold; color: #64748b;', '', targetBackendUrl)
      console.log('%cClient Proxy URL:%c', 'font-weight: bold; color: #64748b;', '', url)
      if (customConfig.body) {
        try {
          console.log(
            '%cRequest Payload:%c',
            'font-weight: bold; color: #64748b;',
            '',
            JSON.parse(customConfig.body as string)
          )
        } catch {
          console.log('%cRequest Payload:%c', 'font-weight: bold; color: #64748b;', '', customConfig.body)
        }
      }
      console.log('%cResponse JSON:%c', 'font-weight: bold; color: #64748b;', '', json)
      if (!isOk) {
        console.warn(
          '%cExtracted Root Cause:%c',
          'font-weight: bold; color: #ef4444;',
          '',
          formatApiErrorMessage(json)
        )
      }
      console.groupEnd()
    }

    if (response.status === 401 && typeof window !== 'undefined' && !skipAuth) {
      const isAuthEndpoint = cleanEndpoint.startsWith('auth/')
      if (!isAuthEndpoint && !_retriedAfterRefresh) {
        const refreshed = await refreshClientSession()
        if (refreshed) {
          return apiClient<T>(endpoint, { ...options, _retriedAfterRefresh: true })
        }
      }

      if (!isAuthEndpoint || cleanEndpoint === 'auth/get-profile') {
        authToken.clearClientState()
        const path = window.location.pathname
        if (path !== '/login' && path !== '/signup') {
          window.location.href = '/login?session_expired=true'
        }
      }
    }

    if (isFailure) {
      const status = !response.ok ? response.status : 400
      const errorMessage = formatApiErrorMessage(
        json,
        `Request failed with status ${status}`
      )
      throw new ApiError(errorMessage, status, errorMessage, json?.data)
    }

    return json as T
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      (error instanceof ApiError || (error as any).name === 'ApiError')
    ) {
      throw error
    }
    const message =
      error instanceof Error ? error.message : typeof error === 'string' ? error : 'A network error occurred'
    throw new ApiError(message, 0)
  }
}
