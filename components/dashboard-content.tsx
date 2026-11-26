'use client'

import { useEffect, useMemo, useState } from 'react'
import { DataExportMenu } from '@/components/data-export-menu'
import { TablePagination } from '@/components/table-pagination'
import { isWithinDateRange } from '@/lib/table-utils'
import { EmailEditor } from '@/components/email-editor'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createCampaign } from '@/lib/services/campaigns'
import { flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable, type ColumnDef, type SortingState } from '@tanstack/react-table'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Activity, ArrowDown, ArrowDownToLine, ArrowRight, ArrowUpRight, Braces, Check, ChevronDown, ChevronLeft, ChevronRight, CircleCheck, Clock3, Code2, ContactRound, Copy, ExternalLink, Eye, Globe2, GripVertical, Laptop, LifeBuoy, Mail, Minus, MousePointerClick, MoreHorizontal, Pencil, Plus, Search, Send, ShieldAlert, ShieldCheck, Smartphone, Sparkles, Trash2, Type, Workflow, X } from 'lucide-react'
import { FloatingRowActionMenu, RowActionMenuItem, RowActionDivider } from '@/components/floating-row-action-menu'
import { chartData, getRowsForRoute, statCards, type MockRow } from '@/lib/mock-data'
import { DashboardExtraPage, hasDashboardExtraPage } from '@/components/dashboard-extra-pages'
import { CrmDealsBoard } from '@/components/crm-deals-board'
import { EmailValidatorTool } from '@/components/email-validator-tool'
import { FormBuilderView } from '@/components/form-builder'
import { MultiChannelBuilder } from '@/components/multichannel-builder'
import { AutomationVisualCanvas } from '@/components/automation-visual-canvas'
import { InboxPlacementSuite } from '@/components/inbox-placement-suite'
import { InboundRoutesBuilder } from '@/components/inbound-routes-builder'
import { DomainsManagement } from '@/components/domains-management'
import { TransactionalPage } from '@/components/transactional-page'
import { EmailLogsPage } from '@/components/email-logs-page'
import { MessageDetailPage } from '@/components/message-detail-page'
import { StatusBadge } from '@/components/status-badge'
import { useDomainsQuery } from '@/lib/hooks/use-domains-query'
import { useCampaignsQuery } from '@/lib/hooks/use-campaigns-query'
import { ApiKeysManagement } from '@/components/api-keys-management'
import { ContactsManagement } from '@/components/contacts-management'
import { CampaignsManagement, extractCampaigns } from '@/components/campaigns-management'
import { TemplatesManagement } from '@/components/templates-management'
import { AnalyticsPage } from '@/components/analytics-page'
import { SettingsPage } from '@/components/settings-page'

type Props = { route: string; search: string; setSearch: (value: string) => void; onAction: (message: string) => void; onOpenAction: (action: 'contact' | 'key' | 'domain' | 'list' | 'form' | 'attribute' | 'ticket' | null) => void; completed: string[]; onToggleChecklist: (id: string) => void; customRows: MockRow[]; onImportRows: (rows: MockRow[]) => void; onCreateRows: (rows: MockRow[]) => void }
const titles: Record<string, [string, string]> = {
  overview: ['Overview', 'Here’s what’s happening with your email this week.'], templates: ['Email Templates', 'Design, organize, and version beautiful reusable email layouts.'], 'templates/create': ['Create Template', 'Design a responsive marketing or transactional email template.'], campaigns: ['Campaigns', 'Plan, send, and learn from every campaign.'], 'campaigns/create': ['Create campaign', 'Build a thoughtful email and choose when it reaches your audience.'], 'campaigns/sms': ['SMS Campaign Designer', 'Broadcast SMS alerts with live phone preview and GSM counter.'], 'campaigns/whatsapp': ['WhatsApp Business Campaigns', 'Send verified WhatsApp broadcasts with template variables and CTA buttons.'], 'contacts': ['Contacts & CRM', 'Manage the people behind every conversation.'], 'contacts/lists': ['Contact lists', 'Organize your audience into useful collections.'], 'contacts/segments': ['Segments', 'Build dynamic audiences with the attributes that matter.'], 'contacts/import': ['Import contacts', 'Bring your existing audience into MetroMail.'], 'contacts/forms': ['Signup forms', 'Grow your audience with easy-to-use subscription forms.'], 'forms': ['Interactive Form Builder', 'Design embedded forms, popups, and floating subscription bars.'], 'deals': ['Sales Deals & Pipeline', 'Manage sales opportunities, pipeline stages, and deal values.'], 'verify': ['Email Verification & Hygiene', 'Clean bounces, verify MX records, and detect disposable emails.'], 'inbox-placement': ['Inbox Placement & Spam Traps', 'Verify seed list inbox placement and monitor 50+ DNSBL blocklists.'], 'inbound-routes': ['Inbound Mail Routing', 'Parse incoming emails, extract attachments, and forward to webhooks.'], 'contacts/attributes': ['Contact attributes', 'Customize the data that describes your audience.'], 'contacts/unsubscribed': ['Unsubscribed contacts', 'Respect every contact’s communication preferences.'], 'contacts/blocklisted': ['Blocklisted contacts', 'Review contacts excluded from marketing sends.'], automations: ['Automations', 'Create customer journeys that run on their own.'], 'automations/create': ['Workflow builder', 'Map triggers, decisions, delays, and messages.'], transactional: ['Transactional email', 'Send and troubleshoot the messages your product depends on.'], 'transactional/templates': ['Transactional templates', 'Build reusable messages for your product events.'], 'transactional/inbound': ['Inbound routing', 'Manage incoming email routing rules.'], domains: ['Sending domains', 'Authenticate and monitor your sending reputation.'], 'domains/add': ['Add a sending domain', 'Connect a domain you own and verify DNS authentication.'], 'domains/health': ['Domain health', 'Review authentication and sending quality by domain.'], 'api-keys': ['SMTP & API', 'Manage secure credentials and delivery configuration.'], 'api-keys/smtp': ['SMTP relay', 'Use these in WordPress, WHMCS, Laravel or any app that speaks SMTP.'], 'api-keys/quickstart': ['Quick start', 'Send your first transactional email in minutes using our REST API.'], 'api-keys/docs': ['Quick start', 'Send your first transactional email in minutes using our REST API.'], webhooks: ['Webhooks', 'Choose event types and monitor delivery to your endpoints.'], logs: ['Email logs', 'Search every message and inspect its delivery events.'], 'logs/failed': ['Failed messages', 'Understand delivery failures and their next steps.'], suppressions: ['Suppressions', 'Protect sender reputation and honor contact preferences.'], 'suppressions/bounces': ['Bounces', 'Review addresses that could not receive a message.'], 'suppressions/unsubscribes': ['Unsubscribes', 'Manage marketing opt-outs.'], 'suppressions/allowlist': ['Allowlist', 'Review addresses approved for sending.'], analytics: ['Analytics', 'Understand delivery and engagement across your email program.'], 'analytics/campaigns': ['Campaign performance', 'Compare how your campaigns are connecting.'], 'analytics/domains': ['Domain analytics', 'Track reputation and delivery health by domain.'], integrations: ['Integrations', 'Connect your email program to the rest of your stack.'], billing: ['Billing & usage', 'Manage your plan, email volume, and invoices.'], settings: ['Account settings', 'Update the workspace details and preferences that keep your team moving.'], 'settings/team': ['Team members', 'Manage who can access your MetroVPS workspace.'], 'settings/security': ['Security settings', 'Review account protection and access controls.'], 'settings/notifications': ['Notification preferences', 'Choose how the workspace keeps your team informed.'], support: ['Help & support', 'Find a guide or get help with your workspace.'], 'support/tickets': ['Support tickets', 'Review your support history and open requests.'],
}

function resolveTitle(route: string): [string, string] {
  if (titles[route]) return titles[route]
  const prefix = route.split('/')[0]
  return titles[prefix] ?? [route.split('/').at(-1)?.replace(/-/g, ' ').replace(/\b\w/g, (value) => value.toUpperCase()) ?? 'Workspace', 'A clear view of the tools and activity in your email workspace.']
}

function getCustomRowsForRoute(route: string, rows: MockRow[]): MockRow[] {
  const kindByRoute: Record<string, string> = {
    contacts: 'Contact',
    'api-keys': 'API key',
    'contacts/lists': 'List',
    'contacts/forms': 'Signup form',
    'contacts/attributes': 'Attribute',
  }
  if (kindByRoute[route]) return rows.filter((row) => row.kind === kindByRoute[route])
  if (route.startsWith('campaigns')) {
    const subroute = route.split('/')[1]
    const statusBySubroute: Record<string, string> = { drafts: 'Draft', scheduled: 'Scheduled', sent: 'Sent' }
    if (subroute === 'ab-tests') return rows.filter((row) => row.kind === 'Campaign' && ['Running', 'Completed'].includes(row.status))
    return rows.filter((row) => row.kind === 'Campaign' && (!statusBySubroute[subroute] || row.status === statusBySubroute[subroute]))
  }
  return []
}

