'use client'

import React, { useMemo, useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  Clock,
  Code2,
  Copy,
  Edit3,
  ExternalLink,
  Eye,
  FileCode,
  FileText,
  Filter,
  History,
  Layers,
  LayoutGrid,
  LayoutTemplate,
  List,
  Loader2,
  Monitor,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Send,
  Sliders,
  Smartphone,
  Sparkles,
  Tag,
  Trash2,
  Wand2,
  X,
} from 'lucide-react'
import {
  type TemplateItem,
  type TemplateKind,
  type TemplateVersionItem,
  type CreateTemplatePayload,
} from '@/lib/api/templates'
import {
  useCreateTemplateMutation,
  useDeleteTemplateMutation,
  useTemplateVersionsQuery,
  useTemplatesQuery,
  useUpdateTemplateMutation,
} from '@/lib/hooks/use-templates-query'
import { EmailEditor } from '@/components/email-editor'
import {
  VisualEmailBuilder,
  compileBlocksToHtml,
  getBlocksForPreset,
  convertHtmlToEmailBlocks,
  type EmailBlock,
} from '@/components/visual-email-builder'
import { EMAIL_TEMPLATES, type EmailTemplate } from '@/lib/email-templates'

/**
 * Extracts list of template items from API response
 */
export function extractTemplates(res: any): TemplateItem[] {
  if (!res) return []
  if (Array.isArray(res)) return res
  if (Array.isArray(res.data)) return res.data
  if (Array.isArray(res.data?.items)) return res.data.items
  if (Array.isArray(res.items)) return res.items
  return []
}

interface TemplatesManagementProps {
  route?: string
  onAction?: (message: string) => void
}

