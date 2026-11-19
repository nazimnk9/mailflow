'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  ShieldBan,
  Search,
  Plus,
  Trash2,
  ArrowDownToLine,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Mail,
  X,
  Copy,
  Check,
  ShieldCheck,
  UserX,
  AlertOctagon,
  ChevronDown,
} from 'lucide-react'
import { StatusBadge } from '@/components/status-badge'
import { TablePagination } from '@/components/table-pagination'

type SuppressionItem = {
  id: string
  email: string
  type: 'bounce' | 'unsubscribe' | 'complaint' | 'blocklist' | 'allowlist'
  reason: string
  code?: string
  domain: string
  createdAt: string
}

const INITIAL_SUPPRESSIONS: SuppressionItem[] = [
  {
    id: 'sup-1',
    email: 'invalid.user@nonexistent-domain-test.com',
    type: 'bounce',
    reason: '550 5.1.1 The email account that you tried to reach does not exist.',
    code: '5.1.1 (Hard Bounce)',
    domain: 'mail.metrovps.com',
    createdAt: 'Nov 18, 2026 09:42 AM',
  },
  {
    id: 'sup-2',
    email: 'sarah.connor@cyberdyne-systems.org',
    type: 'bounce',
    reason: '554 5.7.1 Relay access denied or recipient address rejected.',
    code: '5.7.1 (Hard Bounce)',
    domain: 'mail.metrovps.com',
    createdAt: 'Nov 17, 2026 04:15 PM',
  },
  {
    id: 'sup-3',
    email: 'jamie.park@northstar.io',
    type: 'unsubscribe',
    reason: 'Recipient clicked unsubscribe link in marketing newsletter.',
    code: 'List-Unsubscribe (One-Click)',
    domain: 'updates.metrovps.com',
    createdAt: 'Nov 16, 2026 02:20 PM',
  },
  {
    id: 'sup-4',
    email: 'robert.smith@acme-global.co',
    type: 'unsubscribe',
    reason: 'Unsubscribed via email preference center portal.',
    code: 'Preference Center Opt-Out',
    domain: 'updates.metrovps.com',
    createdAt: 'Nov 15, 2026 11:05 AM',
  },
  {
    id: 'sup-5',
    email: 'alex.hales@spam-reporter-network.com',
    type: 'complaint',
    reason: 'Recipient marked email as spam / junk via Yahoo Mail feedback loop.',
    code: 'FBL Complaint (Abuse Report)',
    domain: 'mail.metrovps.com',
    createdAt: 'Nov 14, 2026 08:30 PM',
  },
  {
    id: 'sup-6',
    email: 'suspicious-bot@disposable-temp-mail.net',
    type: 'blocklist',
    reason: 'Known disposable temporary mailbox provider flagged by hygiene filter.',
    code: 'System Blocklist Policy',
    domain: 'All domains',
    createdAt: 'Nov 12, 2026 01:10 PM',
  },
  {
    id: 'sup-7',
    email: 'vip-client@metrovps.com',
    type: 'allowlist',
    reason: 'Exempted from suppression checks by workspace administrator.',
    code: 'Administrative Whitelist',
    domain: 'All domains',
    createdAt: 'Nov 10, 2026 10:00 AM',
  },
]

type Props = {
  route: string
  onAction: (message: string) => void
}

