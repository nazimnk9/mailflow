'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  AlertOctagon,
  AlertTriangle,
  Copy,
  Eye,
  Loader2,
  Mail,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  ShieldBan,
  Trash2,
  UserX,
  X,
} from 'lucide-react'
import { DataExportMenu } from '@/components/data-export-menu'
import {
  FloatingRowActionMenu,
  RowActionDivider,
  RowActionMenuItem,
} from '@/components/floating-row-action-menu'
import { StatusBadge } from '@/components/status-badge'
import { TablePagination } from '@/components/table-pagination'
import { formatApiErrorMessage } from '@/lib/api-client'
import type { SuppressionItem } from '@/lib/api/suppressions'
import {
  useAddSuppressionMutation,
  useDeleteSuppressionMutation,
  useSuppressionsQuery,
} from '@/lib/hooks/use-suppressions-query'

type Props = {
  route?: string
  onAction: (message: string) => void
}

function getReasonFromRoute(route?: string): string {
  if (!route) return 'all'
  const lower = route.toLowerCase()
  if (lower.includes('bounce')) return 'bounce'
  if (lower.includes('unsubscribe')) return 'unsubscribe'
  if (lower.includes('complaint')) return 'complaint'
  if (lower.includes('manual') || lower.includes('blocklist')) return 'manual'
  return 'all'
}

function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return '—'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateStr
  }
}

