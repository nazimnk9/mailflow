'use client'

import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { DataExportMenu } from '@/components/data-export-menu'
import { TablePagination } from '@/components/table-pagination'
import { isWithinDateRange } from '@/lib/table-utils'
import Link from 'next/link'
import { ArrowDownToLine, ArrowLeft, ArrowRight, CalendarDays, Check, ChevronLeft, ChevronRight, Clock3, Code2, CreditCard, Mail, MoreHorizontal, Plus, Search, ShieldCheck, Users, Webhook } from 'lucide-react'

type ExtraPageProps = { route: string; search: string; setSearch: (value: string) => void; onAction: (message: string) => void; onOpenTicket: () => void }

const extraRoutes = new Set([
  'campaigns/calendar',
  'campaigns/templates',
  'contacts/tags',
  'contacts/preferences',
  'api-keys/requests',
  'webhooks/deliveries',
  'support/tickets',
  'billing/plans',
  'billing/usage',
  'billing/payment-methods',
  'billing/invoices',
  'analytics/campaigns',
  'analytics/domains',
  'analytics/devices',
  'analytics/geography',
  'analytics/providers',
])

export function hasDashboardExtraPage(route: string) {
  return extraRoutes.has(route) || route.startsWith('api-keys/requests/')
}

export function DashboardExtraPage({ route, search, setSearch, onAction, onOpenTicket }: ExtraPageProps) {
  let content: ReactNode = null
  if (route === 'campaigns/calendar') content = <CampaignCalendarPage onAction={onAction} />
  else if (route === 'campaigns/templates') content = <CampaignTemplatesPage onAction={onAction} />
  else if (route === 'contacts/tags') content = <ContactTagsPage onAction={onAction} />
  else if (route === 'contacts/preferences') content = <ContactPreferencesPage onAction={onAction} />
  else if (route === 'api-keys/requests') content = <ApiRequestLogsPage onAction={onAction} search={search} setSearch={setSearch} />
  else if (route.startsWith('api-keys/requests/')) content = <ApiRequestDetailPage route={route} onAction={onAction} />
  else if (route === 'webhooks/deliveries') content = <WebhookDeliveriesPage onAction={onAction} search={search} setSearch={setSearch} />
  else if (route === 'support/tickets') content = <SupportTicketsPage onOpenTicket={onOpenTicket} />
  else if (route.startsWith('billing/')) content = <BillingSubpage route={route} onAction={onAction} />
  else if (route.startsWith('analytics/')) content = <AnalyticsBreakdownPage route={route} onAction={onAction} search={search} setSearch={setSearch} />
  return <><ExtraSectionTabs route={route} />{content}</>
}

function ExtraSectionTabs({ route }: { route: string }) {
  const tabs: [string, string][] = route.startsWith('campaigns')
    ? [['All campaigns', 'campaigns'], ['Drafts', 'campaigns/drafts'], ['Scheduled', 'campaigns/scheduled'], ['Sent', 'campaigns/sent'], ['A/B tests', 'campaigns/ab-tests'], ['Calendar', 'campaigns/calendar'], ['Templates', 'campaigns/templates']]
    : route.startsWith('contacts')
      ? [
          ['All contacts', 'contacts'],
          ['List', 'contacts/lists'],
          // ['Segments', 'contacts/segments'],
          // ['Tags', 'contacts/tags'],
          // ['Signup forms', 'contacts/forms'],
          // ['Attributes', 'contacts/attributes'],
          // ['Unsubscribed', 'contacts/unsubscribed'],
          // ['Blocklisted', 'contacts/blocklisted'],
          // ['Preferences', 'contacts/preferences'],
        ]
      : route.startsWith('api-keys')
        ? [['API keys', 'api-keys'], ['SMTP', 'api-keys/smtp'], ['API docs', 'api-keys/docs'], ['Requests', 'api-keys/requests'], ['Webhooks', 'webhooks'], ['Deliveries', 'webhooks/deliveries']]
        : route.startsWith('webhooks')
          ? [['Webhooks', 'webhooks'], ['Deliveries', 'webhooks/deliveries']]
          : route.startsWith('billing')
            ? [['Overview', 'billing'], ['Plans', 'billing/plans'], ['Usage', 'billing/usage'], ['Payment methods', 'billing/payment-methods'], ['Invoices', 'billing/invoices']]
          : route.startsWith('analytics')
              ? [['Overview', 'analytics'], ['Campaigns', 'analytics/campaigns'], ['Domains', 'analytics/domains'], ['Devices', 'analytics/devices'], ['Geography', 'analytics/geography'], ['Providers', 'analytics/providers']]
              : route.startsWith('support')
                ? [['Help center', 'support'], ['Tickets', 'support/tickets']]
                : []

  if (!tabs.length) return null
  return <nav className="section-tabs" aria-label={`${route.split('/')[0]} sections`}>{tabs.map(([label, href]) => <Link className={route === href || (href !== route.split('/')[0] && route.startsWith(`${href}/`)) ? 'active' : ''} href={`/app/${href}`} key={href}>{label}</Link>)}</nav>
}

function PageHeading({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children?: ReactNode }) {
  return <div className="page-heading-row"><div><div className="page-eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{children && <div className="page-heading-actions">{children}</div>}</div>
}

