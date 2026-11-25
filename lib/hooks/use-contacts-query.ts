'use client'

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  contactsApi,
  type CreateContactPayload,
  type CreateContactResponse,
  type DeleteContactResponse,
  type GetContactResponse,
  type GetContactsParams,
  type GetContactsResponse,
  type ImportContactsResponse,
  type ListTagsResponse,
  type PatchContactPayload,
  type PatchContactResponse,
} from '@/lib/api/contacts'
import { ApiError } from '@/lib/api-client'

export const CONTACTS_QUERY_KEY = ['contacts']
export const CONTACT_TAGS_QUERY_KEY = ['contact-tags']

/**
 * Hook to fetch paginated contacts with optional search, status, and tags filters
 */
export function useContactsQuery(params?: GetContactsParams) {
  return useQuery<GetContactsResponse, ApiError>({
    queryKey: [
      ...CONTACTS_QUERY_KEY,
      params?.page ?? 1,
      params?.page_size ?? 20,
      params?.search ?? '',
      params?.status ?? '',
      params?.tags ?? '',
    ],
    queryFn: () => contactsApi.getContacts(params),
    placeholderData: keepPreviousData,
    staleTime: 20 * 1000,
  })
}

/**
 * Hook to fetch a single contact by ID
 */
export function useContactQuery(contactId: string | null) {
  return useQuery<GetContactResponse, ApiError>({
    queryKey: [...CONTACTS_QUERY_KEY, 'detail', contactId],
    queryFn: () => contactsApi.getContact(contactId!),
    enabled: Boolean(contactId),
    staleTime: 20 * 1000,
  })
}

/**
 * Hook to fetch all contact tags
 */
export function useContactTagsQuery() {
  return useQuery<ListTagsResponse, ApiError>({
    queryKey: CONTACT_TAGS_QUERY_KEY,
    queryFn: () => contactsApi.listTags(),
    staleTime: 30 * 1000,
  })
}

/**
 * Hook to add a new contact
 */
export function useCreateContactMutation() {
  const queryClient = useQueryClient()

  return useMutation<CreateContactResponse, ApiError, CreateContactPayload>({
    mutationFn: (payload: CreateContactPayload) => contactsApi.createContact(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONTACTS_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: CONTACT_TAGS_QUERY_KEY })
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
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: CONTACTS_QUERY_KEY })
      queryClient.invalidateQueries({
        queryKey: [...CONTACTS_QUERY_KEY, 'detail', variables.contactId],
      })
      queryClient.invalidateQueries({ queryKey: CONTACT_TAGS_QUERY_KEY })
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
      queryClient.invalidateQueries({ queryKey: CONTACT_TAGS_QUERY_KEY })
    },
  })
}

/**
 * Hook to import contacts from a CSV file with optional tags
 */
export function useImportContactsMutation() {
  const queryClient = useQueryClient()

  return useMutation<ImportContactsResponse, ApiError, { file: File; tags?: string[] }>({
    mutationFn: ({ file, tags }) => contactsApi.importContacts(file, tags),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONTACTS_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: CONTACT_TAGS_QUERY_KEY })
    },
  })
}
