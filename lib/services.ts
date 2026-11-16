import { getRowsForRoute, type MockRow } from '@/lib/mock-data'

export { createContact, deleteContact, listContacts, updateContact, type ContactInput } from '@/lib/services/contacts'
export { cancelCampaign, createCampaign, listCampaigns, scheduleCampaign, type CampaignInput } from '@/lib/services/campaigns'
export { addSendingDomain, listSendingDomains, verifySendingDomain } from '@/lib/services/domains'
export { issueApiKey, listApiKeys, revokeApiKey } from '@/lib/services/api-keys'
export { exportEmailLogs, getEmailLog, listEmailLogs } from '@/lib/services/logs'
export { getAnalyticsSeries, getAnalyticsSummary, getDashboardStats } from '@/lib/services/analytics'
export { getSubscription, getUsageSummary, listInvoices } from '@/lib/services/billing'
export { getWorkspaceSettings, saveWorkspaceSettings } from '@/lib/services/settings'

// TODO: Replace this routing facade with a domain-specific data adapter as APIs are connected.
export async function listResource(resource: string): Promise<MockRow[]> { return getRowsForRoute(resource) }
