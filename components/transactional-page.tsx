'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
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
  Paperclip,
  UploadCloud,
  File as FileIcon,
  FileText,
  FileSpreadsheet,
  FileArchive,
  FileImage,
  X,
  Eye,
} from 'lucide-react'
import { StatusBadge } from '@/components/status-badge'
import { EmailEditor } from '@/components/email-editor'
import { useDomainsQuery } from '@/lib/hooks/use-domains-query'
import { useMailsQuery, useSendMailMutation } from '@/lib/hooks/use-mails-query'
import { formatApiErrorMessage } from '@/lib/api-client'
import type { MailItem, MailAttachment, SendMailResponse, SendMailPayload } from '@/lib/api/mails'
import type { DomainItem } from '@/lib/api/domains'
import { ensureArray } from '@/lib/utils'
import {
  AttachmentPreviewModal,
  type PreviewableAttachment,
  getFileCategory,
  getAttachmentTypeIcon,
  formatBytes,
} from '@/components/attachment-preview-modal'

interface UploadedAttachmentItem {
  id: string
  filename: string
  content_type: string
  size: number
  content?: string
  file?: File
}

export function TransactionalPage({ onAction }: { onAction: (message: string) => void }) {
  // Queries
  const { data: domainsResponse, isLoading: domainsLoading } = useDomainsQuery()
  const { data: mailsResponse, isLoading: mailsLoading, refetch: refetchMails } = useMailsQuery()
  const sendMailMutation = useSendMailMutation()

  // Domains for From address selector: prioritize verified domains, fallback to all available domains
  const allDomains = useMemo(() => {
    return ensureArray<DomainItem>(domainsResponse?.data ?? domainsResponse)
  }, [domainsResponse])

  const verifiedDomains = useMemo(() => {
    return allDomains.filter((d) => d && d.is_verified)
  }, [allDomains])

  const selectableDomains = useMemo(() => {
    if (verifiedDomains.length > 0) return verifiedDomains
    return allDomains
  }, [verifiedDomains, allDomains])

  // Form states
  const [fromUser, setFromUser] = useState('support')
  const [selectedDomain, setSelectedDomain] = useState<string>('')
  const [customDomain, setCustomDomain] = useState<string>('metrovps.art')
  const [isCustomDomain, setIsCustomDomain] = useState<boolean>(false)
  const [fromName, setFromName] = useState('')
  const [recipient, setRecipient] = useState('')
  const [subject, setSubject] = useState('')
  const [selectedNode, setSelectedNode] = useState<'node-158' | 'node-253'>('node-158')
  const errorRef = useRef<HTMLDivElement>(null)

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

  // Attachment preview modal state
  const [previewModalOpen, setPreviewModalOpen] = useState(false)
  const [previewAttachments, setPreviewAttachments] = useState<PreviewableAttachment[]>([])
  const [previewInitialIndex, setPreviewInitialIndex] = useState(0)
  const [previewTitle, setPreviewTitle] = useState<string | undefined>()

  const openAttachmentPreview = (
    attList: PreviewableAttachment[],
    startIndex = 0,
    modalTitle?: string
  ) => {
    setPreviewAttachments(attList)
    setPreviewInitialIndex(startIndex)
    setPreviewTitle(modalTitle)
    setPreviewModalOpen(true)
  }

  // Attachments in lastSentItem for preview
  const lastSentAttachments: PreviewableAttachment[] = useMemo(() => {
    if (!lastSentItem || !lastSentItem.attachments) return []
    const atts = ensureArray(lastSentItem.attachments)
    return atts.map((a: any, i: number) => {
      if (typeof a === 'string') {
        return { filename: a, content_type: 'application/octet-stream', size: 0 }
      }
      return {
        id: a.id || `sent-${i}`,
        filename: a.filename || `attachment-${i + 1}`,
        content_type: a.content_type || 'application/octet-stream',
        size: a.size || 0,
        content: a.content,
        url: a.url,
      }
    })
  }, [lastSentItem])

  // Attachments state
  const [attachments, setAttachments] = useState<UploadedAttachmentItem[]>([])
  const [attachmentError, setAttachmentError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      setAttachmentError(null)
      const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
      const MAX_FILES = 10

      const fileList = Array.from(files)
      if (attachments.length + fileList.length > MAX_FILES) {
        setAttachmentError(`You can attach a maximum of ${MAX_FILES} files per email.`)
        return
      }

      fileList.forEach((file) => {
        if (file.size > MAX_FILE_SIZE) {
          setAttachmentError(`"${file.name}" exceeds the 10MB limit (${formatBytes(file.size)}).`)
          return
        }

        const isDuplicate = attachments.some(
          (att) => att.filename === file.name && att.size === file.size
        )
        if (isDuplicate) return

        const fileId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
        const contentType = file.type || 'application/octet-stream'

        const reader = new FileReader()
        reader.onload = () => {
          const result = reader.result as string
          const base64Content = result.includes(',') ? result.split(',')[1] : result
          setAttachments((prev) => [
            ...prev,
            {
              id: fileId,
              filename: file.name,
              content_type: contentType,
              size: file.size,
              content: base64Content,
              file: file,
            },
          ])
        }

        reader.onerror = () => {
          setAttachmentError(`Failed to read "${file.name}". Please try again.`)
        }

        reader.readAsDataURL(file)
      })
    },
    [attachments]
  )

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id))
    setAttachmentError(null)
  }

  const clearAllAttachments = () => {
    setAttachments([])
    setAttachmentError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Auto-select first verified domain (or first selectable domain) when loaded
  useEffect(() => {
    if (selectableDomains.length > 0) {
      if (!selectedDomain || selectedDomain === '__custom__') {
        setSelectedDomain(selectableDomains[0].name)
      }
    } else if (!domainsLoading) {
      setIsCustomDomain(true)
      if (!customDomain) {
        setCustomDomain('metrovps.art')
      }
    }
  }, [selectableDomains, domainsLoading, selectedDomain, customDomain])

  // Effective domain resolver
  const effectiveDomain = useMemo(() => {
    if (isCustomDomain || selectableDomains.length === 0) {
      return customDomain.trim().toLowerCase()
    }
    return (
      selectedDomain.trim() ||
      selectableDomains[0]?.name ||
      customDomain.trim() ||
      'metrovps.art'
    ).toLowerCase()
  }, [isCustomDomain, selectableDomains, customDomain, selectedDomain])

  // Combined From Email preview
  const fromEmail = effectiveDomain
    ? `${(fromUser.trim() || 'support').toLowerCase()}@${effectiveDomain}`
    : ''

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setApiError(null)

    // Validation
    const cleanUser = (fromUser.trim() || 'support').toLowerCase()
    if (!cleanUser) {
      setApiError('Please enter a username or prefix for the From address (e.g. support, hello).')
      errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    if (!effectiveDomain) {
      setApiError('Please enter or select a sending domain (e.g. metrovps.art or yourdomain.com).')
      errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const fromEmailAddress = `${cleanUser}@${effectiveDomain}`
    if (!emailRegex.test(fromEmailAddress)) {
      setApiError(`Invalid sender From address: "${fromEmailAddress}". Please ensure username and domain are valid.`)
      errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    const cleanTo = recipient
      .split(/[,;]/)
      .map((item) => item.trim())
      .filter(Boolean)

    if (cleanTo.length === 0) {
      setApiError('Please enter at least one recipient email address in the To field.')
      errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    const invalidRecipients = cleanTo.filter((em) => !emailRegex.test(em))
    if (invalidRecipients.length > 0) {
      setApiError(`Invalid recipient email address: "${invalidRecipients.join(', ')}". Please enter a valid email format.`)
      errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    if (!subject.trim()) {
      setApiError('Please enter a subject line for the email.')
      errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    // Parse CC & BCC
    const cleanCc = cc
      .split(/[,;]/)
      .map((item) => item.trim())
      .filter(Boolean)

    const invalidCc = cleanCc.filter((em) => !emailRegex.test(em))
    if (invalidCc.length > 0) {
      setApiError(`Invalid CC email address: "${invalidCc.join(', ')}".`)
      errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    const cleanBcc = bcc
      .split(/[,;]/)
      .map((item) => item.trim())
      .filter(Boolean)

    const invalidBcc = cleanBcc.filter((em) => !emailRegex.test(em))
    if (invalidBcc.length > 0) {
      setApiError(`Invalid BCC email address: "${invalidBcc.join(', ')}".`)
      errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

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
      const hasFiles =
        attachments.length > 0 &&
        attachments.some((att) => Boolean(att.file && typeof att.file === 'object'))

      let res: SendMailResponse

      if (hasFiles) {
        // Send as multipart/form-data via FormData for real file uploads
        const formData = new FormData()
        formData.append('from_email', fromEmailAddress)
        if (fromName.trim()) {
          formData.append('from_name', fromName.trim())
        }
        cleanTo.forEach((t) => formData.append('to', t))
        cleanCc.forEach((c) => formData.append('cc', c))
        cleanBcc.forEach((b) => formData.append('bcc', b))
        if (replyTo.trim()) {
          formData.append('reply_to', replyTo.trim())
        }
        formData.append('subject', subject.trim())
        formData.append('text', emailContent.text.trim() || `Test message: ${subject.trim()}`)
        formData.append('html', emailContent.html.trim() || `<p>${subject.trim()}</p>`)
        if (headersObj && Object.keys(headersObj).length > 0) {
          formData.append('headers', JSON.stringify(headersObj))
        }
        attachments.forEach((att) => {
          if (att.file) {
            formData.append('attachments', att.file, att.filename)
          }
        })

        res = await sendMailMutation.mutateAsync(formData)
      } else {
        // Send as pure application/json matching backend MailCreateRequest schema
        const payload: SendMailPayload = {
          from_email: fromEmailAddress,
          to: cleanTo,
          subject: subject.trim(),
          text: emailContent.text.trim() || `Test message: ${subject.trim()}`,
          html: emailContent.html.trim() || `<p>${subject.trim()}</p>`,
          ...(fromName.trim() ? { from_name: fromName.trim() } : {}),
          ...(cleanCc.length > 0 ? { cc: cleanCc } : {}),
          ...(cleanBcc.length > 0 ? { bcc: cleanBcc } : {}),
          ...(replyTo.trim() ? { reply_to: replyTo.trim() } : {}),
          ...(headersObj && Object.keys(headersObj).length > 0 ? { headers: headersObj } : {}),
          ...(attachments.length > 0
            ? {
                attachments: attachments.map((att) => ({
                  filename: att.filename,
                  content_type: att.content_type,
                  size: att.size,
                  ...(att.content ? { content: att.content } : {}),
                })),
              }
            : {}),
        }

        res = await sendMailMutation.mutateAsync(payload)
      }

      if (res && (res.data || res.success)) {
        if (res.data) setLastSentItem(res.data)
        setApiError(null)
        setAttachments([])
        if (fileInputRef.current) fileInputRef.current.value = ''
        onAction(`Message successfully sent to ${cleanTo.join(', ')} via ${selectedNode}.`)
        refetchMails()
      }
    } catch (err: unknown) {
      const errorMsg = formatApiErrorMessage(err, 'Failed to send transactional message.')
      setApiError(errorMsg)
      onAction(`Send failed: ${errorMsg}`)
      errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  // Live recent mails
  const recentMails: MailItem[] = useMemo(() => {
    const list = ensureArray<MailItem>(mailsResponse?.data ?? mailsResponse)
    return list.slice(0, 5)
  }, [mailsResponse])

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
      {/* <div className="transactional-developer-banner">
        <div className="developer-banner-left">
          <span className="transactional-aside-icon">
            <Braces size={20} />
          </span>
          <div className="developer-banner-content">
            <h3>Built for Developer REST API &amp; Dedicated Sending Nodes</h3>
            <p>
              Send transactional messages from your app using our secure REST API (<code>POST /api/mails/send-mail</code>) or dedicated SMTP relay via high-performance MTA nodes.
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
            <code>{`POST /api/mails/send-mail\nfrom_email: support@${selectedDomain || 'yourdomain.com'}\nto: ["customer@example.com"]`}</code>
          </pre>
          <Link href="/app/api-keys/docs" className="button button-secondary dev-guide-btn">
            <span>API Guide</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </div> */}

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
                  {lastSentAttachments.length > 0 && (
                    <button
                      type="button"
                      className="banner-attachment-preview-btn"
                      onClick={() =>
                        openAttachmentPreview(
                          lastSentAttachments,
                          0,
                          `Message: ${lastSentItem.subject || lastSentItem.id}`
                        )
                      }
                      title="Preview attachments"
                    >
                      <Paperclip size={12} />
                      <span>
                        {lastSentAttachments.length}{' '}
                        {lastSentAttachments.length === 1 ? 'attachment' : 'attachments'} (preview)
                      </span>
                    </button>
                  )}
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
            <div ref={errorRef} className="transactional-error-banner" role="alert">
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
                    onChange={(e) => {
                      const val = e.target.value
                      setApiError(null)
                      if (val.includes('@')) {
                        const parts = val.split('@')
                        setFromUser(parts[0].toLowerCase().replace(/[^a-z0-9._-]/g, ''))
                        if (parts[1]) {
                          setCustomDomain(parts[1].toLowerCase().replace(/[^a-z0-9.-]/g, ''))
                          setIsCustomDomain(true)
                        }
                      } else {
                        setFromUser(val.toLowerCase().replace(/[^a-z0-9._-]/g, ''))
                      }
                    }}
                    placeholder="support"
                    className="from-split-user"
                    aria-label="From address username"
                    required
                  />
                  <span className="from-split-at" aria-hidden="true">
                    @
                  </span>

                  {selectableDomains.length > 0 && !isCustomDomain ? (
                    <div className="from-domain-select-wrap">
                      <select
                        value={selectedDomain}
                        onChange={(e) => {
                          setApiError(null)
                          if (e.target.value === '__custom__') {
                            setIsCustomDomain(true)
                          } else {
                            setSelectedDomain(e.target.value)
                          }
                        }}
                        className="from-split-domain"
                        aria-label="From address verified domain"
                      >
                        {selectableDomains.map((d) => (
                          <option key={d.id} value={d.name}>
                            {d.name} {d.is_verified ? '' : '(Pending)'}
                          </option>
                        ))}
                        <option value="__custom__">+ Enter custom domain...</option>
                      </select>
                    </div>
                  ) : (
                    <div className="from-domain-input-wrap">
                      <input
                        type="text"
                        value={customDomain}
                        onChange={(e) => {
                          setCustomDomain(e.target.value.toLowerCase().replace(/[^a-z0-9.-]/g, ''))
                          setApiError(null)
                        }}
                        placeholder="metrovps.art"
                        className="from-split-domain-input"
                        aria-label="Sending domain"
                        required
                      />
                      {selectableDomains.length > 0 && (
                        <button
                          type="button"
                          className="from-domain-switch-btn"
                          onClick={() => {
                            setIsCustomDomain(false)
                            if (selectableDomains[0]) {
                              setSelectedDomain(selectableDomains[0].name)
                            }
                          }}
                          title="Switch back to verified domains list"
                        >
                          Select domain
                        </button>
                      )}
                    </div>
                  )}
                </div>
                {selectableDomains.length === 0 && !domainsLoading ? (
                  <p className="field-helper text-amber-600">
                    No verified domains in workspace.{' '}
                    <Link href="/app/domains" className="text-link">
                      Manage domains
                    </Link>{' '}
                    or type your sending domain above.
                  </p>
                ) : (
                  <p className="field-helper">
                    Sending as: <code>{fromEmail || 'support@metrovps.art'}</code>
                  </p>
                )}
              </div>
            </div>

            {/* Row 2: To Address & Node Selector */}
            <div className="form-grid-1col">
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
              {/* <label className="field-group">
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
              </label> */}
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

                  {/* <label className="field-group" style={{ marginTop: '12px' }}>
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
                  </label> */}
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
                startEmpty
              />
            </div>
          </div>

          {/* Attachments Upload Section - Placed right below DESIGN YOUR EMAIL */}
          <div className="transactional-attachments-section">
            <div className="transactional-attachments-header">
              <div className="transactional-attachments-title">
                <Paperclip size={16} />
                <span>Attachments</span>
                {attachments.length > 0 && (
                  <span className="transactional-attachments-count">
                    {attachments.length} {attachments.length === 1 ? 'file' : 'files'} (
                    {formatBytes(attachments.reduce((sum, a) => sum + a.size, 0))})
                  </span>
                )}
              </div>
              {attachments.length > 0 && (
                <button
                  type="button"
                  className="text-link text-xs"
                  style={{ color: '#dc2626' }}
                  onClick={clearAllAttachments}
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Hidden native file input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              style={{ display: 'none' }}
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFiles(e.target.files)
                  e.target.value = ''
                }
              }}
            />

            {/* Drag & Drop Zone */}
            <div
              className={`transactional-attachments-dropzone ${isDragging ? 'is-dragging' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  fileInputRef.current?.click()
                }
              }}
              aria-label="Upload email attachments"
            >
              <div className="dropzone-icon-circle">
                <UploadCloud size={20} />
              </div>
              <div className="dropzone-text">
                <b>Click to upload</b> or drag and drop files here
              </div>
              <div className="dropzone-hint">
                PDF, images (PNG, JPG, SVG), documents, spreadsheets (CSV, XLSX) or ZIP (up to 10MB per file)
              </div>
            </div>

            {/* Error banner if any */}
            {attachmentError && (
              <div className="attachment-error-banner" role="alert">
                <AlertCircle size={14} className="flex-shrink-0" />
                <span>{attachmentError}</span>
              </div>
            )}

            {/* Uploaded Files Cards with Rich Previews */}
            {attachments.length > 0 && (
              <div className="attachments-list">
                {attachments.map((att, idx) => {
                  const cat = getFileCategory(att.content_type, att.filename)
                  const isImg = cat === 'image'
                  const imgSrc = att.content
                    ? `data:${att.content_type};base64,${att.content}`
                    : att.file
                    ? URL.createObjectURL(att.file)
                    : null

                  return (
                    <div
                      className="attachment-card"
                      key={att.id}
                      onClick={() => openAttachmentPreview(attachments, idx, 'Composer Attachment')}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="attachment-card-thumb">
                        {isImg && imgSrc ? (
                          <img
                            src={imgSrc}
                            alt={att.filename}
                            className="attachment-thumb-img"
                          />
                        ) : (
                          getAttachmentTypeIcon(cat, 18)
                        )}
                      </div>
                      <div className="attachment-card-info">
                        <span className="attachment-card-name" title={att.filename}>
                          {att.filename}
                        </span>
                        <div className="attachment-card-meta">
                          <span>{formatBytes(att.size)}</span>
                          <span>•</span>
                          <span className="capitalize">{cat}</span>
                        </div>
                      </div>
                      <div className="attachment-card-actions">
                        <button
                          type="button"
                          className="attachment-card-preview-btn"
                          onClick={(e) => {
                            e.stopPropagation()
                            openAttachmentPreview(attachments, idx, 'Composer Attachment')
                          }}
                          title={`Preview ${att.filename}`}
                          aria-label={`Preview ${att.filename}`}
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          type="button"
                          className="attachment-card-remove"
                          onClick={(e) => {
                            e.stopPropagation()
                            removeAttachment(att.id)
                          }}
                          title={`Remove ${att.filename}`}
                          aria-label={`Remove ${att.filename}`}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer with Send Button */}
          <div className="transactional-form-footer">
            <span>
              <ShieldCheck size={14} /> Messages are dispatched via verified production cluster
            </span>
            <div className="transactional-footer-actions">
              {apiError && (
                <div className="transactional-footer-error" role="alert">
                  <AlertCircle size={15} />
                  <span>{apiError}</span>
                </div>
              )}
              <button
                className="button button-primary"
                type="button"
                disabled={sendMailMutation.isPending}
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

      {/* Attachment Preview Modal */}
      <AttachmentPreviewModal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        attachments={previewAttachments}
        initialIndex={previewInitialIndex}
        title={previewTitle}
      />
    </>
  )
}
