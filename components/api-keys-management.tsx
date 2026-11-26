'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Braces,
  Check,
  CheckCircle2,
  Code2,
  Copy,
  Eye,
  EyeOff,
  HardDrive,
  Info,
  Key,
  Loader2,
  Lock,
  Plus,
  RefreshCw,
  Search,
  Server,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  Trash2,
  X,
} from 'lucide-react'
import {
  useApiKeysQuery,
  useCreateApiKeyMutation,
  useDeleteApiKeyMutation,
} from '@/lib/hooks/use-api-keys-query'
import type { ApiKeyCreatedItem, ApiKeyItem } from '@/lib/api/api-keys'
import { formatApiErrorMessage } from '@/lib/api-client'
import { TablePagination } from '@/components/table-pagination'

interface ApiKeysManagementProps {
  route?: string
  onAction: (message: string) => void
  initialCreateOpen?: boolean
}

type ExpiryOption = '30d' | '90d' | '1y' | 'never'
type SectionTab = 'keys' | 'smtp' | 'quickstart'
type CodeLanguage = 'cURL' | 'Node.js' | 'Python'

export function ApiKeysManagement({
  route = 'api-keys',
  onAction,
  initialCreateOpen = false,
}: ApiKeysManagementProps) {
  // Determine initial active tab based on route
  const getInitialTab = (r: string): SectionTab => {
    if (r.includes('smtp')) return 'smtp'
    if (r.includes('quickstart') || r.includes('docs')) return 'quickstart'
    return 'keys'
  }

  const [activeTab, setActiveTab] = useState<SectionTab>(getInitialTab(route))

  // Sync tab if route prop changes
  useEffect(() => {
    setActiveTab(getInitialTab(route))
  }, [route])

  // Tab switch handler with browser URL sync (without page reload)
  const handleTabChange = (tab: SectionTab) => {
    setActiveTab(tab)
    const targetUrl =
      tab === 'keys'
        ? '/app/api-keys'
        : tab === 'smtp'
        ? '/app/api-keys/smtp'
        : '/app/api-keys/quickstart'
    window.history.pushState(null, '', targetUrl)
  }

  // Query for all API keys (GET /api-keys returns prefix only, never raw secret key)
  const {
    data: apiKeysResponse,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useApiKeysQuery()

  // Mutations
  const createApiKeyMutation = useCreateApiKeyMutation()
  const deleteApiKeyMutation = useDeleteApiKeyMutation()

  // Local state
  const [searchQuery, setSearchQuery] = useState('')
  const [accessFilter, setAccessFilter] = useState<'all' | 'read' | 'write'>('all')

  // Multi-step modal state (Step 1: Configure form, Step 2: Show & copy generated secret key)
  const [isCreateOpen, setIsCreateOpen] = useState(initialCreateOpen)
  const [createStep, setCreateStep] = useState<1 | 2>(1)
  const [createdKeyData, setCreatedKeyData] = useState<ApiKeyCreatedItem | null>(null)
  const [showKeySecret, setShowKeySecret] = useState(false)
  const [copiedKey, setCopiedKey] = useState(false)

  // Revoke state
  const [keyToDelete, setKeyToDelete] = useState<ApiKeyItem | null>(null)
  const [copiedPrefixId, setCopiedPrefixId] = useState<string | null>(null)

  // Form state
  const [keyName, setKeyName] = useState('')
  const [keyAccess, setKeyAccess] = useState<'read' | 'write'>('read')
  const [keyExpiry, setKeyExpiry] = useState<ExpiryOption>('30d')
  const [formError, setFormError] = useState<string | null>(null)

  // Quick start code tab state
  const [activeCodeLang, setActiveCodeLang] = useState<CodeLanguage>('cURL')
  const [copiedCode, setCopiedCode] = useState(false)

  // SMTP credentials copied state
  const [copiedSmtpField, setCopiedSmtpField] = useState<string | null>(null)

  // Api keys list from backend
  const apiKeysList = useMemo(() => {
    return apiKeysResponse?.data || []
  }, [apiKeysResponse])

  // Filtered keys
  const filteredKeys = useMemo(() => {
    return apiKeysList.filter((item) => {
      const matchesSearch =
        !searchQuery.trim() ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        item.prefix.toLowerCase().includes(searchQuery.toLowerCase().trim())

      const matchesAccess =
        accessFilter === 'all' || item.access.toLowerCase() === accessFilter

      return matchesSearch && matchesAccess
    })
  }, [apiKeysList, searchQuery, accessFilter])

  // Pagination state (Standard format matching dashboard tables)
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(6)

  // Reset pageIndex on filter or search changes
  useEffect(() => {
    setPageIndex(0)
  }, [searchQuery, accessFilter])

  // Paginated keys for current view
  const paginatedKeys = useMemo(() => {
    const start = pageIndex * pageSize
    return filteredKeys.slice(start, start + pageSize)
  }, [filteredKeys, pageIndex, pageSize])

  // Metrics
  const totalKeys = apiKeysList.length
  const readWriteCount = apiKeysList.filter((k) => k.access.toLowerCase() === 'write').length
  const readOnlyCount = apiKeysList.filter((k) => k.access.toLowerCase() === 'read').length

  // Calculate ISO string for expires_at based on chosen option
  const calculateExpiresAt = (option: ExpiryOption): string | null => {
    const now = new Date()
    switch (option) {
      case '30d':
        now.setDate(now.getDate() + 30)
        return now.toISOString()
      case '90d':
        now.setDate(now.getDate() + 90)
        return now.toISOString()
      case '1y':
        now.setFullYear(now.getFullYear() + 1)
        return now.toISOString()
      case 'never':
      default:
        return null
    }
  }

  // Open Create Modal in Step 1
  const handleOpenCreateModal = (defaultAccess: 'read' | 'write' = 'read') => {
    setCreateStep(1)
    setCreatedKeyData(null)
    setKeyName('')
    setKeyAccess(defaultAccess)
    setKeyExpiry('30d')
    setFormError(null)
    setShowKeySecret(false)
    setCopiedKey(false)
    setIsCreateOpen(true)
  }

  // Close Create Modal
  const handleCloseCreateModal = () => {
    if (createApiKeyMutation.isPending) return
    setIsCreateOpen(false)
    setCreateStep(1)
    setCreatedKeyData(null)
    setKeyName('')
    setKeyAccess('read')
    setKeyExpiry('30d')
    setFormError(null)
    setShowKeySecret(false)
    setCopiedKey(false)
  }

  // Handle Create API Key submission -> Advances to Step 2 within the same modal
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    const trimmedName = keyName.trim()
    if (!trimmedName) {
      setFormError('Please enter a name for your API key.')
      return
    }

    const payload = {
      name: trimmedName,
      access: keyAccess,
      expires_at: calculateExpiresAt(keyExpiry),
    }

    try {
      const response = await createApiKeyMutation.mutateAsync(payload)
      if (response.success && response.data) {
        // Stay in the same modal and advance to Step 2
        setCreatedKeyData(response.data)
        setCreateStep(2)
        onAction(`API key "${response.data.name}" generated. Copy your key now.`)
      } else {
        setFormError(response.message || 'Failed to create API key.')
      }
    } catch (err) {
      const message = formatApiErrorMessage(err, 'Failed to create API key. Please check your input.')
      setFormError(message)
    }
  }

  // Handle Revoke / Delete
  const handleConfirmDelete = async () => {
    if (!keyToDelete) return
    try {
      await deleteApiKeyMutation.mutateAsync(keyToDelete.id)
      onAction(`API key "${keyToDelete.name}" was revoked.`)
      setKeyToDelete(null)
    } catch (err) {
      const message = formatApiErrorMessage(err, 'Failed to revoke API key.')
      onAction(`Error: ${message}`)
    }
  }

  // Copy raw secret key from Step 2
  const copyRawKey = async (keyText: string) => {
    try {
      await navigator.clipboard.writeText(keyText)
      setCopiedKey(true)
      onAction('API key copied to clipboard.')
      setTimeout(() => setCopiedKey(false), 2500)
    } catch {
      onAction('Clipboard access is restricted.')
    }
  }

  // Copy prefix from table
  const copyPrefix = async (prefix: string, keyId: string) => {
    try {
      await navigator.clipboard.writeText(prefix)
      setCopiedPrefixId(keyId)
      onAction(`Prefix "${prefix}" copied.`)
      setTimeout(() => setCopiedPrefixId(null), 2000)
    } catch {
      onAction('Clipboard access is restricted.')
    }
  }

  // Generic text copier
  const copyTextToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedSmtpField(fieldName)
      onAction(`Copied ${fieldName} to clipboard.`)
      setTimeout(() => setCopiedSmtpField(null), 2000)
    } catch {
      onAction('Clipboard access is restricted.')
    }
  }

  // Quick start code snippets requested by user
  const codeSnippets: Record<CodeLanguage, string> = {
    cURL: `curl "$API_URL/api/mails/send-mail" \\
  -H "Authorization: Bearer $MAILER_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "from_email": "no-reply@yourdomain.com",
    "to": ["customer@example.com"],
    "subject": "Your server is ready",
    "html": "<p>Your VPS <b>vps-sg-142</b> is online.</p>"
  }'`,
    'Node.js': `const res = await fetch(\`\${process.env.API_URL}/api/mails/send-mail\`, {
  method: "POST",
  headers: {
    Authorization: \`Bearer \${process.env.MAILER_API_KEY}\`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    from_email: "no-reply@yourdomain.com",
    to: ["customer@example.com"],
    subject: "Your server is ready",
    html: "<p>Your VPS <b>vps-sg-142</b> is online.</p>",
  }),
});`,
    Python: `import os, requests

requests.post(
    f"{os.environ['API_URL']}/api/mails/send-mail",
    headers={"Authorization": f"Bearer {os.environ['MAILER_API_KEY']}"},
    json={
        "from_email": "no-reply@yourdomain.com",
        "to": ["customer@example.com"],
        "subject": "Your server is ready",
        "html": "<p>Your VPS <b>vps-sg-142</b> is online.</p>",
    },
)`,
  }

  // Copy snippet
  const handleCopyCodeSnippet = async () => {
    try {
      await navigator.clipboard.writeText(codeSnippets[activeCodeLang])
      setCopiedCode(true)
      onAction(`${activeCodeLang} snippet copied to clipboard.`)
      setTimeout(() => setCopiedCode(false), 2500)
    } catch {
      onAction('Clipboard access is restricted.')
    }
  }

  // Format date helper
  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'Never'
    try {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return dateStr
      return d.toLocaleDateString('en-US', {
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

  // Check if a key is expired
  const isKeyExpired = (expiresAtStr?: string | null) => {
    if (!expiresAtStr) return false
    try {
      const d = new Date(expiresAtStr)
      return d.getTime() < Date.now()
    } catch {
      return false
    }
  }

  return (
    <>
      {/* Page Heading Row */}
      <div className="page-heading-row">
        <div>
          <div className="page-eyebrow">
            DEVELOPER TOOLS <span>/</span>{' '}
            {activeTab === 'keys'
              ? 'API KEYS'
              : activeTab === 'smtp'
              ? 'SMTP RELAY'
              : 'QUICK START'}
          </div>
          <h1>
            {activeTab === 'keys'
              ? 'API keys'
              : activeTab === 'smtp'
              ? 'SMTP relay'
              : 'Quick start'}
          </h1>
          <p>
            {activeTab === 'keys'
              ? 'Generate and manage secret keys for authenticating API requests.'
              : activeTab === 'smtp'
              ? 'Use these credentials in WordPress, WHMCS, Laravel or any application that speaks SMTP.'
              : 'Send your first transactional email in minutes using our REST API.'}
          </p>
        </div>
        <div className="page-heading-actions">
          {activeTab === 'keys' && (
            <button
              type="button"
              className="button button-secondary"
              onClick={() => refetch()}
              disabled={isRefetching || isLoading}
              title="Refresh API keys"
            >
              <RefreshCw
                size={14}
                className={isRefetching || isLoading ? 'animate-spin' : ''}
              />
              <span>Refresh</span>
            </button>
          )}
          <button
            type="button"
            className="button button-primary"
            onClick={() => handleOpenCreateModal('write')}
          >
            <Plus size={15} />
            <span>Create API key</span>
          </button>
        </div>
      </div>

      {/* Persistent Section Navigation Tabs: NEVER HIDDEN ACROSS ALL 3 TABS */}
      <div className="section-tabs" style={{ marginBottom: '22px' }}>
        <button
          type="button"
          className={activeTab === 'keys' ? 'active' : ''}
          onClick={() => handleTabChange('keys')}
        >
          API keys
        </button>
        <button
          type="button"
          className={activeTab === 'smtp' ? 'active' : ''}
          onClick={() => handleTabChange('smtp')}
        >
          SMTP relay
        </button>
        <button
          type="button"
          className={activeTab === 'quickstart' ? 'active' : ''}
          onClick={() => handleTabChange('quickstart')}
        >
          Quick start
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: API KEYS MANAGEMENT VIEW                          */}
      {/* ======================================================== */}
      {activeTab === 'keys' && (
        <>
          {/* Global Query Error Banner if GET fails */}
          {isError && (
            <div
              style={{
                marginBottom: '20px',
                padding: '14px 16px',
                borderRadius: '10px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#991b1b',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0, color: '#dc2626' }} />
              <div style={{ flex: 1, fontSize: '13.5px' }}>
                <strong>Unable to load API keys:</strong>{' '}
                {formatApiErrorMessage(error, 'Failed to connect to backend server.')}
              </div>
              <button
                type="button"
                className="button button-secondary"
                style={{ height: '30px', fontSize: '12px' }}
                onClick={() => refetch()}
              >
                Try again
              </button>
            </div>
          )}

          {/* Metric summary banner */}
          <section
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '14px',
              marginBottom: '20px',
            }}
          >
            <article className="metric-card" style={{ padding: '16px 20px' }}>
              <div className="metric-card-head">
                <span>Total API Keys</span>
                <span className="metric-icon metric-icon-0">
                  <Key size={16} />
                </span>
              </div>
              <div
                className="metric-number"
                style={{ fontSize: '26px', marginTop: '6px' }}
              >
                {totalKeys}
              </div>
              <div className="metric-foot">
                <span>Active credentials</span>
              </div>
            </article>

            <article className="metric-card" style={{ padding: '16px 20px' }}>
              <div className="metric-card-head">
                <span>Read &amp; Write Keys</span>
                <span className="metric-icon metric-icon-1">
                  <CheckCircle2 size={16} />
                </span>
              </div>
              <div
                className="metric-number"
                style={{ fontSize: '26px', marginTop: '6px' }}
              >
                {readWriteCount}
              </div>
              <div className="metric-foot">
                <span>Full API capabilities</span>
              </div>
            </article>

            <article className="metric-card" style={{ padding: '16px 20px' }}>
              <div className="metric-card-head">
                <span>Read-Only Keys</span>
                <span className="metric-icon metric-icon-2">
                  <Lock size={16} />
                </span>
              </div>
              <div
                className="metric-number"
                style={{ fontSize: '26px', marginTop: '6px' }}
              >
                {readOnlyCount}
              </div>
              <div className="metric-foot">
                <span>Restricted access</span>
              </div>
            </article>
          </section>

          {/* Data Panel */}
          <section className="data-panel">
            <div className="data-panel-top">
              <div>
                <h2>Active API credentials</h2>
                <p>
                  {filteredKeys.length.toLocaleString()}{' '}
                  {filteredKeys.length === 1 ? 'credential' : 'credentials'} configured
                </p>
              </div>
            </div>

            {/* Search & Filter Controls */}
            <div className="table-filter-bar">
              <label className="table-search-control">
                <Search size={15} aria-hidden="true" />
                <input
                  aria-label="Search API keys by name or prefix"
                  placeholder="Search keys by name or prefix…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => setSearchQuery('')}
                  >
                    ×
                  </button>
                )}
              </label>
              <div className="table-filter-controls">
                <label className="table-filter-control">
                  <span>Access</span>
                  <select
                    aria-label="Filter by access level"
                    value={accessFilter}
                    onChange={(e) => setAccessFilter(e.target.value as any)}
                  >
                    <option value="all">All access types</option>
                    <option value="read">Read only</option>
                    <option value="write">Read &amp; write</option>
                  </select>
                </label>
                <button
                  className="table-reset-button"
                  type="button"
                  disabled={!searchQuery && accessFilter === 'all'}
                  onClick={() => {
                    setSearchQuery('')
                    setAccessFilter('all')
                  }}
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div
                style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b' }}
              >
                <Loader2
                  size={30}
                  className="animate-spin"
                  style={{ margin: '0 auto 12px', color: '#176ef5' }}
                />
                <p style={{ fontSize: '14px', fontWeight: 500 }}>
                  Loading API keys from backend…
                </p>
              </div>
            )}

            {/* Desktop Table View - Note: RAW SECRET KEY IS NEVER EXPOSED HERE, ONLY PREFIX */}
            {!isLoading && (
              <div className="desktop-table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '28%' }}>Name &amp; Token</th>
                      <th style={{ width: '16%' }}>Access</th>
                      <th style={{ width: '18%' }}>Created</th>
                      <th style={{ width: '18%' }}>Expires</th>
                      <th style={{ width: '14%' }}>Last Used</th>
                      <th style={{ width: '6%', textAlign: 'right' }}>
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredKeys.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="table-empty-state"
                          style={{ padding: '48px 20px', textAlign: 'center' }}
                        >
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '48px',
                              height: '48px',
                              borderRadius: '12px',
                              backgroundColor: '#f1f5f9',
                              color: '#64748b',
                              marginBottom: '12px',
                            }}
                          >
                            <Braces size={22} />
                          </div>
                          <h4
                            style={{
                              margin: '0 0 6px',
                              fontSize: '15px',
                              fontWeight: 650,
                              color: '#1e293b',
                            }}
                          >
                            No API keys found
                          </h4>
                          <p
                            style={{
                              margin: '0 0 16px',
                              fontSize: '13.5px',
                              color: '#64748b',
                            }}
                          >
                            {searchQuery || accessFilter !== 'all'
                              ? 'No keys match your search criteria. Try resetting the filters.'
                              : 'Get started by creating your first API key for sending messages or querying the REST API.'}
                          </p>
                          {!searchQuery && accessFilter === 'all' && (
                            <button
                              type="button"
                              className="button button-primary"
                              onClick={() => handleOpenCreateModal('write')}
                            >
                              <Plus size={14} /> Create API key
                            </button>
                          )}
                        </td>
                      </tr>
                    ) : (
                      paginatedKeys.map((item) => {
                        const expired = isKeyExpired(item.expires_at)
                        const isWrite = item.access.toLowerCase() === 'write'

                        return (
                          <tr key={item.id}>
                            {/* Name & Token: ONLY PREFIX IS SHOWN */}
                            <td>
                              <div className="table-name-cell">
                                <span
                                  className="table-row-avatar"
                                  style={{
                                    backgroundColor: isWrite ? '#ecfdf5' : '#eff6ff',
                                    color: isWrite ? '#059669' : '#2563eb',
                                    display: 'grid',
                                    placeItems: 'center',
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '8px',
                                  }}
                                >
                                  <Key size={15} />
                                </span>
                                <div
                                  style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '3px',
                                  }}
                                >
                                  <b style={{ color: '#0f172a', fontSize: '13.5px' }}>
                                    {item.name}
                                  </b>
                                  <div
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '6px',
                                    }}
                                  >
                                    <code
                                      style={{
                                        fontFamily: 'monospace',
                                        fontSize: '12px',
                                        color: '#475569',
                                        backgroundColor: '#f1f5f9',
                                        padding: '1px 6px',
                                        borderRadius: '4px',
                                        letterSpacing: '0.02em',
                                      }}
                                      title="Token Prefix (Full key is masked for security)"
                                    >
                                      {item.prefix}••••••••
                                    </code>
                                    {/* <button
                                      type="button"
                                      onClick={() => copyPrefix(item.prefix, item.id)}
                                      title="Copy key prefix"
                                      style={{
                                        border: 'none',
                                        background: 'transparent',
                                        cursor: 'pointer',
                                        color:
                                          copiedPrefixId === item.id
                                            ? '#10b981'
                                            : '#94a3b8',
                                        padding: '2px',
                                        display: 'inline-flex',
                                      }}
                                    >
                                      {copiedPrefixId === item.id ? (
                                        <Check size={13} />
                                      ) : (
                                        <Copy size={13} />
                                      )}
                                    </button> */}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Access */}
                            <td>
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  padding: '3px 9px',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  backgroundColor: isWrite ? '#eef2ff' : '#f0fdf4',
                                  color: isWrite ? '#4338ca' : '#15803d',
                                  border: `1px solid ${
                                    isWrite ? '#c7d2fe' : '#bbf7d0'
                                  }`,
                                }}
                              >
                                {isWrite ? <ShieldAlert size={12} /> : <Lock size={12} />}
                                {isWrite ? 'Read and Write' : 'Read only'}
                              </span>
                            </td>

                            {/* Created */}
                            <td>
                              <span style={{ fontSize: '13px', color: '#475569' }}>
                                {formatDate(item.created_at)}
                              </span>
                            </td>

                            {/* Expires */}
                            <td>
                              {expired ? (
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    color: '#b91c1c',
                                    backgroundColor: '#fef2f2',
                                    padding: '2px 7px',
                                    borderRadius: '4px',
                                  }}
                                >
                                  <AlertCircle size={12} /> Expired
                                </span>
                              ) : item.expires_at ? (
                                <span style={{ fontSize: '13px', color: '#475569' }}>
                                  {formatDate(item.expires_at)}
                                </span>
                              ) : (
                                <span
                                  style={{
                                    fontSize: '12px',
                                    color: '#059669',
                                    fontWeight: 600,
                                    backgroundColor: '#f0fdf4',
                                    padding: '2px 7px',
                                    borderRadius: '4px',
                                  }}
                                >
                                  Never
                                </span>
                              )}
                            </td>

                            {/* Last Used */}
                            <td>
                              <span
                                style={{
                                  fontSize: '13px',
                                  color: item.last_used_at ? '#334155' : '#94a3b8',
                                }}
                              >
                                {item.last_used_at
                                  ? formatDate(item.last_used_at)
                                  : 'Never used'}
                              </span>
                            </td>

                            {/* Actions */}
                            <td style={{ textAlign: 'right' }}>
                              <button
                                type="button"
                                onClick={() => setKeyToDelete(item)}
                                title={`Revoke ${item.name}`}
                                style={{
                                  border: 'none',
                                  backgroundColor: 'transparent',
                                  color: '#94a3b8',
                                  cursor: 'pointer',
                                  padding: '6px',
                                  borderRadius: '6px',
                                  transition: 'color 0.15s, background-color 0.15s',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.color = '#ef4444'
                                  e.currentTarget.style.backgroundColor = '#fee2e2'
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.color = '#94a3b8'
                                  e.currentTarget.style.backgroundColor = 'transparent'
                                }}
                                aria-label={`Revoke API key ${item.name}`}
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Mobile View */}
            {!isLoading && filteredKeys.length > 0 && (
              <div className="mobile-data-cards">
                {paginatedKeys.map((item) => {
                  const isWrite = item.access.toLowerCase() === 'write'
                  const expired = isKeyExpired(item.expires_at)
                  return (
                    <article className="mobile-data-card" key={item.id}>
                      <div className="mobile-card-top">
                        <div>
                          <b>{item.name}</b>
                          <small style={{ fontFamily: 'monospace' }}>
                            {item.prefix}••••••••
                          </small>
                        </div>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 600,
                            backgroundColor: isWrite ? '#eef2ff' : '#f0fdf4',
                            color: isWrite ? '#4338ca' : '#15803d',
                          }}
                        >
                          {isWrite ? 'Read & Write' : 'Read only'}
                        </span>
                      </div>
                      <div className="mobile-card-meta">
                        <span>
                          Expires:{' '}
                          {expired
                            ? 'Expired'
                            : item.expires_at
                            ? formatDate(item.expires_at)
                            : 'Never'}
                        </span>
                        <span>Created: {formatDate(item.created_at)}</span>
                      </div>
                      <button
                        type="button"
                        className="mobile-card-action"
                        style={{ color: '#dc2626' }}
                        onClick={() => setKeyToDelete(item)}
                      >
                        <Trash2 size={13} style={{ marginRight: '5px' }} /> Revoke key
                      </button>
                    </article>
                  )
                })}
              </div>
            )}

            {/* Table Pagination (Previous format) */}
            {!isLoading && filteredKeys.length > 0 && (
              <TablePagination
                pageIndex={pageIndex}
                pageSize={pageSize}
                totalItems={filteredKeys.length}
                pageSizeOptions={[6, 12, 24]}
                onPageChange={(page) => setPageIndex(page)}
                onPageSizeChange={(size) => {
                  setPageSize(size)
                  setPageIndex(0)
                }}
              />
            )}
          </section>

          {/* Security Best Practice Callout */}
          <section className="inline-callout" style={{ marginTop: '24px' }}>
            <ShieldCheck size={18} />
            <div>
              <b>Keep credentials secure &amp; private</b>
              <p>
                API keys carry full authentication privileges. Never check keys into
                Git repositories or expose them in client-side applications. Use backend
                environment variables (<code>METROMAIL_API_KEY</code>).
              </p>
            </div>
            <button
              type="button"
              className="text-link"
              onClick={() => handleTabChange('quickstart')}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                color: '#176ce6',
                fontWeight: 650,
              }}
            >
              <span>Explore Quick start</span>
              <ArrowRight size={14} />
            </button>
          </section>
        </>
      )}

      {/* ======================================================== */}
      {/* TAB 2: SMTP RELAY VIEW (Reference image 1 design)        */}
      {/* ======================================================== */}
      {activeTab === 'smtp' && (
        <section
          style={{
            maxWidth: '920px',
            backgroundColor: '#ffffff',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)',
            padding: '28px 32px',
          }}
        >
          {/* Card Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '24px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: '#eff6ff',
                color: '#2563eb',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
                marginTop: '2px',
              }}
            >
              <Server size={20} />
            </div>
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: '20px',
                  fontWeight: 650,
                  color: '#0f172a',
                  letterSpacing: '-0.02em',
                }}
              >
                SMTP credentials
              </h2>
              <p
                style={{
                  margin: '4px 0 0',
                  fontSize: '14px',
                  color: '#64748b',
                  lineHeight: 1.5,
                }}
              >
                Use these in WordPress, WHMCS, Laravel or any app that speaks SMTP.
              </p>
            </div>
          </div>

          {/* Credentials Display Fields */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Field 1: Host */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#475569',
                  marginBottom: '6px',
                }}
              >
                Host
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 16px',
                  backgroundColor: '#f1f5f9',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                }}
              >
                <code
                  style={{
                    fontFamily: 'ui-monospace, monospace',
                    fontSize: '14px',
                    color: '#0f172a',
                    fontWeight: 500,
                  }}
                >
                  smtp.mailer.metrovps.com
                </code>
                <button
                  type="button"
                  onClick={() =>
                    copyTextToClipboard('smtp.mailer.metrovps.com', 'Host')
                  }
                  title="Copy host"
                  style={{
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    color: copiedSmtpField === 'Host' ? '#10b981' : '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '4px 6px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 500,
                  }}
                >
                  {copiedSmtpField === 'Host' ? (
                    <>
                      <Check size={16} />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <Copy size={16} />
                  )}
                </button>
              </div>
            </div>

            {/* Field 2: Port */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#475569',
                  marginBottom: '6px',
                }}
              >
                Port
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 16px',
                  backgroundColor: '#f1f5f9',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                }}
              >
                <code
                  style={{
                    fontFamily: 'ui-monospace, monospace',
                    fontSize: '14px',
                    color: '#0f172a',
                    fontWeight: 500,
                  }}
                >
                  587 (STARTTLS), 465 (SSL) or 2525
                </code>
                <button
                  type="button"
                  onClick={() =>
                    copyTextToClipboard('587', 'Port 587')
                  }
                  title="Copy default port 587"
                  style={{
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    color: copiedSmtpField === 'Port 587' ? '#10b981' : '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '4px 6px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 500,
                  }}
                >
                  {copiedSmtpField === 'Port 587' ? (
                    <>
                      <Check size={16} />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <Copy size={16} />
                  )}
                </button>
              </div>
            </div>

            {/* Field 3: Username */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#475569',
                  marginBottom: '6px',
                }}
              >
                Username
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 16px',
                  backgroundColor: '#f1f5f9',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                }}
              >
                <code
                  style={{
                    fontFamily: 'ui-monospace, monospace',
                    fontSize: '14px',
                    color: '#0f172a',
                    fontWeight: 500,
                  }}
                >
                  apikey
                </code>
                <button
                  type="button"
                  onClick={() => copyTextToClipboard('apikey', 'Username')}
                  title="Copy username"
                  style={{
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    color: copiedSmtpField === 'Username' ? '#10b981' : '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '4px 6px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 500,
                  }}
                >
                  {copiedSmtpField === 'Username' ? (
                    <>
                      <Check size={16} />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <Copy size={16} />
                  )}
                </button>
              </div>
            </div>

            {/* Field 4: Password */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#475569',
                  marginBottom: '6px',
                }}
              >
                Password
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 16px',
                  backgroundColor: '#f1f5f9',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                }}
              >
                <span
                  style={{
                    fontSize: '13.5px',
                    color: '#475569',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Lock size={14} style={{ color: '#2563eb' }} />
                  <span>Any API key with read &amp; write access</span>
                </span>
                <button
                  type="button"
                  onClick={() => handleOpenCreateModal('write')}
                  style={{
                    border: 'none',
                    backgroundColor: '#e0e7ff',
                    color: '#3730a3',
                    fontWeight: 600,
                    fontSize: '12px',
                    padding: '5px 10px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Plus size={13} />
                  <span>Create key</span>
                </button>
              </div>
            </div>
          </div>

          {/* Integration Guide Footer */}
          <div
            style={{
              marginTop: '26px',
              paddingTop: '20px',
              borderTop: '1px solid #f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '13px',
              color: '#64748b',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={17} style={{ color: '#10b981' }} />
              <span>TLS/STARTTLS encryption is enforced on all SMTP connections.</span>
            </div>
            <button
              type="button"
              className="text-link"
              onClick={() => handleTabChange('quickstart')}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#2563eb',
                cursor: 'pointer',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span>View code examples</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </section>
      )}

      {/* ======================================================== */}
      {/* TAB 3: QUICK START VIEW (Reference image 2 design)       */}
      {/* ======================================================== */}
      {activeTab === 'quickstart' && (
        <section
          style={{
            maxWidth: '920px',
            backgroundColor: '#ffffff',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)',
            padding: '28px 32px',
          }}
        >
          {/* Header */}
          <div style={{ marginBottom: '20px' }}>
            <h2
              style={{
                margin: 0,
                fontSize: '20px',
                fontWeight: 650,
                color: '#0f172a',
                letterSpacing: '-0.02em',
              }}
            >
              Send your first email
            </h2>
            <p
              style={{
                margin: '4px 0 0',
                fontSize: '14px',
                color: '#64748b',
              }}
            >
              Create a key with read &amp; write access, then set API_URL and MAILER_API_KEY.
            </p>
          </div>

          {/* Language Selector Sub-tabs (with underline indicator matching image) */}
          <div
            style={{
              display: 'flex',
              gap: '24px',
              borderBottom: '1px solid #e2e8f0',
              marginBottom: '16px',
            }}
          >
            {(['cURL', 'Node.js', 'Python'] as CodeLanguage[]).map((lang) => {
              const isActive = activeCodeLang === lang
              return (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setActiveCodeLang(lang)}
                  style={{
                    padding: '8px 4px 10px',
                    border: 'none',
                    background: 'transparent',
                    fontSize: '14px',
                    fontWeight: 650,
                    color: isActive ? '#0f172a' : '#64748b',
                    borderBottom: isActive
                      ? '2.5px solid #0f172a'
                      : '2.5px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {lang}
                </button>
              )
            })}
          </div>

          {/* Dark Code Block Container */}
          <div
            style={{
              position: 'relative',
              backgroundColor: '#090d16',
              borderRadius: '12px',
              padding: '20px 24px',
              border: '1px solid #1e293b',
              boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.05)',
            }}
          >
            {/* Top Right Copy Code Button */}
            <button
              type="button"
              onClick={handleCopyCodeSnippet}
              title={`Copy ${activeCodeLang} code snippet`}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                border: '1px solid #1e293b',
                backgroundColor: '#131b2c',
                color: copiedCode ? '#10b981' : '#94a3b8',
                borderRadius: '8px',
                padding: '6px 10px',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease',
              }}
            >
              {copiedCode ? <Check size={14} /> : <Copy size={14} />}
              <span>{copiedCode ? 'Copied!' : 'Copy'}</span>
            </button>

            {/* Code Pre & Code element */}
            <pre
              style={{
                margin: 0,
                overflowX: 'auto',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                fontSize: '13.5px',
                lineHeight: 1.7,
                color: '#e2e8f0',
                paddingRight: '60px',
              }}
            >
              <code>{codeSnippets[activeCodeLang]}</code>
            </pre>
          </div>

          {/* Helper Callout below code */}
          <div
            style={{
              marginTop: '22px',
              padding: '14px 18px',
              borderRadius: '10px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Key size={16} style={{ color: '#2563eb' }} />
              <span style={{ fontSize: '13px', color: '#475569' }}>
                Need a new API key? Create a key with <strong>Read &amp; write</strong> access.
              </span>
            </div>
            <button
              type="button"
              className="button button-primary"
              style={{ height: '32px', fontSize: '12.5px', padding: '0 12px' }}
              onClick={() => handleOpenCreateModal('write')}
            >
              <Plus size={13} />
              <span>Generate API key</span>
            </button>
          </div>
        </section>
      )}

      {/* ======================================================== */}
      {/* MULTI-STEP API KEY CREATION MODAL                       */}
      {/* Step 1: Configuration Form                               */}
      {/* Step 2: Show Secret Key & Copy (From POST API response) */}
      {/* ======================================================== */}
      {isCreateOpen && (
        <div
          className="dialog-backdrop"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget && !createApiKeyMutation.isPending) {
              handleCloseCreateModal()
            }
          }}
        >
          <section
            className="action-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-api-key-modal-title"
            style={{ width: 'min(500px, 100%)', paddingTop: '32px' }}
          >
            {/* Modal Close Button (Positioned comfortably above stepper text) */}
            <button
              type="button"
              className="dialog-close"
              aria-label="Close dialog"
              disabled={createApiKeyMutation.isPending}
              onClick={handleCloseCreateModal}
              style={{
                top: '10px',
                right: '14px',
                zIndex: 10,
              }}
            >
              <X size={18} />
            </button>

            {/* Stepper Progress Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '18px',
                paddingBottom: '14px',
                paddingRight: '36px',
                borderBottom: '1px solid #f1f5f9',
              }}
            >
              {/* Step 1 Pill */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    backgroundColor: createStep === 2 ? '#10b981' : '#176ef5',
                    color: '#ffffff',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: '11px',
                    fontWeight: 700,
                  }}
                >
                  {createStep === 2 ? <Check size={12} /> : '1'}
                </span>
                <span
                  style={{
                    fontSize: '12.5px',
                    fontWeight: 650,
                    color: createStep === 1 ? '#0f172a' : '#64748b',
                  }}
                >
                  Configure Key
                </span>
              </div>

              {/* Connecting Line */}
              <div
                style={{
                  flex: 1,
                  height: '2px',
                  backgroundColor: createStep === 2 ? '#10b981' : '#e2e8f0',
                  borderRadius: '2px',
                  transition: 'background-color 0.25s ease',
                }}
              />

              {/* Step 2 Pill */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    backgroundColor: createStep === 2 ? '#176ef5' : '#e2e8f0',
                    color: createStep === 2 ? '#ffffff' : '#64748b',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: '11px',
                    fontWeight: 700,
                    transition: 'all 0.25s ease',
                  }}
                >
                  2
                </span>
                <span
                  style={{
                    fontSize: '12.5px',
                    fontWeight: 650,
                    color: createStep === 2 ? '#0f172a' : '#94a3b8',
                  }}
                >
                  Save Secret Key
                </span>
              </div>
            </div>

            {/* STEP 1: CONFIGURATION FORM */}
            {createStep === 1 && (
              <>
                <div className="dialog-icon">
                  <Key size={19} />
                </div>
                <div className="eyebrow">DEVELOPER TOOLS</div>
                <h2 id="create-api-key-modal-title">Create an API key</h2>
                <p>
                  Generate a secret API key to authenticate requests with the MetroMail REST API.
                </p>

                {/* Error Banner */}
                {formError && (
                  <div
                    style={{
                      marginBottom: '14px',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      backgroundColor: '#fef2f2',
                      border: '1px solid #fecaca',
                      color: '#b91c1c',
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <AlertCircle size={15} style={{ flexShrink: 0 }} />
                    <span>{formError}</span>
                  </div>
                )}

                <form onSubmit={handleCreateSubmit} className="dialog-form">
                  {/* Field 1: Key Name */}
                  <label>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <span>Key Name</span>
                      <span style={{ color: '#ef4444', fontWeight: 700 }}>*</span>
                    </span>
                    <input
                      type="text"
                      placeholder="e.g. Production Webhook Backend"
                      value={keyName}
                      maxLength={100}
                      autoFocus
                      required
                      disabled={createApiKeyMutation.isPending}
                      onChange={(e) => {
                        setKeyName(e.target.value)
                        if (formError) setFormError(null)
                      }}
                    />
                    <small style={{ color: '#94a3b8', fontSize: '11.5px', marginTop: '2px' }}>
                      A recognizable label for identifying where this key is used.
                    </small>
                  </label>

                  {/* Field 2: Access Level (Read only & Read and Write) */}
                  <label style={{ marginTop: '4px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <span>Access Level</span>
                      <span style={{ color: '#ef4444', fontWeight: 700 }}>*</span>
                    </span>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '10px',
                        marginTop: '4px',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setKeyAccess('read')}
                        disabled={createApiKeyMutation.isPending}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: `1.5px solid ${keyAccess === 'read' ? '#176ef5' : '#e2e8f0'}`,
                          backgroundColor: keyAccess === 'read' ? '#f0f6ff' : '#ffffff',
                          color: keyAccess === 'read' ? '#0f172a' : '#64748b',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.15s ease',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '3px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 650, fontSize: '13px' }}>
                          <Lock size={14} style={{ color: keyAccess === 'read' ? '#176ef5' : '#94a3b8' }} />
                          <span>Read only</span>
                        </div>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>
                          View logs &amp; records
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setKeyAccess('write')}
                        disabled={createApiKeyMutation.isPending}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: `1.5px solid ${keyAccess === 'write' ? '#176ef5' : '#e2e8f0'}`,
                          backgroundColor: keyAccess === 'write' ? '#f0f6ff' : '#ffffff',
                          color: keyAccess === 'write' ? '#0f172a' : '#64748b',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.15s ease',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '3px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 650, fontSize: '13px' }}>
                          <ShieldCheck size={14} style={{ color: keyAccess === 'write' ? '#176ef5' : '#94a3b8' }} />
                          <span>Read and Write</span>
                        </div>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>
                          Send emails &amp; modify
                        </span>
                      </button>
                    </div>
                  </label>

                  {/* Field 3: Expires After (4 options: 30 days, 90 days, 1 year, Never) */}
                  <label style={{ marginTop: '6px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                      <span>Expires After</span>
                    </span>
                    <select
                      value={keyExpiry}
                      disabled={createApiKeyMutation.isPending}
                      onChange={(e) => setKeyExpiry(e.target.value as ExpiryOption)}
                      style={{
                        height: '38px',
                        padding: '0 10px',
                        border: '1px solid #e0e6ed',
                        borderRadius: '7px',
                        color: '#40526a',
                        fontSize: '13.5px',
                        backgroundColor: '#fff',
                        marginTop: '4px',
                      }}
                    >
                      <option value="30d">30 days</option>
                      <option value="90d">90 days</option>
                      <option value="1y">1 year</option>
                      <option value="never">Never</option>
                    </select>
                    <small style={{ color: '#94a3b8', fontSize: '11.5px', marginTop: '2px' }}>
                      Recommended: set an expiration policy for automated key rotation.
                    </small>
                  </label>

                  {/* Form Footer Buttons */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      gap: '10px',
                      marginTop: '16px',
                    }}
                  >
                    <button
                      type="button"
                      className="button button-secondary"
                      disabled={createApiKeyMutation.isPending}
                      onClick={handleCloseCreateModal}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="button button-primary"
                      disabled={createApiKeyMutation.isPending || !keyName.trim()}
                      style={{ minWidth: '135px' }}
                    >
                      {createApiKeyMutation.isPending ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          <span>Generating…</span>
                        </>
                      ) : (
                        <>
                          <Key size={14} />
                          <span>Generate API key</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* STEP 2: SECRET KEY REVEAL & COPY (INSIDE THE SAME MODAL) */}
            {createStep === 2 && createdKeyData && (
              <>
                <div
                  className="dialog-icon"
                  style={{ backgroundColor: '#ecfdf5', color: '#059669' }}
                >
                  <CheckCircle2 size={22} />
                </div>
                <div className="eyebrow" style={{ color: '#059669' }}>
                  STEP 2 OF 2 · SAVE YOUR API KEY
                </div>
                <h2 id="create-api-key-modal-title">API key generated</h2>
                <p>
                  Copy and store your secret key now. For your security, this key cannot be shown
                  again.
                </p>

                {/* Important Security Warning */}
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: '8px',
                    backgroundColor: '#fffbeb',
                    border: '1px solid #fde68a',
                    color: '#92400e',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    marginBottom: '16px',
                    lineHeight: '1.5',
                  }}
                >
                  <AlertTriangle
                    size={17}
                    style={{ flexShrink: 0, marginTop: '2px', color: '#d97706' }}
                  />
                  <div>
                    <strong>Important:</strong> Store this key in a secure location. Once you close this window, the raw key will never be visible again (in the API key table, only the prefix is shown).
                  </div>
                </div>

                {/* Raw Secret Key Display Box */}
                <div
                  style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: '#0f172a',
                    borderRadius: '9px',
                    padding: '10px 14px',
                    border: '1px solid #1e293b',
                    gap: '10px',
                    marginBottom: '18px',
                  }}
                >
                  <code
                    style={{
                      flex: 1,
                      fontFamily: 'monospace',
                      fontSize: '13px',
                      color: '#f8fafc',
                      wordBreak: 'break-all',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {showKeySecret
                      ? createdKeyData.key
                      : `${createdKeyData.key.slice(0, 8)}${'•'.repeat(Math.max(16, createdKeyData.key.length - 12))}${createdKeyData.key.slice(-4)}`}
                  </code>

                  {/* Show/Hide Secret Toggle */}
                  <button
                    type="button"
                    onClick={() => setShowKeySecret(!showKeySecret)}
                    title={showKeySecret ? 'Hide secret key' : 'Show secret key'}
                    style={{
                      border: 'none',
                      backgroundColor: '#1e293b',
                      color: '#94a3b8',
                      borderRadius: '6px',
                      padding: '7px',
                      cursor: 'pointer',
                      display: 'grid',
                      placeItems: 'center',
                    }}
                  >
                    {showKeySecret ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>

                  {/* Copy Key Button */}
                  <button
                    type="button"
                    onClick={() => copyRawKey(createdKeyData.key)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '7px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: copiedKey ? '#10b981' : '#2563eb',
                      color: '#ffffff',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease',
                      flexShrink: 0,
                    }}
                  >
                    {copiedKey ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedKey ? 'Copied!' : 'Copy Key'}</span>
                  </button>
                </div>

                {/* Key Summary Details */}
                <div
                  style={{
                    backgroundColor: '#f8fafc',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    fontSize: '12.5px',
                    color: '#475569',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    marginBottom: '20px',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Key name</span>
                    <strong style={{ color: '#0f172a' }}>{createdKeyData.name}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Access permissions</span>
                    <span
                      style={{
                        fontWeight: 600,
                        color: createdKeyData.access === 'write' ? '#4338ca' : '#15803d',
                      }}
                    >
                      {createdKeyData.access === 'write' ? 'Read and Write' : 'Read only'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Key prefix</span>
                    <code style={{ fontFamily: 'monospace', color: '#0f172a' }}>
                      {createdKeyData.prefix}
                    </code>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Expires on</span>
                    <span>{createdKeyData.expires_at ? formatDate(createdKeyData.expires_at) : 'Never'}</span>
                  </div>
                </div>

                {/* Done Button */}
                <button
                  type="button"
                  className="button button-primary"
                  style={{ width: '100%', height: '38px', fontSize: '14px' }}
                  onClick={handleCloseCreateModal}
                >
                  <Check size={15} />
                  <span>I have saved my API key</span>
                </button>
              </>
            )}
          </section>
        </div>
      )}

      {/* ======================================================== */}
      {/* CONFIRM REVOKE / DELETE MODAL                            */}
      {/* ======================================================== */}
      {keyToDelete && (
        <div
          className="dialog-backdrop"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget && !deleteApiKeyMutation.isPending) {
              setKeyToDelete(null)
            }
          }}
        >
          <section
            className="action-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="revoke-key-modal-title"
            style={{ width: 'min(440px, 100%)' }}
          >
            <button
              type="button"
              className="dialog-close"
              aria-label="Close dialog"
              disabled={deleteApiKeyMutation.isPending}
              onClick={() => setKeyToDelete(null)}
            >
              <X size={18} />
            </button>

            <div
              className="dialog-icon"
              style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}
            >
              <Trash2 size={20} />
            </div>
            <div className="eyebrow" style={{ color: '#dc2626' }}>
              REVOKE CREDENTIAL
            </div>
            <h2 id="revoke-key-modal-title">Revoke API key?</h2>
            <p style={{ marginBottom: '14px' }}>
              Are you sure you want to revoke <strong>&ldquo;{keyToDelete.name}&rdquo;</strong>?
            </p>

            <div
              style={{
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#991b1b',
                fontSize: '13px',
                lineHeight: '1.5',
                marginBottom: '20px',
              }}
            >
              Any script, service, or server using this key will immediately receive <code>401 Unauthorized</code> errors and will be unable to send email or query the API. This action cannot be undone.
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px',
              }}
            >
              <button
                type="button"
                className="button button-secondary"
                disabled={deleteApiKeyMutation.isPending}
                onClick={() => setKeyToDelete(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="button"
                style={{
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  minWidth: '120px',
                }}
                disabled={deleteApiKeyMutation.isPending}
                onClick={handleConfirmDelete}
              >
                {deleteApiKeyMutation.isPending ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Revoking…</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    <span>Revoke key</span>
                  </>
                )}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  )
}
