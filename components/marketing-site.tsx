'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Code2,
  Globe2,
  Layers3,
  Mail,
  Menu,
  Pause,
  Play,
  Quote,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  ThumbsUp,
  TrendingUp,
  Workflow,
  X,
  Zap,
} from 'lucide-react'
import { BrandMark } from '@/components/brand-mark'

const products = [
  ['Email marketing', '/email-marketing', 'Campaigns, audiences, and automation'],
  ['Transactional email', '/transactional-email', 'Reliable messages for every moment'],
  ['Email API', '/email-api', 'A developer-first sending API'],
  ['SMTP service', '/smtp-service', 'Simple, powerful SMTP relay'],
  ['Deliverability', '/email-deliverability', 'Build trust with every send'],
]
const resources = [['Documentation', '/documentation'], ['Integrations', '/integrations'], ['Email templates', '/email-templates'], ['Help center', '/faq']]
const featureCards = [
  { icon: Send, title: 'Campaigns that connect', text: 'Create thoughtful emails, reach the right people, and learn what resonates.' },
  { icon: Workflow, title: 'Journeys that feel personal', text: 'Automate the moments that matter with clear, flexible customer journeys.' },
  { icon: Code2, title: 'Infrastructure built for developers', text: 'Send transactional email with a clean API, flexible SMTP, and useful logs.' },
  { icon: BarChart3, title: 'Insights you can act on', text: 'See delivery, opens, clicks, and performance in one calm, clear workspace.' },
]
const steps = [
  ['01', 'Create your account', 'Set up a workspace for your team and choose the way you want to send.'],
  ['02', 'Add your sending domain', 'Connect a domain you own and keep marketing and transactional streams organized.'],
  ['03', 'Authenticate your email', 'Publish SPF, DKIM, and DMARC records to help mailbox providers trust your mail.'],
  ['04', 'Bring in your audience', 'Import contacts, create a segment, or connect your product through the API.'],
  ['05', 'Build a campaign or template', 'Start with a reusable template or create a transactional message for your app.'],
  ['06', 'Send with SMTP or REST', 'Use the campaign workspace, SMTP relay, or a simple API request.'],
  ['07', 'Learn and improve', 'Monitor delivery, opens, clicks, bounces, and engagement as it happens.'],
]
const faqs = [
  ['Can I use MetroMail for both marketing and transactional email?', 'Yes. Keep campaigns, customer journeys, and product-triggered email together, with separate sending domains and clear reporting.'],
  ['Do I need to be a developer to create campaigns?', 'No. The campaign workspace is designed for marketers, while the REST API and SMTP relay are ready when your team needs them.'],
  ['How does domain authentication work?', 'MetroMail provides the SPF, DKIM, and DMARC records for your sending domain and guides you through verifying them with your DNS provider.'],
  ['Can I connect the platform to my existing tools?', 'The integrations area is designed for CRM, commerce, automation, and developer tools. The initial catalog is sample data until backend connections are added.'],
]

export type TestimonialItem = {
  id: string
  quote: string
  name: string
  role: string
  company: string
  category: string
  initials: string
  avatarGradient: string
  metric: string
  metricLabel: string
  highlightTag: string
  tags: string[]
  verified: boolean
}

const testimonials: TestimonialItem[] = [
  {
    id: 'jordan',
    quote: 'Campaigns feel simple for our team and flexible enough to grow with every customer journey.',
    name: 'Jordan Ellis',
    role: 'Head of Lifecycle Marketing',
    company: 'CraftSphere Commerce',
    category: 'Lifecycle Marketing',
    initials: 'JE',
    avatarGradient: 'linear-gradient(135deg, #1374f8, #0ea5e9)',
    metric: '+142%',
    metricLabel: 'CTR & Open Lift',
    highlightTag: 'Marketing Favorite',
    tags: ['Visual Drag-and-Drop', 'Dynamic Segments', 'A/B Testing'],
    verified: true,
  },
  {
    id: 'alex',
    quote: 'Finally, a platform that lets our marketing and engineering teams work from the same source of truth.',
    name: 'Alex Morgan',
    role: 'VP of Product Experience',
    company: 'NorthStar Cloud',
    category: 'Product Leadership',
    initials: 'AM',
    avatarGradient: 'linear-gradient(135deg, #7c3aed, #a855f7)',
    metric: '3.8x',
    metricLabel: 'Faster Campaign Launch',
    highlightTag: 'Cross-functional',
    tags: ['Collaborative Workflows', 'Unified Analytics', 'Shared Templates'],
    verified: true,
  },
  {
    id: 'priya',
    quote: 'We can see what happens after every API send without asking our engineers to build another dashboard.',
    name: 'Priya Shah',
    role: 'Staff Infrastructure Architect',
    company: 'FinPulse Systems',
    category: 'Engineering & API',
    initials: 'PS',
    avatarGradient: 'linear-gradient(135deg, #059669, #10b981)',
    metric: '< 18ms',
    metricLabel: 'Global Delivery Latency',
    highlightTag: 'Developer Loved',
    tags: ['REST API v1', 'Real-time Webhooks', 'Flexible SMTP Relay'],
    verified: true,
  },
  {
    id: 'marcus',
    quote: 'Our inbox placement shot up to 99.8% within two weeks of authenticating our domains with MetroMail.',
    name: 'Marcus Vance',
    role: 'Deliverability & Growth Lead',
    company: 'Beacon Media Labs',
    category: 'Deliverability & Growth',
    initials: 'MV',
    avatarGradient: 'linear-gradient(135deg, #ea580c, #f59e0b)',
    metric: '99.8%',
    metricLabel: 'Inbox Placement Rate',
    highlightTag: 'High Reputation',
    tags: ['DKIM & SPF Authentication', 'Reputation Shield', 'Suppression Guard'],
    verified: true,
  },
]

