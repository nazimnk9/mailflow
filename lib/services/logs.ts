import { getRowsForRoute, type MockRow } from '@/lib/mock-data'

// TODO: Replace mock results with cursor-paginated event log endpoints.
export async function listEmailLogs(): Promise<MockRow[]> { return getRowsForRoute('logs') }
export async function getEmailLog(id: string): Promise<MockRow | undefined> { return getRowsForRoute('logs').find((row) => row.name === id) }
export async function exportEmailLogs(): Promise<{ queued: boolean }> { return { queued: true } }
