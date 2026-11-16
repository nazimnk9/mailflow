import type { WorkspaceSettings } from '@/types'

const mockSettings: WorkspaceSettings = { workspaceName: 'MetroVPS', companyName: 'MetroVPS', timezone: 'America/Los_Angeles', notifications: { campaignReports: true, deliveryAlerts: true, workspaceUpdates: false } }

// TODO: Replace with workspace-scoped profile, team, security, and preferences endpoints.
export async function getWorkspaceSettings(): Promise<WorkspaceSettings> { return mockSettings }
export async function saveWorkspaceSettings(input: Partial<WorkspaceSettings>): Promise<WorkspaceSettings> { return { ...mockSettings, ...input } }
