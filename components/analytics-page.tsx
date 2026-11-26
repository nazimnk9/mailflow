'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  AlertCircle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  Globe2,
  Loader2,
  Mail,
  RefreshCw,
  Search,
  Send,
  TrendingUp,
  XCircle,
} from 'lucide-react'
import { DataExportMenu } from '@/components/data-export-menu'
import { StatusBadge } from '@/components/status-badge'
import { TablePagination } from '@/components/table-pagination'
import { formatApiErrorMessage } from '@/lib/api-client'
import type { MailStatsCounts, MailStatsDays } from '@/lib/api/mails'
import { useMailStatsQuery } from '@/lib/hooks/use-mails-query'

function calcPercentChange(current: number, previous: number): {
  label: string
  positive: boolean
  neutral: boolean
} {
  if (previous === 0 && current === 0) {
    return { label: '0.0%', positive: true, neutral: true }
  }
  if (previous === 0) {
    return { label: '+100.0%', positive: true, neutral: false }
  }
  const pct = ((current - previous) / previous) * 100
  const sign = pct > 0 ? '+' : ''
  return {
    label: `${sign}${pct.toFixed(1)}%`,
    positive: pct >= 0,
    neutral: pct === 0,
  }
}

function calcRate(part: number, total: number): number {
  if (!total || total <= 0) return 0
  return (part / total) * 100
}

function formatShortDate(dateStr: string): string {
  try {
    const d = new Date(`${dateStr}T00:00:00`)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } catch {
    return dateStr
  }
}

const EMPTY_COUNTS: MailStatsCounts = { sent: 0, delivered: 0, bounced: 0, failed: 0 }

