'use client'

import { useState } from 'react'
import {
  Inbox,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  Laptop,
  Smartphone,
  Sparkles,
  RefreshCw,
  Search,
  Check,
} from 'lucide-react'

export function InboxPlacementSuite({ onAction = () => {} }: { onAction?: (message: string) => void }) {
  const [activeTab, setActiveTab] = useState<'placement' | 'preview' | 'blocklists'>('placement')
  const [testing, setTesting] = useState(false)

  const handleRunSeedCheck = () => {
    setTesting(true)
    setTimeout(() => {
      setTesting(false)
      onAction('Seed list placement test completed across 14 major inbox providers.')
    }, 600)
  }

  const providers = [
    {
      name: 'Google Gmail',
      logo: 'G',
      color: '#ea4335',
      inboxRate: 98.4,
      promoRate: 1.6,
      spamRate: 0.0,
      status: 'Excellent',
    },
    {
      name: 'Microsoft Outlook / Office 365',
      logo: 'O',
      color: '#0078d4',
      inboxRate: 96.2,
      promoRate: 3.8,
      spamRate: 0.0,
      status: 'Excellent',
    },
    {
      name: 'Apple Mail (iCloud)',
      logo: 'A',
      color: '#333333',
      inboxRate: 99.8,
      promoRate: 0.0,
      spamRate: 0.2,
      status: 'Clean',
    },
    {
      name: 'Yahoo Mail & AOL',
      logo: 'Y',
      color: '#6001d2',
      inboxRate: 97.1,
      promoRate: 2.2,
      spamRate: 0.7,
      status: 'Clean',
    },
  ]

  const blocklists = [
    { name: 'Spamhaus ZEN (SBL + XBL + PBL)', status: 'Clean', checked: '3 mins ago' },
    { name: 'Barracuda Reputation Network (BRBL)', status: 'Clean', checked: '3 mins ago' },
    { name: 'SpamCop Blocking List (SCBL)', status: 'Clean', checked: '4 mins ago' },
    { name: 'SORBS Aggregate Zone', status: 'Clean', checked: '5 mins ago' },
    { name: 'SURBL URI Reputation', status: 'Clean', checked: '2 mins ago' },
    { name: 'Invaluement URI Blacklist', status: 'Clean', checked: '5 mins ago' },
    { name: 'Hostkarma Blacklist', status: 'Clean', checked: '6 mins ago' },
    { name: 'Abuse.ro Spam Database', status: 'Clean', checked: '3 mins ago' },
  ]

  return (
    <div className="inbox-placement-page">
      {/* Top Header */}
      <div className="page-heading-row">
        <div>
          <div className="page-eyebrow">DELIVERABILITY / INBOXREADY SUITE</div>
          <h1>Inbox Placement & Spam Trap Monitoring</h1>
          <p>Verify exactly where your emails land—Primary Inbox vs Promotions vs Junk—before broadcasting.</p>
        </div>
        <div className="page-heading-actions">
          <div className="placement-nav-pills">
            <button
              className={activeTab === 'placement' ? 'active' : ''}
              onClick={() => setActiveTab('placement')}
            >
              Seed Placement
            </button>
            <button
              className={activeTab === 'preview' ? 'active' : ''}
              onClick={() => setActiveTab('preview')}
            >
              Email Client Previews
            </button>
            <button
              className={activeTab === 'blocklists' ? 'active' : ''}
              onClick={() => setActiveTab('blocklists')}
            >
              Blocklist Monitor (DNSBL)
            </button>
          </div>
          <button className="button button-primary" onClick={handleRunSeedCheck} disabled={testing}>
            {testing ? (
              <>
                <RefreshCw size={14} className="spin-icon" /> Testing Seed Accounts...
              </>
            ) : (
              <>
                <RefreshCw size={14} /> Run Seed Test
              </>
            )}
          </button>
        </div>
      </div>

      {activeTab === 'placement' && (
        <div className="placement-content-layout">
          {/* Top Overall Placement Metric Bar */}
          <div className="placement-score-banner">
            <div className="placement-stat-box">
              <span className="big-stat-number text-emerald-600">97.8%</span>
              <span className="stat-label">Average Primary Inbox Placement</span>
            </div>
            <div className="placement-stat-divider" />
            <div className="placement-stat-box">
              <span className="big-stat-number text-amber-500">2.0%</span>
              <span className="stat-label">Filtered to Promotions / Other</span>
            </div>
            <div className="placement-stat-divider" />
            <div className="placement-stat-box">
              <span className="big-stat-number text-rose-500">0.2%</span>
              <span className="stat-label">Filtered to Spam Folder</span>
            </div>
            <div className="placement-stat-divider" />
            <div className="placement-stat-box">
              <span className="big-stat-number text-blue-600">14 / 14</span>
              <span className="stat-label">Major Mailbox Providers Tested</span>
            </div>
          </div>

          {/* Providers Breakdown Cards */}
          <div className="providers-placement-grid">
            {providers.map((p) => (
              <div key={p.name} className="provider-placement-card">
                <div className="card-top">
                  <div className="provider-brand">
                    <span className="brand-logo-pill" style={{ background: p.color }}>
                      {p.logo}
                    </span>
                    <div>
                      <h4>{p.name}</h4>
                      <small>Status: {p.status}</small>
                    </div>
                  </div>
                  <span className="placement-rate-badge">{p.inboxRate}% Inbox</span>
                </div>

                {/* Multi-segment Bar */}
                <div className="placement-bar-track">
                  <div
                    className="bar-seg seg-primary"
                    style={{ width: `${p.inboxRate}%` }}
                    title={`Primary Inbox: ${p.inboxRate}%`}
                  />
                  <div
                    className="bar-seg seg-promo"
                    style={{ width: `${p.promoRate}%` }}
                    title={`Promotions / Other: ${p.promoRate}%`}
                  />
                  <div
                    className="bar-seg seg-spam"
                    style={{ width: `${p.spamRate}%` }}
                    title={`Spam: ${p.spamRate}%`}
                  />
                </div>

                <div className="bar-legend-row">
                  <span>
                    <i className="dot-green" /> Primary ({p.inboxRate}%)
                  </span>
                  <span>
                    <i className="dot-amber" /> Promo ({p.promoRate}%)
                  </span>
                  <span>
                    <i className="dot-red" /> Spam ({p.spamRate}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'preview' && (
        <div className="client-preview-grid">
          {[
            { client: 'Apple Mail (iOS 17)', device: 'Mobile', dark: false },
            { client: 'Apple Mail (Dark Mode)', device: 'Mobile', dark: true },
            { client: 'Gmail Web (Chrome)', device: 'Desktop', dark: false },
            { client: 'Gmail Mobile (Android)', device: 'Mobile', dark: false },
            { client: 'Outlook 365 (Windows)', device: 'Desktop', dark: false },
            { client: 'Outlook (Dark Mode)', device: 'Desktop', dark: true },
          ].map((item, idx) => (
            <div key={idx} className={`client-preview-card ${item.dark ? 'is-dark-client' : ''}`}>
              <div className="client-preview-head">
                <div>
                  <b>{item.client}</b>
                  <small>{item.device} rendering</small>
                </div>
                <span className="verified-pill">
                  <CheckCircle2 size={12} /> Render OK
                </span>
              </div>
              <div className="client-preview-thumbnail">
                <div className="thumbnail-email-simulation">
                  <div className="mock-email-logo" />
                  <div className="mock-email-headline" />
                  <div className="mock-email-text" />
                  <div className="mock-email-button" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'blocklists' && (
        <div className="blocklists-table-card">
          <div className="table-card-head">
            <div>
              <h3>DNSBL / Spam Trap Monitoring</h3>
              <p>Continuous automated health monitoring across 50+ global reputation databases.</p>
            </div>
            <span className="all-clean-tag">
              <CheckCircle2 size={14} /> All 50+ Real-time Lists Clean
            </span>
          </div>

          <div className="dnsbl-list-table">
            {blocklists.map((b) => (
              <div key={b.name} className="dnsbl-row">
                <div className="dnsbl-name-col">
                  <ShieldCheck size={16} className="text-emerald-500" />
                  <b>{b.name}</b>
                </div>
                <span className="dnsbl-status-pill clean">Clean · Not Listed</span>
                <span className="dnsbl-check-time">Checked {b.checked}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

