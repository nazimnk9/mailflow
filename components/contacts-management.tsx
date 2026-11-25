'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  FloatingRowActionMenu,
  RowActionDivider,
  RowActionMenuItem,
} from '@/components/floating-row-action-menu'
import { StatusBadge } from '@/components/status-badge'
import { TablePagination } from '@/components/table-pagination'
import { formatApiErrorMessage } from '@/lib/api-client'
import type { ContactItem, ImportContactsResult } from '@/lib/api/contacts'
import {
  useContactQuery,
  useContactsQuery,
  useContactTagsQuery,
  useCreateContactMutation,
  useDeleteContactMutation,
  useImportContactsMutation,
  usePatchContactMutation,
} from '@/lib/hooks/use-contacts-query'
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronDown,
  Eye,
  FileSpreadsheet,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Tag,
  Trash2,
  Upload,
  UserCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react'

interface ContactsManagementProps {
  route?: string
  onAction: (message: string) => void
}

type ContactTab = 'contacts' | 'tags'

interface AttributePair {
  id: string
  key: string
  value: string
}

function safeRenderText(val: unknown, fallback = ''): string {
  if (val === null || val === undefined) return fallback
  if (typeof val === 'string') return val
  if (typeof val === 'number' || typeof val === 'boolean') return String(val)
  if (typeof val === 'object') {
    const obj = val as Record<string, unknown>
    if (typeof obj.name === 'string') return obj.name
    if (typeof obj.title === 'string') return obj.title
    if (typeof obj.email === 'string') return obj.email
    if (typeof obj.message === 'string') return obj.message
    return fallback
  }
  return fallback
}

function attributesToPairs(attrs?: Record<string, unknown> | null): AttributePair[] {
  if (!attrs || typeof attrs !== 'object' || Array.isArray(attrs)) return []
  return Object.entries(attrs).map(([key, val], idx) => ({
    id: `attr_${idx}_${Date.now()}`,
    key,
    value: val === null || val === undefined ? '' : typeof val === 'object' ? JSON.stringify(val) : String(val),
  }))
}

function pairsToAttributes(pairs: AttributePair[]): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  pairs.forEach((p) => {
    const k = p.key.trim()
    if (!k) return
    const raw = p.value.trim()
    if (raw === 'true') result[k] = true
    else if (raw === 'false') result[k] = false
    else if (raw !== '' && !Number.isNaN(Number(raw)) && /^-?\d+(\.\d+)?$/.test(raw)) {
      result[k] = Number(raw)
    } else {
      result[k] = p.value
    }
  })
  return result
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '—'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
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

/* =========================================================================
   TAG MULTI-SELECT & CREATOR COMBOBOX
   ========================================================================= */