export function AnalyticsPage({
  onAction,
  embedded = false,
}: {
  route?: string
  onAction: (message: string) => void
  embedded?: boolean
}) {
  const [days, setDays] = useState<MailStatsDays>(7)
  const [chartType, setChartType] = useState<'area' | 'bar'>('area')
  const [domainSearch, setDomainSearch] = useState('')
  const [dailyPagination, setDailyPagination] = useState({ pageIndex: 0, pageSize: 10 })

  // Series toggles
  const [visibleSeries, setVisibleSeries] = useState({
    sent: true,
    delivered: true,
    bounced: true,
    failed: false,
  })

  const {
    data: statsRes,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useMailStatsQuery(days)

  const stats = statsRes?.data
  const totals = stats?.totals ?? EMPTY_COUNTS
  const previous = stats?.previous ?? EMPTY_COUNTS
  const dailyList = useMemo(() => (Array.isArray(stats?.daily) ? stats.daily : []), [stats])
  const domainsList = useMemo(() => (Array.isArray(stats?.domains) ? stats.domains : []), [stats])

  // Rates
  const deliveryRate = calcRate(totals.delivered, totals.sent)
  const prevDeliveryRate = calcRate(previous.delivered, previous.sent)
  const deliveryRateDelta = deliveryRate - prevDeliveryRate

  const bounceRate = calcRate(totals.bounced, totals.sent)
  const failRate = calcRate(totals.failed, totals.sent)

  // Period-over-period deltas
  const sentDelta = calcPercentChange(totals.sent, previous.sent)
  const deliveredDelta = calcPercentChange(totals.delivered, previous.delivered)
  const bouncedDelta = calcPercentChange(totals.bounced, previous.bounced)
  const failedDelta = calcPercentChange(totals.failed, previous.failed)

  // Chart data with formatted labels
  const chartData = useMemo(() => {
    return dailyList.map((item) => ({
      ...item,
      label: formatShortDate(item.date),
      deliveryRate: Number(calcRate(item.delivered, item.sent).toFixed(1)),
    }))
  }, [dailyList])

  // Filtered domains
  const filteredDomains = useMemo(() => {
    const q = domainSearch.toLowerCase().trim()
    if (!q) return domainsList
    return domainsList.filter((d) => d.name.toLowerCase().includes(q))
  }, [domainsList, domainSearch])

  // Daily breakdown table (newest first)
  const reversedDaily = useMemo(() => [...dailyList].reverse(), [dailyList])
  const paginatedDaily = useMemo(() => {
    const start = dailyPagination.pageIndex * dailyPagination.pageSize
    return reversedDaily.slice(start, start + dailyPagination.pageSize)
  }, [reversedDaily, dailyPagination])

  // Export rows for CSV
  const exportRows = useMemo(() => {
    return dailyList.map((d) => ({
      Date: d.date,
      Sent: d.sent,
      Delivered: d.delivered,
      Bounced: d.bounced,
      Failed: d.failed,
      'Delivery Rate (%)': calcRate(d.delivered, d.sent).toFixed(2),
    }))
  }, [dailyList])

  const toggleSeries = (key: keyof typeof visibleSeries) => {
    setVisibleSeries((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <>
      {/* Page Heading or Embedded Toolbar */}
      {embedded ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '16px',
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
              Delivery Analytics
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#64748b' }}>
              Live delivery performance, bounce &amp; failure trends, and per-domain health over the
              last {days} days.
            </p>
          </div>

          <div className="page-heading-actions" style={{ alignItems: 'center' }}>
            {/* Days selector matching API [7, 30, 90] */}
            <div
              style={{
                display: 'inline-flex',
                padding: '3px',
                backgroundColor: '#f1f5f9',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
              }}
              role="group"
              aria-label="Select time range"
            >
              {([7, 30, 90] as MailStatsDays[]).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => {
                    setDays(d)
                    setDailyPagination((prev) => ({ ...prev, pageIndex: 0 }))
                  }}
                  style={{
                    padding: '5px 12px',
                    fontSize: '13px',
                    fontWeight: days === d ? 650 : 500,
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: days === d ? '#ffffff' : 'transparent',
                    color: days === d ? '#0f172a' : '#64748b',
                    boxShadow: days === d ? '0 1px 3px rgba(15, 23, 42, 0.08)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {d} Days
                </button>
              ))}
            </div>

            <button
              type="button"
              className="button button-secondary"
              onClick={() => {
                refetch()
                onAction(`Analytics refreshed for last ${days} days.`)
              }}
              disabled={isFetching}
            >
              <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
              <span>{isFetching ? 'Refreshing…' : 'Refresh'}</span>
            </button>

            <DataExportMenu
              rows={exportRows}
              fileName={`metromail-analytics-${days}d`}
              onAction={onAction}
            />
          </div>
        </div>
      ) : (
        <div className="page-heading-row">
          <div>
            <div className="page-eyebrow">
              INSIGHTS <span>/</span> REPORTING
            </div>
            <h1>Analytics</h1>
            <p>
              Live delivery performance, bounce &amp; failure trends, and per-domain health over the
              last {days} days.
            </p>
          </div>

          <div className="page-heading-actions" style={{ alignItems: 'center' }}>
            {/* Days selector matching API [7, 30, 90] */}
            <div
              style={{
                display: 'inline-flex',
                padding: '3px',
                backgroundColor: '#f1f5f9',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
              }}
              role="group"
              aria-label="Select time range"
            >
              {([7, 30, 90] as MailStatsDays[]).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => {
                    setDays(d)
                    setDailyPagination((prev) => ({ ...prev, pageIndex: 0 }))
                  }}
                  style={{
                    padding: '5px 12px',
                    fontSize: '13px',
                    fontWeight: days === d ? 650 : 500,
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: days === d ? '#ffffff' : 'transparent',
                    color: days === d ? '#0f172a' : '#64748b',
                    boxShadow: days === d ? '0 1px 3px rgba(15, 23, 42, 0.08)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {d} Days
                </button>
              ))}
            </div>

            <button
              type="button"
              className="button button-secondary"
              onClick={() => {
                refetch()
                onAction(`Analytics refreshed for last ${days} days.`)
              }}
              disabled={isFetching}
            >
              <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
              <span>{isFetching ? 'Refreshing…' : 'Refresh'}</span>
            </button>

            <DataExportMenu
              rows={exportRows}
              fileName={`metromail-analytics-${days}d`}
              onAction={onAction}
            />
          </div>
        </div>
      )}

      {/* Error Banner */}
      {isError && (
        <div className="transactional-error-banner" style={{ marginBottom: '16px' }} role="alert">
          <AlertCircle size={18} />
          <div className="error-body">
            <strong>Failed to load analytics:</strong>
            <p>{formatApiErrorMessage(error, 'Could not fetch delivery statistics from server.')}</p>
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

      {/* Loading State */}
      {isLoading ? (
        <div
          className="dashboard-panel"
          style={{
            padding: '64px 20px',
            textAlign: 'center',
            color: '#64748b',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <Loader2 size={28} className="animate-spin text-blue-600" />
          <span>Loading live analytics for the last {days} days…</span>
        </div>
      ) : (
        <>
          {/* KPI Summary Row */}
          <section className="analytics-metrics">
            <article>
              <small>Total Sent</small>
              <b>{totals.sent.toLocaleString()}</b>
              <span style={{ color: sentDelta.positive ? '#15956d' : '#dc2626' }}>
                {sentDelta.positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {sentDelta.label} vs prev {days}d ({previous.sent.toLocaleString()})
              </span>
            </article>

            <article>
              <small>Delivered</small>
              <b>{totals.delivered.toLocaleString()}</b>
              <span style={{ color: deliveredDelta.positive ? '#15956d' : '#dc2626' }}>
                {deliveredDelta.positive ? (
                  <ArrowUpRight size={12} />
                ) : (
                  <ArrowDownRight size={12} />
                )}
                {deliveredDelta.label} vs prev {days}d ({previous.delivered.toLocaleString()})
              </span>
            </article>

            <article>
              <small>Delivery Rate</small>
              <b>{deliveryRate.toFixed(1)}%</b>
              <span style={{ color: deliveryRateDelta >= 0 ? '#15956d' : '#dc2626' }}>
                {deliveryRateDelta >= 0 ? (
                  <ArrowUpRight size={12} />
                ) : (
                  <ArrowDownRight size={12} />
                )}
                {deliveryRateDelta >= 0 ? '+' : ''}
                {deliveryRateDelta.toFixed(2)}% vs prev {days}d
              </span>
            </article>

            <article>
              <small>Bounced ({bounceRate.toFixed(2)}%)</small>
              <b>{totals.bounced.toLocaleString()}</b>
              <span style={{ color: bouncedDelta.positive && !bouncedDelta.neutral ? '#d97706' : '#15956d' }}>
                {bouncedDelta.positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {bouncedDelta.label} vs prev {days}d ({previous.bounced.toLocaleString()})
              </span>
            </article>

            <article>
              <small>Failed ({failRate.toFixed(2)}%)</small>
              <b>{totals.failed.toLocaleString()}</b>
              <span style={{ color: failedDelta.positive && !failedDelta.neutral ? '#dc2626' : '#15956d' }}>
                {failedDelta.positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {failedDelta.label} vs prev {days}d ({previous.failed.toLocaleString()})
              </span>
            </article>
          </section>

          {/* Daily Trend Chart */}
          <section className="dashboard-panel analytics-chart-panel" style={{ marginTop: '14px' }}>
            <div className="panel-heading" style={{ flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2>Daily delivery trend</h2>
                <p>
                  Comparing sent, delivered, bounced, and failed volume over the last {days} days
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                {/* Series Legend Toggles */}
                <div className="chart-legend">
                  <button
                    type="button"
                    className={visibleSeries.sent ? 'legend-active' : ''}
                    onClick={() => toggleSeries('sent')}
                  >
                    <i style={{ backgroundColor: '#6366f1' }} /> Sent
                  </button>
                  <button
                    type="button"
                    className={visibleSeries.delivered ? 'legend-active' : ''}
                    onClick={() => toggleSeries('delivered')}
                  >
                    <i className="legend-blue" /> Delivered
                  </button>
                  <button
                    type="button"
                    className={visibleSeries.bounced ? 'legend-active' : ''}
                    onClick={() => toggleSeries('bounced')}
                  >
                    <i style={{ backgroundColor: '#f59e0b' }} /> Bounced
                  </button>
                  <button
                    type="button"
                    className={visibleSeries.failed ? 'legend-active' : ''}
                    onClick={() => toggleSeries('failed')}
                  >
                    <i style={{ backgroundColor: '#ef4444' }} /> Failed
                  </button>
                </div>

                {/* Area / Bar Chart Switch */}
                <div
                  style={{
                    display: 'inline-flex',
                    padding: '2px',
                    backgroundColor: '#f1f5f9',
                    borderRadius: '7px',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setChartType('area')}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 9px',
                      fontSize: '12px',
                      fontWeight: 600,
                      borderRadius: '5px',
                      border: 'none',
                      cursor: 'pointer',
                      backgroundColor: chartType === 'area' ? '#ffffff' : 'transparent',
                      color: chartType === 'area' ? '#0f172a' : '#64748b',
                    }}
                  >
                    <TrendingUp size={13} /> Area
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartType('bar')}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 9px',
                      fontSize: '12px',
                      fontWeight: 600,
                      borderRadius: '5px',
                      border: 'none',
                      cursor: 'pointer',
                      backgroundColor: chartType === 'bar' ? '#ffffff' : 'transparent',
                      color: chartType === 'bar' ? '#0f172a' : '#64748b',
                    }}
                  >
                    <BarChart3 size={13} /> Bar
                  </button>
                </div>
              </div>
            </div>

            {chartData.length === 0 ? (
              <div
                style={{
                  padding: '48px 20px',
                  textAlign: 'center',
                  color: '#64748b',
                  fontSize: '13.5px',
                }}
              >
                No daily activity recorded in the last {days} days.
              </div>
            ) : (
              <div className="analytics-chart" style={{ height: '270px', marginTop: '12px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === 'area' ? (
                    <AreaChart data={chartData} margin={{ top: 12, right: 12, left: -14, bottom: 0 }}>
                      <CartesianGrid stroke="#edf1f6" vertical={false} />
                      <XAxis
                        dataKey="label"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#98a2b3', fontSize: 11 }}
                        dy={8}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#98a2b3', fontSize: 11 }}
                      />
                      <Tooltip />
                      {visibleSeries.sent && (
                        <Area
                          type="monotone"
                          dataKey="sent"
                          name="Sent"
                          stroke="#6366f1"
                          fill="#6366f11a"
                          strokeWidth={2}
                        />
                      )}
                      {visibleSeries.delivered && (
                        <Area
                          type="monotone"
                          dataKey="delivered"
                          name="Delivered"
                          stroke="#146ef5"
                          fill="#146ef51a"
                          strokeWidth={2}
                        />
                      )}
                      {visibleSeries.bounced && (
                        <Area
                          type="monotone"
                          dataKey="bounced"
                          name="Bounced"
                          stroke="#f59e0b"
                          fill="#f59e0b1a"
                          strokeWidth={2}
                        />
                      )}
                      {visibleSeries.failed && (
                        <Area
                          type="monotone"
                          dataKey="failed"
                          name="Failed"
                          stroke="#ef4444"
                          fill="#ef44441a"
                          strokeWidth={2}
                        />
                      )}
                    </AreaChart>
                  ) : (
                    <BarChart data={chartData} margin={{ top: 12, right: 12, left: -14, bottom: 0 }}>
                      <CartesianGrid stroke="#edf1f6" vertical={false} />
                      <XAxis
                        dataKey="label"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#98a2b3', fontSize: 11 }}
                        dy={8}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#98a2b3', fontSize: 11 }}
                      />
                      <Tooltip />
                      {visibleSeries.sent && (
                        <Bar dataKey="sent" name="Sent" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      )}
                      {visibleSeries.delivered && (
                        <Bar
                          dataKey="delivered"
                          name="Delivered"
                          fill="#146ef5"
                          radius={[4, 4, 0, 0]}
                        />
                      )}
                      {visibleSeries.bounced && (
                        <Bar dataKey="bounced" name="Bounced" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                      )}
                      {visibleSeries.failed && (
                        <Bar dataKey="failed" name="Failed" fill="#ef4444" radius={[4, 4, 0, 0]} />
                      )}
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            )}
          </section>

          {/* Breakdown Grid: Domain Performance + Delivery Outcome Summary */}
          <div className="analytics-breakdown" style={{ marginTop: '14px' }}>
            {/* Domain Performance */}
            <section className="dashboard-panel" style={{ padding: '16px' }}>
              <div className="panel-heading" style={{ marginBottom: '12px' }}>
                <div>
                  <h2>Domain performance</h2>
                  <p>
                    {domainsList.length} sending {domainsList.length === 1 ? 'domain' : 'domains'}{' '}
                    in the last {days} days
                  </p>
                </div>
                <Link href="/app/domains">
                  Manage domains <ArrowRight size={13} />
                </Link>
              </div>

              {domainsList.length > 3 && (
                <div style={{ marginBottom: '12px' }}>
                  <label className="table-search-control" style={{ width: '100%' }}>
                    <Search size={14} aria-hidden="true" />
                    <input
                      placeholder="Filter domains…"
                      value={domainSearch}
                      onChange={(e) => setDomainSearch(e.target.value)}
                    />
                  </label>
                </div>
              )}

              {filteredDomains.length === 0 ? (
                <div
                  style={{
                    padding: '28px 16px',
                    textAlign: 'center',
                    color: '#64748b',
                    fontSize: '13px',
                  }}
                >
                  <Globe2 size={24} className="mx-auto mb-2 text-slate-300" />
                  {domainsList.length === 0
                    ? 'No domain statistics recorded for this period.'
                    : 'No domains match your search.'}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {filteredDomains.map((dom) => {
                    const rate = calcRate(dom.delivered, dom.sent)
                    const healthStatus =
                      rate >= 95 ? 'Healthy' : rate >= 85 ? 'Attention' : 'Failed'
                    return (
                      <div
                        key={dom.name}
                        style={{
                          padding: '12px 14px',
                          border: '1px solid #e2e8f0',
                          borderRadius: '10px',
                          backgroundColor: '#f8fafc',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '10px',
                            marginBottom: '8px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Globe2 size={15} className="text-blue-600" />
                            <strong style={{ fontSize: '14px', color: '#0f172a' }}>{dom.name}</strong>
                          </div>
                          <StatusBadge status={healthStatus} />
                        </div>

                        <div
                          style={{
                            height: '6px',
                            width: '100%',
                            backgroundColor: '#e2e8f0',
                            borderRadius: '999px',
                            overflow: 'hidden',
                            marginBottom: '8px',
                          }}
                        >
                          <div
                            style={{
                              height: '100%',
                              width: `${Math.min(100, Math.max(0, rate))}%`,
                              backgroundColor:
                                rate >= 95 ? '#10b981' : rate >= 85 ? '#f59e0b' : '#ef4444',
                              borderRadius: '999px',
                            }}
                          />
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            justifyContent: 'space-between',
                            gap: '8px',
                            fontSize: '12px',
                            color: '#475569',
                          }}
                        >
                          <span>
                            Sent: <b>{dom.sent.toLocaleString()}</b>
                          </span>
                          <span>
                            Delivered: <b style={{ color: '#059669' }}>{dom.delivered.toLocaleString()}</b>{' '}
                            ({rate.toFixed(1)}%)
                          </span>
                          <span>
                            Bounced: <b style={{ color: '#d97706' }}>{dom.bounced.toLocaleString()}</b>
                          </span>
                          <span>
                            Failed: <b style={{ color: '#dc2626' }}>{dom.failed.toLocaleString()}</b>
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>

            {/* Period Comparison Summary */}
            <section className="dashboard-panel" style={{ padding: '16px' }}>
              <div className="panel-heading" style={{ marginBottom: '12px' }}>
                <div>
                  <h2>Outcome distribution</h2>
                  <p>Current {days} days vs previous {days} days</p>
                </div>
                <Link href="/app/logs">
                  View email logs <ArrowRight size={13} />
                </Link>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  {
                    label: 'Delivered',
                    icon: CheckCircle2,
                    color: '#10b981',
                    current: totals.delivered,
                    prev: previous.delivered,
                    pct: calcRate(totals.delivered, totals.sent),
                  },
                  {
                    label: 'Bounced',
                    icon: Mail,
                    color: '#f59e0b',
                    current: totals.bounced,
                    prev: previous.bounced,
                    pct: calcRate(totals.bounced, totals.sent),
                  },
                  {
                    label: 'Failed',
                    icon: XCircle,
                    color: '#ef4444',
                    current: totals.failed,
                    prev: previous.failed,
                    pct: calcRate(totals.failed, totals.sent),
                  },
                ].map((row) => {
                  const Icon = row.icon
                  return (
                    <div
                      key={row.label}
                      style={{
                        padding: '12px 14px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        backgroundColor: '#ffffff',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '6px',
                        }}
                      >
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '7px',
                            fontSize: '13.5px',
                            fontWeight: 600,
                            color: '#0f172a',
                          }}
                        >
                          <Icon size={15} style={{ color: row.color }} />
                          {row.label}
                        </span>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                          {row.current.toLocaleString()}{' '}
                          <small style={{ fontWeight: 500, color: '#64748b' }}>
                            ({row.pct.toFixed(2)}%)
                          </small>
                        </span>
                      </div>

                      <div
                        style={{
                          height: '6px',
                          width: '100%',
                          backgroundColor: '#f1f5f9',
                          borderRadius: '999px',
                          overflow: 'hidden',
                          marginBottom: '6px',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${Math.min(100, Math.max(0, row.pct))}%`,
                            backgroundColor: row.color,
                            borderRadius: '999px',
                          }}
                        />
                      </div>

                      <small style={{ fontSize: '12px', color: '#64748b' }}>
                        Previous {days}d: <b>{row.prev.toLocaleString()}</b>
                      </small>
                    </div>
                  )
                })}
              </div>
            </section>
          </div>

          {/* Daily Breakdown Table */}
          <section className="data-panel" style={{ marginTop: '14px' }}>
            <div className="data-panel-top">
              <div>
                <h2>Daily statistics log</h2>
                <p>
                  {dailyList.length} {dailyList.length === 1 ? 'day' : 'days'} reported in current
                  window
                </p>
              </div>
              <Link href="/app/transactional" className="button button-secondary button-sm">
                <Send size={13} /> Send email
              </Link>
            </div>

            <div className="desktop-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Sent</th>
                    <th>Delivered</th>
                    <th>Bounced</th>
                    <th>Failed</th>
                    <th>Delivery Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedDaily.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="table-empty-state">
                        No daily breakdown data available for this period.
                      </td>
                    </tr>
                  ) : (
                    paginatedDaily.map((day) => {
                      const rate = calcRate(day.delivered, day.sent)
                      return (
                        <tr key={day.date}>
                          <td>
                            <b>{day.date}</b>
                          </td>
                          <td>{day.sent.toLocaleString()}</td>
                          <td style={{ color: '#059669', fontWeight: 600 }}>
                            {day.delivered.toLocaleString()}
                          </td>
                          <td style={{ color: '#d97706', fontWeight: 600 }}>
                            {day.bounced.toLocaleString()}
                          </td>
                          <td style={{ color: '#dc2626', fontWeight: 600 }}>
                            {day.failed.toLocaleString()}
                          </td>
                          <td>
                            <StatusBadge
                              status={
                                day.sent === 0
                                  ? 'No traffic'
                                  : rate >= 95
                                  ? `${rate.toFixed(1)}% Healthy`
                                  : `${rate.toFixed(1)}%`
                              }
                            />
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            <TablePagination
              pageIndex={dailyPagination.pageIndex}
              pageSize={dailyPagination.pageSize}
              totalItems={reversedDaily.length}
              pageSizeOptions={[7, 10, 30]}
              onPageChange={(pageIndex) => setDailyPagination((prev) => ({ ...prev, pageIndex }))}
              onPageSizeChange={(pageSize) => setDailyPagination({ pageIndex: 0, pageSize })}
            />
          </section>
        </>
      )}
    </>
  )
}