export function DashboardContent(props: Props) {
  const { route, search, setSearch, onAction, onOpenAction, completed, onToggleChecklist, customRows, onImportRows, onCreateRows } = props
  const router = useRouter()
  const [campaignStep, setCampaignStep] = useState(0)
  const [campaignName, setCampaignName] = useState('November product update')
  const [codeTab, setCodeTab] = useState('Node.js')
  const [selectedStatus, setSelectedStatus] = useState('All statuses')
  const [selectedKind, setSelectedKind] = useState('All types')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedRange, setSelectedRange] = useState('Last 7 days')
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 6 })
  useEffect(() => {
    setSelectedStatus('All statuses')
    setSelectedKind('All types')
    setStartDate('')
    setEndDate('')
  }, [route])
  const [copiedRecord, setCopiedRecord] = useState('')
  const [selectedSettingsTab, setSelectedSettingsTab] = useState('Profile')
  const [saved, setSaved] = useState(false)
  const [workflowRunning, setWorkflowRunning] = useState(false)
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [actionAnchorRect, setActionAnchorRect] = useState<DOMRect | null>(null)
  const [selectedSegments, setSelectedSegments] = useState<string[]>(['Engaged customers'])
  const [showPassword, setShowPassword] = useState(false)
  const [abTestEnabled, setAbTestEnabled] = useState(false)
  const title = resolveTitle(route)
  const allRows = useMemo(() => [...getCustomRowsForRoute(route, customRows), ...getRowsForRoute(route)], [customRows, route])
  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase()
    return allRows.filter((row) => {
      const matchesSearch = !query || `${row.name} ${row.detail} ${row.status} ${row.metric} ${row.date} ${row.kind}`.toLowerCase().includes(query)
      const matchesStatus = selectedStatus === 'All statuses' || row.status.toLowerCase() === selectedStatus.toLowerCase()
      const matchesKind = selectedKind === 'All types' || row.kind === selectedKind
      return matchesSearch && matchesStatus && matchesKind && isWithinDateRange(row.date, startDate, endDate)
    })
  }, [allRows, endDate, search, selectedKind, selectedStatus, startDate])
  useEffect(() => setPagination((current) => ({ ...current, pageIndex: 0 })), [route, search, selectedStatus, selectedKind, startDate, endDate, allRows])
  const table = useDataTable(filteredRows, pagination, setPagination)
  const dateRangeError = Boolean(startDate && endDate && startDate > endDate)

  const copyText = async (text: string) => {
    try { await navigator.clipboard.writeText(text); setCopiedRecord(text); onAction('Copied to clipboard.') }
    catch { onAction('Clipboard access is unavailable in this preview.') }
  }
  const completeCampaign = async () => {
    const campaign = await createCampaign({ name: campaignName.trim() || 'Untitled campaign', audience: 'All contacts', subject: 'A few things we’ve been working on' })
    onCreateRows([campaign])
    onAction(`“${campaign.name}” saved as a draft.`)
    router.push('/app/campaigns')
  }

  if (route === 'overview') return <Overview {...props} selectedRange={selectedRange} setSelectedRange={setSelectedRange} />
  if (route === 'contacts' || route === 'contacts/lists') return <ContactsManagement route={route} onAction={onAction} />
  if (route === 'deals' || route.startsWith('deals')) return <CrmDealsBoard onAction={onAction} />
  if (route === 'verify' || route.startsWith('verify')) return <EmailValidatorTool onAction={onAction} />
  if (route === 'forms' || route === 'contacts/forms') return <FormBuilderView onAction={onAction} />
  if (route === 'inbox-placement' || route.startsWith('inbox-placement')) return <InboxPlacementSuite onAction={onAction} />
  if (route === 'inbound-routes' || route === 'transactional/inbound') return <InboundRoutesBuilder onAction={onAction} />
  if (route === 'campaigns/sms') return <MultiChannelBuilder initialChannel="sms" onAction={onAction} />
  if (route === 'campaigns/whatsapp') return <MultiChannelBuilder initialChannel="whatsapp" onAction={onAction} />
  if (route === 'campaigns' || route.startsWith('campaigns/')) return <CampaignsManagement route={route} onAction={onAction} />
  if (route === 'templates' || route.startsWith('templates/')) return <TemplatesManagement route={route} onAction={onAction} />
  if (route === 'automations/create' || route === 'automations/builder') return <AutomationVisualCanvas onAction={onAction} />
  if (hasDashboardExtraPage(route)) return <DashboardExtraPage route={route} search={search} setSearch={setSearch} onAction={onAction} onOpenTicket={() => onOpenAction('ticket')} />
  if (route === 'contacts/import') return <ContactImportPage onAction={onAction} onImport={onImportRows} />
  if (route === 'contacts/segments') return <SegmentBuilder onAction={onAction} />
  if (route === 'transactional') return <TransactionalPage onAction={onAction} />
  if (
    route === 'logs' ||
    route.startsWith('logs/') ||
    route === 'transactional/logs' ||
    route.startsWith('transactional/logs/')
  ) {
    const sub = route.replace(/^(transactional\/)?logs\/?/, '')
    const filterTabs = ['all', 'delivered', 'pending', 'failed', 'bounced', 'opened', 'clicked', 'rejected', 'complaints', 'unsubscribes']
    if (sub && !filterTabs.includes(sub.toLowerCase())) {
      return <MessageDetailPage route={route} mailId={sub} onAction={onAction} />
    }
    return <EmailLogsPage route={route} onAction={onAction} />
  }
  if (route.startsWith('contacts/') && !['lists', 'segments', 'import', 'forms', 'attributes', 'unsubscribed', 'blocklisted'].includes(route.split('/')[1])) return <ContactDetailPage route={route} onAction={onAction} customRows={customRows} />
  if (route === 'automations/create') return <WorkflowBuilder running={workflowRunning} setRunning={setWorkflowRunning} onAction={onAction} />
  if (route.startsWith('settings')) return <SettingsPage route={route} selectedTab={selectedSettingsTab} setSelectedTab={setSelectedSettingsTab} onAction={onAction} saved={saved} setSaved={setSaved} showPassword={showPassword} setShowPassword={setShowPassword} />
  if (route.startsWith('domains')) return <DomainsManagement route={route} onAction={onAction} copiedRecord={copiedRecord} copyText={copyText} />
  if (route.startsWith('api-keys')) return <ApiKeysManagement route={route} onAction={onAction} />
  if (route === 'webhooks') return <DeveloperPage route={route} codeTab={codeTab} setCodeTab={setCodeTab} onAction={onAction} copyText={copyText} />
  if (route.startsWith('analytics')) return <AnalyticsPage route={route} onAction={onAction} />
  if (route.startsWith('integrations')) return <IntegrationPage onAction={onAction} />
  if (route.startsWith('billing')) return <BillingPage title={title} onAction={onAction} />
  if (route.startsWith('support')) return <SupportPage title={title} onAction={onAction} onOpenAction={onOpenAction} />
  if (route.startsWith('automations')) return <AutomationPage title={title} onAction={onAction} />
  if (route.startsWith('transactional') && route.endsWith('inbound')) return <InboundPage onAction={onAction} />
  if (route.startsWith('transactional') && route.endsWith('templates')) return <TemplatesManagement route="templates" onAction={onAction} />

  const openDetails = (row: MockRow) => {
    const slug = row.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    if (row.kind === 'Contact') { window.location.href = `/app/contacts/${slug}`; return }
    if (row.kind === 'Event') { window.location.href = `/app/logs/${slug}`; return }
    if (row.kind === 'Campaign') { window.location.href = `/app/campaigns/${slug}/report`; return }
    onAction(`${row.name} details opened.`)
  }
  const onPrimaryAction = () => {
    if (route.includes('campaign')) window.location.href = '/app/campaigns/create'
    else if (route === 'contacts/lists') onOpenAction('list')
    else if (route === 'contacts/forms') onOpenAction('form')
    else if (route === 'contacts/attributes') onOpenAction('attribute')
    else if (route.includes('contact') || route.includes('list') || route.includes('segment')) onOpenAction('contact')
    else if (route.includes('domain')) onOpenAction('domain')
    else if (route.includes('key') || route.includes('api')) onOpenAction('key')
    else if (route.includes('support')) onOpenAction('ticket')
    else onAction(`New ${title[0].toLowerCase()} draft created.`)
  }
  const primaryAction = route === 'contacts/lists' ? 'Create list' : route === 'contacts/forms' ? 'Create form' : route === 'contacts/attributes' ? 'Add attribute' : route.includes('campaign') ? 'Create campaign' : route.includes('contact') || route.includes('list') || route.includes('segment') ? 'Add contact' : route.includes('domain') ? 'Add domain' : route.includes('key') || route.includes('api') ? 'Create API key' : route.includes('integration') ? 'Browse integrations' : route.includes('support') ? 'Create ticket' : route.includes('suppress') ? 'Add suppression' : route.includes('workflow') || route.includes('automation') ? 'New automation' : 'Export report'

  return <>
    <div className="page-heading-row"><div><div className="page-eyebrow">METROMAIL WORKSPACE <span>/</span> {route.startsWith('contacts') ? 'CONTACTS & CRM' : title[0].toUpperCase()}</div><h1>{route.startsWith('contacts') ? 'Contacts & CRM' : title[0]}</h1><p>{title[1]}</p></div><div className="page-heading-actions">{allRows.length > 0 && <DataExportMenu rows={filteredRows.map((row) => ({ Name: row.name, Detail: row.detail, Status: row.status, Metric: row.metric, Date: row.date, Type: row.kind }))} fileName={title[0]} onAction={onAction} />}<button className="button button-primary" onClick={onPrimaryAction}><Plus size={15} />{primaryAction}</button></div></div>
    {(route.startsWith('contacts') || route.startsWith('campaigns') || route.startsWith('logs') || route.startsWith('transactional') || route.startsWith('api-keys') || route.startsWith('suppressions') || route.startsWith('analytics') || route.startsWith('billing') || route.startsWith('support')) && <div className="section-tabs" style={{ marginBottom: '22px' }}>{getTabs(route).map(([label, href]) => <Link className={(route === href || (href === route.split('/')[0] && !route.includes('/')) ? 'active' : '')} href={`/app/${href}`} key={href}>{label}</Link>)}</div>}
    {route.startsWith('domains') && route !== 'domains' ? <DomainPage route={route} onAction={onAction} onOpenAction={onOpenAction} copiedRecord={copiedRecord} copyText={copyText} /> : <section className="data-panel"><div className="data-panel-top"><div><h2>{route.includes('contact') ? route.includes('segment') ? 'Audience segments' : route.includes('list') ? 'Your lists' : route.includes('form') ? 'Signup forms' : route.includes('attribute') ? 'Contact attributes' : route.includes('unsubscribed') ? 'Unsubscribed contacts' : route.includes('blocklisted') ? 'Blocklisted contacts' : 'All contacts' : route.includes('campaign') ? 'Recent campaigns' : route.includes('domain') ? 'Sending domains' : route.includes('key') || route.includes('api') ? 'API credentials' : route.includes('suppress') ? 'Suppression list' : route.includes('automation') ? 'Active automations' : route.includes('support') ? 'Help articles' : route.includes('billing') ? 'Billing history' : route.includes('integration') ? 'Available integrations' : 'Recent email activity'}</h2><p>{filteredRows.length.toLocaleString()} {filteredRows.length === 1 ? 'item' : 'items'} in the selected view</p></div></div><div className="table-filter-bar"><label className="table-search-control"><Search size={15} aria-hidden="true" /><input aria-label="Search all table data" placeholder="Search all table data…" value={search} onChange={(event) => setSearch(event.target.value)} />{search && <button type="button" aria-label="Clear search" onClick={() => setSearch('')}>×</button>}</label><div className="table-filter-controls"><label className="table-filter-control"><span>Status</span><select aria-label="Filter by status" value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value)}><option>All statuses</option>{Array.from(new Set(allRows.map((row) => row.status))).map((status) => <option key={status}>{status}</option>)}</select></label><label className="table-filter-control"><span>Type</span><select aria-label="Filter by type" value={selectedKind} onChange={(event) => setSelectedKind(event.target.value)}><option>All types</option>{Array.from(new Set(allRows.map((row) => row.kind))).map((kind) => <option key={kind}>{kind}</option>)}</select></label><label className="table-filter-control table-date-control"><span>Start date</span><input aria-label="Start date" type="date" value={startDate} max={endDate || undefined} onChange={(event) => setStartDate(event.target.value)} /></label><label className="table-filter-control table-date-control"><span>End date</span><input aria-label="End date" type="date" value={endDate} min={startDate || undefined} aria-invalid={dateRangeError} onChange={(event) => setEndDate(event.target.value)} /></label><button className="table-reset-button" type="button" disabled={!search && selectedStatus === 'All statuses' && selectedKind === 'All types' && !startDate && !endDate} onClick={() => { setSearch(''); setSelectedStatus('All statuses'); setSelectedKind('All types'); setStartDate(''); setEndDate('') }}>Reset</button></div>{dateRangeError && <p className="table-filter-error" role="alert">Start date must be on or before the end date.</p>}</div>
      <div className="desktop-table-wrap">
        <table className="data-table">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id}>
                    <button className="table-sort" onClick={header.column.getToggleSortingHandler()}>
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      <span>{header.column.getIsSorted() === 'asc' ? '↑' : header.column.getIsSorted() === 'desc' ? '↓' : '↕'}</span>
                    </button>
                  </th>
                ))}
                <th><span className="sr-only">Actions</span></th>
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td className="table-empty-state" colSpan={table.getVisibleFlatColumns().length + 1}>
                  No matching results. Adjust your search or status filter.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => {
                const isExpanded = expandedRow === row.original.name
                return (
                  <tr key={row.id} className={isExpanded ? 'row-action-active' : ''}>
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id}>
                        {cell.column.id === 'status' ? (
                          <StatusBadge status={cell.getValue<string>()} />
                        ) : cell.column.id === 'name' ? (
                          flexRender(cell.column.columnDef.cell, cell.getContext())
                        ) : (
                          String(cell.getValue() ?? '')
                        )}
                      </td>
                    ))}
                    <td className="row-action-cell" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className={`row-action-trigger ${isExpanded ? 'active' : ''}`}
                        aria-label={`Open ${row.original.name} actions`}
                        aria-expanded={isExpanded}
                        onClick={(e) => {
                          e.stopPropagation()
                          if (isExpanded) {
                            setExpandedRow(null)
                            setActionAnchorRect(null)
                          } else {
                            const rect = e.currentTarget.getBoundingClientRect()
                            setActionAnchorRect(rect)
                            setExpandedRow(row.original.name)
                          }
                        }}
                      >
                        <MoreHorizontal size={17} />
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
      {expandedRow && actionAnchorRect && (
        <FloatingRowActionMenu
          isOpen={Boolean(expandedRow)}
          anchorRect={actionAnchorRect}
          onClose={() => {
            setExpandedRow(null)
            setActionAnchorRect(null)
          }}
        >
          {(() => {
            const activeRow = filteredRows.find((r) => r.name === expandedRow)
            if (!activeRow) return null
            return (
              <>
                <RowActionMenuItem
                  icon={Eye}
                  label="View details"
                  onClick={() => {
                    openDetails(activeRow)
                    setExpandedRow(null)
                    setActionAnchorRect(null)
                  }}
                />
                <RowActionMenuItem
                  icon={Copy}
                  label="Copy name"
                  onClick={() => {
                    copyText(activeRow.name)
                    setExpandedRow(null)
                    setActionAnchorRect(null)
                  }}
                />
                <RowActionDivider />
                <RowActionMenuItem
                  icon={Pencil}
                  label="Edit"
                  onClick={() => {
                    onAction(`Edit ${activeRow.name} opened.`)
                    setExpandedRow(null)
                    setActionAnchorRect(null)
                  }}
                />
              </>
            )
          })()}
        </FloatingRowActionMenu>
      )}
      <div className="mobile-data-cards">{table.getRowModel().rows.length === 0 ? <p className="mobile-empty-state">No matching results. Adjust your search or status filter.</p> : table.getRowModel().rows.map((row) => { const item = row.original; return <article className="mobile-data-card" key={row.id}><div className="mobile-card-top"><div><b>{item.name}</b><small>{item.detail}</small></div><StatusBadge status={item.status} /></div><div className="mobile-card-meta"><span>{item.metric}</span><span>{item.date}</span></div><button className="mobile-card-action" onClick={() => openDetails(item)}>View details <ArrowRight size={14} /></button></article> })}</div>
      <TablePagination pageIndex={table.getState().pagination.pageIndex} pageSize={table.getState().pagination.pageSize} totalItems={filteredRows.length} onPageChange={(pageIndex) => table.setPageIndex(pageIndex)} onPageSizeChange={(pageSize) => table.setPageSize(pageSize)} />
    </section>}
    {route === 'api-keys' && <section className="inline-callout"><ShieldCheck size={17} /><div><b>Your keys are protected</b><p>Credentials stay masked by default. Create separate keys for production and test environments.</p></div><Link href="/app/api-keys/docs">Read API docs <ArrowRight size={14} /></Link></section>}
    {route === 'campaigns' && <div className="secondary-data-row"><section className="mini-feature-card"><span className="feature-icon"><Sparkles size={18} /></span><h3>Ready to test a new idea?</h3><p>Compare two subject lines with a small audience before you send to everyone.</p><button className="text-link" onClick={() => { window.location.href = '/app/campaigns/create' }}>Set up an A/B test <ArrowRight size={14} /></button></section><section className="mini-feature-card"><span className="feature-icon"><Clock3 size={18} /></span><h3>Plan your next send</h3><p>Keep drafts and scheduled campaigns visible to the whole team.</p><button className="text-link" onClick={() => onAction('Campaign calendar opened for this demo.')}>Open campaign calendar <ArrowRight size={14} /></button></section></div>}
    {route.startsWith('contacts') && <section className="inline-callout"><div className="audience-mini-icon"><Activity size={16} /></div><div><b>Build smarter segments</b><p>Combine engagement, tags, and contact attributes to reach the right audience.</p></div><Link href="/app/contacts/segments">Open segment builder <ArrowRight size={14} /></Link></section>}
  </>
}

