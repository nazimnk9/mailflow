'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  templatesApi,
  type CreateTemplatePayload,
  type DeleteTemplateResponse,
  type GetTemplateResponse,
  type GetTemplatesResponse,
  type GetTemplateVersionResponse,
  type GetTemplateVersionsResponse,
  type TemplateItem,
  type TemplateKind,
} from '@/lib/api/templates'
import { ApiError } from '@/lib/api-client'

export const TEMPLATES_QUERY_KEY = ['templates']
export const TEMPLATE_VERSIONS_QUERY_KEY = ['template-versions']

/**
 * Hook to fetch templates with optional kind, search, and pagination
 */
export function useTemplatesQuery(params?: {
  kind?: TemplateKind
  page?: number
  page_size?: number
  search?: string
}) {
  return useQuery<GetTemplatesResponse, ApiError>({
    queryKey: params ? [...TEMPLATES_QUERY_KEY, params] : TEMPLATES_QUERY_KEY,
    queryFn: () => templatesApi.listTemplates(params),
    staleTime: 30 * 1000,
  })
}

/**
 * Hook to fetch single template by ID
 */
export function useTemplateByIdQuery(templateId?: string | null) {
  return useQuery<GetTemplateResponse, ApiError>({
    queryKey: [...TEMPLATES_QUERY_KEY, templateId],
    queryFn: () => {
      if (!templateId) throw new Error('Template ID is required')
      return templatesApi.getTemplate(templateId)
    },
    enabled: Boolean(templateId),
    staleTime: 30 * 1000,
  })
}

/**
 * Hook to fetch all versions of a template
 */
export function useTemplateVersionsQuery(templateId?: string | null) {
  return useQuery<GetTemplateVersionsResponse, ApiError>({
    queryKey: [...TEMPLATE_VERSIONS_QUERY_KEY, templateId],
    queryFn: () => {
      if (!templateId) throw new Error('Template ID is required')
      return templatesApi.listVersions(templateId)
    },
    enabled: Boolean(templateId),
    staleTime: 30 * 1000,
  })
}

/**
 * Hook to fetch a specific version of a template
 */
export function useTemplateVersionQuery(templateId?: string | null, number?: number | null) {
  return useQuery<GetTemplateVersionResponse, ApiError>({
    queryKey: [...TEMPLATE_VERSIONS_QUERY_KEY, templateId, number],
    queryFn: () => {
      if (!templateId || number === null || number === undefined) {
        throw new Error('Template ID and version number are required')
      }
      return templatesApi.getVersion(templateId, number)
    },
    enabled: Boolean(templateId && number !== null && number !== undefined),
    staleTime: 30 * 1000,
  })
}

/**
 * Hook to create a new template
 */
export function useCreateTemplateMutation() {
  const queryClient = useQueryClient()

  return useMutation<GetTemplateResponse, ApiError, CreateTemplatePayload>({
    mutationFn: (payload: CreateTemplatePayload) => templatesApi.createTemplate(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEMPLATES_QUERY_KEY })
    },
  })
}

/**
 * Hook to update a template (generates a new version)
 */
export function useUpdateTemplateMutation() {
  const queryClient = useQueryClient()

  return useMutation<GetTemplateResponse, ApiError, { id: string; payload: Partial<CreateTemplatePayload> }>({
    mutationFn: ({ id, payload }) => templatesApi.updateTemplate(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: TEMPLATES_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: [...TEMPLATES_QUERY_KEY, variables.id] })
      queryClient.invalidateQueries({ queryKey: [...TEMPLATE_VERSIONS_QUERY_KEY, variables.id] })
    },
  })
}

/**
 * Hook to delete a template
 */
export function useDeleteTemplateMutation() {
  const queryClient = useQueryClient()

  return useMutation<DeleteTemplateResponse, ApiError, string>({
    mutationFn: (templateId: string) => templatesApi.deleteTemplate(templateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEMPLATES_QUERY_KEY })
    },
  })
}
