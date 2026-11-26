export type MockRow = {
  name: string
  detail: string
  status: string
  metric: string
  date: string
  kind: string
}

export type NavItem = { label: string; href: string; icon: string }
export type NavGroup = { label: string; icon?: string; items: NavItem[] }

export const dashboardNav: NavGroup[] = [
  { label: 'Workspace', icon: 'LayoutDashboard', items: [
    { label: 'Overview', href: '/app/overview', icon: 'LayoutDashboard' },
  //   { label: 'Campaigns', href: '/app/campaigns', icon: 'Send' },
  //   { label: 'SMS & WhatsApp', href: '/app/campaigns/sms', icon: 'Smartphone' },
  //   { label: 'Contacts & CRM', href: '/app/contacts', icon: 'ContactRound' },
  //   { label: 'Sales Deals', href: '/app/deals', icon: 'Kanban' },
  //   { label: 'Automations', href: '/app/automations', icon: 'Workflow' },
  //   { label: 'Form Builder', href: '/app/forms', icon: 'Sliders' },
  ] },
  { label: 'Deliverability', icon: 'Send', items: [
    { label: 'Domains', href: '/app/domains', icon: 'Globe2' },
    { label: 'Suppressions', href: '/app/suppressions', icon: 'ShieldBan' },
    { label: 'Webhooks', href: '/app/webhooks', icon: 'Webhook' },
    // { label: 'Mailing Lists', href: '/app/mailing-lists', icon: 'Users' },
    // { label: 'Domain Settings', href: '/app/domain-settings', icon: 'Settings2' },
    { label: 'Receiving', href: '/app/receiving', icon: 'Inbox' },
    { label: 'Transactional email', href: '/app/transactional', icon: 'MailCheck' },
    // { label: 'Email Validator', href: '/app/verify', icon: 'CheckCheck' },
    // { label: 'Inbox Placement', href: '/app/inbox-placement', icon: 'Inbox' },
    // { label: 'Inbound Routes', href: '/app/inbound-routes', icon: 'Route' },
    { label: 'SMTP & API', href: '/app/api-keys', icon: 'Braces' },
    { label: 'Email logs', href: '/app/logs', icon: 'ListFilter' },
  ] },
   { label: 'Marketing', icon: 'Sparkles', items: [
    { label: 'Campaigns', href: '/app/campaigns', icon: 'Send' },
    { label: 'Templates', href: '/app/templates', icon: 'LayoutTemplate' },
    // { label: 'SMS & WhatsApp', href: '/app/campaigns/sms', icon: 'Smartphone' },
    { label: 'Contacts', href: '/app/contacts', icon: 'ContactRound' },
    // { label: 'Sales Deals', href: '/app/deals', icon: 'Kanban' },
    // { label: 'Automations', href: '/app/automations', icon: 'Workflow' },
    // { label: 'Form Builder', href: '/app/forms', icon: 'Sliders' },
  ] },
  { label: 'Insights', icon: 'ChartNoAxesCombined', items: [
    { label: 'Analytics', href: '/app/analytics', icon: 'ChartNoAxesCombined' },
    // { label: 'Integrations', href: '/app/integrations', icon: 'Blocks' },
  ] },
  // { label: 'Manage', items: [
  //   { label: 'Billing & usage', href: '/app/billing', icon: 'CreditCard' },
  //   { label: 'Settings', href: '/app/settings', icon: 'Settings2' },
  //   { label: 'Help & support', href: '/app/support', icon: 'CircleHelp' },
  // ] },
]

export const chartData = [
  { day: 'Mon', delivered: 31, opened: 18, clicked: 7 },
  { day: 'Tue', delivered: 42, opened: 23, clicked: 9 },
  { day: 'Wed', delivered: 36, opened: 20, clicked: 8 },
  { day: 'Thu', delivered: 56, opened: 32, clicked: 14 },
  { day: 'Fri', delivered: 48, opened: 27, clicked: 11 },
  { day: 'Sat', delivered: 66, opened: 38, clicked: 16 },
  { day: 'Sun', delivered: 59, opened: 34, clicked: 13 },
]

