'use client'

export function StatusBadge({ status }: { status: string }) {
  const lower = (status || '').toLowerCase()
  const tone =
    lower.includes('verified') ||
    lower.includes('delivered') ||
    lower.includes('paid') ||
    lower.includes('active') ||
    lower.includes('subscribed') ||
    lower.includes('connected') ||
    lower.includes('allowlisted') ||
    lower.includes('opened') ||
    lower.includes('clicked')
      ? 'status-good'
      : lower.includes('action') ||
        lower.includes('bounce') ||
        lower.includes('complaint') ||
        lower.includes('unsubscribed') ||
        lower.includes('blocklisted') ||
        lower.includes('failed') ||
        lower.includes('rejected')
      ? 'status-warn'
      : lower.includes('revoked') || lower.includes('paused')
      ? 'status-muted'
      : 'status-blue'

  return (
    <span className={`status-badge ${tone}`}>
      <i />
      {status}
    </span>
  )
}
