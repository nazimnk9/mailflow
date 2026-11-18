'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Globe2,
  Info,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react'
import {
  useCreateDomainMutation,
  useDeleteDomainMutation,
  useDomainByIdQuery,
  useDomainsQuery,
} from '@/lib/hooks/use-domains-query'
import type { DnsRecord, DomainItem } from '@/lib/api/domains'
import { formatApiErrorMessage } from '@/lib/api-client'

interface DomainsManagementProps {
  route: string
  onAction: (message: string) => void
  copiedRecord: string
  copyText: (text: string) => void
}

export function DomainsManagement({
  route,
  onAction,
  copiedRecord,
  copyText,
}: DomainsManagementProps) {
  // Query for all domains
  const {
    data: domainsResponse,
    isLoading: isDomainsLoading,
    isError: isDomainsError,
    error: domainsError,
    refetch: refetchDomains,
    isRefetching,
  } = useDomainsQuery()

  // Mutations
  const createDomainMutation = useCreateDomainMutation()
  const deleteDomainMutation = useDeleteDomainMutation()

  // Local state
  const [selectedDomainId, setSelectedDomainId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<DomainItem | null>(null)
  const [domainNameInput, setDomainNameInput] = useState('')
  const [domainInputError, setDomainInputError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [createdDomain, setCreatedDomain] = useState<DomainItem | null>(null)

  // Query for inspecting a specific domain's latest DNS records (ID-wise GET /domains/{id})
  const {
    data: singleDomainResponse,
    isLoading: isSingleLoading,
    refetch: refetchSingleDomain,
    isRefetching: isSingleRefetching,
  } = useDomainByIdQuery(selectedDomainId)

  // Domains list
  const domainsList = useMemo(() => {
    return domainsResponse?.data || []
  }, [domainsResponse])

  // Filtered domains
  const filteredDomains = useMemo(() => {
    if (!searchQuery.trim()) return domainsList
    return domainsList.filter((d) =>
      d.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
    )
  }, [domainsList, searchQuery])

  // Metrics
  const totalDomains = domainsList.length
  const verifiedDomains = domainsList.filter((d) => d.is_verified).length
  const pendingDomains = totalDomains - verifiedDomains

  // Currently inspected domain
  const activeInspectedDomain: DomainItem | null = useMemo(() => {
    if (!selectedDomainId) return null
    if (singleDomainResponse?.data) return singleDomainResponse.data
    return domainsList.find((d) => d.id === selectedDomainId) || null
  }, [selectedDomainId, singleDomainResponse, domainsList])

  // Handle Domain Creation Form
  const handleCreateDomain = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = domainNameInput.trim().toLowerCase()

    // Validate domain format
    const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i
    if (!trimmed || !domainRegex.test(trimmed)) {
      setDomainInputError('Please enter a valid domain name (e.g. mail.yourcompany.com).')
      return
    }

    setDomainInputError('')
    try {
      const response = await createDomainMutation.mutateAsync({ name: trimmed })
      if (response && response.success && response.data) {
        setCreatedDomain(response.data)
        setDomainNameInput('')
        onAction(response.message || `Domain "${trimmed}" added successfully!`)
      } else {
        const errorMsg = formatApiErrorMessage(
          response,
          'Failed to add sending domain. Please try again.'
        )
        setDomainInputError(errorMsg)
      }
    } catch (err: any) {
      setDomainInputError(
        formatApiErrorMessage(err, 'Failed to add sending domain. Please try again.')
      )
    }
  }

  // Handle Domain Deletion
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    try {
      const response = await deleteDomainMutation.mutateAsync(deleteTarget.id)
      if (response && response.success) {
        onAction(response.message || `Domain "${deleteTarget.name}" deleted successfully.`)
        if (selectedDomainId === deleteTarget.id) {
          setSelectedDomainId(null)
        }
        setDeleteTarget(null)
      } else {
        onAction(formatApiErrorMessage(response, 'Failed to delete domain.'))
      }
    } catch (err: any) {
      onAction(formatApiErrorMessage(err, 'Failed to delete domain.'))
    }
  }

  // Helper to format date
  const formatDate = (isoString?: string) => {
    if (!isoString) return 'Recently added'
    try {
      const date = new Date(isoString)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return isoString
    }
  }

  // ==========================================
  // VIEW 1: ADD DOMAIN PAGE (route === 'domains/add')
  // ==========================================
  if (route === 'domains/add') {
    return (
      <div className="domain-detail-page">
        <div className="page-heading-row">
          <div>
            <div className="page-eyebrow">
              <Link href="/app/domains">SENDING DOMAINS</Link> <span>/</span> DOMAIN SETUP
            </div>
            <h1>Add a sending domain</h1>
            <p>Connect and configure your domain for authenticated email delivery.</p>
          </div>
          <Link className="button button-secondary" href="/app/domains">
            <ArrowLeft size={14} /> Back to domains
          </Link>
        </div>

        {/* If Domain Was Just Created: Show newly generated DNS Records */}
        {createdDomain ? (
          <section className="domain-detail-card" style={{ marginTop: '20px' }}>
            <div className="domain-card-heading">
              <span className="domain-card-icon">
                <CheckCircle2 size={18} className="text-emerald-500" />
              </span>
              <div>
                <h2>{createdDomain.name}</h2>
                <p>
                  Domain successfully created · Published DNS records below with your DNS host
                </p>
              </div>
              <span className="domain-badge-pending">
                <Clock size={13} /> Pending DNS Setup
              </span>
            </div>

            <div className="dns-table-heading" style={{ marginTop: '16px' }}>
              <div>
                <h3>Required DNS Records</h3>
                <p>
                  Copy each record and add it to your domain provider (e.g., Cloudflare, Route 53,
                  GoDaddy, Namecheap).
                </p>
              </div>
            </div>

            <div className="dns-records">
              {createdDomain.dns_records && createdDomain.dns_records.length > 0 ? (
                createdDomain.dns_records.map((record) => (
                  <DnsRecordRow
                    key={record.id || `${record.type}-${record.host}`}
                    record={record}
                    copiedRecord={copiedRecord}
                    copyText={copyText}
                  />
                ))
              ) : (
                <div style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
                  No DNS records generated. Please contact support.
                </div>
              )}
            </div>

            <div className="domain-card-foot" style={{ marginTop: '20px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Info size={14} /> DNS verification can take a few minutes to propagate worldwide.
              </span>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  className="button button-secondary"
                  onClick={() => {
                    setCreatedDomain(null)
                    setDomainNameInput('')
                  }}
                >
                  <Plus size={14} /> Add another domain
                </button>
                <Link className="button button-primary" href="/app/domains">
                  View all sending domains <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </section>
        ) : (
          /* Domain Creation Input Form */
          <section className="domain-add-card">
            <div className="domain-add-step">
              <span>1</span>
              <div>
                <b>Enter your sending domain</b>
                <small>Use a domain you own and have permission to update DNS records for.</small>
              </div>
            </div>

            <form onSubmit={handleCreateDomain} style={{ marginTop: '14px' }}>
              <label className="domain-form-label">
                <span>Domain name</span>
                <input
                  type="text"
                  value={domainNameInput}
                  placeholder="e.g. mail.yourcompany.com"
                  disabled={createDomainMutation.isPending}
                  aria-invalid={Boolean(domainInputError)}
                  onChange={(e) => {
                    setDomainNameInput(e.target.value)
                    setDomainInputError('')
                  }}
                  className="domain-text-input"
                />
              </label>

              {domainInputError && (
                <div className="domain-input-error" role="alert">
                  <AlertCircle size={14} />
                  <span>
                    {typeof domainInputError === 'string'
                      ? domainInputError
                      : formatApiErrorMessage(domainInputError)}
                  </span>
                </div>
              )}

              <div className="domain-add-step" style={{ marginTop: '24px' }}>
                <span>2</span>
                <div>
                  <b>Generate DNS Records</b>
                  <small>
                    Our system will instantly generate verification and authentication DNS records.
                  </small>
                </div>
              </div>

              <div style={{ marginTop: '20px' }}>
                {(() => {
                  const isDomainEmpty = !domainNameInput.trim()
                  const isSubmitDisabled = isDomainEmpty || createDomainMutation.isPending

                  return (
                    <button
                      type="submit"
                      className={`button button-primary ${isSubmitDisabled ? 'button-disabled' : ''}`}
                      disabled={isSubmitDisabled}
                      aria-disabled={isSubmitDisabled}
                      title={isDomainEmpty ? 'Please enter a domain name to continue' : undefined}
                    >
                      {createDomainMutation.isPending ? (
                        <>
                          <Loader2 size={15} className="animate-spin" /> Adding sending domain…
                        </>
                      ) : (
                        <>
                          Add sending domain <ArrowRight size={14} />
                        </>
                      )}
                    </button>
                  )
                })()}
              </div>
            </form>
          </section>
        )}
      </div>
    )
  }

  // ==========================================
  // VIEW 2: DOMAINS LIST & HEALTH VIEW
  // ==========================================
  return (
    <div className="domain-page">
      {/* Page Header */}
      <div className="page-heading-row">
        <div>
          <div className="page-eyebrow">DELIVERABILITY <span>/</span> SENDING DOMAINS</div>
          <h1>{route === 'domains/health' ? 'Domain health & authentication' : 'Sending domains'}</h1>
          <p>
            Authenticate your sending domains with SPF, DKIM, and DMARC to guarantee high inbox
            placement.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            type="button"
            className="button button-secondary"
            aria-label="Refresh domain list"
            onClick={() => {
              refetchDomains()
              onAction('Refreshing sending domains…')
            }}
            disabled={isRefetching}
          >
            <RefreshCw size={14} className={isRefetching ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          <Link className="button button-primary" href="/app/domains/add">
            <Plus size={15} /> Add domain
          </Link>
        </div>
      </div>

      {/* Metrics Summary Row */}
      <section className="domain-summary-row">
        <article>
          <span className="domain-summary-icon domain-blue">
            <Globe2 size={17} />
          </span>
          <div>
            <small>Total domains</small>
            <b>{totalDomains} connected</b>
          </div>
          <span className="domain-summary-change">Active list</span>
        </article>

        <article>
          <span className="domain-summary-icon domain-green">
            <ShieldCheck size={17} />
          </span>
          <div>
            <small>Verified domains</small>
            <b>{verifiedDomains} of {totalDomains}</b>
          </div>
          <span className="domain-summary-change" style={{ color: '#16a34a' }}>
            {totalDomains > 0 && verifiedDomains === totalDomains
              ? 'All verified'
              : `${verifiedDomains} ready`}
          </span>
        </article>

        <article>
          <span className="domain-summary-icon domain-orange">
            <ShieldAlert size={17} />
          </span>
          <div>
            <small>Pending DNS</small>
            <b>{pendingDomains} domains</b>
          </div>
          <span className="domain-summary-change" style={{ color: '#d97706' }}>
            {pendingDomains > 0 ? 'Action required' : 'None pending'}
          </span>
        </article>
      </section>

      {/* Search and Filters Bar */}
      {totalDomains > 0 && (
        <div className="domain-search-bar">
          <Search size={15} className="text-slate-400" />
          <input
            type="text"
            placeholder="Search domains by name…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="domain-search-clear"
              onClick={() => setSearchQuery('')}
            >
              <X size={14} />
            </button>
          )}
        </div>
      )}

      {/* Loading State */}
      {isDomainsLoading && (
        <div className="domain-loading-container">
          <Loader2 size={26} className="animate-spin text-blue-600" />
          <p>Loading your sending domains…</p>
        </div>
      )}

      {/* Error State */}
      {!isDomainsLoading && isDomainsError && (
        <div className="domain-error-card">
          <AlertCircle size={20} className="text-rose-500" />
          <div>
            <h3>Unable to load sending domains</h3>
            <p>
              {formatApiErrorMessage(
                domainsError,
                'A network error occurred while connecting to the API.'
              )}
            </p>
          </div>
          <button className="button button-secondary" onClick={() => refetchDomains()}>
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isDomainsLoading && !isDomainsError && domainsList.length === 0 && (
        <div className="domain-empty-container">
          <div className="domain-empty-icon">
            <Globe2 size={32} />
          </div>
          <h2>No sending domains configured yet</h2>
          <p>
            Add a domain you own to generate verification DNS records and protect your sender
            reputation.
          </p>
          <Link className="button button-primary" href="/app/domains/add">
            <Plus size={15} /> Add your first domain
          </Link>
        </div>
      )}

      {/* Domain Cards List */}
      {!isDomainsLoading && !isDomainsError && filteredDomains.length > 0 && (
        <div className="domain-cards-list">
          {filteredDomains.map((domain) => {
            const isInspecting = selectedDomainId === domain.id
            const recordsCount = domain.dns_records?.length || 0

            return (
              <section key={domain.id} className="domain-detail-card" style={{ marginBottom: '16px' }}>
                {/* Domain Header Row */}
                <div className="domain-card-heading">
                  <span className="domain-card-icon">
                    <Globe2 size={18} />
                  </span>
                  <div>
                    <h2>{domain.name}</h2>
                    <p>
                      Added on {formatDate(domain.created_at)} · {recordsCount} DNS record
                      {recordsCount === 1 ? '' : 's'}
                    </p>
                  </div>

                  {domain.is_verified ? (
                    <span className="domain-badge-verified">
                      <CheckCircle2 size={13} /> Verified
                    </span>
                  ) : (
                    <span className="domain-badge-pending">
                      <Clock size={13} /> Pending DNS
                    </span>
                  )}

                  {/* Actions Buttons */}
                  <div className="domain-item-actions">
                    <button
                      type="button"
                      className={`button ${isInspecting ? 'button-primary' : 'button-secondary'}`}
                      onClick={() => {
                        if (isInspecting) {
                          setSelectedDomainId(null)
                        } else {
                          setSelectedDomainId(domain.id)
                          refetchSingleDomain()
                        }
                      }}
                    >
                      {isInspecting ? 'Hide records' : 'Inspect DNS records'}
                    </button>

                    <button
                      type="button"
                      className="button button-danger-icon"
                      title={`Delete domain ${domain.name}`}
                      aria-label={`Delete domain ${domain.name}`}
                      onClick={() => setDeleteTarget(domain)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Inline DNS Records Viewer when active */}
                {isInspecting && (
                  <div className="domain-inspected-box">
                    <div className="dns-table-heading" style={{ marginTop: '16px' }}>
                      <div>
                        <h3>DNS authentication records for {domain.name}</h3>
                        <p>
                          Publish these records with your DNS provider to complete domain
                          authentication.
                        </p>
                      </div>

                      <button
                        type="button"
                        className="button button-secondary"
                        disabled={isSingleRefetching}
                        onClick={() => {
                          refetchSingleDomain()
                          onAction(`Checking DNS records for ${domain.name}…`)
                        }}
                      >
                        <RefreshCw
                          size={13}
                          className={isSingleRefetching ? 'animate-spin' : ''}
                        />
                        <span>Check DNS status</span>
                      </button>
                    </div>

                    {isSingleLoading ? (
                      <div style={{ padding: '24px', textAlign: 'center' }}>
                        <Loader2 size={20} className="animate-spin text-blue-500" />
                        <span style={{ marginLeft: '8px', fontSize: '13px', color: '#64748b' }}>
                          Fetching latest DNS records…
                        </span>
                      </div>
                    ) : (
                      <div className="dns-records">
                        {(activeInspectedDomain?.dns_records || domain.dns_records || []).map(
                          (record) => (
                            <DnsRecordRow
                              key={record.id || `${record.type}-${record.host}`}
                              record={record}
                              copiedRecord={copiedRecord}
                              copyText={copyText}
                            />
                          )
                        )}
                      </div>
                    )}
                  </div>
                )}
              </section>
            )
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div
          className="domain-modal-backdrop"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDeleteTarget(null)
          }}
        >
          <div className="domain-modal-content" role="dialog" aria-modal="true">
            <div className="domain-modal-header">
              <span className="domain-modal-alert-icon">
                <Trash2 size={20} />
              </span>
              <div>
                <h3>Delete sending domain</h3>
                <p>Are you sure you want to delete <strong>{deleteTarget.name}</strong>?</p>
              </div>
              <button
                type="button"
                className="domain-modal-close"
                onClick={() => setDeleteTarget(null)}
                aria-label="Close dialog"
              >
                <X size={16} />
              </button>
            </div>

            <div className="domain-modal-body">
              <p>
                Deleting this sending domain will immediately revoke its DNS verification and
                prevent any campaigns or transactional emails from sending through this domain.
              </p>
            </div>

            <div className="domain-modal-footer">
              <button
                type="button"
                className="button button-secondary"
                disabled={deleteDomainMutation.isPending}
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="button button-danger"
                disabled={deleteDomainMutation.isPending}
                onClick={handleConfirmDelete}
              >
                {deleteDomainMutation.isPending ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Deleting…
                  </>
                ) : (
                  <>
                    <Trash2 size={14} /> Delete domain
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Subcomponent to render a single DNS record card
 */
function DnsRecordRow({
  record,
  copiedRecord,
  copyText,
}: {
  record: DnsRecord
  copiedRecord: string
  copyText: (text: string) => void
}) {
  const isCopiedValue = copiedRecord === record.value
  const isCopiedHost = copiedRecord === record.host

  const purposeLower = (record.purpose || 'dns').toLowerCase()

  return (
    <article className="dns-record-card">
      {/* 1. Header Row: Purpose pill, Type pill, Priority (if present), Status badge */}
      <div className="dns-record-card-head">
        <div className="dns-record-tags">
          <span className={`dns-purpose-badge dns-purpose-${purposeLower}`}>
            {record.purpose?.toUpperCase() || 'DNS'}
          </span>

          <span className="dns-type-badge">{record.type}</span>

          {record.priority !== undefined && record.priority !== null && (
            <span className="dns-priority-badge">
              Priority: <b>{record.priority}</b>
            </span>
          )}
        </div>

        <div className="dns-record-status-wrap">
          {record.is_verified ? (
            <span className="domain-badge-verified">
              <Check size={12} /> Verified
            </span>
          ) : (
            <span className="domain-badge-pending">
              <Clock size={12} /> Pending DNS
            </span>
          )}
        </div>
      </div>

      {/* 2. Content Row: Host and Value with dedicated copy buttons and clean multi-line wrapping */}
      <div className="dns-record-card-grid">
        {/* Host Field */}
        <div className="dns-field-container">
          <div className="dns-field-header">
            <span className="dns-field-title">HOST / NAME</span>
            <button
              type="button"
              className="dns-field-copy-action"
              onClick={() => copyText(record.host)}
              title={`Copy host: ${record.host}`}
              aria-label={`Copy host ${record.host}`}
            >
              {isCopiedHost ? (
                <>
                  <Check size={12} className="text-emerald-600" />
                  <span className="text-emerald-600 font-semibold">Copied</span>
                </>
              ) : (
                <>
                  <Copy size={12} />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
          <div className="dns-code-wrapper">
            <code className="dns-code-text">{record.host}</code>
          </div>
        </div>

        {/* Value Field */}
        <div className="dns-field-container">
          <div className="dns-field-header">
            <span className="dns-field-title">VALUE / DATA</span>
            <button
              type="button"
              className="dns-field-copy-action"
              onClick={() => copyText(record.value)}
              title={`Copy value: ${record.value}`}
              aria-label="Copy record value"
            >
              {isCopiedValue ? (
                <>
                  <Check size={12} className="text-emerald-600" />
                  <span className="text-emerald-600 font-semibold">Copied</span>
                </>
              ) : (
                <>
                  <Copy size={12} />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
          <div className="dns-code-wrapper">
            <code className="dns-code-text dns-code-value">{record.value}</code>
          </div>
        </div>
      </div>
    </article>
  )
}