function getReasonBadgeStyle(reason: string): { bg: string; color: string; border: string; label: string } {
  const lower = (reason || 'manual').toLowerCase()
  if (lower === 'bounce') {
    return { bg: '#fef2f2', color: '#dc2626', border: '#fecaca', label: 'Bounce' }
  }
  if (lower === 'complaint') {
    return { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa', label: 'Complaint' }
  }
  if (lower === 'unsubscribe') {
    return { bg: '#fefce8', color: '#a16207', border: '#fef08a', label: 'Unsubscribe' }
  }
  return { bg: '#f1f5f9', color: '#334155', border: '#cbd5e1', label: 'Manual' }
}

export function SuppressionsPage({ route = 'suppressions', onAction }: Props) {
  // Server-side filter & pagination state
  const [reasonFilter, setReasonFilter] = useState<string>(() => getReasonFromRoute(route))
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  // Modals state
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [newNote, setNewNote] = useState('')
  const [addError, setAddError] = useState<string | null>(null)

  const [viewTarget, setViewTarget] = useState<SuppressionItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<SuppressionItem | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Floating 3-dots menu
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [menuAnchorRect, setMenuAnchorRect] = useState<DOMRect | null>(null)

  // Sync route changes
  useEffect(() => {
    setReasonFilter(getReasonFromRoute(route))
    setPage(1)
  }, [route])

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchInput.trim())
      setPage(1)
    }, 300)
    return () => clearTimeout(t)
  }, [searchInput])

  // Close floating menu on outside click / Escape
  useEffect(() => {
    if (!expandedId) return
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null
      if (!target) return
      if (target.closest('.row-action-menu') || target.closest('.row-action-trigger')) return
      setExpandedId(null)
      setMenuAnchorRect(null)
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setExpandedId(null)
        setMenuAnchorRect(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [expandedId])

  // Queries & Mutations
  const {
    data: suppressionsRes,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useSuppressionsQuery({
    page,
    page_size: pageSize,
    search: debouncedSearch || undefined,
    reason: reasonFilter !== 'all' ? reasonFilter : undefined,
  })

  const addMutation = useAddSuppressionMutation()
  const deleteMutation = useDeleteSuppressionMutation()

  const paginatedData = suppressionsRes?.data
  const items: SuppressionItem[] = useMemo(() => {
    if (Array.isArray(paginatedData?.items)) return paginatedData.items
    return []
  }, [paginatedData])

  const totalItems = typeof paginatedData?.total === 'number' ? paginatedData.total : items.length
  const totalPages = typeof paginatedData?.total_pages === 'number' ? paginatedData.total_pages : 1

  // Summary counts for current view
  const summaryCounts = useMemo(() => {
    let bounce = 0
    let unsubscribe = 0
    let complaint = 0
    let manual = 0
    items.forEach((item) => {
      const r = (item.reason || '').toLowerCase()
      if (r === 'bounce') bounce++
      else if (r === 'unsubscribe') unsubscribe++
      else if (r === 'complaint') complaint++
      else manual++
    })
    return { bounce, unsubscribe, complaint, manual }
  }, [items])

  // Export rows
  const exportRows = useMemo(() => {
    return items.map((item) => ({
      Email: item.email,
      Reason: item.reason,
      Note: item.note || '',
      'Created At': item.created_at,
    }))
  }, [items])

  const handleOpenAddModal = () => {
    setNewEmail('')
    setNewNote('')
    setAddError(null)
    setAddModalOpen(true)
  }

  const handleSubmitAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEmail.trim()) {
      setAddError('Email address is required.')
      return
    }

    setAddError(null)
    try {
      const res = await addMutation.mutateAsync({
        email: newEmail.trim(),
        note: newNote.trim() || undefined,
      })
      setAddModalOpen(false)
      onAction(res?.message || 'Address suppressed.')
    } catch (err: any) {
      setAddError(formatApiErrorMessage(err, 'Failed to suppress email address.'))
    }
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    setDeleteError(null)

    try {
      const res = await deleteMutation.mutateAsync(deleteTarget.id)
      const removedEmail = deleteTarget.email
      setDeleteTarget(null)
      onAction(res?.message || `“${removedEmail}” removed from the suppression list.`)
    } catch (err: any) {
      setDeleteError(formatApiErrorMessage(err, 'Failed to remove address from suppression list.'))
    }
  }

  const reasonTabs: Array<{ id: string; label: string }> = [
    { id: 'all', label: 'All Suppressions' },
    { id: 'bounce', label: 'Bounces' },
    { id: 'unsubscribe', label: 'Unsubscribes' },
    { id: 'complaint', label: 'Complaints' },
    { id: 'manual', label: 'Manual' },
  ]

  return (
    <>
      {/* Page Heading */}
      <div className="page-heading-row">
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="page-eyebrow">
            DELIVERABILITY <span>/</span> SUPPRESSION LIST
          </div>
          <h1>Suppression List</h1>
          <p>
            Protect sender reputation by automatically blocking hard bounces, spam complaints,
            opt-outs, and manually suppressed addresses.
          </p>
        </div>

        <div
          className="page-heading-actions"
          style={{ flexShrink: 0, flexWrap: 'nowrap', whiteSpace: 'nowrap', alignItems: 'center' }}
        >
          <button
            type="button"
            className="button button-secondary"
            style={{ whiteSpace: 'nowrap' }}
            onClick={() => {
              refetch()
              onAction('Suppression list refreshed.')
            }}
            disabled={isFetching}
          >
            <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
            <span>{isFetching ? 'Refreshing…' : 'Refresh'}</span>
          </button>

          <DataExportMenu rows={exportRows} fileName="metromail-suppressions" onAction={onAction} />

          <button
            type="button"
            className="button button-primary"
            style={{ whiteSpace: 'nowrap' }}
            onClick={handleOpenAddModal}
          >
            <Plus size={15} />
            <span>Suppress address</span>
          </button>
        </div>
      </div>

      {/* Metrics Strip */}
      <section className="transactional-metrics" style={{ marginBottom: '18px' }}>
        <article>
          <small>Total suppressed</small>
          <b>{totalItems.toLocaleString()}</b>
          <span>
            <ShieldBan size={13} /> Protected addresses
          </span>
        </article>
        <article>
          <small>Hard bounces</small>
          <b style={{ color: '#dc2626' }}>{summaryCounts.bounce.toLocaleString()}</b>
          <span style={{ color: '#dc2626' }}>
            <AlertTriangle size={13} /> Current page
          </span>
        </article>
        <article>
          <small>Opt-outs &amp; complaints</small>
          <b style={{ color: '#d97706' }}>
            {(summaryCounts.unsubscribe + summaryCounts.complaint).toLocaleString()}
          </b>
          <span style={{ color: '#d97706' }}>
            <AlertOctagon size={13} /> Unsubscribes &amp; FBL
          </span>
        </article>
        <article>
          <small>Manual blocks</small>
          <b style={{ color: '#334155' }}>{summaryCounts.manual.toLocaleString()}</b>
          <span style={{ color: '#64748b' }}>
            <UserX size={13} /> Added by team
          </span>
        </article>
      </section>

      {/* Reason Tabs */}
      <div className="section-tabs" style={{ marginBottom: '20px' }}>
        {reasonTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={reasonFilter === tab.id ? 'active' : ''}
            onClick={() => {
              setReasonFilter(tab.id)
              setPage(1)
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Error Alert */}
      {isError && (
        <div className="transactional-error-banner" style={{ marginBottom: '16px' }} role="alert">
          <AlertCircle size={18} />
          <div className="error-body">
            <strong>Failed to load suppression list:</strong>
            <p>{formatApiErrorMessage(error, 'Could not fetch suppressions from server.')}</p>
          </div>
          <button
            type="button"
            className="button button-secondary button-sm"
            onClick={() => refetch()}
          >
            Retry
          </button>
        </div>
      )}

      {/* Main Data Panel */}
      <section className="data-panel">
        <div className="data-panel-top">
          <div>
            <h2>Suppressed Email Addresses</h2>
            <p>
              {totalItems.toLocaleString()} {totalItems === 1 ? 'address' : 'addresses'} · Page{' '}
              {page} of {Math.max(1, totalPages)}
            </p>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="table-filter-bar">
          <label className="table-search-control">
            <Search size={15} aria-hidden="true" />
            <input
              aria-label="Search suppressed addresses"
              placeholder="Search by email or note…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            {searchInput && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setSearchInput('')}
              >
                ×
              </button>
            )}
          </label>

          <div className="table-filter-controls">
            <label className="table-filter-control">
              <span>Reason</span>
              <select
                aria-label="Filter by reason"
                value={reasonFilter}
                onChange={(e) => {
                  setReasonFilter(e.target.value)
                  setPage(1)
                }}
              >
                <option value="all">All reasons</option>
                <option value="bounce">Bounce</option>
                <option value="unsubscribe">Unsubscribe</option>
                <option value="complaint">Complaint</option>
                <option value="manual">Manual</option>
              </select>
            </label>

            <button
              type="button"
              className="table-reset-button"
              disabled={!searchInput && reasonFilter === 'all'}
              onClick={() => {
                setSearchInput('')
                setDebouncedSearch('')
                setReasonFilter('all')
                setPage(1)
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
                <th>Suppressed Address</th>
                <th>Reason</th>
                <th>Note / Diagnostic</th>
                <th>Suppressed At</th>
                <th style={{ textAlign: 'right', width: '60px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="table-empty-state" style={{ height: '140px' }}>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <Loader2 size={24} className="animate-spin" style={{ color: '#146ef5' }} />
                      <span>Loading suppression list…</span>
                    </div>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="table-empty-state">
                    {debouncedSearch || reasonFilter !== 'all'
                      ? 'No suppressed addresses match your search or filter.'
                      : 'Your suppression list is empty. Click "+ Suppress address" to block an address.'}
                  </td>
                </tr>
              ) : (
                items.map((item, idx) => {
                  const badge = getReasonBadgeStyle(item.reason)
                  const isExpanded = expandedId === item.id
                  const initial = (item.email?.[0] || 'S').toUpperCase()

                  return (
                    <tr
                      key={item.id || idx}
                      className={isExpanded ? 'row-action-active' : ''}
                      style={{
                        cursor: 'pointer',
                        position: 'relative',
                        zIndex: isExpanded ? 100 : 1,
                        backgroundColor: isExpanded ? '#f8fafc' : undefined,
                      }}
                      onClick={() => setViewTarget(item)}
                    >
                      <td>
                        <div className="table-name-cell">
                          <span
                            className="table-row-avatar"
                            style={{ backgroundColor: badge.bg, color: badge.color }}
                          >
                            {initial}
                          </span>
                          <span>
                            <b>{item.email}</b>
                            <small>Excluded from future sends</small>
                          </span>
                        </div>
                      </td>
                      <td>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '3px 9px',
                            borderRadius: '999px',
                            fontSize: '12px',
                            fontWeight: 650,
                            backgroundColor: badge.bg,
                            color: badge.color,
                            border: `1px solid ${badge.border}`,
                          }}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td style={{ maxWidth: '340px', color: '#475569', fontSize: '13px' }}>
                        <span
                          style={{
                            display: 'block',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                          title={item.note || ''}
                        >
                          {item.note || <span style={{ color: '#94a3b8' }}>No note provided</span>}
                        </span>
                      </td>
                      <td style={{ color: '#64748b', fontSize: '13px' }}>
                        {formatDateTime(item.created_at)}
                      </td>
                      <td
                        className="row-action-cell"
                        style={{ textAlign: 'right', position: 'relative' }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          className={`row-action-trigger ${isExpanded ? 'active' : ''}`}
                          aria-label={`Open actions for ${item.email}`}
                          aria-expanded={isExpanded}
                          onClick={(e) => {
                            e.stopPropagation()
                            const rect = e.currentTarget.getBoundingClientRect()
                            if (isExpanded) {
                              setExpandedId(null)
                              setMenuAnchorRect(null)
                            } else {
                              setExpandedId(item.id)
                              setMenuAnchorRect(rect)
                            }
                          }}
                        >
                          <MoreHorizontal size={16} />
                        </button>

                        <FloatingRowActionMenu
                          isOpen={isExpanded}
                          anchorRect={menuAnchorRect}
                          onClose={() => {
                            setExpandedId(null)
                            setMenuAnchorRect(null)
                          }}
                        >
                          <RowActionMenuItem
                            icon={Eye}
                            label="View details"
                            onClick={() => {
                              setViewTarget(item)
                              setExpandedId(null)
                              setMenuAnchorRect(null)
                            }}
                          />
                          <RowActionMenuItem
                            icon={Copy}
                            label="Copy email address"
                            onClick={() => {
                              navigator.clipboard.writeText(item.email)
                              onAction(`Copied ${item.email} to clipboard.`)
                              setExpandedId(null)
                              setMenuAnchorRect(null)
                            }}
                          />
                          <RowActionDivider />
                          <RowActionMenuItem
                            icon={Trash2}
                            label="Remove suppression"
                            isDanger
                            onClick={() => {
                              setDeleteError(null)
                              setDeleteTarget(item)
                              setExpandedId(null)
                              setMenuAnchorRect(null)
                            }}
                          />
                        </FloatingRowActionMenu>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Server-side Pagination */}
        <TablePagination
          pageIndex={page - 1}
          pageSize={pageSize}
          totalItems={totalItems}
          pageSizeOptions={[10, 20, 50]}
          onPageChange={(nextIndex) => setPage(nextIndex + 1)}
          onPageSizeChange={(nextSize) => {
            setPageSize(nextSize)
            setPage(1)
          }}
        />
      </section>

      {/* ================================================================ */}
      {/* MODAL 1: ADD SUPPRESSION (POST /api/suppressions/add-suppression)*/}
      {/* ================================================================ */}
      {addModalOpen && (
        <div
          className="dialog-backdrop"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget && !addMutation.isPending) {
              setAddModalOpen(false)
            }
          }}
        >
          <section
            className="action-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-suppression-title"
            style={{ width: 'min(480px, 100%)', position: 'relative' }}
          >
            <button
              type="button"
              className="dialog-close"
              aria-label="Close dialog"
              disabled={addMutation.isPending}
              onClick={() => setAddModalOpen(false)}
              style={{ top: '12px', right: '14px', zIndex: 10 }}
            >
              <X size={18} />
            </button>

            <div className="dialog-icon">
              <ShieldBan size={19} />
            </div>
            <div className="eyebrow">SUPPRESSION LIST</div>
            <h2 id="add-suppression-title">Suppress an email address</h2>
            <p>
              Manually add an address to prevent all future transactional and campaign deliveries to
              it.
            </p>

            {addError && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 12px',
                  marginBottom: '14px',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  color: '#b91c1c',
                  fontSize: '13px',
                }}
              >
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                <span>{addError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitAdd} className="dialog-form">
              <label>
                <span>
                  Email address <strong style={{ color: '#ef4444' }}>*</strong>
                </span>
                <input
                  type="email"
                  placeholder="stop@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  disabled={addMutation.isPending}
                  autoFocus
                  required
                />
              </label>

              <label>
                Reason note (optional)
                <textarea
                  rows={3}
                  placeholder="e.g. Asked to stop by phone"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  disabled={addMutation.isPending}
                />
              </label>

              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <button
                  type="button"
                  className="button button-secondary"
                  style={{ flex: 1 }}
                  disabled={addMutation.isPending}
                  onClick={() => setAddModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="button button-primary"
                  style={{ flex: 1 }}
                  disabled={addMutation.isPending}
                >
                  {addMutation.isPending ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Suppressing…</span>
                    </>
                  ) : (
                    <span>Suppress address</span>
                  )}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* ================================================================ */}
      {/* MODAL 2: SUPPRESSION DETAILS                                     */}
      {/* ================================================================ */}
      {viewTarget && (
        <div
          className="dialog-backdrop"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) setViewTarget(null)
          }}
        >
          <section
            className="action-dialog action-dialog-lg"
            role="dialog"
            aria-modal="true"
            aria-labelledby="suppression-details-title"
            style={{ width: 'min(500px, 100%)', position: 'relative' }}
          >
            <button
              type="button"
              className="dialog-close"
              aria-label="Close dialog"
              onClick={() => setViewTarget(null)}
              style={{ top: '12px', right: '14px', zIndex: 10 }}
            >
              <X size={18} />
            </button>

            <div className="dialog-icon">
              <Mail size={19} />
            </div>
            <div className="eyebrow">SUPPRESSION DETAILS</div>
            <h2 id="suppression-details-title">{viewTarget.email}</h2>
            <p>Address is currently blocked from receiving workspace emails.</p>

            <div className="modal-details-body">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '7px',
                }}
              >
                <span style={{ color: '#64748b' }}>Suppression ID</span>
                <code style={{ fontSize: '12px', color: '#0f172a', wordBreak: 'break-all' }}>
                  {viewTarget.id}
                </code>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '7px',
                }}
              >
                <span style={{ color: '#64748b' }}>Reason</span>
                <StatusBadge status={viewTarget.reason || 'manual'} />
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  padding: '8px 12px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '7px',
                }}
              >
                <span style={{ color: '#64748b' }}>Note / Diagnostic</span>
                <span style={{ fontSize: '13.5px', color: '#0f172a', lineHeight: 1.5 }}>
                  {viewTarget.note || 'No note provided'}
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '7px',
                }}
              >
                <span style={{ color: '#64748b' }}>Suppressed At</span>
                <span>{formatDateTime(viewTarget.created_at)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '9px', marginTop: '18px' }}>
              <button
                type="button"
                className="button button-secondary"
                style={{ flex: 1 }}
                onClick={() => setViewTarget(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="button button-primary"
                style={{
                  flex: 1,
                  backgroundColor: '#dc2626',
                  borderColor: '#dc2626',
                  color: '#fff',
                }}
                onClick={() => {
                  const target = viewTarget
                  setViewTarget(null)
                  setDeleteError(null)
                  setDeleteTarget(target)
                }}
              >
                <Trash2 size={14} />
                <span>Remove suppression</span>
              </button>
            </div>
          </section>
        </div>
      )}

      {/* ================================================================ */}
      {/* MODAL 3: REMOVE SUPPRESSION CONFIRMATION                         */}
      {/* ================================================================ */}
      {deleteTarget && (
        <div
          className="dialog-backdrop"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget && !deleteMutation.isPending) {
              setDeleteTarget(null)
            }
          }}
        >
          <section
            className="action-dialog action-dialog-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-suppression-title"
            style={{ width: 'min(420px, 100%)', position: 'relative' }}
          >
            <button
              type="button"
              className="dialog-close"
              aria-label="Close dialog"
              disabled={deleteMutation.isPending}
              onClick={() => setDeleteTarget(null)}
              style={{ top: '12px', right: '14px', zIndex: 10 }}
            >
              <X size={18} />
            </button>

            <div className="dialog-icon" style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}>
              <Trash2 size={19} />
            </div>
            <div className="eyebrow" style={{ color: '#dc2626' }}>
              REMOVE SUPPRESSION
            </div>
            <h2 id="delete-suppression-title">Remove from suppression list</h2>
            <p>
              Are you sure you want to remove <b>{deleteTarget.email}</b> from the suppression list?
              Future emails will be allowed to send to this address again.
            </p>

            {deleteError && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 12px',
                  marginTop: '12px',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  color: '#b91c1c',
                  fontSize: '13px',
                }}
              >
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                <span>{deleteError}</span>
              </div>
            )}

            <div style={{ display: 'flex', gap: '9px', marginTop: '18px' }}>
              <button
                type="button"
                className="button button-secondary"
                style={{ flex: 1 }}
                disabled={deleteMutation.isPending}
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="button button-primary"
                style={{
                  flex: 1,
                  backgroundColor: '#dc2626',
                  borderColor: '#dc2626',
                  color: '#fff',
                }}
                disabled={deleteMutation.isPending}
                onClick={handleConfirmDelete}
              >
                {deleteMutation.isPending ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Removing…</span>
                  </>
                ) : (
                  <span>Remove address</span>
                )}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  )
}
