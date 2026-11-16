export type ContactStatus = 'subscribed' | 'unconfirmed' | 'unsubscribed' | 'blocklisted'
export type DeliveryStatus = 'queued' | 'accepted' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'rejected' | 'complaint'

export interface Contact {
  id: string
  email: string
  firstName: string
  lastName: string
  status: ContactStatus
  attributes: Record<string, string | number | boolean | null>
  tags: string[]
  createdAt: string
  lastActivityAt?: string
}

export interface Campaign {
  id: string
  name: string
  subject: string
  previewText?: string
  status: 'draft' | 'scheduled' | 'sent' | 'paused'
  audienceId?: string
  recipientCount: number
  sentAt?: string
  scheduledAt?: string
  openRate?: number
  clickRate?: number
}

export interface AutomationWorkflow {
  id: string
  name: string
  status: 'active' | 'paused' | 'draft'
  trigger: string
  stepCount: number
  enrolledCount: number
  updatedAt: string
}

export interface DnsRecord {
  type: 'TXT' | 'CNAME' | 'MX'
  host: string
  value: string
  verified: boolean
}

export interface SendingDomain {
  id: string
  domain: string
  status: 'pending' | 'verified' | 'action-needed' | 'disabled'
  region: string
  reputationScore?: number
  records: DnsRecord[]
  createdAt: string
}

export interface ApiKey {
  id: string
  name: string
  prefix: string
  status: 'active' | 'revoked'
  createdAt: string
  lastUsedAt?: string
  requestCount?: number
}

export interface EmailEvent {
  id: string
  recipient: string
  subject: string
  status: DeliveryStatus
  source: 'campaign' | 'api' | 'smtp' | 'automation'
  timestamp: string
  latencyMs?: number
  eventHistory: Array<{ type: DeliveryStatus; timestamp: string; detail?: string }>
}

export interface Integration {
  id: string
  name: string
  category: 'e-commerce' | 'crm' | 'marketing' | 'automation' | 'developer'
  status: 'available' | 'connected' | 'error'
  description: string
}

export interface UsageSummary {
  emailsSent: number
  monthlyLimit: number
  creditsUsed: number
  creditsRemaining: number
  periodEndsAt: string
}

export interface Subscription {
  plan: string
  status: 'active' | 'trialing' | 'past-due' | 'canceled'
  monthlyPrice: number
  currency: string
  billingPeriodEndsAt: string
  paymentMethod?: { brand: string; lastFour: string; expiresAt: string }
}

export interface WorkspaceSettings {
  workspaceName: string
  companyName: string
  timezone: string
  notifications: Record<string, boolean>
}

export interface AnalyticsSummary {
  emailsSent: number
  deliveryRate: number
  openRate: number
  clickRate: number
  bounceRate: number
  complaintRate: number
}
