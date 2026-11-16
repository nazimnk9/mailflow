import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: '*', allow: '/', disallow: ['/app', '/dashboard', '/login', '/signup', '/forgot-password', '/reset-password', '/verify-email', '/two-factor', '/invite'] }, sitemap: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://metrovps.com'}/sitemap.xml` }
}
