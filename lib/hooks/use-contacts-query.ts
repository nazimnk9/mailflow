'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  contactsApi,
  type ContactItem,
  type ContactListItem,
  type CreateContactListPayload,
  type CreateContactListResponse,
  type CreateContactPayload,
  type CreateContactResponse,
  type DeleteContactListResponse,
  type DeleteContactResponse,
  type GetContactListResponse,
  type GetContactListsResponse,
  type GetContactResponse,
  type GetContactsResponse,
  type PatchContactListPayload,
  type PatchContactListResponse,
  type PatchContactPayload,
  type PatchContactResponse,
} from '@/lib/api/contacts'
import { ApiError } from '@/lib/api-client'

export const CONTACT_LISTS_QUERY_KEY = ['contact-lists']
export const CONTACTS_QUERY_KEY = ['contacts']

/**
 * Hook to fetch all contact lists
 */
export function useContactListsQuery() {
  return useQuery<GetContactListsResponse, ApiError>({
    queryKey: CONTACT_LISTS_QUERY_KEY,
    queryFn: () => contactsApi.getContactLists(),
    staleTime: 30 * 1000,
  })
}

/**
 * Hook to fetch a single contact list by ID
 */
export function useContactListQuery(listId: string | null) {
  return useQuery<GetContactListResponse, ApiError>({
    queryKey: [...CONTACT_LISTS_QUERY_KEY, listId],
    queryFn: () => contactsApi.getContactList(listId!),
    enabled: Boolean(listId),
    staleTime: 30 * 1000,
  })
}

/**
 * Hook to create a new contact list
 */
export function useCreateContactListMutation() {
  const queryClient = useQueryClient()

  return useMutation<CreateContactListResponse, ApiError, CreateContactListPayload>({
    mutationFn: (payload: CreateContactListPayload) => contactsApi.createContactList(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONTACT_LISTS_QUERY_KEY })
    },
  })
}

/**
 * Hook to update a contact list
 */
export function usePatchContactListMutation() {
  const queryClient = useQueryClient()

  return useMutation<
    PatchContactListResponse,
    ApiError,
    { listId: string; payload: PatchContactListPayload }
  >({
    mutationFn: ({ listId, payload }) => contactsApi.patchContactList(listId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONTACT_LISTS_QUERY_KEY })
    },
  })
}

/**
 * Hook to delete a contact list
 */
export function useDeleteContactListMutation() {
  const queryClient = useQueryClient()

  return useMutation<DeleteContactListResponse, ApiError, string>({
    mutationFn: (listId: string) => contactsApi.deleteContactList(listId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONTACT_LISTS_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: CONTACTS_QUERY_KEY })
    },
  })
}

/**
 * Hook to fetch all contacts (optional list_id filter)
 */
export function useContactsQuery(params?: { list_id?: string; search?: string }) {
  return useQuery<GetContactsResponse, ApiError>({
    queryKey: [...CONTACTS_QUERY_KEY, params?.list_id, params?.search],
    queryFn: () => contactsApi.getContacts(params),
    staleTime: 30 * 1000,
  })
}

/**
 * Hook to fetch a single contact by ID
 */
export function useContactQuery(contactId: string | null) {
  return useQuery<GetContactResponse, ApiError>({
    queryKey: [...CONTACTS_QUERY_KEY, contactId],
    queryFn: () => contactsApi.getContact(contactId!),
    enabled: Boolean(contactId),
    staleTime: 30 * 1000,
  })
}

/**
 * Hook to create a new contact
 */
export function useCreateContactMutation() {
  const queryClient = useQueryClient()

  return useMutation<CreateContactResponse, ApiError, CreateContactPayload>({
    mutationFn: (payload: CreateContactPayload) => contactsApi.createContact(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONTACTS_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: CONTACT_LISTS_QUERY_KEY })
    },
  })
}

/**
 * Hook to update an existing contact
 */
export function usePatchContactMutation() {
  const queryClient = useQueryClient()

  return useMutation<
    PatchContactResponse,
    ApiError,
    { contactId: string; payload: PatchContactPayload }
  >({
    mutationFn: ({ contactId, payload }) => contactsApi.patchContact(contactId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONTACTS_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: CONTACT_LISTS_QUERY_KEY })
    },
  })
}

/**
 * Hook to delete a contact
 */
export function useDeleteContactMutation() {
  const queryClient = useQueryClient()

  return useMutation<DeleteContactResponse, ApiError, string>({
    mutationFn: (contactId: string) => contactsApi.deleteContact(contactId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONTACTS_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: CONTACT_LISTS_QUERY_KEY })
    },
  })
}
