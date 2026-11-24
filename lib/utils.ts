import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Safely extracts an array from various API response formats:
 * - Direct array: [ ... ]
 * - Nested in data: { data: [ ... ] }
 * - Nested in items/results/mails/domains/contacts/lists: { items: [ ... ] }
 * - Nested in data.items: { data: { items: [ ... ] } }
 * - Graceful fallback to empty array [] if null, undefined, or unexpected object
 */
export function ensureArray<T>(data: unknown): T[] {
  if (!data) return []
  if (Array.isArray(data)) {
    return data.filter((item) => item !== null && item !== undefined) as T[]
  }
  if (typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (Array.isArray(obj.data)) {
      return obj.data.filter((item) => item !== null && item !== undefined) as T[]
    }
    if (Array.isArray(obj.items)) {
      return obj.items.filter((item) => item !== null && item !== undefined) as T[]
    }
    if (Array.isArray(obj.results)) {
      return obj.results.filter((item) => item !== null && item !== undefined) as T[]
    }
    if (Array.isArray(obj.mails)) {
      return obj.mails.filter((item) => item !== null && item !== undefined) as T[]
    }
    if (Array.isArray(obj.domains)) {
      return obj.domains.filter((item) => item !== null && item !== undefined) as T[]
    }
    if (Array.isArray(obj.contacts)) {
      return obj.contacts.filter((item) => item !== null && item !== undefined) as T[]
    }
    if (Array.isArray(obj.lists)) {
      return obj.lists.filter((item) => item !== null && item !== undefined) as T[]
    }
    if (obj.data && typeof obj.data === 'object') {
      return ensureArray<T>(obj.data)
    }
  }
  return []
}
