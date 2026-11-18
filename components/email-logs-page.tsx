'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Filter,
  Mail,
  RefreshCw,
  Search,
  Send,
  Server,
  XCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { StatusBadge } from '@/components/status-badge'
import { useMailsQuery } from '@/lib/hooks/use-mails-query'
import type { MailItem } from '@/lib/api/mails'
import { formatApiErrorMessage } from '@/lib/api-client'

export function EmailLogsPage({
  route,
  onAction,
}: {
  route: string
  onAction: (message: string) => void
}) {
  const { data: mailsResponse, isLoading, isError, error, refetch, isFetching } = useMailsQuery()
  const allMails = mailsResponse?.data ?? []

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
      total: allMails.length,
      delivered,
      pending,
      failed,
    }
  }, [allMails])

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
                    <th>Status</th>
                    <th>Recipient &amp; Subject</th>
                    <th>From Address</th>
                    <th>Node</th>
                    <th>Events</th>
                    <th>Created At</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMails.map((mail) => {
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

                    return (
                      <tr
                        key={mail.id}
                        style={{ cursor: 'pointer' }}
                        onClick={(e) => {
                          const target = e.target as HTMLElement
                          if (target.closest('a') || target.closest('button')) return
                          window.location.href = `/app/logs/${mail.id}`
                        }}
                      >
                        <td>
                          <StatusBadge status={mail.status || 'pending'} />
                        </td>
                        <td>
                          <div className="log-subject-cell">
                            <span className="log-to-addr">
                              <Mail size={13} /> {toDisplay}
                            </span>
                            <b className="log-subject-title">{mail.subject || '(No subject)'}</b>
                          </div>
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
                        <td>
                          <span className="event-date-text">{dateDisplay}</span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <Link
                            href={`/app/logs/${mail.id}`}
                            className="button button-secondary button-sm"
                            aria-label={`View details for ${mail.id}`}
                          >
                            Details <ArrowRight size={13} />
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="mobile-data-cards">
              {filteredMails.map((mail) => {
                const toDisplay = Array.isArray(mail.to) ? mail.to.join(', ') : mail.to
                const dateDisplay = mail.created_at
                  ? new Date(mail.created_at).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '—'

                return (
                  <article className="mobile-data-card" key={mail.id}>
                    <div className="mobile-card-top">
                      <div>
                        <b>{toDisplay}</b>
                        <small>{mail.subject || '(No subject)'}</small>
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
          </>
        )}
      </section>
    </>
  )
}
