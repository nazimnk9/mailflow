'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  domainsApi,
  type CreateDomainPayload,
  type CreateDomainResponse,
  type DeleteDomainResponse,
  type GetDomainByIdResponse,
  type GetDomainsResponse,
} from '@/lib/api/domains'
import { ApiError } from '@/lib/api-client'

export const DOMAINS_QUERY_KEY = ['domains']

/**
 * Hook to fetch all sending domains
 */
export function useDomainsQuery() {
  return useQuery<GetDomainsResponse, ApiError>({
    queryKey: DOMAINS_QUERY_KEY,
    queryFn: () => domainsApi.getDomains(),
    staleTime: 60 * 1000, // 1 minute
  })
}

/**
 * Hook to fetch single domain by ID (including latest DNS records)
 */
export function useDomainByIdQuery(domainId?: string | null) {
  return useQuery<GetDomainByIdResponse, ApiError>({
    queryKey: [...DOMAINS_QUERY_KEY, domainId],
    queryFn: () => {
      if (!domainId) throw new Error('Domain ID is required')
      return domainsApi.getDomainById(domainId)
    },
    enabled: Boolean(domainId),
  })
}

/**
 * Hook to create a new domain
 */
export function useCreateDomainMutation() {
  const queryClient = useQueryClient()

  return useMutation<CreateDomainResponse, ApiError, CreateDomainPayload>({
    mutationFn: (payload: CreateDomainPayload) => domainsApi.createDomain(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DOMAINS_QUERY_KEY })
    },
  })
}

/**
 * Hook to delete a domain
 */
export function useDeleteDomainMutation() {
  const queryClient = useQueryClient()

  return useMutation<DeleteDomainResponse, ApiError, string>({
    mutationFn: (domainId: string) => domainsApi.deleteDomain(domainId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DOMAINS_QUERY_KEY })
    },
  })
}