function useDataTable(rows: MockRow[], pagination: { pageIndex: number; pageSize: number }, setPagination: (updater: { pageIndex: number; pageSize: number } | ((current: { pageIndex: number; pageSize: number }) => { pageIndex: number; pageSize: number })) => void) {
  const [sorting, setSorting] = useState<SortingState>([])
  const columns = useMemo<ColumnDef<MockRow>[]>(() => [
    { accessorKey: 'name', header: 'Name', cell: ({ row }) => <div className="table-name-cell"><span className={`table-row-avatar avatar-${row.original.kind.toLowerCase().replace(/\s/g, '-')}`}>{row.original.kind === 'Contact' ? row.original.name.split(' ').map((part) => part[0]).join('') : row.original.kind === 'Domain' ? <Globe2 size={15} /> : row.original.kind === 'Campaign' ? <Send size={14} /> : row.original.kind === 'API key' ? <Braces size={14} /> : <Mail size={14} />}</span><span><b>{row.original.name}</b><small>{row.original.detail}</small></span></div> },
    { accessorKey: 'status', header: 'Status' }, { accessorKey: 'metric', header: 'Performance' }, { accessorKey: 'date', header: 'Date added' },
  ], [])
  return useReactTable({ data: rows, columns, state: { sorting, pagination }, onSortingChange: setSorting, onPaginationChange: setPagination, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel(), getFilteredRowModel: getFilteredRowModel(), getPaginationRowModel: getPaginationRowModel() })
}

