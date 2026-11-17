/**
 * Application configuration
 * Centralizes environment variables with safe fallbacks
 */
export const APP_CONFIG = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://163.227.6.3:8000/api',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://metrovps.com',
} as const