function Panel({ title, description, children, action }: { title: string; description?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return <section className="dashboard-panel extra-panel"><div className="panel-heading"><div><h2>{title}</h2>{description && <p>{description}</p>}</div>{action}</div>{children}</section>
}

function CampaignCalendarPage({ onAction }: { onAction: (message: string) => void }) {
  const [month, setMonth] = useState(new Date(2026, 10, 1))
  const [selectedDate, setSelectedDate] = useState('2026-11-18')
  const start = new Date(month.getFullYear(), month.getMonth(), 1)
  const gridStart = new Date(start)
  gridStart.setDate(start.getDate() - ((start.getDay() + 6) % 7))
  const days = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart)
    date.setDate(gridStart.getDate() + index)
    return date
  })
  const campaignDays: Record<string, { title: string; tone: string }[]> = {
    '2026-11-18': [{ title: 'A little something for you', tone: 'blue' }],
    '2026-11-23': [{ title: 'Cyber week preview', tone: 'purple' }],
    '2026-11-26': [{ title: 'Thanksgiving note', tone: 'cyan' }],
    '2026-11-30': [{ title: 'November round-up', tone: 'green' }],
  }
  const selectedEvents = campaignDays[selectedDate] ?? []
  const monthTitle = month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const formatKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  const moveMonth = (amount: number) => {
    const nextMonth = new Date(month.getFullYear(), month.getMonth() + amount, 1)
    setMonth(nextMonth)
    setSelectedDate(formatKey(nextMonth))
  }

  return <div className="extra-page">
    <PageHeading eyebrow="CAMPAIGNS / PLANNING" title="Campaign calendar" description="Plan upcoming sends and keep your team aligned.">
      <Link className="button button-secondary" href="/app/campaigns/templates">Browse templates <ArrowRight size={14} /></Link>
      <Link className="button button-primary" href="/app/campaigns/create"><Plus size={14} /> Create campaign</Link>
    </PageHeading>
    <div className="extra-calendar-layout">
      <Panel title={monthTitle} description="Scheduled campaigns and important send dates" action={<div className="extra-calendar-controls"><button aria-label="Previous month" onClick={() => moveMonth(-1)}><ChevronLeft size={16} /></button><button aria-label="Next month" onClick={() => moveMonth(1)}><ChevronRight size={16} /></button></div>}>
        <div className="extra-calendar-grid" role="grid" aria-label={monthTitle}>
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => <div className="extra-calendar-weekday" key={day}>{day}</div>)}
          {days.map((date) => {
            const key = formatKey(date)
            const events = campaignDays[key] ?? []
            return <button key={key} className={`extra-calendar-day ${date.getMonth() !== month.getMonth() ? 'extra-calendar-outside' : ''} ${selectedDate === key ? 'extra-calendar-selected' : ''}`} aria-label={`${date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}${events.length ? `, ${events.length} scheduled campaign${events.length > 1 ? 's' : ''}` : ''}`} aria-pressed={selectedDate === key} onClick={() => setSelectedDate(key)}>
              <span>{date.getDate()}</span>{events.map((event) => <i className={`extra-calendar-event event-${event.tone}`} key={event.title}>{event.title}</i>)}
            </button>
          })}
        </div>
      </Panel>
      <Panel title="Selected day" description={new Date(`${selectedDate}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}>
        {selectedEvents.length ? <div className="extra-event-list">{selectedEvents.map((event) => <article className="extra-event-card" key={event.title}><span className={`extra-event-dot event-${event.tone}`} /><div><b>{event.title}</b><small>Marketing campaign · 10:00 AM</small></div><button aria-label={`Open ${event.title} actions`} onClick={() => onAction(`${event.title} selected.`)}><MoreHorizontal size={16} /></button></article>)}</div> : <div className="extra-empty-state"><CalendarDays size={22} /><b>No campaigns scheduled</b><span>Choose this date for your next send.</span><Link href="/app/campaigns/create">Create a campaign <ArrowRight size={13} /></Link></div>}
      </Panel>
    </div>
    <div className="extra-callout"><Clock3 size={16} /><span><b>Schedule with confidence</b><small>Campaign times are shown in your workspace timezone.</small></span><button className="text-link" onClick={() => onAction('Workspace timezone settings opened.')}>Review settings <ArrowRight size={13} /></button></div>
  </div>
}

function CampaignTemplatesPage({ onAction }: { onAction: (message: string) => void }) {
  const templates = [
    { name: 'Product update', type: 'Newsletter', color: 'blue', description: 'A clear, editorial layout for feature launches and product news.' },
    { name: 'Welcome series', type: 'Lifecycle', color: 'purple', description: 'Introduce your product and guide new subscribers to their first win.' },
    { name: 'Seasonal offer', type: 'Promotion', color: 'orange', description: 'A focused offer template with a strong call to action.' },
    { name: 'Monthly digest', type: 'Newsletter', color: 'cyan', description: 'Bring your latest stories and updates together in one send.' },
    { name: 'Event invitation', type: 'Announcement', color: 'green', description: 'Invite your audience and make the important details easy to scan.' },
    { name: 'Customer story', type: 'Editorial', color: 'pink', description: 'Share a customer outcome with a thoughtful, readable layout.' },
  ]
  const [query, setQuery] = useState('')
  const filtered = templates.filter((template) => `${template.name} ${template.type}`.toLowerCase().includes(query.trim().toLowerCase()))
  return <div className="extra-page">
    <PageHeading eyebrow="CAMPAIGNS / CONTENT" title="Campaign templates" description="Start with a polished layout, then make it your own.">
      <Link className="button button-primary" href="/app/campaigns/create"><Plus size={14} /> Create campaign</Link>
    </PageHeading>
    <div className="extra-filter-row"><label className="extra-search"><Search size={15} /><input aria-label="Search campaign templates" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search templates" /></label><span>{filtered.length} templates</span></div>
    <div className="extra-template-grid">{filtered.map((template) => <article className="extra-template-card" key={template.name}><div className={`extra-template-preview template-${template.color}`}><div className="extra-template-preview-top"><span>METROMAIL</span><i /></div><div className="extra-template-preview-body"><small>{template.type.toUpperCase()}</small><b>{template.name}</b><i /><i /><span>Explore what&apos;s new <ArrowRight size={11} /></span></div></div><div className="extra-template-meta"><div><small>{template.type}</small><h2>{template.name}</h2><p>{template.description}</p></div><button className="button button-secondary" onClick={() => onAction(`${template.name} template selected for a new campaign.`)}>Use template <ArrowRight size={13} /></button></div></article>)}</div>
    {filtered.length === 0 && <div className="extra-empty-inline">No templates match that search.</div>}
  </div>
}

function ContactTagsPage({ onAction }: { onAction: (message: string) => void }) {
  const [tags, setTags] = useState([
    { name: 'Customer', count: 4820, color: 'blue' }, { name: 'Product updates', count: 6804, color: 'cyan' }, { name: 'Trial', count: 1620, color: 'purple' }, { name: 'VIP', count: 482, color: 'orange' }, { name: 'Event attendee', count: 936, color: 'green' }, { name: 'Needs follow-up', count: 214, color: 'pink' },
  ])
  const [newTag, setNewTag] = useState('')
  const [query, setQuery] = useState('')
  const filtered = tags.filter((tag) => tag.name.toLowerCase().includes(query.toLowerCase()))
  const createTag = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const name = newTag.trim()
    if (!name) return
    if (tags.some((tag) => tag.name.toLowerCase() === name.toLowerCase())) {
      onAction(`Tag “${name}” already exists.`)
      return
    }
    setTags((current) => [{ name, count: 0, color: 'blue' }, ...current])
    setNewTag('')
    onAction(`Tag “${name}” created.`)
  }
  return <div className="extra-page">
    <PageHeading eyebrow="CONTACTS & CRM / ORGANIZATION" title="Contact tags" description="Label contacts with useful context your team can act on.">
      <Link className="button button-secondary" href="/app/contacts/preferences">Subscription preferences <ArrowRight size={14} /></Link>
    </PageHeading>
    <Panel title="Create a tag" description="Tags help you organize contacts across lists and segments.">
      <form className="extra-inline-form" onSubmit={createTag}><label htmlFor="new-contact-tag">Tag name</label><input id="new-contact-tag" value={newTag} onChange={(event) => setNewTag(event.target.value)} placeholder="e.g. Product beta" maxLength={48} /><button className="button button-primary" disabled={!newTag.trim()}><Plus size={14} /> Add tag</button></form>
    </Panel>
    <div className="extra-list-heading"><div><h2>Your tags</h2><p>{tags.length} tags across your audience</p></div><label className="extra-search"><Search size={15} /><input aria-label="Search tags" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tags" /></label></div>
    <div className="extra-tag-grid">{filtered.map((tag) => <article className="extra-tag-card" key={tag.name}><span className={`extra-tag-dot tag-${tag.color}`} /><div><b>{tag.name}</b><small>{tag.count.toLocaleString()} contacts</small></div><button aria-label={`View contacts tagged ${tag.name}`} onClick={() => onAction(`Showing contacts tagged “${tag.name}”.`)}><ArrowRight size={15} /></button></article>)}</div>
    {filtered.length === 0 && <div className="extra-empty-inline">No tags match your search.</div>}
  </div>
}

function ContactPreferencesPage({ onAction }: { onAction: (message: string) => void }) {
  const [preferences, setPreferences] = useState({ product: true, newsletter: true, events: false, research: false })
  const [saved, setSaved] = useState(false)
  const update = (key: keyof typeof preferences) => { setPreferences((current) => ({ ...current, [key]: !current[key] })); setSaved(false) }
  const save = () => { setSaved(true); onAction('Subscription preferences saved in this demo.') }
  const categories = [
    ['product', 'Product updates', 'Feature releases, improvements, and roadmap news.'],
    ['newsletter', 'Monthly newsletter', 'Ideas, customer stories, and the latest from MetroVPS.'],
    ['events', 'Events and webinars', 'Invitations to product sessions and community events.'],
    ['research', 'Research and surveys', 'Occasional requests to help improve the product.'],
  ] as const
  return <div className="extra-page">
    <PageHeading eyebrow="CONTACTS & CRM / PREFERENCES" title="Subscription preferences" description="Control which marketing topics your audience can choose to receive.">
      <button className="button button-primary" onClick={save}>{saved ? <Check size={14} /> : null}{saved ? 'Saved' : 'Save preferences'}</button>
    </PageHeading>
    <div className="extra-preference-layout"><Panel title="Preference center" description="These settings are shown to contacts when they manage their subscription.">{categories.map(([key, label, description]) => <label className="extra-preference-row" key={key}><span><b>{label}</b><small>{description}</small></span><input type="checkbox" checked={preferences[key]} onChange={() => update(key)} aria-label={`Enable ${label}`} /></label>)}</Panel><aside className="extra-preference-aside"><span><Users size={17} /></span><b>Give people control</b><p>Preference options help keep your list relevant and make it easy for subscribers to choose what they hear about.</p><button className="text-link" onClick={() => onAction('Subscription preference form preview opened.')}>Preview preference center <ArrowRight size={13} /></button></aside></div>
  </div>
}

const requestRows = [
  { id: 'req_7f2a9c18', method: 'POST', path: '/v1/messages', status: 202, latency: '42 ms', time: 'Today, 10:42:08 AM' },
  { id: 'req_1b4c21e9', method: 'POST', path: '/v1/messages', status: 429, latency: '18 ms', time: 'Today, 10:38:41 AM' },
  { id: 'req_8a9df024', method: 'GET', path: '/v1/domains', status: 200, latency: '31 ms', time: 'Today, 10:35:17 AM' },
  { id: 'req_32a7e4b1', method: 'POST', path: '/v1/templates', status: 201, latency: '57 ms', time: 'Today, 10:30:02 AM' },
  { id: 'req_4dc613aa', method: 'POST', path: '/v1/messages', status: 401, latency: '12 ms', time: 'Today, 10:26:49 AM' },
]

function ApiRequestLogsPage({ onAction, search, setSearch }: { onAction: (message: string) => void; search: string; setSearch: (value: string) => void }) {
  const [status, setStatus] = useState('All responses')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(3)
  const filtered = requestRows.filter((row) => (status === 'All responses' || String(row.status).startsWith(status)) && `${row.id} ${row.method} ${row.path} ${row.status} ${row.latency} ${row.time}`.toLowerCase().includes(search.trim().toLowerCase()) && isWithinDateRange(row.time, startDate, endDate))
  const pageRows = filtered.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize)
  const dateRangeError = Boolean(startDate && endDate && startDate > endDate)
  useEffect(() => setPageIndex(0), [search, status, startDate, endDate])
  const resetFilters = () => { setSearch(''); setStatus('All responses'); setStartDate(''); setEndDate('') }
  const exportRows = filtered.map((row) => ({ Request: row.id, Method: row.method, Endpoint: row.path, Response: row.status, Latency: row.latency, Time: row.time }))
  return <div className="extra-page">
    <PageHeading eyebrow="DEVELOPER TOOLS / OBSERVABILITY" title="API request logs" description="Inspect request outcomes and troubleshoot integration issues.">
      <DataExportMenu rows={exportRows} fileName="api-request-logs" onAction={onAction} />
      <Link className="button button-primary" href="/app/api-keys/docs">API documentation <Code2 size={14} /></Link>
    </PageHeading>
    <section className="extra-metric-row">{[['Requests today', '12,408', '+18.2%'], ['Success rate', '99.4%', '+0.8%'], ['Median latency', '42 ms', '−6 ms']].map(([label, value, change]) => <article className="extra-metric-card" key={label}><small>{label}</small><b>{value}</b><span>{change} vs. prior period</span></article>)}</section>
    <Panel title="Recent API requests" description={`${filtered.length} requests in the selected view`}>
      <div className="table-filter-bar extra-table-filter-bar"><label className="table-search-control"><Search size={15} aria-hidden="true" /><input aria-label="Search API request data" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search ID, endpoint, response…" />{search && <button type="button" aria-label="Clear search" onClick={() => setSearch('')}>×</button>}</label><div className="table-filter-controls"><label className="table-filter-control"><span>Response</span><select aria-label="Filter response status" value={status} onChange={(event) => setStatus(event.target.value)}><option>All responses</option><option value="2">Successful (2xx)</option><option value="4">Errors (4xx)</option></select></label><label className="table-filter-control table-date-control"><span>Start date</span><input aria-label="Start date" type="date" value={startDate} max={endDate || undefined} onChange={(event) => setStartDate(event.target.value)} /></label><label className="table-filter-control table-date-control"><span>End date</span><input aria-label="End date" type="date" value={endDate} min={startDate || undefined} aria-invalid={dateRangeError} onChange={(event) => setEndDate(event.target.value)} /></label><button className="table-reset-button" type="button" disabled={!search && status === 'All responses' && !startDate && !endDate} onClick={resetFilters}>Reset</button></div>{dateRangeError && <p className="table-filter-error" role="alert">Start date must be on or before the end date.</p>}</div>
      <div className="extra-table-wrap"><table className="extra-table"><thead><tr><th>Request</th><th>Method</th><th>Endpoint</th><th>Response</th><th>Latency</th><th>Time</th><th><span className="sr-only">Open request</span></th></tr></thead><tbody>{pageRows.map((row) => <tr key={row.id}><td><Link className="extra-mono-link" href={`/app/api-keys/requests/${row.id}`}>{row.id}</Link></td><td><span className={`extra-method method-${row.method.toLowerCase()}`}>{row.method}</span></td><td><code>{row.path}</code></td><td><span className={`extra-response ${row.status >= 400 ? 'response-error' : 'response-success'}`}>{row.status}</span></td><td>{row.latency}</td><td>{row.time}</td><td><Link aria-label={`View ${row.id} details`} href={`/app/api-keys/requests/${row.id}`}><ArrowRight size={14} /></Link></td></tr>)}</tbody></table></div>
      <div className="extra-mobile-list">{pageRows.map((row) => <Link className="extra-request-card" key={row.id} href={`/app/api-keys/requests/${row.id}`}><div><b>{row.method} <code>{row.path}</code></b><small>{row.id} · {row.time}</small></div><span className={`extra-response ${row.status >= 400 ? 'response-error' : 'response-success'}`}>{row.status}</span></Link>)}</div>
      {filtered.length === 0 && <div className="extra-table-empty">No requests match these filters.</div>}
      <TablePagination pageIndex={pageIndex} pageSize={pageSize} totalItems={filtered.length} pageSizeOptions={[3, 5, 10]} onPageChange={setPageIndex} onPageSizeChange={setPageSize} />
    </Panel>
  </div>
}

function ApiRequestDetailPage({ route, onAction }: { route: string; onAction: (message: string) => void }) {
  const requestId = route.split('/').at(-1) ?? requestRows[0].id
  const request = requestRows.find((row) => row.id === requestId) ?? requestRows[0]
  const response = request.status >= 400 ? '{\n  "error": {\n    "type": "rate_limit_exceeded",\n    "message": "Request limit reached for this workspace."\n  }\n}' : '{\n  "id": "msg_demo_7f2a9c18",\n  "status": "accepted",\n  "created_at": "2026-11-16T10:42:08Z"\n}'
  return <div className="extra-page">
    <PageHeading eyebrow="API REQUEST LOGS / REQUEST DETAIL" title={requestId} description={`${request.method} ${request.path} · ${request.time}`}>
      <Link className="button button-secondary" href="/app/api-keys/requests"><ArrowLeft size={14} /> Back to requests</Link>
      <button className="button button-secondary" onClick={() => onAction(`Request ${requestId} copied.`)}>Copy request ID</button>
    </PageHeading>
    <div className="extra-detail-grid"><Panel title="Request summary" description="Request metadata and response timing"><div className="extra-detail-list"><div><span>Response</span><b className={request.status >= 400 ? 'extra-text-error' : 'extra-text-good'}>{request.status} {request.status >= 400 ? 'Rate limited' : 'Accepted'}</b></div><div><span>Method</span><b>{request.method}</b></div><div><span>Endpoint</span><code>{request.path}</code></div><div><span>Latency</span><b>{request.latency}</b></div><div><span>API key</span><b>Production · key_live_••••4b9d</b></div><div><span>Request ID</span><code>{request.id}</code></div></div></Panel><Panel title="Response body" description="Sensitive values are masked in this demo"><pre className="extra-code-block"><code>{response}</code></pre><button className="button button-secondary" onClick={() => onAction('Response body copied.')}>Copy response</button></Panel></div>
    <Panel title="Request timeline" description="Each event is recorded in the workspace timezone"><div className="extra-timeline">{[['10:42:08.102', 'Request received', 'API gateway accepted the incoming request.'], ['10:42:08.119', 'Authentication checked', 'Workspace API key validated.'], [`10:42:08.${request.status >= 400 ? '120' : '124'}`, request.status >= 400 ? 'Rate limit applied' : 'Message accepted', request.status >= 400 ? 'Request was not sent; retry after the rate limit window.' : 'Message handed off to the delivery queue.']].map(([time, title, description]) => <article key={time}><i /><span><small>{time}</small><b>{title}</b><em>{description}</em></span></article>)}</div></Panel>
  </div>
}

function WebhookDeliveriesPage({ onAction, search, setSearch }: { onAction: (message: string) => void; search: string; setSearch: (value: string) => void }) {
  const deliveries = [
    { event: 'message.delivered', response: '2xx', time: 'Today, 10:42:11 AM', duration: '84 ms', endpoint: 'api.metrovps.com/webhooks/email' },
    { event: 'message.opened', response: '2xx', time: 'Today, 10:40:06 AM', duration: '92 ms', endpoint: 'api.metrovps.com/webhooks/email' },
    { event: 'message.bounced', response: '5xx', time: 'Today, 10:35:24 AM', duration: '1.2 s', endpoint: 'api.metrovps.com/webhooks/email' },
    { event: 'message.clicked', response: '2xx', time: 'Today, 10:28:19 AM', duration: '76 ms', endpoint: 'api.metrovps.com/webhooks/email' },
  ]
  const [filter, setFilter] = useState('All deliveries')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(3)
  const filtered = deliveries.filter((item) => (filter === 'All deliveries' || (filter === 'Failed' ? item.response === '5xx' : item.response === '2xx')) && `${item.event} ${item.response} ${item.time} ${item.duration} ${item.endpoint}`.toLowerCase().includes(search.trim().toLowerCase()) && isWithinDateRange(item.time, startDate, endDate))
  const pageRows = filtered.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize)
  const dateRangeError = Boolean(startDate && endDate && startDate > endDate)
  useEffect(() => setPageIndex(0), [filter, search, startDate, endDate])
  const resetFilters = () => { setSearch(''); setFilter('All deliveries'); setStartDate(''); setEndDate('') }
  const exportRows = filtered.map(({ event, response, time, duration, endpoint }) => ({ Event: event, Response: response, 'Delivered at': time, Duration: duration, Endpoint: endpoint }))
  return <div className="extra-page">
    <PageHeading eyebrow="DEVELOPER TOOLS / WEBHOOKS" title="Webhook deliveries" description="Review endpoint responses and retry failed event deliveries.">
      <DataExportMenu rows={exportRows} fileName="webhook-deliveries" onAction={onAction} />
      <Link className="button button-secondary" href="/app/webhooks"><ArrowLeft size={14} /> Webhook settings</Link>
      <button className="button button-primary" onClick={() => onAction('Failed webhook deliveries queued for retry in this demo.')}><Webhook size={14} /> Retry failed</button>
    </PageHeading>
    <Panel title="Delivery attempts" description={`${filtered.length} recent events sent to your production endpoint`}>
      <div className="table-filter-bar extra-table-filter-bar"><label className="table-search-control"><Search size={15} aria-hidden="true" /><input aria-label="Search webhook delivery data" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search events, responses, endpoints…" />{search && <button type="button" aria-label="Clear search" onClick={() => setSearch('')}>×</button>}</label><div className="table-filter-controls"><label className="table-filter-control"><span>Response</span><select aria-label="Filter webhook deliveries" value={filter} onChange={(event) => setFilter(event.target.value)}><option>All deliveries</option><option>Successful</option><option>Failed</option></select></label><label className="table-filter-control table-date-control"><span>Start date</span><input aria-label="Start date" type="date" value={startDate} max={endDate || undefined} onChange={(event) => setStartDate(event.target.value)} /></label><label className="table-filter-control table-date-control"><span>End date</span><input aria-label="End date" type="date" value={endDate} min={startDate || undefined} aria-invalid={dateRangeError} onChange={(event) => setEndDate(event.target.value)} /></label><button className="table-reset-button" type="button" disabled={!search && filter === 'All deliveries' && !startDate && !endDate} onClick={resetFilters}>Reset</button></div>{dateRangeError && <p className="table-filter-error" role="alert">Start date must be on or before the end date.</p>}</div>
      <div className="extra-table-wrap"><table className="extra-table"><thead><tr><th>Event</th><th>Response</th><th>Delivered at</th><th>Duration</th><th>Endpoint</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{pageRows.map(({ event, response, time, duration, endpoint }) => <tr key={`${event}-${time}`}><td><code>{event}</code></td><td><span className={`extra-response ${response === '2xx' ? 'response-success' : 'response-error'}`}>{response}</span></td><td>{time}</td><td>{duration}</td><td className="extra-endpoint-cell">{endpoint}</td><td><button aria-label={`Open ${event} delivery`} onClick={() => onAction(`${event} delivery details opened.`)}><ArrowRight size={14} /></button></td></tr>)}</tbody></table></div>
      <div className="extra-mobile-list">{pageRows.map(({ event, response, time, duration }) => <article className="extra-request-card" key={`${event}-${time}`}><div><b><code>{event}</code></b><small>{time} · {duration}</small></div><span className={`extra-response ${response === '2xx' ? 'response-success' : 'response-error'}`}>{response}</span></article>)}</div>
      {filtered.length === 0 && <div className="extra-table-empty">No webhook deliveries match these filters.</div>}
      <TablePagination pageIndex={pageIndex} pageSize={pageSize} totalItems={filtered.length} pageSizeOptions={[3, 5, 10]} onPageChange={setPageIndex} onPageSizeChange={setPageSize} />
    </Panel>
  </div>
}

function SupportTicketsPage({ onOpenTicket }: { onOpenTicket: () => void }) {
  const tickets = [
    { subject: 'DKIM record still pending', id: 'MM-2048', status: 'Waiting on you', updated: 'Updated 2 hours ago', tone: 'warn' },
    { subject: 'Migration plan for transactional email', id: 'MM-1981', status: 'In progress', updated: 'Updated yesterday', tone: 'blue' },
    { subject: 'Campaign delivery question', id: 'MM-1904', status: 'Resolved', updated: 'Closed Nov 10, 2026', tone: 'good' },
  ]
  return <div className="extra-page">
    <PageHeading eyebrow="HELP & SUPPORT / TICKETS" title="Support tickets" description="Track open questions and follow up with the MetroMail team.">
      <button className="button button-primary" onClick={onOpenTicket}><Plus size={14} /> Create ticket</button>
    </PageHeading>
    <Panel title="Your support requests" description="Sample ticket history for this demo">
      <div className="extra-ticket-list">{tickets.map((ticket) => <article className="extra-ticket-card" key={ticket.id}><span className="extra-ticket-icon"><Mail size={16} /></span><div><b>{ticket.subject}</b><small>{ticket.id} · {ticket.updated}</small></div><span className={`extra-ticket-status ticket-${ticket.tone}`}>{ticket.status}</span><button aria-label={`Open ticket ${ticket.id}`}><ArrowRight size={15} /></button></article>)}</div>
    </Panel>
    <div className="extra-callout"><ShieldCheck size={16} /><span><b>Need to start a new conversation?</b><small>Include the affected domain or request ID to help us investigate.</small></span><button className="text-link" onClick={onOpenTicket}>Contact support <ArrowRight size={13} /></button></div>
  </div>
}

function BillingSubpage({ route, onAction }: { route: string; onAction: (message: string) => void }) {
  if (route === 'billing/plans') {
    const plans = [['Starter', '$19', 'For teams getting started', '50,000 emails / month'], ['Growth', '$49', 'For growing customer programs', '150,000 emails / month'], ['Scale', '$129', 'For high-volume product teams', '500,000 emails / month']]
    return <div className="extra-page"><PageHeading eyebrow="BILLING / PLANS" title="Plans and upgrades" description="Choose a plan that fits your next stage of growth." /><div className="extra-plan-grid">{plans.map(([name, price, detail, quota]) => <article className={`extra-plan-card ${name === 'Growth' ? 'plan-current' : ''}`} key={name}>{name === 'Growth' && <span className="extra-current-plan">CURRENT PLAN</span>}<span className="extra-plan-icon"><CreditCard size={17} /></span><h2>{name}</h2><p>{detail}</p><div className="extra-plan-price"><b>{price}</b><span>/ month</span></div><small>{quota}</small><button className={`button ${name === 'Growth' ? 'button-secondary' : 'button-primary'}`} onClick={() => onAction(name === 'Growth' ? 'You are already on the Growth plan.' : `${name} plan selected. Billing is not connected in this demo.`)}>{name === 'Growth' ? 'Current plan' : `Choose ${name}`}</button></article>)}</div><div className="extra-callout"><ShieldCheck size={16} /><span><b>No charge is made in this demo</b><small>Plan changes are displayed locally and are not sent to a payment provider.</small></span></div></div>
  }
  if (route === 'billing/usage') return <div className="extra-page"><PageHeading eyebrow="BILLING / USAGE" title="Usage and credits" description="Understand your monthly message volume and plan limits." /><section className="extra-usage-grid">{[['Marketing sends', '22,840', '45.7%', '50,000 monthly limit'], ['Transactional sends', '9,160', '61.1%', '15,000 monthly limit'], ['API requests', '12,408', '24.8%', '50,000 monthly limit']].map(([label, value, percent, note]) => <article className="extra-usage-card" key={label}><div><small>{label}</small><b>{value}</b></div><span>{percent}</span><i><em style={{ width: percent }} /></i><p>{note}</p></article>)}</section><Panel title="Usage history" description="Monthly email volume across your workspace"><div className="extra-usage-history">{[['August', 52], ['September', 64], ['October', 71], ['November', 64]].map(([month, value]) => <div key={month}><span>{month} 2026</span><i><em style={{ width: `${value}%` }} /></i><b>{value}%</b></div>)}</div></Panel></div>
  if (route === 'billing/payment-methods') return <div className="extra-page"><PageHeading eyebrow="BILLING / PAYMENT METHODS" title="Payment methods" description="Manage the payment details used for your subscription." ><button className="button button-primary" onClick={() => onAction('Add payment method form opened.') }><Plus size={14} /> Add payment method</button></PageHeading><Panel title="Saved payment methods" description="Your default method is used for the next invoice"><article className="extra-payment-card"><span className="extra-card-brand">VISA</span><div><b>Visa ending in 4242</b><small>Expires 08/2028 · Default</small></div><span className="extra-payment-default">Default</span><button aria-label="Open payment method actions" onClick={() => onAction('Payment method actions opened.')}><MoreHorizontal size={17} /></button></article><button className="text-link" onClick={() => onAction('Billing contact details opened.')}>Update billing contact <ArrowRight size={13} /></button></Panel><div className="extra-callout"><ShieldCheck size={16} /><span><b>Payment details are sample data</b><small>No payment provider is connected and no card information is stored.</small></span></div></div>
  return <div className="extra-page"><PageHeading eyebrow="BILLING / INVOICES" title="Invoices" description="Review and export your past billing statements." /><Panel title="Invoice history" description="All amounts shown in USD" ><div className="extra-invoice-list">{[['November 2026', '$49.00', 'Nov 01, 2026'], ['October 2026', '$49.00', 'Oct 01, 2026'], ['September 2026', '$49.00', 'Sep 01, 2026'], ['August 2026', '$49.00', 'Aug 01, 2026']].map(([month, amount, date]) => <article key={month}><span className="extra-invoice-icon"><ArrowDownToLine size={15} /></span><div><b>{month}</b><small>MetroMail Growth · Paid {date}</small></div><strong>{amount}</strong><button className="button button-secondary" onClick={() => onAction(`${month} invoice downloaded.`)}>Download</button></article>)}</div></Panel></div>
}

function AnalyticsBreakdownPage({ route, onAction, search, setSearch }: { route: string; onAction: (message: string) => void; search: string; setSearch: (value: string) => void }) {
  type AnalyticsRow = [string, string, string, string, string]
  const config: Record<string, { title: string; description: string; rows: AnalyticsRow[] }> = {
    'analytics/campaigns': { title: 'Campaign performance', description: 'Compare campaign delivery and engagement side by side.', rows: [['November product notes', '8,420', '42.8%', '8.6%', '2026-11-12'], ['Fall collection is here', '12,208', '38.2%', '7.4%', '2026-11-08'], ['October round-up', '7,612', '45.1%', '9.2%', '2026-10-30']] },
    'analytics/domains': { title: 'Domain performance', description: 'Compare deliverability health across your sending domains.', rows: [['mail.metrovps.com', '99.98%', '0.02%', 'Healthy', '2026-10-18'], ['updates.metrovps.com', '98.4%', '0.04%', 'Healthy', '2026-10-08'], ['mg.metrovps.net', '94.2%', '0.12%', 'Needs attention', '2026-11-14']] },
    'analytics/devices': { title: 'Device analytics', description: 'Search and compare engagement across subscriber devices and email clients.', rows: [['iPhone', '38.6%', '3,240', 'Mobile · iOS · Apple Mail', '2026-11-16'], ['Android phone', '19.8%', '1,652', 'Mobile · Android · Gmail', '2026-11-15'], ['Chrome desktop', '16.4%', '1,379', 'Desktop · Web client', '2026-11-14'], ['Outlook desktop', '17.8%', '1,487', 'Desktop · Outlook', '2026-11-13'], ['iPad', '6.2%', '521', 'Tablet · iPadOS', '2026-11-12'], ['Android tablet', '1.2%', '100', 'Tablet · Android', '2026-11-11']] },
    'analytics/geography': { title: 'Geographic analytics', description: 'Understand engagement across your audience locations.', rows: [['United States', '48.6%', '4,086', 'North America', '2026-11-16'], ['United Kingdom', '16.2%', '1,361', 'Europe', '2026-11-14'], ['Canada', '12.8%', '1,075', 'North America', '2026-11-12'], ['Germany', '8.4%', '706', 'Europe', '2026-11-10']] },
    'analytics/providers': { title: 'Email provider analytics', description: 'Compare delivery and engagement by mailbox provider.', rows: [['Gmail', '54.8%', '4,609', '99.6% delivered', '2026-11-16'], ['Apple Mail', '18.2%', '1,531', '99.8% delivered', '2026-11-14'], ['Outlook', '15.4%', '1,295', '98.9% delivered', '2026-11-12'], ['Other', '11.6%', '975', '99.1% delivered', '2026-11-10']] },
  }
  const data = config[route]
  const [category, setCategory] = useState(route === 'analytics/devices' ? 'All devices' : 'All categories')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(5)
  const categoryLabel = route === 'analytics/devices' ? 'Device group' : 'Category'
  const allCategoryLabel = route === 'analytics/devices' ? 'All devices' : 'All categories'
  const columnHeaders = route === 'analytics/campaigns' ? ['Campaign', 'Recipients', 'Open rate', 'Click rate', 'Sent date'] : route === 'analytics/domains' ? ['Sending domain', 'Delivery rate', 'Complaint rate', 'Health', 'Date added'] : route === 'analytics/devices' ? ['Device', 'Audience share', 'Engaged contacts', 'Client / platform', 'Date observed'] : route === 'analytics/geography' ? ['Location', 'Audience share', 'Engaged contacts', 'Region', 'Date observed'] : ['Mailbox provider', 'Audience share', 'Engaged contacts', 'Delivery', 'Date observed']
  const categories = Array.from(new Set(data.rows.map(([first]) => first)))
  const filteredRows = data.rows.filter((row) => (category === 'All categories' || category === 'All devices' || row[0] === category) && row.join(' ').toLowerCase().includes(search.trim().toLowerCase()) && isWithinDateRange(row[4], startDate, endDate))
  const pageRows = filteredRows.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize)
  const dateRangeError = Boolean(startDate && endDate && startDate > endDate)
  useEffect(() => {
    setCategory(route === 'analytics/devices' ? 'All devices' : 'All categories')
    setStartDate('')
    setEndDate('')
    setPageIndex(0)
  }, [route])
  useEffect(() => setPageIndex(0), [search, category, startDate, endDate])
  const resetFilters = () => { setSearch(''); setCategory(allCategoryLabel); setStartDate(''); setEndDate('') }
  const exportRows = filteredRows.map(([first, second, third, fourth, date]) => ({ [columnHeaders[0]]: first, [columnHeaders[1]]: second, [columnHeaders[2]]: third, [columnHeaders[3]]: fourth, [columnHeaders[4]]: date }))
  return <div className="extra-page"><PageHeading eyebrow="INSIGHTS / BREAKDOWN" title={data.title} description={data.description}><DataExportMenu rows={exportRows} fileName={route.replace('/', '-')} onAction={onAction} /></PageHeading><section className="extra-analytics-summary">{[['Volume', route === 'analytics/devices' ? '8,379' : '8,420'], ['Engagement', '42.8%'], ['Change vs. prior period', '+3.4%']].map(([label, value]) => <article key={label}><small>{label}</small><b>{value}</b></article>)}</section><Panel title={data.title} description={`${filteredRows.length} records · Sample data`}>
    <div className="table-filter-bar extra-table-filter-bar"><label className="table-search-control"><Search size={15} aria-hidden="true" /><input aria-label={`Search ${route === 'analytics/devices' ? 'all devices' : 'all report'} data`} value={search} onChange={(event) => setSearch(event.target.value)} placeholder={route === 'analytics/devices' ? 'Search devices, clients, platforms…' : `Search ${data.title.toLowerCase()}…`} />{search && <button type="button" aria-label="Clear search" onClick={() => setSearch('')}>×</button>}</label><div className="table-filter-controls"><label className="table-filter-control"><span>{categoryLabel}</span><select aria-label={`Filter by ${categoryLabel.toLowerCase()}`} value={category} onChange={(event) => setCategory(event.target.value)}><option value={allCategoryLabel}>{allCategoryLabel}</option>{categories.map((value) => <option key={value}>{value}</option>)}</select></label><label className="table-filter-control table-date-control"><span>Start date</span><input aria-label="Start date" type="date" value={startDate} max={endDate || undefined} onChange={(event) => setStartDate(event.target.value)} /></label><label className="table-filter-control table-date-control"><span>End date</span><input aria-label="End date" type="date" value={endDate} min={startDate || undefined} aria-invalid={dateRangeError} onChange={(event) => setEndDate(event.target.value)} /></label><button className="table-reset-button" type="button" disabled={!search && (category === 'All categories' || category === 'All devices') && !startDate && !endDate} onClick={resetFilters}>Reset</button></div>{dateRangeError && <p className="table-filter-error" role="alert">Start date must be on or before the end date.</p>}</div>
    <div className="extra-table-wrap"><table className="extra-table"><thead><tr>{columnHeaders.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{pageRows.map(([first, second, third, fourth, date]) => <tr key={first}><td><b>{first}</b></td><td>{second}</td><td>{third}</td><td>{fourth}</td><td>{date}</td></tr>)}</tbody></table></div>{filteredRows.length === 0 && <div className="extra-table-empty">No records match these filters.</div>}<TablePagination pageIndex={pageIndex} pageSize={pageSize} totalItems={filteredRows.length} pageSizeOptions={[5, 10, 20]} onPageChange={setPageIndex} onPageSizeChange={setPageSize} /><div className="extra-breakdown-bars">{filteredRows.map(([label, value], index) => <div key={label}><span>{label}</span><i><em style={{ width: `${Math.max(22, 84 - index * 10)}%` }} /></i><b>{value}</b></div>)}</div>
  </Panel></div>
}
