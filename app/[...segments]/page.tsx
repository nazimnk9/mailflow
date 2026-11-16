import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { AuthScreen } from '@/components/auth-screen'
import { DashboardApp } from '@/components/dashboard-app'
import { MarketingSite } from '@/components/marketing-site'
import { MarketingStructuredData } from '@/components/marketing-structured-data'

const publicPages = new Set(['features', 'email-marketing', 'transactional-email', 'email-api', 'smtp-service', 'automation', 'campaigns', 'analytics', 'email-deliverability', 'email-templates', 'integrations', 'pricing', 'documentation', 'about-us', 'contact-us', 'faq', 'privacy-policy', 'terms-conditions'])
const authPages = new Set(['login', 'signup', 'forgot-password', 'reset-password', 'verify-email', 'two-factor', 'invite'])
const pageTitles: Record<string, string> = {
  features: 'Features', 'email-marketing': 'Email Marketing', 'transactional-email': 'Transactional Email', 'email-api': 'Email API', 'smtp-service': 'SMTP Service', automation: 'Email Automation', campaigns: 'Email Campaigns', analytics: 'Email Analytics', 'email-deliverability': 'Email Deliverability', 'email-templates': 'Email Templates', integrations: 'Integrations', pricing: 'Pricing', documentation: 'Documentation', 'about-us': 'About MetroVPS', 'contact-us': 'Contact MetroVPS', faq: 'Frequently Asked Questions', 'privacy-policy': 'Privacy Policy', 'terms-conditions': 'Terms & Conditions', login: 'Log in', signup: 'Create your account', 'forgot-password': 'Reset your password', 'reset-password': 'Choose a new password', 'verify-email': 'Verify your email', 'two-factor': 'Two-factor authentication', invite: 'Accept invitation',
}

export async function generateMetadata({ params }: { params: Promise<{ segments: string[] }> }): Promise<Metadata> {
  const { segments } = await params
  const slug = segments.join('/')
  const root = segments[0]
  const title = pageTitles[root] ?? segments.at(-1)?.replace(/-/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase()) ?? 'MetroMail'
  const isPrivate = root === 'app' || root === 'dashboard' || authPages.has(root)
  const description = isPrivate ? 'MetroMail workspace for campaigns, contacts, automation, and reliable email infrastructure.' : `Explore ${title.toLowerCase()} with MetroMail, the unified email marketing and developer email platform from MetroVPS.`
  return { title: `${title} | MetroMail by MetroVPS`, description, robots: isPrivate ? { index: false, follow: false } : { index: true, follow: true }, alternates: { canonical: `/${slug}` }, openGraph: { title: `${title} | MetroMail by MetroVPS`, description, type: 'website' }, twitter: { card: 'summary_large_image', title: `${title} | MetroMail`, description } }
}

export default async function Page({ params }: { params: Promise<{ segments: string[] }> }) {
  const { segments } = await params
  const [root, ...rest] = segments
  if (authPages.has(root) && rest.length === 0) return <AuthScreen page={root} />
  if (root === 'app' || root === 'dashboard') return <DashboardApp route={rest.join('/') || 'overview'} />
  if (publicPages.has(root) && rest.length === 0) return <>
    <MarketingStructuredData />
    <MarketingSite page={root} />
  </>
  notFound()
}
