'use client'

import { useState, useMemo } from 'react'
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
  Eye,
  Download,
} from 'lucide-react'
import { StatusBadge } from '@/components/status-badge'
import {
  AttachmentPreviewModal,
  type PreviewableAttachment,
  getFileCategory,
  getAttachmentTypeIcon,
  formatBytes,
} from '@/components/attachment-preview-modal'
import { useMailByIdQuery, useMailsQuery } from '@/lib/hooks/use-mails-query'
import { formatApiErrorMessage } from '@/lib/api-client'
import type { MailEvent, MailAttachment, MailItem } from '@/lib/api/mails'
import { ensureArray } from '@/lib/utils'

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
  const cachedMail = useMemo(() => {
    const list = ensureArray<MailItem>(allMailsRes?.data ?? allMailsRes)
    return list.find((m) => m && m.id === mailId)
  }, [allMailsRes, mailId])
  const { data: response, isLoading, isError, error } = useMailByIdQuery(mailId)
  const mail = response?.data || cachedMail

  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<'html' | 'text' | 'headers'>('html')
  const [previewModalOpen, setPreviewModalOpen] = useState(false)
  const [previewIndex, setPreviewIndex] = useState(0)

  const attachments: MailAttachment[] = useMemo(() => {
    if (!mail || !Array.isArray(mail.attachments)) return []
    return (mail.attachments as Array<MailAttachment | string>).filter(
      (a: MailAttachment | string): a is MailAttachment => typeof a === 'object' && a !== null
    )
  }, [mail])

  const previewableAttachments: PreviewableAttachment[] = useMemo(() => {
    return attachments.map((att, idx) => ({
      filename: att.filename || `attachment-${idx + 1}`,
      content_type: att.content_type || 'application/octet-stream',
      size: typeof att.size === 'number' ? att.size : 0,
      content: att.content,
      url: (att as unknown as { url?: string }).url,
    }))
  }, [attachments])

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

  const openPreviewAtIndex = (idx: number) => {
    setPreviewIndex(idx)
    setPreviewModalOpen(true)
  }

  return (
    <>
      <div className="page-heading-row">
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="page-eyebrow">
            <Link href="/app/logs">EMAIL LOGS</Link> <span>/</span> MESSAGE DETAIL
          </div>
          <h1 style={{ wordBreak: 'break-word' }}>{mail.subject || '(No subject)'}</h1>
          <p>Delivery events, remote MTA response, and message metadata.</p>
        </div>
        <div
          className="page-heading-actions"
          style={{ flexShrink: 0, flexWrap: 'nowrap', whiteSpace: 'nowrap' }}
        >
          <button
            type="button"
            className="button button-secondary"
            style={{ whiteSpace: 'nowrap' }}
            onClick={copyId}
          >
            {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
            <span>{copied ? 'Copied ID' : 'Copy Message ID'}</span>
          </button>
          <Link
            className="button button-secondary"
            href="/app/logs"
            style={{ whiteSpace: 'nowrap' }}
          >
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

          {/* Attachments preview list */}
          {attachments.length > 0 && (
            <div className="message-attachments-box">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <small style={{ fontWeight: 700, letterSpacing: '0.08em', color: '#64748b' }}>
                  ATTACHMENTS ({attachments.length})
                </small>
                <button
                  type="button"
                  className="banner-attachment-preview-btn"
                  onClick={() => openPreviewAtIndex(0)}
                >
                  <Eye size={12} />
                  <span>Preview all</span>
                </button>
              </div>

              <div className="message-detail-attachment-grid">
                {previewableAttachments.map((att, idx) => {
                  const cat = getFileCategory(att.content_type, att.filename)
                  const hasImageThumb = cat === 'image' && (att.url || att.content)
                  const thumbSrc =
                    att.url ||
                    (att.content?.startsWith('data:')
                      ? att.content
                      : att.content
                      ? `data:${att.content_type};base64,${att.content}`
                      : '')

                  return (
                    <div
                      key={idx}
                      className="msg-attachment-card"
                      onClick={() => openPreviewAtIndex(idx)}
                      title={`Click to preview ${att.filename}`}
                    >
                      <div className="msg-attachment-icon">
                        {hasImageThumb && thumbSrc ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={thumbSrc}
                            alt={att.filename}
                            className="msg-attachment-thumb"
                          />
                        ) : (
                          getAttachmentTypeIcon(cat, 18)
                        )}
                      </div>

                      <div className="msg-attachment-info">
                        <span className="msg-attachment-name" title={att.filename}>
                          {att.filename}
                        </span>
                        <div className="msg-attachment-meta">
                          <span>{formatBytes(att.size)}</span>
                          <span>•</span>
                          <span style={{ textTransform: 'uppercase', fontSize: '10.5px', fontWeight: 600 }}>
                            {cat}
                          </span>
                        </div>
                      </div>

                      <div className="msg-attachment-actions" style={{ display: 'flex', gap: '4px' }}>
                        <button
                          type="button"
                          className="msg-attachment-action-btn"
                          title="Preview"
                          onClick={(e) => {
                            e.stopPropagation()
                            openPreviewAtIndex(idx)
                          }}
                        >
                          <Eye size={13} />
                        </button>
                      </div>
                    </div>
                  )
                })}
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
              {/* <button
                type="button"
                className={`msg-tab-btn ${activeTab === 'headers' ? 'active' : ''}`}
                onClick={() => setActiveTab('headers')}
              >
                <Server size={13} /> Headers &amp; JSON
              </button> */}
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

      {/* Attachment Preview Modal */}
      <AttachmentPreviewModal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        attachments={previewableAttachments}
        initialIndex={previewIndex}
        emailSubject={mail.subject || 'Email Attachments'}
      />
    </>
  )
}