const testimonialCategories = [
  'All Stories',
  'Lifecycle Marketing',
  'Product Leadership',
  'Engineering & API',
  'Deliverability & Growth',
]

const pageInfo: Record<string, { eyebrow: string; title: string; description: string; bullets: string[] }> = {
  features: { eyebrow: 'One platform, two ways to send', title: 'Email that works across your whole business.', description: 'Move from campaign idea to reliable delivery in one calm, connected workspace.', bullets: ['Campaigns and audience management', 'Transactional email and SMTP', 'Automation and useful analytics'] },
  'email-marketing': { eyebrow: 'Email marketing', title: 'Make every campaign feel more personal.', description: 'Bring your audience, content, and performance data together so great messages are easier to send.', bullets: ['Segment contacts with flexible attributes', 'Build campaigns from reusable templates', 'Track the metrics that matter'] },
  'transactional-email': { eyebrow: 'Transactional email', title: 'The messages your product depends on.', description: 'Send receipts, sign-in links, and product notifications through infrastructure designed for dependable delivery.', bullets: ['Fast REST API and SMTP relay', 'Message events and searchable logs', 'Separate domains and streams'] },
  'email-api': { eyebrow: 'Developer tools', title: 'A clean API for the emails that matter.', description: 'Integrate email sending into your product with straightforward requests and useful delivery events.', bullets: ['REST API with practical examples', 'Events and webhooks for observability', 'Keys scoped to your workspace'] },
  'smtp-service': { eyebrow: 'SMTP service', title: 'Reliable sending, without the busywork.', description: 'Connect your application to a flexible SMTP relay and understand every message as it moves.', bullets: ['Simple host and port configuration', 'Dedicated credentials for environments', 'Delivery logs built for debugging'] },
  automation: { eyebrow: 'Email automation', title: 'Build customer journeys that keep moving.', description: 'Create useful welcome, onboarding, and lifecycle journeys with simple visual workflows.', bullets: ['Behavior-based triggers', 'Branches, delays, and email steps', 'Performance at every step'] },
  campaigns: { eyebrow: 'Campaigns', title: 'Create campaigns with a clear point of view.', description: 'Bring your content, audience, and schedule into a single workflow from draft to report.', bullets: ['Reusable campaign templates', 'A/B test and schedule controls', 'Campaign reporting'] },
  analytics: { eyebrow: 'Email analytics', title: 'See what happened after send.', description: 'Get a readable view of engagement, delivery health, and the next best action.', bullets: ['Delivery, open, and click trends', 'Campaign and domain comparisons', 'Exportable reporting'] },
  'email-deliverability': { eyebrow: 'Deliverability', title: 'Build a healthier path to the inbox.', description: 'Authenticate your domains, monitor sending reputation, and understand delivery events.', bullets: ['SPF, DKIM, and DMARC guidance', 'Bounce and complaint monitoring', 'Domain health reporting'] },
  'email-templates': { eyebrow: 'Email templates', title: 'Start with a strong foundation.', description: 'Give your team a library of flexible, on-brand building blocks for every kind of message.', bullets: ['Reusable campaign layouts', 'Transactional message patterns', 'Preview on desktop and mobile'] },
  integrations: { eyebrow: 'Integrations', title: 'Make email part of your stack.', description: 'Connect customer data, commerce, and automation tools to the messages you send.', bullets: ['CRM and commerce categories', 'Automation and developer tools', 'API-first connection patterns'] },
  pricing: { eyebrow: 'Pricing', title: 'A plan that grows with your sending.', description: 'Start with the essentials and find a plan that fits your audience and product.', bullets: ['Free tier for getting started', 'Predictable volume-based plans', 'Upgrade as your sending grows'] },
  documentation: { eyebrow: 'Documentation', title: 'Everything you need to get started.', description: 'Find quickstarts, sending guides, and API references for your team.', bullets: ['Account and domain setup', 'First campaign walkthrough', 'API and SMTP quickstarts'] },
  'about-us': { eyebrow: 'About MetroVPS', title: 'Thoughtful infrastructure for better communication.', description: 'MetroMail brings the human side of marketing and the reliability of developer email into one product.', bullets: ['Designed for modern teams', 'A focus on transparency and control', 'Built to grow with your business'] },
  'contact-us': { eyebrow: 'Contact', title: 'Let’s talk about what you’re building.', description: 'Tell us about your email program and we’ll help you find a good place to start.', bullets: ['Product and plan questions', 'Migration and deliverability guidance', 'Technical conversations'] },
  faq: { eyebrow: 'Frequently asked questions', title: 'A few helpful answers to start.', description: 'Learn how campaigns, sending domains, and developer tools fit together.', bullets: ['Marketing and transactional email', 'Domain verification', 'Integration options'] },
  'privacy-policy': { eyebrow: 'Privacy', title: 'Privacy is part of the product.', description: 'This sample privacy page is a frontend scaffold. Add your company’s reviewed policy before launch.', bullets: ['Data handling overview', 'Customer controls', 'Contact information'] },
  'terms-conditions': { eyebrow: 'Terms', title: 'Clear expectations for every workspace.', description: 'This sample terms page is a frontend scaffold. Replace it with your company’s reviewed terms before launch.', bullets: ['Account responsibilities', 'Acceptable use', 'Service availability'] },
}