function getTabs(route: string): [string, string][] {
  if (route.startsWith('campaigns')) return [['All campaigns', 'campaigns'], ['Drafts', 'campaigns/drafts'], ['Scheduled', 'campaigns/scheduled'], ['Sent', 'campaigns/sent'], ['A/B tests', 'campaigns/ab-tests'], ['Calendar', 'campaigns/calendar'], ['Templates', 'campaigns/templates']]
  if (route.startsWith('contacts')) return [
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
  if (route.startsWith('logs')) return [['All events', 'logs'], ['Delivered', 'logs/delivered'], ['Opened', 'logs/opened'], ['Clicked', 'logs/clicked'], ['Bounced', 'logs/bounced'], ['Rejected', 'logs/rejected'], ['Complaints', 'logs/complaints'], ['Unsubscribes', 'logs/unsubscribes'], ['Failed', 'logs/failed']]
  if (route.startsWith('transactional')) return [['Overview', 'transactional'], ['Message logs', 'transactional/logs'], ['Templates', 'transactional/templates'], ['Inbound', 'transactional/inbound']]
  if (route.startsWith('api-keys')) return [['API keys', 'api-keys'], ['SMTP relay', 'api-keys/smtp'], ['Quick start', 'api-keys/quickstart']]
  if (route.startsWith('webhooks')) return [['Webhooks', 'webhooks'], ['Deliveries', 'webhooks/deliveries']]
  if (route.startsWith('suppressions')) return [['All', 'suppressions'], ['Bounces', 'suppressions/bounces'], ['Unsubscribes', 'suppressions/unsubscribes'], ['Complaints', 'suppressions/complaints'], ['Blocklist', 'suppressions/blocklist'], ['Allowlist', 'suppressions/allowlist']]
  if (route.startsWith('analytics')) return [['Overview', 'analytics'], ['Campaigns', 'analytics/campaigns'], ['Domains', 'analytics/domains'], ['Devices', 'analytics/devices'], ['Geography', 'analytics/geography'], ['Providers', 'analytics/providers']]
  if (route.startsWith('billing')) return [['Overview', 'billing'], ['Plans', 'billing/plans'], ['Usage', 'billing/usage'], ['Payment methods', 'billing/payment-methods'], ['Invoices', 'billing/invoices']]
  if (route.startsWith('support')) return [['Help center', 'support'], ['Tickets', 'support/tickets']]
  return []
}

function Overview({ onAction, onOpenAction, completed, onToggleChecklist, selectedRange, setSelectedRange }: Props & { selectedRange: string; setSelectedRange: (range: string) => void }) {
  const checklist = [['profile', 'Complete your workspace profile', 'Add your company details', '/app/settings'], ['domain', 'Verify your sending domain', 'Authenticate SPF and DKIM', '/app/domains'], ['contact', 'Import your contacts', 'Bring your audience together', '/app/contacts/import'], ['first-send', 'Send your first campaign', 'Make your first send count', '/app/campaigns/create']]
  const [activeMetric, setActiveMetric] = useState('delivered')

  const { data: domainsResponse } = useDomainsQuery()
  const liveDomains = domainsResponse?.data ?? []

  const { data: campaignsResponse, isLoading: isLoadingCampaigns } = useCampaignsQuery({ page_size: 5 })
  const liveCampaigns = useMemo(() => extractCampaigns(campaignsResponse), [campaignsResponse])

  const formatCampaignDate = (dateStr?: string | null) => {
    if (!dateStr) return 'Recent'
    try {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return dateStr
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
    } catch {
      return dateStr
    }
  }

  const displayDomains = liveDomains.length > 0
    ? liveDomains.slice(0, 3)
    : [
      { id: '1', name: 'mail.metrovps.com', is_verified: true },
      { id: '2', name: 'updates.metrovps.com', is_verified: true },
      { id: '3', name: 'mg.metrovps.net', is_verified: false },
    ]

  const verifiedCount = displayDomains.filter((d) => d.is_verified).length
  const healthScore = Math.min(100, Math.max(70, Math.round((verifiedCount / displayDomains.length) * 100)))
  const healthLabel = healthScore >= 90 ? 'Excellent' : healthScore >= 75 ? 'Good' : 'Needs attention'
  const radius = 38
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (healthScore / 100) * circumference

  return <>
    <div className="page-heading-row overview-heading"><div><div className="page-eyebrow">MONDAY, NOVEMBER 16, 2026 <span>/</span> METROVPS</div><h1>Good morning, Alex <span className="wave-mark">✦</span></h1><p>Your email program is looking healthy. Here’s the latest across your workspace.</p></div><div className="page-heading-actions"><select className="range-select" value={selectedRange} onChange={(event) => setSelectedRange(event.target.value)}><option>Last 7 days</option><option>Last 30 days</option><option>This quarter</option></select><button className="button button-primary" onClick={() => { window.location.href = '/app/campaigns/create' }}><Plus size={15} /> Create campaign</button></div></div>
    <section className="metrics-grid">{statCards.map((stat, index) => <article className="metric-card" key={stat.label}><div className="metric-card-head"><span>{stat.label}</span><span className={`metric-icon metric-icon-${index}`}>{index === 0 ? <Send /> : index === 1 ? <CircleCheck /> : index === 2 ? <Mail /> : <MousePointerClick />}</span></div><div className="metric-number">{stat.value}</div><div className="metric-foot"><span className="metric-change"><ArrowUpRight size={13} />{stat.change}</span><span>{stat.note}</span></div><div className={`metric-spark spark-${index}`}><i /><i /><i /><i /><i /><i /><i /><i /><i /></div></article>)}</section>
    <section className="overview-grid"><article className="dashboard-panel chart-panel"><div className="panel-heading"><div><h2>Email performance</h2><p>Delivery and engagement over time</p></div><div className="chart-legend"><button className={activeMetric === 'delivered' ? 'legend-active' : ''} onClick={() => setActiveMetric('delivered')}><i className="legend-blue" />Delivered</button><button className={activeMetric === 'opened' ? 'legend-active' : ''} onClick={() => setActiveMetric('opened')}><i className="legend-cyan" />Opens</button><button className={activeMetric === 'clicked' ? 'legend-active' : ''} onClick={() => setActiveMetric('clicked')}><i className="legend-purple" />Clicks</button></div></div><div className="chart-summary"><b>38,492</b><span>total events</span><em><ArrowUpRight size={13} /> 14.2%</em><small>vs. previous period</small></div><div className="main-chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData} margin={{ top: 10, right: 10, left: -22, bottom: 0 }}><defs><linearGradient id="deliveryGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1677f9" stopOpacity={0.16} /><stop offset="100%" stopColor="#1677f9" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="#edf1f6" vertical={false} /><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#98a2b3', fontSize: 11 }} dy={10} /><YAxis axisLine={false} tickLine={false} tick={{ fill: '#98a2b3', fontSize: 11 }} /><Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e7ecf2', boxShadow: '0 8px 24px #16324f12' }} /><Area type="monotone" dataKey={activeMetric} stroke={activeMetric === 'delivered' ? '#146ef5' : activeMetric === 'opened' ? '#0fb6d8' : '#8758e8'} strokeWidth={2.5} fill="url(#deliveryGradient)" activeDot={{ r: 5 }} /></AreaChart></ResponsiveContainer></div><div className="chart-footer"><span><i className="status-dot green-dot" /> Sending normally</span><button onClick={() => { window.location.href = '/app/analytics' }}>View analytics <ArrowRight size={13} /></button></div></article>
      <article className="dashboard-panel checklist-panel"><div className="panel-heading"><div><h2>Getting started</h2><p>A few steps to set up your workspace</p></div><span className="checklist-count">{completed.length}/{checklist.length}</span></div><div className="setup-progress"><span style={{ width: `${completed.length / checklist.length * 100}%` }} /></div><div className="checklist-items">{checklist.map(([id, label, note, href]) => { const done = completed.includes(id); return <div className={`checklist-item ${done ? 'checklist-done' : ''}`} key={id}><button aria-label={`${done ? 'Mark incomplete' : 'Mark complete'}: ${label}`} onClick={() => onToggleChecklist(id)} className="checklist-check">{done && <Check size={12} />}</button><Link href={href}><b>{label}</b><small>{done ? 'Completed' : note}</small></Link><Link href={href} className="checklist-arrow" aria-label={`Go to ${label}`}><ArrowRight size={15} /></Link></div> })}</div><button className="checklist-help" onClick={() => onAction('Getting started guide opened.')}>View setup guide <ArrowRight size={13} /></button></article></section>
    <section className="overview-lower-grid"><article className="dashboard-panel recent-panel"><div className="panel-heading"><div><h2>Recent campaigns</h2><p>How your latest sends are performing</p></div><Link href="/app/campaigns">All campaigns {liveCampaigns.length > 0 ? `(${liveCampaigns.length})` : ''} <ArrowRight size={13} /></Link></div>
      {isLoadingCampaigns ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '14px' }}>
          {[1, 2, 3].map((n) => (
            <div key={n} style={{ display: 'grid', gridTemplateColumns: '30px minmax(0, 1fr) auto 20px', alignItems: 'center', gap: '9px', padding: '10px 4px', borderBottom: n < 3 ? '1px solid #f0f2f5' : 'none' }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: '#f1f5f9' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
                <div style={{ width: '55%', height: 14, borderRadius: 4, background: '#f1f5f9' }} />
                <div style={{ width: '35%', height: 11, borderRadius: 4, background: '#f8fafc' }} />
              </div>
              <div style={{ width: 52, height: 20, borderRadius: 999, background: '#f1f5f9' }} />
              <div style={{ width: 14, height: 14, borderRadius: 4, background: '#f1f5f9' }} />
            </div>
          ))}
        </div>
      ) : liveCampaigns.length === 0 ? (
        <div style={{ padding: '24px 16px', textAlign: 'center', background: '#f8fafc', borderRadius: '10px', marginTop: '12px', border: '1px dashed #e2e8f0' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#eef5ff', color: '#176ef5', display: 'grid', placeItems: 'center', margin: '0 auto 10px' }}>
            <Mail size={18} />
          </div>
          <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 650, color: '#334155' }}>No campaigns yet</p>
          <p style={{ margin: '0 0 14px', fontSize: '13px', color: '#64748b' }}>Create your first email campaign to reach and engage your audience.</p>
          <Link href="/app/campaigns/create" className="button button-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '6px 14px' }}>
            <Plus size={14} /> Create campaign
          </Link>
        </div>
      ) : (
        <div className="recent-campaign-list">
          {liveCampaigns.slice(0, 4).map((campaign, idx) => {
            const isSent = campaign.status === 'sent'
            const isSending = campaign.status === 'sending'
            const isDraft = campaign.status === 'draft'

            const recipientCount = campaign.stats?.delivered ?? campaign.stats?.total ?? 0
            const openRate = campaign.stats?.total
              ? Math.round(((campaign.stats?.opened ?? 0) / campaign.stats.total) * 100)
              : (campaign.stats?.delivered ? Math.round(((campaign.stats?.opened ?? 0) / campaign.stats.delivered) * 100) : 0)

            let subtitle = ''
            if (isSent) {
              subtitle = `Sent ${formatCampaignDate(campaign.sent_at || campaign.created_at)}${recipientCount > 0 ? ` · ${recipientCount.toLocaleString()} recipients` : ''}`
            } else if (isSending) {
              subtitle = `Sending in progress${recipientCount > 0 ? ` · ${recipientCount.toLocaleString()} recipients` : ''}`
            } else if (isDraft) {
              subtitle = campaign.subject ? `Draft · ${campaign.subject}` : `Draft · Edited ${formatCampaignDate(campaign.updated_at || campaign.created_at)}`
            } else {
              subtitle = `${campaign.status} · ${formatCampaignDate(campaign.created_at)}`
            }

            const iconClass = isSending
              ? 'campaign-type-icon campaign-type-cyan'
              : isDraft
              ? 'campaign-type-icon campaign-type-purple'
              : 'campaign-type-icon'

            const href = isDraft ? '/app/campaigns' : `/app/campaigns/${campaign.id}/report`

            return (
              <Link
                key={campaign.id || idx}
                href={href}
                className="recent-campaign-row-link"
                title={`View ${campaign.name || 'campaign'}`}
              >
                <span className={iconClass}>
                  {isSending ? <Send size={15} /> : isDraft ? <Pencil size={15} /> : <Mail size={16} />}
                </span>
                <span>
                  <b style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {campaign.name || 'Untitled campaign'}
                  </b>
                  <small style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {subtitle}
                  </small>
                </span>
                <span className="campaign-open-rate">
                  {isSent && (campaign.stats?.opened !== undefined || openRate > 0) ? (
                    <>
                      <b>{openRate}%</b>
                      <small>open rate</small>
                    </>
                  ) : (
                    <StatusBadge status={isSent ? 'Sent' : isSending ? 'Sending' : isDraft ? 'Draft' : campaign.status} />
                  )}
                </span>
                <span className="campaign-action">
                  <ArrowUpRight size={15} />
                </span>
              </Link>
            )
          })}
        </div>
      )}
    </article><article className="dashboard-panel domain-health-panel"><div className="panel-heading"><div><div className="health-panel-eyebrow"><ShieldCheck size={14} /> REPUTATION &amp; DELIVERABILITY</div><h2>Sending health</h2><p>Authentication &amp; reputation across your sending domains</p></div><button className="panel-more" aria-label="Domain health options" onClick={() => onAction('Domain health options opened.')}>···</button></div><div className="health-score-row"><div className="health-meter"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r={radius} className="meter-bg" /><circle className="health-meter-value" cx="50" cy="50" r={radius} style={{ strokeDasharray: circumference, strokeDashoffset }} /></svg><span className="health-meter-score">{healthScore}</span></div><div className="health-score-details"><b className="health-rating-title">{healthLabel}</b><small className="health-rating-sub">Reputation is healthy &amp; trusted</small><span className="health-trend"><ArrowUpRight size={14} /> +2.4% deliverability</span></div></div><div className="domain-health-list">{displayDomains.map((domain) => (<Link href="/app/domains" key={domain.id} className="domain-health-item"><div className="domain-item-left"><span className={`domain-icon ${domain.is_verified ? 'domain-icon-verified' : 'domain-icon-warn'}`}>{domain.is_verified ? <ShieldCheck size={18} /> : <Globe2 size={18} />}</span><div className="domain-item-meta"><b className="domain-name-text">{domain.name}</b><small className="domain-status-note">{domain.is_verified ? 'SPF, DKIM & DMARC Authenticated' : 'DNS Verification Pending'}</small></div></div><StatusBadge status={domain.is_verified ? 'Verified' : 'Action needed'} /></Link>))}</div><Link href="/app/domains" className="domain-health-link"><span>Manage sending domains</span><ArrowRight size={15} /></Link></article></section>
    <section className="quick-actions-row"><div><span className="quick-actions-icon"><Sparkles size={16} /></span><span><b>Ready to make your next move?</b><small>Everything you need to keep your email program growing.</small></span></div><button onClick={() => onOpenAction('contact')}><Plus size={15} /> Add a contact</button><button onClick={() => { window.location.href = '/app/campaigns/create' }}><Send size={15} /> Create a campaign</button><button onClick={() => window.location.href = '/app/api-keys/docs'}><Braces size={15} /> Explore the API</button></section>
  </>
}

