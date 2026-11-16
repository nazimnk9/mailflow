import { chartData, statCards } from '@/lib/mock-data'
import type { AnalyticsSummary } from '@/types'

// TODO: Replace mock data with aggregated analytics endpoints and server-side date filtering.
export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  return { emailsSent: 248532, deliveryRate: 99.2, openRate: 42.8, clickRate: 8.6, bounceRate: 0.18, complaintRate: 0.02 }
}
export async function getAnalyticsSeries() { return chartData }
export async function getDashboardStats() { return statCards }
