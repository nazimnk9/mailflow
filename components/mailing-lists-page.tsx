'use client'

import { useState, useMemo } from 'react'
import {
  Users,
  Search,
  Plus,
  Trash2,
  Copy,
  Check,
  Mail,
  X,
  ExternalLink,
  Shield,
  UserPlus,
  ArrowRight,
  ChevronDown,
  Upload,
  Globe2,
} from 'lucide-react'
import { StatusBadge } from '@/components/status-badge'
import { TablePagination } from '@/components/table-pagination'
import { useDomainsQuery } from '@/lib/hooks/use-domains-query'

type MailingList = {
  id: string
  address: string
  name: string
  description: string
  accessLevel: 'Everyone' | 'Members only' | 'Read only'
  memberCount: number
  domain: string
  createdAt: string
}

type ListMember = {
  id: string
  address: string
  name: string
  subscribed: boolean
  vars?: Record<string, string>
  createdAt: string
}

const INITIAL_LISTS: MailingList[] = [
  {
    id: 'list-1',
    address: 'newsletter@mail.metrovps.com',
    name: 'Weekly Developer Dispatch',
    description: 'Weekly tech updates, release changelogs, and tips sent to opted-in subscribers.',
    accessLevel: 'Read only',
    memberCount: 4820,
    domain: 'mail.metrovps.com',
    createdAt: 'Oct 24, 2026',
  },
  {
    id: 'list-2',
    address: 'announcements@updates.metrovps.com',
    name: 'Product Announcements',
    description: 'Major release broadcasts and critical service alerts for customers.',
    accessLevel: 'Read only',
    memberCount: 12450,
    domain: 'updates.metrovps.com',
    createdAt: 'Nov 02, 2026',
  },
  {
    id: 'list-3',
    address: 'community-chat@mail.metrovps.com',
    name: 'Community Open Forum',
    description: 'Discussion list where any member can send and receive peer messages.',
    accessLevel: 'Members only',
    memberCount: 380,
    domain: 'mail.metrovps.com',
    createdAt: 'Nov 10, 2026',
  },
]

const INITIAL_MEMBERS: Record<string, ListMember[]> = {
  'list-1': [
    { id: 'mem-1', address: 'alex.morgan@metrovps.com', name: 'Alex Morgan', subscribed: true, vars: { role: 'Lead Architect', tier: 'Enterprise' }, createdAt: 'Nov 12, 2026' },
    { id: 'mem-2', address: 'avery.chen@northstar.io', name: 'Avery Chen', subscribed: true, vars: { company: 'Northstar' }, createdAt: 'Nov 14, 2026' },
    { id: 'mem-3', address: 'jordan.rivera@studiojuniper.co', name: 'Jordan Rivera', subscribed: true, vars: { tier: 'Pro' }, createdAt: 'Nov 15, 2026' },
    { id: 'mem-4', address: 'jamie.park@hey.com', name: 'Jamie Park', subscribed: false, vars: {}, createdAt: 'Nov 16, 2026' },
  ],
}

type Props = {
  onAction: (message: string) => void
}

