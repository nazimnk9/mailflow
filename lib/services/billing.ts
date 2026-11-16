import type { Subscription, UsageSummary } from '@/types'

// TODO: Replace sample billing data with subscription, invoice, and usage endpoints.
export async function getSubscription(): Promise<Subscription> {
  return { plan: 'Growth', status: 'active', monthlyPrice: 49, currency: 'USD', billingPeriodEndsAt: '2026-12-01', paymentMethod: { brand: 'Visa', lastFour: '4242', expiresAt: '08/2028' } }
}
export async function getUsageSummary(): Promise<UsageSummary> {
  return { emailsSent: 32000, monthlyLimit: 50000, creditsUsed: 32000, creditsRemaining: 18000, periodEndsAt: '2026-12-01' }
}
export async function listInvoices() { return [{ id: 'inv_2026_10', month: 'October 2026', amount: 49, status: 'paid' }, { id: 'inv_2026_09', month: 'September 2026', amount: 49, status: 'paid' }] }
