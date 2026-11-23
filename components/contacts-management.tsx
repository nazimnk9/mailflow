'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  AlertCircle,
  ArrowRight,
  Check,
  ChevronDown,
  ContactRound,
  Eye,
  Filter,
  FolderPlus,
  Info,
  Loader2,
  Mail,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react'
import {
  useContactListsQuery,
  useCreateContactListMutation,
  usePatchContactListMutation,
  useDeleteContactListMutation,
  useContactsQuery,
  useCreateContactMutation,
  usePatchContactMutation,
  useDeleteContactMutation,
} from '@/lib/hooks/use-contacts-query'
import type { ContactItem, ContactListItem } from '@/lib/api/contacts'
import { formatApiErrorMessage } from '@/lib/api-client'
import { TablePagination } from '@/components/table-pagination'
import { StatusBadge } from '@/components/status-badge'

interface ContactsManagementProps {
  route?: string
  onAction: (message: string) => void
}

type ContactTab = 'contacts' | 'lists'

function safeRenderText(val: unknown, fallback = ''): string {
  if (val === null || val === undefined) return fallback
  if (typeof val === 'string') return val
  if (typeof val === 'number') return String(val)
  if (typeof val === 'boolean') return String(val)
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

function ensureArray<T>(data: unknown): T[] {
  if (!data) return []
  if (Array.isArray(data)) {
    return data.filter((item) => item !== null && item !== undefined && typeof item === 'object') as T[]
  }
  if (typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (Array.isArray(obj.data)) {
      return obj.data.filter((item) => item !== null && item !== undefined && typeof item === 'object') as T[]
    }
    if (Array.isArray(obj.items)) {
      return obj.items.filter((item) => item !== null && item !== undefined && typeof item === 'object') as T[]
    }
    if (Array.isArray(obj.contacts)) {
      return obj.contacts.filter((item) => item !== null && item !== undefined && typeof item === 'object') as T[]
    }
    if (Array.isArray(obj.lists)) {
      return obj.lists.filter((item) => item !== null && item !== undefined && typeof item === 'object') as T[]
    }
    if (Array.isArray(obj.results)) {
      return obj.results.filter((item) => item !== null && item !== undefined && typeof item === 'object') as T[]
    }
  }
  return []
}

function RowActionMenuItem({
  icon: Icon,
  label,
  onClick,
  isDanger = false,
}: {
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>
  label: string
  onClick: () => void
  isDanger?: boolean
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <button
      type="button"
      className={`row-action-menu-item ${isDanger ? 'row-action-danger' : ''}`}
      role="menuitem"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        width: '100%',
        padding: '8px 12px',
        border: 'none',
        borderRadius: '6px',
        fontSize: '13.5px',
        fontWeight: 500,
        textAlign: 'left',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        userSelect: 'none',
        backgroundColor: hovered
          ? isDanger
            ? '#fef2f2'
            : '#eff6ff'
          : '#ffffff',
        color: isDanger
          ? hovered
            ? '#b91c1c'
            : '#dc2626'
          : hovered
          ? '#1d4ed8'
          : '#334155',
        transition: 'background-color 0.15s ease, color 0.15s ease',
      }}
    >
      <Icon
        size={15}
        className="row-action-icon"
        style={{
          flexShrink: 0,
          color: isDanger
            ? hovered
              ? '#b91c1c'
              : '#ef4444'
            : hovered
            ? '#2563eb'
            : '#64748b',
          transition: 'color 0.15s ease',
        }}
      />
      <span
        style={{
          color: isDanger
            ? hovered
              ? '#b91c1c'
              : '#dc2626'
            : hovered
            ? '#1d4ed8'
            : '#334155',
          fontWeight: 500,
          fontSize: '13.5px',
          transition: 'color 0.15s ease',
        }}
      >
        {label}
      </span>
    </button>
  )
}

