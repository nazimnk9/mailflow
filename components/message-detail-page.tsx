'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Copy,
  Check,
  Mail,
  Server,
  Calendar,
  AlertTriangle,
  Code,
  FileText,
  Paperclip,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
} from 'lucide-react'
import { StatusBadge } from '@/components/status-badge'
import { useMailByIdQuery, useMailsQuery } from '@/lib/hooks/use-mails-query'
import { formatApiErrorMessage } from '@/lib/api-client'
import type { MailEvent, MailAttachment } from '@/lib/api/mails'

export function MessageDetailPage({
  route,
  mailId: initialMailId,
  onAction,
}: {
  route: string
  mailId?: string
  onAction: (message: string) => void
}) {
  const mailId = initialMailId || route.split('/').at(-1) || ''
  const { data: allMailsRes } = useMailsQuery()
  const cachedMail = allMailsRes?.data?.find((m) => m.id === mailId)
  const { data: response, isLoading, isError, error } = useMailByIdQuery(mailId)
  const mail = response?.data || cachedMail

  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<'html' | 'text' | 'headers'>('html')

  const copyId = () => {
    if (!mailId) return
    navigator.clipboard.writeText(mailId)
    setCopied(true)
    onAction(`Message ID ${mailId} copied to clipboard.`)
    setTimeout(() => setCopied(false), 2000)
  }

  if (isLoading && !mail) {
    return (
      <div className="message-detail-loading-wrap">
        <Loader2 size={32} className="animate-spin text-blue-600" />
        <p>Loading email delivery details for message {mailId}...</p>
      </div>
    )
  }

  if (!mail) {
    return (
      <div className="message-detail-error-wrap">
        <div className="transactional-error-banner" role="alert">
          <AlertTriangle size={20} />
          <div className="error-body">
            <strong>Could not load message details:</strong>
            <p>{formatApiErrorMessage(error, `Message ID "${mailId}" could not be found or fetched from server.`)}</p>
          </div>
        </div>
        <Link href="/app/logs" className="button button-secondary" style={{ marginTop: '16px' }}>
          <ArrowLeft size={14} /> Back to Email Logs
        </Link>
      </div>
    )
  }

  const toDisplay = Array.isArray(mail.to) ? mail.to.join(', ') : mail.to
  const ccDisplay = Array.isArray(mail.cc) ? mail.cc.join(', ') : mail.cc
  const bccDisplay = Array.isArray(mail.bcc) ? mail.bcc.join(', ') : mail.bcc

  const events: MailEvent[] = mail.events ?? []
  const attachments: MailAttachment[] = (Array.isArray(mail.attachments)
    ? mail.attachments.filter((a): a is MailAttachment => typeof a === 'object' && a !== null)
    : [])

  return (
    <>
      <div className="page-heading-row">
        <div>
          <div className="page-eyebrow">
            <Link href="/app/logs">EMAIL LOGS</Link> <span>/</span> MESSAGE DETAIL
          </div>
          <h1>{mail.subject || '(No subject)'}</h1>
          <p>Delivery events, remote MTA response, and message metadata.</p>
        </div>
        <div className="page-heading-actions">
          <button
            type="button"
            className="button button-secondary"
            onClick={copyId}
          >
            {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
            <span>{copied ? 'Copied ID' : 'Copy Message ID'}</span>
          </button>
          <Link className="button button-secondary" href="/app/logs">
            <ArrowLeft size={14} /> Back to logs
          </Link>
        </div>
      </div>

      <div className="message-detail-layout">
        {/* Left Column: Metadata & Message Content */}
        <section className="message-detail-card">
          <div className="message-detail-top">
            <div>
              <small>RECIPIENT (TO)</small>
              <b>{toDisplay}</b>
            </div>
            <StatusBadge status={mail.status || 'pending'} />
          </div>

          <div className="message-meta-grid">
            <div>
              <small>SUBJECT</small>
              <b>{mail.subject || '(No subject)'}</b>
            </div>
            <div>
              <small>FROM SENDER</small>
              <b>
                {mail.from_name ? `${mail.from_name} <${mail.from_email}>` : mail.from_email}
              </b>
            </div>
            <div>
              <small>MESSAGE ID</small>
              <code>{mail.id}</code>
            </div>
            <div>
              <small>SENDING NODE</small>
              <div>
                <span className={`node-pill node-pill-${mail.node || '158'}`}>
                  <Server size={12} /> {mail.node || 'node-158'}
                </span>
              </div>
            </div>
            {mail.reply_to && (
              <div>
                <small>REPLY-TO</small>
                <b>{mail.reply_to}</b>
              </div>
            )}
            {ccDisplay && (
              <div>
                <small>CC</small>
                <b>{ccDisplay}</b>
              </div>
            )}
            {bccDisplay && (
              <div>
                <small>BCC</small>
                <b>{bccDisplay}</b>
              </div>
            )}
            <div>
              <small>CREATED AT</small>
              <b>
                {mail.created_at
                  ? new Date(mail.created_at).toLocaleString([], {
                      dateStyle: 'medium',
                      timeStyle: 'medium',
                    })
                  : '—'}
              </b>
            </div>
          </div>

          {/* Error Banner if message status is failed or error returned */}
          {mail.error && (
            <div className="message-error-callout" role="alert">
              <AlertTriangle size={16} />
              <div>
                <strong>Delivery Error:</strong>
                <p>{mail.error}</p>
              </div>
            </div>
          )}

          {/* Attachments list if any */}
          {attachments.length > 0 && (
            <div className="message-attachments-box">
              <small>ATTACHMENTS ({attachments.length})</small>
              <div className="attachment-pills">
                {attachments.map((att, idx) => (
                  <span key={idx} className="attachment-pill">
                    <Paperclip size={12} />
                    <span>{att.filename}</span>
                    <small>({(att.size / 1024).toFixed(1)} KB)</small>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Content Viewer Tabs */}
          <div className="message-content-tabs-wrap">
            <div className="message-tabs-header">
              <button
                type="button"
                className={`msg-tab-btn ${activeTab === 'html' ? 'active' : ''}`}
                onClick={() => setActiveTab('html')}
              >
                <Code size={13} /> Rendered HTML
              </button>
              <button
                type="button"
                className={`msg-tab-btn ${activeTab === 'text' ? 'active' : ''}`}
                onClick={() => setActiveTab('text')}
              >
                <FileText size={13} /> Plain Text
              </button>
              <button
                type="button"
                className={`msg-tab-btn ${activeTab === 'headers' ? 'active' : ''}`}
                onClick={() => setActiveTab('headers')}
              >
                <Server size={13} /> Headers &amp; JSON
              </button>
            </div>

            <div className="message-tab-content">
              {activeTab === 'html' && (
                <div className="message-html-preview">
                  {mail.html ? (
                    <div
                      className="rendered-html-container"
                      dangerouslySetInnerHTML={{ __html: mail.html }}
                    />
                  ) : (
                    <p className="no-content-note">No HTML payload provided for this message.</p>
                  )}
                </div>
              )}

              {activeTab === 'text' && (
                <div className="message-text-preview">
                  <pre>{mail.text || '(No plain text content)'}</pre>
                </div>
              )}

              {activeTab === 'headers' && (
                <div className="message-headers-preview">
                  <pre>
                    {typeof mail.headers === 'object' && mail.headers !== null
                      ? JSON.stringify(mail.headers, null, 2)
                      : mail.headers || JSON.stringify({ id: mail.id, node: mail.node, status: mail.status }, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Right Column: Event Timeline */}
        <section className="message-timeline-card">
          <h2>Delivery timeline</h2>
          <p>Recorded MTA handoffs and recipient events.</p>

          <div className="message-event-timeline">
            {events.length === 0 ? (
              <div className="empty-timeline-state">
                <Clock size={20} className="text-slate-400" />
                <p>No delivery events recorded yet.</p>
                <small>Events will appear as the message moves through MTA queues.</small>
              </div>
            ) : (
              events.map((evt, idx) => {
                const isSent = evt.type.includes('sent')
                const isDelivered = evt.type.includes('delivered')
                const isFailed = evt.type.includes('bounced') || evt.type.includes('failed')
                const toneClass = isDelivered ? 'timeline-green' : isFailed ? 'timeline-red' : isSent ? 'timeline-blue' : 'timeline-purple'

                return (
                  <div key={evt.id || idx}>
                    <span className={`timeline-dot ${toneClass}`} />
                    <span>
                      <small>
                        {evt.occurred_at
                          ? new Date(evt.occurred_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })
                          : '—'}
                      </small>
                      <b>
                        {evt.type}
                        {evt.dsn && <span className="dsn-code">DSN {evt.dsn}</span>}
                      </b>
                      {evt.recipient && <span className="event-rcpt">To: {evt.recipient}</span>}
                      {evt.response && <em>{evt.response}</em>}
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </section>
      </div>
    </>
  )
}
