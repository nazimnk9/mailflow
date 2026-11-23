'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Activity, Bell, Blocks, Braces, ChartNoAxesCombined, CheckCheck, ChevronDown, CircleHelp, ContactRound, CreditCard, Globe2, Inbox, Kanban, LayoutDashboard, LifeBuoy, ListFilter, LogOut, MailCheck, Menu, MessageSquare, PanelLeftClose, PanelLeftOpen, Plus, Route, Search, Send, Settings2, ShieldBan, Sliders, Smartphone, Sparkles, UserCircle2, Users, Webhook, Workflow, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BrandMark } from '@/components/brand-mark'
import { dashboardNav, type MockRow } from '@/lib/mock-data'
import { createContact, issueApiKey, verifySendingDomain } from '@/lib/services'
import { DashboardContent } from '@/components/dashboard-content'
import { authToken } from '@/lib/auth-token'

const iconMap: Record<string, React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>> = {
  LayoutDashboard,
  Send,
  ContactRound,
  Workflow,
  MailCheck,
  Globe2,
  Braces,
  ListFilter,
  ShieldBan,
  ChartNoAxesCombined,
  Blocks,
  CreditCard,
  Settings2,
  CircleHelp,
  Kanban,
  CheckCheck,
  Inbox,
  Smartphone,
  MessageSquare,
  Route,
  Sliders,
  Sparkles,
  Users,
  Webhook,
}
const actionSchema = z.object({ name: z.string().optional(), email: z.string().optional(), domain: z.string().optional(), message: z.string().optional() })
type ActionValues = z.infer<typeof actionSchema>
type DialogAction = 'contact' | 'key' | 'domain' | 'list' | 'form' | 'attribute' | 'ticket' | null

