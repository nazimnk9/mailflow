export function toLocalDateKey(value: string): string | null {
  const normalized = value.trim().replace(/^(?:updated|added|created|sent|paid|revoked|closed)\s+/i, '')
  if (!normalized) return null

  if (/^today(?:,|\s|$)/i.test(normalized)) {
    const today = new Date()
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  }

  const isoDate = normalized.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (isoDate) return `${isoDate[1]}-${isoDate[2]}-${isoDate[3]}`

  const monthDate = normalized.match(/^([A-Za-z]+)\s+(\d{1,2})(?:,)?\s+(\d{4})/)
  if (monthDate) {
    const month = new Date(`${monthDate[1]} 1, 2000`).getMonth()
    if (!Number.isNaN(month)) return `${monthDate[3]}-${String(month + 1).padStart(2, '0')}-${monthDate[2].padStart(2, '0')}`
  }

  const monthYear = normalized.match(/^([A-Za-z]+)\s+(\d{4})$/)
  if (monthYear) {
    const month = new Date(`${monthYear[1]} 1, 2000`).getMonth()
    if (!Number.isNaN(month)) return `${monthYear[2]}-${String(month + 1).padStart(2, '0')}-01`
  }

  const parsed = new Date(normalized)
  if (Number.isNaN(parsed.getTime())) return null
  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`
}

export function isWithinDateRange(value: string, startDate: string, endDate: string): boolean {
  if (!startDate && !endDate) return true
  const dateKey = toLocalDateKey(value)
  if (!dateKey) return false
  return (!startDate || dateKey >= startDate) && (!endDate || dateKey <= endDate)
}
