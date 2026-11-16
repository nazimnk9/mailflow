import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://metrovps.com'),
  title: { default: 'MetroMail | Email marketing and infrastructure by MetroVPS', template: '%s' },
  description: 'Bring email marketing, customer automation, transactional delivery, and developer infrastructure together in one MetroVPS workspace.',
  applicationName: 'MetroMail',
  generator: 'Next.js',
  icons: { icon: '/icon.svg', apple: '/apple-icon.png' },
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: '/',
    siteName: 'MetroMail by MetroVPS',
    title: 'MetroMail | Email marketing and infrastructure by MetroVPS',
    description: 'Bring email marketing, customer automation, transactional delivery, and developer infrastructure together in one MetroVPS workspace.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MetroMail | Email marketing and infrastructure by MetroVPS',
    description: 'Bring email marketing, customer automation, transactional delivery, and developer infrastructure together in one MetroVPS workspace.',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#f7f9fc',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