function SegmentBuilder({ onAction }: { onAction: (message: string) => void }) {
  const [name, setName] = useState('Engaged customers')
  const [rules, setRules] = useState([{ field: 'Email engagement', operator: 'has', value: 'Opened any campaign' }])
  const updateRule = (index: number, key: 'field' | 'operator' | 'value', value: string) => setRules((current) => current.map((rule, ruleIndex) => ruleIndex === index ? { ...rule, [key]: value } : rule))
  const removeRule = (index: number) => setRules((current) => current.filter((_, ruleIndex) => ruleIndex !== index))
  const estimatedCount = Math.max(860, 8204 - Math.max(0, rules.length - 1) * 1260)
  return <><div className="page-heading-row"><div><div className="page-eyebrow">CONTACTS & CRM <span>/</span> SEGMENT BUILDER</div><h1>Build an audience segment</h1><p>Combine contact attributes and engagement to find the right people.</p></div><button className="button button-primary" onClick={() => onAction(`Segment “${name || 'Untitled segment'}” saved for this demo.`)}><Check size={14} /> Save segment</button></div><div className="segment-builder-layout"><section className="segment-builder-card"><label className="segment-name-field">Segment name<input value={name} onChange={(event) => setName(event.target.value)} /></label><div className="segment-match-row"><span>Contacts must match</span><select aria-label="Match conditions"><option>all conditions</option><option>any condition</option></select><span>below</span></div><div className="segment-rules">{rules.map((rule, index) => <div className="segment-rule" key={index}><span className="rule-index">{index + 1}</span><select aria-label={`Filter field ${index + 1}`} value={rule.field} onChange={(event) => updateRule(index, 'field', event.target.value)}><option>Email engagement</option><option>Contact tag</option><option>Signup date</option><option>Country</option><option>Lifecycle stage</option></select><select aria-label={`Filter operator ${index + 1}`} value={rule.operator} onChange={(event) => updateRule(index, 'operator', event.target.value)}><option>has</option><option>is</option><option>is not</option><option>is within</option></select><select aria-label={`Filter value ${index + 1}`} value={rule.value} onChange={(event) => updateRule(index, 'value', event.target.value)}><option>Opened any campaign</option><option>Clicked any campaign</option><option>Added in the last 30 days</option><option>Customer</option><option>Trial</option></select><button aria-label={`Remove condition ${index + 1}`} onClick={() => removeRule(index)}><X size={14} /></button></div>)}</div><button className="segment-add-rule" onClick={() => setRules((current) => [...current, { field: 'Contact tag', operator: 'is', value: 'Customer' }])}><Plus size={13} /> Add condition</button><div className="segment-builder-footer"><span>Preview updates as you refine your conditions.</span><button className="button button-secondary" onClick={() => onAction(`${estimatedCount.toLocaleString()} contacts match this segment.`)}>Preview segment <ArrowRight size={13} /></button></div></section><aside className="segment-preview-card"><span className="segment-preview-icon"><ContactRound size={18} /></span><small>ESTIMATED AUDIENCE</small><b>{estimatedCount.toLocaleString()}</b><span>contacts match</span><div className="segment-audience-bars"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></div><p>Based on your latest contact activity in the demo workspace.</p><Link href="/app/contacts">View all contacts <ArrowRight size={13} /></Link></aside></div></>
}

function ContactDetailPage({ route, onAction, customRows }: { route: string; onAction: (message: string) => void; customRows: MockRow[] }) {
  const slug = route.split('/').at(-1) ?? ''
  const contact = [...customRows.filter((row) => row.kind === 'Contact'), ...getRowsForRoute('contacts')].find((row) => row.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === slug)
  const displayName = contact?.name ?? slug.split('-').map((part) => part[0]?.toUpperCase() + part.slice(1)).join(' ')
  const email = contact?.detail.split(' · ')[0] ?? 'contact@example.com'
  return <><div className="page-heading-row"><div><div className="page-eyebrow"><Link href="/app/contacts">CONTACTS & CRM</Link> <span>/</span> CONTACT PROFILE</div><h1>{displayName}</h1><p>Contact profile, preferences, and recent activity.</p></div><div className="page-heading-actions"><button className="button button-secondary" onClick={() => onAction(`Edit ${displayName} opened.`)}>Edit contact</button><button className="button button-primary" onClick={() => onAction(`A campaign draft for ${displayName} is ready.`)}><Send size={14} /> Send an email</button></div></div><div className="contact-profile-layout"><section className="contact-profile-card"><div className="contact-profile-header"><span className="contact-profile-avatar">{displayName.split(' ').map((part) => part[0]).join('').slice(0, 2)}</span><div><h2>{displayName}</h2><p>{email}</p></div><StatusBadge status={contact?.status ?? 'Subscribed'} /></div><div className="contact-detail-list"><div><span>Contact type</span><b>{contact?.detail.split(' · ')[1] ?? 'Subscriber'}</b></div><div><span>Subscribed</span><b>Oct 18, 2026</b></div><div><span>Last activity</span><b>Opened November product notes</b></div><div><span>Source</span><b>MetroVPS website signup form</b></div></div><div className="contact-tags"><b>Tags</b><span>Customer</span><span>Product updates</span><button onClick={() => onAction('Add contact tag opened.')}>+ Add tag</button></div></section><section className="contact-activity-card"><div className="panel-heading"><div><h2>Activity timeline</h2><p>Recent interactions from this contact</p></div><button onClick={() => onAction('Activity filters opened.')}>Filter <ChevronDown size={13} /></button></div><div className="contact-timeline">{[['Nov 14 · 10:42 AM', 'Opened November product notes', 'Campaign · Product updates', 'open'], ['Nov 12 · 9:18 AM', 'Clicked “Explore what’s new”', 'Campaign · Product updates', 'click'], ['Nov 10 · 2:04 PM', 'Contact profile updated', 'Website signup form', 'profile'], ['Nov 02 · 8:40 AM', 'Subscribed to product updates', 'Preference center', 'subscribe']].map(([date, title, detail, kind]) => <div className="contact-timeline-item" key={title}><span className={`timeline-dot timeline-${kind}`} /> <div><small>{date}</small><b>{title}</b><span>{detail}</span></div></div>)}</div></section></div></>
}

function CampaignReportPage({ route, onAction, customRows }: { route: string; onAction: (message: string) => void; customRows: MockRow[] }) {
  const slug = route.split('/')[1]
  const campaign = [...customRows.filter((row) => row.kind === 'Campaign'), ...getRowsForRoute('campaigns')].find((row) => row.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === slug)
  const name = campaign?.name ?? slug.split('-').map((part) => part[0]?.toUpperCase() + part.slice(1)).join(' ')
  return <><div className="page-heading-row"><div><div className="page-eyebrow"><Link href="/app/campaigns">CAMPAIGNS</Link> <span>/</span> REPORT</div><h1>{name}</h1><p>{campaign?.detail ?? 'Campaign report and audience engagement.'}</p></div><button className="button button-secondary" onClick={() => onAction('Campaign report exported.')}>Export report <ArrowDownToLine size={14} /></button></div><section className="campaign-report-summary">{[['Delivered', '8,392', '99.7%'], ['Unique opens', '3,596', '42.8%'], ['Unique clicks', '721', '8.6%'], ['Bounces', '15', '0.18%']].map(([label, value, rate]) => <article key={label}><small>{label}</small><b>{value}</b><span>{rate} of recipients</span></article>)}</section><div className="campaign-report-layout"><section className="dashboard-panel"><div className="panel-heading"><div><h2>Engagement over time</h2><p>Opens and clicks since the campaign was sent</p></div><StatusBadge status={campaign?.status ?? 'Sent'} /></div><div className="analytics-chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData} margin={{ top: 12, right: 10, left: -18, bottom: 0 }}><CartesianGrid stroke="#edf1f6" vertical={false} /><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#98a2b3', fontSize: 11 }} /><YAxis axisLine={false} tickLine={false} tick={{ fill: '#98a2b3', fontSize: 11 }} /><Tooltip /><Area type="monotone" dataKey="opened" stroke="#146ef5" fill="#1677f91a" strokeWidth={2} /><Area type="monotone" dataKey="clicked" stroke="#12b7dc" fill="#12b7dc12" strokeWidth={2} /></AreaChart></ResponsiveContainer></div></section><section className="dashboard-panel campaign-report-side"><h2>Campaign details</h2><div><span>Status</span><StatusBadge status={campaign?.status ?? 'Sent'} /></div><div><span>Recipients</span><b>8,420</b></div><div><span>Subject line</span><b>A few things we’ve been working on</b></div><div><span>Sent</span><b>Nov 12, 2026 · 10:04 AM</b></div><button className="button button-secondary" onClick={() => onAction('A/B test variation report opened.')}>Compare variations</button></section></div></>
}