export function SuppressionsPage({ route, onAction }: Props) {
  const [items, setItems] = useState<SuppressionItem[]>(INITIAL_SUPPRESSIONS)
  const [search, setSearch] = useState('')
  const [selectedDomain, setSelectedDomain] = useState('All domains')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Form state
  const [newEmail, setNewEmail] = useState('')
  const [newType, setNewType] = useState<SuppressionItem['type']>('bounce')
  const [newReason, setNewReason] = useState('')
  const [newDomain, setNewDomain] = useState('mail.metrovps.com')

  // Pagination state
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 6 })

  // Active sub-tab from route or default
  const activeTab = useMemo(() => {
    const parts = route.split('/')
    if (parts.length > 1 && parts[1]) {
      return parts[1] // 'bounces', 'unsubscribes', 'complaints', 'blocklist', 'allowlist'
    }
    return 'all'
  }, [route])

  const tabs: [string, string, string][] = [
    ['all', 'All Suppressions', 'suppressions'],
    ['bounces', 'Bounces', 'suppressions/bounces'],
    ['unsubscribes', 'Unsubscribes', 'suppressions/unsubscribes'],
    ['complaints', 'Complaints (FBL)', 'suppressions/complaints'],
    ['blocklist', 'Blocklist', 'suppressions/blocklist'],
    ['allowlist', 'Allowlist', 'suppressions/allowlist'],
  ]

  // Filter items based on activeTab, search, domain
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Tab filter
      if (activeTab === 'bounces' && item.type !== 'bounce') return false
      if (activeTab === 'unsubscribes' && item.type !== 'unsubscribe') return false
      if (activeTab === 'complaints' && item.type !== 'complaint') return false
      if (activeTab === 'blocklist' && item.type !== 'blocklist') return false
      if (activeTab === 'allowlist' && item.type !== 'allowlist') return false

      // Domain filter
      if (selectedDomain !== 'All domains' && item.domain !== selectedDomain && item.domain !== 'All domains') {
        return false
      }

      // Search filter
      if (search.trim()) {
        const query = search.toLowerCase()
        const matches =
          item.email.toLowerCase().includes(query) ||
          item.reason.toLowerCase().includes(query) ||
          (item.code && item.code.toLowerCase().includes(query)) ||
          item.domain.toLowerCase().includes(query)
        if (!matches) return false
      }

      return true
    })
  }, [items, activeTab, selectedDomain, search])

  // Paginated items
  const paginatedItems = useMemo(() => {
    const start = pagination.pageIndex * pagination.pageSize
    return filteredItems.slice(start, start + pagination.pageSize)
  }, [filteredItems, pagination])

  const handleAddSuppression = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEmail.trim() || !newEmail.includes('@')) {
      onAction('Please enter a valid email address.')
      return
    }

    const newItem: SuppressionItem = {
      id: `sup-${Date.now()}`,
      email: newEmail.trim().toLowerCase(),
      type: newType,
      reason: newReason.trim() || 'Manually added by administrator via Suppressions management.',
      code: newType === 'bounce' ? '5.1.1 (Manual Entry)' : newType === 'allowlist' ? 'Manual Whitelist' : 'Manual Policy',
      domain: newDomain,
      createdAt: 'Just now',
    }

    setItems((prev) => [newItem, ...prev])
    setIsAddModalOpen(false)
    setNewEmail('')
    setNewReason('')
    onAction(`Suppression added for ${newItem.email}`)
  }

  const handleDeleteItem = (id: string, email: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
    onAction(`Suppression removed for ${email}. Message delivery restored.`)
  }

  const handleCopyEmail = async (email: string, id: string) => {
    try {
      await navigator.clipboard.writeText(email)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
      onAction(`Copied ${email} to clipboard.`)
    } catch {
      onAction('Clipboard access unavailable.')
    }
  }

  const handleExportCsv = () => {
    const headers = ['Email', 'Type', 'Reason', 'Error Code', 'Domain', 'Date Added']
    const rows = filteredItems.map((item) => [
      `"${item.email}"`,
      `"${item.type}"`,
      `"${item.reason.replace(/"/g, '""')}"`,
      `"${item.code || ''}"`,
      `"${item.domain}"`,
      `"${item.createdAt}"`,
    ])
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `suppressions_${activeTab}_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    onAction('Suppressions exported as CSV.')
  }

  return (
    <>
      <div className="page-heading-row">
        <div>
          <div className="page-eyebrow">DELIVERABILITY <span>/</span> SUPPRESSIONS</div>
          <h1>Suppressions</h1>
          <p>Protect your sender reputation by preventing dispatches to bounced, unsubscribed, or complaining addresses.</p>
        </div>
        <div className="page-heading-actions">
          <button className="button button-secondary" onClick={handleExportCsv} disabled={filteredItems.length === 0}>
            <ArrowDownToLine size={14} /> Export CSV
          </button>
          <button className="button button-primary" onClick={() => setIsAddModalOpen(true)}>
            <Plus size={15} /> Add suppression
          </button>
        </div>
      </div>

      {/* Suppression Metrics Summary */}
      <section className="metrics-grid" style={{ marginBottom: 18 }}>
        <article className="metric-card">
          <div className="metric-card-head">
            <span>Hard Bounces</span>
            <span className="metric-icon metric-icon-0"><AlertTriangle size={15} /></span>
          </div>
          <div className="metric-number">
            {items.filter((i) => i.type === 'bounce').length}
          </div>
          <div className="metric-foot">
            <span style={{ color: '#64748b' }}>Recipient addresses not found</span>
          </div>
        </article>

        <article className="metric-card">
          <div className="metric-card-head">
            <span>Unsubscribes</span>
            <span className="metric-icon metric-icon-2"><UserX size={15} /></span>
          </div>
          <div className="metric-number">
            {items.filter((i) => i.type === 'unsubscribe').length}
          </div>
          <div className="metric-foot">
            <span style={{ color: '#64748b' }}>Opted-out contacts</span>
          </div>
        </article>

        <article className="metric-card">
          <div className="metric-card-head">
            <span>FBL Complaints</span>
            <span className="metric-icon metric-icon-3"><AlertOctagon size={15} /></span>
          </div>
          <div className="metric-number">
            {items.filter((i) => i.type === 'complaint').length}
          </div>
          <div className="metric-foot">
            <span style={{ color: '#64748b' }}>Spam button reports</span>
          </div>
        </article>

        <article className="metric-card">
          <div className="metric-card-head">
            <span>Allowlist Entries</span>
            <span className="metric-icon metric-icon-1"><ShieldCheck size={15} /></span>
          </div>
          <div className="metric-number">
            {items.filter((i) => i.type === 'allowlist').length}
          </div>
          <div className="metric-foot">
            <span style={{ color: '#15956d' }}>Exempt from suppression</span>
          </div>
        </article>
      </section>

      {/* Section Tabs */}
      <div className="section-tabs">
        {tabs.map(([key, label, href]) => {
          const isActive = (activeTab === 'all' && key === 'all') || activeTab === key
          return (
            <Link
              key={key}
              href={`/app/${href}`}
              className={isActive ? 'active' : ''}
            >
              {label}
            </Link>
          )
        })}
      </div>

      {/* Data Panel */}
      <section className="data-panel">
        <div className="data-panel-top">
          <div>
            <h2>
              {activeTab === 'all'
                ? 'All Suppressions'
                : activeTab === 'bounces'
                ? 'Bounced Email Addresses'
                : activeTab === 'unsubscribes'
                ? 'Unsubscribed Recipients'
                : activeTab === 'complaints'
                ? 'Spam Complaints (FBL)'
                : activeTab === 'blocklist'
                ? 'Blocklisted Addresses'
                : 'Allowlist (Whitelisted Addresses)'}
            </h2>
            <p>
              {filteredItems.length.toLocaleString()} {filteredItems.length === 1 ? 'address' : 'addresses'} currently suppressed
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="table-filter-bar">
          <label className="table-search-control">
            <Search size={15} aria-hidden="true" />
            <input
              aria-label="Search suppressions"
              placeholder="Search recipient email, error code, or reason…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button type="button" aria-label="Clear search" onClick={() => setSearch('')}>
                ×
              </button>
            )}
          </label>

          <div className="table-filter-controls">
            <label className="table-filter-control">
              <span>Domain</span>
              <select
                aria-label="Filter by sending domain"
                value={selectedDomain}
                onChange={(e) => setSelectedDomain(e.target.value)}
              >
                <option>All domains</option>
                <option>mail.metrovps.com</option>
                <option>updates.metrovps.com</option>
                <option>mg.metrovps.net</option>
              </select>
            </label>

            <button
              className="table-reset-button"
              type="button"
              disabled={!search && selectedDomain === 'All domains'}
              onClick={() => {
                setSearch('')
                setSelectedDomain('All domains')
              }}
            >
              Reset
            </button>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="desktop-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Recipient Email</th>
                <th>Type</th>
                <th>Error Code / Protocol</th>
                <th>Reason / Description</th>
                <th>Domain</th>
                <th>Date Suppressed</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="table-empty-state">
                    No matching suppression records found.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="table-name-cell" style={{ minWidth: 220 }}>
                        <span
                          className={`table-row-avatar ${
                            item.type === 'bounce'
                              ? 'avatar-suppression'
                              : item.type === 'allowlist'
                              ? 'avatar-domain'
                              : 'avatar-contact'
                          }`}
                        >
                          <ShieldBan size={15} />
                        </span>
                        <span>
                          <b style={{ fontFamily: 'ui-monospace, monospace', fontSize: 14 }}>{item.email}</b>
                        </span>
                      </div>
                    </td>
                    <td>
                      <StatusBadge
                        status={
                          item.type === 'bounce'
                            ? 'Bounced'
                            : item.type === 'unsubscribe'
                            ? 'Unsubscribed'
                            : item.type === 'complaint'
                            ? 'Complaint'
                            : item.type === 'allowlist'
                            ? 'Whitelisted'
                            : 'Blocklisted'
                        }
                      />
                    </td>
                    <td>
                      <code style={{ fontSize: 13, color: '#475569', background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>
                        {item.code || '—'}
                      </code>
                    </td>
                    <td style={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.reason}>
                      {item.reason}
                    </td>
                    <td>
                      <span style={{ fontSize: 13, color: '#64748b' }}>{item.domain}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: 13, color: '#64748b' }}>{item.createdAt}</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                        <button
                          type="button"
                          className="topbar-icon-button"
                          style={{ width: 28, height: 28 }}
                          title="Copy email address"
                          onClick={() => handleCopyEmail(item.email, item.id)}
                        >
                          {copiedId === item.id ? <Check size={14} color="#15956d" /> : <Copy size={14} />}
                        </button>
                        <button
                          type="button"
                          className="topbar-icon-button"
                          style={{ width: 28, height: 28, color: '#ef4444' }}
                          title="Remove from suppressions (restore sending)"
                          onClick={() => handleDeleteItem(item.id, item.email)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <TablePagination
          pageIndex={pagination.pageIndex}
          pageSize={pagination.pageSize}
          totalItems={filteredItems.length}
          onPageChange={(pageIndex) => setPagination((p) => ({ ...p, pageIndex }))}
          onPageSizeChange={(pageSize) => setPagination((p) => ({ ...p, pageSize, pageIndex: 0 }))}
        />
      </section>

      {/* Add Suppression Modal */}
      {isAddModalOpen && (
        <div className="dialog-backdrop" onClick={() => setIsAddModalOpen(false)}>
          <div
            className="dialog-card"
            style={{ maxWidth: 520 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dialog-head">
              <div>
                <h2>Add email to suppressions</h2>
                <p>Prevent future emails from being delivered to this address.</p>
              </div>
              <button
                type="button"
                className="dialog-close"
                onClick={() => setIsAddModalOpen(false)}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddSuppression} className="builder-fields" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <label>
                Recipient email address *
                <input
                  type="email"
                  required
                  placeholder="e.g. customer@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
              </label>

              <label>
                Suppression type *
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as SuppressionItem['type'])}
                >
                  <option value="bounce">Hard Bounce (Mailbox does not exist)</option>
                  <option value="unsubscribe">Unsubscribe (Marketing opt-out)</option>
                  <option value="complaint">Spam Complaint (FBL Abuse report)</option>
                  <option value="blocklist">Custom Blocklist</option>
                  <option value="allowlist">Allowlist (Exempt from suppressions)</option>
                </select>
              </label>

              <label>
                Applicable domain
                <select
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                >
                  <option value="All domains">All workspace domains</option>
                  <option value="mail.metrovps.com">mail.metrovps.com</option>
                  <option value="updates.metrovps.com">updates.metrovps.com</option>
                  <option value="mg.metrovps.net">mg.metrovps.net</option>
                </select>
              </label>

              <label>
                Reason / Internal notes (optional)
                <input
                  placeholder="e.g. Customer requested removal via support ticket #1204"
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                />
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="button button-primary">
                  <Check size={14} /> Add suppression
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