function AssignToListMultiSelect({
  lists,
  selectedListIds,
  onChange,
  disabled = false,
}: {
  lists: ContactListItem[]
  selectedListIds: string[]
  onChange: (ids: string[]) => void
  disabled?: boolean
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  // Filter lists based on search
  const filteredLists = useMemo(() => {
    if (!search.trim()) return lists
    const query = search.toLowerCase().trim()
    return lists.filter(
      (l) =>
        (l.name && l.name.toLowerCase().includes(query)) ||
        (l.description && l.description.toLowerCase().includes(query))
    )
  }, [lists, search])

  // Selected list objects
  const selectedLists = useMemo(() => {
    return lists.filter((l) => selectedListIds.includes(l.id))
  }, [lists, selectedListIds])

  // Click outside to close
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

  const toggleList = (id: string) => {
    if (disabled) return
    if (selectedListIds.includes(id)) {
      onChange(selectedListIds.filter((item) => item !== id))
    } else {
      onChange([...selectedListIds, id])
    }
  }

  const removeList = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (disabled) return
    onChange(selectedListIds.filter((item) => item !== id))
  }

  const clearAll = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (disabled) return
    onChange([])
  }

  return (
    <div
      ref={containerRef}
      className="assign-list-combobox-container"
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        width: '100%',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span
          style={{
            fontSize: '13px',
            fontWeight: 650,
            color: '#4b5d73',
          }}
        >
          Assign to lists
        </span>
        {selectedListIds.length > 0 && (
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
            {selectedListIds.length} {selectedListIds.length === 1 ? 'list' : 'lists'} selected
          </span>
        )}
      </div>

      {/* Trigger Box */}
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
          boxSizing: 'border-box',
          width: '100%',
          transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
        }}
      >
        {/* Chips or Placeholder */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px',
            alignItems: 'center',
            flex: 1,
            minWidth: 0,
          }}
        >
          {selectedLists.length > 0 ? (
            selectedLists.map((list) => (
              <span
                key={list.id}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '3px 7px 3px 9px',
                  borderRadius: '6px',
                  fontSize: '12.5px',
                  fontWeight: 500,
                  backgroundColor: '#eff6ff',
                  color: '#1d4ed8',
                  border: '1px solid #bfdbfe',
                  lineHeight: 1.2,
                }}
              >
                <Users size={12} style={{ color: '#2563eb', flexShrink: 0 }} />
                <span
                  style={{
                    maxWidth: '180px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {safeRenderText(list.name, 'List')}
                </span>
                <button
                  type="button"
                  aria-label={`Remove ${list.name}`}
                  onClick={(e) => removeList(list.id, e)}
                  disabled={disabled}
                  style={{
                    display: 'grid',
                    placeItems: 'center',
                    width: '16px',
                    height: '16px',
                    marginLeft: '2px',
                    borderRadius: '50%',
                    background: 'transparent',
                    border: 'none',
                    color: '#60a5fa',
                    cursor: 'pointer',
                    padding: 0,
                    transition: 'all 0.12s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#dbeafe'
                    e.currentTarget.style.color = '#1d4ed8'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.color = '#60a5fa'
                  }}
                >
                  <X size={12} />
                </button>
              </span>
            ))
          ) : (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                color: '#94a3b8',
                fontSize: '13.5px',
                userSelect: 'none',
              }}
            >
              <Users size={15} style={{ color: '#94a3b8' }} />
              <span>Select lists to assign…</span>
            </span>
          )}
        </div>

        {/* Controls: Clear & Chevron */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          {selectedListIds.length > 0 && !disabled && (
            <button
              type="button"
              onClick={clearAll}
              aria-label="Clear all selected lists"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '11.5px',
                fontWeight: 600,
                color: '#64748b',
                background: '#f1f5f9',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.12s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#dc2626'
                e.currentTarget.style.backgroundColor = '#fee2e2'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#64748b'
                e.currentTarget.style.backgroundColor = '#f1f5f9'
              }}
            >
              Clear
            </button>
          )}
          <ChevronDown
            size={16}
            style={{
              color: '#64748b',
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
            }}
          />
        </div>
      </div>

      {/* Floating Dropdown Panel */}
      {isOpen && (
        <div
          role="listbox"
          aria-multiselectable="true"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 1050,
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            boxShadow:
              '0 14px 35px -5px rgba(15, 23, 42, 0.18), 0 4px 12px -2px rgba(15, 23, 42, 0.08)',
            padding: '6px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            boxSizing: 'border-box',
            animation: 'fadeInRowMenu 0.12s ease-out',
          }}
        >
          {/* Search bar inside dropdown */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 8px',
              borderRadius: '6px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
            }}
          >
            <Search size={14} style={{ color: '#94a3b8', flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search lists…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="assign-list-search-input"
              style={{
                width: '100%',
                height: '28px',
                border: 'none',
                outline: 'none',
                backgroundColor: 'transparent',
                fontSize: '13px',
                color: '#1e293b',
                padding: '0 4px',
              }}
              autoFocus
            />
            {search && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setSearch('')
                }}
                style={{
                  display: 'grid',
                  placeItems: 'center',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* List Options */}
          <div
            style={{
              maxHeight: '180px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
            }}
          >
            {lists.length === 0 ? (
              <div
                style={{
                  padding: '16px 12px',
                  textAlign: 'center',
                  color: '#94a3b8',
                  fontSize: '13px',
                }}
              >
                No contact lists created yet.
              </div>
            ) : filteredLists.length === 0 ? (
              <div
                style={{
                  padding: '16px 12px',
                  textAlign: 'center',
                  color: '#94a3b8',
                  fontSize: '13px',
                }}
              >
                No lists matching &quot;{search}&quot;.
              </div>
            ) : (
              filteredLists.map((list) => {
                const isSelected = selectedListIds.includes(list.id)
                const countNum = typeof list.contact_count === 'number' ? list.contact_count : 0
                return (
                  <div
                    key={list.id}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => toggleList(list.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '7px 9px',
                      borderRadius: '6px',
                      backgroundColor: isSelected ? '#eff6ff' : 'transparent',
                      cursor: 'pointer',
                      transition: 'background-color 0.12s ease',
                      userSelect: 'none',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = '#f8fafc'
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '9px', minWidth: 0 }}>
                      {/* Custom Checkbox indicator */}
                      <div
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '4px',
                          border: isSelected ? '1px solid #2563eb' : '1.5px solid #cbd5e1',
                          backgroundColor: isSelected ? '#2563eb' : '#ffffff',
                          display: 'grid',
                          placeItems: 'center',
                          flexShrink: 0,
                          transition: 'all 0.12s ease',
                        }}
                      >
                        {isSelected && <Check size={12} strokeWidth={3} style={{ color: '#ffffff' }} />}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                        <span
                          style={{
                            fontSize: '13.5px',
                            fontWeight: isSelected ? 600 : 500,
                            color: isSelected ? '#1d4ed8' : '#1e293b',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {safeRenderText(list.name, 'List')}
                        </span>
                        {list.description && (
                          <span
                            style={{
                              fontSize: '11.5px',
                              color: '#64748b',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {safeRenderText(list.description)}
                          </span>
                        )}
                      </div>
                    </div>

                    <span
                      style={{
                        fontSize: '11.5px',
                        fontWeight: 500,
                        color: isSelected ? '#2563eb' : '#94a3b8',
                        padding: '1px 6px',
                        borderRadius: '999px',
                        backgroundColor: isSelected ? '#dbeafe' : '#f1f5f9',
                        flexShrink: 0,
                        marginLeft: '8px',
                      }}
                    >
                      {countNum} {countNum === 1 ? 'contact' : 'contacts'}
                    </span>
                  </div>
                )
              })
            )}
          </div>

          {/* Footer Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 4px 2px',
              borderTop: '1px solid #f1f5f9',
              fontSize: '12px',
              color: '#64748b',
            }}
          >
            <span>
              {selectedListIds.length} of {lists.length} selected
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setIsOpen(false)
              }}
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

export function ContactsManagement({ route = 'contacts', onAction }: ContactsManagementProps) {
  // Determine initial active tab based on route
  const getInitialTab = (r: string): ContactTab => {
    if (r.includes('list')) return 'lists'
    return 'contacts'
  }

  const [activeTab, setActiveTab] = useState<ContactTab>(getInitialTab(route))

  // Selected list filter for All contacts view (when navigating from a list click or dropdown)
  const [selectedListId, setSelectedListId] = useState<string | null>(null)

  // Filters for contacts
  const [contactSearch, setContactSearch] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('All statuses')
  const [contactsPagination, setContactsPagination] = useState({ pageIndex: 0, pageSize: 6 })

  // Filters for lists
  const [listSearch, setListSearch] = useState('')
  const [listsPagination, setListsPagination] = useState({ pageIndex: 0, pageSize: 6 })

  // Modals state
  const [createListOpen, setCreateListOpen] = useState(false)
  const [editListTarget, setEditListTarget] = useState<ContactListItem | null>(null)
  const [deleteListTarget, setDeleteListTarget] = useState<ContactListItem | null>(null)

  const [createContactOpen, setCreateContactOpen] = useState(false)
  const [editContactTarget, setEditContactTarget] = useState<ContactItem | null>(null)
  const [deleteContactTarget, setDeleteContactTarget] = useState<ContactItem | null>(null)
  const [viewContactDetails, setViewContactDetails] = useState<ContactItem | null>(null)

  // Dropdown row action open tracker
  const [expandedContactId, setExpandedContactId] = useState<string | null>(null)
  const [expandedListId, setExpandedListId] = useState<string | null>(null)

  // Form states - List
  const [listName, setListName] = useState('')
  const [listDescription, setListDescription] = useState('')
  const [listFormError, setListFormError] = useState<string | null>(null)

  // Form states - Contact
  const [contactEmail, setContactEmail] = useState('')
  const [contactFirstName, setContactFirstName] = useState('')
  const [contactLastName, setContactLastName] = useState('')
  const [contactStatus, setContactStatus] = useState<string>('subscribed')
  const [contactSelectedLists, setContactSelectedLists] = useState<string[]>([])
  const [contactAttributes, setContactAttributes] = useState('')
  const [contactFormError, setContactFormError] = useState<string | null>(null)

  // Sync tab if route prop changes
  useEffect(() => {
    setActiveTab(getInitialTab(route))
  }, [route])

  // Check URL query parameter on mount or tab change (e.g. ?list=xxx)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const listParam = params.get('list')
      if (listParam) {
        setSelectedListId(listParam)
        setActiveTab('contacts')
      }
    }
  }, [])

  // Tab switch handler with browser URL sync (without full page reload)
  const handleTabChange = (tab: ContactTab) => {
    setActiveTab(tab)
    setExpandedContactId(null)
    setExpandedListId(null)
    const targetUrl = tab === 'lists' ? '/app/contacts/lists' : '/app/contacts'
    window.history.pushState(null, '', targetUrl)
  }

  // Close 3-dots menus when clicking anywhere outside or pressing Escape
  useEffect(() => {
    if (!expandedContactId && !expandedListId) return

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null
      if (!target) return
      // If clicked inside the row action trigger or menu itself, let internal handlers process it
      if (target.closest('.row-action-menu') || target.closest('.row-action-trigger')) {
        return
      }
      setExpandedContactId(null)
      setExpandedListId(null)
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setExpandedContactId(null)
        setExpandedListId(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [expandedContactId, expandedListId])

  // Live queries
  const {
    data: listsResponse,
    isLoading: listsLoading,
    isRefetching: listsRefetching,
    refetch: refetchLists,
  } = useContactListsQuery()

  const {
    data: contactsResponse,
    isLoading: contactsLoading,
    isRefetching: contactsRefetching,
    refetch: refetchContacts,
  } = useContactsQuery()

  // Mutations
  const createListMutation = useCreateContactListMutation()
  const patchListMutation = usePatchContactListMutation()
  const deleteListMutation = useDeleteContactListMutation()

  const createContactMutation = useCreateContactMutation()
  const patchContactMutation = usePatchContactMutation()
  const deleteContactMutation = useDeleteContactMutation()

  const allLists: ContactListItem[] = useMemo(() => {
    const raw = ensureArray<ContactListItem>(listsResponse?.data ?? listsResponse)
    return raw.filter((l) => l && typeof l === 'object' && (l.id || l.name))
  }, [listsResponse])

  const allContacts: ContactItem[] = useMemo(() => {
    const raw = ensureArray<ContactItem>(contactsResponse?.data ?? contactsResponse)
    return raw.filter((c) => c && typeof c === 'object' && (c.id || c.email))
  }, [contactsResponse])

  // Map list ID to name for badges
  const listNameMap = useMemo(() => {
    const map = new Map<string, string>()
    if (Array.isArray(allLists)) {
      allLists.forEach((l) => {
        if (l && typeof l.id === 'string' && typeof l.name === 'string') {
          map.set(l.id, l.name)
        }
      })
    }
    return map
  }, [allLists])

  // Selected list details if filtered
  const activeSelectedList = useMemo(() => {
    if (!selectedListId || !Array.isArray(allLists)) return null
    return allLists.find((l) => l && l.id === selectedListId) || null
  }, [allLists, selectedListId])

  // Filtered Contacts
  const filteredContacts = useMemo(() => {
    const source = Array.isArray(allContacts) ? allContacts : []
    let result = source

    // Filter by specific list
    if (selectedListId) {
      result = result.filter((c) => {
        if (!c || !Array.isArray(c.lists)) return false
        return c.lists.some((item) => {
          if (typeof item === 'string') return item === selectedListId
          if (item && typeof item === 'object' && 'id' in item) {
            return String((item as any).id) === selectedListId
          }
          return false
        })
      })
    }

    // Filter by search
    if (contactSearch.trim()) {
      const q = contactSearch.toLowerCase()
      result = result.filter((c) => {
        if (!c) return false
        const fName = typeof c.first_name === 'string' ? c.first_name : ''
        const lName = typeof c.last_name === 'string' ? c.last_name : ''
        const mail = typeof c.email === 'string' ? c.email : ''
        const full = `${fName} ${lName} ${mail}`.toLowerCase()
        return full.includes(q)
      })
    }

    // Filter by status
    if (selectedStatus !== 'All statuses') {
      result = result.filter((c) => {
        if (!c) return false
        const st = typeof c.status === 'string' ? c.status : ''
        return st.toLowerCase() === selectedStatus.toLowerCase()
      })
    }

    return result
  }, [allContacts, selectedListId, contactSearch, selectedStatus])

  // Filtered Lists
  const filteredLists = useMemo(() => {
    const source = Array.isArray(allLists) ? allLists : []
    if (!listSearch.trim()) return source
    const q = listSearch.toLowerCase()
    return source.filter((l) => {
      if (!l) return false
      const name = typeof l.name === 'string' ? l.name.toLowerCase() : ''
      const desc = typeof l.description === 'string' ? l.description.toLowerCase() : ''
      return name.includes(q) || desc.includes(q)
    })
  }, [allLists, listSearch])

  // Paginated data
  const paginatedContacts = useMemo(() => {
    const source = Array.isArray(filteredContacts) ? filteredContacts : []
    const start = contactsPagination.pageIndex * contactsPagination.pageSize
    return source.slice(start, start + contactsPagination.pageSize)
  }, [filteredContacts, contactsPagination])

  const paginatedLists = useMemo(() => {
    const source = Array.isArray(filteredLists) ? filteredLists : []
    const start = listsPagination.pageIndex * listsPagination.pageSize
    return source.slice(start, start + listsPagination.pageSize)
  }, [filteredLists, listsPagination])

  // Reset pagination on filter change
  useEffect(() => {
    setContactsPagination((prev) => ({ ...prev, pageIndex: 0 }))
    setExpandedContactId(null)
  }, [selectedListId, contactSearch, selectedStatus])

  useEffect(() => {
    setListsPagination((prev) => ({ ...prev, pageIndex: 0 }))
    setExpandedListId(null)
  }, [listSearch])

  // Format date helper
  const formatDate = (dateStr?: string | null) => {
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

  // ==========================================
  // List Actions
  // ==========================================
  const handleOpenCreateList = () => {
    setListName('')
    setListDescription('')
    setListFormError(null)
    setCreateListOpen(true)
  }

  const handleSubmitCreateList = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!listName.trim()) {
      setListFormError('List name is required.')
      return
    }

    setListFormError(null)
    createListMutation.mutate(
      {
        name: listName.trim(),
        description: listDescription.trim() || undefined,
      },
      {
        onSuccess: (res) => {
          setCreateListOpen(false)
          onAction(`Contact list “${res.data?.name || listName}” created successfully.`)
        },
        onError: (err) => {
          setListFormError(formatApiErrorMessage(err))
        },
      }
    )
  }

  const handleOpenEditList = (list: ContactListItem) => {
    setEditListTarget(list)
    setListName(list.name || '')
    setListDescription(list.description || '')
    setListFormError(null)
    setExpandedListId(null)
  }

  const handleSubmitEditList = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editListTarget) return
    if (!listName.trim()) {
      setListFormError('List name is required.')
      return
    }

    setListFormError(null)
    patchListMutation.mutate(
      {
        listId: editListTarget.id,
        payload: {
          name: listName.trim(),
          description: listDescription.trim(),
        },
      },
      {
        onSuccess: (res) => {
          setEditListTarget(null)
          onAction(`Contact list “${res.data?.name || listName}” updated successfully.`)
        },
        onError: (err) => {
          setListFormError(formatApiErrorMessage(err))
        },
      }
    )
  }

  const handleDeleteList = async () => {
    if (!deleteListTarget) return
    deleteListMutation.mutate(deleteListTarget.id, {
      onSuccess: () => {
        if (selectedListId === deleteListTarget.id) {
          setSelectedListId(null)
        }
        setDeleteListTarget(null)
        onAction(`Contact list “${deleteListTarget.name}” deleted successfully.`)
      },
      onError: (err) => {
        onAction(formatApiErrorMessage(err))
      },
    })
  }

  // Click on a specific list to view contacts filtered by this list
  const handleSelectSpecificList = (list: ContactListItem) => {
    setSelectedListId(list.id)
    setActiveTab('contacts')
    setExpandedListId(null)
    window.history.pushState(null, '', `/app/contacts?list=${list.id}`)
    onAction(`Filtered contacts by “${list.name}”.`)
  }

  const handleClearListFilter = () => {
    setSelectedListId(null)
    window.history.pushState(null, '', '/app/contacts')
  }

  // ==========================================
  // Contact Actions
  // ==========================================
  const handleOpenCreateContact = () => {
    setContactEmail('')
    setContactFirstName('')
    setContactLastName('')
    setContactStatus('subscribed')
    // If a list was selected, pre-check it
    setContactSelectedLists(selectedListId ? [selectedListId] : [])
    setContactAttributes('')
    setContactFormError(null)
    setCreateContactOpen(true)
  }

  const handleSubmitCreateContact = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!contactEmail.trim()) {
      setContactFormError('Email address is required.')
      return
    }

    setContactFormError(null)
    createContactMutation.mutate(
      {
        email: contactEmail.trim(),
        first_name: contactFirstName.trim() || undefined,
        last_name: contactLastName.trim() || undefined,
        status: 'subscribed',
        lists: contactSelectedLists,
        attributes: '',
      },
      {
        onSuccess: (res) => {
          setCreateContactOpen(false)
          onAction(`Contact “${res.data?.email || contactEmail}” added successfully.`)
        },
        onError: (err) => {
          setContactFormError(formatApiErrorMessage(err))
        },
      }
    )
  }

  const handleOpenEditContact = (contact: ContactItem) => {
    setEditContactTarget(contact)
    setContactEmail(contact.email || '')
    setContactFirstName(contact.first_name || '')
    setContactLastName(contact.last_name || '')
    setContactStatus(contact.status || 'subscribed')
    setContactSelectedLists(Array.isArray(contact.lists) ? contact.lists : [])
    setContactAttributes(contact.attributes || '')
    setContactFormError(null)
    setExpandedContactId(null)
  }

  const handleSubmitEditContact = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editContactTarget) return
    if (!contactEmail.trim()) {
      setContactFormError('Email address is required.')
      return
    }

    setContactFormError(null)
    patchContactMutation.mutate(
      {
        contactId: editContactTarget.id,
        payload: {
          email: contactEmail.trim(),
          first_name: contactFirstName.trim(),
          last_name: contactLastName.trim(),
          status: editContactTarget.status || 'subscribed',
          lists: contactSelectedLists,
          attributes: editContactTarget.attributes || '',
        },
      },
      {
        onSuccess: (res) => {
          setEditContactTarget(null)
          onAction(`Contact “${res.data?.email || contactEmail}” updated successfully.`)
        },
        onError: (err) => {
          setContactFormError(formatApiErrorMessage(err))
        },
      }
    )
  }

  const handleDeleteContact = async () => {
    if (!deleteContactTarget) return
    deleteContactMutation.mutate(deleteContactTarget.id, {
      onSuccess: () => {
        setDeleteContactTarget(null)
        onAction(`Contact “${deleteContactTarget.email}” deleted.`)
      },
      onError: (err) => {
        onAction(formatApiErrorMessage(err))
      },
    })
  }

  const toggleListCheckbox = (listId: string) => {
    setContactSelectedLists((prev) =>
      prev.includes(listId) ? prev.filter((id) => id !== listId) : [...prev, listId]
    )
  }

  return (
    <>
      {/* Page Heading Row */}
      <div className="page-heading-row">
        <div>
          <div className="page-eyebrow">
            METROMAIL WORKSPACE <span>/</span> CONTACTS & CRM
          </div>
          <h1>Contacts & CRM</h1>
          <p>
            {activeTab === 'contacts'
              ? selectedListId && activeSelectedList
                ? `Showing contacts enrolled in “${safeRenderText(activeSelectedList.name, 'List')}”.`
                : 'Manage the people behind every conversation.'
              : 'Organize your audience into useful collections and targeted lists.'}
          </p>
        </div>
        <div className="page-heading-actions">
          <button
            type="button"
            className="button button-secondary"
            onClick={() => {
              if (activeTab === 'contacts') refetchContacts()
              else refetchLists()
            }}
            disabled={
              activeTab === 'contacts'
                ? contactsLoading || contactsRefetching
                : listsLoading || listsRefetching
            }
            title="Refresh table data"
          >
            <RefreshCw
              size={14}
              className={
                (activeTab === 'contacts' ? contactsRefetching : listsRefetching)
                  ? 'animate-spin'
                  : ''
              }
            />
            <span>Refresh</span>
          </button>
          {activeTab === 'contacts' ? (
            <button
              type="button"
              className="button button-primary"
              onClick={handleOpenCreateContact}
            >
              <Plus size={15} />
              <span>Add contact</span>
            </button>
          ) : (
            <button
              type="button"
              className="button button-primary"
              onClick={handleOpenCreateList}
            >
              <Plus size={15} />
              <span>Create list</span>
            </button>
          )}
        </div>
      </div>

      {/* Persistent Section Navigation Tabs: NEVER HIDDEN ACROSS BOTH TABS */}
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
          className={activeTab === 'lists' ? 'active' : ''}
          onClick={() => handleTabChange('lists')}
        >
          List
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: ALL CONTACTS VIEW                                */}
      {/* ======================================================== */}
      {activeTab === 'contacts' && (
        <>
          {/* Active List Filter Pill Banner */}
          {selectedListId && activeSelectedList && (
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
                <Users size={16} style={{ color: '#2563eb' }} />
                <span>
                  Showing contacts in list: <b>{safeRenderText(activeSelectedList.name, 'List')}</b> (
                  {filteredContacts.length} {filteredContacts.length === 1 ? 'contact' : 'contacts'}
                  )
                </span>
              </div>
              <button
                type="button"
                onClick={handleClearListFilter}
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
                <span>Clear list filter</span>
                <X size={14} />
              </button>
            </div>
          )}

          <section className="data-panel">
            <div className="data-panel-top">
              <div>
                <h2>
                  {selectedListId && activeSelectedList
                    ? `${safeRenderText(activeSelectedList.name, 'List')} Contacts`
                    : 'All contacts'}
                </h2>
                <p>
                  {filteredContacts.length.toLocaleString()}{' '}
                  {filteredContacts.length === 1 ? 'contact' : 'contacts'} found
                </p>
              </div>
            </div>

            {/* Contacts Table Filters */}
            <div className="table-filter-bar">
              <label className="table-search-control">
                <Search size={15} aria-hidden="true" />
                <input
                  aria-label="Search contacts"
                  placeholder="Search by name or email…"
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                />
                {contactSearch && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => setContactSearch('')}
                  >
                    ×
                  </button>
                )}
              </label>

              <div className="table-filter-controls">
                {/* Status Filter */}
                <label className="table-filter-control">
                  <span>Status</span>
                  <select
                    aria-label="Filter by status"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                  >
                    <option value="All statuses">All statuses</option>
                    <option value="subscribed">Subscribed</option>
                    <option value="unsubscribed">Unsubscribed</option>
                    <option value="pending">Pending</option>
                    <option value="cleaned">Cleaned</option>
                  </select>
                </label>

                {/* List Filter Dropdown */}
                <label className="table-filter-control">
                  <span>List</span>
                  <select
                    aria-label="Filter by contact list"
                    value={selectedListId || 'all'}
                    onChange={(e) => {
                      const val = e.target.value
                      if (val === 'all') handleClearListFilter()
                      else setSelectedListId(val)
                    }}
                  >
                    <option value="all">All lists</option>
                    {allLists.map((l, lIdx) => (
                      <option key={l.id || lIdx} value={l.id}>
                        {safeRenderText(l.name, 'List')} ({typeof l.contact_count === 'number' ? l.contact_count : 0})
                      </option>
                    ))}
                  </select>
                </label>

                {/* Reset Filters */}
                <button
                  type="button"
                  className="table-reset-button"
                  disabled={
                    !contactSearch && selectedStatus === 'All statuses' && !selectedListId
                  }
                  onClick={() => {
                    setContactSearch('')
                    setSelectedStatus('All statuses')
                    setSelectedListId(null)
                  }}
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Desktop Table View */}
            <div className="desktop-table-wrap" style={{ minHeight: '300px', paddingBottom: '30px' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Contact</th>
                    <th>Status</th>
                    <th>Assigned Lists</th>
                    <th>Created At</th>
                    <th style={{ textAlign: 'right', width: '60px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {contactsLoading ? (
                    <tr>
                      <td colSpan={5} className="table-empty-state" style={{ height: '140px' }}>
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
                  ) : paginatedContacts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="table-empty-state">
                        {contactSearch || selectedStatus !== 'All statuses' || selectedListId
                          ? 'No matching contacts found. Try adjusting your search or filters.'
                          : 'No contacts added yet. Click "+ Add contact" to get started.'}
                      </td>
                    </tr>
                  ) : (
                    paginatedContacts.map((contact, contactIdx) => {
                      const fName = typeof contact.first_name === 'string' ? contact.first_name : ''
                      const lName = typeof contact.last_name === 'string' ? contact.last_name : ''
                      const fullName = `${fName} ${lName}`.trim() || 'Unnamed Contact'
                      const emailText = typeof contact.email === 'string' ? contact.email : ''
                      const initials = (
                        (fName[0] || '') + (lName[0] || '')
                      ).toUpperCase() || (emailText[0] || 'C').toUpperCase()

                      const isExpanded = expandedContactId === contact.id
                      const isLastRow = paginatedContacts.length > 2 && contactIdx >= paginatedContacts.length - 1

                      return (
                        <tr
                          key={contact.id || contactIdx}
                          className={isExpanded ? 'row-action-active' : ''}
                          style={{
                            position: 'relative',
                            zIndex: isExpanded ? 100 : 1,
                            backgroundColor: isExpanded ? '#f8fafc' : undefined,
                          }}
                        >
                          <td>
                            <div className="table-name-cell">
                              <span className="table-row-avatar avatar-contact">
                                {initials}
                              </span>
                              <span>
                                <b>{fullName}</b>
                                <small>{emailText}</small>
                              </span>
                            </div>
                          </td>
                          <td>
                            <StatusBadge status={contact.status || 'subscribed'} />
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                              {Array.isArray(contact.lists) && contact.lists.length > 0 ? (
                                contact.lists.map((lItem, idx) => {
                                  let listId = ''
                                  let displayName = 'List'
                                  if (typeof lItem === 'string') {
                                    listId = lItem
                                    displayName = listNameMap.get(lItem) || 'List'
                                  } else if (lItem && typeof lItem === 'object') {
                                    const obj = lItem as any
                                    listId = typeof obj.id === 'string' ? obj.id : String(idx)
                                    displayName =
                                      (typeof obj.name === 'string' && obj.name) ||
                                      (listId ? listNameMap.get(listId) : null) ||
                                      'List'
                                  }
                                  return (
                                    <span
                                      key={listId || idx}
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        padding: '2px 8px',
                                        borderRadius: '6px',
                                        fontSize: '12px',
                                        fontWeight: 500,
                                        backgroundColor: '#eff6ff',
                                        color: '#1d4ed8',
                                        border: '1px solid #dbeafe',
                                      }}
                                    >
                                      {displayName}
                                    </span>
                                  )
                                })
                              ) : (
                                <span style={{ color: '#94a3b8', fontSize: '12.5px' }}>
                                  No list
                                </span>
                              )}
                            </div>
                          </td>
                          <td style={{ color: '#64748b', fontSize: '13px' }}>
                            {formatDate(contact.created_at)}
                          </td>
                          <td
                            className="row-action-cell"
                            style={{
                              textAlign: 'right',
                              position: 'relative',
                              zIndex: isExpanded ? 110 : 1,
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              className={`row-action-trigger ${isExpanded ? 'active' : ''}`}
                              aria-label={`Open ${emailText || 'contact'} actions`}
                              aria-expanded={isExpanded}
                              onClick={(e) => {
                                e.stopPropagation()
                                setExpandedContactId(isExpanded ? null : contact.id)
                              }}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '30px',
                                height: '30px',
                                padding: 0,
                                border: '1px solid transparent',
                                borderRadius: '7px',
                                color: isExpanded ? '#0f172a' : '#64748b',
                                backgroundColor: isExpanded ? '#e2e8f0' : 'transparent',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              <MoreHorizontal size={17} />
                            </button>
                            {isExpanded && (
                              <div
                                className={`row-action-menu ${isLastRow ? 'open-up' : ''}`}
                                data-placement={isLastRow ? 'top' : 'bottom'}
                                role="menu"
                                aria-orientation="vertical"
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                  position: 'absolute',
                                  zIndex: 9999,
                                  top: isLastRow ? 'auto' : 'calc(100% - 2px)',
                                  bottom: isLastRow ? 'calc(100% - 2px)' : 'auto',
                                  right: '6px',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  minWidth: '175px',
                                  width: 'max-content',
                                  padding: '6px',
                                  border: '1px solid #e2e8f0',
                                  borderRadius: '9px',
                                  backgroundColor: '#ffffff',
                                  boxShadow:
                                    '0 12px 30px -4px rgba(15, 23, 42, 0.22), 0 6px 14px -3px rgba(15, 23, 42, 0.12)',
                                  transformOrigin: isLastRow ? 'bottom right' : 'top right',
                                }}
                              >
                                <RowActionMenuItem
                                  icon={Eye}
                                  label="View details"
                                  onClick={() => {
                                    setViewContactDetails(contact)
                                    setExpandedContactId(null)
                                  }}
                                />
                                <RowActionMenuItem
                                  icon={Pencil}
                                  label="Edit contact"
                                  onClick={() => {
                                    handleOpenEditContact(contact)
                                    setExpandedContactId(null)
                                  }}
                                />
                                <div
                                  className="row-action-divider"
                                  role="separator"
                                  style={{
                                    height: '1px',
                                    margin: '4px 2px',
                                    backgroundColor: '#e2e8f0',
                                    border: 'none',
                                  }}
                                />
                                <RowActionMenuItem
                                  icon={Trash2}
                                  label="Delete"
                                  isDanger
                                  onClick={() => {
                                    setDeleteContactTarget(contact)
                                    setExpandedContactId(null)
                                  }}
                                />
                              </div>
                            )}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="mobile-data-cards">
              {paginatedContacts.map((contact, contactIdx) => {
                const fName = typeof contact.first_name === 'string' ? contact.first_name : ''
                const lName = typeof contact.last_name === 'string' ? contact.last_name : ''
                const fullName = `${fName} ${lName}`.trim() || (typeof contact.email === 'string' ? contact.email : 'Contact')
                const emailText = typeof contact.email === 'string' ? contact.email : ''

                return (
                  <article className="mobile-data-card" key={contact.id || contactIdx}>
                    <div className="mobile-card-top">
                      <div>
                        <b>{fullName}</b>
                        <small>{emailText}</small>
                      </div>
                      <StatusBadge status={contact.status || 'subscribed'} />
                    </div>
                    <div className="mobile-card-meta">
                      <span>{formatDate(contact.created_at)}</span>
                      <span>
                        {Array.isArray(contact.lists) ? contact.lists.length : 0} lists
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                      <button
                        type="button"
                        className="mobile-card-action"
                        onClick={() => handleOpenEditContact(contact)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="mobile-card-action"
                        style={{ color: '#dc2626' }}
                        onClick={() => setDeleteContactTarget(contact)}
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>

            {/* Pagination */}
            <TablePagination
              pageIndex={contactsPagination.pageIndex}
              pageSize={contactsPagination.pageSize}
              totalItems={filteredContacts.length}
              pageSizeOptions={[6, 12, 24]}
              onPageChange={(pageIndex) =>
                setContactsPagination((prev) => ({ ...prev, pageIndex }))
              }
              onPageSizeChange={(pageSize) =>
                setContactsPagination({ pageIndex: 0, pageSize })
              }
            />
          </section>
        </>
      )}

      {/* ======================================================== */}
      {/* TAB 2: LIST VIEW                                        */}
      {/* ======================================================== */}
      {activeTab === 'lists' && (
        <section className="data-panel">
          <div className="data-panel-top">
            <div>
              <h2>Contact lists</h2>
              <p>
                {filteredLists.length.toLocaleString()}{' '}
                {filteredLists.length === 1 ? 'list' : 'lists'} available
              </p>
            </div>
          </div>

          {/* List Search Bar */}
          <div className="table-filter-bar">
            <label className="table-search-control">
              <Search size={15} aria-hidden="true" />
              <input
                aria-label="Search lists"
                placeholder="Search contact lists by name or description…"
                value={listSearch}
                onChange={(e) => setListSearch(e.target.value)}
              />
              {listSearch && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setListSearch('')}
                >
                  ×
                </button>
              )}
            </label>
          </div>

          {/* Desktop Table View */}
          <div className="desktop-table-wrap" style={{ minHeight: '300px', paddingBottom: '30px' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>List Name & Description</th>
                  <th>Contacts Count</th>
                  <th>Created At</th>
                  <th style={{ textAlign: 'right', width: '130px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {listsLoading ? (
                  <tr>
                    <td colSpan={4} className="table-empty-state" style={{ height: '140px' }}>
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        <Loader2 size={24} className="animate-spin" style={{ color: '#146ef5' }} />
                        <span>Loading contact lists…</span>
                      </div>
                    </td>
                  </tr>
                ) : paginatedLists.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="table-empty-state">
                      {listSearch
                        ? 'No matching lists found. Try another search.'
                        : 'No contact lists created yet. Click "+ Create list" to add one.'}
                    </td>
                  </tr>
                ) : (
                  paginatedLists.map((list, listIdx) => {
                    const listNameText = safeRenderText(list.name, 'Untitled list')
                    const listDescText = safeRenderText(list.description, 'No description provided')
                    const countNum = typeof list.contact_count === 'number' ? list.contact_count : 0
                    const isExpanded = expandedListId === list.id
                    const isLastRow = paginatedLists.length > 2 && listIdx >= paginatedLists.length - 1

                    return (
                      <tr
                        key={list.id || listIdx}
                        className={isExpanded ? 'row-action-active' : ''}
                        style={{
                          cursor: 'pointer',
                          position: 'relative',
                          zIndex: isExpanded ? 100 : 1,
                          backgroundColor: isExpanded ? '#f8fafc' : undefined,
                        }}
                        onClick={(e) => {
                          const target = e.target as HTMLElement
                          if (target.closest('button') || target.closest('a') || target.closest('.row-action-menu') || target.closest('.row-action-cell')) return
                          handleSelectSpecificList(list)
                        }}
                      >
                        <td>
                          <div className="table-name-cell">
                            <span className="table-row-avatar avatar-contact">
                              <Users size={15} />
                            </span>
                            <span>
                              <b
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                }}
                              >
                                {listNameText}
                                <span
                                  style={{
                                    fontSize: '11px',
                                    color: '#2563eb',
                                    fontWeight: 500,
                                  }}
                                >
                                  (Click to filter)
                                </span>
                              </b>
                              <small>{listDescText}</small>
                            </span>
                          </div>
                        </td>
                        <td>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '3px 10px',
                              borderRadius: '9999px',
                              backgroundColor: '#f1f5f9',
                              color: '#334155',
                              fontSize: '13px',
                              fontWeight: 600,
                            }}
                          >
                            <Users size={13} style={{ color: '#64748b' }} />
                            {countNum}{' '}
                            {countNum === 1 ? 'contact' : 'contacts'}
                          </span>
                        </td>
                        <td style={{ color: '#64748b', fontSize: '13px' }}>
                          {formatDate(list.created_at)}
                        </td>
                        <td
                          className="row-action-cell"
                          style={{
                            textAlign: 'right',
                            position: 'relative',
                            zIndex: isExpanded ? 110 : 1,
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            className={`row-action-trigger ${isExpanded ? 'active' : ''}`}
                            aria-label={`Open actions for ${listNameText}`}
                            aria-expanded={isExpanded}
                            onClick={(e) => {
                              e.stopPropagation()
                              setExpandedListId(isExpanded ? null : list.id)
                            }}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '30px',
                              height: '30px',
                              padding: 0,
                              border: '1px solid transparent',
                              borderRadius: '7px',
                              color: isExpanded ? '#0f172a' : '#64748b',
                              backgroundColor: isExpanded ? '#e2e8f0' : 'transparent',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <MoreHorizontal size={17} />
                          </button>
                          {isExpanded && (
                            <div
                              className={`row-action-menu ${isLastRow ? 'open-up' : ''}`}
                              data-placement={isLastRow ? 'top' : 'bottom'}
                              role="menu"
                              aria-orientation="vertical"
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                position: 'absolute',
                                zIndex: 9999,
                                top: isLastRow ? 'auto' : 'calc(100% - 2px)',
                                bottom: isLastRow ? 'calc(100% - 2px)' : 'auto',
                                right: '6px',
                                display: 'flex',
                                flexDirection: 'column',
                                minWidth: '175px',
                                width: 'max-content',
                                padding: '6px',
                                border: '1px solid #e2e8f0',
                                borderRadius: '9px',
                                backgroundColor: '#ffffff',
                                boxShadow:
                                  '0 12px 30px -4px rgba(15, 23, 42, 0.22), 0 6px 14px -3px rgba(15, 23, 42, 0.12)',
                                transformOrigin: isLastRow ? 'bottom right' : 'top right',
                              }}
                            >
                              <RowActionMenuItem
                                icon={Users}
                                label="View contacts"
                                onClick={() => {
                                  handleSelectSpecificList(list)
                                  setExpandedListId(null)
                                }}
                              />
                              <RowActionMenuItem
                                icon={Pencil}
                                label="Edit list"
                                onClick={() => {
                                  handleOpenEditList(list)
                                  setExpandedListId(null)
                                }}
                              />
                              <div
                                className="row-action-divider"
                                role="separator"
                                style={{
                                  height: '1px',
                                  margin: '4px 2px',
                                  backgroundColor: '#e2e8f0',
                                  border: 'none',
                                }}
                              />
                              <RowActionMenuItem
                                icon={Trash2}
                                label="Delete"
                                isDanger
                                onClick={() => {
                                  setDeleteListTarget(list)
                                  setExpandedListId(null)
                                }}
                              />
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View for Lists */}
          <div className="mobile-data-cards">
            {paginatedLists.map((list, listIdx) => {
              const listNameText = safeRenderText(list.name, 'Untitled list')
              const listDescText = safeRenderText(list.description, 'No description provided')
              const countNum = typeof list.contact_count === 'number' ? list.contact_count : 0

              return (
                <article className="mobile-data-card" key={list.id || listIdx}>
                  <div className="mobile-card-top">
                    <div>
                      <b>{listNameText}</b>
                      <small>{listDescText}</small>
                    </div>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '3px 9px',
                        borderRadius: '999px',
                        backgroundColor: '#f1f5f9',
                        color: '#334155',
                        fontSize: '12px',
                        fontWeight: 600,
                      }}
                    >
                      <Users size={12} style={{ color: '#64748b' }} />
                      {countNum} {countNum === 1 ? 'contact' : 'contacts'}
                    </span>
                  </div>
                  <div className="mobile-card-meta">
                    <span>{formatDate(list.created_at)}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="mobile-card-action"
                      style={{ color: '#2563eb' }}
                      onClick={() => handleSelectSpecificList(list)}
                    >
                      View contacts
                    </button>
                    <button
                      type="button"
                      className="mobile-card-action"
                      onClick={() => handleOpenEditList(list)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="mobile-card-action"
                      style={{ color: '#dc2626' }}
                      onClick={() => setDeleteListTarget(list)}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              )
            })}
          </div>

          {/* Pagination */}
          <TablePagination
            pageIndex={listsPagination.pageIndex}
            pageSize={listsPagination.pageSize}
            totalItems={filteredLists.length}
            pageSizeOptions={[6, 12, 24]}
            onPageChange={(pageIndex) =>
              setListsPagination((prev) => ({ ...prev, pageIndex }))
            }
            onPageSizeChange={(pageSize) =>
              setListsPagination({ pageIndex: 0, pageSize })
            }
          />
        </section>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: CREATE CONTACT LIST                             */}
      {/* ======================================================== */}
      {createListOpen && (
        <div
          className="dialog-backdrop"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget && !createListMutation.isPending) {
              setCreateListOpen(false)
            }
          }}
        >
          <section
            className="action-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-list-modal-title"
            style={{ width: 'min(480px, 100%)', position: 'relative' }}
          >
            {/* Close Button comfortably at top-right */}
            <button
              type="button"
              className="dialog-close"
              aria-label="Close dialog"
              disabled={createListMutation.isPending}
              onClick={() => setCreateListOpen(false)}
              style={{ top: '12px', right: '14px', zIndex: 10 }}
            >
              <X size={18} />
            </button>

            <div className="dialog-icon">
              <FolderPlus size={19} />
            </div>
            <div className="eyebrow">CONTACT LISTS</div>
            <h2 id="create-list-modal-title">Create contact list</h2>
            <p>Organize your audience into targeted segments and lists.</p>

            {listFormError && (
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
                <span>{safeRenderText(listFormError)}</span>
              </div>
            )}

            <form onSubmit={handleSubmitCreateList} className="dialog-form">
              <label>
                <span>
                  List name <strong style={{ color: '#ef4444' }}>*</strong>
                </span>
                <input
                  type="text"
                  placeholder="e.g. Newsletter Subscribers"
                  value={listName}
                  onChange={(e) => setListName(e.target.value)}
                  disabled={createListMutation.isPending}
                  autoFocus
                  required
                />
              </label>

              <label>
                Description
                <textarea
                  rows={3}
                  placeholder="Optional brief description of this list..."
                  value={listDescription}
                  onChange={(e) => setListDescription(e.target.value)}
                  disabled={createListMutation.isPending}
                />
              </label>

              <button
                type="submit"
                className="button button-primary dialog-submit"
                disabled={createListMutation.isPending}
                style={{ marginTop: '10px' }}
              >
                {createListMutation.isPending ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Creating list…</span>
                  </>
                ) : (
                  <span>Create list</span>
                )}
              </button>
            </form>
          </section>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: EDIT CONTACT LIST                               */}
      {/* ======================================================== */}
      {editListTarget && (
        <div
          className="dialog-backdrop"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget && !patchListMutation.isPending) {
              setEditListTarget(null)
            }
          }}
        >
          <section
            className="action-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-list-modal-title"
            style={{ width: 'min(480px, 100%)', position: 'relative' }}
          >
            <button
              type="button"
              className="dialog-close"
              aria-label="Close dialog"
              disabled={patchListMutation.isPending}
              onClick={() => setEditListTarget(null)}
              style={{ top: '12px', right: '14px', zIndex: 10 }}
            >
              <X size={18} />
            </button>

            <div className="dialog-icon">
              <Pencil size={19} />
            </div>
            <div className="eyebrow">UPDATE LIST</div>
            <h2 id="edit-list-modal-title">Edit contact list</h2>
            <p>Update the name and description of this contact list.</p>

            {listFormError && (
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
                <span>{safeRenderText(listFormError)}</span>
              </div>
            )}

            <form onSubmit={handleSubmitEditList} className="dialog-form">
              <label>
                <span>
                  List name <strong style={{ color: '#ef4444' }}>*</strong>
                </span>
                <input
                  type="text"
                  placeholder="e.g. VIP Customers"
                  value={listName}
                  onChange={(e) => setListName(e.target.value)}
                  disabled={patchListMutation.isPending}
                  required
                />
              </label>

              <label>
                Description
                <textarea
                  rows={3}
                  placeholder="Optional brief description of this list..."
                  value={listDescription}
                  onChange={(e) => setListDescription(e.target.value)}
                  disabled={patchListMutation.isPending}
                />
              </label>

              <button
                type="submit"
                className="button button-primary dialog-submit"
                disabled={patchListMutation.isPending}
                style={{ marginTop: '10px' }}
              >
                {patchListMutation.isPending ? (
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
      {/* MODAL 3: DELETE CONTACT LIST CONFIRMATION                 */}
      {/* ======================================================== */}
      {deleteListTarget && (
        <div
          className="dialog-backdrop"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget && !deleteListMutation.isPending) {
              setDeleteListTarget(null)
            }
          }}
        >
          <section
            className="action-dialog action-dialog-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-list-title"
            style={{ width: 'min(420px, 100%)', position: 'relative' }}
          >
            <button
              type="button"
              className="dialog-close"
              aria-label="Close dialog"
              disabled={deleteListMutation.isPending}
              onClick={() => setDeleteListTarget(null)}
              style={{ top: '12px', right: '14px', zIndex: 10 }}
            >
              <X size={18} />
            </button>

            <div
              className="dialog-icon"
              style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}
            >
              <Trash2 size={19} />
            </div>
            <div className="eyebrow" style={{ color: '#dc2626' }}>
              DANGER ZONE
            </div>
            <h2 id="delete-list-title">Delete contact list</h2>
            <p>
              Are you sure you want to delete <b>{safeRenderText(deleteListTarget.name, 'this list')}</b>?
              Contacts in this list will not be deleted, but they will be unassigned from this list.
            </p>

            <div style={{ display: 'flex', gap: '9px', marginTop: '18px' }}>
              <button
                type="button"
                className="button button-secondary"
                style={{ flex: 1 }}
                disabled={deleteListMutation.isPending}
                onClick={() => setDeleteListTarget(null)}
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
                disabled={deleteListMutation.isPending}
                onClick={handleDeleteList}
              >
                {deleteListMutation.isPending ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Deleting…</span>
                  </>
                ) : (
                  <span>Delete list</span>
                )}
              </button>
            </div>
          </section>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: CREATE CONTACT                                  */}
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
            style={{ width: 'min(500px, 100%)', position: 'relative' }}
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
            <div className="eyebrow">CONTACTS</div>
            <h2 id="create-contact-title">Add a contact</h2>
            <p>Add a subscriber to your workspace and optionally assign them to lists.</p>

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
                  placeholder="subscriber@example.com"
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
                    placeholder="Jordan"
                    value={contactFirstName}
                    onChange={(e) => setContactFirstName(e.target.value)}
                    disabled={createContactMutation.isPending}
                  />
                </label>
                <label>
                  Last name
                  <input
                    type="text"
                    placeholder="Rivera"
                    value={contactLastName}
                    onChange={(e) => setContactLastName(e.target.value)}
                    disabled={createContactMutation.isPending}
                  />
                </label>
              </div>

              {/* Assign to lists (Modern Production Multi-Select) */}
              <AssignToListMultiSelect
                lists={allLists}
                selectedListIds={contactSelectedLists}
                onChange={setContactSelectedLists}
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
      {/* MODAL 5: EDIT CONTACT                                    */}
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
            style={{ width: 'min(500px, 100%)', position: 'relative' }}
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
            <p>Modify contact properties and list memberships.</p>

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
              <label>
                <span>
                  Email address <strong style={{ color: '#ef4444' }}>*</strong>
                </span>
                <input
                  type="email"
                  placeholder="subscriber@example.com"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  disabled={patchContactMutation.isPending}
                  required
                />
              </label>

              <div className="modal-two-col-grid">
                <label>
                  First name
                  <input
                    type="text"
                    placeholder="Jordan"
                    value={contactFirstName}
                    onChange={(e) => setContactFirstName(e.target.value)}
                    disabled={patchContactMutation.isPending}
                  />
                </label>
                <label>
                  Last name
                  <input
                    type="text"
                    placeholder="Rivera"
                    value={contactLastName}
                    onChange={(e) => setContactLastName(e.target.value)}
                    disabled={patchContactMutation.isPending}
                  />
                </label>
              </div>

              {/* Assign to lists (Modern Production Multi-Select) */}
              <AssignToListMultiSelect
                lists={allLists}
                selectedListIds={contactSelectedLists}
                onChange={setContactSelectedLists}
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
      {/* MODAL 6: CONTACT DETAILS INSPECTOR                       */}
      {/* ======================================================== */}
      {viewContactDetails && (
        <div
          className="dialog-backdrop"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) setViewContactDetails(null)
          }}
        >
          <section
            className="action-dialog action-dialog-lg"
            role="dialog"
            aria-modal="true"
            aria-labelledby="contact-details-title"
            style={{ width: 'min(530px, 100%)', position: 'relative' }}
          >
            <button
              type="button"
              className="dialog-close"
              aria-label="Close dialog"
              onClick={() => setViewContactDetails(null)}
              style={{ top: '12px', right: '14px', zIndex: 10 }}
            >
              <X size={18} />
            </button>

            <div className="dialog-icon">
              <UserCheck size={19} />
            </div>
            <div className="eyebrow">CONTACT DETAILS</div>
            <h2 id="contact-details-title">
              {`${typeof viewContactDetails.first_name === 'string' ? viewContactDetails.first_name : ''} ${typeof viewContactDetails.last_name === 'string' ? viewContactDetails.last_name : ''}`.trim() ||
                safeRenderText(viewContactDetails.email, 'Contact details')}
            </h2>
            <p>{safeRenderText(viewContactDetails.email)}</p>

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
                  {safeRenderText(viewContactDetails.id)}
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
                <span style={{ color: '#64748b' }}>Subscription Status</span>
                <StatusBadge status={viewContactDetails.status || 'subscribed'} />
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
                <span style={{ color: '#64748b' }}>Assigned Lists</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                  {Array.isArray(viewContactDetails.lists) && viewContactDetails.lists.length > 0 ? (
                    viewContactDetails.lists.map((lItem, idx) => {
                      let listId = ''
                      let displayName = 'List'
                      if (typeof lItem === 'string') {
                        listId = lItem
                        displayName = listNameMap.get(lItem) || lItem
                      } else if (lItem && typeof lItem === 'object') {
                        const obj = lItem as any
                        listId = typeof obj.id === 'string' ? obj.id : String(idx)
                        displayName =
                          (typeof obj.name === 'string' && obj.name) ||
                          (listId ? listNameMap.get(listId) : null) ||
                          'List'
                      }
                      return (
                        <span
                          key={listId || idx}
                          style={{
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            backgroundColor: '#eff6ff',
                            color: '#1d4ed8',
                            border: '1px solid #dbeafe',
                          }}
                        >
                          {displayName}
                        </span>
                      )
                    })
                  ) : (
                    <span style={{ color: '#94a3b8' }}>None</span>
                  )}
                </div>
              </div>

              {Boolean(
                viewContactDetails.attributes &&
                  (typeof viewContactDetails.attributes === 'string'
                    ? viewContactDetails.attributes.trim()
                    : Object.keys(viewContactDetails.attributes).length > 0)
              ) && (
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
                  <pre
                    style={{
                      margin: 0,
                      padding: '6px',
                      backgroundColor: '#f1f5f9',
                      borderRadius: '4px',
                      fontSize: '12px',
                      overflowX: 'auto',
                    }}
                  >
                    {typeof viewContactDetails.attributes === 'string'
                      ? viewContactDetails.attributes
                      : JSON.stringify(viewContactDetails.attributes, null, 2)}
                  </pre>
                </div>
              )}

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '7px',
                }}
              >
                <span style={{ color: '#64748b' }}>Created Date</span>
                <span>{formatDate(viewContactDetails.created_at)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '9px', marginTop: '18px' }}>
              <button
                type="button"
                className="button button-secondary"
                style={{ flex: 1 }}
                onClick={() => setViewContactDetails(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="button button-primary"
                style={{ flex: 1 }}
                onClick={() => {
                  const target = viewContactDetails
                  setViewContactDetails(null)
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
      {/* MODAL 7: DELETE CONTACT CONFIRMATION                     */}
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

            <div
              className="dialog-icon"
              style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}
            >
              <Trash2 size={19} />
            </div>
            <div className="eyebrow" style={{ color: '#dc2626' }}>
              DANGER ZONE
            </div>
            <h2 id="delete-contact-title">Delete contact</h2>
            <p>
              Are you sure you want to delete <b>{safeRenderText(deleteContactTarget.email, 'this contact')}</b>? This action cannot
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
