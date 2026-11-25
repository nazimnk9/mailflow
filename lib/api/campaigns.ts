import { apiClient } from '@/lib/api-client'

export type CampaignStatus = 'draft' | 'sending' | 'sent' | string

export interface CampaignStats {
  recipients?: number
  queued?: number
  sent?: number
  deferred?: number
  delivered?: number
  bounced?: number
  failed?: number
  total?: number
  opened?: number
  clicked?: number
}

export interface CampaignItem {
  id: string
  name: string
  status: CampaignStatus
  from_email?: string
  from_name?: string
  reply_to?: string
  subject?: string
  html?: string
  text?: string
  template?: string | null
  template_version?: string | null
  tags?: string[]
  sent_at?: string | null
  stats?: CampaignStats
  created_at: string
  updated_at: string
}

export interface CampaignRequestPayload {
  name: string
  from_email?: string
  from_name?: string
  reply_to?: string
  subject?: string
  html?: string
  text?: string
  template?: string | null
  template_version?: string | null
  tags?: string[]
}

export interface CampaignsPaginatedData {
  items: CampaignItem[]
  page: number
  page_size: number
  total: number
  total_pages: number
}

export interface GetCampaignsResponse {
  data: CampaignsPaginatedData | CampaignItem[]
  success: boolean
  message?: string | null
  errors?: string | null
}

export interface GetCampaignResponse {
  data: CampaignItem
  success: boolean
  message?: string | null
  errors?: string | null
}

export interface CampaignActionResponse {
  success: boolean
  message?: string | null
  data?: unknown
  errors?: string | null
}

export const campaignsApi = {
  /**
   * List campaigns
   * GET /api/campaigns/list-campaigns
   */
  listCampaigns(params?: {
    page?: number
    page_size?: number
    search?: string
    status?: string
  }): Promise<GetCampaignsResponse> {
    return apiClient<GetCampaignsResponse>('/campaigns/list-campaigns', {
      method: 'GET',
      params: params as Record<string, string | number | boolean | undefined>,
    })
  },

  /**
   * Get single campaign by ID
   * GET /api/campaigns/get-campaign/{campaign_id}
   */
  getCampaign(campaignId: string): Promise<GetCampaignResponse> {
    return apiClient<GetCampaignResponse>(`/campaigns/get-campaign/${campaignId}`, {
      method: 'GET',
    })
  },

  /**
   * Create a new campaign
   * POST /api/campaigns/create-campaign
   */
  createCampaign(payload: CampaignRequestPayload): Promise<GetCampaignResponse> {
    return apiClient<GetCampaignResponse>('/campaigns/create-campaign', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  /**
   * Update an existing campaign
   * PATCH /api/campaigns/update-campaign/{campaign_id}
   */
  updateCampaign(campaignId: string, payload: Partial<CampaignRequestPayload>): Promise<GetCampaignResponse> {
    return apiClient<GetCampaignResponse>(`/campaigns/update-campaign/${campaignId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  },

  /**
   * Delete a campaign
   * DELETE /api/campaigns/delete-campaign/{campaign_id}
   */
  deleteCampaign(campaignId: string): Promise<CampaignActionResponse> {
    return apiClient<CampaignActionResponse>(`/campaigns/delete-campaign/${campaignId}`, {
      method: 'DELETE',
    })
  },

  /**
   * Send a campaign immediately
   * POST /api/campaigns/send-campaign/{campaign_id}
   */
  sendCampaign(campaignId: string): Promise<GetCampaignResponse> {
    return apiClient<GetCampaignResponse>(`/campaigns/send-campaign/${campaignId}`, {
      method: 'POST',
    })
  },

  /**
   * Re-run a sent campaign
   * POST /api/campaigns/re-run-campaign/{campaign_id}
   */
  reRunCampaign(campaignId: string): Promise<GetCampaignResponse> {
    return apiClient<GetCampaignResponse>(`/campaigns/re-run-campaign/${campaignId}`, {
      method: 'POST',
    })
  },
}