export function TemplatesManagement({
  route = 'templates',
  onAction = () => {},
}: TemplatesManagementProps) {
  // Navigation / View modes: 'list' | 'create' | 'edit'
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'edit'>(() => {
    if (route === 'templates/create') return 'create'
    if (route.startsWith('templates/edit/')) return 'edit'
    return 'list'
  })

  // Selected template for editing or inspection
  const [activeTemplate, setActiveTemplate] = useState<TemplateItem | null>(null)
  const [activePreset, setActivePreset] = useState<EmailTemplate | null>(null)
  const [initialEditorType, setInitialEditorType] = useState<'visual_builder' | 'rich_code'>('visual_builder')

  // Modals state
  const [previewTemplate, setPreviewTemplate] = useState<TemplateItem | null>(null)
  const [versionHistoryTemplate, setVersionHistoryTemplate] = useState<TemplateItem | null>(null)
  const [deleteModalTemplate, setDeleteModalTemplate] = useState<TemplateItem | null>(null)

  // Listen to route changes
  useEffect(() => {
    if (route === 'templates/create') {
      setActiveTemplate(null)
      setActivePreset(null)
      setViewMode('create')
    } else if (route.startsWith('templates/edit/')) {
      setViewMode('edit')
    } else if (route === 'templates') {
      setViewMode('list')
    }
  }, [route])

  return (
    <div className="templates-management-wrapper">
      {viewMode === 'list' && (
        <TemplatesListView
          onAction={onAction}
          onCreateNew={(mode = 'visual_builder', preset?: EmailTemplate) => {
            setActiveTemplate(null)
            setActivePreset(preset || null)
            setInitialEditorType(mode)
            setViewMode('create')
          }}
          onEditTemplate={(tpl, mode = 'visual_builder') => {
            setActiveTemplate(tpl)
            setActivePreset(null)
            setInitialEditorType(mode)
            setViewMode('edit')
          }}
          onPreviewTemplate={(tpl) => setPreviewTemplate(tpl)}
          onOpenVersionHistory={(tpl) => setVersionHistoryTemplate(tpl)}
          onDeleteTemplate={(tpl) => setDeleteModalTemplate(tpl)}
        />
      )}

      {(viewMode === 'create' || viewMode === 'edit') && (
        <TemplateEditorView
          mode={viewMode}
          initialTemplate={activeTemplate}
          initialPreset={activePreset}
          initialEditorType={initialEditorType}
          onAction={onAction}
          onBack={() => {
            setActiveTemplate(null)
            setActivePreset(null)
            setViewMode('list')
          }}
          onSaved={(savedTemplate) => {
            setActiveTemplate(savedTemplate)
            setActivePreset(null)
            setViewMode('list')
          }}
        />
      )}

      {/* Live Preview Modal */}
      {previewTemplate && (
        <TemplateLivePreviewModal
          template={previewTemplate}
          onClose={() => setPreviewTemplate(null)}
          onAction={onAction}
          onEdit={() => {
            const t = previewTemplate
            setPreviewTemplate(null)
            setActiveTemplate(t)
            setViewMode('edit')
          }}
        />
      )}

      {/* Version History Modal */}
      {versionHistoryTemplate && (
        <TemplateVersionHistoryModal
          template={versionHistoryTemplate}
          onClose={() => setVersionHistoryTemplate(null)}
          onAction={onAction}
          onRestoreVersion={(restored) => {
            setVersionHistoryTemplate(null)
            setActiveTemplate(restored)
            setViewMode('edit')
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalTemplate && (
        <TemplateDeleteModal
          template={deleteModalTemplate}
          onClose={() => setDeleteModalTemplate(null)}
          onAction={onAction}
        />
      )}
    </div>
  )
}

/* =========================================================================
   LIST VIEW (GRID CARDS & TABLE WITH FILTERS)
   ========================================================================= */

function TemplatesListView({
  onAction,
  onCreateNew,
  onEditTemplate,
  onPreviewTemplate,
  onOpenVersionHistory,
  onDeleteTemplate,
}: {
  onAction: (message: string) => void
  onCreateNew: (mode?: 'visual_builder' | 'rich_code', preset?: EmailTemplate) => void
  onEditTemplate: (tpl: TemplateItem, mode?: 'visual_builder' | 'rich_code') => void
  onPreviewTemplate: (tpl: TemplateItem) => void
  onOpenVersionHistory: (tpl: TemplateItem) => void
  onDeleteTemplate: (tpl: TemplateItem) => void
}) {
  const [search, setSearch] = useState('')
  const [selectedKind, setSelectedKind] = useState<'all' | 'marketing' | 'transactional'>('all')
  const [displayMode, setDisplayMode] = useState<'grid' | 'table'>('grid')
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null)
  const [showPresetsDrawer, setShowPresetsDrawer] = useState(false)

  // Query templates
  const { data: templatesRes, isLoading, isError, refetch } = useTemplatesQuery({
    kind: selectedKind === 'all' ? undefined : selectedKind,
  })

  const templatesList = useMemo(() => extractTemplates(templatesRes), [templatesRes])

  // Filter templates based on search
  const filteredTemplates = useMemo(() => {
    return templatesList.filter((item) => {
      const q = search.toLowerCase().trim()
      if (!q) return true
      return (
        item.name?.toLowerCase().includes(q) ||
        item.subject?.toLowerCase().includes(q) ||
        item.kind?.toLowerCase().includes(q)
      )
    })
  }, [templatesList, search])

  // Stats calculation
  const stats = useMemo(() => {
    const total = templatesList.length
    const marketing = templatesList.filter((t) => t.kind === 'marketing').length
    const transactional = templatesList.filter((t) => t.kind === 'transactional').length
    return { total, marketing, transactional }
  }, [templatesList])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = () => setActiveDropdownId(null)
    window.addEventListener('click', handleClick)
    return () => window.removeEventListener('click', handleClick)
  }, [])

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—'
    try {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return dateStr
      return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
    } catch {
      return dateStr
    }
  }

  return (
    <div className="templates-list-page">
      {/* Page Header */}
      <div className="page-heading-row">
        <div>
          <div className="page-eyebrow">
            MARKETING <span>/</span> EMAIL TEMPLATES
          </div>
          <h1>Email Templates</h1>
          <p>Design, customize, and version reusable responsive email templates.</p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="button button-secondary"
            onClick={() => {
              refetch()
              onAction('Templates refreshed.')
            }}
            title="Refresh templates list"
          >
            <RefreshCw size={14} /> Refresh
          </button>
          <button
            type="button"
            className="button button-secondary"
            onClick={() => setShowPresetsDrawer(!showPresetsDrawer)}
            title="Browse Quick Start Library Presets"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Sparkles size={14} className="text-amber-500" />
            <span>{showPresetsDrawer ? 'Close Presets' : 'Quick Presets'}</span>
          </button>
          <button
            type="button"
            className="button button-primary"
            onClick={() => onCreateNew('visual_builder')}
            title="Create visually with Drag & Drop blocks"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Sparkles size={15} /> Visual Builder
          </button>
          <button
            type="button"
            className="button button-secondary"
            onClick={() => onCreateNew('rich_code')}
            title="Create with HTML / Rich Text editor"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Code2 size={15} /> Code Editor
          </button>
        </div>
      </div>

      {/* Quick Start Presets Drawer on Dashboard */}
      {showPresetsDrawer && (
        <div className="preset-picker-drawer" style={{ marginBottom: '20px' }}>
          <div className="drawer-header">
            <div>
              <strong>Quick Start Library Presets</strong>
              <p>Select a professionally crafted email layout to start building in the Visual Builder.</p>
            </div>
            <button
              type="button"
              className="drawer-close-btn"
              onClick={() => setShowPresetsDrawer(false)}
            >
              <X size={16} />
            </button>
          </div>
          <div className="presets-cards-row">
            {EMAIL_TEMPLATES.map((preset) => (
              <div
                key={preset.id}
                className="preset-preview-mini-card"
                onClick={() => onCreateNew('visual_builder', preset)}
              >
                <div className={`mini-banner banner-${preset.color}`}>
                  <span>{preset.tag}</span>
                  <h4>{preset.name}</h4>
                </div>
                <div className="mini-card-info">
                  <small>{preset.category}</small>
                  <button type="button">Use in Builder →</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Metrics Cards */}
      <div className="templates-metrics-grid">
        <article className="template-metric-card">
          <div className="metric-icon-wrap" style={{ backgroundColor: '#eff6ff', color: '#1374f8' }}>
            <LayoutTemplate size={20} />
          </div>
          <div>
            <span className="metric-label">Total Templates</span>
            <b className="metric-value">{stats.total}</b>
          </div>
        </article>

        <article className="template-metric-card">
          <div className="metric-icon-wrap" style={{ backgroundColor: '#f5f3ff', color: '#7c3aed' }}>
            <Sparkles size={20} />
          </div>
          <div>
            <span className="metric-label">Marketing Designs</span>
            <b className="metric-value">{stats.marketing}</b>
          </div>
        </article>

        <article className="template-metric-card">
          <div className="metric-icon-wrap" style={{ backgroundColor: '#ecfdf5', color: '#059669' }}>
            <FileCode size={20} />
          </div>
          <div>
            <span className="metric-label">Transactional Layouts</span>
            <b className="metric-value">{stats.transactional}</b>
          </div>
        </article>
      </div>

      {/* Filter and View Controls Bar */}
      <div className="templates-controls-bar">
        {/* Search */}
        <div className="templates-search-wrap">
          <Search size={15} className="search-icon" />
          <input
            type="text"
            placeholder="Search templates by name, subject, or tag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => setSearch('')}
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Kind Filters */}
        <div className="templates-kind-tabs">
          {(['all', 'marketing', 'transactional'] as const).map((kind) => (
            <button
              key={kind}
              type="button"
              className={`kind-tab-btn ${selectedKind === kind ? 'active' : ''}`}
              onClick={() => setSelectedKind(kind)}
            >
              {kind === 'all'
                ? `All (${stats.total})`
                : kind === 'marketing'
                ? `Marketing (${stats.marketing})`
                : `Transactional (${stats.transactional})`}
            </button>
          ))}
        </div>

        {/* View Toggle (Grid vs Table) */}
        <div className="templates-view-toggle">
          <button
            type="button"
            className={`view-btn ${displayMode === 'grid' ? 'active' : ''}`}
            onClick={() => setDisplayMode('grid')}
            title="Grid card view"
            aria-label="Grid view"
          >
            <LayoutGrid size={15} />
          </button>
          <button
            type="button"
            className={`view-btn ${displayMode === 'table' ? 'active' : ''}`}
            onClick={() => setDisplayMode('table')}
            title="List table view"
            aria-label="List view"
          >
            <List size={15} />
          </button>
        </div>
      </div>

      {/* Loading & Error States */}
      {isLoading && (
        <div className="templates-state-box">
          <Loader2 size={24} className="spin" color="#1374f8" />
          <p>Loading email templates from server...</p>
        </div>
      )}

      {isError && (
        <div className="templates-state-box error-state">
          <AlertCircle size={24} color="#ef4444" />
          <p>Failed to load templates. Please check your network or credentials.</p>
          <button type="button" className="button button-secondary" onClick={() => refetch()}>
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && filteredTemplates.length === 0 && (
        <div className="templates-empty-state">
          <div className="empty-icon-wrap">
            <LayoutTemplate size={36} color="#94a3b8" />
          </div>
          <h3>{search ? 'No templates match your search' : 'No email templates yet'}</h3>
          <p>
            {search
              ? 'Try adjusting your search query or filter to find what you are looking for.'
              : 'Create custom email layouts with rich formatting, responsive styles, and dynamic merge tags.'}
          </p>
          <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
            {search ? (
              <button
                type="button"
                className="button button-secondary"
                onClick={() => setSearch('')}
              >
                Clear Search Filter
              </button>
            ) : (
              <button type="button" className="button button-primary" onClick={() => onCreateNew('visual_builder')}>
                <Plus size={15} /> Create First Template
              </button>
            )}
          </div>
        </div>
      )}

      {/* Grid Cards View */}
      {!isLoading && !isError && filteredTemplates.length > 0 && displayMode === 'grid' && (
        <div className="templates-cards-grid">
          {filteredTemplates.map((template) => {
            const isMarketing = template.kind === 'marketing'
            return (
              <article key={template.id} className="template-item-card">
                {/* Visual Thumbnail Area */}
                <div
                  className={`card-thumbnail-container ${
                    isMarketing ? 'thumb-marketing' : 'thumb-transactional'
                  }`}
                  onClick={() => onPreviewTemplate(template)}
                  title="Click to preview template"
                >
                  {/* Mock live rendered iframe */}
                  <div className="thumbnail-frame">
                    <iframe
                      title={`Preview of ${template.name}`}
                      srcDoc={
                        template.html ||
                        '<div style="font-family:sans-serif;padding:20px;text-align:center;color:#64748b;">No HTML Content</div>'
                      }
                      sandbox="allow-same-origin"
                      className="thumbnail-iframe"
                      tabIndex={-1}
                    />
                  </div>

                  {/* Hover Overlay */}
                  <div className="thumbnail-overlay">
                    <button
                      type="button"
                      className="overlay-btn"
                      onClick={(e) => {
                        e.stopPropagation()
                        onPreviewTemplate(template)
                      }}
                      title="Quick Preview"
                    >
                      <Eye size={15} /> Preview
                    </button>
                    <button
                      type="button"
                      className="overlay-btn primary"
                      onClick={(e) => {
                        e.stopPropagation()
                        onEditTemplate(template, 'visual_builder')
                      }}
                      title="Open in Visual Builder"
                    >
                      <LayoutTemplate size={15} /> Visual Builder
                    </button>
                  </div>
                </div>

                {/* Card Body */}
                <div className="card-info-content">
                  <div className="card-header-line">
                    <div className="badge-row">
                      <span
                        className={`kind-pill ${
                          isMarketing ? 'pill-marketing' : 'pill-transactional'
                        }`}
                      >
                        {isMarketing ? 'Marketing' : 'Transactional'}
                      </span>
                      <span className="version-pill" title="Template version">
                        v{template.version || 1}
                      </span>
                    </div>

                    {/* 3-dots actions menu */}
                    <div
                      className="card-menu-anchor"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        className="card-more-btn"
                        aria-label="Template actions"
                        onClick={() =>
                          setActiveDropdownId(
                            activeDropdownId === template.id ? null : template.id
                          )
                        }
                      >
                        <MoreHorizontal size={16} />
                      </button>

                      {activeDropdownId === template.id && (
                        <div className="card-dropdown-popover">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveDropdownId(null)
                              onEditTemplate(template, 'visual_builder')
                            }}
                          >
                            <LayoutTemplate size={14} className="text-sky-600" /> Visual Drag &amp; Drop Builder
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveDropdownId(null)
                              onEditTemplate(template, 'rich_code')
                            }}
                          >
                            <Code2 size={14} /> Rich Text &amp; HTML Editor
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveDropdownId(null)
                              onPreviewTemplate(template)
                            }}
                          >
                            <Eye size={14} /> Live Preview
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveDropdownId(null)
                              onOpenVersionHistory(template)
                            }}
                          >
                            <History size={14} /> Version History
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveDropdownId(null)
                              window.location.href = `/app/campaigns/create?template=${template.id}`
                            }}
                          >
                            <Send size={14} /> Use in Campaign
                          </button>
                          <hr />
                          <button
                            type="button"
                            className="danger-item"
                            onClick={() => {
                              setActiveDropdownId(null)
                              onDeleteTemplate(template)
                            }}
                          >
                            <Trash2 size={14} /> Delete Template
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <h3 className="template-card-title" title={template.name}>
                    {template.name}
                  </h3>

                  <p className="template-card-subject" title={template.subject || 'No subject'}>
                    <FileText size={13} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span>{template.subject || 'No default subject line'}</span>
                  </p>

                  <div className="card-footer-meta">
                    <span className="updated-meta">
                      <Clock size={12} /> {formatDate(template.updated_at || template.created_at)}
                    </span>
                    <button
                      type="button"
                      className="text-btn"
                      onClick={() => onEditTemplate(template)}
                    >
                      Edit <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {/* Table List View */}
      {!isLoading && !isError && filteredTemplates.length > 0 && displayMode === 'table' && (
        <div className="templates-table-card">
          <table className="templates-table">
            <thead>
              <tr>
                <th>Template Name</th>
                <th>Category</th>
                <th>Default Subject</th>
                <th>Version</th>
                <th>Last Modified</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTemplates.map((template) => {
                const isMarketing = template.kind === 'marketing'
                return (
                  <tr key={template.id}>
                    <td>
                      <div className="table-name-cell">
                        <div
                          className={`table-avatar-badge ${
                            isMarketing ? 'badge-mkt' : 'badge-trx'
                          }`}
                        >
                          <LayoutTemplate size={14} />
                        </div>
                        <div>
                          <strong>{template.name}</strong>
                          <small>{template.id}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`kind-pill ${
                          isMarketing ? 'pill-marketing' : 'pill-transactional'
                        }`}
                      >
                        {isMarketing ? 'Marketing' : 'Transactional'}
                      </span>
                    </td>
                    <td>
                      <span className="table-subject-cell">
                        {template.subject || <span style={{ color: '#94a3b8' }}>None</span>}
                      </span>
                    </td>
                    <td>
                      <span className="version-pill">v{template.version || 1}</span>
                    </td>
                    <td>
                      <span className="table-date-cell">
                        {formatDate(template.updated_at || template.created_at)}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="table-actions-cell" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className="icon-action-btn"
                          title="Visual Drag & Drop Builder"
                          onClick={() => onEditTemplate(template, 'visual_builder')}
                        >
                          <LayoutTemplate size={14} />
                        </button>
                        <button
                          type="button"
                          className="icon-action-btn"
                          title="HTML / Rich Text Editor"
                          onClick={() => onEditTemplate(template, 'rich_code')}
                        >
                          <Code2 size={14} />
                        </button>
                        <button
                          type="button"
                          className="icon-action-btn"
                          title="Preview"
                          onClick={() => onPreviewTemplate(template)}
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          type="button"
                          className="icon-action-btn"
                          title="Version History"
                          onClick={() => onOpenVersionHistory(template)}
                        >
                          <History size={14} />
                        </button>
                        <button
                          type="button"
                          className="icon-action-btn danger"
                          title="Delete"
                          onClick={() => onDeleteTemplate(template)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/* =========================================================================
   TEMPLATE EDITOR / BUILDER VIEW (CREATION & FULL EMAIL EDITOR)
   ========================================================================= */

function TemplateEditorView({
  mode,
  initialTemplate,
  initialPreset = null,
  initialEditorType = 'visual_builder',
  onAction,
  onBack,
  onSaved,
}: {
  mode: 'create' | 'edit'
  initialTemplate: TemplateItem | null
  initialPreset?: EmailTemplate | null
  initialEditorType?: 'visual_builder' | 'rich_code'
  onAction: (msg: string) => void
  onBack: () => void
  onSaved: (saved: TemplateItem) => void
}) {
  const [editorType, setEditorType] = useState<'visual_builder' | 'rich_code'>(initialEditorType)
  const [name, setName] = useState(initialTemplate?.name || initialPreset?.name || '')
  const [kind, setKind] = useState<TemplateKind>(
    initialTemplate?.kind || (initialPreset?.category === 'Transactional' ? 'transactional' : 'marketing')
  )
  const [subject, setSubject] = useState(initialTemplate?.subject || initialPreset?.subject || '')
  const [htmlContent, setHtmlContent] = useState(() => {
    if (initialTemplate?.html) return initialTemplate.html
    if (initialPreset?.html) return initialPreset.html
    if (initialPreset) {
      const blocks = getBlocksForPreset(initialPreset)
      return compileBlocksToHtml(blocks)
    }
    return ''
  })
  const [designState, setDesignState] = useState<any>(() => {
    if (initialTemplate?.design) return initialTemplate.design
    if (initialPreset) return getBlocksForPreset(initialPreset)
    return null
  })
  const [activePreset, setActivePreset] = useState<EmailTemplate | null>(initialPreset || null)
  const activePresetRef = useRef<EmailTemplate | null>(initialPreset || null)
  const [textContent, setTextContent] = useState(initialPreset?.plainText || '')
  const [validationError, setValidationError] = useState<string | null>(null)
  const [showPresetPicker, setShowPresetPicker] = useState(false)
  const [templateKey, setTemplateKey] = useState(0)

  // Smart mode switcher: seamlessly preserves template and converts between code/visual
  const handleSwitchMode = (targetMode: 'visual_builder' | 'rich_code') => {
    if (targetMode === editorType) return

    if (targetMode === 'visual_builder' && editorType === 'rich_code') {
      let targetBlocks: EmailBlock[] = []

      // 1. Preserve customized designState if present, else fall back to active preset or HTML
      if (designState && Array.isArray(designState) && designState.length > 0) {
        targetBlocks = designState
      } else if (activePresetRef.current) {
        targetBlocks = getBlocksForPreset(activePresetRef.current)
      } else if (htmlContent && htmlContent.trim()) {
        const matched = EMAIL_TEMPLATES.find(
          (t) =>
            t.html.trim() === htmlContent.trim() ||
            (t.id && htmlContent.includes(t.id)) ||
            (t.name && htmlContent.includes(t.name)) ||
            (t.subject && htmlContent.includes(t.subject))
        )
        if (matched) {
          targetBlocks = getBlocksForPreset(matched)
          activePresetRef.current = matched
          setActivePreset(matched)
        } else {
          targetBlocks = convertHtmlToEmailBlocks(htmlContent)
        }
      } else {
        targetBlocks = []
      }

      setDesignState(targetBlocks)
      setTemplateKey((k) => k + 1)
    } else if (targetMode === 'rich_code' && editorType === 'visual_builder') {
      if (designState && Array.isArray(designState) && designState.length > 0) {
        const compiled = compileBlocksToHtml(designState)
        setHtmlContent(compiled)
      } else {
        setHtmlContent('')
      }
    }

    setEditorType(targetMode)
  }

  // Mutations
  const createMutation = useCreateTemplateMutation()
  const updateMutation = useUpdateTemplateMutation()
  const isSaving = createMutation.isPending || updateMutation.isPending

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setValidationError(null)

    if (!name.trim()) {
      setValidationError('Please give this template a descriptive name.')
      return
    }

    if (!htmlContent.trim()) {
      setValidationError('Please add email HTML content or select a preset template design.')
      return
    }

    try {
      if (mode === 'create' || !initialTemplate) {
        const payload: CreateTemplatePayload = {
          name: name.trim(),
          kind,
          subject: subject.trim() || undefined,
          html: htmlContent,
          design: designState || initialTemplate?.design || undefined,
        }
        const res = await createMutation.mutateAsync(payload)
        onAction(`Template “${name}” successfully created.`)
        if (res.data) onSaved(res.data)
      } else {
        const res = await updateMutation.mutateAsync({
          id: initialTemplate.id,
          payload: {
            name: name.trim(),
            kind,
            subject: subject.trim() || undefined,
            html: htmlContent,
            design: designState || undefined,
          },
        })
        onAction(`Template “${name}” updated to version ${res.data?.version || 'new'}.`)
        if (res.data) onSaved(res.data)
      }
    } catch (err: any) {
      setValidationError(err?.message || 'Failed to save template. Please try again.')
    }
  }

  // Quick preset loader
  const handleLoadPreset = (preset: EmailTemplate) => {
    const blocks = getBlocksForPreset(preset)
    const compiledHtml = compileBlocksToHtml(blocks)
    const finalHtml = preset.html || compiledHtml
    setActivePreset(preset)
    activePresetRef.current = preset
    setHtmlContent(finalHtml)
    setDesignState(blocks)
    setTextContent(preset.plainText)
    if (!name.trim() || EMAIL_TEMPLATES.some((t) => t.name === name)) {
      setName(preset.name)
    }
    if (!subject.trim() || EMAIL_TEMPLATES.some((t) => t.subject === subject)) {
      setSubject(preset.subject)
    }
    setTemplateKey((k) => k + 1)
    setShowPresetPicker(false)
    onAction(`Loaded “${preset.name}” preset design.`)
  }

  return (
    <div className="template-builder-page">
      {/* Top Navigation Row */}
      <div className="builder-top-nav">
        <div className="left-group">
          <button type="button" className="button button-secondary" onClick={onBack}>
            <ArrowLeft size={14} /> Back to Templates
          </button>
          <div>
            <div className="page-eyebrow">
              TEMPLATES <span>/</span> {mode === 'create' ? 'NEW TEMPLATE' : `EDIT v${initialTemplate?.version || 1}`}
            </div>
            <h2>{mode === 'create' ? 'Create Email Template' : `Editing “${initialTemplate?.name}”`}</h2>
          </div>
        </div>

        {/* Builder Mode Switcher: Visual Drag & Drop vs Code / Rich Text */}
        <div className="center-group">
          <div className="builder-mode-switcher-tabs">
            <button
              type="button"
              className={`mode-tab-btn ${editorType === 'visual_builder' ? 'active' : ''}`}
              onClick={() => handleSwitchMode('visual_builder')}
            >
              <LayoutTemplate size={14} /> Visual Drag &amp; Drop Builder
            </button>
            <button
              type="button"
              className={`mode-tab-btn ${editorType === 'rich_code' ? 'active' : ''}`}
              onClick={() => handleSwitchMode('rich_code')}
            >
              <Code2 size={14} /> Rich Text &amp; HTML Code
            </button>
          </div>
        </div>

        <div className="right-group">
          <button
            type="button"
            className="button button-secondary"
            onClick={() => setShowPresetPicker(!showPresetPicker)}
          >
            <Sparkles size={14} className="text-amber-500" />
            <span>{showPresetPicker ? 'Close Presets' : 'Load Preset Design'}</span>
          </button>

          <button
            type="button"
            className="button button-primary"
            onClick={() => handleSave()}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 size={14} className="spin" /> Saving…
              </>
            ) : mode === 'create' ? (
              <>
                <Check size={15} /> Save Template
              </>
            ) : (
              <>
                <Check size={15} /> Save New Version
              </>
            )}
          </button>
        </div>
      </div>

      {/* Preset Designs Dropdown Drawer */}
      {showPresetPicker && (
        <div className="preset-picker-drawer">
          <div className="drawer-header">
            <div>
              <strong>Quick Start Library Presets</strong>
              <p>Select a professionally crafted email layout to jumpstart your design.</p>
            </div>
            <button
              type="button"
              className="drawer-close-btn"
              onClick={() => setShowPresetPicker(false)}
            >
              <X size={16} />
            </button>
          </div>
          <div className="presets-cards-row">
            {EMAIL_TEMPLATES.map((preset) => (
              <div
                key={preset.id}
                className="preset-preview-mini-card"
                onClick={() => handleLoadPreset(preset)}
              >
                <div className={`mini-banner banner-${preset.color}`}>
                  <span>{preset.tag}</span>
                  <h4>{preset.name}</h4>
                </div>
                <div className="mini-card-info">
                  <small>{preset.category}</small>
                  <button type="button">Use Preset</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Validation alert */}
      {validationError && (
        <div className="builder-validation-alert">
          <AlertCircle size={16} />
          <span>{validationError}</span>
        </div>
      )}

      {/* Metadata Form Header Bar */}
      <div className="template-metadata-bar">
        <div className="meta-field">
          <label>Template Name *</label>
          <input
            type="text"
            placeholder="e.g. November Product Newsletter"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="meta-field">
          <label>Category / Purpose</label>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as TemplateKind)}
          >
            <option value="marketing">Marketing (Promotions, Bulletins, Newsletters)</option>
            <option value="transactional">Transactional (Receipts, Onboarding, Alerts)</option>
          </select>
        </div>

        <div className="meta-field flex-grow">
          <label>Default Subject Line (Optional)</label>
          <input
            type="text"
            placeholder="e.g. Welcome to MetroVPS, {{first_name}}!"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>
      </div>

      {/* Primary Builder Body: Visual Drag & Drop vs Code / Rich Text */}
      {editorType === 'visual_builder' ? (
        <VisualEmailBuilder
          key={`visual_builder_${activePreset?.id || 'custom'}_${templateKey}`}
          initialDesign={designState}
          initialHtml={htmlContent}
          onChange={({ html, design }) => {
            setHtmlContent(html)
            setDesignState(design)
          }}
          onAction={onAction}
        />
      ) : (
        <div className="template-editor-frame">
          <EmailEditor
            key="rich_code_email_editor"
            onAction={onAction}
            subject={subject || name || 'Template Email Preview'}
            startEmpty={!htmlContent && !activePreset}
            initialHtml={htmlContent}
            initialPlainText={textContent || undefined}
            onSelectTemplate={(preset) => handleLoadPreset(preset)}
            onChange={({ html, text }) => {
              setHtmlContent(html)
              setTextContent(text)
            }}
          />
        </div>
      )}
    </div>
  )
}

/* =========================================================================
   LIVE PREVIEW MODAL
   ========================================================================= */

function TemplateLivePreviewModal({
  template,
  onClose,
  onAction,
  onEdit,
}: {
  template: TemplateItem
  onClose: () => void
  onAction: (msg: string) => void
  onEdit: () => void
}) {
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop')
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (!template.html) return
    try {
      await navigator.clipboard.writeText(template.html)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      onAction('Template HTML copied to clipboard.')
    } catch {
      onAction('Failed to copy to clipboard.')
    }
  }

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div
        className="action-dialog template-preview-modal-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="preview-modal-header">
          <div>
            <div className="eyebrow">TEMPLATE PREVIEW · v{template.version || 1}</div>
            <h2>{template.name}</h2>
          </div>

          {/* Device Toggles */}
          <div className="preview-device-switcher">
            <button
              type="button"
              className={`device-btn ${device === 'desktop' ? 'active' : ''}`}
              onClick={() => setDevice('desktop')}
            >
              <Monitor size={14} /> Desktop
            </button>
            <button
              type="button"
              className={`device-btn ${device === 'mobile' ? 'active' : ''}`}
              onClick={() => setDevice('mobile')}
            >
              <Smartphone size={14} /> Mobile
            </button>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button type="button" className="button button-secondary text-xs" onClick={handleCopy}>
              {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
              <span>{copied ? 'Copied' : 'Copy HTML'}</span>
            </button>
            <button type="button" className="button button-primary text-xs" onClick={onEdit}>
              <Edit3 size={13} /> Edit Template
            </button>
            <button type="button" className="dialog-close" onClick={onClose} aria-label="Close">
              <X size={17} />
            </button>
          </div>
        </div>

        {/* Envelope Metadata info */}
        <div className="preview-envelope-bar">
          <div>
            <span>Subject:</span>
            <strong>{template.subject || 'No subject configured'}</strong>
          </div>
          <div>
            <span>Category:</span>
            <b>{template.kind === 'marketing' ? 'Marketing' : 'Transactional'}</b>
          </div>
        </div>

        {/* Live Viewport Frame */}
        <div className="preview-viewport-scroll">
          <div className={`preview-modal-frame ${device}`}>
            <iframe
              title="Template Preview"
              srcDoc={
                template.html ||
                '<div style="font-family:sans-serif;padding:30px;text-align:center;color:#64748b;">No HTML template content</div>'
              }
              sandbox="allow-same-origin"
              className="preview-modal-iframe"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

/* =========================================================================
   VERSION HISTORY MODAL
   ========================================================================= */

function TemplateVersionHistoryModal({
  template,
  onClose,
  onAction,
  onRestoreVersion,
}: {
  template: TemplateItem
  onClose: () => void
  onAction: (msg: string) => void
  onRestoreVersion: (template: TemplateItem) => void
}) {
  const { data: versionsRes, isLoading } = useTemplateVersionsQuery(template.id)
  const versions: TemplateVersionItem[] = useMemo(() => {
    if (!versionsRes?.data) return []
    return Array.isArray(versionsRes.data) ? versionsRes.data : []
  }, [versionsRes])

  const [selectedVersionNum, setSelectedVersionNum] = useState<number | null>(null)

  useEffect(() => {
    if (versions.length > 0 && selectedVersionNum === null) {
      setSelectedVersionNum(versions[0].number)
    }
  }, [versions, selectedVersionNum])

  const selectedVersion = useMemo(() => {
    return versions.find((v) => v.number === selectedVersionNum) || null
  }, [versions, selectedVersionNum])

  const handleRestore = () => {
    if (!selectedVersion) return
    const updated: TemplateItem = {
      ...template,
      subject: selectedVersion.subject || template.subject,
      html: selectedVersion.html || template.html,
      version: selectedVersion.number,
    }
    onRestoreVersion(updated)
    onAction(`Loaded version ${selectedVersion.number} into the editor.`)
  }

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div
        className="action-dialog template-versions-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="dialog-close" onClick={onClose} aria-label="Close">
          <X size={17} />
        </button>

        <div className="versions-dialog-head">
          <div className="eyebrow">REVISION HISTORY</div>
          <h2>Version History for “{template.name}”</h2>
          <p>Browse and restore previous versions generated by template updates.</p>
        </div>

        {isLoading ? (
          <div className="templates-state-box" style={{ padding: '30px' }}>
            <Loader2 size={24} className="spin" color="#1374f8" />
            <p>Fetching revision history...</p>
          </div>
        ) : versions.length === 0 ? (
          <div className="templates-state-box" style={{ padding: '30px' }}>
            <History size={28} color="#94a3b8" />
            <p>This template currently has only its initial revision (v1).</p>
          </div>
        ) : (
          <div className="versions-split-layout">
            {/* Version List Sidebar */}
            <div className="versions-sidebar-list">
              {versions.map((ver) => {
                const isSelected = ver.number === selectedVersionNum
                return (
                  <button
                    key={ver.id || ver.number}
                    type="button"
                    className={`version-item-btn ${isSelected ? 'active' : ''}`}
                    onClick={() => setSelectedVersionNum(ver.number)}
                  >
                    <div className="version-btn-top">
                      <strong>Version {ver.number}</strong>
                      {ver.number === template.version && (
                        <span className="current-badge">Active</span>
                      )}
                    </div>
                    <p>{ver.subject || 'No subject'}</p>
                    <small>
                      {ver.created_at ? new Date(ver.created_at).toLocaleString() : '—'}
                    </small>
                  </button>
                )
              })}
            </div>

            {/* Version Detail & Preview */}
            <div className="version-preview-pane">
              {selectedVersion ? (
                <>
                  <div className="version-pane-head">
                    <div>
                      <strong>Version {selectedVersion.number} Details</strong>
                      <p>Subject: {selectedVersion.subject || '—'}</p>
                    </div>
                    <button
                      type="button"
                      className="button button-primary text-xs"
                      onClick={handleRestore}
                    >
                      <Edit3 size={13} /> Load in Editor
                    </button>
                  </div>
                  <div className="version-iframe-wrap">
                    <iframe
                      title={`Preview Version ${selectedVersion.number}`}
                      srcDoc={
                        selectedVersion.html ||
                        '<div style="font-family:sans-serif;padding:20px;text-align:center;color:#64748b;">No HTML snapshot</div>'
                      }
                      sandbox="allow-same-origin"
                      className="version-iframe"
                    />
                  </div>
                </>
              ) : (
                <div className="templates-state-box">
                  <p>Select a version from the left list to preview.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* =========================================================================
   DELETE CONFIRMATION MODAL
   ========================================================================= */

function TemplateDeleteModal({
  template,
  onClose,
  onAction,
}: {
  template: TemplateItem
  onClose: () => void
  onAction: (msg: string) => void
}) {
  const deleteMutation = useDeleteTemplateMutation()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleConfirm = async () => {
    setErrorMsg(null)
    try {
      await deleteMutation.mutateAsync(template.id)
      onAction(`Template “${template.name}” has been deleted.`)
      onClose()
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to delete template.')
    }
  }

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div
        className="action-dialog template-delete-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '440px' }}
      >
        <button type="button" className="dialog-close" onClick={onClose} aria-label="Close">
          <X size={17} />
        </button>

        <div style={{ textAlign: 'center', padding: '10px 0 16px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              display: 'grid',
              placeItems: 'center',
              margin: '0 auto 14px',
            }}
          >
            <Trash2 size={22} />
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: 650, color: '#0f172a', margin: '0 0 8px' }}>
            Delete “{template.name}”?
          </h2>
          <p style={{ fontSize: '13.5px', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
            This action cannot be undone. Any campaigns or workflows that reference this template
            will no longer be linked to it.
          </p>
        </div>

        {errorMsg && (
          <div
            style={{
              margin: '0 0 14px',
              padding: '10px 14px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fee2e2',
              borderRadius: '6px',
              color: '#b91c1c',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <AlertCircle size={15} />
            <span>{errorMsg}</span>
          </div>
        )}

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
            marginTop: '16px',
            paddingTop: '16px',
            borderTop: '1px solid #e2e8f0',
          }}
        >
          <button
            type="button"
            className="button button-secondary"
            onClick={onClose}
            disabled={deleteMutation.isPending}
          >
            Cancel
          </button>
          <button
            type="button"
            className="button"
            style={{ backgroundColor: '#dc2626', color: '#fff', border: '1px solid #dc2626' }}
            onClick={handleConfirm}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? (
              <>
                <Loader2 size={14} className="spin" /> Deleting…
              </>
            ) : (
              'Delete Template'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
