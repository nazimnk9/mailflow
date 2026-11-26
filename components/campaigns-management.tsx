'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Calendar,
  Check,
  ChevronDown,
  Clock3,
  Code2,
  Copy,
  ExternalLink,
  Eye,
  FileText,
  Filter,
  Globe2,
  Inbox,
  LayoutTemplate,
  Loader2,
  Mail,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  RotateCw,
  Search,
  Send,
  Sparkles,
  Tag,
  Trash2,
  Users,
  Workflow,
  X,
} from 'lucide-react'
import {
  useCampaignsQuery,
  useCampaignByIdQuery,
  useCreateCampaignMutation,
  useUpdateCampaignMutation,
  useDeleteCampaignMutation,
  useSendCampaignMutation,
  useReRunCampaignMutation,
} from '@/lib/hooks/use-campaigns-query'
import { useDomainsQuery } from '@/lib/hooks/use-domains-query'
import { useTemplatesQuery } from '@/lib/hooks/use-templates-query'
import { contactsApi } from '@/lib/api/contacts'
import type { CampaignItem, CampaignRequestPayload, CampaignStats } from '@/lib/api/campaigns'
import type { TemplateItem } from '@/lib/api/templates'
import { TablePagination } from '@/components/table-pagination'
import { StatusBadge } from '@/components/status-badge'
import {
  FloatingRowActionMenu,
  RowActionMenuItem,
  RowActionDivider,
} from '@/components/floating-row-action-menu'
import { EmailEditor } from '@/components/email-editor'
import {
  VisualEmailBuilder,
  compileBlocksToHtml,
  convertHtmlToEmailBlocks,
  getBlocksForPreset,
  type EmailBlock,
} from '@/components/visual-email-builder'
import { EMAIL_TEMPLATES } from '@/lib/email-templates'

// Safe text extractor
function safeText(val: any): string {
  if (typeof val === 'string') return val
  if (typeof val === 'number') return String(val)
  return ''
}

