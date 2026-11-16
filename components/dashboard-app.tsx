'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Activity, Bell, Blocks, Braces, ChartNoAxesCombined, ChevronDown, CircleHelp, ContactRound, CreditCard, Globe2, LayoutDashboard, LifeBuoy, ListFilter, LogOut, MailCheck, Menu, PanelLeftClose, PanelLeftOpen, Plus, Search, Send, Settings2, ShieldBan, Sparkles, UserCircle2, Workflow, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BrandMark } from '@/components/brand-mark'
import { dashboardNav, type MockRow } from '@/lib/mock-data'
import { createContact, issueApiKey, verifySendingDomain } from '@/lib/services'
import { DashboardContent } from '@/components/dashboard-content'

const iconMap: Record<string, React.ComponentType<{ size?: number; strokeWidth?: number }>> = { LayoutDashboard, Send, ContactRound, Workflow, MailCheck, Globe2, Braces, ListFilter, ShieldBan, ChartNoAxesCombined, Blocks, CreditCard, Settings2, CircleHelp }
const actionSchema = z.object({ name: z.string().optional(), email: z.string().optional(), domain: z.string().optional() })
type ActionValues = z.infer<typeof actionSchema>
type DialogAction = 'contact' | 'key' | 'domain' | null

export function DashboardApp({ route }: { route: string }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [workspaceOpen, setWorkspaceOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [quickOpen, setQuickOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [dialog, setDialog] = useState<DialogAction>(null)
  const [notice, setNotice] = useState('')
  const [completed, setCompleted] = useState<string[]>(['profile'])
  const [customRows, setCustomRows] = useState<MockRow[]>([])
  const [dialogSuccess, setDialogSuccess] = useState(false)
  const { register, handleSubmit, reset, setError, formState: { errors, isSubmitting } } = useForm<ActionValues>({ resolver: zodResolver(actionSchema), defaultValues: { name: '', email: '', domain: '' } })
  const routePath = route || 'overview'
  const normalizedPath = `/app/${routePath}`
  const pageTitle = routePath.split('/').at(-1)?.replace(/-/g, ' ') ?? 'Overview'
  const allItems = useMemo(() => dashboardNav.flatMap((group) => group.items), [])
  const searchResults = search.trim() ? allItems.filter((item) => item.label.toLowerCase().includes(search.toLowerCase())) : []

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('metromail-demo-state')
      if (saved) {
        const parsed = JSON.parse(saved) as { completed?: string[]; customRows?: MockRow[] }
        if (parsed.completed) setCompleted(parsed.completed)
        if (parsed.customRows) setCustomRows(parsed.customRows)
      }
    } catch { /* Ignore invalid demo data and continue with the fresh state. */ }
  }, [])

  useEffect(() => {
    window.localStorage.setItem('metromail-demo-state', JSON.stringify({ completed, customRows }))
  }, [completed, customRows])

  useEffect(() => {
    if (!notice) return
    const timeout = window.setTimeout(() => setNotice(''), 3200)
    return () => window.clearTimeout(timeout)
  }, [notice])

  const openAction = (action: DialogAction) => { setDialog(action); setDialogSuccess(false); setQuickOpen(false); reset({ name: '', email: '', domain: '' }) }
  const toggleChecklist = (id: string) => setCompleted((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  const submitAction = handleSubmit(async (values) => {
    if (dialog === 'contact') {
      const parsed = z.object({ name: z.string().min(2, 'Add at least 2 characters.'), email: z.string().email('Enter a valid email address.') }).safeParse(values)
      if (!parsed.success) { parsed.error.issues.forEach((issue) => setError(issue.path[0] as keyof ActionValues, { message: issue.message })); return }
      const created = await createContact(parsed.data)
      setCustomRows((current) => [created, ...current])
      setNotice('Contact added to your demo audience.')
    }
    if (dialog === 'key') {
      const parsed = z.string().min(2, 'Add at least 2 characters.').safeParse(values.name ?? '')
      if (!parsed.success) { setError('name', { message: parsed.error.message }); return }
      const created = await issueApiKey(parsed.data)
      setCustomRows((current) => [created, ...current])
      setNotice('API key created. It is masked by default.')
    }
    if (dialog === 'domain') {
      const parsed = z.string().min(4, 'Enter a valid domain.').safeParse(values.domain ?? '')
      if (!parsed.success) { setError('domain', { message: parsed.error.message }); return }
      await verifySendingDomain(parsed.data)
      setNotice('Verification check queued for your demo domain.')
    }
    setDialogSuccess(true)
  })
  const runQuickAction = (action: DialogAction | 'campaign' | 'import') => {
    setQuickOpen(false)
    if (action === 'campaign') { window.location.href = '/app/campaigns/create'; return }
    if (action === 'import') { window.location.href = '/app/contacts/import'; return }
    openAction(action)
  }
  const currentLabel = allItems.find((item) => normalizedPath === item.href || normalizedPath.startsWith(`${item.href}/`))?.label ?? 'Workspace'

  return <div className="dashboard-layout">
    {mobileOpen && <button className="mobile-sidebar-scrim" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
    <aside className={`dashboard-sidebar ${collapsed ? 'sidebar-collapsed' : ''} ${mobileOpen ? 'sidebar-mobile-open' : ''}`}>
      <div className="sidebar-brand-row"><BrandMark compact /><button className="sidebar-collapse-button" aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} onClick={() => setCollapsed(!collapsed)}>{collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}</button><button className="sidebar-mobile-close" aria-label="Close navigation" onClick={() => setMobileOpen(false)}><X size={18} /></button></div>
      <div className="workspace-switch-wrap"><button className="workspace-switch" onClick={() => setWorkspaceOpen(!workspaceOpen)} aria-expanded={workspaceOpen}><span className="workspace-avatar">M</span><span className="workspace-details"><b>MetroVPS</b><small>Growth workspace</small></span><ChevronDown className="workspace-chevron" size={14} /></button>{workspaceOpen && <div className="workspace-menu"><b>Workspaces</b><button onClick={() => { setWorkspaceOpen(false); setNotice('You are already in the MetroVPS demo workspace.') }}><span className="workspace-avatar">M</span><span>MetroVPS <small>Current workspace</small></span></button><button onClick={() => { setWorkspaceOpen(false); setNotice('Workspace switching will connect to your backend.') }}><Plus size={15} /> Create workspace</button></div>}</div>
      <div className="sidebar-scroll">{dashboardNav.map((group) => <div className="sidebar-group" key={group.label}><div className="sidebar-group-label">{group.label}</div>{group.items.map((item) => { const Icon = iconMap[item.icon] ?? LayoutDashboard; const active = normalizedPath === item.href || normalizedPath.startsWith(`${item.href}/`); return <Link key={item.href} className={`sidebar-link ${active ? 'sidebar-link-active' : ''}`} href={item.href} title={collapsed ? item.label : undefined} onClick={() => setMobileOpen(false)}><Icon size={17} strokeWidth={active ? 2.2 : 1.8} /><span>{item.label}</span>{item.label === 'Email logs' && <i className="sidebar-live-dot" />}</Link> })}</div>)}</div>
      <div className="sidebar-bottom"><div className="usage-mini"><div className="usage-mini-top"><span>Monthly usage</span><b>64%</b></div><div className="usage-track"><i /></div><small>32,000 of 50,000 emails</small><Link href="/app/billing">View usage <span>→</span></Link></div><Link className="sidebar-help-link" href="/app/support"><LifeBuoy size={16} /><span>Help & support</span><span className="help-shortcut">?</span></Link><button className="sidebar-user" onClick={() => setProfileOpen(!profileOpen)}><span className="user-avatar">AM</span><span className="sidebar-user-name"><b>Alex Morgan</b><small>Owner</small></span><ChevronDown size={14} /></button></div>
    </aside>

    <div className={`dashboard-main ${collapsed ? 'dashboard-main-collapsed' : ''}`}>
      <header className="dashboard-topbar"><div className="topbar-left"><button className="mobile-menu-button" aria-label="Open navigation" onClick={() => setMobileOpen(true)}><Menu size={19} /></button><div className="breadcrumb"><span>MetroVPS</span><i>/</i><b>{currentLabel}</b></div></div><div className="topbar-actions"><div className="global-search"><Search size={16} /><input aria-label="Search workspace" placeholder="Search anything..." value={search} onChange={(event) => setSearch(event.target.value)} /><kbd>⌘ K</kbd>{search.trim() && <div className="search-results"><small>WORKSPACE PAGES</small>{searchResults.length ? searchResults.map((item) => <Link key={item.href} href={item.href} onClick={() => setSearch('')}><span>{item.label}</span><span>↗</span></Link>) : <p>No matching pages found.</p>}</div>}</div><button className="topbar-icon-button help-top-button" aria-label="Help center" onClick={() => { window.location.href = '/app/support' }}><CircleHelp size={17} /></button><div className="topbar-popover-wrap"><button className={`topbar-icon-button ${notificationsOpen ? 'topbar-icon-active' : ''}`} aria-label="Notifications" onClick={() => setNotificationsOpen(!notificationsOpen)}><Bell size={17} /><i /></button>{notificationsOpen && <div className="topbar-popover notification-popover"><div><b>Notifications</b><button onClick={() => setNotificationsOpen(false)}>Mark all read</button></div><p><span className="notification-icon"><ShieldBan size={14} /></span><span><b>Domain needs attention</b><small>mg.metrovps.net is missing a DKIM record.</small><em>12 minutes ago</em></span></p><p><span className="notification-icon notification-blue"><Send size={14} /></span><span><b>Campaign delivered</b><small>November product notes reached 8,420 contacts.</small><em>2 hours ago</em></span></p><Link href="/app/logs" onClick={() => setNotificationsOpen(false)}>View all activity <span>→</span></Link></div>}</div><div className="topbar-popover-wrap"><button className="topbar-profile" onClick={() => setProfileOpen(!profileOpen)} aria-expanded={profileOpen}><span className="user-avatar">AM</span><ChevronDown size={13} /></button>{profileOpen && <div className="topbar-popover profile-popover"><b>Alex Morgan</b><small>alex@metrovps.com</small><Link href="/app/settings" onClick={() => setProfileOpen(false)}><UserCircle2 size={15} /> Account settings</Link><Link href="/login" onClick={() => setProfileOpen(false)}><LogOut size={15} /> Sign out</Link></div>}</div><Button className="topbar-create" onClick={() => setQuickOpen(!quickOpen)}><Plus size={15} /> <span>Quick create</span><ChevronDown size={13} /></Button>{quickOpen && <div className="quick-create-menu"><small>CREATE NEW</small><button onClick={() => runQuickAction('campaign')}><Send size={15} /> Email campaign</button><button onClick={() => runQuickAction('contact')}><ContactRound size={15} /> Add a contact</button><button onClick={() => runQuickAction('key')}><Braces size={15} /> API key</button><button onClick={() => runQuickAction('domain')}><Globe2 size={15} /> Sending domain</button><button onClick={() => runQuickAction('import')}><Blocks size={15} /> Import contacts</button></div>}</div></header>
      <main className="dashboard-content-area"><DashboardContent route={routePath} search={search} onAction={(message) => setNotice(message)} onOpenAction={openAction} completed={completed} onToggleChecklist={toggleChecklist} customRows={customRows} /></main>
      <footer className="dashboard-footer"><span>© 2026 MetroVPS · MetroMail frontend demo</span><span><span className="status-dot green-dot" /> All systems operational</span></footer>
    </div>
    {dialog && <div className="dialog-backdrop" role="presentation" onClick={(event) => { if (event.target === event.currentTarget) setDialog(null) }}><section className="action-dialog" role="dialog" aria-modal="true" aria-labelledby="action-dialog-title"><button className="dialog-close" aria-label="Close dialog" onClick={() => setDialog(null)}><X size={18} /></button>{dialogSuccess ? <div className="dialog-success"><span><Sparkles size={21} /></span><h2 id="action-dialog-title">All set</h2><p>{dialog === 'domain' ? 'Your demo domain verification was queued.' : 'Your demo workspace has been updated.'}</p><button className="button button-primary" onClick={() => setDialog(null)}>Done</button></div> : <><div className="dialog-icon">{dialog === 'contact' ? <ContactRound size={19} /> : dialog === 'key' ? <Braces size={19} /> : <Globe2 size={19} />}</div><div className="eyebrow">DEMO WORKSPACE</div><h2 id="action-dialog-title">{dialog === 'contact' ? 'Add a contact' : dialog === 'key' ? 'Create an API key' : 'Add a sending domain'}</h2><p>{dialog === 'contact' ? 'Add a sample subscriber to your audience.' : dialog === 'key' ? 'Create a masked demo credential for your integration.' : 'Start domain authentication and verification.'}</p><form onSubmit={submitAction} className="dialog-form">{dialog === 'contact' && <><label>Name<input placeholder="Jordan Rivera" {...register('name')} />{errors.name && <small>{errors.name.message}</small>}</label><label>Email address<input type="email" placeholder="jordan@company.com" {...register('email')} />{errors.email && <small>{errors.email.message}</small>}</label></>}{dialog === 'key' && <label>Key name<input placeholder="Production · Core API" {...register('name')} />{errors.name && <small>{errors.name.message}</small>}</label>}{dialog === 'domain' && <label>Sending domain<input placeholder="mail.yourcompany.com" {...register('domain')} />{errors.domain && <small>{errors.domain.message}</small>}</label>}<button type="submit" className="button button-primary dialog-submit" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : dialog === 'contact' ? 'Add contact' : dialog === 'key' ? 'Create key' : 'Continue to DNS setup'}</button><span className="dialog-demo-note">No data is sent to an external service.</span></form></>}</section></div>}
    {notice && <div className="toast-message" role="status"><span className="toast-check">✓</span>{notice}<button aria-label="Dismiss notification" onClick={() => setNotice('')}><X size={14} /></button></div>}
  </div>
}
