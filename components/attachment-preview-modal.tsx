'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Eye,
  FileText,
  FileImage,
  FileSpreadsheet,
  FileArchive,
  File as FileIcon,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Paperclip,
  Maximize2,
  ExternalLink,
} from 'lucide-react'

export interface PreviewableAttachment {
  id?: string
  filename: string
  content_type: string
  size: number
  content?: string
  url?: string
  file?: File
}

interface AttachmentPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  attachments: PreviewableAttachment[]
  initialIndex?: number
  title?: string
  emailSubject?: string
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes || bytes <= 0) return '0 B'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

export function getFileCategory(contentType: string, filename: string): 'image' | 'pdf' | 'text' | 'spreadsheet' | 'archive' | 'other' {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  const type = (contentType || '').toLowerCase()

  if (type.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp', 'ico'].includes(ext)) {
    return 'image'
  }
  if (type === 'application/pdf' || ext === 'pdf') {
    return 'pdf'
  }
  if (
    type.startsWith('text/') ||
    ['txt', 'json', 'csv', 'tsv', 'html', 'htm', 'xml', 'md', 'js', 'ts', 'css', 'yaml', 'yml'].includes(ext)
  ) {
    return 'text'
  }
  if (['xlsx', 'xls', 'ods'].includes(ext) || type.includes('sheet') || type.includes('excel')) {
    return 'spreadsheet'
  }
  if (['zip', 'tar', 'gz', 'rar', '7z', 'bz2'].includes(ext) || type.includes('zip') || type.includes('compressed')) {
    return 'archive'
  }
  return 'other'
}

export function getAttachmentTypeIcon(category: string, size = 18) {
  switch (category) {
    case 'image':
      return <FileImage size={size} className="text-blue-500" />
    case 'pdf':
      return <FileText size={size} className="text-rose-500" />
    case 'spreadsheet':
      return <FileSpreadsheet size={size} className="text-emerald-500" />
    case 'archive':
      return <FileArchive size={size} className="text-amber-500" />
    case 'text':
      return <FileText size={size} className="text-indigo-500" />
    default:
      return <FileIcon size={size} className="text-slate-500" />
  }
}

