import { getRowsForRoute, type MockRow } from '@/lib/mock-data'

// TODO: Replace mock results with credential-management endpoints. Never return raw secrets from list calls.
export async function listApiKeys(): Promise<MockRow[]> { return getRowsForRoute('api-keys') }
export async function issueApiKey(name: string): Promise<MockRow> {
  return { name, detail: 'key_test_••••••••••••new', status: 'Active', metric: '0 requests', date: new Date().toLocaleDateString(), kind: 'API key' }
}
export async function revokeApiKey(id: string): Promise<{ id: string; revoked: boolean }> { return { id, revoked: true } }
