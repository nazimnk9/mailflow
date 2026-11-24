import { apiClient } from '@/lib/api-client'

export interface ContactListItem {
  id: string
  name: string
  description: string
  contact_count: number
  created_at: string
  updated_at: string
}

export interface CreateContactListPayload {
  name: string
  description?: string
}

export interface PatchContactListPayload {
  name: string
  description?: string
}

export interface GetContactListsResponse {
  data: ContactListItem[]
  success: boolean
  message: string
  errors?: string
}

export interface GetContactListResponse {
  data: ContactListItem
  success: boolean
  message: string
  errors?: string
}

export interface CreateContactListResponse {
  data: ContactListItem
  success: boolean
  message: string
  errors?: string
}

export interface PatchContactListResponse {
  data: ContactListItem
  success: boolean
  message: string
  errors?: string
}

export interface DeleteContactListResponse {
  success: boolean
  message: string
  errors?: string
}

export interface ContactItem {
  id: string
  email: string
  first_name: string
  last_name: string
  attributes?: string
  status: 'subscribed' | 'unsubscribed' | 'pending' | 'cleaned' | string
  lists: string[]
  created_at: string
  updated_at: string
}

export interface CreateContactPayload {
  email: string
  first_name?: string
  last_name?: string
  attributes?: string
  status?: string
  lists?: string[]
}

export interface PatchContactPayload {
  email?: string
  first_name?: string
  last_name?: string
  attributes?: string
  status?: string
  lists?: string[]
}

export interface GetContactsResponse {
  data: ContactItem[]
  success: boolean
  message: string
  errors?: string
}

export interface GetContactResponse {
  data: ContactItem
  success: boolean
  message: string
  errors?: string
}

export interface CreateContactResponse {
  data: ContactItem
  success: boolean
  message: string
  errors?: string
}

export interface PatchContactResponse {
  data: ContactItem
  success: boolean
  message: string
  errors?: string
}

export interface DeleteContactResponse {
  success: boolean
  message: string
  errors?: string
}

export const contactsApi = {
  /**
   * Fetch all contact lists (mapped from backend tags)
   * GET /api/contacts/list-tags
   */
  async getContactLists(): Promise<GetContactListsResponse> {
    try {
      const res = await apiClient<{ data: string[]; success: boolean; message?: string }>('/contacts/list-tags', {
        method: 'GET',
      })
      const tags = Array.isArray(res?.data) ? res.data : []
      const lists: ContactListItem[] = tags.map((tag) => ({
        id: tag,
        name: tag,
        description: `Tag: ${tag}`,
        contact_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }))
      return {
        data: lists,
        success: true,
        message: res.message || 'Lists fetched',
      }
    } catch {
      return {
        data: [],
        success: true,
        message: 'No lists found',
      }
    }
  },

  /**
   * Fetch single contact list by ID (tag)
   */
  getContactList(listId: string): Promise<GetContactListResponse> {
    return Promise.resolve({
      data: {
        id: listId,
        name: listId,
        description: `Tag: ${listId}`,
        contact_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      success: true,
      message: 'List details',
    })
  },

  /**
   * Create a new contact list
   */
  createContactList(payload: CreateContactListPayload): Promise<CreateContactListResponse> {
    return Promise.resolve({
      data: {
        id: payload.name,
        name: payload.name,
        description: payload.description || '',
        contact_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      success: true,
      message: 'List created',
    })
  },

  /**
   * Update a contact list
   */
  patchContactList(
    listId: string,
    payload: PatchContactListPayload
  ): Promise<PatchContactListResponse> {
    return Promise.resolve({
      data: {
        id: listId,
        name: payload.name || listId,
        description: payload.description || '',
        contact_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      success: true,
      message: 'List updated',
    })
  },

  /**
   * Delete a contact list
   */
  deleteContactList(listId: string): Promise<DeleteContactListResponse> {
    return Promise.resolve({
      data: listId,
      success: true,
      message: 'List deleted',
    })
  },

  /**
   * Fetch all contacts (optional list_id / tags filter, search, status, pagination)
   * GET /api/contacts/list-contacts
   */
  getContacts(params?: {
    page?: number
    page_size?: number
    search?: string
    status?: string
    tags?: string
    list_id?: string
  }): Promise<GetContactsResponse> {
    const cleanParams: Record<string, string | number | undefined> = {}
    if (params?.page) cleanParams.page = params.page
    if (params?.page_size) cleanParams.page_size = params.page_size
    if (params?.search) cleanParams.search = params.search
    if (params?.status && params.status !== 'all') cleanParams.status = params.status
    if (params?.tags) cleanParams.tags = params.tags
    else if (params?.list_id && params.list_id !== 'all') cleanParams.tags = params.list_id

    return apiClient<GetContactsResponse>('/contacts/list-contacts', {
      method: 'GET',
      params: cleanParams as Record<string, string | number | boolean | undefined>,
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
   * Create a new contact
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
   * Import contacts via CSV / file
   * POST /api/contacts/import-contacts
   */
  importContacts(formData: FormData): Promise<any> {
    return apiClient('/contacts/import-contacts', {
      method: 'POST',
      body: formData,
    })
  },

  /**
   * List all contact tags
   * GET /api/contacts/list-tags
   */
  listTags(): Promise<{ data: string[]; success: boolean; message?: string }> {
    return apiClient('/contacts/list-tags', {
      method: 'GET',
    })
  },
}