export function MailingListsPage({ onAction }: Props) {
  const { data: domainsResponse } = useDomainsQuery()
  const liveDomains = domainsResponse?.data ?? []
  const availableDomains = liveDomains.length > 0 ? liveDomains.map((d) => d.name) : ['mail.metrovps.com', 'updates.metrovps.com', 'mg.metrovps.net']

  const [lists, setLists] = useState<MailingList[]>(INITIAL_LISTS)
  const [membersMap, setMembersMap] = useState<Record<string, ListMember[]>>(INITIAL_MEMBERS)
  const [search, setSearch] = useState('')
  const [selectedDomain, setSelectedDomain] = useState('All domains')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Create list modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newAlias, setNewAlias] = useState('')
  const [newDomain, setNewDomain] = useState(availableDomains[0] || 'mail.metrovps.com')
  const [newName, setNewName] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newAccessLevel, setNewAccessLevel] = useState<'Everyone' | 'Members only' | 'Read only'>('Read only')

  // Members drawer state
  const [activeListForMembers, setActiveListForMembers] = useState<MailingList | null>(null)
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false)
  const [memberEmail, setMemberEmail] = useState('')
  const [memberName, setMemberName] = useState('')
  const [memberSubscribed, setMemberSubscribed] = useState(true)

  // Pagination state
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 6 })

  // Filtered lists
  const filteredLists = useMemo(() => {
    return lists.filter((item) => {
      if (selectedDomain !== 'All domains' && item.domain !== selectedDomain) return false
      if (search.trim()) {
        const query = search.toLowerCase()
        return item.address.toLowerCase().includes(query) || item.name.toLowerCase().includes(query) || item.description.toLowerCase().includes(query)
      }
      return true
    })
  }, [lists, selectedDomain, search])

  const paginatedLists = useMemo(() => {
    const start = pagination.pageIndex * pagination.pageSize
    return filteredLists.slice(start, start + pagination.pageSize)
  }, [filteredLists, pagination])

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
      onAction(`Copied ${text} to clipboard.`)
    } catch {
      onAction('Clipboard access unavailable.')
    }
  }

  const handleCreateList = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newAlias.trim()) {
      onAction('Please enter a list email alias prefix.')
      return
    }

    const cleanAlias = newAlias.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '')
    const fullAddress = `${cleanAlias}@${newDomain}`

    const newList: MailingList = {
      id: `list-${Date.now()}`,
      address: fullAddress,
      name: newName.trim() || cleanAlias,
      description: newDescription.trim() || 'Custom mailing distribution list.',
      accessLevel: newAccessLevel,
      memberCount: 0,
      domain: newDomain,
      createdAt: 'Just now',
    }

    setLists((prev) => [newList, ...prev])
    setMembersMap((prev) => ({ ...prev, [newList.id]: [] }))
    setIsCreateOpen(false)
    setNewAlias('')
    setNewName('')
    setNewDescription('')
    onAction(`Mailing list ${fullAddress} created successfully.`)
  }

  const handleDeleteList = (id: string, address: string) => {
    setLists((prev) => prev.filter((l) => l.id !== id))
    if (activeListForMembers?.id === id) {
      setActiveListForMembers(null)
    }
    onAction(`Mailing list ${address} deleted.`)
  }

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeListForMembers || !memberEmail.trim() || !memberEmail.includes('@')) {
      onAction('Please enter a valid member email address.')
      return
    }

    const newMember: ListMember = {
      id: `mem-${Date.now()}`,
      address: memberEmail.trim().toLowerCase(),
      name: memberName.trim() || memberEmail.split('@')[0],
      subscribed: memberSubscribed,
      createdAt: 'Just now',
    }

    setMembersMap((prev) => ({
      ...prev,
      [activeListForMembers.id]: [newMember, ...(prev[activeListForMembers.id] || [])],
    }))

    // Increment count
    setLists((prev) =>
      prev.map((l) =>
        l.id === activeListForMembers.id ? { ...l, memberCount: l.memberCount + 1 } : l
      )
    )

    setIsAddMemberOpen(false)
    setMemberEmail('')
    setMemberName('')
    onAction(`Added ${newMember.address} to ${activeListForMembers.name}.`)
  }

  const handleDeleteMember = (memberId: string, email: string) => {
    if (!activeListForMembers) return
    setMembersMap((prev) => ({
      ...prev,
      [activeListForMembers.id]: (prev[activeListForMembers.id] || []).filter((m) => m.id !== memberId),
    }))
    setLists((prev) =>
      prev.map((l) =>
        l.id === activeListForMembers.id ? { ...l, memberCount: Math.max(0, l.memberCount - 1) } : l
      )
    )
    onAction(`Removed ${email} from ${activeListForMembers.name}.`)
  }

  const currentMembers = activeListForMembers ? membersMap[activeListForMembers.id] || [] : []

  return (
    <>
      <div className="page-heading-row">
        <div>
          <div className="page-eyebrow">DELIVERABILITY <span>/</span> MAILING LISTS</div>
          <h1>Mailing lists</h1>
          <p>Create and manage email distribution lists with custom member access policies and variables.</p>
        </div>
        <div className="page-heading-actions">
          <button className="button button-primary" onClick={() => setIsCreateOpen(true)}>
            <Plus size={15} /> Create mailing list
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <section className="metrics-grid" style={{ marginBottom: 18 }}>
        <article className="metric-card">
          <div className="metric-card-head">
            <span>Total Lists</span>
            <span className="metric-icon metric-icon-0"><Users size={15} /></span>
          </div>
          <div className="metric-number">{lists.length}</div>
          <div className="metric-foot"><span>Distribution groups</span></div>
        </article>

        <article className="metric-card">
          <div className="metric-card-head">
            <span>Total Members</span>
            <span className="metric-icon metric-icon-1"><UserPlus size={15} /></span>
          </div>
          <div className="metric-number">
            {lists.reduce((acc, l) => acc + l.memberCount, 0).toLocaleString()}
          </div>
          <div className="metric-foot"><span>Across all lists</span></div>
        </article>

        <article className="metric-card">
          <div className="metric-card-head">
            <span>Access Policies</span>
            <span className="metric-icon metric-icon-2"><Shield size={15} /></span>
          </div>
          <div className="metric-number">
            {lists.filter((l) => l.accessLevel === 'Read only').length} Read-only
          </div>
          <div className="metric-foot"><span>Admin broadcast enforced</span></div>
        </article>

        <article className="metric-card">
          <div className="metric-card-head">
            <span>Active Domains</span>
            <span className="metric-icon metric-icon-3"><Globe2 size={15} /></span>
          </div>
          <div className="metric-number">{availableDomains.length}</div>
          <div className="metric-foot"><span>Configured sending domains</span></div>
        </article>
      </section>

      {/* Main Lists Panel */}
      <section className="data-panel">
        <div className="data-panel-top">
          <div>
            <h2>Mailing Distribution Lists</h2>
            <p>{filteredLists.length.toLocaleString()} {filteredLists.length === 1 ? 'list' : 'lists'} in current view</p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="table-filter-bar">
          <label className="table-search-control">
            <Search size={15} aria-hidden="true" />
            <input
              aria-label="Search mailing lists"
              placeholder="Search by address, name, or description…"
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
                aria-label="Filter by domain"
                value={selectedDomain}
                onChange={(e) => setSelectedDomain(e.target.value)}
              >
                <option>All domains</option>
                {availableDomains.map((d) => (
                  <option key={d}>{d}</option>
                ))}
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

        {/* Lists Table */}
        <div className="desktop-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>List Address</th>
                <th>List Name</th>
                <th>Access Policy</th>
                <th>Members</th>
                <th>Description</th>
                <th>Created</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedLists.length === 0 ? (
                <tr>
                  <td colSpan={7} className="table-empty-state">
                    No mailing lists found. Create your first mailing list above.
                  </td>
                </tr>
              ) : (
                paginatedLists.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="table-name-cell" style={{ minWidth: 240 }}>
                        <span className="table-row-avatar avatar-contact">
                          <Mail size={15} />
                        </span>
                        <span>
                          <b style={{ fontFamily: 'ui-monospace, monospace', fontSize: 14 }}>{item.address}</b>
                          <small>{item.domain}</small>
                        </span>
                      </div>
                    </td>
                    <td>
                      <b style={{ color: '#1e293b', fontSize: 14 }}>{item.name}</b>
                    </td>
                    <td>
                      <StatusBadge
                        status={
                          item.accessLevel === 'Read only'
                            ? 'Active'
                            : item.accessLevel === 'Members only'
                            ? 'Delivered'
                            : 'Pending'
                        }
                      />
                      <small style={{ marginLeft: 6, color: '#64748b', fontSize: 12 }}>
                        {item.accessLevel}
                      </small>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: '#0f172a' }}>
                        {item.memberCount.toLocaleString()}
                      </span>
                    </td>
                    <td style={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.description}>
                      {item.description}
                    </td>
                    <td>
                      <span style={{ color: '#64748b', fontSize: 13 }}>{item.createdAt}</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                        <button
                          type="button"
                          className="button button-secondary"
                          style={{ minHeight: 28, padding: '0 10px', fontSize: 13 }}
                          onClick={() => setActiveListForMembers(item)}
                        >
                          <Users size={13} /> Members
                        </button>
                        <button
                          type="button"
                          className="topbar-icon-button"
                          style={{ width: 28, height: 28 }}
                          title="Copy list address"
                          onClick={() => handleCopy(item.address, item.id)}
                        >
                          {copiedId === item.id ? <Check size={14} color="#15956d" /> : <Copy size={14} />}
                        </button>
                        <button
                          type="button"
                          className="topbar-icon-button"
                          style={{ width: 28, height: 28, color: '#ef4444' }}
                          title="Delete mailing list"
                          onClick={() => handleDeleteList(item.id, item.address)}
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
          totalItems={filteredLists.length}
          onPageChange={(pageIndex) => setPagination((p) => ({ ...p, pageIndex }))}
          onPageSizeChange={(pageSize) => setPagination((p) => ({ ...p, pageSize, pageIndex: 0 }))}
        />
      </section>

      {/* Create Mailing List Modal */}
      {isCreateOpen && (
        <div className="dialog-backdrop" onClick={() => setIsCreateOpen(false)}>
          <div className="dialog-card" style={{ maxWidth: 540 }} onClick={(e) => e.stopPropagation()}>
            <div className="dialog-head">
              <div>
                <h2>Create new mailing list</h2>
                <p>Set up an email address that automatically fans out to subscribed recipients.</p>
              </div>
              <button type="button" className="dialog-close" onClick={() => setIsCreateOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateList} className="builder-fields" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <label>
                List email address *
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input
                    type="text"
                    required
                    placeholder="e.g. dev-team or newsletter"
                    value={newAlias}
                    onChange={(e) => setNewAlias(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <span style={{ fontWeight: 700, color: '#64748b' }}>@</span>
                  <select
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    style={{ width: 210 }}
                  >
                    {availableDomains.map((d) => (
                      <option key={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </label>

              <label>
                List name *
                <input
                  type="text"
                  required
                  placeholder="e.g. Engineering Updates"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </label>

              <label>
                Description
                <input
                  type="text"
                  placeholder="Brief summary of who receives these emails"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                />
              </label>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 650, color: '#475569' }}>Access policy (Who can post):</span>
                <label style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="accessLevel"
                    checked={newAccessLevel === 'Read only'}
                    onChange={() => setNewAccessLevel('Read only')}
                    style={{ marginTop: 3 }}
                  />
                  <div>
                    <b style={{ color: '#1e293b', fontSize: 14 }}>Read Only (Recommended for newsletters)</b>
                    <p style={{ margin: '2px 0 0', fontSize: 12.5, color: '#64748b' }}>Only authenticated API keys and workspace admins can send messages to this list.</p>
                  </div>
                </label>

                <label style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="accessLevel"
                    checked={newAccessLevel === 'Members only'}
                    onChange={() => setNewAccessLevel('Members only')}
                    style={{ marginTop: 3 }}
                  />
                  <div>
                    <b style={{ color: '#1e293b', fontSize: 14 }}>Members Only (Discussion group)</b>
                    <p style={{ margin: '2px 0 0', fontSize: 12.5, color: '#64748b' }}>Only confirmed members of this list can send messages to everyone.</p>
                  </div>
                </label>

                <label style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="accessLevel"
                    checked={newAccessLevel === 'Everyone'}
                    onChange={() => setNewAccessLevel('Everyone')}
                    style={{ marginTop: 3 }}
                  />
                  <div>
                    <b style={{ color: '#1e293b', fontSize: 14 }}>Everyone (Public list)</b>
                    <p style={{ margin: '2px 0 0', fontSize: 12.5, color: '#64748b' }}>Anyone on the internet can send messages to this list.</p>
                  </div>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                <button type="button" className="button button-secondary" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="button button-primary">
                  <Check size={14} /> Create list
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Members Management Modal/Drawer */}
      {activeListForMembers && (
        <div className="dialog-backdrop" onClick={() => setActiveListForMembers(null)}>
          <div className="dialog-card" style={{ maxWidth: 720 }} onClick={(e) => e.stopPropagation()}>
            <div className="dialog-head">
              <div>
                <h2>Members: {activeListForMembers.name}</h2>
                <p style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13 }}>
                  {activeListForMembers.address} · {currentMembers.length} active members
                </p>
              </div>
              <button type="button" className="dialog-close" onClick={() => setActiveListForMembers(null)}>
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <span style={{ fontSize: 13, color: '#64748b' }}>
                Recipients subscribed to receive dispatches from this list.
              </span>
              <button
                type="button"
                className="button button-primary"
                style={{ minHeight: 32 }}
                onClick={() => setIsAddMemberOpen(true)}
              >
                <Plus size={14} /> Add member
              </button>
            </div>

            {/* Members table */}
            <div style={{ maxHeight: 360, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 8 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Name</th>
                    <th>Status</th>
                    <th>Added</th>
                    <th style={{ textAlign: 'right' }}>Remove</th>
                  </tr>
                </thead>
                <tbody>
                  {currentMembers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="table-empty-state" style={{ height: 100 }}>
                        No members in this list yet. Click &quot;Add member&quot; to subscribe someone.
                      </td>
                    </tr>
                  ) : (
                    currentMembers.map((m) => (
                      <tr key={m.id}>
                        <td>
                          <b style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13.5 }}>{m.address}</b>
                        </td>
                        <td>{m.name}</td>
                        <td>
                          <StatusBadge status={m.subscribed ? 'Active' : 'Unsubscribed'} />
                        </td>
                        <td>
                          <small style={{ color: '#64748b' }}>{m.createdAt}</small>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className="topbar-icon-button"
                            style={{ width: 26, height: 26, color: '#ef4444' }}
                            title="Remove member"
                            onClick={() => handleDeleteMember(m.id, m.address)}
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <button type="button" className="button button-secondary" onClick={() => setActiveListForMembers(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Single Member Modal */}
      {isAddMemberOpen && (
        <div className="dialog-backdrop" onClick={() => setIsAddMemberOpen(false)} style={{ zIndex: 60 }}>
          <div className="dialog-card" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
            <div className="dialog-head">
              <div>
                <h2>Add list member</h2>
                <p>Add an email address to {activeListForMembers?.name}</p>
              </div>
              <button type="button" className="dialog-close" onClick={() => setIsAddMemberOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddMember} className="builder-fields" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label>
                Member email address *
                <input
                  type="email"
                  required
                  placeholder="e.g. member@company.com"
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                />
              </label>

              <label>
                Member full name
                <input
                  type="text"
                  placeholder="e.g. Jordan Rivera"
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={memberSubscribed}
                  onChange={(e) => setMemberSubscribed(e.target.checked)}
                />
                <span style={{ fontSize: 13.5, color: '#334155' }}>Subscribed (Receive incoming messages)</span>
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
                <button type="button" className="button button-secondary" onClick={() => setIsAddMemberOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="button button-primary">
                  <Check size={14} /> Add member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
