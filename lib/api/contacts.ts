import { apiClient } from '@/lib/api-client'

export type ContactStatus = 'subscribed' | 'unsubscribed' | string

export interface ContactItem {
  id: string
  email: string
  first_name: string
  last_name: string
  attributes?: Record<string, unknown>
  tags: string[]
  status: ContactStatus
  created_at: string
  updated_at: string
}

export interface PaginatedContactsData {
  items: ContactItem[]
  page: number
  page_size: number
  total: number
  total_pages: number
}

export interface GetContactsParams {
  page?: number
  page_size?: number
  search?: string
  status?: string
  tags?: string
}

export interface GetContactsResponse {
  success: boolean
  message: string | null
  data: PaginatedContactsData
  errors?: unknown
}

export interface GetContactResponse {
  success: boolean
  message: string | null
  data: ContactItem
  errors?: unknown
}

export interface CreateContactPayload {
  email: string
  first_name?: string
  last_name?: string
  attributes?: Record<string, unknown>
  tags?: string[]
}

export interface CreateContactResponse {
  success: boolean
  message: string | null
  data: ContactItem
  errors?: unknown
}

export interface PatchContactPayload {
  email?: string
  first_name?: string
  last_name?: string
  attributes?: Record<string, unknown>
  tags?: string[]
  status?: ContactStatus
}

export interface PatchContactResponse {
  success: boolean
  message: string | null
  data: ContactItem
  errors?: unknown
}

export interface DeleteContactResponse {
  success: boolean
  message: string | null
  data: null
  errors?: unknown
}

export interface ImportContactsResult {
  created: number
  existing: number
  invalid: number
}

export interface ImportContactsResponse {
  success: boolean
  message: string | null
  data: ImportContactsResult | null
  errors?: unknown
}

export interface ListTagsResponse {
  success: boolean
  message: string | null
  data: string[]
  errors?: unknown
}

export const contactsApi = {
  /**
   * Fetch paginated contacts with optional search, status, and tags filter
   * GET /api/contacts/list-contacts
   */
  getContacts(params?: GetContactsParams): Promise<GetContactsResponse> {
    const cleanParams: Record<string, string | number | boolean | undefined> = {}
    if (params?.page) cleanParams.page = params.page
    if (params?.page_size) cleanParams.page_size = params.page_size
    if (params?.search && params.search.trim()) cleanParams.search = params.search.trim()
    if (params?.status && params.status !== 'all' && params.status !== 'All statuses') {
      cleanParams.status = params.status
    }
    if (params?.tags && params.tags.trim() && params.tags !== 'all') {
      cleanParams.tags = params.tags.trim()
    }

    return apiClient<GetContactsResponse>('/contacts/list-contacts', {
      method: 'GET',
      params: cleanParams,
    })
  },

  /**
   * Fetch a single contact by ID
   * GET /api/contacts/get-contact/{contact_id}
   */
  getContact(contactId: string): Promise<GetContactResponse> {
    return apiClient<GetContactResponse>(`/contacts/get-contact/${contactId}`, {
      method: 'GET',
    })
  },

  /**
   * Add a new contact
   * POST /api/contacts/add-contact
   */
  createContact(payload: CreateContactPayload): Promise<CreateContactResponse> {
    return apiClient<CreateContactResponse>('/contacts/add-contact', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  /**
   * Update an existing contact
   * PATCH /api/contacts/update-contact/{contact_id}
   */
  patchContact(contactId: string, payload: PatchContactPayload): Promise<PatchContactResponse> {
    return apiClient<PatchContactResponse>(`/contacts/update-contact/${contactId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  },

  /**
   * Delete a contact by ID
   * DELETE /api/contacts/delete-contact/{contact_id}
   */
  deleteContact(contactId: string): Promise<DeleteContactResponse> {
    return apiClient<DeleteContactResponse>(`/contacts/delete-contact/${contactId}`, {
      method: 'DELETE',
    })
  },

  /**
   * Bulk import contacts from a UTF-8 CSV file with optional tags
   * POST /api/contacts/import-contacts
   */
  importContacts(file: File, tags?: string[]): Promise<ImportContactsResponse> {
    const formData = new FormData()
    formData.append('file', file)
    if (Array.isArray(tags)) {
      tags.forEach((tag) => {
        const cleaned = tag.trim()
        if (cleaned) formData.append('tags', cleaned)
      })
    }

    return apiClient<ImportContactsResponse>('/contacts/import-contacts', {
      method: 'POST',
      body: formData,
    })
  },

  /**
   * List all unique contact tags
   * GET /api/contacts/list-tags
   */
  listTags(): Promise<ListTagsResponse> {
    return apiClient<ListTagsResponse>('/contacts/list-tags', {
      method: 'GET',
    })
  },
}
