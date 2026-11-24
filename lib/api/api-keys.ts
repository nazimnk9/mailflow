import { apiClient } from '@/lib/api-client'

export type ApiKeyAccess = 'read' | 'write'

export interface ApiKeyItem {
  id: string
  name: string
  access: ApiKeyAccess | string
  prefix: string
  expires_at: string | null
  last_used_at: string | null
  created_at: string
}

export interface ApiKeyCreatedItem extends ApiKeyItem {
  key: string
}

export interface CreateApiKeyPayload {
  name: string
  access: ApiKeyAccess
  expires_at: string | null
}

export interface CreateApiKeyResponse {
  data: ApiKeyCreatedItem
  success: boolean
  message: string
  errors?: string
}

export interface GetApiKeysResponse {
  data: ApiKeyItem[]
  success: boolean
  message: string
  errors?: string
}

export interface DeleteApiKeyResponse {
  success: boolean
  message: string
  errors?: string
}

export const apiKeysApi = {
  /**
   * Fetch all API keys
   * GET /api/api-keys/list-keys
   */
  getApiKeys(): Promise<GetApiKeysResponse> {
    return apiClient<GetApiKeysResponse>('/api-keys/list-keys', {
      method: 'GET',
    })
  },

  /**
   * Create a new API key
   * POST /api/api-keys/create-key
   */
  createApiKey(payload: CreateApiKeyPayload): Promise<CreateApiKeyResponse> {
    return apiClient<CreateApiKeyResponse>('/api-keys/create-key', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  /**
   * Revoke / Delete an API key by ID
   * DELETE /api/api-keys/revoke-key/{key_id}
   */
  deleteApiKey(keyId: string): Promise<DeleteApiKeyResponse> {
    return apiClient<DeleteApiKeyResponse>(`/api-keys/revoke-key/${keyId}`, {
      method: 'DELETE',
    })
  },
}
