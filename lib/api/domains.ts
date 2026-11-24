import { apiClient } from '@/lib/api-client'

export interface DnsRecord {
  id: string
  purpose: string
  type: string
  host: string
  value: string
  priority: number
  is_verified: boolean
}

export interface DomainItem {
  id: string
  name: string
  is_verified: boolean
  dns_records: DnsRecord[]
  created_at: string
}

export interface CreateDomainPayload {
  name: string
}

export interface CreateDomainResponse {
  data: DomainItem
  success: boolean
  message: string
  errors?: string
}

export interface GetDomainsResponse {
  data: DomainItem[]
  success: boolean
  message: string
  errors?: string
}

export interface GetDomainByIdResponse {
  data: DomainItem
  success: boolean
  message: string
  errors?: string
}

export interface DeleteDomainResponse {
  success: boolean
  message: string
  data?: string
  errors?: string
}

export const domainsApi = {
  /**
   * Fetch all sending domains
   * GET /api/domains/list-domains
   */
  getDomains(): Promise<GetDomainsResponse> {
    return apiClient<GetDomainsResponse>('/domains/list-domains', {
      method: 'GET',
    })
  },

  /**
   * Fetch a specific domain by ID
   * GET /api/domains/get-domain/{domain_id}
   */
  getDomainById(domainId: string): Promise<GetDomainByIdResponse> {
    return apiClient<GetDomainByIdResponse>(`/domains/get-domain/${domainId}`, {
      method: 'GET',
    })
  },

  /**
   * Add a new sending domain
   * POST /api/domains/add-domain
   */
  createDomain(payload: CreateDomainPayload): Promise<CreateDomainResponse> {
    return apiClient<CreateDomainResponse>('/domains/add-domain', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  /**
   * Delete a domain by ID
   * DELETE /api/domains/delete-domain/{domain_id}
   */
  deleteDomain(domainId: string): Promise<DeleteDomainResponse> {
    return apiClient<DeleteDomainResponse>(`/domains/delete-domain/${domainId}`, {
      method: 'DELETE',
    })
  },

  /**
   * Verify domain DNS configuration
   * POST /api/domains/verify-domain/{domain_id}
   */
  verifyDomain(domainId: string): Promise<GetDomainByIdResponse> {
    return apiClient<GetDomainByIdResponse>(`/domains/verify-domain/${domainId}`, {
      method: 'POST',
    })
  },
}
