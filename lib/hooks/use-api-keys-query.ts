'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  apiKeysApi,
  type CreateApiKeyPayload,
  type CreateApiKeyResponse,
  type DeleteApiKeyResponse,
  type GetApiKeysResponse,
} from '@/lib/api/api-keys'
import { ApiError } from '@/lib/api-client'

export const API_KEYS_QUERY_KEY = ['api-keys']

/**
 * Hook to fetch all API keys
 */
export function useApiKeysQuery() {
  return useQuery<GetApiKeysResponse, ApiError>({
    queryKey: API_KEYS_QUERY_KEY,
    queryFn: () => apiKeysApi.getApiKeys(),
    staleTime: 30 * 1000,
  })
}

/**
 * Hook to create a new API key
 */
export function useCreateApiKeyMutation() {
  const queryClient = useQueryClient()

  return useMutation<CreateApiKeyResponse, ApiError, CreateApiKeyPayload>({
    mutationFn: (payload: CreateApiKeyPayload) => apiKeysApi.createApiKey(payload),
    onSuccess: () => {
      // Refresh list after creation
      queryClient.invalidateQueries({ queryKey: API_KEYS_QUERY_KEY })
    },
  })
}

/**
 * Hook to delete / revoke an API key
 */
export function useDeleteApiKeyMutation() {
  const queryClient = useQueryClient()

  return useMutation<DeleteApiKeyResponse, ApiError, string>({
    mutationFn: (keyId: string) => apiKeysApi.deleteApiKey(keyId),
    onSuccess: () => {
      // Refresh list after deletion
      queryClient.invalidateQueries({ queryKey: API_KEYS_QUERY_KEY })
    },
  })
}
