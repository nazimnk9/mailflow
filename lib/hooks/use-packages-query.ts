'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  packagesApi,
  type CancelPackageRequestResponse,
  type GetSubscriptionResponse,
  type ListPackageRequestsResponse,
  type ListPackagesResponse,
  type RequestPackagePayload,
  type RequestPackageResponse,
} from '@/lib/api/packages'
import { ApiError } from '@/lib/api-client'

export const PACKAGES_QUERY_KEY = ['packages']
export const SUBSCRIPTION_QUERY_KEY = ['package-subscription']
export const PACKAGE_REQUESTS_QUERY_KEY = ['package-requests']

/**
 * Fetch all available packages
 */
export function usePackagesQuery() {
  return useQuery<ListPackagesResponse, ApiError>({
    queryKey: PACKAGES_QUERY_KEY,
    queryFn: () => packagesApi.listPackages(),
    staleTime: 60 * 1000,
  })
}

/**
 * Fetch current workspace subscription & usage
 */
export function useSubscriptionQuery() {
  return useQuery<GetSubscriptionResponse, ApiError>({
    queryKey: SUBSCRIPTION_QUERY_KEY,
    queryFn: () => packagesApi.getSubscription(),
    staleTime: 30 * 1000,
  })
}

/**
 * Fetch package upgrade/switch request history
 */
export function usePackageRequestsQuery() {
  return useQuery<ListPackageRequestsResponse, ApiError>({
    queryKey: PACKAGE_REQUESTS_QUERY_KEY,
    queryFn: () => packagesApi.listRequests(),
    staleTime: 30 * 1000,
  })
}

/**
 * Request a package switch / upgrade
 */
export function useRequestPackageMutation() {
  const queryClient = useQueryClient()

  return useMutation<RequestPackageResponse, ApiError, RequestPackagePayload>({
    mutationFn: (payload: RequestPackagePayload) => packagesApi.requestPackage(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: PACKAGE_REQUESTS_QUERY_KEY })
    },
  })
}

/**
 * Cancel a pending package request
 */
export function useCancelPackageRequestMutation() {
  const queryClient = useQueryClient()

  return useMutation<CancelPackageRequestResponse, ApiError, string>({
    mutationFn: (packageRequestId: string) => packagesApi.cancelRequest(packageRequestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: PACKAGE_REQUESTS_QUERY_KEY })
    },
  })
}