// Format date nicely
export function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '—'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleString([], {
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

// Extract campaigns from various response structures
export function extractCampaigns(res: any): CampaignItem[] {
  if (!res) return []
  if (Array.isArray(res)) return res
  if (Array.isArray(res.data)) return res.data
  if (res.data && Array.isArray(res.data.items)) return res.data.items
  if (Array.isArray(res.items)) return res.items
  return []
}

interface CampaignsManagementProps {
  route: string
  onAction?: (msg: string) => void
}

export function CampaignsManagement({ route, onAction = () => {} }: CampaignsManagementProps) {
  // Check if we are on report view (/app/campaigns/{id}/report)
  if (route.startsWith('campaigns/') && route.endsWith('/report')) {
    const campaignId = route.replace(/^campaigns\//, '').replace(/\/report$/, '')
    return <CampaignReportView campaignId={campaignId} onAction={onAction} />
  }

  // Check if we are on create campaign wizard (/app/campaigns/create)
  if (route === 'campaigns/create') {
    return <CampaignBuilderView onAction={onAction} />
  }

  return <CampaignsListView route={route} onAction={onAction} />
}

/* =========================================================================
   CAMPAIGNS LIST VIEW
   ========================================================================= */
function CampaignsListView({ route, onAction }: { route: string; onAction: (msg: string) => void }) {
  // Determine initial status filter from URL subroute
  const initialStatus = route === 'campaigns/drafts'
    ? 'draft'
    : route === 'campaigns/sending'
    ? 'sending'
    : route === 'campaigns/sent'
    ? 'sent'
    : 'all'

  const [selectedStatus, setSelectedStatus] = useState<string>(initialStatus)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Floating Action Menu state
  const [activeMenuCampaignId, setActiveMenuCampaignId] = useState<string | null>(null)
  const [menuAnchorRect, setMenuAnchorRect] = useState<DOMRect | null>(null)

  // Modal states
  const [sendModalCampaign, setSendModalCampaign] = useState<CampaignItem | null>(null)
  const [reRunModalCampaign, setReRunModalCampaign] = useState<CampaignItem | null>(null)
  const [deleteModalCampaign, setDeleteModalCampaign] = useState<CampaignItem | null>(null)
  const [editModalCampaign, setEditModalCampaign] = useState<CampaignItem | null>(null)

  // Query
  const {
    data: campaignsRes,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useCampaignsQuery({
    page,
    page_size: pageSize,
    search: search.trim() || undefined,
    status: selectedStatus !== 'all' ? selectedStatus : undefined,
  })

  // Mutations
  const sendCampaignMutation = useSendCampaignMutation()
  const reRunCampaignMutation = useReRunCampaignMutation()
  const deleteCampaignMutation = useDeleteCampaignMutation()
  const updateCampaignMutation = useUpdateCampaignMutation()

  const campaigns = useMemo(() => extractCampaigns(campaignsRes), [campaignsRes])
  const totalItems = useMemo(() => {
    if (campaignsRes?.data && 'total' in (campaignsRes.data as any)) {
      return (campaignsRes.data as any).total ?? campaigns.length
    }
    return campaigns.length
  }, [campaignsRes, campaigns.length])

  // Summary counts
  const draftCount = campaigns.filter((c) => c.status?.toLowerCase() === 'draft').length
  const sentCount = campaigns.filter((c) => c.status?.toLowerCase() === 'sent').length
  const sendingCount = campaigns.filter((c) => c.status?.toLowerCase() === 'sending').length

  const handleOpenSend = (campaign: CampaignItem) => {
    setActiveMenuCampaignId(null)
    setMenuAnchorRect(null)
    setSendModalCampaign(campaign)
  }

  const handleOpenReRun = (campaign: CampaignItem) => {
    setActiveMenuCampaignId(null)
    setMenuAnchorRect(null)
    setReRunModalCampaign(campaign)
  }

  const handleOpenDelete = (campaign: CampaignItem) => {
    setActiveMenuCampaignId(null)
    setMenuAnchorRect(null)
    setDeleteModalCampaign(campaign)
  }

  const handleOpenEdit = (campaign: CampaignItem) => {
    setActiveMenuCampaignId(null)
    setMenuAnchorRect(null)
    setEditModalCampaign(campaign)
  }

  const confirmSend = async () => {
    if (!sendModalCampaign) return
    try {
      await sendCampaignMutation.mutateAsync(sendModalCampaign.id)
      onAction(`“${sendModalCampaign.name}” has been queued and sent.`)
      setSendModalCampaign(null)
      refetch()
    } catch (err: any) {
      onAction(`Failed to send campaign: ${err?.message || 'Unknown error'}`)
    }
  }

  const confirmReRun = async () => {
    if (!reRunModalCampaign) return
    try {
      await reRunCampaignMutation.mutateAsync(reRunModalCampaign.id)
      onAction(`“${reRunModalCampaign.name}” re-run scheduled successfully.`)
      setReRunModalCampaign(null)
      refetch()
    } catch (err: any) {
      onAction(`Failed to re-run campaign: ${err?.message || 'Unknown error'}`)
    }
  }

  const confirmDelete = async () => {
    if (!deleteModalCampaign) return
    try {
      await deleteCampaignMutation.mutateAsync(deleteModalCampaign.id)
      onAction(`“${deleteModalCampaign.name}” has been deleted.`)
      setDeleteModalCampaign(null)
      refetch()
    } catch (err: any) {
      onAction(`Failed to delete campaign: ${err?.message || 'Unknown error'}`)
    }
  }

  const activeMenuCampaign = campaigns.find((c) => c.id === activeMenuCampaignId)

  return (
    <>
      {/* Page Heading */}
      <div className="page-heading-row">
        <div>
          <div className="page-eyebrow">
            METROMAIL WORKSPACE <span>/</span> CAMPAIGNS
          </div>
          <h1>Email Campaigns</h1>
          <p>Create, broadcast, and analyze email campaigns to your audience.</p>
        </div>
        <div className="page-heading-actions">
          <button
            type="button"
            className="button button-secondary"
            onClick={() => refetch()}
            disabled={isFetching}
            title="Refresh campaigns"
          >
            <RotateCw size={14} className={isFetching ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
          <Link href="/app/campaigns/create" className="button button-primary">
            <Plus size={15} />
            <span>Create campaign</span>
          </Link>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="section-tabs" style={{ marginBottom: '22px' }}>
        <Link className={selectedStatus === 'all' && route === 'campaigns' ? 'active' : ''} href="/app/campaigns" onClick={() => setSelectedStatus('all')}>
          All campaigns
        </Link>
        <Link className={selectedStatus === 'draft' || route === 'campaigns/drafts' ? 'active' : ''} href="/app/campaigns/drafts" onClick={() => setSelectedStatus('draft')}>
          Drafts {draftCount > 0 && <span className="tab-counter-badge">{draftCount}</span>}
        </Link>
        <Link className={selectedStatus === 'sending' || route === 'campaigns/sending' ? 'active' : ''} href="/app/campaigns/sending" onClick={() => setSelectedStatus('sending')}>
          Sending {sendingCount > 0 && <span className="tab-counter-badge tab-counter-blue">{sendingCount}</span>}
        </Link>
        <Link className={selectedStatus === 'sent' || route === 'campaigns/sent' ? 'active' : ''} href="/app/campaigns/sent" onClick={() => setSelectedStatus('sent')}>
          Sent {sentCount > 0 && <span className="tab-counter-badge tab-counter-green">{sentCount}</span>}
        </Link>
        <Link className={route === 'campaigns/templates' ? 'active' : ''} href="/app/campaigns/templates">
          Templates
        </Link>
      </div>

      {/* Main Data Panel */}
      <section className="data-panel">
        <div className="data-panel-top">
          <div>
            <h2>
              {selectedStatus === 'draft'
                ? 'Draft campaigns'
                : selectedStatus === 'sending'
                ? 'Sending in progress'
                : selectedStatus === 'sent'
                ? 'Sent campaigns'
                : 'Recent campaigns'}
            </h2>
            <p>
              {totalItems.toLocaleString()} {totalItems === 1 ? 'campaign' : 'campaigns'} in this view
            </p>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="table-filter-bar">
          <label className="table-search-control">
            <Search size={15} aria-hidden="true" />
            <input
              aria-label="Search campaigns"
              placeholder="Search campaigns by name, subject, or tag…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
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
                aria-label="Filter by status"
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value)
                  setPage(1)
                }}
              >
                <option value="all">All statuses</option>
                <option value="draft">Draft</option>
                <option value="sending">Sending</option>
                <option value="sent">Sent</option>
              </select>
            </label>
            <button
              className="table-reset-button"
              type="button"
              disabled={!search && selectedStatus === 'all'}
              onClick={() => {
                setSearch('')
                setSelectedStatus('all')
                setPage(1)
              }}
            >
              Reset
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div
            style={{
              padding: '16px',
              margin: '16px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fee2e2',
              borderRadius: '8px',
              color: '#b91c1c',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <AlertCircle size={18} />
            <div style={{ flex: 1 }}>
              <b>Failed to load campaigns:</b> {error.message || 'Please check your connection.'}
            </div>
            <button
              type="button"
              className="button button-secondary"
              onClick={() => refetch()}
              style={{ minHeight: '30px', padding: '0 10px', fontSize: '13px' }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Desktop Table View */}
        <div className="desktop-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Campaign</th>
                <th>Status</th>
                <th>Audience / Tags</th>
                <th>Performance</th>
                <th>Date</th>
                <th style={{ textAlign: 'right', width: '50px' }}>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="table-empty-state" style={{ padding: '40px' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#64748b' }}>
                      <Loader2 size={18} className="spin" />
                      <span>Loading campaigns from API…</span>
                    </div>
                  </td>
                </tr>
              ) : campaigns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="table-empty-state" style={{ padding: '50px 20px', textAlign: 'center' }}>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        backgroundColor: '#eff6ff',
                        color: '#2563eb',
                        marginBottom: '12px',
                      }}
                    >
                      <Send size={22} />
                    </div>
                    <h3 style={{ margin: '0 0 6px', fontSize: '15px', color: '#0f172a' }}>
                      No campaigns found
                    </h3>
                    <p style={{ margin: '0 0 16px', color: '#64748b', fontSize: '13.5px' }}>
                      {search || selectedStatus !== 'all'
                        ? 'No campaigns match your current filters. Try resetting the search or status.'
                        : 'Create your first email campaign to broadcast product updates or announcements.'}
                    </p>
                    <Link href="/app/campaigns/create" className="button button-primary">
                      <Plus size={14} /> Create campaign
                    </Link>
                  </td>
                </tr>
              ) : (
                campaigns.map((c) => {
                  const isExpanded = activeMenuCampaignId === c.id
                  const statusNormalized = (c.status || 'draft').toLowerCase()
                  const isDraft = statusNormalized === 'draft'
                  const isSending = statusNormalized === 'sending'
                  const isSent = statusNormalized === 'sent'

                  return (
                    <tr
                      key={c.id}
                      className={isExpanded ? 'row-action-active' : ''}
                      style={{ cursor: 'pointer' }}
                      onClick={(e) => {
                        const target = e.target as HTMLElement
                        if (target.closest('button') || target.closest('a') || target.closest('.row-action-cell')) return
                        window.location.href = `/app/campaigns/${c.id}/report`
                      }}
                    >
                      {/* Name & Subject */}
                      <td>
                        <div className="table-name-cell">
                          <span className={`table-row-avatar avatar-campaign`}>
                            <Send size={14} />
                          </span>
                          <span>
                            <b>{c.name}</b>
                            <small>{c.subject || 'No subject line specified'}</small>
                          </span>
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td>
                        <StatusBadge status={c.status || 'Draft'} />
                      </td>

                      {/* Audience / Tags */}
                      <td>
                        {Array.isArray(c.tags) && c.tags.length > 0 ? (
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {c.tags.slice(0, 3).map((tag, idx) => (
                              <span
                                key={idx}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                  fontSize: '11.5px',
                                  padding: '2px 7px',
                                  borderRadius: '4px',
                                  backgroundColor: '#f1f5f9',
                                  color: '#334155',
                                  fontWeight: 500,
                                }}
                              >
                                <Tag size={10} color="#64748b" />
                                {tag}
                              </span>
                            ))}
                            {c.tags.length > 3 && (
                              <span style={{ fontSize: '11px', color: '#64748b' }}>
                                +{c.tags.length - 3}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '13px' }}>All audience</span>
                        )}
                      </td>

                      {/* Performance */}
                      <td>
                        {isSent && c.stats ? (
                          <div style={{ display: 'flex', gap: '8px', fontSize: '12.5px' }}>
                            <span title="Delivered emails" style={{ color: '#059669', fontWeight: 600 }}>
                              {c.stats.delivered ?? c.stats.sent ?? 0} sent
                            </span>
                            {c.stats.opened !== undefined && c.stats.sent && c.stats.sent > 0 && (
                              <span style={{ color: '#2563eb' }}>
                                {Math.round(((c.stats.opened ?? 0) / c.stats.sent) * 100)}% open
                              </span>
                            )}
                          </div>
                        ) : isSending ? (
                          <span style={{ color: '#2563eb', fontSize: '12.5px', fontWeight: 500 }}>
                            Broadcasting messages…
                          </span>
                        ) : (
                          <span style={{ color: '#64748b', fontSize: '12.5px' }}>Ready to launch</span>
                        )}
                      </td>

                      {/* Date */}
                      <td>
                        <span style={{ color: '#64748b', fontSize: '13px' }}>
                          {formatDate(c.sent_at || c.created_at)}
                        </span>
                      </td>

                      {/* Actions (Floating Action Menu) */}
                      <td className="row-action-cell" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className={`row-action-trigger ${isExpanded ? 'active' : ''}`}
                          aria-label={`Open ${c.name} actions`}
                          aria-expanded={isExpanded}
                          onClick={(e) => {
                            e.stopPropagation()
                            if (isExpanded) {
                              setActiveMenuCampaignId(null)
                              setMenuAnchorRect(null)
                            } else {
                              const rect = e.currentTarget.getBoundingClientRect()
                              setMenuAnchorRect(rect)
                              setActiveMenuCampaignId(c.id)
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

        {/* Mobile Cards View */}
        <div className="mobile-data-cards">
          {campaigns.map((c) => (
            <article
              className="mobile-data-card"
              key={c.id}
              onClick={() => {
                window.location.href = `/app/campaigns/${c.id}/report`
              }}
            >
              <div className="mobile-card-top">
                <div>
                  <b>{c.name}</b>
                  <small>{c.subject || 'No subject'}</small>
                </div>
                <StatusBadge status={c.status || 'Draft'} />
              </div>
              <div className="mobile-card-meta">
                <span>{c.from_email || 'Default sender'}</span>
                <span>{formatDate(c.sent_at || c.created_at)}</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px', alignItems: 'center' }}>
                <Link
                  href={`/app/campaigns/${c.id}/report`}
                  className="button button-secondary button-sm"
                  style={{ flex: 1, textAlign: 'center' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  View report
                </Link>
                {c.status === 'draft' && (
                  <>
                    <button
                      type="button"
                      className="button button-secondary button-sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleOpenEdit(c)
                      }}
                      title="Edit campaign"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      type="button"
                      className="button button-primary button-sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleOpenSend(c)
                      }}
                    >
                      Send
                    </button>
                  </>
                )}
                <button
                  type="button"
                  className="button button-secondary button-sm"
                  style={{ color: '#dc2626' }}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleOpenDelete(c)
                  }}
                  title="Delete campaign"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </article>
          ))}
        </div>

        {/* Pagination */}
        <TablePagination
          pageIndex={page - 1}
          pageSize={pageSize}
          totalItems={totalItems}
          pageSizeOptions={[10, 20, 50]}
          onPageChange={(newIdx) => setPage(newIdx + 1)}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize)
            setPage(1)
          }}
        />
      </section>

      {/* Floating Action Portal Menu */}
      {activeMenuCampaignId && menuAnchorRect && activeMenuCampaign && (
        <FloatingRowActionMenu
          isOpen={Boolean(activeMenuCampaignId)}
          anchorRect={menuAnchorRect}
          onClose={() => {
            setActiveMenuCampaignId(null)
            setMenuAnchorRect(null)
          }}
        >
          {activeMenuCampaign.status === 'draft' ? (
            <>
              <RowActionMenuItem
                icon={Send}
                label="Send campaign now"
                onClick={() => handleOpenSend(activeMenuCampaign)}
              />
              <RowActionMenuItem
                icon={Pencil}
                label="Edit campaign"
                onClick={() => handleOpenEdit(activeMenuCampaign)}
              />
              <RowActionMenuItem
                icon={Eye}
                label="View details & report"
                onClick={() => {
                  window.location.href = `/app/campaigns/${activeMenuCampaign.id}/report`
                }}
              />
              <RowActionDivider />
              <RowActionMenuItem
                icon={Trash2}
                label="Delete campaign"
                isDanger
                onClick={() => handleOpenDelete(activeMenuCampaign)}
              />
            </>
          ) : activeMenuCampaign.status === 'sent' ? (
            <>
              <RowActionMenuItem
                icon={BarChart3}
                label="View report & analytics"
                onClick={() => {
                  window.location.href = `/app/campaigns/${activeMenuCampaign.id}/report`
                }}
              />
              <RowActionMenuItem
                icon={RotateCw}
                label="Re-run campaign"
                onClick={() => handleOpenReRun(activeMenuCampaign)}
              />
              <RowActionMenuItem
                icon={Copy}
                label="Copy campaign name"
                onClick={() => {
                  navigator.clipboard.writeText(activeMenuCampaign.name)
                  onAction(`“${activeMenuCampaign.name}” copied to clipboard.`)
                  setActiveMenuCampaignId(null)
                }}
              />
              <RowActionDivider />
              <RowActionMenuItem
                icon={Trash2}
                label="Delete campaign"
                isDanger
                onClick={() => handleOpenDelete(activeMenuCampaign)}
              />
            </>
          ) : (
            <>
              <RowActionMenuItem
                icon={Eye}
                label="View sending progress"
                onClick={() => {
                  window.location.href = `/app/campaigns/${activeMenuCampaign.id}/report`
                }}
              />
              <RowActionMenuItem
                icon={RotateCw}
                label="Refresh status"
                onClick={() => {
                  refetch()
                  setActiveMenuCampaignId(null)
                }}
              />
            </>
          )}
        </FloatingRowActionMenu>
      )}

      {/* Send Confirmation Modal */}
      {sendModalCampaign && (
        <div
          className="dialog-backdrop"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget && !sendCampaignMutation.isPending) {
              setSendModalCampaign(null)
            }
          }}
        >
          <div
            className="action-dialog action-dialog-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="send-campaign-modal-title"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '480px' }}
          >
            <button
              type="button"
              className="dialog-close"
              aria-label="Close dialog"
              disabled={sendCampaignMutation.isPending}
              onClick={() => setSendModalCampaign(null)}
            >
              <X size={18} />
            </button>
            <div
              className="dialog-icon"
              style={{ color: '#2563eb', backgroundColor: '#eff6ff', border: '1px solid #dbeafe' }}
            >
              <Send size={20} />
            </div>
            <div className="eyebrow" style={{ color: '#2563eb' }}>
              BROADCAST CAMPAIGN
            </div>
            <h2 id="send-campaign-modal-title">Send campaign now?</h2>
            <p style={{ margin: '0 0 16px', color: '#64748b', fontSize: '14px', lineHeight: 1.5 }}>
              You are about to launch <b style={{ color: '#0f172a' }}>“{sendModalCampaign.name}”</b> to your audience. Messages will start delivering immediately through your verified sending MTA nodes.
            </p>
            <div
              style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '14px',
                marginBottom: '20px',
                fontSize: '13px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#64748b' }}>Subject</span>
                <b style={{ color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '240px' }}>
                  {sendModalCampaign.subject || 'No subject'}
                </b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#64748b' }}>Sender</span>
                <b style={{ color: '#1e293b' }}>{sendModalCampaign.from_email || 'Default sender'}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#64748b' }}>Target audience</span>
                <b style={{ color: '#1e293b' }}>
                  {Array.isArray(sendModalCampaign.tags) && sendModalCampaign.tags.length > 0
                    ? sendModalCampaign.tags.join(', ')
                    : 'All subscribed contacts'}
                </b>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="button button-secondary"
                disabled={sendCampaignMutation.isPending}
                onClick={() => setSendModalCampaign(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="button button-primary"
                disabled={sendCampaignMutation.isPending}
                onClick={confirmSend}
              >
                {sendCampaignMutation.isPending ? (
                  <>
                    <Loader2 size={14} className="spin" /> Sending…
                  </>
                ) : (
                  <>
                    <Send size={14} /> Send campaign now
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Re-Run Confirmation Modal */}
      {reRunModalCampaign && (
        <div
          className="dialog-backdrop"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget && !reRunCampaignMutation.isPending) {
              setReRunModalCampaign(null)
            }
          }}
        >
          <div
            className="action-dialog action-dialog-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="rerun-campaign-modal-title"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '460px' }}
          >
            <button
              type="button"
              className="dialog-close"
              aria-label="Close dialog"
              disabled={reRunCampaignMutation.isPending}
              onClick={() => setReRunModalCampaign(null)}
            >
              <X size={18} />
            </button>
            <div
              className="dialog-icon"
              style={{ color: '#059669', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0' }}
            >
              <RotateCw size={20} />
            </div>
            <div className="eyebrow" style={{ color: '#059669' }}>
              CAMPAIGN RE-RUN
            </div>
            <h2 id="rerun-campaign-modal-title">Re-run campaign?</h2>
            <p style={{ margin: '0 0 16px', color: '#64748b', fontSize: '14px', lineHeight: 1.5 }}>
              Are you sure you want to re-dispatch <b style={{ color: '#0f172a' }}>“{reRunModalCampaign.name}”</b>? This will queue and broadcast another send to the target audience.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="button button-secondary"
                disabled={reRunCampaignMutation.isPending}
                onClick={() => setReRunModalCampaign(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="button button-primary"
                disabled={reRunCampaignMutation.isPending}
                onClick={confirmReRun}
              >
                {reRunCampaignMutation.isPending ? (
                  <>
                    <Loader2 size={14} className="spin" /> Queueing…
                  </>
                ) : (
                  <>
                    <RotateCw size={14} /> Re-run campaign
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalCampaign && (
        <div
          className="dialog-backdrop"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget && !deleteCampaignMutation.isPending) {
              setDeleteModalCampaign(null)
            }
          }}
        >
          <div
            className="action-dialog action-dialog-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-campaign-modal-title"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '440px' }}
          >
            <button
              type="button"
              className="dialog-close"
              aria-label="Close dialog"
              disabled={deleteCampaignMutation.isPending}
              onClick={() => setDeleteModalCampaign(null)}
            >
              <X size={18} />
            </button>
            <div
              className="dialog-icon"
              style={{
                color: '#dc2626',
                backgroundColor: '#fef2f2',
                border: '1px solid #fee2e2',
              }}
            >
              <Trash2 size={20} />
            </div>
            <div className="eyebrow" style={{ color: '#dc2626' }}>
              CONFIRM DELETION
            </div>
            <h2 id="delete-campaign-modal-title">Delete campaign?</h2>
            <p style={{ margin: '0 0 16px', color: '#64748b', fontSize: '14px', lineHeight: 1.5 }}>
              Are you sure you want to delete <b style={{ color: '#0f172a' }}>“{deleteModalCampaign.name}”</b>?
            </p>

            <div
              style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '12px 14px',
                marginBottom: '16px',
                fontSize: '13px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#64748b' }}>Status</span>
                <StatusBadge status={deleteModalCampaign.status || 'Draft'} />
              </div>
              {deleteModalCampaign.subject && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#64748b' }}>Subject</span>
                  <b style={{ color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '240px' }}>
                    {deleteModalCampaign.subject}
                  </b>
                </div>
              )}
              {deleteModalCampaign.from_email && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#64748b' }}>Sender</span>
                  <span style={{ color: '#334155', fontWeight: 500 }}>{deleteModalCampaign.from_email}</span>
                </div>
              )}
            </div>

            <div
              style={{
                padding: '12px 14px',
                borderRadius: '8px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#991b1b',
                fontSize: '13px',
                lineHeight: '1.5',
                marginBottom: '22px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
              }}
            >
              <AlertCircle size={17} style={{ color: '#dc2626', flexShrink: 0, marginTop: '2px' }} />
              <span>
                This action cannot be undone. All campaign data, broadcast statistics, and queued messages will be permanently removed.
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="button button-secondary"
                disabled={deleteCampaignMutation.isPending}
                onClick={() => setDeleteModalCampaign(null)}
                style={{ minHeight: '38px', padding: '0 16px', borderRadius: '8px' }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="button button-danger"
                disabled={deleteCampaignMutation.isPending}
                onClick={confirmDelete}
                style={{
                  minHeight: '38px',
                  padding: '0 18px',
                  borderRadius: '8px',
                  backgroundColor: '#dc2626',
                  borderColor: '#b91c1c',
                  color: '#ffffff',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: 600,
                }}
              >
                {deleteCampaignMutation.isPending ? (
                  <>
                    <Loader2 size={15} className="spin" /> Deleting…
                  </>
                ) : (
                  <>
                    <Trash2 size={15} /> Delete campaign
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Edit Modal */}
      {editModalCampaign && (
        <EditCampaignModal
          campaign={editModalCampaign}
          onClose={() => setEditModalCampaign(null)}
          onSuccess={() => {
            setEditModalCampaign(null)
            refetch()
            onAction('Campaign updated successfully.')
          }}
        />
      )}
    </>
  )
}

