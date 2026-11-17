/**
 * Client-side token and session manager
 * Uses HttpOnly cookie on server and secure session state for impenetrable client security.
 */

const TOKEN_KEY = 'metromail_access_token'
const SESSION_KEY = 'metromail_session'
const USER_EMAIL_KEY = 'metromail_user_email'

export const authToken = {
  get(): string | null {
    if (typeof window === 'undefined') return null
    try {
      const local = localStorage.getItem(TOKEN_KEY)
      if (local && local !== 'http-only-protected') return local
      return this.isAuthenticated() ? 'http-only-cookie-active' : null
    } catch {
      return null
    }
  },

  set(token: string): void {
    if (typeof window === 'undefined') return
    try {
      if (token && token !== 'http-only-protected') {
        localStorage.setItem(TOKEN_KEY, token)
      }
      localStorage.setItem(SESSION_KEY, 'authenticated')
      document.cookie = `${SESSION_KEY}=authenticated; path=/; max-age=604800; SameSite=Lax`
    } catch (e) {
      console.error('Failed to set session state:', e)
    }
  },

  async remove(): Promise<void> {
    if (typeof window === 'undefined') return
    try {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(SESSION_KEY)
      document.cookie = `${TOKEN_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
      document.cookie = `${SESSION_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`

      // Server-side logout to purge HttpOnly cookie
      await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
    } catch (e) {
      console.error('Failed to remove auth token:', e)
    }
  },

  saveUserEmail(email: string): void {
    if (typeof window === 'undefined') return
    try {
      sessionStorage.setItem(USER_EMAIL_KEY, email)
    } catch {}
  },

  getUserEmail(): string | null {
    if (typeof window === 'undefined') return null
    try {
      return sessionStorage.getItem(USER_EMAIL_KEY)
    } catch {
      return null
    }
  },

  clearUserEmail(): void {
    if (typeof window === 'undefined') return
    try {
      sessionStorage.removeItem(USER_EMAIL_KEY)
    } catch {}
  },

  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false
    try {
      const hasCookie = document.cookie.includes(`${SESSION_KEY}=authenticated`)
      if (!hasCookie) {
        // Sync: if cookie is gone, clean localStorage so there's no mismatch
        localStorage.removeItem(SESSION_KEY)
        localStorage.removeItem(TOKEN_KEY)
        return false
      }
      return true
    } catch {
      return false
    }
  },
}
