import { apiClient } from '@/lib/api-client'

export interface MailEvent {
  id: string
  type: string
  recipient: string
  dsn?: string
  response?: string
  occurred_at: string
}

export interface MailAttachment {
  filename: string
  content_type: string
  size: number
  content?: string
}

export interface MailItem {
  id: string
  from_email: string
  from_name?: string
  to: string | string[]
  cc?: string | string[]
  bcc?: string | string[]
  reply_to?: string
  subject: string
  text?: string
  html?: string
  headers?: string | Record<string, string>
  attachments?: MailAttachment[] | string[]
  node?: string
  status: string
  error?: string
  events?: MailEvent[]
  created_at: string
}

export interface SendMailPayload {
  from_email: string
  from_name?: string
  to: string[]
  cc?: string[]
  bcc?: string[]
  reply_to?: string
  subject: string
  text?: string
  html?: string
  headers?: Record<string, string>
  attachments?: MailAttachment[] | string[]
  node?: 'node-158' | 'node-253' | string
}

export interface SendMailResponse {
  data: MailItem
  success: boolean
  message: string
  errors?: string
}

export interface MailsPaginatedData {
  items: MailItem[]
  page: number
  page_size: number
  total: number
  total_pages: number
}

export interface GetMailsParams {
  page?: number
  page_size?: number
  search?: string
  status?: string
  node?: string
}

export interface GetMailsResponse {
  data: MailsPaginatedData | MailItem[]
  success: boolean
  message: string
  errors?: string
}

export interface GetMailByIdResponse {
  data: MailItem
  success: boolean
  message: string
  errors?: string
}

export const mailsApi = {
  /**
   * Send a transactional email message
   * POST /mails/send
   */
  sendMail(payload: SendMailPayload | FormData): Promise<SendMailResponse> {
    const isFormData =
      typeof FormData !== 'undefined' && payload instanceof FormData
    return apiClient<SendMailResponse>('/mails/send', {
      method: 'POST',
      body: isFormData ? payload : JSON.stringify(payload),
    })
  },

  /**
   * Fetch all sent email logs
   * GET /mails
   */
  getMails(params?: GetMailsParams): Promise<GetMailsResponse> {
    return apiClient<GetMailsResponse>('/mails', {
      method: 'GET',
      params: params as Record<string, string | number | boolean | undefined>,
    })
  },

  /**
   * Fetch a single mail log with timeline events by ID
   * GET /mails/{mail_id}
   */
  getMailById(mailId: string): Promise<GetMailByIdResponse> {
    return apiClient<GetMailByIdResponse>(`/mails/${mailId}`, {
      method: 'GET',
    })
  },
}