/* =========================================================================
   EDIT CAMPAIGN MODAL
   ========================================================================= */
function EditCampaignModal({
  campaign,
  onClose,
  onSuccess,
}: {
  campaign: CampaignItem
  onClose: () => void
  onSuccess: () => void
}) {
  const [name, setName] = useState(campaign.name || '')
  const [subject, setSubject] = useState(campaign.subject || '')
  const [fromEmail, setFromEmail] = useState(campaign.from_email || '')
  const [fromName, setFromName] = useState(campaign.from_name || '')
  const [replyTo, setReplyTo] = useState(campaign.reply_to || '')
  const [tagsInput, setTagsInput] = useState((campaign.tags || []).join(', '))
  const [error, setError] = useState<string | null>(null)

  const updateMutation = useUpdateCampaignMutation()

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Campaign name is required.')
      return
    }
    setError(null)

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)

    try {
      await updateMutation.mutateAsync({
        campaignId: campaign.id,
        payload: {
          name: name.trim(),
          subject: subject.trim() || undefined,
          from_email: fromEmail.trim() || undefined,
          from_name: fromName.trim() || undefined,
          reply_to: replyTo.trim() || undefined,
          tags,
        },
      })
      onSuccess()
    } catch (err: any) {
      setError(err?.message || 'Failed to update campaign.')
    }
  }

  return (
    <div
      className="dialog-backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget && !updateMutation.isPending) {
          onClose()
        }
      }}
    >
      <div
        className="action-dialog action-dialog-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-campaign-modal-title"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '520px' }}
      >
        <button
          type="button"
          className="dialog-close"
          aria-label="Close dialog"
          disabled={updateMutation.isPending}
          onClick={onClose}
        >
          <X size={18} />
        </button>
        <div className="dialog-icon">
          <Pencil size={19} />
        </div>
        <div className="eyebrow">EDIT CAMPAIGN</div>
        <h2 id="edit-campaign-modal-title">Edit Campaign Details</h2>
        <p>Update essential metadata for “{campaign.name}”.</p>

        {error && (
          <div
            style={{
              padding: '9px 12px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '6px',
              color: '#b91c1c',
              fontSize: '13px',
              marginBottom: '14px',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSave} className="dialog-form">
          <label>
            <span>Campaign name *</span>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Black Friday Special"
            />
          </label>
          <label>
            <span>Subject line</span>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Write an engaging subject"
            />
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <label>
              <span>From Name</span>
              <input
                value={fromName}
                onChange={(e) => setFromName(e.target.value)}
                placeholder="Sender name"
              />
            </label>
            <label>
              <span>From Email</span>
              <input
                type="email"
                value={fromEmail}
                onChange={(e) => setFromEmail(e.target.value)}
                placeholder="sender@domain.com"
              />
            </label>
          </div>
          <label>
            <span>Reply-to email</span>
            <input
              type="email"
              value={replyTo}
              onChange={(e) => setReplyTo(e.target.value)}
              placeholder="replies@domain.com"
            />
          </label>
          <label>
            <span>Target audience tags (comma separated)</span>
            <input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="newsletter, customers, leads"
            />
          </label>
          <div className="dialog-actions" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              className="button button-secondary"
              onClick={onClose}
              disabled={updateMutation.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="button button-primary"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 size={14} className="spin" /> Saving…
                </>
              ) : (
                'Save changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* =========================================================================
   CAMPAIGN CREATION WIZARD (PRODUCTION CONNECTED TO REAL API)
   ========================================================================= */
function CampaignBuilderView({ onAction }: { onAction: (msg: string) => void }) {
  const [step, setStep] = useState(0)
  const labels = ['Campaign details', 'Choose recipients', 'Design email', 'Review & launch']

  // Form states
  const [name, setName] = useState('')
  const [subject, setSubject] = useState('')
  const [fromName, setFromName] = useState('MetroVPS Team')
  const [fromEmail, setFromEmail] = useState('')
  const [replyTo, setReplyTo] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [htmlContent, setHtmlContent] = useState('')
  const [textContent, setTextContent] = useState('')
  const [designState, setDesignState] = useState<EmailBlock[] | null>(null)
  const [editorType, setEditorType] = useState<'visual_builder' | 'rich_code'>('visual_builder')
  const [templateKey, setTemplateKey] = useState(0)
  const [selectedSavedTemplateId, setSelectedSavedTemplateId] = useState<string | null>(null)
  const [showSavedTemplates, setShowSavedTemplates] = useState(true)
  const [savedTemplateSearch, setSavedTemplateSearch] = useState('')
  const [savedTemplateKindFilter, setSavedTemplateKindFilter] = useState<'all' | 'marketing' | 'transactional'>('all')
  const [validationError, setValidationError] = useState<string | null>(null)

  // Fetch verified domains for sender dropdown
  const { data: domainsRes } = useDomainsQuery()
  const domains = useMemo(() => domainsRes?.data || [], [domainsRes])
  const verifiedDomains = useMemo(() => domains.filter((d) => d.is_verified), [domains])

  // Fetch saved templates from Template section
  const {
    data: templatesRes,
    isLoading: templatesLoading,
    refetch: refetchTemplates,
  } = useTemplatesQuery({ page_size: 100 })

  const savedTemplates: TemplateItem[] = useMemo(() => {
    const raw = templatesRes?.data
    if (Array.isArray(raw)) return raw
    if (raw && typeof raw === 'object' && Array.isArray((raw as any).items)) {
      return (raw as any).items
    }
    return []
  }, [templatesRes])

  const filteredSavedTemplates = useMemo(() => {
    const q = savedTemplateSearch.toLowerCase().trim()
    return savedTemplates.filter((tpl) => {
      if (savedTemplateKindFilter !== 'all' && tpl.kind !== savedTemplateKindFilter) return false
      if (!q) return true
      return (
        tpl.name?.toLowerCase().includes(q) ||
        tpl.subject?.toLowerCase().includes(q) ||
        tpl.kind?.toLowerCase().includes(q)
      )
    })
  }, [savedTemplates, savedTemplateSearch, savedTemplateKindFilter])

  const handleSelectSavedTemplate = (tpl: TemplateItem) => {
    let nextBlocks: EmailBlock[] = []
    if (Array.isArray(tpl.design) && tpl.design.length > 0) {
      nextBlocks = tpl.design as EmailBlock[]
    } else if (tpl.html && tpl.html.trim()) {
      const matched = EMAIL_TEMPLATES.find(
        (t) =>
          t.html.trim() === tpl.html.trim() ||
          (t.id && tpl.html.includes(t.id)) ||
          (t.name && tpl.html.includes(t.name))
      )
      nextBlocks = matched ? getBlocksForPreset(matched) : convertHtmlToEmailBlocks(tpl.html)
    }

    const nextHtml =
      tpl.html && tpl.html.trim()
        ? tpl.html
        : nextBlocks.length > 0
        ? compileBlocksToHtml(nextBlocks)
        : ''

    setSelectedSavedTemplateId(tpl.id)
    setDesignState(nextBlocks.length > 0 ? nextBlocks : null)
    setHtmlContent(nextHtml)
    if (!subject.trim() && tpl.subject) {
      setSubject(tpl.subject)
    }
    setTemplateKey((k) => k + 1)
    onAction(`Loaded template “${tpl.name}” into editor.`)
  }

  const handleSwitchDesignMode = (targetMode: 'visual_builder' | 'rich_code') => {
    if (targetMode === editorType) return

    if (targetMode === 'visual_builder' && editorType === 'rich_code') {
      let targetBlocks: EmailBlock[] = []
      if (designState && Array.isArray(designState) && designState.length > 0) {
        targetBlocks = designState
      } else if (htmlContent && htmlContent.trim()) {
        const matched = EMAIL_TEMPLATES.find(
          (t) =>
            t.html.trim() === htmlContent.trim() ||
            (t.id && htmlContent.includes(t.id)) ||
            (t.name && htmlContent.includes(t.name)) ||
            (t.subject && htmlContent.includes(t.subject))
        )
        targetBlocks = matched ? getBlocksForPreset(matched) : convertHtmlToEmailBlocks(htmlContent)
      }
      setDesignState(targetBlocks.length > 0 ? targetBlocks : null)
      setTemplateKey((k) => k + 1)
    } else if (targetMode === 'rich_code' && editorType === 'visual_builder') {
      if (designState && Array.isArray(designState) && designState.length > 0) {
        setHtmlContent(compileBlocksToHtml(designState))
      } else {
        setHtmlContent('')
      }
    }

    setEditorType(targetMode)
  }

  // Fetch available tags from contacts
  const [availableTags, setAvailableTags] = useState<string[]>([])
  useEffect(() => {
    contactsApi
      .listTags()
      .then((res) => {
        if (Array.isArray(res?.data)) setAvailableTags(res.data)
      })
      .catch(() => {})
  }, [])

  // Auto-set default fromEmail when verified domains load
  useEffect(() => {
    if (!fromEmail && verifiedDomains.length > 0) {
      setFromEmail(`hello@${verifiedDomains[0].name}`)
    }
  }, [verifiedDomains, fromEmail])

  // Mutations
  const createCampaignMutation = useCreateCampaignMutation()
  const sendCampaignMutation = useSendCampaignMutation()

  // Validate step before proceeding
  const handleNextStep = () => {
    setValidationError(null)
    if (step === 0) {
      if (!name.trim()) {
        setValidationError('Please enter a campaign name.')
        return
      }
      if (!subject.trim()) {
        setValidationError('Please enter an email subject line.')
        return
      }
      if (!fromEmail.trim()) {
        setValidationError('Please specify a sender from email address.')
        return
      }
    }
    setStep(step + 1)
  }

  // Save as Draft
  const handleSaveDraft = async () => {
    setValidationError(null)
    const finalHtml =
      editorType === 'visual_builder' && Array.isArray(designState) && designState.length > 0
        ? compileBlocksToHtml(designState)
        : htmlContent
    try {
      const payload: CampaignRequestPayload = {
        name: name.trim() || 'Untitled Campaign',
        subject: subject.trim() || undefined,
        from_name: fromName.trim() || undefined,
        from_email: fromEmail.trim() || undefined,
        reply_to: replyTo.trim() || undefined,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        html: finalHtml || '<p>Default campaign message content.</p>',
        text: textContent || undefined,
      }
      const res = await createCampaignMutation.mutateAsync(payload)
      onAction(`“${name}” saved as draft.`)
      window.location.href = '/app/campaigns'
    } catch (err: any) {
      setValidationError(err?.message || 'Failed to save campaign draft.')
    }
  }

  // Send Immediately
  const handleSendNow = async () => {
    setValidationError(null)
    const finalHtml =
      editorType === 'visual_builder' && Array.isArray(designState) && designState.length > 0
        ? compileBlocksToHtml(designState)
        : htmlContent
    try {
      const payload: CampaignRequestPayload = {
        name: name.trim() || 'Untitled Campaign',
        subject: subject.trim() || undefined,
        from_name: fromName.trim() || undefined,
        from_email: fromEmail.trim() || undefined,
        reply_to: replyTo.trim() || undefined,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        html: finalHtml || '<p>Default campaign message content.</p>',
        text: textContent || undefined,
      }
      const created = await createCampaignMutation.mutateAsync(payload)
      const campaignId = created?.data?.id
      if (campaignId) {
        await sendCampaignMutation.mutateAsync(campaignId)
        onAction(`“${name}” is now being broadcast to your audience.`)
      } else {
        onAction(`“${name}” saved.`)
      }
      window.location.href = '/app/campaigns'
    } catch (err: any) {
      setValidationError(err?.message || 'Failed to launch campaign.')
    }
  }

  const isSaving = createCampaignMutation.isPending || sendCampaignMutation.isPending

  return (
    <div className="campaign-builder-page">
      <div className="page-heading-row">
        <div>
          <div className="page-eyebrow">
            CAMPAIGNS <span>/</span> NEW CAMPAIGN
          </div>
          <h1>Create an Email Campaign</h1>
          <p>Configure audience, design your content, and broadcast reliably.</p>
        </div>
        <Link className="button button-secondary" href="/app/campaigns">
          <ArrowLeft size={14} /> Back to campaigns
        </Link>
      </div>

      {/* Stepper Header */}
      <div className="campaign-stepper">
        {labels.map((label, index) => (
          <button
            key={label}
            type="button"
            className={index === step ? 'step-current' : index < step ? 'step-complete' : ''}
            onClick={() => index <= step && setStep(index)}
          >
            <span>{index < step ? <Check size={14} /> : `0${index + 1}`}</span>
            <b>{label}</b>
          </button>
        ))}
      </div>

      {/* Validation alert */}
      {validationError && (
        <div
          style={{
            margin: '12px 0 16px',
            padding: '12px 16px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fee2e2',
            borderRadius: '8px',
            color: '#b91c1c',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <AlertCircle size={16} />
          <span>{validationError}</span>
        </div>
      )}

      {/* Main Card */}
      <section className={`builder-card ${step === 2 ? 'builder-card-fullscreen' : ''}`}>
        <div className={`builder-main ${step === 2 ? 'builder-main-fullscreen' : ''}`}>
          <div className="eyebrow">STEP 0{step + 1} OF 04</div>
          <h2>{labels[step]}</h2>
          <p>
            {step === 0
              ? 'Give this campaign a title, subject line, and choose your verified sender.'
              : step === 1
              ? 'Select audience tags to target specific subscriber segments.'
              : step === 2
              ? 'Design your broadcast message using the visual email editor.'
              : 'Review your complete campaign configuration before launch.'}
          </p>

          {/* STEP 0: DETAILS */}
          {step === 0 && (
            <div className="builder-fields">
              <label>
                Campaign name *
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. November Product Launch"
                />
              </label>

              <label>
                Subject line *
                <input
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Introducing our newest features & updates"
                />
              </label>

              <label>
                From Name
                <input
                  value={fromName}
                  onChange={(e) => setFromName(e.target.value)}
                  placeholder="Sender name"
                />
              </label>

              <label>
                From Email Address *
                {verifiedDomains.length > 0 ? (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="email"
                      required
                      value={fromEmail}
                      onChange={(e) => setFromEmail(e.target.value)}
                      placeholder="hello@yourdomain.com"
                      style={{ flex: 1 }}
                    />
                    <select
                      style={{ width: '180px' }}
                      aria-label="Pick verified domain"
                      onChange={(e) => {
                        if (e.target.value) {
                          setFromEmail(`hello@${e.target.value}`)
                        }
                      }}
                    >
                      <option value="">Verified domains</option>
                      {verifiedDomains.map((d) => (
                        <option key={d.id} value={d.name}>
                          @{d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <input
                    type="email"
                    required
                    value={fromEmail}
                    onChange={(e) => setFromEmail(e.target.value)}
                    placeholder="support@metrovps.com"
                  />
                )}
              </label>

              <label style={{ gridColumn: '1 / -1' }}>
                Reply-To Email (Optional)
                <input
                  type="email"
                  value={replyTo}
                  onChange={(e) => setReplyTo(e.target.value)}
                  placeholder="replies@yourdomain.com"
                />
              </label>
            </div>
          )}

          {/* STEP 1: AUDIENCE & TAGS */}
          {step === 1 && (
            <div style={{ marginTop: '20px' }}>
              <div style={{ marginBottom: '16px' }}>
                <b style={{ color: '#0f172a', fontSize: '14px' }}>Target Subscribers by Tags:</b>
                <p style={{ margin: '4px 0 12px', color: '#64748b', fontSize: '13px' }}>
                  If no tags are selected, the campaign will be delivered to all subscribed contacts in your workspace.
                </p>
              </div>

              {availableTags.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
                  {availableTags.map((tag) => {
                    const isSelected = selectedTags.includes(tag)
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setSelectedTags(selectedTags.filter((t) => t !== tag))
                          } else {
                            setSelectedTags([...selectedTags, tag])
                          }
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '7px 14px',
                          borderRadius: '8px',
                          border: isSelected ? '1px solid #2563eb' : '1px solid #cbd5e1',
                          backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
                          color: isSelected ? '#1d4ed8' : '#334155',
                          fontSize: '13px',
                          fontWeight: 500,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <Tag size={13} color={isSelected ? '#2563eb' : '#64748b'} />
                        <span>{tag}</span>
                        {isSelected && <Check size={13} />}
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div
                  style={{
                    padding: '24px',
                    textAlign: 'center',
                    backgroundColor: '#f8fafc',
                    borderRadius: '8px',
                    border: '1px dashed #cbd5e1',
                    marginBottom: '20px',
                  }}
                >
                  <Users size={24} color="#64748b" style={{ margin: '0 auto 8px' }} />
                  <p style={{ margin: 0, color: '#475569', fontSize: '13.5px' }}>
                    All active subscribers will receive this campaign.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: EMAIL DESIGN */}
          {step === 2 && (
            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Design Toolbar: Mode Switcher + Saved Templates Toggle */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  padding: '12px 16px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                }}
              >
                <div className="builder-mode-switcher-tabs">
                  <button
                    type="button"
                    className={`mode-tab-btn ${editorType === 'visual_builder' ? 'active' : ''}`}
                    onClick={() => handleSwitchDesignMode('visual_builder')}
                  >
                    <LayoutTemplate size={14} /> Visual Drag &amp; Drop Builder
                  </button>
                  <button
                    type="button"
                    className={`mode-tab-btn ${editorType === 'rich_code' ? 'active' : ''}`}
                    onClick={() => handleSwitchDesignMode('rich_code')}
                  >
                    <Code2 size={14} /> Rich Text &amp; HTML Code
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {selectedSavedTemplateId && (
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        color: '#1d4ed8',
                        backgroundColor: '#eff6ff',
                        border: '1px solid #bfdbfe',
                        padding: '4px 10px',
                        borderRadius: '999px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                      }}
                    >
                      <Check size={12} />
                      {savedTemplates.find((t) => t.id === selectedSavedTemplateId)?.name || 'Template Loaded'}
                    </span>
                  )}
                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={() => setShowSavedTemplates((prev) => !prev)}
                  >
                    <FileText size={14} />
                    <span>
                      {showSavedTemplates
                        ? `Hide Saved Templates (${savedTemplates.length})`
                        : `Saved Templates (${savedTemplates.length})`}
                    </span>
                  </button>
                </div>
              </div>

              {/* Saved Templates Selector List */}
              {showSavedTemplates && (
                <div
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    backgroundColor: '#ffffff',
                    padding: '16px',
                    boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px',
                      marginBottom: '12px',
                    }}
                  >
                    <div>
                      <strong style={{ display: 'block', fontSize: '14.5px', color: '#0f172a' }}>
                        Saved Templates Library
                      </strong>
                      <small style={{ fontSize: '12.5px', color: '#64748b' }}>
                        Select any saved template from your Templates section to load and customize it in the editor below.
                      </small>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <div style={{ position: 'relative' }}>
                        <Search
                          size={13}
                          style={{
                            position: 'absolute',
                            left: '10px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#94a3b8',
                          }}
                        />
                        <input
                          type="text"
                          placeholder="Search saved templates…"
                          value={savedTemplateSearch}
                          onChange={(e) => setSavedTemplateSearch(e.target.value)}
                          style={{
                            padding: '6px 10px 6px 28px',
                            fontSize: '12.5px',
                            border: '1px solid #cbd5e1',
                            borderRadius: '7px',
                            minWidth: '190px',
                          }}
                        />
                      </div>

                      <select
                        value={savedTemplateKindFilter}
                        onChange={(e) =>
                          setSavedTemplateKindFilter(e.target.value as 'all' | 'marketing' | 'transactional')
                        }
                        style={{
                          padding: '6px 10px',
                          fontSize: '12.5px',
                          border: '1px solid #cbd5e1',
                          borderRadius: '7px',
                          backgroundColor: '#ffffff',
                        }}
                      >
                        <option value="all">All categories</option>
                        <option value="marketing">Marketing</option>
                        <option value="transactional">Transactional</option>
                      </select>

                      <button
                        type="button"
                        className="button button-secondary button-sm"
                        onClick={() => refetchTemplates()}
                        title="Refresh saved templates"
                      >
                        <RefreshCw size={13} />
                      </button>
                    </div>
                  </div>

                  {templatesLoading ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                      <Loader2 size={18} className="animate-spin mx-auto mb-2 text-blue-600" />
                      Loading saved templates…
                    </div>
                  ) : filteredSavedTemplates.length === 0 ? (
                    <div
                      style={{
                        padding: '20px',
                        textAlign: 'center',
                        backgroundColor: '#f8fafc',
                        borderRadius: '8px',
                        border: '1px dashed #cbd5e1',
                        color: '#64748b',
                        fontSize: '13px',
                      }}
                    >
                      {savedTemplates.length === 0
                        ? 'No saved templates yet. Create templates in the Templates section or design directly below.'
                        : 'No saved templates match your search filter.'}
                    </div>
                  ) : (
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                        gap: '10px',
                        maxHeight: '240px',
                        overflowY: 'auto',
                        paddingRight: '2px',
                      }}
                    >
                      {filteredSavedTemplates.map((tpl) => {
                        const isSelected = selectedSavedTemplateId === tpl.id
                        return (
                          <button
                            key={tpl.id}
                            type="button"
                            onClick={() => handleSelectSavedTemplate(tpl)}
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                              gap: '8px',
                              padding: '12px 14px',
                              borderRadius: '9px',
                              border: isSelected ? '1.5px solid #2563eb' : '1px solid #e2e8f0',
                              backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
                              cursor: 'pointer',
                              textAlign: 'left',
                              transition: 'border-color 0.15s ease, background-color 0.15s ease',
                            }}
                          >
                            <div style={{ width: '100%' }}>
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  gap: '6px',
                                  marginBottom: '4px',
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: '10.5px',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    padding: '2px 7px',
                                    borderRadius: '999px',
                                    backgroundColor:
                                      tpl.kind === 'transactional' ? '#f0fdf4' : '#eef2ff',
                                    color: tpl.kind === 'transactional' ? '#15803d' : '#4338ca',
                                  }}
                                >
                                  {tpl.kind || 'marketing'}
                                </span>
                                <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>
                                  v{tpl.version || 1}
                                </span>
                              </div>
                              <strong
                                style={{
                                  display: 'block',
                                  fontSize: '13.5px',
                                  color: '#0f172a',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {tpl.name}
                              </strong>
                              <small
                                style={{
                                  display: 'block',
                                  fontSize: '12px',
                                  color: '#64748b',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  marginTop: '2px',
                                }}
                              >
                                {tpl.subject || 'No subject line'}
                              </small>
                            </div>

                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                width: '100%',
                                paddingTop: '6px',
                                borderTop: '1px solid #f1f5f9',
                                fontSize: '12px',
                                fontWeight: 600,
                                color: isSelected ? '#1d4ed8' : '#2563eb',
                              }}
                            >
                              <span>{isSelected ? 'Loaded in Editor' : 'Use & Edit Template'}</span>
                              {isSelected ? <Check size={13} /> : <ArrowRight size={13} />}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Active Email Designer: Visual Drag & Drop Builder OR Rich Text & HTML Code */}
              {editorType === 'visual_builder' ? (
                <VisualEmailBuilder
                  key={`campaign_visual_${selectedSavedTemplateId || 'custom'}_${templateKey}`}
                  initialDesign={designState}
                  initialHtml={htmlContent}
                  onChange={({ html, design }) => {
                    setHtmlContent(html)
                    setDesignState(design)
                  }}
                  onAction={onAction}
                />
              ) : (
                <div className="template-editor-frame">
                  <EmailEditor
                    key={`campaign_rich_${selectedSavedTemplateId || 'custom'}_${templateKey}`}
                    onAction={onAction}
                    subject={subject || name}
                    startEmpty={!htmlContent}
                    initialHtml={htmlContent || undefined}
                    initialPlainText={textContent || undefined}
                    onChange={({ html, text }) => {
                      setHtmlContent(html)
                      setTextContent(text)
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {/* STEP 3: REVIEW & LAUNCH */}
          {step === 3 && (
            <div style={{ marginTop: '20px' }}>
              <div className="review-summary">
                <div>
                  <span>Campaign Name</span>
                  <b>{name || 'Untitled Campaign'}</b>
                </div>
                <div>
                  <span>Subject Line</span>
                  <b>{subject || 'No subject'}</b>
                </div>
                <div>
                  <span>Sender Address</span>
                  <b>{fromName ? `${fromName} <${fromEmail}>` : fromEmail}</b>
                </div>
                <div>
                  <span>Audience</span>
                  <b>
                    {selectedTags.length > 0 ? `Tags: ${selectedTags.join(', ')}` : 'All Workspace Contacts'}
                  </b>
                </div>
                <div>
                  <span>Content</span>
                  <b>{htmlContent ? `${htmlContent.length} bytes HTML prepared` : 'Ready'}</b>
                </div>
              </div>

              <div
                style={{
                  padding: '14px 16px',
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '8px',
                  marginTop: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <Check size={18} color="#15803d" />
                <span style={{ color: '#15803d', fontSize: '13.5px', fontWeight: 500 }}>
                  All requirements verified. You can save this campaign as a draft or broadcast it immediately.
                </span>
              </div>
            </div>
          )}

          {/* Wizard Actions Footer */}
          <div className="builder-actions" style={{ marginTop: '24px' }}>
            {step > 0 && (
              <button
                type="button"
                className="button button-secondary"
                disabled={isSaving}
                onClick={() => setStep(step - 1)}
              >
                Back
              </button>
            )}
            <span />
            {step < 3 ? (
              <button type="button" className="button button-primary" onClick={handleNextStep}>
                Continue <ArrowRight size={15} />
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  className="button button-secondary"
                  disabled={isSaving}
                  onClick={handleSaveDraft}
                >
                  {createCampaignMutation.isPending ? (
                    <>
                      <Loader2 size={14} className="spin" /> Saving…
                    </>
                  ) : (
                    'Save as draft'
                  )}
                </button>
                <button
                  type="button"
                  className="button button-primary"
                  disabled={isSaving}
                  onClick={handleSendNow}
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={14} className="spin" /> Sending…
                    </>
                  ) : (
                    <>
                      <Send size={15} /> Send campaign now
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Wizard Sidebar Tip */}
        {step !== 2 && (
          <aside className="builder-aside">
            <span className="builder-aside-icon">
              <Sparkles size={18} />
            </span>
            <h3>Deliver thoughtful email.</h3>
            <p>
              Targeting subscribers by tags yields up to 40% higher open rates. Make sure your sending domain is verified for maximum deliverability.
            </p>
            <div className="builder-aside-tip">
              <Globe2 size={15} />
              <span>
                <b>Verified Domains</b>
                <small>{verifiedDomains.length} domains active in workspace</small>
              </span>
            </div>
            <Link href="/app/domains" className="text-link">
              Manage domains <ArrowRight size={13} />
            </Link>
          </aside>
        )}
      </section>
    </div>
  )
}

/* =========================================================================
   CAMPAIGN REPORT VIEW (/app/campaigns/{id}/report)
   ========================================================================= */
function CampaignReportView({
  campaignId,
  onAction,
}: {
  campaignId: string
  onAction: (msg: string) => void
}) {
  const { data: campaignRes, isLoading, error, refetch } = useCampaignByIdQuery(campaignId)
  const campaign = campaignRes?.data

  const reRunMutation = useReRunCampaignMutation()
  const sendMutation = useSendCampaignMutation()

  const handleReRun = async () => {
    if (!campaign) return
    try {
      await reRunMutation.mutateAsync(campaign.id)
      onAction(`“${campaign.name}” re-run scheduled.`)
      refetch()
    } catch (err: any) {
      onAction(`Failed to re-run: ${err?.message || 'Error'}`)
    }
  }

  const handleSend = async () => {
    if (!campaign) return
    try {
      await sendMutation.mutateAsync(campaign.id)
      onAction(`“${campaign.name}” sent!`)
      refetch()
    } catch (err: any) {
      onAction(`Failed to send: ${err?.message || 'Error'}`)
    }
  }

  if (isLoading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center' }}>
        <Loader2 size={24} className="spin" style={{ margin: '0 auto 12px', color: '#2563eb' }} />
        <p style={{ color: '#64748b' }}>Loading campaign report…</p>
      </div>
    )
  }

  if (error || !campaign) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <AlertCircle size={32} color="#dc2626" style={{ margin: '0 auto 12px' }} />
        <h2 style={{ fontSize: '18px', color: '#0f172a' }}>Campaign Not Found</h2>
        <p style={{ color: '#64748b', marginBottom: '20px' }}>
          {error?.message || 'The requested campaign could not be retrieved.'}
        </p>
        <Link href="/app/campaigns" className="button button-primary">
          <ArrowLeft size={14} /> Back to campaigns
        </Link>
      </div>
    )
  }

  const stats = campaign.stats || {}
  const totalSent = stats.total ?? stats.sent ?? 0
  const delivered = stats.delivered ?? 0
  const opened = stats.opened ?? 0
  const clicked = stats.clicked ?? 0
  const bounced = stats.bounced ?? 0
  const failed = stats.failed ?? 0

  const deliveryRate = totalSent > 0 ? Math.round((delivered / totalSent) * 100) : 100
  const openRate = delivered > 0 ? Math.round((opened / delivered) * 100) : 0
  const clickRate = opened > 0 ? Math.round((clicked / opened) * 100) : 0

  return (
    <>
      <div className="page-heading-row">
        <div>
          <div className="page-eyebrow">
            <Link href="/app/campaigns">CAMPAIGNS</Link> <span>/</span> REPORT
          </div>
          <h1>{campaign.name}</h1>
          <p>
            Subject: <b>{campaign.subject || '—'}</b> · Sent {formatDate(campaign.sent_at || campaign.created_at)}
          </p>
        </div>
        <div className="page-heading-actions">
          <Link href="/app/campaigns" className="button button-secondary">
            <ArrowLeft size={14} /> All campaigns
          </Link>
          {campaign.status === 'draft' ? (
            <button
              type="button"
              className="button button-primary"
              disabled={sendMutation.isPending}
              onClick={handleSend}
            >
              {sendMutation.isPending ? <Loader2 size={14} className="spin" /> : <Send size={14} />}
              <span>Send campaign</span>
            </button>
          ) : (
            <button
              type="button"
              className="button button-secondary"
              disabled={reRunMutation.isPending}
              onClick={handleReRun}
            >
              {reRunMutation.isPending ? <Loader2 size={14} className="spin" /> : <RotateCw size={14} />}
              <span>Re-run campaign</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Grid */}
      <section className="analytics-metrics" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        <article className="stat-card" style={{ padding: '16px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
          <div style={{ color: '#64748b', fontSize: '13px', marginBottom: '6px' }}>Total Sent</div>
          <b style={{ fontSize: '24px', color: '#0f172a' }}>{totalSent.toLocaleString()}</b>
          <div style={{ color: '#15803d', fontSize: '12px', marginTop: '4px' }}>
            {deliveryRate}% delivered
          </div>
        </article>
        <article className="stat-card" style={{ padding: '16px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
          <div style={{ color: '#64748b', fontSize: '13px', marginBottom: '6px' }}>Delivered</div>
          <b style={{ fontSize: '24px', color: '#059669' }}>{delivered.toLocaleString()}</b>
          <div style={{ color: '#64748b', fontSize: '12px', marginTop: '4px' }}>
            {bounced} bounced
          </div>
        </article>
        <article className="stat-card" style={{ padding: '16px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
          <div style={{ color: '#64748b', fontSize: '13px', marginBottom: '6px' }}>Opens (Rate)</div>
          <b style={{ fontSize: '24px', color: '#2563eb' }}>{openRate}%</b>
          <div style={{ color: '#64748b', fontSize: '12px', marginTop: '4px' }}>
            {opened.toLocaleString()} total opens
          </div>
        </article>
        <article className="stat-card" style={{ padding: '16px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
          <div style={{ color: '#64748b', fontSize: '13px', marginBottom: '6px' }}>Clicks (Rate)</div>
          <b style={{ fontSize: '24px', color: '#7c3aed' }}>{clickRate}%</b>
          <div style={{ color: '#64748b', fontSize: '12px', marginTop: '4px' }}>
            {clicked.toLocaleString()} link clicks
          </div>
        </article>
      </section>

      {/* Campaign Details & HTML Preview Card */}
      <section className="data-panel" style={{ padding: '24px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
        <h2 style={{ fontSize: '16px', margin: '0 0 16px', color: '#0f172a' }}>Message Preview</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '20px', fontSize: '13.5px' }}>
          <div>
            <span style={{ color: '#64748b' }}>From: </span>
            <b>{campaign.from_name ? `${campaign.from_name} <${campaign.from_email}>` : campaign.from_email || '—'}</b>
          </div>
          <div>
            <span style={{ color: '#64748b' }}>Status: </span>
            <b style={{ textTransform: 'capitalize' }}>{campaign.status}</b>
          </div>
          <div>
            <span style={{ color: '#64748b' }}>Subject: </span>
            <b>{campaign.subject || '—'}</b>
          </div>
          <div>
            <span style={{ color: '#64748b' }}>Target Tags: </span>
            <b>{Array.isArray(campaign.tags) && campaign.tags.length > 0 ? campaign.tags.join(', ') : 'All audience'}</b>
          </div>
        </div>

        {campaign.html ? (
          <div
            style={{
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '24px',
              backgroundColor: '#f8fafc',
              maxHeight: '500px',
              overflowY: 'auto',
            }}
            dangerouslySetInnerHTML={{ __html: campaign.html }}
          />
        ) : (
          <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '8px' }}>
            No HTML content preview available for this campaign.
          </div>
        )}
      </section>
    </>
  )
}