function CampaignBuilder({ step, setStep, name, setName, onComplete, onAction, abTestEnabled, setAbTestEnabled }: { step: number; setStep: (step: number) => void; name: string; setName: (name: string) => void; onComplete: () => void; onAction: (message: string) => void; abTestEnabled: boolean; setAbTestEnabled: (enabled: boolean) => void }) {
  const labels = ['Campaign details', 'Choose recipients', 'Design your email', 'Review & schedule']
  return <div className="campaign-builder-page"><div className="page-heading-row"><div><div className="page-eyebrow">CAMPAIGNS <span>/</span> NEW CAMPAIGN</div><h1>Create a campaign</h1><p>Let’s get your next message ready to send.</p></div><Link className="button button-secondary" href="/app/campaigns">Save and exit</Link></div><div className="campaign-stepper">{labels.map((label, index) => <button key={label} className={index === step ? 'step-current' : index < step ? 'step-complete' : ''} onClick={() => index <= step && setStep(index)}><span>{index < step ? <Check size={14} /> : `0${index + 1}`}</span><b>{label}</b></button>)}</div><section className={`builder-card ${step === 2 ? 'builder-card-fullscreen' : ''}`}><div className={`builder-main ${step === 2 ? 'builder-main-fullscreen' : ''}`}><div className="eyebrow">STEP 0{step + 1} OF 04</div><h2>{labels[step]}</h2><p>{step === 0 ? 'Give this campaign a name and set the essential details.' : step === 1 ? 'Choose who should receive this message.' : step === 2 ? 'Arrange content blocks and preview your email on desktop or mobile.' : 'Review your campaign before you save it.'}</p>{step === 0 && <div className="builder-fields"><label>Campaign name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. November product update" /></label><label>Subject line<input defaultValue="A few things we’ve been working on" placeholder="Write a clear subject line" /></label><label>Preview text<input defaultValue="The latest from the MetroVPS team." placeholder="A short preview after your subject" /></label><label>Sender<select defaultValue="MetroVPS team <hello@updates.metrovps.com>"><option>MetroVPS team &lt;hello@updates.metrovps.com&gt;</option><option>Product updates &lt;product@metrovps.com&gt;</option></select></label><label className="toggle-field"><span><b>A/B test subject lines</b><small>Compare two subject lines with a sample audience.</small></span><input type="checkbox" checked={abTestEnabled} onChange={(event) => setAbTestEnabled(event.target.checked)} /></label></div>}{step === 1 && <div className="audience-choice-list">{[['All active contacts', '24,806 contacts', 'All subscribed contacts in your workspace'], ['Engaged customers', '8,204 contacts', 'Opened or clicked in the last 90 days'], ['New subscribers', '4,420 contacts', 'Joined your audience in the last 30 days']].map(([label, count, note]) => <label key={label}><input type="radio" name="audience" defaultChecked={label === 'Engaged customers'} /><span><b>{label}</b><small>{note}</small></span><strong>{count}</strong></label>)}</div>}{step === 2 && <EmailEditor startEmpty onAction={onAction} subject={name || 'A few things we’ve been working on'} />}{step === 3 && <div className="review-summary"><div><span>Campaign</span><b>{name || 'Untitled campaign'}</b></div><div><span>Recipients</span><b>Engaged customers · 8,204 contacts</b></div><div><span>Subject</span><b>A few things we’ve been working on</b></div><div><span>Schedule</span><b>Send now or schedule for later</b></div><button onClick={() => onAction('Schedule options opened for this draft.')}>Choose a send time <ChevronDown size={14} /></button></div>}<div className="builder-actions">{step > 0 && <button className="button button-secondary" onClick={() => setStep(step - 1)}>Back</button>}<span />{step < 3 ? <button className="button button-primary" onClick={() => setStep(step + 1)}>Continue <ArrowRight size={15} /></button> : <button className="button button-primary" onClick={onComplete}>Save campaign draft <Check size={15} /></button>}</div></div>{step !== 2 && <aside className="builder-aside"><span className="builder-aside-icon"><Sparkles size={18} /></span><h3>A thoughtful send starts with a clear goal.</h3><p>Choose an audience that expects to hear from you. Keep your subject line focused and your content useful.</p><div className="builder-aside-tip"><ShieldCheck size={15} /><span><b>Good to know</b><small>Only send to contacts who have opted in.</small></span></div><Link href="/app/contacts/segments">Explore audience segments <ArrowRight size={13} /></Link></aside>}</section>{step === 2 && <div className="builder-guidance-banner"><div className="guidance-banner-left"><span className="builder-aside-icon"><Sparkles size={20} /></span><div className="guidance-banner-text"><h3>A thoughtful send starts with a clear goal.</h3><p>Choose an audience that expects to hear from you. Keep your subject line focused, your content readable, and your call-to-actions prominent.</p></div></div><div className="guidance-banner-right"><div className="builder-aside-tip"><ShieldCheck size={16} /><span><b>Good to know</b><small>Only send to contacts who have opted in.</small></span></div><Link href="/app/contacts/segments" className="button button-secondary">Explore audience segments <ArrowRight size={14} /></Link></div></div>}</div>
}



function WorkflowBuilder({ running, setRunning, onAction }: { running: boolean; setRunning: (value: boolean) => void; onAction: (message: string) => void }) {
  return <><div className="page-heading-row"><div><div className="page-eyebrow">AUTOMATIONS <span>/</span> WORKFLOW BUILDER</div><h1>Welcome journey</h1><p>Build a useful welcome experience for every new subscriber.</p></div><div className="page-heading-actions"><button className="button button-secondary" onClick={() => onAction('Workflow changes saved as a draft.')}>Save draft</button><button className="button button-primary" onClick={() => { setRunning(!running); onAction(running ? 'Workflow paused.' : 'Workflow activated.') }}><Check size={14} />{running ? 'Pause workflow' : 'Activate workflow'}</button></div></div><section className="workflow-canvas"><div className="workflow-canvas-head"><span><i className="status-dot green-dot" /> {running ? 'Active' : 'Draft'}</span><span>Last edited just now</span><button onClick={() => onAction('Workflow settings opened.')}>Settings <ChevronDown size={13} /></button></div><div className="workflow-flow"><div className="workflow-node trigger-node"><span><Sparkles size={17} /></span><small>TRIGGER</small><b>Contact joins a list</b><p>List: Product updates</p><button onClick={() => onAction('Trigger settings opened.')}>Edit trigger <ArrowRight size={12} /></button></div><div className="workflow-link"><i /></div><button className="workflow-add-node" aria-label="Add workflow step" onClick={() => onAction('Step picker opened. Choose a delay, condition, or email action.')}><Plus size={15} /></button><div className="workflow-link"><i /></div><div className="workflow-node delay-node"><span><Clock3 size={17} /></span><small>DELAY</small><b>Wait for 1 day</b><p>Give your new subscriber time to explore.</p><button onClick={() => onAction('Delay settings opened.')}>Edit delay <ArrowRight size={12} /></button></div><div className="workflow-link"><i /></div><button className="workflow-add-node" aria-label="Add workflow step" onClick={() => onAction('Step picker opened. Choose a delay, condition, or email action.')}><Plus size={15} /></button><div className="workflow-link"><i /></div><div className="workflow-node email-node"><span><Mail size={17} /></span><small>EMAIL</small><b>A useful getting-started guide</b><p>Welcome email · 56.4% opens</p><button onClick={() => onAction('Email step editor opened.')}>Edit email <ArrowRight size={12} /></button></div></div><div className="workflow-canvas-foot"><span><Activity size={14} /> 1,204 contacts entered this journey</span><span>Average completion 2.4 days</span></div></section><section className="workflow-stats"><article><small>Enrolled contacts</small><b>1,204</b><span>↑ 18.2% this month</span></article><article><small>Journey completion</small><b>78.4%</b><span>↑ 4.6% this month</span></article><article><small>Email open rate</small><b>56.4%</b><span>↑ 8.1% this month</span></article></section></>
}

function DomainPage({ route, onAction, copiedRecord, copyText }: { route: string; onAction: (message: string) => void; onOpenAction?: (action: 'contact' | 'key' | 'domain' | null) => void; copiedRecord: string; copyText: (text: string) => void }) {
  return <DomainsManagement route={route} onAction={onAction} copiedRecord={copiedRecord} copyText={copyText} />
}

function DeveloperPage({ route, codeTab, setCodeTab, onAction, copyText }: { route: string; codeTab: string; setCodeTab: (tab: string) => void; onAction: (message: string) => void; copyText: (text: string) => void }) {
  const code: Record<string, string> = { 'Node.js': 'import MetroMail from "metromail";\n\nconst client = new MetroMail(process.env.METROMAIL_API_KEY);\n\nawait client.messages.send({\n  from: "hello@updates.example.com",\n  to: "customer@example.com",\n  subject: "Your order is on its way",\n  template: "order-shipped",\n});', Python: 'from metromail import Client\n\nclient = Client(api_key=os.environ["METROMAIL_API_KEY"])\n\nclient.messages.send(\n  from_="hello@updates.example.com",\n  to="customer@example.com",\n  subject="Your order is on its way",\n  template="order-shipped",\n)', PHP: '$client = new MetroMailClient(getenv("METROMAIL_API_KEY"));\n\n$client->messages()->send([\n  "from" => "hello@updates.example.com",\n  "to" => "customer@example.com",\n  "subject" => "Your order is on its way",\n  "template" => "order-shipped",\n]);', cURL: 'curl -X POST https://api.metromail.example/v1/messages \\\n  -H "Authorization: Bearer $METROMAIL_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d \'{"from":"hello@example.com","to":"customer@example.com","subject":"Your order is on its way"}\'' }
  if (route === 'api-keys/smtp') return <><div className="page-heading-row"><div><div className="page-eyebrow">DEVELOPER TOOLS <span>/</span> SMTP CONFIGURATION</div><h1>SMTP configuration</h1><p>Connect your app to the MetroMail relay.</p></div><button className="button button-secondary" onClick={() => onAction('SMTP settings copied.')}>Copy configuration <Copy size={14} /></button></div><section className="smtp-configuration"><div><small>SMTP HOST</small><b>smtp.metromail.email</b><button onClick={() => copyText('smtp.metromail.email')}><Copy size={14} /></button></div><div><small>PORT</small><b>587 (STARTTLS)</b><button onClick={() => copyText('587')}><Copy size={14} /></button></div><div><small>USERNAME</small><b>key_live_••••••••••••4b9d</b><button onClick={() => onAction('Username copied (masked).')}><Copy size={14} /></button></div><div><small>PASSWORD</small><b>••••••••••••••••••••••••</b><button onClick={() => onAction('SMTP passwords remain masked in this demo.')}><ShieldCheck size={14} /></button></div></section><section className="inline-callout"><ShieldCheck size={17} /><div><b>Keep credentials out of source code</b><p>Use environment variables and separate keys for each environment.</p></div><Link href="/app/api-keys">Manage API keys <ArrowRight size={14} /></Link></section></>
  if (route === 'webhooks') return <><div className="page-heading-row"><div><div className="page-eyebrow">DEVELOPER TOOLS <span>/</span> WEBHOOKS</div><h1>Webhooks</h1><p>Stream delivery and engagement events to your application.</p></div><div className="page-heading-actions"><Link className="button button-secondary" href="/app/webhooks/deliveries">View deliveries <ArrowRight size={14} /></Link><button className="button button-primary" onClick={() => onAction('Webhook endpoint setup opened.')}>Add endpoint <Plus size={14} /></button></div></div><section className="webhook-endpoint-card"><span className="webhook-icon"><Activity size={17} /></span><div><b>https://api.metrovps.com/webhooks/email</b><small>Production endpoint · Last delivery 2 minutes ago</small></div><StatusBadge status="Active" /><button className="table-more" onClick={() => onAction('Webhook endpoint actions opened.')}>•••</button></section><section className="developer-event-list"><h2>Subscribed events</h2>{['message.delivered', 'message.opened', 'message.clicked', 'message.bounced'].map((event) => <label key={event}><input type="checkbox" defaultChecked /><code>{event}</code><span>Enabled</span></label>)}</section></>
  return <><div className="page-heading-row"><div><div className="page-eyebrow">DEVELOPER TOOLS <span>/</span> API DOCUMENTATION</div><h1>Send your first email</h1><p>Make your first request in a few lines. Your API key is never exposed in this example.</p></div><Link href="/app/api-keys" className="button button-secondary">Manage API keys <ArrowRight size={14} /></Link></div><div className="api-docs-layout"><section className="api-docs-copy"><div className="api-doc-step"><span>1</span><div><h2>Install the SDK</h2><p>Choose your language and install the MetroMail package.</p><div className="install-command"><code>npm install metromail</code><button onClick={() => copyText('npm install metromail')}><Copy size={14} /></button></div></div></div><div className="api-doc-step"><span>2</span><div><h2>Set your API key</h2><p>Add a key to your environment. Never commit it to source control.</p><div className="install-command"><code>METROMAIL_API_KEY=key_live_••••••••</code><button onClick={() => onAction('Masked example copied.')}> <Copy size={14} /></button></div></div></div><div className="api-doc-step"><span>3</span><div><h2>Send a message</h2><p>Use a template or pass your message content directly.</p></div></div><Link href="/documentation" className="text-link">View full API reference <ExternalLink size={13} /></Link></section><section className="code-example"><div className="code-example-head"><div>{['Node.js', 'Python', 'PHP', 'cURL'].map((language) => <button key={language} className={codeTab === language ? 'code-tab-active' : ''} onClick={() => setCodeTab(language)}>{language}</button>)}</div><button onClick={() => copyText(code[codeTab])}><Copy size={14} /> Copy</button></div><pre><code>{code[codeTab]}</code></pre><div className="code-example-foot"><span><i className="status-dot green-dot" /> Example request</span><span>API v1</span></div></section></div></>
}

function IntegrationPage({ onAction }: { onAction: (message: string) => void }) {
  const [activeCategory, setActiveCategory] = useState('All integrations')
  const items = [['Shopify', 'E-commerce', 'Sync customers and order updates.', 'S'], ['HubSpot', 'CRM', 'Keep contact records in sync.', 'H'], ['Zapier', 'Automation', 'Connect your email to 1,000+ tools.', 'z'], ['Segment', 'Developer tools', 'Send customer events to your workspace.', '∑'], ['Salesforce', 'CRM', 'Connect sales and customer lifecycle data.', 's'], ['WooCommerce', 'E-commerce', 'Coordinate orders and email campaigns.', 'W']]
  const filtered = activeCategory === 'All integrations' ? items : items.filter((item) => item[1] === activeCategory)
  return <><div className="page-heading-row"><div><div className="page-eyebrow">WORKSPACE <span>/</span> INTEGRATIONS</div><h1>Connect your favorite tools.</h1><p>Explore sample integrations for commerce, CRM, automation, and developer tools.</p></div><button className="button button-secondary" onClick={() => onAction('Integration request form opened.')}>Request integration <Plus size={14} /></button></div><div className="integration-categories">{['All integrations', 'E-commerce', 'CRM', 'Automation', 'Developer tools'].map((category) => <button key={category} className={category === activeCategory ? 'active' : ''} onClick={() => setActiveCategory(category)}>{category}</button>)}</div><div className="integration-grid">{filtered.map(([name, category, description, letter]) => <article key={name}><span className={`integration-brand integration-brand-${letter.toLowerCase()}`}>{letter}</span><span className="integration-category-label">{category} · Sample</span><h3>{name}</h3><p>{description}</p><button className="button button-secondary" onClick={() => onAction(`${name} connection setup opened. Backend connection is not enabled in this demo.`)}>{name === 'HubSpot' ? 'Connected' : 'Connect'} <ArrowRight size={13} /></button></article>)}</div><p className="sample-note">These sample integrations are illustrative and do not connect to external services.</p></>
}

function parseCsvRows(text: string, delimiter: string): string[][] {
  const rows: string[][] = []
  let cells: string[] = []
  let value = ''
  let quoted = false

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]
    if (character === '"') {
      if (quoted && text[index + 1] === '"') {
        value += '"'
        index += 1
      } else {
        quoted = !quoted
      }
    } else if (character === delimiter && !quoted) {
      cells.push(value.trim())
      value = ''
    } else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && text[index + 1] === '\n') index += 1
      cells.push(value.trim())
      if (cells.some(Boolean)) rows.push(cells)
      cells = []
      value = ''
    } else {
      value += character
    }
  }

  cells.push(value.trim())
  if (cells.some(Boolean)) rows.push(cells)
  return rows
}