export function DashboardApp({ route }: { route: string }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [workspaceOpen, setWorkspaceOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [quickOpen, setQuickOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [dialog, setDialog] = useState<DialogAction>(null)
  const [notice, setNotice] = useState('')
  const [completed, setCompleted] = useState<string[]>(['profile'])
  const [customRows, setCustomRows] = useState<MockRow[]>([])
  const [dialogSuccess, setDialogSuccess] = useState(false)
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({})
  const toggleGroup = (label: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [label]: !prev[label],
    }))
  }
  const searchInputRef = useRef<HTMLInputElement>(null)
  const dialogRef = useRef<HTMLElement>(null)
  const mobileCloseRef = useRef<HTMLButtonElement>(null)
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
    const handleShortcut = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !dialog) {
        setWorkspaceOpen(false)
        setProfileOpen(false)
        setNotificationsOpen(false)
        setQuickOpen(false)
        setMobileOpen(false)
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handleShortcut)
    return () => document.removeEventListener('keydown', handleShortcut)
  }, [dialog])

  useEffect(() => {
    if (!mobileOpen) return
    const previousOverflow = document.body.style.overflow
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    document.body.style.overflow = 'hidden'
    const frame = window.requestAnimationFrame(() => mobileCloseRef.current?.focus())
    return () => {
      window.cancelAnimationFrame(frame)
      document.body.style.overflow = previousOverflow
      if (previousFocus?.isConnected) previousFocus.focus()
    }
  }, [mobileOpen])

  useEffect(() => {
    if (!dialog) return
    const previousOverflow = document.body.style.overflow
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const selector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    const getFocusable = () => Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(selector) ?? [])
    document.body.style.overflow = 'hidden'
    const frame = window.requestAnimationFrame(() => getFocusable()[0]?.focus())
    const handleDialogKeys = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setDialog(null)
        return
      }
      if (event.key !== 'Tab') return
      const focusable = getFocusable()
      const first = focusable[0]
      const last = focusable.at(-1)
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last?.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first?.focus()
      }
    }
    document.addEventListener('keydown', handleDialogKeys)
    return () => {
      window.cancelAnimationFrame(frame)
      document.removeEventListener('keydown', handleDialogKeys)
      document.body.style.overflow = previousOverflow
      if (previousFocus?.isConnected) previousFocus.focus()
    }
  }, [dialog, dialogSuccess])

  useEffect(() => {
    if (!notice) return
    const timeout = window.setTimeout(() => setNotice(''), 3200)
    return () => window.clearTimeout(timeout)
  }, [notice])

  const openAction = (action: DialogAction) => { setDialog(action); setDialogSuccess(false); setQuickOpen(false); reset({ name: '', email: '', domain: '', message: '' }) }
  const toggleChecklist = (id: string) => setCompleted((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  const addCustomRows = (rows: MockRow[]) => {
    const nextRows = [...rows, ...customRows]
    setCustomRows(nextRows)
    window.localStorage.setItem('metromail-demo-state', JSON.stringify({ completed, customRows: nextRows }))
  }
  const submitAction = handleSubmit(async (values) => {
    if (dialog === 'contact') {
      const parsed = z.object({ name: z.string().trim().min(2, 'Add at least 2 characters.'), email: z.string().trim().email('Enter a valid email address.') }).safeParse(values)
      if (!parsed.success) { parsed.error.issues.forEach((issue) => setError(issue.path[0] as keyof ActionValues, { message: issue.message })); return }
      const created = await createContact(parsed.data)
      setCustomRows((current) => [created, ...current])
      setNotice('Contact added to your demo audience.')
    }
    if (dialog === 'key') {
      const parsed = z.string().trim().min(2, 'Add at least 2 characters.').safeParse(values.name ?? '')
      if (!parsed.success) { setError('name', { message: parsed.error.message }); return }
      const created = await issueApiKey(parsed.data)
      setCustomRows((current) => [created, ...current])
      setNotice('API key created. It is masked by default.')
    }
    if (dialog === 'domain') {
      const parsed = z.string().trim().regex(/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i, 'Enter a valid domain name.').safeParse(values.domain ?? '')
      if (!parsed.success) { setError('domain', { message: parsed.error.message }); return }
      await verifySendingDomain(parsed.data)
      setNotice('Verification check queued for your demo domain.')
    }
    if (dialog === 'list' || dialog === 'form' || dialog === 'attribute') {
      const parsed = z.string().trim().min(2, 'Add at least 2 characters.').safeParse(values.name ?? '')
      if (!parsed.success) { setError('name', { message: parsed.error.message }); return }
      const created: MockRow = {
        name: parsed.data,
        detail: dialog === 'list' ? 'Marketing audience list · Demo data' : dialog === 'form' ? 'Signup form · Frontend demo' : 'Contact attribute · Frontend demo',
        status: dialog === 'form' ? 'Draft' : 'Active',
        metric: dialog === 'list' ? '0 contacts' : dialog === 'form' ? '0 submissions' : '0 values',
        date: new Date().toLocaleDateString(),
        kind: dialog === 'list' ? 'List' : dialog === 'form' ? 'Signup form' : 'Attribute',
      }
      setCustomRows((current) => [created, ...current])
      setNotice(`${created.name} created in your demo workspace.`)
    }
    if (dialog === 'ticket') {
      const parsed = z.object({ name: z.string().trim().min(2, 'Add your name.'), email: z.string().trim().email('Enter a valid email address.'), message: z.string().trim().min(10, 'Add at least 10 characters.').max(1000, 'Keep the message under 1,000 characters.') }).safeParse(values)
      if (!parsed.success) { parsed.error.issues.forEach((issue) => setError(issue.path[0] as keyof ActionValues, { message: issue.message })); return }
      setNotice('Support request submitted in demo mode. No message was sent.')
    }
    setDialogSuccess(true)
  })
  const runQuickAction = (action: DialogAction | 'campaign' | 'import') => {
    setQuickOpen(false)
    if (action === 'campaign') { window.location.href = '/app/campaigns/create'; return }
    if (action === 'import') { window.location.href = '/app/contacts/import'; return }
    if (action === 'key') { window.location.href = '/app/api-keys'; return }
    openAction(action)
  }
  const handleSignOut = async (e: React.MouseEvent) => {
    e.preventDefault()
    setProfileOpen(false)
    await authToken.remove()
    window.location.href = '/login'
  }

  const currentLabel = allItems.find((item) => normalizedPath === item.href || normalizedPath.startsWith(`${item.href}/`))?.label ?? 'Workspace'

  return <div className="dashboard-layout">
    {mobileOpen && <button className="mobile-sidebar-scrim" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
    <aside className={`dashboard-sidebar ${collapsed ? 'sidebar-collapsed' : ''} ${mobileOpen ? 'sidebar-mobile-open' : ''}`} aria-label="Workspace navigation">
      <div className="sidebar-brand-row">
        {!collapsed ? (
          <>
            <BrandMark compact />
            <button
              className="sidebar-collapse-button"
              aria-label="Collapse sidebar"
              title="Collapse sidebar"
              onClick={() => setCollapsed(true)}
            >
              <PanelLeftClose size={17} />
            </button>
          </>
        ) : (
          <button
            className="sidebar-collapse-button sidebar-expand-button"
            aria-label="Expand sidebar"
            title="Expand sidebar"
            onClick={() => setCollapsed(false)}
          >
            <PanelLeftOpen size={18} />
          </button>
        )}
        <button ref={mobileCloseRef} className="sidebar-mobile-close" aria-label="Close navigation" onClick={() => setMobileOpen(false)}>
          <X size={18} />
        </button>
      </div>
      <div className="workspace-switch-wrap">
        <button className="workspace-switch" onClick={() => setWorkspaceOpen(!workspaceOpen)} aria-expanded={workspaceOpen}><span className="workspace-avatar">M</span><span className="workspace-details"><b>MetroVPS</b><small>Growth workspace</small></span><ChevronDown className="workspace-chevron" size={14} /></button>{workspaceOpen && <div className="workspace-menu"><b>Workspaces</b><button onClick={() => { setWorkspaceOpen(false); setNotice('You are already in the MetroVPS demo workspace.') }}><span className="workspace-avatar">M</span><span>MetroVPS <small>Current workspace</small></span></button><button onClick={() => { setWorkspaceOpen(false); setNotice('Workspace switching will connect to your backend.') }}><Plus size={15} /> Create workspace</button></div>}</div>
      <div className="sidebar-scroll">
        {dashboardNav.map((group) => {
          const isGroupCollapsed = Boolean(collapsedGroups[group.label])
          const GroupIcon = group.icon ? (iconMap[group.icon] ?? Send) : null
          return (
            <div className="sidebar-group" key={group.label}>
              {!collapsed ? (
                <button
                  type="button"
                  className="sidebar-group-header-btn"
                  onClick={() => toggleGroup(group.label)}
                  aria-expanded={!isGroupCollapsed}
                  title={`${isGroupCollapsed ? 'Expand' : 'Collapse'} ${group.label}`}
                >
                  <span className="sidebar-group-header-left">
                    {GroupIcon && <GroupIcon size={16} className="sidebar-group-header-icon" />}
                    <span className="sidebar-group-label">{group.label}</span>
                  </span>
                  <ChevronDown
                    size={14}
                    className={`sidebar-group-chevron ${!isGroupCollapsed ? 'sidebar-group-chevron-open' : ''}`}
                  />
                </button>
              ) : (
                <div className="sidebar-group-label sidebar-group-label-mini" title={group.label}>
                  {GroupIcon && <GroupIcon size={16} />}
                </div>
              )}

              {(!isGroupCollapsed || collapsed) && (
                <div className="sidebar-group-items">
                  {group.items.map((item) => {
                    const Icon = iconMap[item.icon] ?? LayoutDashboard
                    const active = normalizedPath === item.href || normalizedPath.startsWith(`${item.href}/`)
                    return (
                      <Link
                        key={item.href}
                        className={`sidebar-link ${active ? 'sidebar-link-active' : ''}`}
                        href={item.href}
                        title={collapsed ? item.label : undefined}
                        aria-label={collapsed ? item.label : undefined}
                        aria-current={active ? 'page' : undefined}
                        onClick={() => setMobileOpen(false)}
                      >
                        <Icon size={17} strokeWidth={active ? 2.2 : 1.8} />
                        <span>{item.label}</span>
                        {item.label === 'Email logs' && <i className="sidebar-live-dot" />}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
      <div className="sidebar-bottom">
        {/* <div className="usage-mini"><div className="usage-mini-top"><span>Monthly usage</span><b>64%</b></div><div className="usage-track"><i /></div><small>32,000 of 50,000 emails</small><Link href="/app/billing">View usage <span>→</span></Link></div><Link className="sidebar-help-link" href="/app/support"><LifeBuoy size={16} /><span>Help & support</span><span className="help-shortcut">?</span></Link> */}
        <button className="sidebar-user" onClick={() => setProfileOpen(!profileOpen)}><span className="user-avatar">AM</span><span className="sidebar-user-name"><b>Alex Morgan</b><small>Owner</small></span><ChevronDown size={14} /></button></div>
    </aside>

    <div className={`dashboard-main ${collapsed ? 'dashboard-main-collapsed' : ''}`}>
      <header className="dashboard-topbar">
        <div className="topbar-left">
          {collapsed && (
            <button
              type="button"
              className="sidebar-expand-topbar-button"
              aria-label="Expand sidebar"
              title="Expand sidebar"
              onClick={() => setCollapsed(false)}
            >
              <PanelLeftOpen size={16} />
              <span>Expand sidebar</span>
            </button>
          )}
          <button className="mobile-menu-button" aria-label="Open navigation" onClick={() => setMobileOpen(true)}>
            <Menu size={19} />
          </button>
          <div className="breadcrumb">
            <span>MetroVPS</span><i>/</i><b>{currentLabel}</b>
          </div>
        </div><div className="topbar-actions"><div className="global-search"><Search size={16} /><input ref={searchInputRef} aria-label="Search pages and table data" aria-autocomplete="list" aria-expanded={searchFocused && Boolean(search.trim())} aria-controls={searchFocused && search.trim() ? 'workspace-search-results' : undefined} placeholder="Search anything..." value={search} onChange={(event) => setSearch(event.target.value)} onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)} /><kbd>⌘ K</kbd>{searchFocused && search.trim() && <div id="workspace-search-results" className="search-results" role="region" aria-label="Workspace page search results"><small>WORKSPACE PAGES</small>{searchResults.length ? searchResults.map((item) => <Link key={item.href} href={item.href} onClick={() => setSearch('')}><span>{item.label}</span><span>↗</span></Link>) : <p>No matching pages found.</p>}</div>}</div><button className="topbar-icon-button help-top-button" aria-label="Help center" onClick={() => { window.location.href = '/app/support' }}><CircleHelp size={17} /></button><div className="topbar-popover-wrap"><button className={`topbar-icon-button ${notificationsOpen ? 'topbar-icon-active' : ''}`} aria-label="Notifications" aria-expanded={notificationsOpen} onClick={() => setNotificationsOpen(!notificationsOpen)}><Bell size={17} /><i /></button>{notificationsOpen && <div className="topbar-popover notification-popover"><div><b>Notifications</b><button onClick={() => setNotificationsOpen(false)}>Mark all read</button></div><p><span className="notification-icon"><ShieldBan size={14} /></span><span><b>Domain needs attention</b><small>mg.metrovps.net is missing a DKIM record.</small><em>12 minutes ago</em></span></p><p><span className="notification-icon notification-blue"><Send size={14} /></span><span><b>Campaign delivered</b><small>November product notes reached 8,420 contacts.</small><em>2 hours ago</em></span></p><Link href="/app/logs" onClick={() => setNotificationsOpen(false)}>View all activity <span>→</span></Link></div>}</div><div className="topbar-popover-wrap"><button className="topbar-profile" onClick={() => setProfileOpen(!profileOpen)} aria-expanded={profileOpen}><span className="user-avatar">AM</span><ChevronDown size={13} /></button>{profileOpen && <div className="topbar-popover profile-popover"><b>Alex Morgan</b><small>alex@metrovps.com</small><Link href="/app/settings" onClick={() => setProfileOpen(false)}><UserCircle2 size={15} /> Account settings</Link><button type="button" className="profile-signout-btn" onClick={handleSignOut}><LogOut size={15} /> Sign out</button></div>}</div><Button className="topbar-create" aria-expanded={quickOpen} onClick={() => setQuickOpen(!quickOpen)}><Plus size={15} /> <span>Quick create</span><ChevronDown size={13} /></Button>{quickOpen && <div className="quick-create-menu"><small>CREATE NEW</small><button onClick={() => runQuickAction('campaign')}><Send size={15} /> Email campaign</button><button onClick={() => runQuickAction('contact')}><ContactRound size={15} /> Add a contact</button><button onClick={() => runQuickAction('key')}><Braces size={15} /> API key</button><button onClick={() => runQuickAction('domain')}><Globe2 size={15} /> Sending domain</button><button onClick={() => runQuickAction('import')}><Blocks size={15} /> Import contacts</button></div>}</div></header>
      <main className="dashboard-content-area"><DashboardContent route={routePath} search={search} setSearch={setSearch} onAction={(message) => setNotice(message)} onOpenAction={openAction} completed={completed} onToggleChecklist={toggleChecklist} customRows={customRows} onImportRows={addCustomRows} onCreateRows={addCustomRows} /></main>
      <footer className="dashboard-footer"><span>© 2026 MetroVPS · MetroMail frontend demo</span><span><span className="status-dot green-dot" /> All systems operational</span></footer>
    </div>
    {dialog && <div className="dialog-backdrop" role="presentation" onClick={(event) => { if (event.target === event.currentTarget) setDialog(null) }}><section ref={dialogRef} className="action-dialog" role="dialog" aria-modal="true" aria-labelledby="action-dialog-title"><button className="dialog-close" aria-label="Close dialog" onClick={() => setDialog(null)}><X size={18} /></button>{dialogSuccess ? <div className="dialog-success"><span><Sparkles size={21} /></span><h2 id="action-dialog-title">All set</h2><p>{dialog === 'domain' ? 'Your demo domain verification was queued.' : dialog === 'ticket' ? 'Your demo support request was submitted. No message was sent.' : 'Your demo workspace has been updated.'}</p><button className="button button-primary" onClick={() => setDialog(null)}>Done</button></div> : <><div className="dialog-icon">{dialog === 'key' ? <Braces size={19} /> : dialog === 'domain' ? <Globe2 size={19} /> : dialog === 'ticket' ? <LifeBuoy size={19} /> : <ContactRound size={19} />}</div><div className="eyebrow">DEMO WORKSPACE</div><h2 id="action-dialog-title">{dialog === 'contact' ? 'Add a contact' : dialog === 'key' ? 'Create an API key' : dialog === 'domain' ? 'Add a sending domain' : dialog === 'list' ? 'Create a contact list' : dialog === 'form' ? 'Create a signup form' : dialog === 'ticket' ? 'Create a support ticket' : 'Add a contact attribute'}</h2><p>{dialog === 'contact' ? 'Add a sample subscriber to your audience.' : dialog === 'key' ? 'Create a masked demo credential for your integration.' : dialog === 'domain' ? 'Start domain authentication and verification.' : dialog === 'list' ? 'Create a list to organize your audience.' : dialog === 'form' ? 'Create a reusable signup form for your website.' : dialog === 'ticket' ? 'Tell our team what you need help with.' : 'Add an attribute to describe your contacts.'}</p><form onSubmit={submitAction} className="dialog-form">{dialog === 'contact' && <><label>Name<input placeholder="Jordan Rivera" aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'dialog-name-error' : undefined} {...register('name')} />{errors.name && <small id="dialog-name-error" role="alert">{errors.name.message}</small>}</label><label>Email address<input type="email" placeholder="jordan@company.com" aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'dialog-email-error' : undefined} {...register('email')} />{errors.email && <small id="dialog-email-error" role="alert">{errors.email.message}</small>}</label></>}{(dialog === 'key' || dialog === 'list' || dialog === 'form' || dialog === 'attribute') && <label>{dialog === 'key' ? 'Key name' : dialog === 'list' ? 'List name' : dialog === 'form' ? 'Form name' : 'Attribute name'}<input placeholder={dialog === 'key' ? 'Production · Core API' : dialog === 'list' ? 'Product updates' : dialog === 'form' ? 'Newsletter signup' : 'Lifecycle stage'} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'dialog-name-error' : undefined} {...register('name')} />{errors.name && <small id="dialog-name-error" role="alert">{errors.name.message}</small>}</label>}{dialog === 'domain' && <label>Sending domain<input placeholder="mail.yourcompany.com" aria-invalid={Boolean(errors.domain)} aria-describedby={errors.domain ? 'dialog-domain-error' : undefined} {...register('domain')} />{errors.domain && <small id="dialog-domain-error" role="alert">{errors.domain.message}</small>}</label>}{dialog === 'ticket' && <><label>Your name<input placeholder="Alex Morgan" aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'dialog-name-error' : undefined} {...register('name')} />{errors.name && <small id="dialog-name-error" role="alert">{errors.name.message}</small>}</label><label>Email address<input type="email" placeholder="you@company.com" aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'dialog-email-error' : undefined} {...register('email')} />{errors.email && <small id="dialog-email-error" role="alert">{errors.email.message}</small>}</label><label>How can we help?<textarea rows={4} placeholder="Describe what you need help with…" aria-invalid={Boolean(errors.message)} aria-describedby={errors.message ? 'dialog-message-error' : undefined} {...register('message')} />{errors.message && <small id="dialog-message-error" role="alert">{errors.message.message}</small>}</label></>}<button type="submit" className="button button-primary dialog-submit" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : dialog === 'contact' ? 'Add contact' : dialog === 'key' ? 'Create key' : dialog === 'domain' ? 'Continue to DNS setup' : dialog === 'list' ? 'Create list' : dialog === 'form' ? 'Create form' : dialog === 'ticket' ? 'Submit ticket' : 'Add attribute'}</button><span className="dialog-demo-note">No data is sent to an external service.</span></form></>}</section></div>}
    {notice && <div className="toast-message" role="status"><span className="toast-check">✓</span>{notice}<button aria-label="Dismiss notification" onClick={() => setNotice('')}><X size={14} /></button></div>}
  </div>
}
