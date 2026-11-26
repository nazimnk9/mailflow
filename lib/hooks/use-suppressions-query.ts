'use client'

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  suppressionsApi,
  type AddSuppressionPayload,
  type AddSuppressionResponse,
  type DeleteSuppressionResponse,
  type ListSuppressionsParams,
  type ListSuppressionsResponse,
} from '@/lib/api/suppressions'
import { ApiError } from '@/lib/api-client'

export const SUPPRESSIONS_QUERY_KEY = ['suppressions']

/**
 * Fetch paginated suppressions
 */
export function useSuppressionsQuery(params?: ListSuppressionsParams) {
  return useQuery<ListSuppressionsResponse, ApiError>({
    queryKey: [
      ...SUPPRESSIONS_QUERY_KEY,
      params?.page ?? 1,
      params?.page_size ?? 20,
      params?.search ?? '',
      params?.reason ?? 'all',
    ],
    queryFn: () => suppressionsApi.listSuppressions(params),
    placeholderData: keepPreviousData,
    staleTime: 20 * 1000,
  })
}

/**
 * Add an email address to the suppression list
 */
export function useAddSuppressionMutation() {
  const queryClient = useQueryClient()

  return useMutation<AddSuppressionResponse, ApiError, AddSuppressionPayload>({
    mutationFn: (payload: AddSuppressionPayload) => suppressionsApi.addSuppression(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUPPRESSIONS_QUERY_KEY })
    },
  })
}

/**
 * Remove an email address from the suppression list
 */
export function useDeleteSuppressionMutation() {
  const queryClient = useQueryClient()

  return useMutation<DeleteSuppressionResponse, ApiError, string>({
    mutationFn: (suppressionId: string) => suppressionsApi.deleteSuppression(suppressionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUPPRESSIONS_QUERY_KEY })
    },
  })
}
