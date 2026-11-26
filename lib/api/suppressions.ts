import { apiClient } from '@/lib/api-client'

export type SuppressionReason = 'bounce' | 'complaint' | 'unsubscribe' | 'manual' | string

export interface SuppressionItem {
  id: string
  email: string
  reason: SuppressionReason
  note: string
  created_at: string
}

export interface PaginatedSuppressionsData {
  items: SuppressionItem[]
  page: number
  page_size: number
  total: number
  total_pages: number
}

export interface ListSuppressionsParams {
  page?: number
  page_size?: number
  search?: string
  reason?: string
}

export interface ListSuppressionsResponse {
  success: boolean
  message: string | null
  data: PaginatedSuppressionsData
  errors?: unknown
}

export interface AddSuppressionPayload {
  email: string
  note?: string
}

export interface AddSuppressionResponse {
  success: boolean
  message: string | null
  data: SuppressionItem
  errors?: unknown
}

export interface DeleteSuppressionResponse {
  success: boolean
  message: string | null
  data: null
  errors?: unknown
}

export const suppressionsApi = {
  /**
   * Fetch paginated suppression list with optional search and reason filter
   * GET /api/suppressions/list-suppressions
   */
  listSuppressions(params?: ListSuppressionsParams): Promise<ListSuppressionsResponse> {
    const cleanParams: Record<string, string | number | boolean | undefined> = {}
    if (params?.page) cleanParams.page = params.page
    if (params?.page_size) cleanParams.page_size = params.page_size
    if (params?.search && params.search.trim()) cleanParams.search = params.search.trim()
    if (params?.reason && params.reason !== 'all') cleanParams.reason = params.reason

    return apiClient<ListSuppressionsResponse>('/suppressions/list-suppressions', {
      method: 'GET',
      params: cleanParams,
    })
  },

  /**
   * Manually add an email address to the suppression list
   * POST /api/suppressions/add-suppression
   */
  addSuppression(payload: AddSuppressionPayload): Promise<AddSuppressionResponse> {
    return apiClient<AddSuppressionResponse>('/suppressions/add-suppression', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  /**
   * Remove an address from the suppression list
   * DELETE /api/suppressions/delete-suppression/{suppression_id}
   */
  deleteSuppression(suppressionId: string): Promise<DeleteSuppressionResponse> {
    return apiClient<DeleteSuppressionResponse>(
      `/suppressions/delete-suppression/${suppressionId}`,
      {
        method: 'DELETE',
      }
    )
  },
}
