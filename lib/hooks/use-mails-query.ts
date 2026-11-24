'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  mailsApi,
  type GetMailByIdResponse,
  type GetMailsParams,
  type GetMailsResponse,
  type SendMailPayload,
  type SendMailResponse,
} from '@/lib/api/mails'
import { ApiError } from '@/lib/api-client'

export const MAILS_QUERY_KEY = ['mails']

/**
 * Hook to fetch all email messages/logs
 */
export function useMailsQuery(params?: GetMailsParams) {
  return useQuery<GetMailsResponse, ApiError>({
    queryKey: params ? [...MAILS_QUERY_KEY, params] : MAILS_QUERY_KEY,
    queryFn: () => mailsApi.getMails(params),
    staleTime: 30 * 1000, // 30 seconds
  })
}

/**
 * Hook to fetch single email message details and timeline events by ID
 */
export function useMailByIdQuery(mailId?: string | null) {
  return useQuery<GetMailByIdResponse, ApiError>({
    queryKey: [...MAILS_QUERY_KEY, mailId],
    queryFn: () => {
      if (!mailId) throw new Error('Mail ID is required')
      return mailsApi.getMailById(mailId)
    },
    enabled: Boolean(mailId),
  })
}

/**
 * Hook to send a transactional email message
 */
export function useSendMailMutation() {
  const queryClient = useQueryClient()

  return useMutation<SendMailResponse, ApiError, SendMailPayload | FormData>({
    mutationFn: (payload: SendMailPayload | FormData) => mailsApi.sendMail(payload),
    onSuccess: () => {
      // Invalidate email logs so the new message immediately appears in logs
      queryClient.invalidateQueries({ queryKey: MAILS_QUERY_KEY })
    },
  })
}
