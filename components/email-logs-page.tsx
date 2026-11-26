'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Copy,
  Eye,
  Mail,
  MoreHorizontal,
  RefreshCw,
  Search,
  Send,
  XCircle,
  AlertCircle,
  Loader2,
  Paperclip,
} from 'lucide-react'
import { FloatingRowActionMenu, RowActionMenuItem, RowActionDivider } from '@/components/floating-row-action-menu'
import { StatusBadge } from '@/components/status-badge'
import { TablePagination } from '@/components/table-pagination'
import {
  AttachmentPreviewModal,
  type PreviewableAttachment,
} from '@/components/attachment-preview-modal'
import { useMailsQuery } from '@/lib/hooks/use-mails-query'
import type { MailItem, MailsPaginatedData } from '@/lib/api/mails'
import { formatApiErrorMessage } from '@/lib/api-client'
import { ensureArray } from '@/lib/utils'

export function EmailLogsPage({
  route,
  onAction,
}: {
  route: string
  onAction: (message: string) => void
}) {
  // Current tab from route
  const subRoute = route.replace(/^(transactional\/)?logs\/?/, '').toLowerCase()

  // Filter states
  const [search, setSearch] = useState('')
  const [selectedNode, setSelectedNode] = useState('All nodes')
  const [selectedStatus, setSelectedStatus] = useState(() => {
    if (subRoute === 'delivered') return 'delivered'
    if (subRoute === 'pending') return 'pending'
    if (subRoute === 'failed') return 'failed'
    return 'All statuses'
  })

  // Attachment Preview Modal state
  const [previewModalOpen, setPreviewModalOpen] = useState(false)
  const [previewAttachments, setPreviewAttachments] = useState<PreviewableAttachment[]>([])
  const [previewInitialIndex, setPreviewInitialIndex] = useState(0)
  const [previewTitle, setPreviewTitle] = useState('')

  // Floating 3-dots row action menu state
  const [expandedMailId, setExpandedMailId] = useState<string | null>(null)
  const [menuAnchorRect, setMenuAnchorRect] = useState<DOMRect | null>(null)

  useEffect(() => {
    if (!expandedMailId) return
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null
      if (!target) return
      if (target.closest('.row-action-menu') || target.closest('.row-action-trigger')) return
      setExpandedMailId(null)
      setMenuAnchorRect(null)
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setExpandedMailId(null)
        setMenuAnchorRect(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [expandedMailId])

  const openPreview = (attachments: PreviewableAttachment[], title: string, index = 0) => {
    if (!attachments || attachments.length === 0) return
    setPreviewAttachments(attachments)
    setPreviewTitle(title)
    setPreviewInitialIndex(index)
    setPreviewModalOpen(true)
  }

  // Parse attachments from backend format
  const parseAttachments = (attachments: unknown): PreviewableAttachment[] => {
    if (!Array.isArray(attachments)) return []
    return attachments.map((att, idx) => {
      if (typeof att === 'string') {
        return {
          filename: att,
          content_type: 'application/octet-stream',
          size: 0,
        }
      }
      if (typeof att === 'object' && att !== null) {
        const a = att as Record<string, unknown>
        return {
          filename: String(a.filename || a.name || `attachment-${idx + 1}`),
          content_type: String(a.content_type || a.contentType || a.type || 'application/octet-stream'),
          size: typeof a.size === 'number' ? a.size : 0,
          content: typeof a.content === 'string' ? a.content : undefined,
          url: typeof a.url === 'string' ? a.url : undefined,
        }
      }
      return {
        filename: `attachment-${idx + 1}`,
        content_type: 'application/octet-stream',
        size: 0,
      }
    })
  }

  // Pagination state (starts at page 1 with page_size 20)
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 })

  // Query live mails with pagination params (API starts from page 1)
  const { data: mailsResponse, isLoading, isError, error, refetch, isFetching } = useMailsQuery({
    page: pagination.pageIndex + 1,
    page_size: pagination.pageSize,
  })

  // Extract paginated metadata if returned by server
  const rawData = mailsResponse?.data
  const paginatedMeta: MailsPaginatedData | null = useMemo(() => {
    if (
      rawData &&
      typeof rawData === 'object' &&
      'items' in rawData &&
      Array.isArray((rawData as MailsPaginatedData).items)
    ) {
      return rawData as MailsPaginatedData
    }
    return null
  }, [rawData])

  const allMails: MailItem[] = useMemo(() => {
    if (paginatedMeta) {
      return ensureArray<MailItem>(paginatedMeta.items)
    }
    return ensureArray<MailItem>(mailsResponse?.data ?? mailsResponse)
  }, [mailsResponse, paginatedMeta])

  // Reset page to 0 when filters or search change
  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
  }, [subRoute, selectedStatus, selectedNode, search])

  // Compute metrics
  const metrics = useMemo(() => {
    let delivered = 0
    let pending = 0
    let failed = 0
    for (const m of allMails) {
      const st = (m.status || '').toLowerCase()
      if (st === 'delivered' || st === 'sent' || st === 'success') delivered++
      else if (st === 'pending' || st === 'queued' || st === 'processing') pending++
      else if (st === 'failed' || st === 'bounced' || st === 'rejected') failed++
    }
    return {
      total: typeof paginatedMeta?.total === 'number' ? paginatedMeta.total : allMails.length,
      delivered,
      pending,
      failed,
    }
  }, [allMails, paginatedMeta])

  // Filtered rows
  const filteredMails = useMemo(() => {
    return allMails.filter((mail) => {
      // 1. Tab filter
      if (subRoute === 'delivered') {
        const st = (mail.status || '').toLowerCase()
        if (st !== 'delivered' && st !== 'sent' && st !== 'success') return false
      } else if (subRoute === 'pending') {
        const st = (mail.status || '').toLowerCase()
        if (st !== 'pending' && st !== 'queued' && st !== 'processing') return false
      } else if (subRoute === 'failed') {
        const st = (mail.status || '').toLowerCase()
        if (st !== 'failed' && st !== 'bounced' && st !== 'rejected') return false
      }

      // 2. Status dropdown filter
      if (selectedStatus !== 'All statuses') {
        if ((mail.status || '').toLowerCase() !== selectedStatus.toLowerCase()) return false
      }

      // 3. Node dropdown filter
      if (selectedNode !== 'All nodes') {
        if (mail.node !== selectedNode) return false
      }

      // 4. Search query
      if (search.trim()) {
        const q = search.toLowerCase()
        const toStr = Array.isArray(mail.to) ? mail.to.join(' ') : String(mail.to || '')
        const subject = (mail.subject || '').toLowerCase()
        const fromEmail = (mail.from_email || '').toLowerCase()
        const id = (mail.id || '').toLowerCase()
        if (!toStr.toLowerCase().includes(q) && !subject.includes(q) && !fromEmail.includes(q) && !id.includes(q)) {
          return false
        }
      }

      return true
    })
  }, [allMails, subRoute, selectedStatus, selectedNode, search])

  // Check if any client-side filter is narrowing down the results
  const isFilterActive = useMemo(() => {
    return (
      Boolean(search.trim()) ||
      selectedStatus !== 'All statuses' ||
      selectedNode !== 'All nodes' ||
      Boolean(subRoute)
    )
  }, [search, selectedStatus, selectedNode, subRoute])

  // Total count for pagination
  const totalCount = useMemo(() => {
    if (paginatedMeta && !isFilterActive) {
      return typeof paginatedMeta.total === 'number' ? paginatedMeta.total : filteredMails.length
    }
    return filteredMails.length
  }, [paginatedMeta, isFilterActive, filteredMails.length])

  // Slice paginated mails for display
  const displayMails = useMemo(() => {
    // If server sent paginated items and no extra client filter active
    if (paginatedMeta && !isFilterActive && paginatedMeta.items.length <= pagination.pageSize) {
      return filteredMails
    }
    // Client-side pagination slice
    const start = pagination.pageIndex * pagination.pageSize
    return filteredMails.slice(start, start + pagination.pageSize)
  }, [filteredMails, paginatedMeta, isFilterActive, pagination.pageIndex, pagination.pageSize])

  const tabs: [string, string][] = [
    ['All events', 'logs'],
    ['Delivered', 'logs/delivered'],
    ['Pending', 'logs/pending'],
    ['Failed', 'logs/failed'],
  ]

  return (
    <>
      <div className="page-heading-row">
        <div>
          <div className="page-eyebrow">
            METROMAIL WORKSPACE <span>/</span> EMAIL LOGS
          </div>
          <h1>Email logs</h1>
          <p>Inspect message outcomes, delivery status, latency, and remote MTA responses.</p>
        </div>
        <div className="page-heading-actions">
          <button
            type="button"
            className="button button-secondary"
            onClick={() => {
              refetch()
              onAction('Email logs refreshed.')
            }}
            disabled={isFetching}
          >
            <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
            <span>{isFetching ? 'Refreshing...' : 'Refresh'}</span>
          </button>
          <Link href="/app/transactional" className="button button-primary">
            <Send size={14} /> Send test email
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <section className="transactional-metrics">
        <article>
          <small>Total messages</small>
          <b>{metrics.total.toLocaleString()}</b>
          <span>Live API records</span>
        </article>
        <article>
          <small>Delivered</small>
          <b className="text-emerald-600">{metrics.delivered.toLocaleString()}</b>
          <span className="text-emerald-600">
            <CheckCircle2 size={13} /> {metrics.total > 0 ? `${((metrics.delivered / metrics.total) * 100).toFixed(1)}%` : '100%'}
          </span>
        </article>
        <article>
          <small>Pending / In-flight</small>
          <b className="text-amber-600">{metrics.pending.toLocaleString()}</b>
          <span className="text-amber-600">
            <Clock size={13} /> Active queues
          </span>
        </article>
        <article>
          <small>Failed / Bounced</small>
          <b className="text-rose-600">{metrics.failed.toLocaleString()}</b>
          <span className="text-rose-600">
            <XCircle size={13} /> {metrics.failed} issues
          </span>
        </article>
      </section>

      {/* Route Tabs */}
      <div className="section-tabs">
        {tabs.map(([label, href]) => {
          const isActive =
            (href === 'logs' && (!subRoute || subRoute === 'all')) ||
            href === `logs/${subRoute}`
          return (
            <Link
              key={href}
              href={`/app/${href}`}
              className={isActive ? 'active' : ''}
            >
              {label}
            </Link>
          )
        })}
      </div>

      {/* Error state */}
      {isError && (
        <div className="transactional-error-banner" style={{ margin: '12px 0' }} role="alert">
          <AlertCircle size={18} />
          <div className="error-body">
            <strong>Error loading logs:</strong>
            <p>{formatApiErrorMessage(error, 'Could not load email logs from server.')}</p>
          </div>
          <button type="button" className="button button-secondary button-sm" onClick={() => refetch()}>
            Retry
          </button>
        </div>
      )}

      {/* Data Panel */}
      <section className="data-panel">
        <div className="data-panel-top">
          <div>
            <h2>Email delivery history</h2>
            <p>
              {filteredMails.length.toLocaleString()}{' '}
              {filteredMails.length === 1 ? 'message' : 'messages'} found in current view
            </p>
          </div>
        </div>

        {/* Filter controls */}
        <div className="table-filter-bar">
          <label className="table-search-control">
            <Search size={15} aria-hidden="true" />
            <input
              placeholder="Search recipient, subject, sender, or ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search email logs"
            />
            {search && (
              <button type="button" aria-label="Clear search" onClick={() => setSearch('')}>
                ×
              </button>
            )}
          </label>

          <div className="table-filter-controls">
            <label className="table-filter-control">
              <span>Status</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                aria-label="Filter by status"
              >
                <option value="All statuses">All statuses</option>
                <option value="delivered">Delivered</option>
                <option value="pending">Pending</option>
                <option value="sent">Sent</option>
                <option value="failed">Failed</option>
                <option value="bounced">Bounced</option>
              </select>
            </label>

            <label className="table-filter-control">
              <span>Node</span>
              <select
                value={selectedNode}
                onChange={(e) => setSelectedNode(e.target.value)}
                aria-label="Filter by sending node"
              >
                <option value="All nodes">All nodes</option>
                <option value="node-158">node-158</option>
                <option value="node-253">node-253</option>
              </select>
            </label>

            <button
              className="table-reset-button"
              type="button"
              disabled={!search && selectedStatus === 'All statuses' && selectedNode === 'All nodes'}
              onClick={() => {
                setSearch('')
                setSelectedStatus('All statuses')
                setSelectedNode('All nodes')
              }}
            >
              Reset
            </button>
          </div>
        </div>

        {/* Loading Skeleton */}
        {isLoading ? (
          <div className="table-loading-container">
            <Loader2 size={24} className="animate-spin text-blue-600" />
            <span>Loading emails from live API...</span>
          </div>
        ) : filteredMails.length === 0 ? (
          <div className="table-empty-container">
            <Mail size={32} className="text-slate-400" />
            <h3>No emails match your criteria</h3>
            <p>
              {allMails.length === 0
                ? 'No transactional messages have been sent yet. Click below to dispatch your first test message.'
                : 'Try adjusting your search query, status, or node filter.'}
            </p>
            {allMails.length === 0 && (
              <Link href="/app/transactional" className="button button-primary">
                <Send size={14} /> Send a test email
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="desktop-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Message &amp; Recipient</th>
                    <th>Status</th>
                    <th>From Address</th>
                    <th>Node</th>
                    <th>Events</th>
                    <th>Created At</th>
                    <th style={{ textAlign: 'right', width: '60px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayMails.map((mail) => {
                    const toDisplay = Array.isArray(mail.to) ? mail.to.join(', ') : mail.to
                    const dateDisplay = mail.created_at
                      ? new Date(mail.created_at).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '—'
                    const eventsCount = mail.events?.length ?? 0
                    const mailAttachments = parseAttachments(mail.attachments)
                    const isExpanded = expandedMailId === mail.id
                    const avatarInitial = (toDisplay?.[0] || mail.subject?.[0] || 'M').toUpperCase()

                    return (
                      <tr
                        key={mail.id}
                        className={isExpanded ? 'row-action-active' : ''}
                        style={{
                          cursor: 'pointer',
                          position: 'relative',
                          zIndex: isExpanded ? 100 : 1,
                          backgroundColor: isExpanded ? '#f8fafc' : undefined,
                        }}
                        onClick={(e) => {
                          const target = e.target as HTMLElement
                          if (target.closest('a') || target.closest('button')) return
                          window.location.href = `/app/logs/${mail.id}`
                        }}
                      >
                        <td>
                          <div className="table-name-cell">
                            <span className="table-row-avatar">{avatarInitial}</span>
                            <span>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                <b>{mail.subject || '(No subject)'}</b>
                                {mailAttachments.length > 0 && (
                                  <button
                                    type="button"
                                    className="log-attachments-pill"
                                    title={`Preview ${mailAttachments.length} attachment${mailAttachments.length > 1 ? 's' : ''}`}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      openPreview(mailAttachments, mail.subject || 'Email Attachments')
                                    }}
                                  >
                                    <Paperclip size={11} />
                                    <span>{mailAttachments.length}</span>
                                  </button>
                                )}
                              </span>
                              <small>{toDisplay}</small>
                            </span>
                          </div>
                        </td>
                        <td>
                          <StatusBadge status={mail.status || 'pending'} />
                        </td>
                        <td>
                          <span className="log-from-email">{mail.from_email}</span>
                        </td>
                        <td>
                          <span className={`node-pill node-pill-${mail.node || '158'}`}>
                            {mail.node || 'node-158'}
                          </span>
                        </td>
                        <td>
                          <span className="events-count-badge">
                            {eventsCount} {eventsCount === 1 ? 'event' : 'events'}
                          </span>
                        </td>
                        <td style={{ color: '#64748b', fontSize: '13px' }}>
                          {dateDisplay}
                        </td>
                        <td
                          className="row-action-cell"
                          style={{ textAlign: 'right', position: 'relative' }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            className={`row-action-trigger ${isExpanded ? 'active' : ''}`}
                            aria-label={`Open actions for ${mail.subject || mail.id}`}
                            aria-expanded={isExpanded}
                            onClick={(e) => {
                              e.stopPropagation()
                              const rect = e.currentTarget.getBoundingClientRect()
                              if (isExpanded) {
                                setExpandedMailId(null)
                                setMenuAnchorRect(null)
                              } else {
                                setExpandedMailId(mail.id)
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
                              setExpandedMailId(null)
                              setMenuAnchorRect(null)
                            }}
                          >
                            <RowActionMenuItem
                              icon={Eye}
                              label="View details"
                              onClick={() => {
                                setExpandedMailId(null)
                                setMenuAnchorRect(null)
                                window.location.href = `/app/logs/${mail.id}`
                              }}
                            />
                            {mailAttachments.length > 0 && (
                              <RowActionMenuItem
                                icon={Paperclip}
                                label={`Preview attachments (${mailAttachments.length})`}
                                onClick={() => {
                                  setExpandedMailId(null)
                                  setMenuAnchorRect(null)
                                  openPreview(mailAttachments, mail.subject || 'Email Attachments')
                                }}
                              />
                            )}
                            <RowActionDivider />
                            <RowActionMenuItem
                              icon={Copy}
                              label="Copy message ID"
                              onClick={() => {
                                navigator.clipboard.writeText(mail.id)
                                onAction(`Message ID ${mail.id} copied to clipboard.`)
                                setExpandedMailId(null)
                                setMenuAnchorRect(null)
                              }}
                            />
                          </FloatingRowActionMenu>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="mobile-data-cards">
              {displayMails.map((mail) => {
                const toDisplay = Array.isArray(mail.to) ? mail.to.join(', ') : mail.to
                const dateDisplay = mail.created_at
                  ? new Date(mail.created_at).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '—'
                const mailAttachments = parseAttachments(mail.attachments)

                return (
                  <article className="mobile-data-card" key={mail.id}>
                    <div className="mobile-card-top">
                      <div>
                        <b>{toDisplay}</b>
                        <div className="log-subject-row" style={{ marginTop: '3px' }}>
                          <small>{mail.subject || '(No subject)'}</small>
                          {mailAttachments.length > 0 && (
                            <button
                              type="button"
                              className="log-attachments-pill"
                              style={{ padding: '1px 6px', fontSize: '11px' }}
                              title={`Preview ${mailAttachments.length} attachment${mailAttachments.length > 1 ? 's' : ''}`}
                              onClick={(e) => {
                                e.stopPropagation()
                                openPreview(mailAttachments, mail.subject || 'Email Attachments')
                              }}
                            >
                              <Paperclip size={11} />
                              <span>{mailAttachments.length}</span>
                            </button>
                          )}
                        </div>
                      </div>
                      <StatusBadge status={mail.status || 'pending'} />
                    </div>
                    <div className="mobile-card-meta">
                      <span className="node-pill">{mail.node || 'node-158'}</span>
                      <span>{dateDisplay}</span>
                    </div>
                    <Link href={`/app/logs/${mail.id}`} className="mobile-card-action">
                      View details <ArrowRight size={14} />
                    </Link>
                  </article>
                )
              })}
            </div>

            {/* Pagination Controls */}
            <TablePagination
              pageIndex={pagination.pageIndex}
              pageSize={pagination.pageSize}
              totalItems={totalCount}
              pageSizeOptions={[10, 20, 50, 100]}
              onPageChange={(pageIndex) => setPagination((prev) => ({ ...prev, pageIndex }))}
              onPageSizeChange={(pageSize) => setPagination({ pageIndex: 0, pageSize })}
            />
          </>
        )}
      </section>

      {/* Attachment Preview Lightbox / Modal */}
      <AttachmentPreviewModal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        attachments={previewAttachments}
        initialIndex={previewInitialIndex}
        emailSubject={previewTitle}
      />
    </>
  )
}
