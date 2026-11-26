import { apiClient } from '@/lib/api-client'

export interface PackageItem {
  id: string
  name: string
  slug: string
  price: number
  domain_limit: number
  monthly_emails: number
  features: string[]
  is_default: boolean
}

export interface PackageRequestItem {
  id: string
  package: PackageItem
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | string
  note: string
  admin_note: string
  decided_at: string | null
  created_at: string
}

export interface SubscriptionData {
  package: PackageItem
  domains_used: number
  pending_request: PackageRequestItem | null
}

export interface ListPackagesResponse {
  success: boolean
  message: string | null
  data: PackageItem[]
  errors?: unknown
}

export interface GetSubscriptionResponse {
  success: boolean
  message: string | null
  data: SubscriptionData
  errors?: unknown
}

export interface ListPackageRequestsResponse {
  success: boolean
  message: string | null
  data: PackageRequestItem[]
  errors?: unknown
}

export interface RequestPackagePayload {
  package: string
  note?: string
}

export interface RequestPackageResponse {
  success: boolean
  message: string | null
  data: PackageRequestItem
  errors?: unknown
}

export interface CancelPackageRequestResponse {
  success: boolean
  message: string | null
  data: null
  errors?: unknown
}

export const packagesApi = {
  /**
   * List all available subscription packages
   * GET /api/packages/list-packages
   */
  listPackages(): Promise<ListPackagesResponse> {
    return apiClient<ListPackagesResponse>('/packages/list-packages', {
      method: 'GET',
    })
  },

  /**
   * Get current active workspace subscription, usage, and pending request
   * GET /api/packages/get-subscription
   */
  getSubscription(): Promise<GetSubscriptionResponse> {
    return apiClient<GetSubscriptionResponse>('/packages/get-subscription', {
      method: 'GET',
    })
  },

  /**
   * List all package upgrade/switch requests
   * GET /api/packages/list-requests
   */
  listRequests(): Promise<ListPackageRequestsResponse> {
    return apiClient<ListPackageRequestsResponse>('/packages/list-requests', {
      method: 'GET',
    })
  },

  /**
   * Request a package upgrade or switch
   * POST /api/packages/request-package
   */
  requestPackage(payload: RequestPackagePayload): Promise<RequestPackageResponse> {
    return apiClient<RequestPackageResponse>('/packages/request-package', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  /**
   * Cancel a pending package request
   * POST /api/packages/cancel-request/{package_request_id}
   */
  cancelRequest(packageRequestId: string): Promise<CancelPackageRequestResponse> {
    return apiClient<CancelPackageRequestResponse>(
      `/packages/cancel-request/${packageRequestId}`,
      {
        method: 'POST',
      }
    )
  },
}