const campaignRows: MockRow[] = [
  { name: 'November product notes', detail: 'Product updates · 8,420 recipients', status: 'Sent', metric: '42.8% opens', date: 'Nov 12, 2026', kind: 'Campaign' },
  { name: 'A little something for you', detail: 'Customer newsletter · 5,106 recipients', status: 'Scheduled', metric: '—', date: 'Nov 18, 2026', kind: 'Campaign' },
  { name: 'Fall collection is here', detail: 'E-commerce · 12,208 recipients', status: 'Sent', metric: '38.2% opens', date: 'Nov 08, 2026', kind: 'Campaign' },
  { name: 'Welcome to MetroVPS', detail: 'Welcome series · 2,084 recipients', status: 'Draft', metric: '—', date: 'Nov 06, 2026', kind: 'Campaign' },
  { name: 'October round-up', detail: 'Monthly newsletter · 7,612 recipients', status: 'Sent', metric: '45.1% opens', date: 'Oct 30, 2026', kind: 'Campaign' },
  { name: 'Early access: Atlas', detail: 'Product launch · 3,920 recipients', status: 'Sent', metric: '51.4% opens', date: 'Oct 22, 2026', kind: 'Campaign' },
]

const contactRows: MockRow[] = [
  { name: 'Avery Chen', detail: 'avery.chen@northstar.io · Customer', status: 'Subscribed', metric: '12 campaigns', date: 'Nov 14, 2026', kind: 'Contact' },
  { name: 'Jordan Rivera', detail: 'jordan@studiojuniper.co · Lead', status: 'Subscribed', metric: '8 campaigns', date: 'Nov 13, 2026', kind: 'Contact' },
  { name: 'Morgan Patel', detail: 'morgan.patel@acme.dev · Customer', status: 'Subscribed', metric: '16 campaigns', date: 'Nov 12, 2026', kind: 'Contact' },
  { name: 'Taylor Kim', detail: 'taylor@wearemono.com · Trial', status: 'Unconfirmed', metric: '3 campaigns', date: 'Nov 11, 2026', kind: 'Contact' },
  { name: 'Casey Brooks', detail: 'casey.brooks@hey.com · Customer', status: 'Subscribed', metric: '6 campaigns', date: 'Nov 10, 2026', kind: 'Contact' },
  { name: 'Riley Morgan', detail: 'riley@coastline.shop · Lead', status: 'Subscribed', metric: '4 campaigns', date: 'Nov 09, 2026', kind: 'Contact' },
  { name: 'Jamie Park', detail: 'jamie@northstar.io · Former subscriber', status: 'Unsubscribed', metric: '2 campaigns', date: 'Nov 07, 2026', kind: 'Contact' },
  { name: 'Sam Reed', detail: 'sam@studiojuniper.co · Suppressed by request', status: 'Blocklisted', metric: '0 campaigns', date: 'Nov 05, 2026', kind: 'Contact' },
]

const contactListRows: MockRow[] = [
  { name: 'Product updates', detail: 'Marketing list · Monthly product news', status: 'Active', metric: '6,804 contacts', date: 'Updated Nov 14, 2026', kind: 'List' },
  { name: 'New subscribers', detail: 'Signup form · Welcome series', status: 'Active', metric: '4,420 contacts', date: 'Updated Nov 12, 2026', kind: 'List' },
  { name: 'Beta customers', detail: 'Imported list · Product research', status: 'Active', metric: '1,206 contacts', date: 'Updated Nov 08, 2026', kind: 'List' },
]