function TagMultiSelectInput({
  availableTags,
  selectedTags,
  onChange,
  disabled = false,
  label = 'Tags',
  placeholder = 'Select or type a tag…',
}: {
  availableTags: string[]
  selectedTags: string[]
  onChange: (tags: string[]) => void
  disabled?: boolean
  label?: string
  placeholder?: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  const allKnownTags = useMemo(() => {
    const set = new Set<string>(availableTags)
    selectedTags.forEach((t) => set.add(t))
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [availableTags, selectedTags])

  const filteredTags = useMemo(() => {
    const q = tagInput.toLowerCase().trim()
    if (!q) return allKnownTags
    return allKnownTags.filter((t) => t.toLowerCase().includes(q))
  }, [allKnownTags, tagInput])

  const canCreateNew = useMemo(() => {
    const q = tagInput.trim()
    if (!q) return false
    return !allKnownTags.some((t) => t.toLowerCase() === q.toLowerCase())
  }, [allKnownTags, tagInput])

  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const toggleTag = (tag: string) => {
    if (disabled) return
    if (selectedTags.includes(tag)) {
      onChange(selectedTags.filter((t) => t !== tag))
    } else {
      onChange([...selectedTags, tag])
    }
  }

  const addNewTag = (raw: string) => {
    if (disabled) return
    const clean = raw.trim()
    if (!clean) return
    if (!selectedTags.some((t) => t.toLowerCase() === clean.toLowerCase())) {
      onChange([...selectedTags, clean])
    }
    setTagInput('')
  }

  const removeTag = (tag: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (disabled) return
    onChange(selectedTags.filter((t) => t !== tag))
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        width: '100%',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '13px', fontWeight: 650, color: '#4b5d73' }}>{label}</span>
        {selectedTags.length > 0 && (
          <span
            style={{
              fontSize: '11.5px',
              fontWeight: 600,
              color: '#1d4ed8',
              backgroundColor: '#eff6ff',
              padding: '1px 8px',
              borderRadius: '999px',
              border: '1px solid #bfdbfe',
            }}
          >
            {selectedTags.length} selected
          </span>
        )}
      </div>

      <div
        tabIndex={disabled ? -1 : 0}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        onClick={() => {
          if (!disabled) setIsOpen((prev) => !prev)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            if (!disabled) setIsOpen((prev) => !prev)
          }
        }}
        style={{
          minHeight: '42px',
          padding: '6px 12px',
          border: isOpen ? '1px solid #2563eb' : '1px solid #cbd5e1',
          boxShadow: isOpen ? '0 0 0 3px rgba(37, 99, 235, 0.14)' : 'none',
          borderRadius: '8px',
          backgroundColor: disabled ? '#f8fafc' : '#ffffff',
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center', flex: 1 }}>
          {selectedTags.length === 0 ? (
            <span style={{ color: '#94a3b8', fontSize: '13.5px' }}>{placeholder}</span>
          ) : (
            selectedTags.map((tag) => (
              <span
                key={tag}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  backgroundColor: '#eff6ff',
                  color: '#1d4ed8',
                  border: '1px solid #bfdbfe',
                }}
              >
                <Tag size={11} />
                <span>{tag}</span>
                {!disabled && (
                  <button
                    type="button"
                    aria-label={`Remove ${tag}`}
                    onClick={(e) => removeTag(tag, e)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      padding: 0,
                      display: 'inline-flex',
                      color: '#3b82f6',
                      cursor: 'pointer',
                    }}
                  >
                    <X size={12} />
                  </button>
                )}
              </span>
            ))
          )}
        </div>
        <ChevronDown
          size={15}
          style={{
            color: '#64748b',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s ease',
            flexShrink: 0,
          }}
        />
      </div>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 50,
            backgroundColor: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '10px',
            boxShadow: '0 10px 28px rgba(15, 23, 42, 0.14)',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '8px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '6px' }}>
            <input
              type="text"
              placeholder="Search or create new tag…"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  if (tagInput.trim()) addNewTag(tagInput)
                }
              }}
              autoFocus
              style={{
                flex: 1,
                padding: '6px 10px',
                fontSize: '13px',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                outline: 'none',
              }}
            />
            {canCreateNew && (
              <button
                type="button"
                onClick={() => addNewTag(tagInput)}
                style={{
                  padding: '6px 10px',
                  fontSize: '12px',
                  fontWeight: 600,
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                + Add
              </button>
            )}
          </div>

          <div style={{ maxHeight: '180px', overflowY: 'auto', padding: '4px' }}>
            {filteredTags.length === 0 && !canCreateNew ? (
              <div style={{ padding: '12px', textAlign: 'center', fontSize: '12.5px', color: '#94a3b8' }}>
                Type a tag name and press Enter to add
              </div>
            ) : (
              filteredTags.map((tag) => {
                const checked = selectedTags.includes(tag)
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '7px 10px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: checked ? '#eff6ff' : 'transparent',
                      color: checked ? '#1d4ed8' : '#334155',
                      fontSize: '13px',
                      fontWeight: checked ? 600 : 500,
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                      <Tag size={13} />
                      <span>{tag}</span>
                    </span>
                    {checked && <Check size={14} />}
                  </button>
                )
              })
            )}
          </div>

          <div
            style={{
              padding: '6px 10px',
              borderTop: '1px solid #f1f5f9',
              backgroundColor: '#f8fafc',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <button
              type="button"
              onClick={() => onChange([])}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: '12px',
                color: '#64748b',
                cursor: 'pointer',
              }}
            >
              Clear all
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              style={{
                padding: '3px 10px',
                borderRadius: '5px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#ffffff',
                backgroundColor: '#2563eb',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* =========================================================================
   CUSTOM ATTRIBUTES KEY-VALUE EDITOR
   ========================================================================= */
function AttributesKeyValueEditor({
  pairs,
  onChange,
  disabled = false,
}: {
  pairs: AttributePair[]
  onChange: (pairs: AttributePair[]) => void
  disabled?: boolean
}) {
  const handleAddRow = () => {
    if (disabled) return
    onChange([
      ...pairs,
      { id: `attr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, key: '', value: '' },
    ])
  }

  const handleUpdateRow = (id: string, field: 'key' | 'value', val: string) => {
    if (disabled) return
    onChange(pairs.map((p) => (p.id === id ? { ...p, [field]: val } : p)))
  }

  const handleRemoveRow = (id: string) => {
    if (disabled) return
    onChange(pairs.filter((p) => p.id !== id))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
      {/* <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '13px', fontWeight: 650, color: '#4b5d73' }}>
          Custom Attributes (JSON)
        </span>
        <button
          type="button"
          onClick={handleAddRow}
          disabled={disabled}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '3px 9px',
            fontSize: '12px',
            fontWeight: 600,
            color: '#2563eb',
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '6px',
            cursor: disabled ? 'not-allowed' : 'pointer',
          }}
        >
          <Plus size={12} /> Add attribute
        </button>
      </div> */}

      {/* {pairs.length === 0 ? (
        <div
          style={{
            padding: '10px 12px',
            borderRadius: '8px',
            border: '1px dashed #cbd5e1',
            backgroundColor: '#f8fafc',
            fontSize: '12.5px',
            color: '#64748b',
            textAlign: 'center',
          }}
        >
          No custom attributes yet (e.g. <code>plan: pro</code>, <code>company: Acme</code>).
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {pairs.map((pair) => (
            <div key={pair.id} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Key (e.g. plan)"
                value={pair.key}
                onChange={(e) => handleUpdateRow(pair.id, 'key', e.target.value)}
                disabled={disabled}
                style={{ flex: 1, minWidth: 0 }}
              />
              <input
                type="text"
                placeholder="Value (e.g. pro)"
                value={pair.value}
                onChange={(e) => handleUpdateRow(pair.id, 'value', e.target.value)}
                disabled={disabled}
                style={{ flex: 1, minWidth: 0 }}
              />
              <button
                type="button"
                onClick={() => handleRemoveRow(pair.id)}
                disabled={disabled}
                aria-label="Remove attribute"
                style={{
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#ffffff',
                  color: '#ef4444',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )} */}
    </div>
  )
}

/* =========================================================================
   MAIN CONTACTS MANAGEMENT COMPONENT
   ========================================================================= */
export function ContactsManagement({ route = 'contacts', onAction }: ContactsManagementProps) {
  const getInitialTab = (r: string): ContactTab => {
    if (r.includes('tag') || r.includes('list')) return 'tags'
    return 'contacts'
  }

  const [activeTab, setActiveTab] = useState<ContactTab>(getInitialTab(route))

  // Server-side filters & pagination for contacts
  const [contactSearchInput, setContactSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('All statuses')
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  // Tags tab search
  const [tagSearch, setTagSearch] = useState('')

  // Modals state
  const [createContactOpen, setCreateContactOpen] = useState(false)
  const [editContactTarget, setEditContactTarget] = useState<ContactItem | null>(null)
  const [deleteContactTarget, setDeleteContactTarget] = useState<ContactItem | null>(null)
  const [viewContactId, setViewContactId] = useState<string | null>(null)
  const [viewContactSnapshot, setViewContactSnapshot] = useState<ContactItem | null>(null)
  const [importModalOpen, setImportModalOpen] = useState(false)

  // Row action menu
  const [expandedContactId, setExpandedContactId] = useState<string | null>(null)
  const [menuAnchorRect, setMenuAnchorRect] = useState<DOMRect | null>(null)

  // Contact Add / Edit Form state
  const [contactEmail, setContactEmail] = useState('')
  const [contactFirstName, setContactFirstName] = useState('')
  const [contactLastName, setContactLastName] = useState('')
  const [contactStatus, setContactStatus] = useState<string>('subscribed')
  const [contactSelectedTags, setContactSelectedTags] = useState<string[]>([])
  const [contactAttrPairs, setContactAttrPairs] = useState<AttributePair[]>([])
  const [contactFormError, setContactFormError] = useState<string | null>(null)

  // Import CSV Form state
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importTags, setImportTags] = useState<string[]>([])
  const [importError, setImportError] = useState<string | null>(null)
  const [importResult, setImportResult] = useState<ImportContactsResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(contactSearchInput.trim())
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [contactSearchInput])

  // Sync tab when route changes
  useEffect(() => {
    setActiveTab(getInitialTab(route))
  }, [route])

  // Check URL query param (?tag= or ?list=)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const tagParam = params.get('tag') || params.get('list')
      if (tagParam) {
        setSelectedTagFilter(tagParam)
        setActiveTab('contacts')
      }
    }
  }, [])

  // Close floating menu on outside click / Escape
  useEffect(() => {
    if (!expandedContactId) return
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null
      if (!target) return
      if (target.closest('.row-action-menu') || target.closest('.row-action-trigger')) return
      setExpandedContactId(null)
      setMenuAnchorRect(null)
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setExpandedContactId(null)
        setMenuAnchorRect(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [expandedContactId])

  // Queries
  const {
    data: contactsResponse,
    isLoading: contactsLoading,
    isFetching: contactsFetching,
    refetch: refetchContacts,
  } = useContactsQuery({
    page,
    page_size: pageSize,
    search: debouncedSearch || undefined,
    status: selectedStatus !== 'All statuses' ? selectedStatus : undefined,
    tags: selectedTagFilter || undefined,
  })

  const {
    data: tagsResponse,
    isLoading: tagsLoading,
    isFetching: tagsFetching,
    refetch: refetchTags,
  } = useContactTagsQuery()

  const {
    data: contactDetailResponse,
    isLoading: contactDetailLoading,
  } = useContactQuery(viewContactId)

  // Mutations
  const createContactMutation = useCreateContactMutation()
  const patchContactMutation = usePatchContactMutation()
  const deleteContactMutation = useDeleteContactMutation()
  const importContactsMutation = useImportContactsMutation()

  // Derived data from paginated Postman response
  const paginatedData = contactsResponse?.data
  const contactsList: ContactItem[] = useMemo(() => {
    if (Array.isArray(paginatedData?.items)) return paginatedData.items
    if (Array.isArray(paginatedData as unknown)) return paginatedData as unknown as ContactItem[]
    return []
  }, [paginatedData])

  const totalContacts = typeof paginatedData?.total === 'number' ? paginatedData.total : contactsList.length
  const totalPages = typeof paginatedData?.total_pages === 'number' ? paginatedData.total_pages : 1

  const availableTags: string[] = useMemo(() => {
    return Array.isArray(tagsResponse?.data) ? tagsResponse.data : []
  }, [tagsResponse])

  const filteredTags = useMemo(() => {
    const q = tagSearch.toLowerCase().trim()
    if (!q) return availableTags
    return availableTags.filter((t) => t.toLowerCase().includes(q))
  }, [availableTags, tagSearch])

  const activeContactDetail = contactDetailResponse?.data || viewContactSnapshot

  // Tab switcher
  const handleTabChange = (tab: ContactTab) => {
    setActiveTab(tab)
    setExpandedContactId(null)
    setMenuAnchorRect(null)
    const targetUrl = tab === 'tags' ? '/app/contacts/lists' : '/app/contacts'
    window.history.pushState(null, '', targetUrl)
  }

  // Filter by tag
  const handleSelectTagFilter = (tag: string) => {
    setSelectedTagFilter(tag)
    setPage(1)
    setActiveTab('contacts')
    window.history.pushState(null, '', `/app/contacts?tag=${encodeURIComponent(tag)}`)
    onAction(`Filtered contacts by tag “${tag}”.`)
  }

  const handleClearTagFilter = () => {
    setSelectedTagFilter('')
    setPage(1)
    window.history.pushState(null, '', '/app/contacts')
  }

  // Open Add Contact Modal
  const handleOpenCreateContact = () => {
    setContactEmail('')
    setContactFirstName('')
    setContactLastName('')
    setContactStatus('subscribed')
    setContactSelectedTags(selectedTagFilter ? [selectedTagFilter] : [])
    setContactAttrPairs([])
    setContactFormError(null)
    setCreateContactOpen(true)
  }

  const handleSubmitCreateContact = (e: React.FormEvent) => {
    e.preventDefault()
    if (!contactEmail.trim()) {
      setContactFormError('Email address is required.')
      return
    }

    setContactFormError(null)
    const attrsObj = pairsToAttributes(contactAttrPairs)

    createContactMutation.mutate(
      {
        email: contactEmail.trim(),
        first_name: contactFirstName.trim() || undefined,
        last_name: contactLastName.trim() || undefined,
        attributes: Object.keys(attrsObj).length > 0 ? attrsObj : undefined,
        tags: contactSelectedTags.length > 0 ? contactSelectedTags : undefined,
      },
      {
        onSuccess: (res) => {
          setCreateContactOpen(false)
          onAction(res.message || `Contact “${res.data?.email || contactEmail}” added.`)
        },
        onError: (err) => {
          setContactFormError(formatApiErrorMessage(err))
        },
      }
    )
  }

  // Open Edit Contact Modal
  const handleOpenEditContact = (contact: ContactItem) => {
    setEditContactTarget(contact)
    setContactEmail(contact.email || '')
    setContactFirstName(contact.first_name || '')
    setContactLastName(contact.last_name || '')
    setContactStatus(contact.status || 'subscribed')
    setContactSelectedTags(Array.isArray(contact.tags) ? contact.tags : [])
    setContactAttrPairs(attributesToPairs(contact.attributes))
    setContactFormError(null)
    setExpandedContactId(null)
    setMenuAnchorRect(null)
  }

  const handleSubmitEditContact = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editContactTarget) return
    if (!contactEmail.trim()) {
      setContactFormError('Email address is required.')
      return
    }

    setContactFormError(null)
    const attrsObj = pairsToAttributes(contactAttrPairs)

    patchContactMutation.mutate(
      {
        contactId: editContactTarget.id,
        payload: {
          email: contactEmail.trim(),
          first_name: contactFirstName.trim(),
          last_name: contactLastName.trim(),
          status: contactStatus,
          tags: contactSelectedTags,
          attributes: attrsObj,
        },
      },
      {
        onSuccess: (res) => {
          setEditContactTarget(null)
          onAction(res.message || `Contact “${res.data?.email || contactEmail}” saved.`)
        },
        onError: (err) => {
          setContactFormError(formatApiErrorMessage(err))
        },
      }
    )
  }

  // Quick toggle subscription status
  const handleQuickToggleStatus = (contact: ContactItem) => {
    const nextStatus = contact.status === 'subscribed' ? 'unsubscribed' : 'subscribed'
    setExpandedContactId(null)
    setMenuAnchorRect(null)

    patchContactMutation.mutate(
      {
        contactId: contact.id,
        payload: { status: nextStatus },
      },
      {
        onSuccess: () => {
          onAction(`Contact “${contact.email}” marked as ${nextStatus}.`)
        },
        onError: (err) => {
          onAction(formatApiErrorMessage(err))
        },
      }
    )
  }

  // Delete contact
  const handleDeleteContact = () => {
    if (!deleteContactTarget) return
    deleteContactMutation.mutate(deleteContactTarget.id, {
      onSuccess: (res) => {
        const deletedEmail = deleteContactTarget.email
        setDeleteContactTarget(null)
        onAction(res.message || `Contact “${deletedEmail}” deleted.`)
      },
      onError: (err) => {
        onAction(formatApiErrorMessage(err))
      },
    })
  }

  // Open Import CSV Modal
  const handleOpenImportModal = () => {
    setImportFile(null)
    setImportTags(selectedTagFilter ? [selectedTagFilter] : [])
    setImportError(null)
    setImportResult(null)
    setImportModalOpen(true)
  }

  const handleSubmitImportCsv = (e: React.FormEvent) => {
    e.preventDefault()
    if (!importFile) {
      setImportError('Please select a UTF-8 CSV file to import.')
      return
    }

    setImportError(null)
    setImportResult(null)
    importContactsMutation.mutate(
      { file: importFile, tags: importTags },
      {
        onSuccess: (res) => {
          if (res.data) setImportResult(res.data)
          onAction(res.message || 'Contacts imported successfully.')
        },
        onError: (err) => {
          setImportError(formatApiErrorMessage(err))
        },
      }
    )
  }

  return (
    <>
      {/* Page Heading Row */}
      <div className="page-heading-row">
        <div>
          <div className="page-eyebrow">
            METROMAIL WORKSPACE <span>/</span> CONTACTS
          </div>
          <h1>Contacts</h1>
          <p>
            {activeTab === 'contacts'
              ? selectedTagFilter
                ? `Showing contacts tagged with “${selectedTagFilter}”.`
                : 'Manage subscribers, custom attributes, tags, and bulk CSV imports.'
              : 'Browse and filter your audience by contact tags.'}
          </p>
        </div>

        <div className="page-heading-actions">
          <button
            type="button"
            className="button button-secondary"
            onClick={() => {
              if (activeTab === 'contacts') refetchContacts()
              else refetchTags()
            }}
            disabled={activeTab === 'contacts' ? contactsLoading || contactsFetching : tagsLoading || tagsFetching}
            title="Refresh data"
          >
            <RefreshCw
              size={14}
              className={
                (activeTab === 'contacts' ? contactsFetching : tagsFetching) ? 'animate-spin' : ''
              }
            />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            className="button button-secondary"
            onClick={handleOpenImportModal}
          >
            <Upload size={14} />
            <span>Import CSV</span>
          </button>

          <button
            type="button"
            className="button button-primary"
            onClick={handleOpenCreateContact}
          >
            <Plus size={15} />
            <span>Add contact</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="section-tabs" style={{ marginBottom: '22px' }}>
        <button
          type="button"
          className={activeTab === 'contacts' ? 'active' : ''}
          onClick={() => handleTabChange('contacts')}
        >
          All contacts
        </button>
        <button
          type="button"
          className={activeTab === 'tags' ? 'active' : ''}
          onClick={() => handleTabChange('tags')}
        >
          Tags ({availableTags.length})
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: ALL CONTACTS                                      */}
      {/* ======================================================== */}
      {activeTab === 'contacts' && (
        <>
          {/* Active Tag Filter Banner */}
          {selectedTagFilter && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 16px',
                marginBottom: '14px',
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '9px',
                color: '#1e40af',
                fontSize: '13.5px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Tag size={15} style={{ color: '#2563eb' }} />
                <span>
                  Filtered by tag: <b>{selectedTagFilter}</b> ({totalContacts.toLocaleString()}{' '}
                  {totalContacts === 1 ? 'contact' : 'contacts'})
                </span>
              </div>
              <button
                type="button"
                onClick={handleClearTagFilter}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'transparent',
                  border: 'none',
                  color: '#2563eb',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                <span>Clear tag filter</span>
                <X size={14} />
              </button>
            </div>
          )}

          <section className="data-panel">
            <div className="data-panel-top">
              <div>
                <h2>{selectedTagFilter ? `Tag: ${selectedTagFilter}` : 'All contacts'}</h2>
                <p>
                  {totalContacts.toLocaleString()} {totalContacts === 1 ? 'contact' : 'contacts'} · Page{' '}
                  {page} of {Math.max(1, totalPages)}
                </p>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="table-filter-bar">
              <label className="table-search-control">
                <Search size={15} aria-hidden="true" />
                <input
                  aria-label="Search contacts"
                  placeholder="Search by name or email…"
                  value={contactSearchInput}
                  onChange={(e) => setContactSearchInput(e.target.value)}
                />
                {contactSearchInput && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => setContactSearchInput('')}
                  >
                    ×
                  </button>
                )}
              </label>

              <div className="table-filter-controls">
                <label className="table-filter-control">
                  <span>Status</span>
                  <select
                    aria-label="Filter by status"
                    value={selectedStatus}
                    onChange={(e) => {
                      setSelectedStatus(e.target.value)
                      setPage(1)
                    }}
                  >
                    <option value="All statuses">All statuses</option>
                    <option value="subscribed">Subscribed</option>
                    <option value="unsubscribed">Unsubscribed</option>
                  </select>
                </label>

                <label className="table-filter-control">
                  <span>Tag</span>
                  <select
                    aria-label="Filter by tag"
                    value={selectedTagFilter || 'all'}
                    onChange={(e) => {
                      const val = e.target.value
                      if (val === 'all') handleClearTagFilter()
                      else handleSelectTagFilter(val)
                    }}
                  >
                    <option value="all">All tags</option>
                    {availableTags.map((tag) => (
                      <option key={tag} value={tag}>
                        {tag}
                      </option>
                    ))}
                  </select>
                </label>

                <button
                  type="button"
                  className="table-reset-button"
                  disabled={!contactSearchInput && selectedStatus === 'All statuses' && !selectedTagFilter}
                  onClick={() => {
                    setContactSearchInput('')
                    setDebouncedSearch('')
                    setSelectedStatus('All statuses')
                    handleClearTagFilter()
                    setPage(1)
                  }}
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Desktop Table */}
            <div className="desktop-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Contact</th>
                    <th>Status</th>
                    <th>Tags</th>
                    <th>Attributes</th>
                    <th>Created</th>
                    <th style={{ textAlign: 'right', width: '60px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {contactsLoading ? (
                    <tr>
                      <td colSpan={6} className="table-empty-state" style={{ height: '140px' }}>
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '8px',
                          }}
                        >
                          <Loader2 size={24} className="animate-spin" style={{ color: '#146ef5' }} />
                          <span>Loading contacts…</span>
                        </div>
                      </td>
                    </tr>
                  ) : contactsList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="table-empty-state">
                        {debouncedSearch || selectedStatus !== 'All statuses' || selectedTagFilter
                          ? 'No matching contacts found. Try adjusting your search or filters.'
                          : 'No contacts added yet. Click "+ Add contact" or "Import CSV" to get started.'}
                      </td>
                    </tr>
                  ) : (
                    contactsList.map((contact, idx) => {
                      const fName = typeof contact.first_name === 'string' ? contact.first_name : ''
                      const lName = typeof contact.last_name === 'string' ? contact.last_name : ''
                      const fullName = `${fName} ${lName}`.trim() || 'Unnamed Contact'
                      const emailText = typeof contact.email === 'string' ? contact.email : ''
                      const initials =
                        ((fName[0] || '') + (lName[0] || '')).toUpperCase() ||
                        (emailText[0] || 'C').toUpperCase()
                      const isExpanded = expandedContactId === contact.id
                      const attrEntries =
                        contact.attributes && typeof contact.attributes === 'object'
                          ? Object.entries(contact.attributes)
                          : []

                      return (
                        <tr
                          key={contact.id || idx}
                          className={isExpanded ? 'row-action-active' : ''}
                          style={{
                            position: 'relative',
                            zIndex: isExpanded ? 100 : 1,
                            backgroundColor: isExpanded ? '#f8fafc' : undefined,
                            cursor: 'pointer',
                          }}
                          onClick={() => {
                            setViewContactSnapshot(contact)
                            setViewContactId(contact.id)
                          }}
                        >
                          <td>
                            <div className="table-name-cell">
                              <span className="table-row-avatar avatar-contact">{initials}</span>
                              <span>
                                <b>{fullName}</b>
                                <small>{emailText}</small>
                              </span>
                            </div>
                          </td>
                          <td>
                            <StatusBadge status={contact.status || 'subscribed'} />
                          </td>
                          <td onClick={(e) => e.stopPropagation()}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                              {Array.isArray(contact.tags) && contact.tags.length > 0 ? (
                                contact.tags.map((tag) => (
                                  <button
                                    key={tag}
                                    type="button"
                                    onClick={() => handleSelectTagFilter(tag)}
                                    title={`Filter by ${tag}`}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      padding: '2px 8px',
                                      borderRadius: '6px',
                                      fontSize: '12px',
                                      fontWeight: 500,
                                      backgroundColor: '#eff6ff',
                                      color: '#1d4ed8',
                                      border: '1px solid #dbeafe',
                                      cursor: 'pointer',
                                    }}
                                  >
                                    {tag}
                                  </button>
                                ))
                              ) : (
                                <span style={{ color: '#94a3b8', fontSize: '12.5px' }}>No tags</span>
                              )}
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                              {attrEntries.length > 0 ? (
                                attrEntries.slice(0, 3).map(([k, v]) => (
                                  <span
                                    key={k}
                                    style={{
                                      padding: '2px 7px',
                                      borderRadius: '5px',
                                      fontSize: '11.5px',
                                      backgroundColor: '#f1f5f9',
                                      color: '#334155',
                                      border: '1px solid #e2e8f0',
                                    }}
                                  >
                                    <b>{k}:</b> {String(v)}
                                  </span>
                                ))
                              ) : (
                                <span style={{ color: '#94a3b8', fontSize: '12.5px' }}>—</span>
                              )}
                              {attrEntries.length > 3 && (
                                <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                                  +{attrEntries.length - 3}
                                </span>
                              )}
                            </div>
                          </td>
                          <td style={{ color: '#64748b', fontSize: '13px' }}>
                            {formatDate(contact.created_at)}
                          </td>
                          <td
                            className="row-action-cell"
                            style={{ textAlign: 'right', position: 'relative' }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              className={`row-action-trigger ${isExpanded ? 'active' : ''}`}
                              aria-label={`Open ${emailText || 'contact'} actions`}
                              aria-expanded={isExpanded}
                              onClick={(e) => {
                                e.stopPropagation()
                                const rect = e.currentTarget.getBoundingClientRect()
                                if (isExpanded) {
                                  setExpandedContactId(null)
                                  setMenuAnchorRect(null)
                                } else {
                                  setExpandedContactId(contact.id)
                                  setMenuAnchorRect(rect)
                                }
                              }}
                            >
                              <MoreHorizontal size={16} />
                            </button>

                            <FloatingRowActionMenu
                              isOpen={isExpanded}
                              anchorRect={menuAnchorRect}
                              onClose={() => {
                                setExpandedContactId(null)
                                setMenuAnchorRect(null)
                              }}
                            >
                              <RowActionMenuItem
                                icon={Eye}
                                label="View details"
                                onClick={() => {
                                  setViewContactSnapshot(contact)
                                  setViewContactId(contact.id)
                                  setExpandedContactId(null)
                                  setMenuAnchorRect(null)
                                }}
                              />
                              <RowActionMenuItem
                                icon={Pencil}
                                label="Edit contact"
                                onClick={() => handleOpenEditContact(contact)}
                              />
                              <RowActionMenuItem
                                icon={UserCheck}
                                label={
                                  contact.status === 'subscribed'
                                    ? 'Mark as unsubscribed'
                                    : 'Mark as subscribed'
                                }
                                onClick={() => handleQuickToggleStatus(contact)}
                              />
                              <RowActionDivider />
                              <RowActionMenuItem
                                icon={Trash2}
                                label="Delete contact"
                                isDanger
                                onClick={() => {
                                  setDeleteContactTarget(contact)
                                  setExpandedContactId(null)
                                  setMenuAnchorRect(null)
                                }}
                              />
                            </FloatingRowActionMenu>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Server-side Pagination */}
            <TablePagination
              pageIndex={page - 1}
              pageSize={pageSize}
              totalItems={totalContacts}
              pageSizeOptions={[10, 20, 50]}
              onPageChange={(nextIndex) => setPage(nextIndex + 1)}
              onPageSizeChange={(nextSize) => {
                setPageSize(nextSize)
                setPage(1)
              }}
            />
          </section>
        </>
      )}

      {/* ======================================================== */}
      {/* TAB 2: TAGS DIRECTORY                                    */}
      {/* ======================================================== */}
      {activeTab === 'tags' && (
        <section className="data-panel">
          <div className="data-panel-top">
            <div>
              <h2>Contact Tags</h2>
              <p>
                {availableTags.length} {availableTags.length === 1 ? 'tag' : 'tags'} synced from your
                contacts. Click any tag to view matching contacts.
              </p>
            </div>
          </div>

          <div className="table-filter-bar">
            <label className="table-search-control">
              <Search size={15} aria-hidden="true" />
              <input
                aria-label="Search tags"
                placeholder="Search tags…"
                value={tagSearch}
                onChange={(e) => setTagSearch(e.target.value)}
              />
              {tagSearch && (
                <button type="button" aria-label="Clear search" onClick={() => setTagSearch('')}>
                  ×
                </button>
              )}
            </label>
          </div>

          {tagsLoading ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
              <Loader2 size={24} className="animate-spin mx-auto mb-2 text-blue-600" />
              <span>Loading tags…</span>
            </div>
          ) : filteredTags.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
              <Tag size={32} className="mx-auto mb-2 text-slate-300" />
              <p style={{ margin: '0 0 12px' }}>
                {tagSearch
                  ? 'No tags match your search.'
                  : 'No tags created yet. Add tags when creating, editing, or importing contacts.'}
              </p>
              <button type="button" className="button button-primary" onClick={handleOpenCreateContact}>
                <Plus size={14} /> Add Contact with Tag
              </button>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: '12px',
                padding: '16px',
              }}
            >
              {filteredTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleSelectTagFilter(tag)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 16px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                    <span
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        backgroundColor: '#eff6ff',
                        color: '#2563eb',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Tag size={15} />
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <strong
                        style={{
                          display: 'block',
                          fontSize: '14px',
                          color: '#0f172a',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {tag}
                      </strong>
                      <small style={{ fontSize: '12px', color: '#64748b' }}>View contacts →</small>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: ADD CONTACT (POST /api/contacts/add-contact)    */}
      {/* ======================================================== */}
      {createContactOpen && (
        <div
          className="dialog-backdrop"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget && !createContactMutation.isPending) {
              setCreateContactOpen(false)
            }
          }}
        >
          <section
            className="action-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-contact-title"
            style={{ width: 'min(540px, 100%)', position: 'relative' }}
          >
            <button
              type="button"
              className="dialog-close"
              aria-label="Close dialog"
              disabled={createContactMutation.isPending}
              onClick={() => setCreateContactOpen(false)}
              style={{ top: '12px', right: '14px', zIndex: 10 }}
            >
              <X size={18} />
            </button>

            <div className="dialog-icon">
              <UserPlus size={19} />
            </div>
            <div className="eyebrow">ADD CONTACT</div>
            <h2 id="create-contact-title">Add a new contact</h2>
            <p>Create a subscriber with optional tags and custom JSON attributes.</p>

            {contactFormError && (
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
                <span>{safeRenderText(contactFormError)}</span>
              </div>
            )}

            <form onSubmit={handleSubmitCreateContact} className="dialog-form">
              <label>
                <span>
                  Email address <strong style={{ color: '#ef4444' }}>*</strong>
                </span>
                <input
                  type="email"
                  placeholder="john@example.com"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  disabled={createContactMutation.isPending}
                  autoFocus
                  required
                />
              </label>

              <div className="modal-two-col-grid">
                <label>
                  First name
                  <input
                    type="text"
                    placeholder="John"
                    value={contactFirstName}
                    onChange={(e) => setContactFirstName(e.target.value)}
                    disabled={createContactMutation.isPending}
                  />
                </label>
                <label>
                  Last name
                  <input
                    type="text"
                    placeholder="Smith"
                    value={contactLastName}
                    onChange={(e) => setContactLastName(e.target.value)}
                    disabled={createContactMutation.isPending}
                  />
                </label>
              </div>

              <TagMultiSelectInput
                availableTags={availableTags}
                selectedTags={contactSelectedTags}
                onChange={setContactSelectedTags}
                disabled={createContactMutation.isPending}
              />

              <AttributesKeyValueEditor
                pairs={contactAttrPairs}
                onChange={setContactAttrPairs}
                disabled={createContactMutation.isPending}
              />

              <button
                type="submit"
                className="button button-primary dialog-submit"
                disabled={createContactMutation.isPending}
                style={{ marginTop: '10px' }}
              >
                {createContactMutation.isPending ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Adding contact…</span>
                  </>
                ) : (
                  <span>Add contact</span>
                )}
              </button>
            </form>
          </section>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: EDIT CONTACT (PATCH /api/contacts/update-contact)*/}
      {/* ======================================================== */}
      {editContactTarget && (
        <div
          className="dialog-backdrop"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget && !patchContactMutation.isPending) {
              setEditContactTarget(null)
            }
          }}
        >
          <section
            className="action-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-contact-title"
            style={{ width: 'min(540px, 100%)', position: 'relative' }}
          >
            <button
              type="button"
              className="dialog-close"
              aria-label="Close dialog"
              disabled={patchContactMutation.isPending}
              onClick={() => setEditContactTarget(null)}
              style={{ top: '12px', right: '14px', zIndex: 10 }}
            >
              <X size={18} />
            </button>

            <div className="dialog-icon">
              <Pencil size={19} />
            </div>
            <div className="eyebrow">UPDATE CONTACT</div>
            <h2 id="edit-contact-title">Edit contact</h2>
            <p>Update contact details, subscription status, tags, and attributes.</p>

            {contactFormError && (
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
                <span>{safeRenderText(contactFormError)}</span>
              </div>
            )}

            <form onSubmit={handleSubmitEditContact} className="dialog-form">
              <div className="modal-two-col-grid">
                <label>
                  <span>
                    Email address <strong style={{ color: '#ef4444' }}>*</strong>
                  </span>
                  <input
                    type="email"
                    placeholder="john@example.com"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    disabled={patchContactMutation.isPending}
                    required
                  />
                </label>

                <label>
                  Subscription status
                  <select
                    value={contactStatus}
                    onChange={(e) => setContactStatus(e.target.value)}
                    disabled={patchContactMutation.isPending}
                  >
                    <option value="subscribed">Subscribed</option>
                    <option value="unsubscribed">Unsubscribed</option>
                  </select>
                </label>
              </div>

              <div className="modal-two-col-grid">
                <label>
                  First name
                  <input
                    type="text"
                    placeholder="Johnny"
                    value={contactFirstName}
                    onChange={(e) => setContactFirstName(e.target.value)}
                    disabled={patchContactMutation.isPending}
                  />
                </label>
                <label>
                  Last name
                  <input
                    type="text"
                    placeholder="Smith"
                    value={contactLastName}
                    onChange={(e) => setContactLastName(e.target.value)}
                    disabled={patchContactMutation.isPending}
                  />
                </label>
              </div>

              <TagMultiSelectInput
                availableTags={availableTags}
                selectedTags={contactSelectedTags}
                onChange={setContactSelectedTags}
                disabled={patchContactMutation.isPending}
              />

              <AttributesKeyValueEditor
                pairs={contactAttrPairs}
                onChange={setContactAttrPairs}
                disabled={patchContactMutation.isPending}
              />

              <button
                type="submit"
                className="button button-primary dialog-submit"
                disabled={patchContactMutation.isPending}
                style={{ marginTop: '10px' }}
              >
                {patchContactMutation.isPending ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Saving changes…</span>
                  </>
                ) : (
                  <span>Save changes</span>
                )}
              </button>
            </form>
          </section>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: IMPORT CONTACTS CSV (POST /api/contacts/import) */}
      {/* ======================================================== */}
      {importModalOpen && (
        <div
          className="dialog-backdrop"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget && !importContactsMutation.isPending) {
              setImportModalOpen(false)
            }
          }}
        >
          <section
            className="action-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="import-contacts-title"
            style={{ width: 'min(520px, 100%)', position: 'relative' }}
          >
            <button
              type="button"
              className="dialog-close"
              aria-label="Close dialog"
              disabled={importContactsMutation.isPending}
              onClick={() => setImportModalOpen(false)}
              style={{ top: '12px', right: '14px', zIndex: 10 }}
            >
              <X size={18} />
            </button>

            <div className="dialog-icon">
              <FileSpreadsheet size={19} />
            </div>
            <div className="eyebrow">BULK IMPORT</div>
            <h2 id="import-contacts-title">Import contacts from CSV</h2>
            <p>
              Upload a UTF-8 CSV file containing an <code>email</code> column (optional:{' '}
              <code>first_name</code>, <code>last_name</code>).
            </p>

            {importError && (
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
                <span>{safeRenderText(importError)}</span>
              </div>
            )}

            {importResult && (
              <div
                style={{
                  padding: '12px 14px',
                  marginBottom: '14px',
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '8px',
                  color: '#166534',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontWeight: 700, marginBottom: '8px' }}>
                  <CheckCircle2 size={16} />
                  <span>Import completed!</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', fontSize: '13px' }}>
                  <div style={{ background: '#ffffff', padding: '8px', borderRadius: '6px', textAlign: 'center', border: '1px solid #dcfce7' }}>
                    <strong style={{ display: 'block', fontSize: '16px', color: '#15803d' }}>
                      {importResult.created}
                    </strong>
                    <span>Created</span>
                  </div>
                  <div style={{ background: '#ffffff', padding: '8px', borderRadius: '6px', textAlign: 'center', border: '1px solid #dcfce7' }}>
                    <strong style={{ display: 'block', fontSize: '16px', color: '#0369a1' }}>
                      {importResult.existing}
                    </strong>
                    <span>Existing</span>
                  </div>
                  <div style={{ background: '#ffffff', padding: '8px', borderRadius: '6px', textAlign: 'center', border: '1px solid #dcfce7' }}>
                    <strong style={{ display: 'block', fontSize: '16px', color: '#b91c1c' }}>
                      {importResult.invalid}
                    </strong>
                    <span>Invalid</span>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmitImportCsv} className="dialog-form">
              <div>
                <span style={{ display: 'block', fontSize: '13px', fontWeight: 650, color: '#4b5d73', marginBottom: '6px' }}>
                  CSV File <strong style={{ color: '#ef4444' }}>*</strong>
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null
                    setImportFile(f)
                    setImportError(null)
                    setImportResult(null)
                  }}
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault()
                    const f = e.dataTransfer.files?.[0]
                    if (f) {
                      setImportFile(f)
                      setImportError(null)
                      setImportResult(null)
                    }
                  }}
                  style={{
                    border: '1.5px dashed #cbd5e1',
                    borderRadius: '10px',
                    padding: '20px 16px',
                    textAlign: 'center',
                    backgroundColor: '#f8fafc',
                    cursor: 'pointer',
                  }}
                >
                  <Upload size={22} className="mx-auto mb-2 text-blue-600" />
                  {importFile ? (
                    <div>
                      <strong style={{ display: 'block', fontSize: '13.5px', color: '#0f172a' }}>
                        {importFile.name}
                      </strong>
                      <small style={{ color: '#64748b' }}>
                        {(importFile.size / 1024).toFixed(1)} KB · Click to change file
                      </small>
                    </div>
                  ) : (
                    <div>
                      <strong style={{ display: 'block', fontSize: '13.5px', color: '#334155' }}>
                        Click to choose or drag & drop CSV file
                      </strong>
                      <small style={{ color: '#64748b' }}>UTF-8 CSV with an email column</small>
                    </div>
                  )}
                </div>
              </div>

              <TagMultiSelectInput
                availableTags={availableTags}
                selectedTags={importTags}
                onChange={setImportTags}
                disabled={importContactsMutation.isPending}
                label="Apply tags to imported contacts (optional)"
                placeholder="Select or add tags for imported contacts…"
              />

              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <button
                  type="button"
                  className="button button-secondary"
                  style={{ flex: 1 }}
                  disabled={importContactsMutation.isPending}
                  onClick={() => setImportModalOpen(false)}
                >
                  {importResult ? 'Close' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="button button-primary"
                  style={{ flex: 1 }}
                  disabled={importContactsMutation.isPending || !importFile}
                >
                  {importContactsMutation.isPending ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Importing…</span>
                    </>
                  ) : (
                    <span>Import contacts</span>
                  )}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: CONTACT DETAILS (GET /api/contacts/get-contact) */}
      {/* ======================================================== */}
      {viewContactId && activeContactDetail && (
        <div
          className="dialog-backdrop"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setViewContactId(null)
              setViewContactSnapshot(null)
            }
          }}
        >
          <section
            className="action-dialog action-dialog-lg"
            role="dialog"
            aria-modal="true"
            aria-labelledby="contact-details-title"
            style={{ width: 'min(540px, 100%)', position: 'relative' }}
          >
            <button
              type="button"
              className="dialog-close"
              aria-label="Close dialog"
              onClick={() => {
                setViewContactId(null)
                setViewContactSnapshot(null)
              }}
              style={{ top: '12px', right: '14px', zIndex: 10 }}
            >
              <X size={18} />
            </button>

            <div className="dialog-icon">
              <UserCheck size={19} />
            </div>
            <div className="eyebrow">CONTACT DETAILS</div>
            <h2 id="contact-details-title">
              {`${activeContactDetail.first_name || ''} ${activeContactDetail.last_name || ''}`.trim() ||
                activeContactDetail.email}
            </h2>
            <p style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>{activeContactDetail.email}</span>
              {contactDetailLoading && <Loader2 size={13} className="animate-spin text-blue-500" />}
            </p>

            <div className="modal-details-body">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '7px',
                }}
              >
                <span style={{ color: '#64748b' }}>Contact ID</span>
                <code style={{ fontSize: '12px', color: '#0f172a', wordBreak: 'break-all' }}>
                  {activeContactDetail.id}
                </code>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '7px',
                }}
              >
                <span style={{ color: '#64748b' }}>Status</span>
                <StatusBadge status={activeContactDetail.status || 'subscribed'} />
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  padding: '8px 12px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '7px',
                }}
              >
                <span style={{ color: '#64748b' }}>Tags</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                  {Array.isArray(activeContactDetail.tags) && activeContactDetail.tags.length > 0 ? (
                    activeContactDetail.tags.map((tag) => (
                      <span
                        key={tag}
                        style={{
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          backgroundColor: '#eff6ff',
                          color: '#1d4ed8',
                          border: '1px solid #dbeafe',
                        }}
                      >
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span style={{ color: '#94a3b8' }}>None</span>
                  )}
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  padding: '8px 12px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '7px',
                }}
              >
                <span style={{ color: '#64748b' }}>Attributes</span>
                {activeContactDetail.attributes &&
                Object.keys(activeContactDetail.attributes).length > 0 ? (
                  <pre
                    style={{
                      margin: 0,
                      padding: '8px',
                      backgroundColor: '#f1f5f9',
                      borderRadius: '6px',
                      fontSize: '12px',
                      overflowX: 'auto',
                    }}
                  >
                    {JSON.stringify(activeContactDetail.attributes, null, 2)}
                  </pre>
                ) : (
                  <span style={{ color: '#94a3b8', fontSize: '13px' }}>No attributes</span>
                )}
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '7px',
                }}
              >
                <span style={{ color: '#64748b' }}>Created</span>
                <span>{formatDateTime(activeContactDetail.created_at)}</span>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '7px',
                }}
              >
                <span style={{ color: '#64748b' }}>Last Updated</span>
                <span>{formatDateTime(activeContactDetail.updated_at)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '9px', marginTop: '18px' }}>
              <button
                type="button"
                className="button button-secondary"
                style={{ flex: 1 }}
                onClick={() => {
                  setViewContactId(null)
                  setViewContactSnapshot(null)
                }}
              >
                Close
              </button>
              <button
                type="button"
                className="button button-primary"
                style={{ flex: 1 }}
                onClick={() => {
                  const target = activeContactDetail
                  setViewContactId(null)
                  setViewContactSnapshot(null)
                  handleOpenEditContact(target)
                }}
              >
                Edit contact
              </button>
            </div>
          </section>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 5: DELETE CONTACT (DELETE /api/contacts/delete)    */}
      {/* ======================================================== */}
      {deleteContactTarget && (
        <div
          className="dialog-backdrop"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget && !deleteContactMutation.isPending) {
              setDeleteContactTarget(null)
            }
          }}
        >
          <section
            className="action-dialog action-dialog-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-contact-title"
            style={{ width: 'min(420px, 100%)', position: 'relative' }}
          >
            <button
              type="button"
              className="dialog-close"
              aria-label="Close dialog"
              disabled={deleteContactMutation.isPending}
              onClick={() => setDeleteContactTarget(null)}
              style={{ top: '12px', right: '14px', zIndex: 10 }}
            >
              <X size={18} />
            </button>

            <div className="dialog-icon" style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}>
              <Trash2 size={19} />
            </div>
            <div className="eyebrow" style={{ color: '#dc2626' }}>
              DANGER ZONE
            </div>
            <h2 id="delete-contact-title">Delete contact</h2>
            <p>
              Are you sure you want to delete <b>{deleteContactTarget.email}</b>? This action cannot
              be undone.
            </p>

            <div style={{ display: 'flex', gap: '9px', marginTop: '18px' }}>
              <button
                type="button"
                className="button button-secondary"
                style={{ flex: 1 }}
                disabled={deleteContactMutation.isPending}
                onClick={() => setDeleteContactTarget(null)}
              >
                Cancel
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
                disabled={deleteContactMutation.isPending}
                onClick={handleDeleteContact}
              >
                {deleteContactMutation.isPending ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Deleting…</span>
                  </>
                ) : (
                  <span>Delete contact</span>
                )}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  )
}
