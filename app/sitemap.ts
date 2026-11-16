import type { MetadataRoute } from 'next'

const publicRoutes = ['/', '/features', '/email-marketing', '/transactional-email', '/email-api', '/smtp-service', '/automation', '/campaigns', '/analytics', '/email-deliverability', '/email-templates', '/integrations', '/pricing', '/documentation', '/about-us', '/contact-us', '/faq', '/privacy-policy', '/terms-conditions']

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://metrovps.com'
  return publicRoutes.map((route) => ({ url: `${baseUrl}${route}`, lastModified: new Date(), changeFrequency: route === '/' ? 'weekly' : 'monthly', priority: route === '/' ? 1 : 0.7 }))
}
