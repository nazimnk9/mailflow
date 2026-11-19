'use client'

import { useState, useMemo } from 'react'
import {
  Settings,
  Globe2,
  ShieldCheck,
  Check,
  Copy,
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
  Trash2,
  Radio,
  ExternalLink,
  Key,
  Server,
  FileCheck,
  ArrowRight,
  RefreshCw,
} from 'lucide-react'
import { StatusBadge } from '@/components/status-badge'
import { useDomainsQuery } from '@/lib/hooks/use-domains-query'

type Props = {
  onAction: (message: string) => void
}

export function DomainSettingsPage({ onAction }: Props) {
  const { data: domainsResponse } = useDomainsQuery()
  const liveDomains = domainsResponse?.data ?? []
  const availableDomains =
    liveDomains.length > 0
      ? liveDomains
      : [
          { id: '1', name: 'mail.metrovps.com', is_verified: true },
          { id: '2', name: 'updates.metrovps.com', is_verified: true },
          { id: '3', name: 'mg.metrovps.net', is_verified: false },
        ]

  const [selectedDomainName, setSelectedDomainName] = useState(availableDomains[0]?.name || 'mail.metrovps.com')
  const activeDomain = availableDomains.find((d) => d.name === selectedDomainName) || availableDomains[0]

  // General settings state
  const [sendingRegion, setSendingRegion] = useState('us-east-1')
  const [dkimSelector, setDkimSelector] = useState('k1')
  const [customTrackingSubdomain, setCustomTrackingSubdomain] = useState('email')

  // Tracking & delivery settings state
  const [openTracking, setOpenTracking] = useState(true)
  const [clickTracking, setClickTracking] = useState<'all' | 'html-only' | 'disabled'>('all')
  const [unsubscribeHandling, setUnsubscribeHandling] = useState(true)
  const [dkimSigning, setDkimSigning] = useState(true)
  const [tlsEnforcement, setTlsEnforcement] = useState<'opportunistic' | 'mandatory'>('opportunistic')

  // Credentials visibility
  const [showPassword, setShowPassword] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const copyText = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(fieldName)
      setTimeout(() => setCopiedField(null), 2000)
      onAction(`Copied ${fieldName} to clipboard.`)
    } catch {
      onAction('Clipboard access unavailable.')
    }
  }

  const handleSaveSettings = () => {
    onAction(`Domain settings for ${selectedDomainName} successfully saved.`)
  }

  const handleDeleteDomain = () => {
    setIsDeleting(false)
    onAction(`Domain ${selectedDomainName} removed from workspace.`)
  }

  return (
    <>
      <div className="page-heading-row">
        <div>
          <div className="page-eyebrow">DELIVERABILITY <span>/</span> DOMAIN SETTINGS</div>
          <h1>Domain settings</h1>
          <p>Configure tracking, DKIM signing, TLS enforcement, and credentials for your sending domains.</p>
        </div>
        <div className="page-heading-actions">
          <button className="button button-primary" onClick={handleSaveSettings}>
            <Check size={14} /> Save domain settings
          </button>
        </div>
      </div>

      {/* Domain Switcher Card */}
      <section className="dashboard-panel" style={{ padding: '16px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span
              className={`table-row-avatar ${
                activeDomain?.is_verified ? 'avatar-domain' : 'avatar-suppression'
              }`}
              style={{ width: 36, height: 36 }}
            >
              <Globe2 size={18} />
            </span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <b style={{ fontSize: 16, color: '#1e293b', fontFamily: 'ui-monospace, monospace' }}>
                  {activeDomain?.name}
                </b>
                <StatusBadge status={activeDomain?.is_verified ? 'Verified' : 'Action needed'} />
              </div>
              <small style={{ color: '#64748b', fontSize: 13 }}>
                {activeDomain?.is_verified
                  ? 'Authenticated with SPF, DKIM & DMARC'
                  : 'DNS authentication verification in progress'}
              </small>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 650, color: '#475569' }}>Select Domain:</span>
            <select
              value={selectedDomainName}
              onChange={(e) => setSelectedDomainName(e.target.value)}
              className="range-select"
              style={{ minWidth: 220 }}
            >
              {availableDomains.map((d) => (
                <option key={d.name} value={d.name}>
                  {d.name} ({d.is_verified ? 'Verified' : 'Pending'})
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Settings Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Section 1: General Settings */}
        <section className="dashboard-panel" style={{ padding: '22px 24px' }}>
          <div className="panel-heading" style={{ marginBottom: 16 }}>
            <div>
              <h2>General Domain Configuration</h2>
              <p>Routing infrastructure, DKIM selector, and custom tracking subdomain</p>
            </div>
          </div>

          <div className="builder-fields" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            <label>
              Sending Node &amp; Region
              <select
                value={sendingRegion}
                onChange={(e) => setSendingRegion(e.target.value)}
              >
                <option value="us-east-1">US East (N. Virginia) · Tier-1 Node</option>
                <option value="eu-west-1">EU West (Frankfurt) · GDPR Compliant</option>
                <option value="ap-southeast-1">Asia Pacific (Singapore) · Low Latency</option>
              </select>
            </label>

            <label>
              DKIM Key Selector
              <input
                type="text"
                value={dkimSelector}
                onChange={(e) => setDkimSelector(e.target.value)}
                placeholder="e.g. k1 or mail"
              />
              <small style={{ color: '#64748b' }}>
                Used in DNS: <code>{dkimSelector}._domainkey.{selectedDomainName}</code>
              </small>
            </label>

            <label style={{ gridColumn: '1/-1' }}>
              Custom Tracking Subdomain
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="text"
                  value={customTrackingSubdomain}
                  onChange={(e) => setCustomTrackingSubdomain(e.target.value)}
                  style={{ maxWidth: 180 }}
                />
                <span style={{ fontFamily: 'ui-monospace, monospace', color: '#64748b', fontSize: 14 }}>
                  .{selectedDomainName}
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginLeft: 8, fontSize: 13, color: '#15803d' }}>
                  <Check size={14} /> CNAME Configured
                </span>
              </div>
              <small style={{ color: '#64748b', marginTop: 4 }}>
                Branded link wrapping domain preserves recipient trust for opens and clicks.
              </small>
            </label>
          </div>
        </section>

        {/* Section 2: Delivery & Tracking Settings */}
        <section className="dashboard-panel" style={{ padding: '22px 24px' }}>
          <div className="panel-heading" style={{ marginBottom: 16 }}>
            <div>
              <h2>Delivery &amp; Engagement Tracking</h2>
              <p>Configure message instrumentation, TLS policies, and DKIM signing</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Open Tracking */}
            <div className="toggle-field">
              <span>
                <b>Open Tracking</b>
                <small>Embed a transparent 1x1 tracking pixel to monitor message open rates.</small>
              </span>
              <input
                type="checkbox"
                checked={openTracking}
                onChange={(e) => setOpenTracking(e.target.checked)}
              />
            </div>

            {/* Click Tracking */}
            <div className="toggle-field" style={{ alignItems: 'flex-start' }}>
              <span>
                <b>Click Tracking</b>
                <small>Rewrite hyperlinks in emails to capture recipient engagement.</small>
              </span>
              <select
                value={clickTracking}
                onChange={(e) => setClickTracking(e.target.value as typeof clickTracking)}
                style={{ width: 180, height: 36, borderRadius: 6, border: '1px solid #cbd5e1' }}
              >
                <option value="all">HTML &amp; Plain Text</option>
                <option value="html-only">HTML Messages Only</option>
                <option value="disabled">Disabled</option>
              </select>
            </div>

            {/* Unsubscribe Handling */}
            <div className="toggle-field">
              <span>
                <b>Automatic Unsubscribe Header &amp; Footer</b>
                <small>Automatically append List-Unsubscribe header conforming to RFC 8058 (One-Click Unsubscribe).</small>
              </span>
              <input
                type="checkbox"
                checked={unsubscribeHandling}
                onChange={(e) => setUnsubscribeHandling(e.target.checked)}
              />
            </div>

            {/* DKIM Signing */}
            <div className="toggle-field">
              <span>
                <b>DKIM Signature Enforcement</b>
                <small>Cryptographically sign every outgoing message with 2048-bit RSA keys.</small>
              </span>
              <input
                type="checkbox"
                checked={dkimSigning}
                onChange={(e) => setDkimSigning(e.target.checked)}
              />
            </div>

            {/* TLS Enforcement */}
            <div className="toggle-field" style={{ alignItems: 'flex-start' }}>
              <span>
                <b>TLS Connection Policy</b>
                <small>Require encrypted transport when relaying mail to external MX hosts.</small>
              </span>
              <select
                value={tlsEnforcement}
                onChange={(e) => setTlsEnforcement(e.target.value as typeof tlsEnforcement)}
                style={{ width: 180, height: 36, borderRadius: 6, border: '1px solid #cbd5e1' }}
              >
                <option value="opportunistic">Opportunistic TLS</option>
                <option value="mandatory">Enforce TLS Only</option>
              </select>
            </div>
          </div>
        </section>

        {/* Section 3: Domain Credentials & Webhook Key */}
        <section className="dashboard-panel" style={{ padding: '22px 24px' }}>
          <div className="panel-heading" style={{ marginBottom: 16 }}>
            <div>
              <h2>Domain Credentials &amp; Webhook Key</h2>
              <p>Credentials dedicated to this sending domain for SMTP and Webhook verification</p>
            </div>
          </div>

          <div className="smtp-configuration" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
            <div>
              <small>DOMAIN SMTP USERNAME</small>
              <b>postmaster@{selectedDomainName}</b>
              <button
                type="button"
                onClick={() => copyText(`postmaster@${selectedDomainName}`, 'SMTP username')}
              >
                {copiedField === 'SMTP username' ? <Check size={14} color="#15956d" /> : <Copy size={14} />}
              </button>
            </div>

            <div>
              <small>SMTP PASSWORD</small>
              <b>{showPassword ? 'pass_live_8f93kd0923jsd' : '••••••••••••••••••••••••'}</b>
              <div style={{ display: 'inline-flex', gap: 6 }}>
                <button
                  type="button"
                  title={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button
                  type="button"
                  onClick={() => copyText('pass_live_8f93kd0923jsd', 'SMTP password')}
                >
                  {copiedField === 'SMTP password' ? <Check size={14} color="#15956d" /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            <div style={{ gridColumn: '1/-1' }}>
              <small>WEBHOOK SIGNING KEY</small>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <code style={{ fontSize: 13, color: '#334155', fontFamily: 'ui-monospace, monospace' }}>
                  whsec_984f93a82e98124b893a710928e492b19283e740192834b7
                </code>
                <button
                  type="button"
                  onClick={() => copyText('whsec_984f93a82e98124b893a710928e492b19283e740192834b7', 'Webhook key')}
                >
                  {copiedField === 'Webhook key' ? <Check size={14} color="#15956d" /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Danger Zone */}
        <section
          className="dashboard-panel"
          style={{
            padding: '20px 24px',
            border: '1.5px solid #fed7d7',
            background: '#fffaf0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
            <div>
              <b style={{ color: '#991b1b', fontSize: 16 }}>Delete this sending domain</b>
              <p style={{ margin: '4px 0 0', color: '#7f1d1d', fontSize: 13.5 }}>
                Deleting {selectedDomainName} will revoke DKIM verification and reject queued messages for this domain.
              </p>
            </div>
            <button
              type="button"
              className="button button-danger"
              style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '0 16px', minHeight: 36 }}
              onClick={() => setIsDeleting(true)}
            >
              <Trash2 size={14} /> Delete domain
            </button>
          </div>
        </section>
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleting && (
        <div className="dialog-backdrop" onClick={() => setIsDeleting(false)}>
          <div className="dialog-card" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
            <div className="dialog-head">
              <div>
                <h2>Confirm domain deletion</h2>
                <p>Are you sure you want to delete {selectedDomainName}?</p>
              </div>
            </div>
            <p style={{ fontSize: 14, color: '#64748b', margin: '14px 0' }}>
              This action cannot be undone. All configured records, webhooks, and routing rules tied to this domain will stop functioning immediately.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                type="button"
                className="button button-secondary"
                onClick={() => setIsDeleting(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="button button-danger"
                style={{ background: '#ef4444', color: '#fff', border: 'none' }}
                onClick={handleDeleteDomain}
              >
                Yes, delete domain
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
