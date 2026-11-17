'use client'

import { useState } from 'react'
import {
  CheckCheck,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Search,
  Upload,
  ArrowRight,
  Download,
  FileSpreadsheet,
  RefreshCw,
  Sparkles,
  HelpCircle,
  Sliders,
} from 'lucide-react'

type ValidationResult = {
  email: string
  status: 'deliverable' | 'risky' | 'undeliverable'
  score: number // 0-100
  syntax: boolean
  domain: string
  mxRecords: boolean
  mxHost: string
  disposable: boolean
  roleAccount: boolean
  freeMailbox: boolean
  suggestion?: string
  didYouMean?: string
}

export function EmailValidatorTool({ onAction = () => {} }: { onAction?: (message: string) => void }) {
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single')
  const [inputEmail, setInputEmail] = useState('alex.morgan@metrovps.com')
  const [isVerifying, setIsVerifying] = useState(false)
  const [currentResult, setCurrentResult] = useState<ValidationResult | null>({
    email: 'alex.morgan@metrovps.com',
    status: 'deliverable',
    score: 98,
    syntax: true,
    domain: 'metrovps.com',
    mxRecords: true,
    mxHost: 'aspmx.l.google.com (Priority 1)',
    disposable: false,
    roleAccount: false,
    freeMailbox: false,
  })

  // Bulk state
  const [bulkUploaded, setBulkUploaded] = useState(false)
  const [bulkProcessing, setBulkProcessing] = useState(false)
  const [bulkStats, setBulkStats] = useState({
    total: 10420,
    deliverable: 9680,
    deliverableRate: 92.9,
    risky: 540,
    riskyRate: 5.2,
    undeliverable: 200,
    undeliverableRate: 1.9,
    disposableBlocked: 142,
  })

  // Handle single test
  const handleVerifySingle = (emailToTest?: string) => {
    const target = emailToTest || inputEmail.trim()
    if (!target) return

    setIsVerifying(true)
    setTimeout(() => {
      setIsVerifying(false)

      const lower = target.toLowerCase()
      let res: ValidationResult

      if (lower.includes('tempmail') || lower.includes('throwaway') || lower.includes('mailinator')) {
        res = {
          email: target,
          status: 'undeliverable',
          score: 12,
          syntax: true,
          domain: target.split('@')[1] || 'tempmail.org',
          mxRecords: true,
          mxHost: 'mx.tempmail.org',
          disposable: true,
          roleAccount: false,
          freeMailbox: false,
          suggestion: 'Disposable address detected. High risk of immediate bounce.',
        }
      } else if (lower.includes('gmaill.com') || lower.includes('yaho.com')) {
        res = {
          email: target,
          status: 'risky',
          score: 45,
          syntax: true,
          domain: target.split('@')[1] || '',
          mxRecords: false,
          mxHost: 'No MX record found for domain',
          disposable: false,
          roleAccount: false,
          freeMailbox: true,
          didYouMean: lower.replace('gmaill.com', 'gmail.com').replace('yaho.com', 'yahoo.com'),
          suggestion: 'Domain has typo and lacks active mail exchange servers.',
        }
      } else if (lower.startsWith('support@') || lower.startsWith('info@') || lower.startsWith('sales@')) {
        res = {
          email: target,
          status: 'risky',
          score: 68,
          syntax: true,
          domain: target.split('@')[1] || 'company.com',
          mxRecords: true,
          mxHost: 'mail.company.com',
          disposable: false,
          roleAccount: true,
          freeMailbox: false,
          suggestion: 'Role-based group alias. Lower engagement probability.',
        }
      } else {
        res = {
          email: target,
          status: 'deliverable',
          score: 98,
          syntax: true,
          domain: target.split('@')[1] || 'gmail.com',
          mxRecords: true,
          mxHost: 'aspmx.l.google.com (Verified)',
          disposable: false,
          roleAccount: false,
          freeMailbox: lower.includes('gmail.com') || lower.includes('outlook.com'),
          suggestion: 'Safe to send. Mailbox confirmed active with healthy reputation.',
        }
      }

      setCurrentResult(res)
      onAction(`Email verification complete for ${target}: ${res.status.toUpperCase()} (${res.score}/100).`)
    }, 450)
  }

  const handleSimulateBulk = () => {
    setBulkProcessing(true)
    setTimeout(() => {
      setBulkProcessing(false)
      setBulkUploaded(true)
      onAction('Bulk verification of 10,420 contacts completed. 9,680 deliverable.')
    }, 700)
  }

  return (
    <div className="email-validator-page">
      {/* Page Heading */}
      <div className="page-heading-row">
        <div>
          <div className="page-eyebrow">DELIVERABILITY / EMAIL VALIDATION</div>
          <h1>Email Verification & Hygiene</h1>
          <p>Prevent hard bounces, eliminate fake emails, and protect sender reputation before sending.</p>
        </div>
        <div className="page-heading-actions">
          <div className="validator-nav-pills">
            <button
              className={activeTab === 'single' ? 'active' : ''}
              onClick={() => setActiveTab('single')}
            >
              Single Validator
            </button>
            <button
              className={activeTab === 'bulk' ? 'active' : ''}
              onClick={() => setActiveTab('bulk')}
            >
              Bulk List Hygiene
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'single' ? (
        <div className="validator-single-layout">
          {/* Input Box Card */}
          <div className="validator-input-card">
            <div className="validator-card-header">
              <span className="validator-badge-icon">
                <CheckCheck size={18} />
              </span>
              <div>
                <h2>Real-time Email Check</h2>
                <p>Run instant DNS, MX, SMTP ping, and syntax analysis.</p>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleVerifySingle()
              }}
              className="validator-form"
            >
              <div className="validator-search-bar">
                <Search size={16} />
                <input
                  type="email"
                  required
                  placeholder="Enter any email address to verify..."
                  value={inputEmail}
                  onChange={(e) => setInputEmail(e.target.value)}
                />
                <button type="submit" className="button button-primary" disabled={isVerifying}>
                  {isVerifying ? (
                    <>
                      <RefreshCw size={14} className="spin-icon" /> Checking...
                    </>
                  ) : (
                    <>
                      Verify Now <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="validator-presets-row">
              <span>Try test cases:</span>
              <button
                type="button"
                onClick={() => {
                  setInputEmail('sarah.connor@gmail.com')
                  handleVerifySingle('sarah.connor@gmail.com')
                }}
              >
                Deliverable
              </button>
              <button
                type="button"
                onClick={() => {
                  setInputEmail('user992@tempmail.org')
                  handleVerifySingle('user992@tempmail.org')
                }}
              >
                Disposable Fake
              </button>
              <button
                type="button"
                onClick={() => {
                  setInputEmail('alex@gmaill.com')
                  handleVerifySingle('alex@gmaill.com')
                }}
              >
                Domain Typo
              </button>
              <button
                type="button"
                onClick={() => {
                  setInputEmail('support@company.com')
                  handleVerifySingle('support@company.com')
                }}
              >
                Role Account
              </button>
            </div>
          </div>

          {/* Verification Results Panel */}
          {currentResult && (
            <div className={`validator-results-card status-${currentResult.status}`}>
              <div className="results-top-bar">
                <div className="results-status-lockup">
                  <span className={`status-badge-pill tone-${currentResult.status}`}>
                    {currentResult.status === 'deliverable' && <CheckCircle2 size={16} />}
                    {currentResult.status === 'risky' && <AlertTriangle size={16} />}
                    {currentResult.status === 'undeliverable' && <XCircle size={16} />}
                    {currentResult.status === 'deliverable'
                      ? 'Safe to Send'
                      : currentResult.status === 'risky'
                      ? 'Risky Email'
                      : 'Undeliverable'}
                  </span>
                  <h3 className="tested-email">{currentResult.email}</h3>
                </div>

                <div className="score-meter-box">
                  <div className="score-number-wrap">
                    <span className="score-number">{currentResult.score}</span>
                    <span className="score-denom">/100</span>
                  </div>
                  <small>Deliverability Score</small>
                </div>
              </div>

              {currentResult.didYouMean && (
                <div className="typo-callout">
                  <Sparkles size={16} />
                  <span>
                    Did you mean <b>{currentResult.didYouMean}</b>?
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setInputEmail(currentResult.didYouMean!)
                      handleVerifySingle(currentResult.didYouMean)
                    }}
                  >
                    Check corrected
                  </button>
                </div>
              )}

              {/* Detailed Breakdown Grid */}
              <div className="verification-checks-grid">
                <div className="check-item">
                  <span className="check-status-icon icon-pass">
                    <CheckCircle2 size={15} />
                  </span>
                  <div>
                    <b>RFC 5322 Syntax</b>
                    <small>Proper email format structure</small>
                  </div>
                  <span className="check-value pass">Passed</span>
                </div>

                <div className="check-item">
                  <span
                    className={`check-status-icon ${currentResult.mxRecords ? 'icon-pass' : 'icon-fail'}`}
                  >
                    {currentResult.mxRecords ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
                  </span>
                  <div>
                    <b>DNS & MX Records</b>
                    <small>{currentResult.mxHost}</small>
                  </div>
                  <span className={`check-value ${currentResult.mxRecords ? 'pass' : 'fail'}`}>
                    {currentResult.mxRecords ? 'Found' : 'Missing'}
                  </span>
                </div>

                <div className="check-item">
                  <span
                    className={`check-status-icon ${!currentResult.disposable ? 'icon-pass' : 'icon-fail'}`}
                  >
                    {!currentResult.disposable ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
                  </span>
                  <div>
                    <b>Disposable / Throwaway</b>
                    <small>Known temporary email services</small>
                  </div>
                  <span className={`check-value ${!currentResult.disposable ? 'pass' : 'fail'}`}>
                    {currentResult.disposable ? 'Detected' : 'Clean'}
                  </span>
                </div>

                <div className="check-item">
                  <span
                    className={`check-status-icon ${!currentResult.roleAccount ? 'icon-pass' : 'icon-warn'}`}
                  >
                    {!currentResult.roleAccount ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
                  </span>
                  <div>
                    <b>Role / Group Account</b>
                    <small>Generic support/info/billing alias</small>
                  </div>
                  <span className={`check-value ${!currentResult.roleAccount ? 'pass' : 'warn'}`}>
                    {currentResult.roleAccount ? 'Role Alias' : 'Personal'}
                  </span>
                </div>
              </div>

              {currentResult.suggestion && (
                <div className="recommendation-foot">
                  <HelpCircle size={15} />
                  <span>{currentResult.suggestion}</span>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Bulk List Hygiene View */
        <div className="validator-bulk-layout">
          <div className="bulk-dropzone-card">
            <div className="bulk-dropzone-inner">
              <span className="bulk-upload-circle">
                <Upload size={24} />
              </span>
              <h3>Upload Contact List for Verification</h3>
              <p>Drag and drop your audience CSV or TXT file to scrub bounces and spam traps.</p>

              <div className="dropzone-actions">
                <button
                  type="button"
                  className="button button-primary"
                  onClick={handleSimulateBulk}
                  disabled={bulkProcessing}
                >
                  {bulkProcessing ? (
                    <>
                      <RefreshCw size={14} className="spin-icon" /> Scrubbing 10,420 Contacts...
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet size={15} /> Select Audience CSV
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={handleSimulateBulk}
                >
                  Verify Sample List (10k Contacts)
                </button>
              </div>
              <small>Supports .CSV, .XLSX up to 250,000 contacts per batch</small>
            </div>
          </div>

          {bulkUploaded && (
            <div className="bulk-results-card">
              <div className="bulk-results-head">
                <div>
                  <h3>List Scrubbing Summary</h3>
                  <p>10,420 total contacts verified across global DNS and Mailbox databases.</p>
                </div>
                <button
                  className="button button-secondary"
                  onClick={() => onAction('Cleaned audience CSV exported.')}
                >
                  <Download size={14} /> Export Clean List (9,680)
                </button>
              </div>

              <div className="bulk-stats-ribbon">
                <div className="bulk-stat-pill tone-green">
                  <b>{bulkStats.deliverable.toLocaleString()}</b>
                  <span>Deliverable ({bulkStats.deliverableRate}%)</span>
                </div>
                <div className="bulk-stat-pill tone-orange">
                  <b>{bulkStats.risky.toLocaleString()}</b>
                  <span>Risky Catch-all ({bulkStats.riskyRate}%)</span>
                </div>
                <div className="bulk-stat-pill tone-red">
                  <b>{bulkStats.undeliverable.toLocaleString()}</b>
                  <span>Invalid / Bounces ({bulkStats.undeliverableRate}%)</span>
                </div>
                <div className="bulk-stat-pill tone-purple">
                  <b>{bulkStats.disposableBlocked}</b>
                  <span>Spam Traps & Disposable</span>
                </div>
              </div>

              <div className="bulk-progress-bar-wrap">
                <div
                  className="bar-segment bar-green"
                  style={{ width: `${bulkStats.deliverableRate}%` }}
                  title="Deliverable"
                />
                <div
                  className="bar-segment bar-orange"
                  style={{ width: `${bulkStats.riskyRate}%` }}
                  title="Risky"
                />
                <div
                  className="bar-segment bar-red"
                  style={{ width: `${bulkStats.undeliverableRate}%` }}
                  title="Undeliverable"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