const signupFormRows: MockRow[] = [
  { name: 'Product newsletter', detail: 'Embedded form · /subscribe', status: 'Published', metric: '1,284 submissions', date: 'Updated Nov 12, 2026', kind: 'Signup form' },
  { name: 'Product launch waitlist', detail: 'Hosted form · /early-access', status: 'Published', metric: '682 submissions', date: 'Updated Nov 07, 2026', kind: 'Signup form' },
  { name: 'Footer signup', detail: 'Embedded form · Website footer', status: 'Draft', metric: '0 submissions', date: 'Updated Nov 03, 2026', kind: 'Signup form' },
]

const attributeRows: MockRow[] = [
  { name: 'Lifecycle stage', detail: 'Text attribute · Used in 4 segments', status: 'Active', metric: '6 values', date: 'Created Oct 18, 2026', kind: 'Attribute' },
  { name: 'Plan type', detail: 'Text attribute · Used in 2 segments', status: 'Active', metric: '4 values', date: 'Created Oct 22, 2026', kind: 'Attribute' },
  { name: 'Last purchase date', detail: 'Date attribute · Used in 1 segment', status: 'Active', metric: '2,408 values', date: 'Created Oct 30, 2026', kind: 'Attribute' },
]

const logRows: MockRow[] = [
  { name: 'Welcome to Atlas', detail: 'avery.chen@northstar.io · API', status: 'Delivered', metric: '42 ms', date: 'Today, 10:42 AM', kind: 'Event' },
  { name: 'Your sign-in code', detail: 'jordan@studiojuniper.co · SMTP', status: 'Opened', metric: '86 ms', date: 'Today, 10:39 AM', kind: 'Event' },
  { name: 'Order confirmation #9821', detail: 'morgan.patel@acme.dev · API', status: 'Delivered', metric: '51 ms', date: 'Today, 10:35 AM', kind: 'Event' },
  { name: 'Password reset request', detail: 'taylor@wearemono.com · API', status: 'Bounced', metric: '—', date: 'Today, 10:28 AM', kind: 'Event' },
  { name: 'November product notes', detail: 'casey.brooks@hey.com · Campaign', status: 'Clicked', metric: '124 ms', date: 'Today, 10:16 AM', kind: 'Event' },
  { name: 'Invoice ready', detail: 'riley@coastline.shop · API', status: 'Delivered', metric: '49 ms', date: 'Today, 9:58 AM', kind: 'Event' },
  { name: 'Account security alert', detail: 'sam@studiojuniper.co · API', status: 'Failed', metric: '—', date: 'Today, 9:41 AM', kind: 'Event' },
  { name: 'Welcome discount', detail: 'noah@northstar.io · Campaign', status: 'Rejected', metric: 'Mailbox policy', date: 'Today, 9:34 AM', kind: 'Event' },
  { name: 'Weekly digest', detail: 'alex@coastline.shop · Campaign', status: 'Complaint', metric: 'Spam report', date: 'Today, 9:19 AM', kind: 'Event' },
  { name: 'Product launch update', detail: 'lee@studiojuniper.co · Campaign', status: 'Unsubscribed', metric: 'Preference center', date: 'Today, 9:02 AM', kind: 'Event' },
]

const domainRows: MockRow[] = [
  { name: 'mail.metrovps.com', detail: 'Default sending domain · US East', status: 'Verified', metric: '99.98% health', date: 'Added Oct 18, 2026', kind: 'Domain' },
  { name: 'updates.metrovps.com', detail: 'Marketing · US East', status: 'Verified', metric: '98.4% health', date: 'Added Oct 08, 2026', kind: 'Domain' },
  { name: 'mg.metrovps.net', detail: 'Transactional · EU West', status: 'Action needed', metric: 'DKIM missing', date: 'Added Nov 14, 2026', kind: 'Domain' },
]

const keyRows: MockRow[] = [
  { name: 'Production · Core API', detail: 'key_live_••••••••••••4b9d', status: 'Active', metric: '8,420 requests', date: 'Created Oct 18, 2026', kind: 'API key' },
  { name: 'Staging · Web app', detail: 'key_test_••••••••••••1e3a', status: 'Active', metric: '1,208 requests', date: 'Created Oct 12, 2026', kind: 'API key' },
  { name: 'Legacy integration', detail: 'key_live_••••••••••••c823', status: 'Revoked', metric: '—', date: 'Revoked Sep 26, 2026', kind: 'API key' },
]