function getDefaultColumnMappings(headers: string[]): string[] {
  const mappings = headers.map((header) => {
    const normalized = header.toLowerCase().replace(/[^a-z]/g, '')
    if (normalized.includes('email')) return 'email'
    if (normalized === 'name' || normalized === 'fullname') return 'name'
    if (normalized.includes('firstname')) return 'first_name'
    if (normalized.includes('lastname')) return 'last_name'
    if (normalized.includes('company')) return 'company'
    return 'ignore'
  })
  if (mappings.length && !mappings.includes('email')) mappings[0] = 'email'
  return mappings
}

function ContactImportPage({ onAction, onImport }: { onAction: (message: string) => void; onImport: (rows: MockRow[]) => void }) {
  const [fileName, setFileName] = useState('')
  const [sourceText, setSourceText] = useState('')
  const [allRows, setAllRows] = useState<string[][]>([])
  const [preview, setPreview] = useState<string[][]>([])
  const [columnMappings, setColumnMappings] = useState<string[]>([])
  const [imported, setImported] = useState(false)
  const [importedCount, setImportedCount] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [delimiter, setDelimiter] = useState(',')
  const readFile = async (file?: File) => {
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.csv')) { onAction('Please choose a CSV file.'); return }
    if (file.size > 10 * 1024 * 1024) { onAction('Choose a CSV file smaller than 10 MB.'); return }
    const text = await file.text()
    const rows = parseCsvRows(text, delimiter)
    setSourceText(text)
    setAllRows(rows)
    setFileName(file.name)
    setPreview(rows.slice(0, 6))
    setColumnMappings(getDefaultColumnMappings(rows[0] ?? []))
    setImported(false)
    setImportedCount(0)
  }
  const updateDelimiter = (value: string) => {
    setDelimiter(value)
    const rows = parseCsvRows(sourceText, value)
    setAllRows(rows)
    setPreview(rows.slice(0, 6))
    setColumnMappings(getDefaultColumnMappings(rows[0] ?? []))
  }
  const importContacts = () => {
    const emailColumn = columnMappings.indexOf('email')
    if (emailColumn < 0) { onAction('Map one CSV column to an email address before importing.'); return }
    const importedRows = allRows.slice(1).flatMap((row) => {
      const values = Object.fromEntries(columnMappings.map((mapping, index) => [mapping, row[index] ?? '']))
      const email = String(values.email ?? '').trim()
      if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+[.][A-Z]{2,}$/i.test(email)) return []
      const name = String(values.name ?? '').trim() || [values.first_name, values.last_name].filter(Boolean).join(' ').trim() || email.split('@')[0]
      return [{ name, detail: `${email} · Imported contact`, status: 'Subscribed', metric: '0 campaigns', date: new Date().toLocaleDateString(), kind: 'Contact' } satisfies MockRow]
    })
    if (!importedRows.length) { onAction('No valid email addresses were found in this CSV.'); return }
    onImport(importedRows)
    setImportedCount(importedRows.length)
    setImported(true)
    onAction(`${importedRows.length} contacts imported from ${fileName}.`)
  }
  const onDrop = (event: React.DragEvent<HTMLLabelElement>) => { event.preventDefault(); setDragging(false); void readFile(event.dataTransfer.files[0]) }
  return <div className="import-page"><div className="page-heading-row"><div><div className="page-eyebrow">CONTACTS & CRM <span>/</span> IMPORT</div><h1>Import contacts</h1><p>Bring your audience into MetroMail with a CSV file.</p></div><Link className="button button-secondary" href="/app/contacts">Back to contacts</Link></div><div className="import-stepper"><span className="step-active"><i>1</i> Upload file</span><span className={fileName ? 'step-active' : ''}><i>2</i> Review data</span><span className={imported ? 'step-active' : ''}><i>3</i> Import contacts</span></div><div className="import-layout"><section className="import-main-card"><div className="import-card-heading"><h2>{imported ? 'Import complete' : fileName ? 'Review your file' : 'Upload your CSV file'}</h2><p>{imported ? `${fileName} was processed locally for this demo.` : 'Your data stays in this browser in the frontend demo. Nothing is uploaded to a server.'}</p></div>{imported ? <div className="import-success-state"><span><Check size={19} /></span><b>Contacts are ready for your workspace</b><small>{importedCount} contacts added from {fileName}</small><button className="button button-secondary" onClick={() => { setFileName(''); setSourceText(''); setAllRows([]); setPreview([]); setColumnMappings([]); setImported(false); setImportedCount(0) }}>Import another file</button></div> : !fileName ? <label className={`csv-dropzone ${dragging ? 'csv-dropzone-active' : ''}`} onDragOver={(event) => { event.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)} onDrop={onDrop}><input type="file" accept=".csv,text/csv" onChange={(event) => void readFile(event.target.files?.[0])} aria-label="Choose a CSV file" /><span className="upload-icon"><ArrowDownToLine size={19} /></span><b>Drop your CSV file here</b><small>or <u>browse files</u> · Maximum file size 10 MB</small><span className="csv-file-types">CSV · UTF-8 · comma separated</span></label> : <><div className="import-file-meta"><span className="file-chip">CSV</span><span><b>{fileName}</b><small>{Math.max(allRows.length - 1, 0)} data rows detected · previewing first 5</small></span><button onClick={() => { setFileName(''); setSourceText(''); setAllRows([]); setPreview([]); setColumnMappings([]); setImported(false); setImportedCount(0) }}>Replace file</button></div><div className="import-table-wrap"><table className="import-preview-table"><thead><tr>{preview[0]?.map((header, index) => <th key={`${header}-${index}`}><select aria-label={`Map column ${header || index + 1}`} value={columnMappings[index] ?? 'ignore'} onChange={(event) => setColumnMappings((current) => current.map((mapping, mappingIndex) => mappingIndex === index ? event.target.value : mapping))}><option value="email">Email address</option><option value="name">Full name</option><option value="first_name">First name</option><option value="last_name">Last name</option><option value="company">Company</option><option value="ignore">Ignore column</option></select></th>)}</tr></thead><tbody>{preview.slice(1).map((row, rowIndex) => <tr key={rowIndex}>{preview[0]?.map((_, index) => <td key={`${rowIndex}-${index}`}>{row[index] || '—'}</td>)}</tr>)}</tbody></table></div><div className="import-settings"><label>Delimiter<select value={delimiter} onChange={(event) => updateDelimiter(event.target.value)}><option value=",">Comma (,)</option><option value=";">Semicolon (;)</option><option value="\t">Tab</option></select></label><label className="import-check"><input type="checkbox" defaultChecked /> Update existing contacts when email matches</label></div><div className="import-footer"><span>{Math.max(allRows.length - 1, 0)} rows · Changes remain local to this demo</span><button className="button button-primary" onClick={importContacts}><Check size={14} /> Import contacts</button></div></>}</section><aside className="import-aside"><span className="builder-aside-icon"><ShieldCheck size={17} /></span><h3>Keep your audience healthy.</h3><p>Only import contacts who have opted in to receive your email.</p><div className="import-aside-list"><span><Check size={13} /> Use a clear email column</span><span><Check size={13} /> Remove duplicates first</span><span><Check size={13} /> Honor unsubscribe requests</span></div><button className="text-link" onClick={() => onAction('CSV import guide opened.')}>Read import guide <ArrowRight size={13} /></button></aside></div></div>
}