export function MarketingSite({ page = 'home' }: { page?: string }) {
  const [menu, setMenu] = useState<'products' | 'resources' | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [testimonialIndex, setTestimonialIndex] = useState(0)
  const [selectedCategory, setSelectedCategory] = useState<string>('All Stories')
  const [storyLikes, setStoryLikes] = useState<Record<string, { count: number; liked: boolean }>>({
    jordan: { count: 64, liked: false },
    alex: { count: 52, liked: false },
    priya: { count: 79, liked: false },
    marcus: { count: 47, liked: false },
  })
  const [carouselHovered, setCarouselHovered] = useState(false)
  const [carouselFocused, setCarouselFocused] = useState(false)
  const [carouselPaused, setCarouselPaused] = useState(false)
  const prefersReducedMotion = useReducedMotion()
  const activeTestimonial = testimonials[testimonialIndex] || testimonials[0]
  useEffect(() => {
    if (prefersReducedMotion || carouselPaused || carouselHovered || carouselFocused) return
    const interval = window.setInterval(() => setTestimonialIndex((index) => (index + 1) % testimonials.length), 6500)
    return () => window.clearInterval(interval)
  }, [carouselFocused, carouselHovered, carouselPaused, prefersReducedMotion, testimonialIndex])
  const isHome = page === 'home'
  const info = pageInfo[page] ?? pageInfo.features

  return (
    <main className="marketing-shell">
      <header className="marketing-header">
        <div className="marketing-nav-wrap">
          <BrandMark productLabel="Email Cloud" />
          <nav className="marketing-nav" aria-label="Main navigation">
            <div className="nav-dropdown-wrap">
              <button className={`nav-link ${menu === 'products' ? 'is-open' : ''}`} onClick={() => setMenu(menu === 'products' ? null : 'products')} aria-expanded={menu === 'products'}>Products <ChevronDown size={14} /></button>
              {menu === 'products' && <div className="nav-dropdown product-dropdown">{products.map(([title, href, description]) => <Link key={href} href={href} onClick={() => setMenu(null)}><span>{title}</span><small>{description}</small></Link>)}</div>}
            </div>
            <Link className="nav-link" href="/pricing">Pricing</Link>
            <div className="nav-dropdown-wrap">
              <button className={`nav-link ${menu === 'resources' ? 'is-open' : ''}`} onClick={() => setMenu(menu === 'resources' ? null : 'resources')} aria-expanded={menu === 'resources'}>Resources <ChevronDown size={14} /></button>
              {menu === 'resources' && <div className="nav-dropdown">{resources.map(([title, href]) => <Link key={href} href={href} onClick={() => setMenu(null)}>{title}<ArrowUpRight size={14} /></Link>)}</div>}
            </div>
          </nav>
          <div className="marketing-actions"><Link className="nav-login" href="/login">Log in</Link><Link className="button button-primary" href="/signup">Get started <ArrowRight size={15} /></Link></div>
          <button className="icon-button mobile-nav-trigger" aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'} onClick={() => setMobileOpen(!mobileOpen)}>{mobileOpen ? <X /> : <Menu />}</button>
        </div>
        {mobileOpen && <div className="mobile-nav-panel"><Link href="/features" onClick={() => setMobileOpen(false)}>Products</Link><Link href="/pricing" onClick={() => setMobileOpen(false)}>Pricing</Link><Link href="/documentation" onClick={() => setMobileOpen(false)}>Resources</Link><Link href="/login" onClick={() => setMobileOpen(false)}>Log in</Link><Link className="button button-primary" href="/signup" onClick={() => setMobileOpen(false)}>Get started <ArrowRight size={15} /></Link></div>}
      </header>

      {isHome ? <>
        <section className="hero-section">
          <div className="hero-copy">
            <div className="eyebrow-pill"><Sparkles size={13} /> ONE PLATFORM. EVERY SEND.</div>
            <h1>Email that moves your business <span>forward.</span></h1>
            <p>Build lasting customer relationships and send critical product email from one dependable, developer-friendly platform.</p>
            <div className="hero-actions"><Link href="/signup" className="button button-primary button-large">Start sending for free <ArrowRight size={16} /></Link><Link href="/app/overview" className="button button-secondary button-large">Explore the workspace <ArrowUpRight size={16} /></Link></div>
            <div className="hero-note"><span className="avatar-stack"><i>M</i><i>A</i><i>J</i></span><span>Made for the people behind every message</span></div>
          </div>
          <motion.div className="hero-product" aria-label="Illustrative MetroMail email performance dashboard" initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.55, ease: 'easeOut', delay: 0.1 }}>
            <div className="product-window">
              <div className="window-top"><div className="window-dots"><i /><i /><i /></div><span>Workspace overview</span><div className="window-avatar">M</div></div>
              <div className="window-body"><div className="preview-sidebar"><div className="preview-logo"><span className="preview-logo-mark">m</span><span>metro<span>mail</span></span></div>{['Overview', 'Campaigns', 'Contacts', 'Automations', 'Transactional'].map((item, index) => <div className={`preview-nav ${index === 0 ? 'selected' : ''}`} key={item}><span className="preview-dot" />{item}</div>)}</div>
                <div className="preview-main"><div className="preview-title"><div><small>MONDAY, NOVEMBER 16, 2026</small><h3>Good morning, Alex</h3></div><span className="preview-range">Last 7 days <ChevronDown size={12} /></span></div><div className="preview-metrics"><div><small>Emails sent</small><b>248,532</b><em>↑ 12.8%</em></div><div><small>Delivery rate</small><b>99.2%</b><em>↑ 0.6%</em></div><div><small>Open rate</small><b>42.8%</b><em>↑ 3.4%</em></div></div><div className="preview-chart"><div className="chart-head"><span>Email performance</span><small>Delivered · Opens</small></div><div className="chart-bars">{[36, 52, 45, 69, 58, 83, 72, 92, 66, 78, 55, 72].map((height, index) => <div className="bar-pair" key={index}><i style={{ height: `${height}%` }} /><i style={{ height: `${Math.max(24, height - 20)}%` }} /></div>)}</div><div className="chart-labels"><span>Nov 10</span><span>Nov 13</span><span>Nov 16</span></div></div><div className="preview-lower"><div><small>Recent campaigns</small><p><span className="status-dot blue-dot" /> November product notes <b>42.8%</b></p><p><span className="status-dot green-dot" /> Welcome to MetroVPS <b>38.2%</b></p></div><div className="health-score"><small>Domain health</small><strong>Excellent</strong><div><i /></div><span>All records verified</span></div></div></div>
              </div>
            </div>
            <div className="floating-card floating-delivery"><span className="floating-icon"><Check size={15} /></span><div><b>Delivered</b><small>99.2% this month</small></div><span className="floating-up">+0.6%</span></div>
            <div className="floating-card floating-send"><span className="send-ring"><Send size={15} /></span><div><b>Campaign sent</b><small>2m ago · 8,420 contacts</small></div></div>
            <div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" />
          </motion.div>
        </section>
        <section className="trust-section"><p>BUILT FOR THE TEAMS BUILDING WHAT’S NEXT</p><div className="trust-brands"><span>northstar<span className="trust-mark">/</span></span><span className="trust-serif">juniper</span><span className="trust-mono">mono<span>®</span></span><span className="trust-bold">COASTLINE</span><span className="trust-serif trust-italic">Acme Studio</span></div><small>Illustrative brand names for demonstration only</small></section>
        <section className="section-block features-overview"><div className="section-heading"><div className="eyebrow">THE COMPLETE EMAIL WORKSPACE</div><h2>Everything your email program needs.<br /><span>Nothing it doesn’t.</span></h2><p>From your first newsletter to millions of product notifications, keep the important parts connected.</p></div><div className="feature-card-grid">{featureCards.map(({ icon: Icon, title, text }, index) => <article className="feature-card" key={title}><span className={`feature-icon feature-icon-${index}`}><Icon size={19} /></span><h3>{title}</h3><p>{text}</p><Link href={['/email-marketing', '/automation', '/email-api', '/analytics'][index]}>Explore {['campaigns', 'automation', 'the API', 'analytics'][index]} <ArrowRight size={14} /></Link></article>)}</div></section>
        <section className="split-feature marketing-tint"><div className="split-copy"><div className="eyebrow">MARKETING THAT FEELS HUMAN</div><h2>Good email starts with knowing your audience.</h2><p>Bring contacts and customer data together. Build thoughtful segments, design campaigns that sound like you, and let automation take care of the follow-through.</p><ul><li><Check /> Flexible lists, tags, and segments</li><li><Check /> Reusable templates and campaign drafts</li><li><Check /> Clear performance reporting</li></ul><Link className="text-link" href="/email-marketing">Explore email marketing <ArrowRight size={15} /></Link></div><div className="audience-card"><div className="audience-card-head"><div><small>AUDIENCE OVERVIEW</small><h3>Your audience, in focus.</h3></div><span className="audience-icon"><Layers3 size={17} /></span></div><div className="audience-number"><strong>24,806</strong><span>active contacts</span><em>↑ 8.4%</em></div><div className="segment-list"><div><span className="segment-color segment-blue" /> Engaged customers <b>8,204</b></div><div><span className="segment-color segment-cyan" /> Product updates <b>6,890</b></div><div><span className="segment-color segment-violet" /> New subscribers <b>4,420</b></div><div><span className="segment-color segment-pale" /> Other contacts <b>5,292</b></div></div><div className="audience-foot"><span>Updated moments ago</span><span><ArrowUpRight size={13} /> View segments</span></div></div></section>
        <section className="split-feature infra-feature"><div className="infra-visual"><div className="infra-card"><div className="infra-card-head"><span className="code-badge"><Code2 size={17} /></span><div><b>Message accepted</b><small>POST /v1/messages</small></div><span className="infra-accepted"><Check size={13} /> 202</span></div><div className="code-window"><div className="code-line"><i>1</i><span><b>await</b> metro.mail.send({'{'}</span></div><div className="code-line"><i>2</i><span>&nbsp; to: <em>&quot;customer@example.com&quot;</em>,</span></div><div className="code-line"><i>3</i><span>&nbsp; template: <em>&quot;order-confirmation&quot;</em>,</span></div><div className="code-line"><i>4</i><span>&nbsp; data: {'{'} orderId: <em>&quot;#9821&quot;</em> {'}'}</span></div><div className="code-line"><i>5</i><span>{'}'});</span></div></div><div className="infra-progress"><div><span>Accepted</span><b>10:42:08.124</b></div><i /><div><span>Delivered</span><b>10:42:08.318</b></div></div></div><div className="infra-orb" /></div><div className="split-copy"><div className="eyebrow">BUILT FOR DEVELOPERS</div><h2>Reliable infrastructure. Clear signals.</h2><p>Send product-critical email through a simple API or SMTP relay, then follow every message through searchable logs and meaningful events.</p><ul><li><Check /> REST API and flexible SMTP</li><li><Check /> Delivery events and webhooks</li><li><Check /> Authenticated domains and API keys</li></ul><Link className="text-link" href="/email-api">Explore developer tools <ArrowRight size={15} /></Link></div></section>
        <section className="automation-section"><div className="section-heading"><div className="eyebrow">A BETTER CUSTOMER JOURNEY</div><h2>From first hello to lifelong customer.</h2><p>Give every customer the right message at the right moment, without adding more busywork.</p></div><div className="journey-flow"><div className="journey-node journey-trigger"><span><Zap size={17} /></span><small>TRIGGER</small><b>New subscriber</b></div><div className="journey-connector"><i /></div><div className="journey-node"><span><Mail size={17} /></span><small>INSTANTLY</small><b>Welcome email</b></div><div className="journey-connector"><i /></div><div className="journey-node"><span className="journey-delay"><ArrowDown size={17} /></span><small>AFTER 2 DAYS</small><b>Share a guide</b></div><div className="journey-connector"><i /></div><div className="journey-node journey-outcome"><span><BarChart3 size={17} /></span><small>IF ENGAGED</small><b>Invite to explore</b></div></div><Link className="text-link journey-link" href="/automation">Explore email automation <ArrowRight size={15} /></Link></section>
        <section className="how-section"><div className="section-heading"><div className="eyebrow">GET STARTED IN A FEW STEPS</div><h2>From setup to a smarter send.</h2><p>Everything you need to go from a new account to useful, measurable email.</p></div><div className="steps-grid">{steps.map(([number, title, description], index) => <article className="step-card" key={number}><span className="step-number">{number}</span><div className="step-line"><i className={index < steps.length - 1 ? 'line-active' : ''} /></div><h3>{title}</h3><p>{description}</p></article>)}</div><div className="steps-cta"><Link href="/signup" className="button button-primary">Set up your workspace <ArrowRight size={15} /></Link><Link href="/documentation" className="text-link">Read the getting started guide</Link></div></section>
        <section className="usecases-section"><div className="usecase-head"><div><div className="eyebrow">A PLATFORM THAT FITS YOUR TEAM</div><h2>Made for the messages that matter.</h2></div><Link href="/features" className="text-link">See all features <ArrowRight size={15} /></Link></div><div className="usecase-grid"><article><span className="usecase-icon"><Sparkles /></span><h3>Growing startups</h3><p>Move quickly with a simple platform that grows with your product.</p></article><article><span className="usecase-icon"><Globe2 /></span><h3>SaaS products</h3><p>Send reliable account, billing, and lifecycle messages as you scale.</p></article><article><span className="usecase-icon"><Layers3 /></span><h3>Commerce teams</h3><p>Connect campaigns, order notifications, and customer data.</p></article><article><span className="usecase-icon"><Code2 /></span><h3>Developers</h3><p>Integrate sending with a clean API and observability built in.</p></article></div></section>
        <section className="integration-strip"><div><div className="eyebrow">FITS YOUR EXISTING STACK</div><h2>Works with the tools you already use.</h2><p>Explore CRM, commerce, automation, and developer integrations.</p></div><div className="integration-icons"><span>H</span><span>S</span><span>z</span><span>∑</span><span>+</span></div><Link href="/integrations" className="button button-secondary">Explore integrations <ArrowRight size={14} /></Link></section>
        <section className="pricing-section"><div className="section-heading"><div className="eyebrow">SIMPLE, FLEXIBLE PRICING</div><h2>Start free. Grow at your own pace.</h2><p>Pick a plan that supports your next stage, not just where you are today.</p></div><div className="pricing-grid"><article className="price-card"><small>STARTER</small><h3>For getting going</h3><p>Try the essentials and find your rhythm.</p><div className="price-value"><b>Free</b><span>forever</span></div><ul><li><Check /> 300 emails per day</li><li><Check /> Basic campaign tools</li><li><Check /> Email API and SMTP</li></ul><Link href="/signup" className="button button-secondary full-button">Start free</Link></article><article className="price-card price-featured"><div className="popular-label">MOST POPULAR</div><small>GROWTH</small><h3>For teams in motion</h3><p>More reach, automation, and helpful insights.</p><div className="price-value"><b>$49</b><span>/ month</span></div><ul><li><Check /> 50,000 emails per month</li><li><Check /> Marketing automation</li><li><Check /> Advanced analytics</li></ul><Link href="/signup" className="button button-primary full-button">Choose Growth</Link></article><article className="price-card"><small>SCALE</small><h3>For more ambitious sends</h3><p>Additional control for growing programs.</p><div className="price-value"><b>Let’s talk</b></div><ul><li><Check /> Custom volume and limits</li><li><Check /> Priority support options</li><li><Check /> Advanced team controls</li></ul><Link href="/contact-us" className="button button-secondary full-button">Talk to our team</Link></article></div><p className="pricing-note">Illustrative pricing for this frontend demo. Plans and limits are not active billing offers.</p></section>
        <section
          className="testimonial-section-enhanced"
          role="region"
          aria-roledescription="carousel"
          aria-label="Customer stories and testimonials"
          onMouseEnter={() => setCarouselHovered(true)}
          onMouseLeave={() => setCarouselHovered(false)}
          onFocusCapture={() => setCarouselFocused(true)}
          onBlurCapture={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setCarouselFocused(false)
          }}
        >
          <div className="testimonial-container">
            {/* Section Heading */}
            <div className="section-heading text-center">
              <div className="eyebrow"><Sparkles size={13} /> CUSTOMER STORIES & EXPERIENCES</div>
              <h2>Loved by teams scaling their sending.</h2>
              <p>From high-velocity marketing campaigns to critical API notifications, see why fast-growing companies trust MetroMail.</p>
            </div>

            {/* Interactive Category Filter Pills */}
            <div className="testimonial-category-tabs" role="tablist" aria-label="Filter stories by category">
              {testimonialCategories.map((category) => (
                <button
                  key={category}
                  type="button"
                  role="tab"
                  aria-selected={selectedCategory === category}
                  className={`category-pill ${selectedCategory === category ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedCategory(category)
                    if (category !== 'All Stories') {
                      const matchingIdx = testimonials.findIndex((t) => t.category === category)
                      if (matchingIdx !== -1) setTestimonialIndex(matchingIdx)
                    }
                  }}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Main Interactive Showcase Grid */}
            <div className="testimonial-interactive-layout">
              {/* Left / Featured Spotlight Card */}
              <div className="spotlight-card-wrapper">
                <motion.div
                  key={activeTestimonial.id}
                  className="spotlight-card"
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.3, ease: 'easeOut' }}
                >
                  {/* Spotlight Top Bar */}
                  <div className="spotlight-card-head">
                    <div className="spotlight-rating-wrap">
                      <div className="stars-row" aria-label="5 out of 5 stars">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={16} className="star-icon" />
                        ))}
                      </div>
                      <span className="rating-score">5.0 / 5.0</span>
                    </div>

                    <div className="spotlight-badges">
                      <span className="verified-badge">
                        <CheckCircle2 size={13} /> Verified User
                      </span>
                      <span className="category-tag-badge">{activeTestimonial.highlightTag}</span>
                    </div>
                  </div>

                  {/* Quote Body */}
                  <div className="spotlight-quote-body">
                    <Quote className="quote-watermark" size={48} aria-hidden="true" />
                    <blockquote className="spotlight-quote">
                      “{activeTestimonial.quote}”
                    </blockquote>
                  </div>

                  {/* Impact Metric Banner */}
                  <div className="spotlight-metric-banner">
                    <div className="metric-icon-wrap">
                      <TrendingUp size={20} />
                    </div>
                    <div className="metric-details">
                      <span className="metric-number">{activeTestimonial.metric}</span>
                      <span className="metric-label">{activeTestimonial.metricLabel}</span>
                    </div>
                    <div className="metric-company-pill">
                      <Building2 size={13} /> {activeTestimonial.company}
                    </div>
                  </div>

                  {/* Key Features Tags */}
                  <div className="spotlight-tags-row">
                    <span className="tags-label">Key features used:</span>
                    <div className="tags-pills-wrap">
                      {activeTestimonial.tags.map((tag) => (
                        <span key={tag} className="feature-pill">{tag}</span>
                      ))}
                    </div>
                  </div>

                  {/* Spotlight Footer */}
                  <div className="spotlight-card-footer">
                    <div className="spotlight-author-info">
                      <div
                        className="spotlight-avatar"
                        style={{ background: activeTestimonial.avatarGradient }}
                      >
                        {activeTestimonial.initials}
                      </div>
                      <div>
                        <h4 className="author-name">{activeTestimonial.name}</h4>
                        <p className="author-role">{activeTestimonial.role} · {activeTestimonial.company}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      className={`helpful-story-btn ${storyLikes[activeTestimonial.id]?.liked ? 'liked' : ''}`}
                      onClick={() => {
                        setStoryLikes((prev) => {
                          const curr = prev[activeTestimonial.id] || { count: 0, liked: false }
                          return {
                            ...prev,
                            [activeTestimonial.id]: {
                              count: curr.liked ? curr.count - 1 : curr.count + 1,
                              liked: !curr.liked,
                            },
                          }
                        })
                      }}
                      title="Give appreciation to this customer story"
                    >
                      <ThumbsUp size={14} />
                      <span>{storyLikes[activeTestimonial.id]?.liked ? 'Appreciated' : 'Helpful story'}</span>
                      <span className="likes-counter">({storyLikes[activeTestimonial.id]?.count ?? 0})</span>
                    </button>
                  </div>
                </motion.div>
              </div>

              {/* Right / Interactive Stories List */}
              <div className="story-selector-column">
                <div className="story-selector-header">
                  <span className="selector-title">Customer Stories</span>
                  <span className="story-counter">Story {testimonialIndex + 1} of {testimonials.length}</span>
                </div>

                <div className="story-cards-list">
                  {testimonials.map((item, idx) => {
                    const isCurrent = testimonialIndex === idx
                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={`story-selector-card ${isCurrent ? 'is-active' : ''}`}
                        onClick={() => {
                          setTestimonialIndex(idx)
                          if (selectedCategory !== 'All Stories' && item.category !== selectedCategory) {
                            setSelectedCategory('All Stories')
                          }
                        }}
                        aria-pressed={isCurrent}
                      >
                        <div className="selector-card-top">
                          <div className="selector-avatar" style={{ background: item.avatarGradient }}>
                            {item.initials}
                          </div>
                          <div className="selector-meta">
                            <b>{item.name}</b>
                            <small>{item.role} · {item.company}</small>
                          </div>
                          <span className="selector-metric-chip">{item.metric}</span>
                        </div>
                        <p className="selector-quote-preview">“{item.quote}”</p>
                        <div className="selector-card-footer">
                          <span className="selector-category">{item.category}</span>
                          <span className="selector-arrow">
                            {isCurrent ? <strong className="viewing-pill">Viewing</strong> : <span className="read-action">Read story <ArrowRight size={12} /></span>}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>

                {/* Carousel Controls Bar */}
                <div className="testimonial-controls-bar">
                  <div className="nav-buttons-group">
                    <button
                      type="button"
                      className="ctrl-btn"
                      aria-label="Previous story"
                      onClick={() => setTestimonialIndex((index) => (index - 1 + testimonials.length) % testimonials.length)}
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <div className="step-dots-group">
                      {testimonials.map((t, idx) => (
                        <button
                          key={t.id}
                          type="button"
                          className={`step-dot ${testimonialIndex === idx ? 'active' : ''}`}
                          aria-label={`Jump to ${t.name}'s story`}
                          onClick={() => setTestimonialIndex(idx)}
                        />
                      ))}
                    </div>
                    <button
                      type="button"
                      className="ctrl-btn"
                      aria-label="Next story"
                      onClick={() => setTestimonialIndex((index) => (index + 1) % testimonials.length)}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>

                  <button
                    type="button"
                    className="ctrl-pause-btn"
                    aria-label={carouselPaused ? 'Resume auto-rotation' : 'Pause auto-rotation'}
                    onClick={() => setCarouselPaused(!carouselPaused)}
                  >
                    {carouselPaused ? <Play size={13} /> : <Pause size={13} />}
                    <span>{carouselPaused ? 'Play' : 'Pause'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Trust & Reliability Ribbon */}
            <div className="testimonial-trust-ribbon">
              <div className="trust-stat-box">
                <strong>99.98%</strong>
                <span>Global Inbox Delivery</span>
              </div>
              <div className="trust-stat-divider" />
              <div className="trust-stat-box">
                <strong>120M+</strong>
                <span>Emails Delivered Monthly</span>
              </div>
              <div className="trust-stat-divider" />
              <div className="trust-stat-box">
                <strong>4.9 / 5.0</strong>
                <span>Customer CSAT Score</span>
              </div>
              <div className="trust-stat-divider" />
              <div className="trust-stat-box">
                <strong>&lt; 20ms</strong>
                <span>Webhook Dispatch Speed</span>
              </div>
            </div>
          </div>
        </section>
        <section className="faq-section"><div className="faq-intro"><div className="eyebrow">GOOD QUESTIONS</div><h2>Curious? Start here.</h2><p>Still have questions? Our team can help you find the right setup.</p><Link href="/contact-us" className="text-link">Talk to us <ArrowRight size={15} /></Link></div><div className="faq-list">{faqs.map(([question, answer]) => <details key={question}><summary>{question}<ArrowDown size={16} /></summary><p>{answer}</p></details>)}</div></section>
        <section className="final-cta"><div className="cta-glow" /><div className="eyebrow">YOUR NEXT GREAT SEND STARTS HERE</div><h2>Make your next email<br />a little more meaningful.</h2><p>Bring campaigns and product email together in one workspace built around your team.</p><form className="cta-form" onSubmit={(event) => { event.preventDefault(); setSubmitted(true) }}><label className="sr-only" htmlFor="cta-email">Work email</label><input id="cta-email" type="email" placeholder="Enter your work email" value={email} onChange={(event) => setEmail(event.target.value)} required /><button className="button button-white" type="submit">{submitted ? 'You’re on the list' : 'Get started'} <ArrowRight size={15} /></button></form><small>No credit card required · Frontend demo only</small></section>
      </> : <section className="secondary-page"><div className="secondary-hero"><div className="secondary-copy"><div className="eyebrow">{info.eyebrow.toUpperCase()}</div><h1>{info.title}</h1><p>{info.description}</p><div className="hero-actions"><Link href="/signup" className="button button-primary button-large">Get started <ArrowRight size={15} /></Link><Link href="/app/overview" className="button button-secondary button-large">Open demo workspace <ArrowUpRight size={15} /></Link></div></div><div className="secondary-preview"><div className="secondary-preview-icon"><Mail size={26} /></div><h3>One place for every send.</h3><p>Campaigns, automation, API, SMTP, and delivery insights work better together.</p><div className="secondary-preview-stats"><span><b>99.2%</b><small>delivery rate</small></span><span><b>42.8%</b><small>open rate</small></span><span><b>24/7</b><small>visibility</small></span></div></div></div><div className="secondary-content"><div className="secondary-feature-grid">{info.bullets.map((bullet, index) => <article key={bullet}><span className="feature-icon"><Check size={18} /></span><h3>{bullet}</h3><p>Keep your team moving with a clear, connected workflow designed to make email easier to manage.</p><Link href={index === 0 ? '/app/campaigns' : index === 1 ? '/app/domains' : '/app/analytics'}>Explore in workspace <ArrowRight size={14} /></Link></article>)}</div><section className="secondary-how"><div className="eyebrow">HOW IT WORKS</div><h2>A clear path from setup to insight.</h2><div className="secondary-step-row">{steps.slice(0, 4).map(([number, title]) => <div key={number}><span>{number}</span><b>{title}</b></div>)}</div></section>{page === 'pricing' && <div className="secondary-pricing"><h2>Plans made for your next stage</h2><div className="pricing-grid">{['Starter · Free', 'Growth · $49 / month', 'Scale · Let’s talk'].map((plan) => <article className="price-card" key={plan}><small>METROMAIL</small><h3>{plan}</h3><p>Illustrative plan details for the frontend demo.</p><Link href="/signup" className="button button-primary full-button">Get started</Link></article>)}</div></div>}</div><div className="secondary-cta"><div><div className="eyebrow">READY WHEN YOU ARE</div><h2>Let’s make email work better.</h2></div><Link href="/signup" className="button button-primary">Create your workspace <ArrowRight size={15} /></Link></div></section>}
      <footer className="marketing-footer"><div className="footer-main"><div className="footer-brand"><BrandMark productLabel="Email Cloud" /><p>Better customer communication, from the first campaign to the latest API event.</p><span className="footer-sample">A MetroVPS product concept</span></div><div className="footer-column"><b>Product</b>{products.map(([title, href]) => <Link href={href} key={href}>{title}</Link>)}<Link href="/pricing">Pricing</Link></div><div className="footer-column"><b>Resources</b>{resources.map(([title, href]) => <Link href={href} key={href}>{title}</Link>)}<Link href="/faq">FAQ</Link></div><div className="footer-column"><b>Company</b><Link href="/about-us">About us</Link><Link href="/contact-us">Contact</Link><Link href="/privacy-policy">Privacy</Link><Link href="/terms-conditions">Terms</Link></div></div><div className="footer-bottom"><span>© 2026 MetroVPS. MetroMail is a frontend product concept.</span><span><ShieldCheck size={14} /> Built for thoughtful sending</span></div></footer>
    </main>
  )
}
