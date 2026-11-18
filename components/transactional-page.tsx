'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  ArrowUpRight,
  Braces,
  Check,
  Globe2,
  Mail,
  Send,
  ShieldCheck,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Server,
  Sparkles,
  ExternalLink,
} from 'lucide-react'
import { StatusBadge } from '@/components/status-badge'
import { EmailEditor } from '@/components/email-editor'
import { useDomainsQuery } from '@/lib/hooks/use-domains-query'
import { useMailsQuery, useSendMailMutation } from '@/lib/hooks/use-mails-query'
import { formatApiErrorMessage } from '@/lib/api-client'
import type { MailItem } from '@/lib/api/mails'

export function TransactionalPage({ onAction }: { onAction: (message: string) => void }) {
  // Queries
  const { data: domainsResponse, isLoading: domainsLoading } = useDomainsQuery()
  const { data: mailsResponse, isLoading: mailsLoading, refetch: refetchMails } = useMailsQuery()
  const sendMailMutation = useSendMailMutation()

  // Filter verified domains for the From address domain selector
  const verifiedDomains = useMemo(() => {
    return domainsResponse?.data?.filter((d) => d.is_verified) ?? []
  }, [domainsResponse])

  // Form states
  const [fromUser, setFromUser] = useState('support')
  const [selectedDomain, setSelectedDomain] = useState<string>('')
  const [fromName, setFromName] = useState('MetroVPS')
  const [recipient, setRecipient] = useState('')
  const [subject, setSubject] = useState('Your order is on its way')
  const [selectedNode, setSelectedNode] = useState<'node-158' | 'node-253'>('node-158')

  // Advanced fields
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [replyTo, setReplyTo] = useState('')
  const [cc, setCc] = useState('')
  const [bcc, setBcc] = useState('')
  const [customHeaders, setCustomHeaders] = useState('')

  // Editor content
  const [emailContent, setEmailContent] = useState({
    html: '',
    text: '',
  })

  const handleEditorChange = useCallback(({ html, text }: { html: string; text: string }) => {
    setEmailContent((prev) => {
      if (prev.html === html && prev.text === text) return prev
      return { html, text }
    })
  }, [])

  // Submission feedback
  const [lastSentItem, setLastSentItem] = useState<MailItem | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)

  // Auto-select first verified domain when loaded
  useEffect(() => {
    if (verifiedDomains.length > 0 && !selectedDomain) {
      setSelectedDomain(verifiedDomains[0].name)
    }
  }, [verifiedDomains, selectedDomain])

  // Combined From Email preview
  const fromEmail = selectedDomain
    ? `${fromUser.trim().toLowerCase()}@${selectedDomain.trim()}`
    : ''

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setApiError(null)

    // Validation
    const cleanUser = fromUser.trim().toLowerCase()
    if (!cleanUser) {
      setApiError('Please enter a username or prefix for the From address (e.g. support, hello).')
      return
    }

    if (!selectedDomain) {
      setApiError('Please select a verified sending domain. If none are listed, verify one in Sending Domains first.')
      return
    }

    const cleanTo = recipient
      .split(/[,;]/)
      .map((item) => item.trim())
      .filter(Boolean)

    if (cleanTo.length === 0) {
      setApiError('Please enter at least one recipient email address in the To field.')
      return
    }

    if (!subject.trim()) {
      setApiError('Please enter a subject line for the email.')
      return
    }

    // Parse CC & BCC
    const cleanCc = cc
      .split(/[,;]/)
      .map((item) => item.trim())
      .filter(Boolean)

    const cleanBcc = bcc
      .split(/[,;]/)
      .map((item) => item.trim())
      .filter(Boolean)

    // Parse custom headers
    let headersObj: Record<string, string> | undefined = undefined
    if (customHeaders.trim()) {
      try {
        headersObj = JSON.parse(customHeaders)
      } catch {
        // Fallback: parse key: value lines
        headersObj = {}
        const lines = customHeaders.split('\n')
        for (const line of lines) {
          const colonIdx = line.indexOf(':')
          if (colonIdx > 0) {
            const key = line.slice(0, colonIdx).trim()
            const val = line.slice(colonIdx + 1).trim()
            if (key) headersObj[key] = val
          }
        }
      }
    }

    try {
      const payload = {
        from_email: `${cleanUser}@${selectedDomain}`,
        from_name: fromName.trim() || undefined,
        to: cleanTo,
        cc: cleanCc.length > 0 ? cleanCc : undefined,
        bcc: cleanBcc.length > 0 ? cleanBcc : undefined,
        reply_to: replyTo.trim() || undefined,
        subject: subject.trim(),
        text: emailContent.text || `Test message: ${subject.trim()}`,
        html: emailContent.html || `<p>${subject.trim()}</p>`,
        headers: headersObj,
        attachments: [],
        node: selectedNode,
      }

      const res = await sendMailMutation.mutateAsync(payload)

      if (res && res.data) {
        setLastSentItem(res.data)
        setApiError(null)
        onAction(`Message successfully sent to ${cleanTo.join(', ')} via ${selectedNode}.`)
        refetchMails()
      }
    } catch (err: unknown) {
      const errorMsg = formatApiErrorMessage(err, 'Failed to send transactional message.')
      setApiError(errorMsg)
      onAction(`Send failed: ${errorMsg}`)
    }
  }

  // Live recent mails
  const recentMails: MailItem[] = mailsResponse?.data?.slice(0, 5) ?? []

  return (
    <>
      <div className="page-heading-row">
        <div>
          <div className="page-eyebrow">
            DELIVERABILITY <span>/</span> TRANSACTIONAL EMAIL
          </div>
          <h1>Transactional email</h1>
          <p>Send and monitor the product messages your customers rely on.</p>
        </div>
        <Link href="/app/logs" className="button button-secondary">
          View all email logs <ArrowRight size={14} />
        </Link>
      </div>

      <section className="transactional-metrics">
        {[
          ['Delivered this month', '182,408', '+8.6%'],
          ['Delivery rate', '99.98%', '+0.3%'],
          ['Median latency', '48 ms', '−6 ms'],
          ['Failed messages', '84', '−12.4%'],
        ].map(([label, value, change]) => (
          <article key={label}>
            <small>{label}</small>
            <b>{value}</b>
            <span>
              <ArrowUpRight size={12} /> {change}
            </span>
          </article>
        ))}
      </section>

      {/* Developer API & Dedicated Sending Nodes Banner */}
      <div className="transactional-developer-banner">
        <div className="developer-banner-left">
          <span className="transactional-aside-icon">
            <Braces size={20} />
          </span>
          <div className="developer-banner-content">
            <h3>Built for Developer REST API &amp; Dedicated Sending Nodes</h3>
            <p>
              Send transactional messages from your app using our secure REST API (<code>POST /api/mails</code>) or dedicated SMTP relay via high-performance MTA nodes.
            </p>
            <div className="developer-banner-domain">
              <span className="domain-status-wrap">
                <span className="status-dot green-dot" />
                <span className="domain-label">Verified sending domains:</span>
                {domainsLoading ? (
                  <span className="domain-loading-text">Loading...</span>
                ) : verifiedDomains.length > 0 ? (
                  <strong className="domain-verified-names">
                    {verifiedDomains.map((d) => d.name).join(', ')}
                  </strong>
                ) : (
                  <span className="domain-unverified-text">None verified yet</span>
                )}
              </span>
              <Link href="/app/domains" className="domain-verify-link">
                <span>Manage domains</span>
                <ArrowRight size={13} className="domain-arrow-icon" />
              </Link>
            </div>
          </div>
        </div>
        <div className="developer-banner-right">
          <pre>
            <code>{`POST /api/mails\nfrom_email: support@${selectedDomain || 'yourdomain.com'}\nto: ["customer@example.com"]\nnode: "${selectedNode}"`}</code>
          </pre>
          <Link href="/app/api-keys/docs" className="button button-secondary dev-guide-btn">
            <span>API Guide</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      <div className="transactional-workspace">
        <section className="transactional-send-card">
          <div className="panel-heading">
            <div>
              <h2>Send a test transactional message</h2>
              <p>Configure parameters, select a verified sending domain &amp; node, and design your template with live preview.</p>
            </div>
            <span className="transactional-test-badge">TEST MODE</span>
          </div>

          {/* Success Notification */}
          {lastSentItem && (
            <div className="transactional-success-banner" role="status">
              <div className="banner-icon-col">
                <Check size={18} />
              </div>
              <div className="banner-body-col">
                <div className="banner-title">
                  Message queued successfully!
                </div>
                <div className="banner-details">
                  <span><strong>ID:</strong> <code>{lastSentItem.id}</code></span>
                  <span><strong>To:</strong> {Array.isArray(lastSentItem.to) ? lastSentItem.to.join(', ') : lastSentItem.to}</span>
                  <span><strong>Node:</strong> <span className="node-pill">{lastSentItem.node || selectedNode}</span></span>
                  <span><strong>Status:</strong> <StatusBadge status={lastSentItem.status || 'pending'} /></span>
                </div>
              </div>
              <div className="banner-action-col">
                <Link href={`/app/logs/${lastSentItem.id}`} className="button button-secondary button-sm">
                  Inspect in Logs <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          )}

          {/* Error Notification */}
          {apiError && (
            <div className="transactional-error-banner" role="alert">
              <AlertCircle size={18} className="error-icon" />
              <div className="error-body">
                <strong>Sending Error:</strong>
                <p>{apiError}</p>
              </div>
              <button
                type="button"
                className="banner-close-btn"
                aria-label="Dismiss error"
                onClick={() => setApiError(null)}
              >
                ×
              </button>
            </div>
          )}

          {/* Main Form Fields */}
          <div className="transactional-form-fields">
            {/* Row 1: Sender Name & Split From Address */}
            <div className="form-grid-2col">
              <label className="field-group">
                <span className="field-label">From name</span>
                <input
                  type="text"
                  value={fromName}
                  onChange={(e) => setFromName(e.target.value)}
                  placeholder="e.g. MetroVPS Support"
                  className="form-input"
                />
              </label>

              <div className="field-group">
                <span className="field-label">
                  From email address <span className="required-star">*</span>
                </span>
                <div className="from-split-container">
                  <input
                    type="text"
                    value={fromUser}
                    onChange={(e) =>
                      setFromUser(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ''))
                    }
                    placeholder="support"
                    className="from-split-user"
                    aria-label="From address username"
                    required
                  />
                  <span className="from-split-at" aria-hidden="true">
                    @
                  </span>
                  <select
                    value={selectedDomain}
                    onChange={(e) => setSelectedDomain(e.target.value)}
                    className="from-split-domain"
                    aria-label="From address verified domain"
                    disabled={domainsLoading || verifiedDomains.length === 0}
                    required
                  >
                    {domainsLoading ? (
                      <option value="">Loading domains...</option>
                    ) : verifiedDomains.length > 0 ? (
                      verifiedDomains.map((d) => (
                        <option key={d.id} value={d.name}>
                          {d.name}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>
                        No verified domains available
                      </option>
                    )}
                  </select>
                </div>
                {verifiedDomains.length === 0 && !domainsLoading ? (
                  <p className="field-helper text-amber-600">
                    No verified domains found.{' '}
                    <Link href="/app/domains" className="text-link">
                      Add &amp; verify a domain here
                    </Link>
                    .
                  </p>
                ) : (
                  <p className="field-helper">
                    Sending as: <code>{fromEmail || 'user@domain.com'}</code>
                  </p>
                )}
              </div>
            </div>

            {/* Row 2: To Address & Node Selector */}
            <div className="form-grid-2col">
              <label className="field-group">
                <span className="field-label">
                  To address(es) <span className="required-star">*</span>
                </span>
                <input
                  type="text"
                  required
                  value={recipient}
                  onChange={(e) => {
                    setRecipient(e.target.value)
                    setApiError(null)
                  }}
                  placeholder="customer@example.com (comma separated for multiple)"
                  className="form-input"
                />
                <span className="field-helper">
                  Recipient email address or comma-separated list.
                </span>
              </label>

              {/* Node Selector - ONLY 2 options: node-158 and node-253 */}
              <label className="field-group">
                <span className="field-label">
                  Sending Node <span className="required-star">*</span>
                </span>
                <div className="select-with-icon">
                  <Server size={15} className="select-icon" />
                  <select
                    value={selectedNode}
                    onChange={(e) =>
                      setSelectedNode(e.target.value as 'node-158' | 'node-253')
                    }
                    className="form-input form-select"
                  >
                    <option value="node-158">node-158 (Primary Dedicated Node)</option>
                    <option value="node-253">node-253 (Secondary High-Throughput Node)</option>
                  </select>
                </div>
                <span className="field-helper">
                  Select the high-speed MTA node cluster for message routing.
                </span>
              </label>
            </div>

            {/* Row 3: Subject line */}
            <div className="form-grid-1col">
              <label className="field-group">
                <span className="field-label">
                  Subject line <span className="required-star">*</span>
                </span>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Your order is on its way"
                  className="form-input"
                />
              </label>
            </div>

            {/* Collapsible Advanced Options (CC, BCC, Reply-To, Headers) */}
            <div className="advanced-options-wrapper">
              <button
                type="button"
                className="advanced-toggle-btn"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                <span>Advanced routing &amp; headers (CC, BCC, Reply-To)</span>
                {showAdvanced ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </button>

              {showAdvanced && (
                <div className="advanced-fields-box">
                  <div className="form-grid-3col">
                    <label className="field-group">
                      <span className="field-label">Reply-to</span>
                      <input
                        type="email"
                        value={replyTo}
                        onChange={(e) => setReplyTo(e.target.value)}
                        placeholder="replies@example.com"
                        className="form-input"
                      />
                    </label>

                    <label className="field-group">
                      <span className="field-label">CC</span>
                      <input
                        type="text"
                        value={cc}
                        onChange={(e) => setCc(e.target.value)}
                        placeholder="cc1@example.com, cc2@example.com"
                        className="form-input"
                      />
                    </label>

                    <label className="field-group">
                      <span className="field-label">BCC</span>
                      <input
                        type="text"
                        value={bcc}
                        onChange={(e) => setBcc(e.target.value)}
                        placeholder="bcc@example.com"
                        className="form-input"
                      />
                    </label>
                  </div>

                  <label className="field-group" style={{ marginTop: '12px' }}>
                    <span className="field-label">
                      Custom JSON or RFC Headers (optional)
                    </span>
                    <textarea
                      value={customHeaders}
                      onChange={(e) => setCustomHeaders(e.target.value)}
                      placeholder={`{\n  "X-Campaign-ID": "order-1234",\n  "X-Custom-Ref": "vps-test"\n}`}
                      rows={3}
                      className="form-textarea font-mono"
                    />
                    <span className="field-helper">
                      Accepts valid JSON (<code>&#123;&quot;X-Header&quot;: &quot;value&quot;&#125;</code>) or line-separated <code>Header: Value</code> pairs.
                    </span>
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Design your email option with live visual & code editor */}
          <div className="transactional-design-section">
            <div className="transactional-design-header">
              <div>
                <div className="eyebrow">
                  <Sparkles size={13} /> DESIGN YOUR EMAIL
                </div>
                <h3>Visual Drag &amp; Drop, HTML Code &amp; Templates</h3>
                <p>
                  Customize your transactional email blocks, switch to HTML code editor, or pick a reusable transactional template.
                </p>
              </div>
            </div>

            <div className="transactional-editor-wrapper">
              <EmailEditor
                onAction={onAction}
                subject={subject || 'Your order is on its way'}
                onChange={handleEditorChange}
              />
            </div>
          </div>

          {/* Footer with Send Button */}
          <div className="transactional-form-footer">
            <span>
              <ShieldCheck size={14} /> Messages are dispatched via verified production cluster
            </span>
            <button
              className="button button-primary"
              type="button"
              disabled={
                sendMailMutation.isPending ||
                !fromUser.trim() ||
                !selectedDomain ||
                !recipient.trim() ||
                !subject.trim()
              }
              onClick={() => handleSend()}
            >
              {sendMailMutation.isPending ? (
                <>
                  <Loader2 size={15} className="animate-spin" /> Sending message...
                </>
              ) : (
                <>
                  <Send size={14} /> Send test message
                </>
              )}
            </button>
          </div>
        </section>
      </div>

      {/* Live Recent Transactional Events */}
      <section className="transactional-recent">
        <div className="panel-heading">
          <div>
            <h2>Recent transactional events</h2>
            <p>Latest live message activity across your workspace.</p>
          </div>
          <Link href="/app/logs" className="text-link">
            All email logs <ArrowRight size={13} />
          </Link>
        </div>

        {mailsLoading ? (
          <div className="loading-state-p">
            <Loader2 size={16} className="animate-spin" /> Loading recent email activity...
          </div>
        ) : recentMails.length === 0 ? (
          <div className="empty-recent-box">
            <Mail size={24} className="text-slate-400" />
            <p>No transactional emails sent yet. Use the form above to send your first message.</p>
          </div>
        ) : (
          recentMails.map((mail) => (
            <div
              className="transactional-event-row"
              key={mail.id}
              style={{ cursor: 'pointer' }}
              onClick={(e) => {
                const target = e.target as HTMLElement
                if (target.closest('a') || target.closest('button')) return
                window.location.href = `/app/logs/${mail.id}`
              }}
            >
              <span className="event-type-icon">
                <Mail size={14} />
              </span>
              <span>
                <b>{mail.subject || '(No subject)'}</b>
                <small>
                  To: {Array.isArray(mail.to) ? mail.to.join(', ') : mail.to} · From: {mail.from_email}
                </small>
              </span>
              <div className="event-badges-col">
                <span className={`node-pill node-pill-${mail.node || '158'}`}>
                  {mail.node || 'node-158'}
                </span>
                <StatusBadge status={mail.status || 'pending'} />
              </div>
              <span className="event-time">
                {mail.created_at ? new Date(mail.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
              </span>
              <Link
                href={`/app/logs/${mail.id}`}
                aria-label={`View message details for ${mail.id}`}
                className="event-row-link"
              >
                <ArrowUpRight size={14} />
              </Link>
            </div>
          ))
        )}
      </section>
    </>
  )
}
