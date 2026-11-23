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
   * Fetch all contact lists
   * GET /contact-lists
   */
  getContactLists(): Promise<GetContactListsResponse> {
    return apiClient<GetContactListsResponse>('/contact-lists', {
      method: 'GET',
    })
  },

  /**
   * Fetch single contact list by ID
   * GET /contact-lists/{list_id}
   */
  getContactList(listId: string): Promise<GetContactListResponse> {
    return apiClient<GetContactListResponse>(`/contact-lists/${listId}`, {
      method: 'GET',
    })
  },

  /**
   * Create a new contact list
   * POST /contact-lists
   */
  createContactList(payload: CreateContactListPayload): Promise<CreateContactListResponse> {
    return apiClient<CreateContactListResponse>('/contact-lists', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  /**
   * Update a contact list
   * PATCH /contact-lists/{list_id}
   */
  patchContactList(
    listId: string,
    payload: PatchContactListPayload
  ): Promise<PatchContactListResponse> {
    return apiClient<PatchContactListResponse>(`/contact-lists/${listId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  },

  /**
   * Delete a contact list
   * DELETE /contact-lists/{list_id}
   */
  deleteContactList(listId: string): Promise<DeleteContactListResponse> {
    return apiClient<DeleteContactListResponse>(`/contact-lists/${listId}`, {
      method: 'DELETE',
    })
  },

  /**
   * Fetch all contacts (optional list_id filter)
   * GET /contacts
   */
  getContacts(params?: { list_id?: string; search?: string }): Promise<GetContactsResponse> {
    return apiClient<GetContactsResponse>('/contacts', {
      method: 'GET',
      params,
    })
  },

  /**
   * Fetch a single contact by ID
   * GET /contacts/{contact_id}
   */
  getContact(contactId: string): Promise<GetContactResponse> {
    return apiClient<GetContactResponse>(`/contacts/${contactId}`, {
      method: 'GET',
    })
  },

  /**
   * Create a new contact
   * POST /contacts
   */
  createContact(payload: CreateContactPayload): Promise<CreateContactResponse> {
    return apiClient<CreateContactResponse>('/contacts', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  /**
   * Update an existing contact
   * PATCH /contacts/{contact_id}
   */
  patchContact(contactId: string, payload: PatchContactPayload): Promise<PatchContactResponse> {
    return apiClient<PatchContactResponse>(`/contacts/${contactId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  },

  /**
   * Delete a contact by ID
   * DELETE /contacts/{contact_id}
   */
  deleteContact(contactId: string): Promise<DeleteContactResponse> {
    return apiClient<DeleteContactResponse>(`/contacts/${contactId}`, {
      method: 'DELETE',
    })
  },
}
