const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://metrovps.com'

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${siteUrl}/#organization`,
      name: 'MetroVPS',
      url: siteUrl,
    },
    {
      '@type': 'SoftwareApplication',
      name: 'MetroMail',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      url: siteUrl,
      description: 'Email marketing, customer automation, transactional delivery, and developer email infrastructure by MetroVPS.',
      provider: { '@id': `${siteUrl}/#organization` },
    },
  ],
}

export function MarketingStructuredData() {
  const json = JSON.stringify(structuredData).replace(/</g, '\\u003c')

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
}