export function AttachmentPreviewModal({
  isOpen,
  onClose,
  attachments,
  initialIndex = 0,
  title,
  emailSubject,
}: AttachmentPreviewModalProps) {
  const contextTitle = title || emailSubject
  const [mounted, setMounted] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(Math.min(Math.max(initialIndex, 0), Math.max(attachments.length - 1, 0)))
      setZoom(1)
      setRotation(0)
      setCopied(false)
    }
  }, [isOpen, initialIndex, attachments.length])

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowRight' && attachments.length > 1) {
        setCurrentIndex((prev) => (prev + 1) % attachments.length)
        setZoom(1)
        setRotation(0)
      } else if (e.key === 'ArrowLeft' && attachments.length > 1) {
        setCurrentIndex((prev) => (prev - 1 + attachments.length) % attachments.length)
        setZoom(1)
        setRotation(0)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, attachments.length])

  // Current active attachment
  const currentAttachment = useMemo(() => {
    return attachments[currentIndex] || attachments[0] || null
  }, [attachments, currentIndex])

  const category = useMemo(() => {
    if (!currentAttachment) return 'other'
    return getFileCategory(currentAttachment.content_type, currentAttachment.filename)
  }, [currentAttachment])

  // Generate viewable source URL (from base64 or File object)
  const previewSource = useMemo(() => {
    if (!currentAttachment) return null
    if (currentAttachment.url) return currentAttachment.url

    if (currentAttachment.file) {
      try {
        return URL.createObjectURL(currentAttachment.file)
      } catch {
        // Fallback
      }
    }

    if (currentAttachment.content) {
      const base64 = currentAttachment.content.includes(',')
        ? currentAttachment.content.split(',')[1]
        : currentAttachment.content
      return `data:${currentAttachment.content_type || 'application/octet-stream'};base64,${base64}`
    }

    return null
  }, [currentAttachment])

  // Decoded text content if applicable
  const textContent = useMemo(() => {
    if (!currentAttachment || category !== 'text') return null
    if (currentAttachment.content) {
      try {
        const raw = currentAttachment.content.includes(',')
          ? currentAttachment.content.split(',')[1]
          : currentAttachment.content
        return decodeURIComponent(escape(atob(raw)))
      } catch {
        return atob(
          currentAttachment.content.includes(',')
            ? currentAttachment.content.split(',')[1]
            : currentAttachment.content
        )
      }
    }
    return null
  }, [currentAttachment, category])

  // Handle file download
  const handleDownload = useCallback(() => {
    if (!currentAttachment) return
    const link = document.createElement('a')
    link.download = currentAttachment.filename

    if (previewSource) {
      link.href = previewSource
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } else {
      // Create empty blob or notify
      const blob = new Blob([], { type: currentAttachment.content_type })
      const url = URL.createObjectURL(blob)
      link.href = url
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }
  }, [currentAttachment, previewSource])

  const handleCopyText = async () => {
    if (!textContent) return
    try {
      await navigator.clipboard.writeText(textContent)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  if (!isOpen || !mounted || !currentAttachment) return null

  const modalContent = (
    <div
      className="attachment-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="dialog"
      aria-modal="true"
      aria-label={`Preview ${currentAttachment.filename}`}
    >
      <div className="attachment-modal-container">
        {/* Header */}
        <div className="attachment-modal-header">
          <div className="attachment-modal-header-left">
            <div className="attachment-modal-type-icon">
              {getAttachmentTypeIcon(category, 20)}
            </div>
            <div className="attachment-modal-title-col">
              <div className="attachment-modal-filename" title={currentAttachment.filename}>
                {currentAttachment.filename}
              </div>
              <div className="attachment-modal-meta">
                <span className="attachment-modal-pill">
                  {currentAttachment.content_type || 'Unknown type'}
                </span>
                <span>•</span>
                <span>{formatBytes(currentAttachment.size)}</span>
                {attachments.length > 1 && (
                  <>
                    <span>•</span>
                    <span className="attachment-modal-counter">
                      {currentIndex + 1} of {attachments.length}
                    </span>
                  </>
                )}
                {contextTitle && (
                  <>
                    <span>•</span>
                    <span className="attachment-modal-context">{contextTitle}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="attachment-modal-header-actions">
            {category === 'image' && (
              <div className="attachment-modal-zoom-group">
                <button
                  type="button"
                  className="attachment-modal-btn"
                  onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
                  title="Zoom Out"
                >
                  <ZoomOut size={16} />
                </button>
                <button
                  type="button"
                  className="attachment-modal-btn"
                  onClick={() => {
                    setZoom(1)
                    setRotation(0)
                  }}
                  title="Reset Zoom"
                >
                  {Math.round(zoom * 100)}%
                </button>
                <button
                  type="button"
                  className="attachment-modal-btn"
                  onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
                  title="Zoom In"
                >
                  <ZoomIn size={16} />
                </button>
                <button
                  type="button"
                  className="attachment-modal-btn"
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  title="Rotate 90deg"
                >
                  <RotateCw size={16} />
                </button>
              </div>
            )}

            {category === 'text' && textContent && (
              <button
                type="button"
                className="attachment-modal-btn"
                onClick={handleCopyText}
                title="Copy text to clipboard"
              >
                {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            )}

            <button
              type="button"
              className="attachment-modal-btn attachment-modal-download-btn"
              onClick={handleDownload}
              title="Download attachment"
            >
              <Download size={16} />
              <span>Download</span>
            </button>

            <button
              type="button"
              className="attachment-modal-btn attachment-modal-close-btn"
              onClick={onClose}
              title="Close (Esc)"
              aria-label="Close preview"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body Viewer */}
        <div className="attachment-modal-body">
          {attachments.length > 1 && (
            <button
              type="button"
              className="attachment-modal-nav-btn attachment-modal-nav-prev"
              onClick={() => {
                setCurrentIndex((prev) => (prev - 1 + attachments.length) % attachments.length)
                setZoom(1)
                setRotation(0)
              }}
              title="Previous attachment (Left Arrow)"
              aria-label="Previous attachment"
            >
              <ChevronLeft size={24} />
            </button>
          )}

          <div className="attachment-modal-content-wrap">
            {category === 'image' && previewSource ? (
              <div className="attachment-image-container">
                <img
                  src={previewSource}
                  alt={currentAttachment.filename}
                  style={{
                    transform: `scale(${zoom}) rotate(${rotation}deg)`,
                    transition: 'transform 0.15s ease-out',
                  }}
                  className="attachment-preview-img"
                />
              </div>
            ) : category === 'pdf' ? (
              <div className="attachment-pdf-container">
                {previewSource ? (
                  <iframe
                    src={previewSource}
                    title={currentAttachment.filename}
                    className="attachment-pdf-iframe"
                  />
                ) : (
                  <div className="attachment-document-card">
                    <FileText size={56} className="text-rose-500" />
                    <h4>{currentAttachment.filename}</h4>
                    <p>PDF Document • {formatBytes(currentAttachment.size)}</p>
                    <button
                      type="button"
                      className="button button-primary"
                      onClick={handleDownload}
                    >
                      <Download size={15} /> Download / Open PDF
                    </button>
                  </div>
                )}
              </div>
            ) : category === 'text' ? (
              <div className="attachment-text-container">
                {textContent !== null ? (
                  <pre className="attachment-text-pre font-mono">{textContent}</pre>
                ) : previewSource ? (
                  <iframe
                    src={previewSource}
                    title={currentAttachment.filename}
                    className="attachment-pdf-iframe"
                  />
                ) : (
                  <div className="attachment-document-card">
                    <FileText size={56} className="text-indigo-500" />
                    <h4>{currentAttachment.filename}</h4>
                    <p>Text Document • {formatBytes(currentAttachment.size)}</p>
                    <button
                      type="button"
                      className="button button-primary"
                      onClick={handleDownload}
                    >
                      <Download size={15} /> Download Document
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="attachment-document-card">
                <div className="attachment-large-icon-circle">
                  {getAttachmentTypeIcon(category, 48)}
                </div>
                <h3>{currentAttachment.filename}</h3>
                <div className="attachment-card-details-table">
                  <div className="detail-row">
                    <span>File Name:</span>
                    <strong>{currentAttachment.filename}</strong>
                  </div>
                  <div className="detail-row">
                    <span>Content Type:</span>
                    <code>{currentAttachment.content_type}</code>
                  </div>
                  <div className="detail-row">
                    <span>File Size:</span>
                    <strong>{formatBytes(currentAttachment.size)}</strong>
                  </div>
                  <div className="detail-row">
                    <span>Category:</span>
                    <span className="capitalize">{category}</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="button button-primary button-lg"
                  onClick={handleDownload}
                >
                  <Download size={16} /> Download File ({formatBytes(currentAttachment.size)})
                </button>
              </div>
            )}
          </div>

          {attachments.length > 1 && (
            <button
              type="button"
              className="attachment-modal-nav-btn attachment-modal-nav-next"
              onClick={() => {
                setCurrentIndex((prev) => (prev + 1) % attachments.length)
                setZoom(1)
                setRotation(0)
              }}
              title="Next attachment (Right Arrow)"
              aria-label="Next attachment"
            >
              <ChevronRight size={24} />
            </button>
          )}
        </div>

        {/* Footer Thumbnails Carousel if multiple attachments */}
        {attachments.length > 1 && (
          <div className="attachment-modal-carousel">
            <div className="attachment-modal-carousel-scroll">
              {attachments.map((att, idx) => {
                const cat = getFileCategory(att.content_type, att.filename)
                const isSelected = idx === currentIndex
                return (
                  <button
                    key={att.id || idx}
                    type="button"
                    className={`attachment-carousel-item ${isSelected ? 'active' : ''}`}
                    onClick={() => {
                      setCurrentIndex(idx)
                      setZoom(1)
                      setRotation(0)
                    }}
                    title={att.filename}
                  >
                    <div className="carousel-item-icon">{getAttachmentTypeIcon(cat, 16)}</div>
                    <span className="carousel-item-name">{att.filename}</span>
                    <span className="carousel-item-size">{formatBytes(att.size)}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
