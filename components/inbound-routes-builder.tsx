'use client'

import { useState } from 'react'
import {
  Route,
  Plus,
  Play,
  ArrowRight,
  CheckCircle2,
  Trash2,
  Copy,
  Check,
  Code2,
  Globe,
  Settings,
  X,
  Sparkles,
} from 'lucide-react'

type InboundRule = {
  id: string
  name: string
  priority: number
  expression: string
  pattern: string
  forwardUrl: string
  storeMessage: boolean
  active: boolean
}

const INITIAL_ROUTES: InboundRule[] = [
  {
    id: 'route-1',
    name: 'Customer Support Auto-Ticket',
    priority: 0,
    expression: 'match_recipient',
    pattern: 'support@.*',
    forwardUrl: 'https://api.metrovps.com/webhooks/inbound-support',
    storeMessage: true,
    active: true,
  },
  {
    id: 'route-2',
    name: 'Billing & Invoice Processing',
    priority: 1,
    expression: 'match_recipient',
    pattern: 'billing@.*',
    forwardUrl: 'https://api.metrovps.com/webhooks/inbound-billing',
    storeMessage: true,
    active: true,
  },
  {
    id: 'route-3',
    name: 'Catch-all Parser & Forwarder',
    priority: 2,
    expression: 'catch_all',
    pattern: '.*',
    forwardUrl: 'https://api.metrovps.com/webhooks/inbound-catchall',
    storeMessage: false,
    active: true,
  },
]

