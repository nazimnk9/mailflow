import { getRowsForRoute, type MockRow } from '@/lib/mock-data'

export type CampaignInput = { name: string; audience: string; subject: string }

// TODO: Replace mock data with an authenticated campaigns API adapter.
export async function listCampaigns(): Promise<MockRow[]> { return getRowsForRoute('campaigns') }
export async function createCampaign(input: CampaignInput): Promise<MockRow> {
  return { name: input.name, detail: `${input.audience} · Campaign draft`, status: 'Draft', metric: '—', date: new Date().toLocaleDateString(), kind: 'Campaign' }
}
export async function scheduleCampaign(id: string, scheduledAt: string): Promise<{ id: string; scheduledAt: string }> { return { id, scheduledAt } }
export async function cancelCampaign(id: string): Promise<{ id: string; canceled: boolean }> { return { id, canceled: true } }
