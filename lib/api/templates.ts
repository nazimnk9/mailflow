import { apiClient } from '@/lib/api-client'

export type TemplateKind = 'marketing' | 'transactional' | string

export interface TemplateItem {
  id: string
  name: string
  kind: TemplateKind
  subject: string
  html: string
  design?: unknown
  version: number
  version_id?: string | null
  created_at: string
  updated_at: string
}

export interface TemplateVersionItem {
  id: string
  number: number
  subject: string
  html: string
  design?: unknown
  created_at: string
}

export interface CreateTemplatePayload {
  name: string
  kind?: TemplateKind
  subject: string
  html: string
  design?: unknown
}

export interface TemplatesPaginatedData {
  items: TemplateItem[]
  page: number
  page_size: number
  total: number
  total_pages: number
}

export interface GetTemplatesResponse {
  data: TemplatesPaginatedData | TemplateItem[]
  success: boolean
  message?: string | null
  errors?: string | null
}

export interface GetTemplateResponse {
  data: TemplateItem
  success: boolean
  message?: string | null
  errors?: string | null
}

export interface GetTemplateVersionsResponse {
  data: TemplateVersionItem[]
  success: boolean
  message?: string | null
  errors?: string | null
}

export interface GetTemplateVersionResponse {
  data: TemplateVersionItem
  success: boolean
  message?: string | null
  errors?: string | null
}

export interface DeleteTemplateResponse {
  success: boolean
  message?: string | null
  data?: unknown
  errors?: string | null
}

export const templatesApi = {
  /**
   * List templates
   * GET /api/templates/list-templates
   */
  listTemplates(params?: {
    kind?: TemplateKind
    page?: number
    page_size?: number
  }): Promise<GetTemplatesResponse> {
    return apiClient<GetTemplatesResponse>('/templates/list-templates', {
      method: 'GET',
      params: params as Record<string, string | number | boolean | undefined>,
    })
  },

  /**
   * Get single template by ID
   * GET /api/templates/get-template/{template_id}
   */
  getTemplate(templateId: string): Promise<GetTemplateResponse> {
    return apiClient<GetTemplateResponse>(`/templates/get-template/${templateId}`, {
      method: 'GET',
    })
  },

  /**
   * Create a new template
   * POST /api/templates/create-template
   */
  createTemplate(payload: CreateTemplatePayload): Promise<GetTemplateResponse> {
    return apiClient<GetTemplateResponse>('/templates/create-template', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  /**
   * Update an existing template
   * PATCH /api/templates/update-template/{template_id}
   */
  updateTemplate(templateId: string, payload: Partial<CreateTemplatePayload>): Promise<GetTemplateResponse> {
    return apiClient<GetTemplateResponse>(`/templates/update-template/${templateId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  },

  /**
   * Delete a template
   * DELETE /api/templates/delete-template/{template_id}
   */
  deleteTemplate(templateId: string): Promise<DeleteTemplateResponse> {
    return apiClient<DeleteTemplateResponse>(`/templates/delete-template/${templateId}`, {
      method: 'DELETE',
    })
  },

  /**
   * List all versions of a template
   * GET /api/templates/list-versions/{template_id}
   */
  listVersions(templateId: string): Promise<GetTemplateVersionsResponse> {
    return apiClient<GetTemplateVersionsResponse>(`/templates/list-versions/${templateId}`, {
      method: 'GET',
    })
  },

  /**
   * Get a specific version of a template
   * GET /api/templates/get-version/{template_id}/{number}
   */
  getVersion(templateId: string, number: number): Promise<GetTemplateVersionResponse> {
    return apiClient<GetTemplateVersionResponse>(`/templates/get-version/${templateId}/${number}`, {
      method: 'GET',
    })
  },
}