const integrationRows: MockRow[] = [
  { name: 'Shopify', detail: 'E-commerce · Sample integration', status: 'Available', metric: 'Sync customers', date: 'Popular', kind: 'Integration' },
  { name: 'HubSpot', detail: 'CRM · Sample integration', status: 'Connected', metric: '2,408 contacts', date: 'Connected Oct 22, 2026', kind: 'Integration' },
  { name: 'Zapier', detail: 'Automation · Sample integration', status: 'Available', metric: '1,000+ workflows', date: 'Popular', kind: 'Integration' },
  { name: 'Segment', detail: 'Developer tools · Sample integration', status: 'Available', metric: 'Event tracking', date: 'New', kind: 'Integration' },
]

export function getRowsForRoute(route: string): MockRow[] {
  const normalized = route.toLowerCase()

  if (normalized.includes('campaign')) {
    if (normalized.includes('ab-tests')) return [
      { name: 'November subject line test', detail: 'Product updates · 2 variants · 4,210 recipients', status: 'Completed', metric: 'Variant B won', date: 'Nov 12, 2026', kind: 'Campaign' },
      { name: 'Welcome subject test', detail: 'New subscribers · 2 variants · 1,042 recipients', status: 'Running', metric: 'Collecting results', date: 'Nov 16, 2026', kind: 'Campaign' },
    ]
    if (normalized.endsWith('/drafts')) return campaignRows.filter((row) => row.status === 'Draft')
    if (normalized.endsWith('/scheduled')) return campaignRows.filter((row) => row.status === 'Scheduled')
    if (normalized.endsWith('/sent')) return campaignRows.filter((row) => row.status === 'Sent')
    return campaignRows
  }

  if (normalized.includes('contact') || normalized.includes('segment') || normalized.includes('list') || normalized.includes('form')) {
    if (normalized.endsWith('/lists')) return contactListRows
    if (normalized.endsWith('/forms')) return signupFormRows
    if (normalized.endsWith('/attributes')) return attributeRows
    if (normalized.endsWith('/unsubscribed')) return contactRows.filter((row) => row.status === 'Unsubscribed')
    if (normalized.endsWith('/blocklisted')) return contactRows.filter((row) => row.status === 'Blocklisted')
    return contactRows
  }

  if (normalized.includes('logs')) {
    if (normalized.endsWith('/delivered')) return logRows.filter((row) => row.status === 'Delivered')
    if (normalized.endsWith('/bounced')) return logRows.filter((row) => row.status === 'Bounced')
    if (normalized.endsWith('/failed')) return logRows.filter((row) => row.status === 'Failed')
    if (normalized.endsWith('/opened')) return logRows.filter((row) => row.status === 'Opened')
    if (normalized.endsWith('/clicked')) return logRows.filter((row) => row.status === 'Clicked')
    if (normalized.endsWith('/rejected')) return logRows.filter((row) => row.status === 'Rejected')
    if (normalized.endsWith('/complaints')) return logRows.filter((row) => row.status === 'Complaint')
    if (normalized.endsWith('/unsubscribes')) return logRows.filter((row) => row.status === 'Unsubscribed')
    return logRows
  }

  if (normalized.includes('domain')) return domainRows
  if (normalized.includes('key') || normalized.includes('api') || normalized.includes('smtp')) return keyRows
  if (normalized.includes('integration')) return integrationRows
  if (normalized.includes('suppress') || normalized.includes('bounce') || normalized.includes('unsubscribe') || normalized.includes('complaint')) {
    const suppressionRows: MockRow[] = [
      { name: 'bad-address@sample.co', detail: 'Hard bounce · Invalid mailbox', status: 'Bounced', metric: 'Permanent', date: 'Nov 14, 2026', kind: 'Suppression' },
      { name: 'no-longer@sample.co', detail: 'Unsubscribe · Campaign', status: 'Unsubscribed', metric: 'Marketing', date: 'Nov 12, 2026', kind: 'Suppression' },
      { name: 'abuse@sample.co', detail: 'Spam complaint · Gmail', status: 'Complaint', metric: 'High priority', date: 'Nov 08, 2026', kind: 'Suppression' },
      { name: 'safe@sample.co', detail: 'Allowlisted · Manual review', status: 'Allowlisted', metric: 'Transactional', date: 'Nov 02, 2026', kind: 'Suppression' },
      { name: 'blocked@sample.co', detail: 'Manual block · Account request', status: 'Blocklisted', metric: 'Manual', date: 'Oct 28, 2026', kind: 'Suppression' },
    ]
    if (normalized.endsWith('/bounces')) return suppressionRows.filter((row) => row.status === 'Bounced')
    if (normalized.endsWith('/unsubscribes')) return suppressionRows.filter((row) => row.status === 'Unsubscribed')
    if (normalized.endsWith('/complaints')) return suppressionRows.filter((row) => row.status === 'Complaint')
    if (normalized.endsWith('/blocklist')) return suppressionRows.filter((row) => row.status === 'Blocklisted')
    if (normalized.endsWith('/allowlist')) return suppressionRows.filter((row) => row.status === 'Allowlisted')
    return suppressionRows
  }
  if (normalized.includes('billing')) return [
    { name: 'October 2026', detail: 'MetroMail Growth · Visa ending 4242', status: 'Paid', metric: '$49.00', date: 'Nov 01, 2026', kind: 'Invoice' },
    { name: 'September 2026', detail: 'MetroMail Growth · Visa ending 4242', status: 'Paid', metric: '$49.00', date: 'Oct 01, 2026', kind: 'Invoice' },
    { name: 'August 2026', detail: 'MetroMail Growth · Visa ending 4242', status: 'Paid', metric: '$49.00', date: 'Sep 01, 2026', kind: 'Invoice' },
  ]
  if (normalized.includes('automation')) return [
    { name: 'New customer welcome', detail: 'Contact joins list · 3 steps', status: 'Active', metric: '1,204 enrolled', date: 'Updated Nov 14, 2026', kind: 'Workflow' },
    { name: 'Trial onboarding', detail: 'User signs up · 5 steps', status: 'Active', metric: '842 enrolled', date: 'Updated Nov 12, 2026', kind: 'Workflow' },
    { name: 'Win-back series', detail: 'Inactive for 30 days · 4 steps', status: 'Paused', metric: '216 enrolled', date: 'Updated Nov 06, 2026', kind: 'Workflow' },
  ]
  if (normalized.includes('support')) return [
    { name: 'Domain verification guide', detail: 'Getting started · 4 min read', status: 'Guide', metric: 'Recommended', date: 'Updated this week', kind: 'Help article' },
    { name: 'Send your first API email', detail: 'Developer docs · 6 min read', status: 'Guide', metric: 'API', date: 'Updated Oct 30, 2026', kind: 'Help article' },
    { name: 'Campaign deliverability basics', detail: 'Best practices · 8 min read', status: 'Guide', metric: 'Deliverability', date: 'Updated Oct 26, 2026', kind: 'Help article' },
  ]
  return logRows
}

export const statCards = [
  { label: 'Emails sent', value: '248,532', change: '+12.8%', note: 'vs. last month', icon: 'Send' },
  { label: 'Delivery rate', value: '99.2%', change: '+0.6%', note: 'vs. last month', icon: 'CircleCheck' },
  { label: 'Open rate', value: '42.8%', change: '+3.4%', note: 'vs. last month', icon: 'MailOpen' },
  { label: 'Click rate', value: '8.6%', change: '+1.2%', note: 'vs. last month', icon: 'MousePointerClick' },
]
