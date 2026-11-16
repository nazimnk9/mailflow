import { getRowsForRoute, type MockRow } from '@/lib/mock-data'

// TODO: Replace mock results with sending-domain and DNS verification endpoints.
export async function listSendingDomains(): Promise<MockRow[]> { return getRowsForRoute('domains') }
export async function verifySendingDomain(domain: string): Promise<{ domain: string; verified: boolean }> { return { domain, verified: true } }
export async function addSendingDomain(domain: string): Promise<{ domain: string; status: 'pending' }> { return { domain, status: 'pending' } }