export function InboundRoutesBuilder({ onAction = () => {} }: { onAction?: (message: string) => void }) {
  const [routes, setRoutes] = useState<InboundRule[]>(INITIAL_ROUTES)
  const [modalOpen, setModalOpen] = useState(false)

  // Tester state
  const [testEmail, setTestEmail] = useState('support@metrovps.com')
  const [testResult, setTestResult] = useState<string | null>(null)

  // Form State
  const [ruleName, setRuleName] = useState('')
  const [expression, setExpression] = useState('match_recipient')
  const [pattern, setPattern] = useState('contact@.*')
  const [forwardUrl, setForwardUrl] = useState('https://api.company.com/webhooks/incoming')
  const [storeMessage, setStoreMessage] = useState(true)

  const handleTestRoute = () => {
    const matched = routes.find((r) => {
      if (!r.active) return false
      if (r.expression === 'catch_all') return true
      const regex = new RegExp(r.pattern, 'i')
      return regex.test(testEmail)
    })

    if (matched) {
      setTestResult(`Matched Rule: “${matched.name}” (Priority ${matched.priority}) ➔ Forwarded to ${matched.forwardUrl}`)
      onAction(`Tested ${testEmail}: matched “${matched.name}”.`)
    } else {
      setTestResult('No active inbound route matched this recipient address.')
    }
  }

  const handleCreateRoute = (e: React.FormEvent) => {
    e.preventDefault()
    if (!ruleName.trim()) return

    const newRule: InboundRule = {
      id: `route-${Date.now()}`,
      name: ruleName.trim(),
      priority: routes.length,
      expression,
      pattern,
      forwardUrl,
      storeMessage,
      active: true,
    }

    setRoutes((prev) => [...prev, newRule])
    setModalOpen(false)
    setRuleName('')
    onAction(`New inbound route “${newRule.name}” created.`)
  }

  const toggleRouteActive = (id: string) => {
    setRoutes((prev) =>
      prev.map((r) => (r.id === id ? { ...r, active: !r.active } : r))
    )
  }

  return (
    <div className="inbound-routes-page">
      {/* Top Header */}
      <div className="page-heading-row">
        <div>
          <div className="page-eyebrow">DELIVERABILITY / INBOUND EMAIL ROUTING</div>
          <h1>Inbound Mail Routing & Parsing</h1>
          <p>Parse incoming messages, strip signatures, extract attachments, and post clean JSON payloads to webhooks.</p>
        </div>
        <div className="page-heading-actions">
          <button className="button button-primary" onClick={() => setModalOpen(true)}>
            <Plus size={15} /> Add Inbound Route
          </button>
        </div>
      </div>

      <div className="inbound-layout">
        {/* Left: Active Routes List */}
        <div className="inbound-routes-list-card">
          <div className="card-head">
            <div>
              <h3>Active Inbound Rules ({routes.length})</h3>
              <p>Evaluated sequentially in priority order.</p>
            </div>
            <span className="mx-verified-chip">
              <CheckCircle2 size={13} /> Inbound MX Configured
            </span>
          </div>

          <div className="routes-table">
            {routes.map((r) => (
              <div key={r.id} className={`route-row ${!r.active ? 'is-disabled' : ''}`}>
                <span className="priority-badge">#{r.priority}</span>
                <div className="route-info">
                  <b>{r.name}</b>
                  <div className="route-expression-code">
                    <code>
                      {r.expression}(&quot;{r.pattern}&quot;)
                    </code>
                    <span>➔</span>
                    <small>{r.forwardUrl}</small>
                  </div>
                </div>

                <div className="route-actions">
                  <button
                    type="button"
                    className={`toggle-switch ${r.active ? 'toggle-on' : ''}`}
                    onClick={() => toggleRouteActive(r.id)}
                    title={r.active ? 'Pause route' : 'Activate route'}
                  >
                    <i />
                  </button>
                  <button
                    type="button"
                    className="icon-btn-danger"
                    onClick={() => {
                      setRoutes((prev) => prev.filter((item) => item.id !== r.id))
                      onAction(`Deleted route “${r.name}”.`)
                    }}
                    title="Delete route"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Live Route Tester */}
        <div className="inbound-tester-card">
          <div className="card-head">
            <span className="tester-icon">
              <Play size={16} />
            </span>
            <div>
              <h3>Live Route Tester</h3>
              <p>Test recipient addresses against active routing rules.</p>
            </div>
          </div>

          <div className="tester-form">
            <label>
              Simulate Incoming Recipient:
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="support@metrovps.com"
              />
            </label>
            <button
              type="button"
              className="button button-primary"
              onClick={handleTestRoute}
            >
              <Play size={14} /> Evaluate Match
            </button>
          </div>

          {testResult && (
            <div className="tester-match-result">
              <Sparkles size={16} />
              <span>{testResult}</span>
            </div>
          )}

          <div className="payload-preview-box">
            <small>Sample Webhook JSON Payload Delivered to Your Server:</small>
            <pre>
              <code>{`{
  "sender": "customer@example.com",
  "recipient": "${testEmail}",
  "subject": "Need help with API key",
  "stripped-text": "Hello, my production webhook is returning 404.",
  "attachments": [],
  "timestamp": 1731792400
}`}</code>
            </pre>
          </div>
        </div>
      </div>

      {/* Add Route Modal */}
      {modalOpen && (
        <div className="modal-backdrop">
          <div className="route-modal-card">
            <div className="modal-head">
              <div>
                <h2>Create Inbound Rule</h2>
                <p>Filter incoming emails and forward parsed JSON to your webhook.</p>
              </div>
              <button className="icon-button" onClick={() => setModalOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateRoute} className="route-form">
              <label>
                Rule Name
                <input
                  type="text"
                  required
                  placeholder="e.g. Sales Inbound Ingestion"
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                />
              </label>

              <div className="form-row-2">
                <label>
                  Filter Expression
                  <select
                    value={expression}
                    onChange={(e) => setExpression(e.target.value)}
                  >
                    <option value="match_recipient">match_recipient (By Email)</option>
                    <option value="match_header">match_header (By Subject / Header)</option>
                    <option value="catch_all">catch_all (All remaining messages)</option>
                  </select>
                </label>

                <label>
                  Pattern / Regex
                  <input
                    type="text"
                    required
                    value={pattern}
                    onChange={(e) => setPattern(e.target.value)}
                    placeholder="sales@.*"
                  />
                </label>
              </div>

              <label>
                Destination Webhook URL
                <input
                  type="url"
                  required
                  value={forwardUrl}
                  onChange={(e) => setForwardUrl(e.target.value)}
                  placeholder="https://api.yourdomain.com/webhook"
                />
              </label>

              <label className="checkbox-toggle-row">
                <span>
                  <b>Store message in cloud storage</b>
                  <small>Keep raw MIME message for 30 days of re-delivery</small>
                </span>
                <input
                  type="checkbox"
                  checked={storeMessage}
                  onChange={(e) => setStoreMessage(e.target.checked)}
                />
              </label>

              <div className="modal-actions">
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="button button-primary">
                  Create Route <ArrowRight size={14} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

