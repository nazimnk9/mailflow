import { getRowsForRoute, type MockRow } from '@/lib/mock-data'

export type ContactInput = { name: string; email: string }

// TODO: Replace mock data with an authenticated contacts API adapter.
export async function listContacts(): Promise<MockRow[]> { return getRowsForRoute('contacts') }
export async function createContact(input: ContactInput): Promise<MockRow> {
  return { name: input.name, detail: `${input.email} · New contact`, status: 'Subscribed', metric: '0 campaigns', date: new Date().toLocaleDateString(), kind: 'Contact' }
}
export async function updateContact(id: string, input: Partial<ContactInput>): Promise<{ id: string; updated: boolean }> { return { id, updated: Boolean(input.name || input.email) } }
export async function deleteContact(id: string): Promise<{ id: string; deleted: boolean }> { return { id, deleted: true } }
