'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  CreditCard,
  Globe2,
  Loader2,
  Mail,
  Package,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  X,
  XCircle,
} from 'lucide-react'
import { StatusBadge } from '@/components/status-badge'
import { TablePagination } from '@/components/table-pagination'
import { formatApiErrorMessage } from '@/lib/api-client'
import type { PackageItem, PackageRequestItem } from '@/lib/api/packages'
import {
  useCancelPackageRequestMutation,
  usePackageRequestsQuery,
  usePackagesQuery,
  useRequestPackageMutation,
  useSubscriptionQuery,
} from '@/lib/hooks/use-packages-query'

function formatPrice(price: number): string {
  if (!price || price <= 0) return 'Free'
  return `৳${price.toLocaleString()}`
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

export function PackagesManagement({
  onAction,
}: {
  route?: string
  onAction: (message: string) => void
}) {
  // Modals state
  const [requestTarget, setRequestTarget] = useState<PackageItem | null>(null)
  const [requestNote, setRequestNote] = useState('')
  const [requestFormError, setRequestFormError] = useState<string | null>(null)

  const [cancelTarget, setCancelTarget] = useState<PackageRequestItem | null>(null)
  const [cancelError, setCancelError] = useState<string | null>(null)

  // Pagination for request history table
  const [historyPagination, setHistoryPagination] = useState({ pageIndex: 0, pageSize: 10 })

  // Queries
  const {
    data: packagesRes,
    isLoading: packagesLoading,
    isFetching: packagesFetching,
    isError: packagesIsError,
    error: packagesError,
    refetch: refetchPackages,
  } = usePackagesQuery()

  const {
    data: subscriptionRes,
    isLoading: subscriptionLoading,
    isFetching: subscriptionFetching,
    isError: subscriptionIsError,
    error: subscriptionError,
    refetch: refetchSubscription,
  } = useSubscriptionQuery()

  const {
    data: requestsRes,
    isLoading: requestsLoading,
    isFetching: requestsFetching,
    refetch: refetchRequests,
  } = usePackageRequestsQuery()

  // Mutations
  const requestPackageMutation = useRequestPackageMutation()
  const cancelRequestMutation = useCancelPackageRequestMutation()

  const packagesList: PackageItem[] = useMemo(() => {
    return Array.isArray(packagesRes?.data) ? packagesRes.data : []
  }, [packagesRes])

  const subscription = subscriptionRes?.data
  const currentPackage = subscription?.package || null
  const domainsUsed = typeof subscription?.domains_used === 'number' ? subscription.domains_used : 0
  const pendingRequest = subscription?.pending_request || null

  const requestsList: PackageRequestItem[] = useMemo(() => {
    return Array.isArray(requestsRes?.data) ? requestsRes.data : []
  }, [requestsRes])

  const paginatedRequests = useMemo(() => {
    const start = historyPagination.pageIndex * historyPagination.pageSize
    return requestsList.slice(start, start + historyPagination.pageSize)
  }, [requestsList, historyPagination])

  const isRefreshing = packagesFetching || subscriptionFetching || requestsFetching
  const isInitialLoading = packagesLoading || subscriptionLoading

  const domainLimit = currentPackage?.domain_limit || 1
  const domainUsagePct = Math.min(100, Math.round((domainsUsed / Math.max(1, domainLimit)) * 100))

  // Close modals on Escape
  useEffect(() => {
    if (!requestTarget && !cancelTarget) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (requestTarget && !requestPackageMutation.isPending) setRequestTarget(null)
        if (cancelTarget && !cancelRequestMutation.isPending) setCancelTarget(null)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [
    requestTarget,
    cancelTarget,
    requestPackageMutation.isPending,
    cancelRequestMutation.isPending,
  ])

  const handleRefreshAll = () => {
    refetchPackages()
    refetchSubscription()
    refetchRequests()
    onAction('Packages and subscription status refreshed.')
  }

  const handleOpenRequestModal = (pkg: PackageItem) => {
    setRequestTarget(pkg)
    setRequestNote('')
    setRequestFormError(null)
  }

  const handleSubmitRequestPackage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!requestTarget) return
    setRequestFormError(null)

    try {
      const res = await requestPackageMutation.mutateAsync({
        package: requestTarget.id,
        note: requestNote.trim() || undefined,
      })
      setRequestTarget(null)
      onAction(
        res?.message || "Request sent. We'll switch your package once it's approved."
      )
    } catch (err: any) {
      setRequestFormError(
        formatApiErrorMessage(err, 'Failed to submit package request. Please try again.')
      )
    }
  }

  const handleConfirmCancelRequest = async () => {
    if (!cancelTarget) return
    setCancelError(null)

    try {
      const res = await cancelRequestMutation.mutateAsync(cancelTarget.id)
      setCancelTarget(null)
      onAction(res?.message || 'Request cancelled.')
    } catch (err: any) {
      setCancelError(formatApiErrorMessage(err, 'Failed to cancel package request.'))
    }
  }

  return (
    <>
      {/* Page Heading Row */}
      <div className="page-heading-row">
        <div>
          <div className="page-eyebrow">
            BILLING &amp; QUOTA <span>/</span> PACKAGES &amp; PLANS
          </div>
          <h1>Packages &amp; Plans</h1>
          <p>
            Monitor your active sending quota, compare available plans, and request package
            upgrades.
          </p>
        </div>

        <div className="page-heading-actions">
          <button
            type="button"
            className="button button-secondary"
            onClick={handleRefreshAll}
            disabled={isRefreshing}
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
            <span>{isRefreshing ? 'Refreshing…' : 'Refresh'}</span>
          </button>
          <Link href="/app/domains" className="button button-secondary">
            <Globe2 size={14} />
            <span>Manage domains</span>
          </Link>
        </div>
      </div>

      {/* API Error Alert */}
      {(packagesIsError || subscriptionIsError) && (
        <div className="transactional-error-banner" style={{ marginBottom: '16px' }} role="alert">
          <AlertCircle size={18} />
          <div className="error-body">
            <strong>Could not load package details:</strong>
            <p>
              {formatApiErrorMessage(
                packagesError || subscriptionError,
                'Failed to fetch subscription and packages from server.'
              )}
            </p>
          </div>
          <button
            type="button"
            className="button button-secondary button-sm"
            onClick={handleRefreshAll}
          >
            Retry
          </button>
        </div>
      )}

      {isInitialLoading ? (
        <div
          className="dashboard-panel"
          style={{
            padding: '60px 20px',
            textAlign: 'center',
            color: '#64748b',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <Loader2 size={28} className="animate-spin text-blue-600" />
          <span>Loading your active subscription and packages…</span>
        </div>
      ) : (
        <>
          {/* ================================================================ */}
          {/* ACTIVE SUBSCRIPTION & QUOTA OVERVIEW CARD                        */}
          {/* ================================================================ */}
          {currentPackage && (
            <section
              className="dashboard-panel"
              style={{
                padding: '22px 24px',
                marginBottom: '18px',
                background:
                  'linear-gradient(135deg, rgba(239, 246, 255, 0.75) 0%, rgba(255, 255, 255, 1) 60%)',
                border: '1px solid #dbeafe',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '18px',
                }}
              >
                <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '11px',
                      backgroundColor: '#1374f8',
                      color: '#ffffff',
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0,
                      boxShadow: '0 4px 12px rgba(19, 116, 248, 0.25)',
                    }}
                  >
                    <Package size={21} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 750,
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          color: '#1d4ed8',
                        }}
                      >
                        ACTIVE SUBSCRIPTION
                      </span>
                      <StatusBadge status="Active" />
                    </div>
                    <h2 style={{ margin: '4px 0 4px', fontSize: '22px', color: '#0f172a', fontWeight: 750 }}>
                      {currentPackage.name} Plan{' '}
                      <span style={{ fontSize: '15px', fontWeight: 600, color: '#64748b' }}>
                        · {formatPrice(currentPackage.price)}
                        {currentPackage.price > 0 ? '/mo' : ''}
                      </span>
                    </h2>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '6px' }}>
                      {Array.isArray(currentPackage.features) &&
                        currentPackage.features.map((feat) => (
                          <span
                            key={feat}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              fontSize: '12.5px',
                              color: '#334155',
                              fontWeight: 500,
                            }}
                          >
                            <CheckCircle2 size={13} style={{ color: '#10b981' }} />
                            {feat}
                          </span>
                        ))}
                    </div>
                  </div>
                </div>

                {/* Quota Stats */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
                    gap: '12px',
                    minWidth: 'min(420px, 100%)',
                  }}
                >
                  <div
                    style={{
                      padding: '12px 14px',
                      backgroundColor: '#ffffff',
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '12px',
                        color: '#64748b',
                        marginBottom: '6px',
                      }}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        <Globe2 size={13} /> Sending Domains
                      </span>
                      <strong style={{ color: '#0f172a' }}>
                        {domainsUsed} / {currentPackage.domain_limit}
                      </strong>
                    </div>
                    <div
                      style={{
                        height: '6px',
                        borderRadius: '999px',
                        backgroundColor: '#f1f5f9',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${domainUsagePct}%`,
                          backgroundColor:
                            domainUsagePct >= 100
                              ? '#ef4444'
                              : domainUsagePct >= 75
                              ? '#f59e0b'
                              : '#1374f8',
                          borderRadius: '999px',
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </div>
                  </div>

                  <div
                    style={{
                      padding: '12px 14px',
                      backgroundColor: '#ffffff',
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '12px',
                        color: '#64748b',
                        marginBottom: '4px',
                      }}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        <Mail size={13} /> Monthly Email Quota
                      </span>
                    </div>
                    <strong style={{ fontSize: '18px', color: '#0f172a' }}>
                      {currentPackage.monthly_emails.toLocaleString()}
                    </strong>
                    <small style={{ display: 'block', fontSize: '11.5px', color: '#64748b' }}>
                      emails / month
                    </small>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ================================================================ */}
          {/* PENDING UPGRADE REQUEST BANNER                                   */}
          {/* ================================================================ */}
          {pendingRequest && (
            <section
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '14px',
                padding: '14px 18px',
                marginBottom: '20px',
                backgroundColor: '#fffbeb',
                border: '1px solid #fde68a',
                borderRadius: '11px',
                color: '#92400e',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '11px' }}>
                <Clock3 size={19} style={{ color: '#d97706', marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#78350f' }}>
                    Pending switch to {pendingRequest.package?.name} Plan (
                    {formatPrice(pendingRequest.package?.price || 0)}
                    {(pendingRequest.package?.price || 0) > 0 ? '/mo' : ''})
                  </div>
                  <div style={{ fontSize: '12.5px', marginTop: '2px', color: '#92400e' }}>
                    Submitted on {formatDateTime(pendingRequest.created_at)}
                    {pendingRequest.note ? ` · Note: “${pendingRequest.note}”` : ''}
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="button button-secondary"
                style={{ color: '#b91c1c', borderColor: '#fecaca', backgroundColor: '#ffffff' }}
                onClick={() => {
                  setCancelError(null)
                  setCancelTarget(pendingRequest)
                }}
              >
                <XCircle size={14} />
                <span>Cancel request</span>
              </button>
            </section>
          )}

          {/* ================================================================ */}
          {/* AVAILABLE PACKAGES GRID                                          */}
          {/* ================================================================ */}
          <section style={{ marginBottom: '24px' }}>
            <div style={{ marginBottom: '12px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                Available Packages
              </h2>
              <p style={{ margin: '3px 0 0', fontSize: '13.5px', color: '#64748b' }}>
                Choose the plan that fits your sending volume and domain requirements.
              </p>
            </div>

            {packagesList.length === 0 ? (
              <div
                className="dashboard-panel"
                style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b' }}
              >
                No packages available at the moment.
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
                  gap: '16px',
                }}
              >
                {packagesList.map((pkg) => {
                  const isCurrent = currentPackage?.id === pkg.id
                  const isPendingForThis = pendingRequest?.package?.id === pkg.id
                  const hasOtherPending = Boolean(pendingRequest && !isPendingForThis)

                  return (
                    <article
                      key={pkg.id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        padding: '22px',
                        borderRadius: '14px',
                        backgroundColor: '#ffffff',
                        border: isCurrent
                          ? '2px solid #1374f8'
                          : isPendingForThis
                          ? '2px solid #f59e0b'
                          : '1px solid #e2e8f0',
                        boxShadow: isCurrent
                          ? '0 8px 24px rgba(19, 116, 248, 0.10)'
                          : '0 2px 10px rgba(15, 23, 42, 0.03)',
                        position: 'relative',
                      }}
                    >
                      <div>
                        {/* Card Top Badges */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '8px',
                            marginBottom: '10px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <CreditCard size={17} style={{ color: '#1374f8' }} />
                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 750, color: '#0f172a' }}>
                              {pkg.name}
                            </h3>
                          </div>

                          {isCurrent ? (
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 700,
                                padding: '3px 9px',
                                borderRadius: '999px',
                                backgroundColor: '#eff6ff',
                                color: '#1d4ed8',
                                border: '1px solid #bfdbfe',
                              }}
                            >
                              Current Plan
                            </span>
                          ) : isPendingForThis ? (
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 700,
                                padding: '3px 9px',
                                borderRadius: '999px',
                                backgroundColor: '#fffbeb',
                                color: '#b45309',
                                border: '1px solid #fde68a',
                              }}
                            >
                              Pending Approval
                            </span>
                          ) : pkg.is_default ? (
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 600,
                                padding: '3px 9px',
                                borderRadius: '999px',
                                backgroundColor: '#f1f5f9',
                                color: '#475569',
                              }}
                            >
                              Default
                            </span>
                          ) : (
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 700,
                                padding: '3px 9px',
                                borderRadius: '999px',
                                backgroundColor: '#f0fdf4',
                                color: '#15803d',
                                border: '1px solid #bbf7d0',
                              }}
                            >
                              Upgrade
                            </span>
                          )}
                        </div>

                        {/* Price */}
                        <div style={{ margin: '10px 0 16px', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                          <strong style={{ fontSize: '30px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
                            {formatPrice(pkg.price)}
                          </strong>
                          {pkg.price > 0 && (
                            <span style={{ fontSize: '13.5px', color: '#64748b', fontWeight: 500 }}>
                              / month
                            </span>
                          )}
                        </div>

                        {/* Limits Highlight */}
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '8px',
                            padding: '10px 12px',
                            borderRadius: '10px',
                            backgroundColor: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            marginBottom: '16px',
                          }}
                        >
                          <div>
                            <small style={{ display: 'block', fontSize: '11px', color: '#64748b' }}>
                              Domains
                            </small>
                            <strong style={{ fontSize: '14px', color: '#0f172a' }}>
                              Up to {pkg.domain_limit}
                            </strong>
                          </div>
                          <div>
                            <small style={{ display: 'block', fontSize: '11px', color: '#64748b' }}>
                              Monthly Emails
                            </small>
                            <strong style={{ fontSize: '14px', color: '#0f172a' }}>
                              {pkg.monthly_emails.toLocaleString()}
                            </strong>
                          </div>
                        </div>

                        {/* Features Checklist */}
                        <ul
                          style={{
                            listStyle: 'none',
                            padding: 0,
                            margin: '0 0 20px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                          }}
                        >
                          {Array.isArray(pkg.features) &&
                            pkg.features.map((feature) => (
                              <li
                                key={feature}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  fontSize: '13.5px',
                                  color: '#334155',
                                }}
                              >
                                <Check size={15} style={{ color: '#10b981', flexShrink: 0 }} />
                                <span>{feature}</span>
                              </li>
                            ))}
                        </ul>
                      </div>

                      {/* Card Action Button */}
                      {isCurrent ? (
                        <button
                          type="button"
                          className="button button-secondary"
                          style={{ width: '100%', justifyContent: 'center' }}
                          disabled
                        >
                          <ShieldCheck size={15} />
                          <span>Current Active Plan</span>
                        </button>
                      ) : isPendingForThis && pendingRequest ? (
                        <button
                          type="button"
                          className="button button-secondary"
                          style={{
                            width: '100%',
                            justifyContent: 'center',
                            color: '#b91c1c',
                            borderColor: '#fecaca',
                          }}
                          onClick={() => {
                            setCancelError(null)
                            setCancelTarget(pendingRequest)
                          }}
                        >
                          <XCircle size={15} />
                          <span>Cancel Pending Request</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="button button-primary"
                          style={{ width: '100%', justifyContent: 'center' }}
                          disabled={hasOtherPending}
                          title={
                            hasOtherPending
                              ? 'Cancel your pending request first to request another package'
                              : `Request switch to ${pkg.name}`
                          }
                          onClick={() => handleOpenRequestModal(pkg)}
                        >
                          <Sparkles size={14} />
                          <span>
                            {hasOtherPending
                              ? 'Pending Request Active'
                              : `Request ${pkg.name} Plan`}
                          </span>
                          {!hasOtherPending && <ArrowRight size={14} />}
                        </button>
                      )}
                    </article>
                  )
                })}
              </div>
            )}
          </section>

          {/* ================================================================ */}
          {/* PACKAGE REQUEST HISTORY TABLE                                    */}
          {/* ================================================================ */}
          <section className="data-panel">
            <div className="data-panel-top">
              <div>
                <h2>Package Request History</h2>
                <p>
                  {requestsList.length} {requestsList.length === 1 ? 'request' : 'requests'} submitted
                </p>
              </div>
            </div>

            <div className="desktop-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Requested Package</th>
                    <th>Status</th>
                    <th>Your Note</th>
                    <th>Admin Note</th>
                    <th>Requested At</th>
                    <th>Decided At</th>
                    <th style={{ textAlign: 'right', width: '100px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {requestsLoading ? (
                    <tr>
                      <td colSpan={7} className="table-empty-state" style={{ height: '120px' }}>
                        <Loader2 size={22} className="animate-spin mx-auto text-blue-600" />
                      </td>
                    </tr>
                  ) : paginatedRequests.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="table-empty-state">
                        No package upgrade requests yet.
                      </td>
                    </tr>
                  ) : (
                    paginatedRequests.map((req) => (
                      <tr key={req.id}>
                        <td>
                          <div>
                            <strong style={{ display: 'block', color: '#0f172a' }}>
                              {req.package?.name || 'Package'}{' '}
                              <small style={{ color: '#64748b', fontWeight: 500 }}>
                                ({formatPrice(req.package?.price || 0)})
                              </small>
                            </strong>
                            <small style={{ color: '#64748b', fontSize: '12px' }}>
                              {req.package?.domain_limit} domains ·{' '}
                              {req.package?.monthly_emails?.toLocaleString()} emails/mo
                            </small>
                          </div>
                        </td>
                        <td>
                          <StatusBadge status={req.status} />
                        </td>
                        <td style={{ color: '#334155', fontSize: '13px' }}>
                          {req.note || <span style={{ color: '#94a3b8' }}>—</span>}
                        </td>
                        <td style={{ color: '#334155', fontSize: '13px' }}>
                          {req.admin_note || <span style={{ color: '#94a3b8' }}>—</span>}
                        </td>
                        <td style={{ color: '#64748b', fontSize: '12.5px' }}>
                          {formatDateTime(req.created_at)}
                        </td>
                        <td style={{ color: '#64748b', fontSize: '12.5px' }}>
                          {formatDateTime(req.decided_at)}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {req.status === 'pending' ? (
                            <button
                              type="button"
                              className="button button-secondary button-sm"
                              style={{ color: '#dc2626', borderColor: '#fecaca' }}
                              onClick={() => {
                                setCancelError(null)
                                setCancelTarget(req)
                              }}
                            >
                              Cancel
                            </button>
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: '12px' }}>—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <TablePagination
              pageIndex={historyPagination.pageIndex}
              pageSize={historyPagination.pageSize}
              totalItems={requestsList.length}
              pageSizeOptions={[5, 10, 20]}
              onPageChange={(pageIndex) => setHistoryPagination((prev) => ({ ...prev, pageIndex }))}
              onPageSizeChange={(pageSize) => setHistoryPagination({ pageIndex: 0, pageSize })}
            />
          </section>
        </>
      )}

      {/* ================================================================ */}
      {/* MODAL 1: REQUEST PACKAGE UPGRADE / SWITCH                        */}
      {/* ================================================================ */}
      {requestTarget && (
        <div
          className="dialog-backdrop"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget && !requestPackageMutation.isPending) {
              setRequestTarget(null)
            }
          }}
        >
          <section
            className="action-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="request-pkg-title"
            style={{ width: 'min(480px, 100%)', position: 'relative' }}
          >
            <button
              type="button"
              className="dialog-close"
              aria-label="Close dialog"
              disabled={requestPackageMutation.isPending}
              onClick={() => setRequestTarget(null)}
              style={{ top: '12px', right: '14px', zIndex: 10 }}
            >
              <X size={18} />
            </button>

            <div className="dialog-icon">
              <Sparkles size={19} />
            </div>
            <div className="eyebrow">REQUEST PACKAGE</div>
            <h2 id="request-pkg-title">Switch to {requestTarget.name} Plan</h2>
            <p>
              Submit a request to switch your workspace to <b>{requestTarget.name}</b> (
              {formatPrice(requestTarget.price)}
              {requestTarget.price > 0 ? '/mo' : ''} · {requestTarget.domain_limit} domains ·{' '}
              {requestTarget.monthly_emails.toLocaleString()} emails/mo).
            </p>

            {requestFormError && (
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
                <span>{requestFormError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitRequestPackage} className="dialog-form">
              <label>
                Note for admin (optional)
                <textarea
                  rows={3}
                  placeholder="e.g. Adding two client domains"
                  value={requestNote}
                  onChange={(e) => setRequestNote(e.target.value)}
                  disabled={requestPackageMutation.isPending}
                />
              </label>

              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <button
                  type="button"
                  className="button button-secondary"
                  style={{ flex: 1 }}
                  disabled={requestPackageMutation.isPending}
                  onClick={() => setRequestTarget(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="button button-primary"
                  style={{ flex: 1 }}
                  disabled={requestPackageMutation.isPending}
                >
                  {requestPackageMutation.isPending ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Sending…</span>
                    </>
                  ) : (
                    <span>Send request</span>
                  )}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* ================================================================ */}
      {/* MODAL 2: CANCEL PENDING REQUEST CONFIRMATION                     */}
      {/* ================================================================ */}
      {cancelTarget && (
        <div
          className="dialog-backdrop"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget && !cancelRequestMutation.isPending) {
              setCancelTarget(null)
            }
          }}
        >
          <section
            className="action-dialog action-dialog-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-req-title"
            style={{ width: 'min(420px, 100%)', position: 'relative' }}
          >
            <button
              type="button"
              className="dialog-close"
              aria-label="Close dialog"
              disabled={cancelRequestMutation.isPending}
              onClick={() => setCancelTarget(null)}
              style={{ top: '12px', right: '14px', zIndex: 10 }}
            >
              <X size={18} />
            </button>

            <div className="dialog-icon" style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}>
              <XCircle size={19} />
            </div>
            <div className="eyebrow" style={{ color: '#dc2626' }}>
              CANCEL REQUEST
            </div>
            <h2 id="cancel-req-title">Cancel package request</h2>
            <p>
              Are you sure you want to cancel your pending request for the{' '}
              <b>{cancelTarget.package?.name || 'selected'}</b> plan?
            </p>

            {cancelError && (
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
                <span>{cancelError}</span>
              </div>
            )}

            <div style={{ display: 'flex', gap: '9px', marginTop: '18px' }}>
              <button
                type="button"
                className="button button-secondary"
                style={{ flex: 1 }}
                disabled={cancelRequestMutation.isPending}
                onClick={() => setCancelTarget(null)}
              >
                Keep request
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
                disabled={cancelRequestMutation.isPending}
                onClick={handleConfirmCancelRequest}
              >
                {cancelRequestMutation.isPending ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Cancelling…</span>
                  </>
                ) : (
                  <span>Yes, cancel request</span>
                )}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  )
}