function BillingPage({ title, onAction }: { title: [string, string]; onAction: (message: string) => void }) {
  return <><div className="page-heading-row"><div><div className="page-eyebrow">WORKSPACE <span>/</span> BILLING</div><h1>{title[0]}</h1><p>{title[1]}</p></div><button className="button button-primary" onClick={() => onAction('Plan selection opened. Billing is not connected in this demo.')}>Upgrade plan <ArrowRight size={14} /></button></div><section className="billing-overview"><article className="billing-plan-card"><div className="billing-plan-top"><span className="billing-plan-icon"><Sparkles size={17} /></span><StatusBadge status="Active" /></div><small>CURRENT PLAN</small><h2>Growth</h2><p>For teams building a consistent email program.</p><div className="billing-price"><b>$49</b><span>/ month</span></div><button className="text-link" onClick={() => onAction('Plan comparison opened.')}>Compare plans <ArrowRight size={13} /></button></article><article className="billing-usage-card"><div className="panel-heading"><div><h2>Monthly email usage</h2><p>Resets on December 1, 2026</p></div><b>64%</b></div><div className="billing-usage-number"><b>32,000</b><span>of 50,000 emails</span></div><div className="usage-track"><i /></div><div className="billing-usage-foot"><span>18,000 emails remaining</span><button onClick={() => onAction('Usage details opened.')}>View usage details</button></div><div className="billing-usage-note"><ShieldCheck size={15} /> Your sending is within the monthly plan limit.</div></article></section><section className="data-panel"><div className="data-panel-top"><div><h2>Billing history</h2><p>Download invoices for your records.</p></div><button className="filter-button" onClick={() => onAction('Payment method management opened.')}>Visa ending 4242 <ChevronDown size={13} /></button></div><BillingInvoices onAction={onAction} /></section><section className="billing-method"><div><span className="card-brand">VISA</span><span><b>Visa ending in 4242</b><small>Expires 08/2028 · Default payment method</small></span></div><button className="button button-secondary" onClick={() => onAction('Payment method editor opened.')}>Update payment method</button></section></>
}
function BillingInvoices({ onAction }: { onAction: (message: string) => void }) { return <div className="invoice-list">{[['October 2026', '$49.00', 'Paid'], ['September 2026', '$49.00', 'Paid'], ['August 2026', '$49.00', 'Paid']].map(([month, amount, status]) => <div key={month}><span><b>{month}</b><small>MetroMail Growth subscription</small></span><b>{amount}</b><StatusBadge status={status} /><button aria-label={`Download ${month} invoice`} onClick={() => onAction(`${month} invoice downloaded.`)}><ArrowDownToLine size={15} /></button></div>)}</div> }

function SupportPage({ title, onAction, onOpenAction }: { title: [string, string]; onAction: (message: string) => void; onOpenAction: (action: 'contact' | 'key' | 'domain' | 'list' | 'form' | 'attribute' | 'ticket' | null) => void }) {
  const [activeCategory, setActiveCategory] = useState('All topics')
  const [query, setQuery] = useState('')
  const docs = [['Verify a sending domain', 'Add your SPF and DKIM records and complete a verification check.', '4 min', 'Deliverability'], ['Send your first campaign', 'A quick guide from your first draft to a scheduled send.', '6 min', 'Campaigns'], ['Send email with the API', 'Make a request and follow delivery events in your logs.', '5 min', 'Developer docs'], ['Understand email events', 'Learn what delivered, opened, clicked, and bounced mean.', '7 min', 'Deliverability'], ['Import your contacts', 'Prepare and map a CSV before adding contacts to your audience.', '3 min', 'Getting started'], ['Build a welcome automation', 'Start a journey when a new subscriber joins a list.', '5 min', 'Campaigns']]
  const filteredDocs = docs.filter(([heading, description, , category]) => (activeCategory === 'All topics' || category === activeCategory) && `${heading} ${description}`.toLowerCase().includes(query.trim().toLowerCase()))
  return <><div className="page-heading-row"><div><div className="page-eyebrow">WORKSPACE <span>/</span> SUPPORT</div><h1>{title[0]}</h1><p>{title[1]}</p></div><button className="button button-primary" onClick={() => onOpenAction('ticket')}><Plus size={14} /> Create a ticket</button></div><div className="support-search"><Search size={17} /><input placeholder="Search guides and documentation" aria-label="Search help guides" value={query} onChange={(event) => setQuery(event.target.value)} /><kbd>⌘ K</kbd></div><div className="support-category-row">{['All topics', 'Getting started', 'Campaigns', 'Developer docs', 'Deliverability'].map((category) => <button key={category} className={activeCategory === category ? 'active' : ''} onClick={() => setActiveCategory(category)}>{category}</button>)}</div><section className="help-article-grid">{filteredDocs.length ? filteredDocs.map(([heading, description, duration, category]) => <article key={heading}><span className="help-article-icon">{category === 'Developer docs' ? <Code2 size={17} /> : category === 'Deliverability' ? <Globe2 size={17} /> : <Mail size={17} />}</span><small>{category.toUpperCase()} · {duration.toUpperCase()} READ</small><h3>{heading}</h3><p>{description}</p><button className="text-link" onClick={() => onAction(`${heading} guide opened.`)}>Read guide <ArrowRight size={13} /></button></article>) : <p className="support-empty-state">No guides match that search. Try another topic or search term.</p>}</section><section className="support-ticket-banner"><span><LifeBuoy size={20} /></span><div><b>Need a hand with your setup?</b><small>Our team is here to help with your email program.</small></div><button className="button button-secondary" onClick={() => onOpenAction('ticket')}>Contact support <ArrowRight size={14} /></button></section></>
}

function AutomationPage({ title, onAction }: { title: [string, string]; onAction: (message: string) => void }) { return <><div className="page-heading-row"><div><div className="page-eyebrow">WORKSPACE <span>/</span> AUTOMATIONS</div><h1>{title[0]}</h1><p>{title[1]}</p></div><button className="button button-primary" onClick={() => { window.location.href = '/app/automations/create' }}><Plus size={14} /> Create automation</button></div><div className="automation-summary">{[['Active workflows', '2'], ['Contacts in journeys', '2,046'], ['Avg. completion', '78.4%']].map(([label, value]) => <article key={label}><small>{label}</small><b>{value}</b><span><ArrowUpRight size={12} /> +12.4%</span></article>)}</div><section className="automation-templates"><div className="panel-heading"><div><h2>Start with a journey</h2><p>Choose a goal, then customize the steps for your audience.</p></div></div><div className="journey-template-grid">{[['Welcome series', 'Say hello when someone joins your audience.', '3 steps', 'W'], ['Trial onboarding', 'Help new users find value in your product.', '5 steps', 'T'], ['Win-back series', 'Reconnect with customers who have gone quiet.', '4 steps', 'R']].map(([name, text, steps, letter]) => <article key={name}><span className="journey-template-icon">{letter}</span><h3>{name}</h3><p>{text}</p><small>{steps} · customizable</small><button className="button button-secondary" onClick={() => { window.location.href = '/app/automations/create' }}>Use this journey <ArrowRight size={13} /></button></article>)}</div></section><div className="workflow-help"><Workflow size={17} /><span><b>Need more control?</b><small>Build custom journeys with triggers, branches, delays, and email actions.</small></span><button className="text-link" onClick={() => { window.location.href = '/app/automations/create' }}>Open workflow builder <ArrowRight size={13} /></button></div></> }

function InboundPage({ onAction }: { onAction: (message: string) => void }) { return <><div className="page-heading-row"><div><div className="page-eyebrow">TRANSACTIONAL EMAIL <span>/</span> INBOUND ROUTING</div><h1>Inbound email routing</h1><p>Route messages sent to your domain into an application or webhook.</p></div><button className="button button-primary" onClick={() => onAction('Inbound route setup opened.')}>Add route <Plus size={14} /></button></div><section className="inbound-route-card"><span className="inbound-route-icon"><Mail size={18} /></span><div><b>support@inbound.metrovps.com</b><small>Forward to https://api.metrovps.com/inbound · Created Nov 04, 2026</small></div><StatusBadge status="Active" /><button className="table-more" onClick={() => onAction('Inbound route actions opened.')}>•••</button></section><section className="inline-callout"><ShieldCheck size={17} /><div><b>Protect inbound messages</b><p>Validate signatures before processing inbound webhooks in your application.</p></div><Link href="/app/api-keys/docs">View webhook guide <ArrowRight size={14} /></Link></section></> }
function TemplatePage({ onAction }: { onAction: (message: string) => void }) { return <><div className="page-heading-row"><div><div className="page-eyebrow">TRANSACTIONAL EMAIL <span>/</span> TEMPLATES</div><h1>Transactional templates</h1><p>Manage reusable product messages with personalized data.</p></div><button className="button button-primary" onClick={() => { window.location.href = '/app/campaigns/create' }}><Plus size={14} /> Create template</button></div><div className="template-grid">{[['Order confirmation', 'order-confirmation', 'Updated 2 days ago', 'O'], ['Password reset', 'password-reset', 'Updated Nov 10, 2026', 'P'], ['Sign-in verification', 'sign-in-verification', 'Updated Nov 04, 2026', 'S'], ['Invoice ready', 'invoice-ready', 'Updated Oct 28, 2026', 'I']].map(([title, slug, updated, letter]) => <article className="template-card" key={slug}><div className="template-card-preview"><div className="mini-email-logo">{letter}</div><span /><i /><i /><b /><em /><small>MetroVPS</small></div><div className="template-card-details"><span><b>{title}</b><small>{slug} · {updated}</small></span><button onClick={() => { window.location.href = '/app/campaigns/create' }}>Edit <ArrowRight size={13} /></button></div></article>)}</div></> }
