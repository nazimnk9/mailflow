'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  campaignsApi,
  type CampaignActionResponse,
  type CampaignItem,
  type CampaignRequestPayload,
  type GetCampaignResponse,
  type GetCampaignsResponse,
} from '@/lib/api/campaigns'
import { ApiError } from '@/lib/api-client'

export const CAMPAIGNS_QUERY_KEY = ['campaigns']

/**
 * Hook to fetch campaigns with optional pagination, search and status filter
 */
export function useCampaignsQuery(params?: {
  page?: number
  page_size?: number
  search?: string
  status?: string
}) {
  return useQuery<GetCampaignsResponse, ApiError>({
    queryKey: params ? [...CAMPAIGNS_QUERY_KEY, params] : CAMPAIGNS_QUERY_KEY,
    queryFn: () => campaignsApi.listCampaigns(params),
    staleTime: 30 * 1000,
  })
}

/**
 * Hook to fetch single campaign by ID
 */
export function useCampaignByIdQuery(campaignId?: string | null) {
  return useQuery<GetCampaignResponse, ApiError>({
    queryKey: [...CAMPAIGNS_QUERY_KEY, campaignId],
    queryFn: () => {
      if (!campaignId) throw new Error('Campaign ID is required')
      return campaignsApi.getCampaign(campaignId)
    },
    enabled: Boolean(campaignId),
    staleTime: 30 * 1000,
  })
}

/**
 * Hook to create a new campaign
 */
export function useCreateCampaignMutation() {
  const queryClient = useQueryClient()

  return useMutation<GetCampaignResponse, ApiError, CampaignRequestPayload>({
    mutationFn: (payload: CampaignRequestPayload) => campaignsApi.createCampaign(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CAMPAIGNS_QUERY_KEY })
    },
  })
}

/**
 * Hook to update an existing campaign
 */
export function useUpdateCampaignMutation() {
  const queryClient = useQueryClient()

  return useMutation<
    GetCampaignResponse,
    ApiError,
    { campaignId: string; payload: Partial<CampaignRequestPayload> }
  >({
    mutationFn: ({ campaignId, payload }) =>
      campaignsApi.updateCampaign(campaignId, payload),
    onSuccess: (_, { campaignId }) => {
      queryClient.invalidateQueries({ queryKey: CAMPAIGNS_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: [...CAMPAIGNS_QUERY_KEY, campaignId] })
    },
  })
}

/**
 * Hook to delete a campaign
 */
export function useDeleteCampaignMutation() {
  const queryClient = useQueryClient()

  return useMutation<CampaignActionResponse, ApiError, string>({
    mutationFn: (campaignId: string) => campaignsApi.deleteCampaign(campaignId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CAMPAIGNS_QUERY_KEY })
    },
  })
}

/**
 * Hook to send / launch a campaign
 */
export function useSendCampaignMutation() {
  const queryClient = useQueryClient()

  return useMutation<GetCampaignResponse, ApiError, string>({
    mutationFn: (campaignId: string) => campaignsApi.sendCampaign(campaignId),
    onSuccess: (_, campaignId) => {
      queryClient.invalidateQueries({ queryKey: CAMPAIGNS_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: [...CAMPAIGNS_QUERY_KEY, campaignId] })
    },
  })
}

/**
 * Hook to re-run a campaign
 */
export function useReRunCampaignMutation() {
  const queryClient = useQueryClient()

  return useMutation<GetCampaignResponse, ApiError, string>({
    mutationFn: (campaignId: string) => campaignsApi.reRunCampaign(campaignId),
    onSuccess: (_, campaignId) => {
      queryClient.invalidateQueries({ queryKey: CAMPAIGNS_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: [...CAMPAIGNS_QUERY_KEY, campaignId] })
    },
  })
}
