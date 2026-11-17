'use client'

import { useState } from 'react'
import {
  Kanban,
  Plus,
  Search,
  Filter,
  DollarSign,
  Building2,
  Calendar,
  User,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  X,
  MoreHorizontal,
  TrendingUp,
  Tag,
  Briefcase,
} from 'lucide-react'

export type DealStage = 'lead' | 'qualified' | 'demo' | 'negotiation' | 'won'

export type Deal = {
  id: string
  title: string
  company: string
  contact: string
  amount: number
  stage: DealStage
  owner: string
  ownerInitials: string
  avatarColor: string
  priority: 'High' | 'Medium' | 'Low'
  closeDate: string
  probability: number
}

const INITIAL_DEALS: Deal[] = [
  {
    id: 'deal-1',
    title: 'Enterprise Email Cloud Migration',
    company: 'FinPulse Global',
    contact: 'Priya Shah',
    amount: 34000,
    stage: 'negotiation',
    owner: 'Alex Morgan',
    ownerInitials: 'AM',
    avatarColor: 'linear-gradient(135deg, #1374f8, #0ea5e9)',
    priority: 'High',
    closeDate: 'Dec 05, 2026',
    probability: 85,
  },
  {
    id: 'deal-2',
    title: 'Ecommerce Lifecycle Automations',
    company: 'CraftSphere Commerce',
    contact: 'Jordan Ellis',
    amount: 18500,
    stage: 'demo',
    owner: 'Jamie Diaz',
    ownerInitials: 'JD',
    avatarColor: 'linear-gradient(135deg, #7c3aed, #a855f7)',
    priority: 'High',
    closeDate: 'Nov 28, 2026',
    probability: 60,
  },
  {
    id: 'deal-3',
    title: 'High-Volume SMTP Relay Setup',
    company: 'NorthStar Cloud',
    contact: 'Avery Chen',
    amount: 22000,
    stage: 'qualified',
    owner: 'Sam Kim',
    ownerInitials: 'SK',
    avatarColor: 'linear-gradient(135deg, #059669, #10b981)',
    priority: 'Medium',
    closeDate: 'Dec 12, 2026',
    probability: 40,
  },
  {
    id: 'deal-4',
    title: 'Dedicated IP & Deliverability Shield',
    company: 'Beacon Media Labs',
    contact: 'Marcus Vance',
    amount: 14000,
    stage: 'won',
    owner: 'Alex Morgan',
    ownerInitials: 'AM',
    avatarColor: 'linear-gradient(135deg, #ea580c, #f59e0b)',
    priority: 'High',
    closeDate: 'Nov 14, 2026',
    probability: 100,
  },
  {
    id: 'deal-5',
    title: 'Inbound Webhook Routing Infrastructure',
    company: 'DevFlow Systems',
    contact: 'Elena Rostova',
    amount: 9500,
    stage: 'lead',
    owner: 'Jamie Diaz',
    ownerInitials: 'JD',
    avatarColor: 'linear-gradient(135deg, #2563eb, #38bdf8)',
    priority: 'Low',
    closeDate: 'Dec 20, 2026',
    probability: 25,
  },
  {
    id: 'deal-6',
    title: 'Transactional API Expansion Tier',
    company: 'SaaSify Platforms',
    contact: 'Leo Zhang',
    amount: 27500,
    stage: 'demo',
    owner: 'Alex Morgan',
    ownerInitials: 'AM',
    avatarColor: 'linear-gradient(135deg, #4f46e5, #06b6d4)',
    priority: 'High',
    closeDate: 'Dec 02, 2026',
    probability: 70,
  },
  {
    id: 'deal-7',
    title: 'Newsletter & SMS Cross-Channel Journey',
    company: 'Modern Retail Co.',
    contact: 'Sarah Jenkins',
    amount: 16000,
    stage: 'qualified',
    owner: 'Sam Kim',
    ownerInitials: 'SK',
    avatarColor: 'linear-gradient(135deg, #db2777, #f43f5e)',
    priority: 'Medium',
    closeDate: 'Dec 18, 2026',
    probability: 45,
  },
  {
    id: 'deal-8',
    title: 'Startup Email Scale Plan',
    company: 'Nova AI Labs',
    contact: 'David Miller',
    amount: 8000,
    stage: 'won',
    owner: 'Jamie Diaz',
    ownerInitials: 'JD',
    avatarColor: 'linear-gradient(135deg, #0d9488, #14b8a6)',
    priority: 'Low',
    closeDate: 'Nov 10, 2026',
    probability: 100,
  },
]

const STAGES: { id: DealStage; label: string; tone: string }[] = [
  { id: 'lead', label: 'Lead In', tone: '#64748b' },
  { id: 'qualified', label: 'Qualified', tone: '#0284c7' },
  { id: 'demo', label: 'Demo / Pitch', tone: '#7c3aed' },
  { id: 'negotiation', label: 'Negotiation', tone: '#ea580c' },
  { id: 'won', label: 'Won Deals', tone: '#16a34a' },
]

export function CrmDealsBoard({ onAction = () => {} }: { onAction?: (message: string) => void }) {
  const [deals, setDeals] = useState<Deal[]>(INITIAL_DEALS)
  const [search, setSearch] = useState('')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [modalOpen, setModalOpen] = useState(false)

  // Form State for new deal
  const [newTitle, setNewTitle] = useState('')
  const [newCompany, setNewCompany] = useState('')
  const [newContact, setNewContact] = useState('')
  const [newAmount, setNewAmount] = useState('15000')
  const [newStage, setNewStage] = useState<DealStage>('qualified')
  const [newPriority, setNewPriority] = useState<'High' | 'Medium' | 'Low'>('High')

  // Move deal to next or previous stage
  const moveDeal = (dealId: string, direction: 'next' | 'prev') => {
    setDeals((prev) =>
      prev.map((deal) => {
        if (deal.id !== dealId) return deal
        const stageIndex = STAGES.findIndex((s) => s.id === deal.stage)
        const newIndex = direction === 'next' ? Math.min(STAGES.length - 1, stageIndex + 1) : Math.max(0, stageIndex - 1)
        const nextStage = STAGES[newIndex].id
        onAction(`Moved “${deal.title}” to ${STAGES[newIndex].label}.`)
        return {
          ...deal,
          stage: nextStage,
          probability: nextStage === 'won' ? 100 : nextStage === 'negotiation' ? 85 : nextStage === 'demo' ? 65 : nextStage === 'qualified' ? 40 : 20,
        }
      })
    )
  }

  // Create new deal
  const handleCreateDeal = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim() || !newCompany.trim()) return

    const newDeal: Deal = {
      id: `deal-${Date.now()}`,
      title: newTitle.trim(),
      company: newCompany.trim(),
      contact: newContact.trim() || 'Key Decision Maker',
      amount: parseFloat(newAmount) || 10000,
      stage: newStage,
      owner: 'Alex Morgan',
      ownerInitials: 'AM',
      avatarColor: 'linear-gradient(135deg, #1374f8, #0ea5e9)',
      priority: newPriority,
      closeDate: 'Dec 30, 2026',
      probability: newStage === 'won' ? 100 : newStage === 'negotiation' ? 85 : 50,
    }

    setDeals((prev) => [newDeal, ...prev])
    setModalOpen(false)
    setNewTitle('')
    setNewCompany('')
    setNewContact('')
    onAction(`New deal “${newDeal.title}” created in ${newStage}.`)
  }

  // Filtered deals
  const filteredDeals = deals.filter((deal) => {
    const matchesSearch =
      deal.title.toLowerCase().includes(search.toLowerCase()) ||
      deal.company.toLowerCase().includes(search.toLowerCase()) ||
      deal.contact.toLowerCase().includes(search.toLowerCase())
    const matchesPriority = filterPriority === 'all' || deal.priority === filterPriority
    return matchesSearch && matchesPriority
  })

  // Calculate totals
  const totalPipelineValue = deals.reduce((acc, d) => acc + d.amount, 0)
  const wonDealsValue = deals.filter((d) => d.stage === 'won').reduce((acc, d) => acc + d.amount, 0)

  return (
    <div className="crm-deals-page">
      {/* Top Header Bar */}
      <div className="page-heading-row">
        <div>
          <div className="page-eyebrow">WORKSPACE / SALES CRM</div>
          <h1>Sales Pipeline & Deals</h1>
          <p>Track leads, active negotiations, deal values, and closing probabilities.</p>
        </div>
        <div className="page-heading-actions">
          <button className="button button-primary" onClick={() => setModalOpen(true)}>
            <Plus size={15} /> Add new deal
          </button>
        </div>
      </div>

      {/* Pipeline Summary Metrics Banner */}
      <div className="deals-summary-banner">
        <div className="deals-metric-item">
          <span className="metric-icon-pill icon-blue">
            <DollarSign size={18} />
          </span>
          <div>
            <small>Total Pipeline Value</small>
            <b>${totalPipelineValue.toLocaleString()}</b>
          </div>
        </div>
        <div className="deals-metric-divider" />
        <div className="deals-metric-item">
          <span className="metric-icon-pill icon-green">
            <CheckCircle2 size={18} />
          </span>
          <div>
            <small>Won Revenue</small>
            <b>${wonDealsValue.toLocaleString()}</b>
          </div>
        </div>
        <div className="deals-metric-divider" />
        <div className="deals-metric-item">
          <span className="metric-icon-pill icon-purple">
            <Briefcase size={18} />
          </span>
          <div>
            <small>Active Opportunities</small>
            <b>{deals.filter((d) => d.stage !== 'won').length} deals</b>
          </div>
        </div>
        <div className="deals-metric-divider" />
        <div className="deals-metric-item">
          <span className="metric-icon-pill icon-orange">
            <TrendingUp size={18} />
          </span>
          <div>
            <small>Avg. Deal Size</small>
            <b>${Math.round(totalPipelineValue / (deals.length || 1)).toLocaleString()}</b>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="deals-filter-bar">
        <div className="deals-search-box">
          <Search size={15} />
          <input
            type="text"
            placeholder="Search deals by title, company, or contact..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="clear-search-btn" onClick={() => setSearch('')}>
              <X size={14} />
            </button>
          )}
        </div>

        <div className="deals-filter-controls">
          <div className="filter-select-wrap">
            <Filter size={14} />
            <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
              <option value="all">All Priorities</option>
              <option value="High">High Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="Low">Low Priority</option>
            </select>
          </div>
          <span className="deals-count-label">{filteredDeals.length} deals visible</span>
        </div>
      </div>

      {/* Kanban Board Grid */}
      <div className="kanban-board-grid">
        {STAGES.map((stage) => {
          const stageDeals = filteredDeals.filter((d) => d.stage === stage.id)
          const stageTotal = stageDeals.reduce((sum, d) => sum + d.amount, 0)
          const stageIdx = STAGES.findIndex((s) => s.id === stage.id)

          return (
            <div key={stage.id} className="kanban-column">
              {/* Column Header */}
              <div className="kanban-column-header">
                <div className="column-title-group">
                  <span className="column-status-indicator" style={{ background: stage.tone }} />
                  <h3>{stage.label}</h3>
                  <span className="column-count-chip">{stageDeals.length}</span>
                </div>
                <div className="column-value-badge">${stageTotal.toLocaleString()}</div>
              </div>

              {/* Cards Container */}
              <div className="kanban-cards-container">
                {stageDeals.map((deal) => (
                  <div key={deal.id} className="kanban-deal-card">
                    <div className="deal-card-top">
                      <span className={`priority-tag priority-${deal.priority.toLowerCase()}`}>
                        {deal.priority}
                      </span>
                      <span className="deal-amount">${deal.amount.toLocaleString()}</span>
                    </div>

                    <h4 className="deal-title">{deal.title}</h4>

                    <div className="deal-company-row">
                      <Building2 size={13} />
                      <span>{deal.company}</span>
                      <span className="deal-contact-bullet">·</span>
                      <span className="deal-contact-name">{deal.contact}</span>
                    </div>

                    <div className="deal-probability-bar">
                      <div className="prob-label-row">
                        <small>Win Probability</small>
                        <b>{deal.probability}%</b>
                      </div>
                      <div className="prob-progress-track">
                        <div
                          className="prob-progress-fill"
                          style={{
                            width: `${deal.probability}%`,
                            background:
                              deal.probability > 75
                                ? '#16a34a'
                                : deal.probability > 45
                                ? '#0284c7'
                                : '#ea580c',
                          }}
                        />
                      </div>
                    </div>

                    <div className="deal-card-footer">
                      <div className="deal-owner-wrap" title={`Owner: ${deal.owner}`}>
                        <span className="owner-avatar" style={{ background: deal.avatarColor }}>
                          {deal.ownerInitials}
                        </span>
                        <span className="close-date">
                          <Calendar size={12} /> {deal.closeDate}
                        </span>
                      </div>

                      {/* Stage Movement Controls */}
                      <div className="stage-move-buttons">
                        {stageIdx > 0 && (
                          <button
                            type="button"
                            className="move-stage-btn"
                            title={`Move back to ${STAGES[stageIdx - 1].label}`}
                            onClick={() => moveDeal(deal.id, 'prev')}
                          >
                            <ArrowLeft size={13} />
                          </button>
                        )}
                        {stageIdx < STAGES.length - 1 && (
                          <button
                            type="button"
                            className="move-stage-btn"
                            title={`Advance to ${STAGES[stageIdx + 1].label}`}
                            onClick={() => moveDeal(deal.id, 'next')}
                          >
                            <ArrowRight size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {stageDeals.length === 0 && (
                  <div className="empty-column-box">
                    <p>No deals in this stage</p>
                    <button
                      type="button"
                      className="text-link"
                      onClick={() => {
                        setNewStage(stage.id)
                        setModalOpen(true)
                      }}
                    >
                      + Add a deal
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Add Deal Modal */}
      {modalOpen && (
        <div className="modal-backdrop">
          <div className="deal-modal-card">
            <div className="modal-head">
              <div>
                <h2>Create New Deal</h2>
                <p>Add a new sales opportunity to your pipeline.</p>
              </div>
              <button className="icon-button" onClick={() => setModalOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateDeal} className="deal-form">
              <label>
                Deal Title
                <input
                  type="text"
                  required
                  placeholder="e.g. Enterprise Sending Platform Migration"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </label>

              <div className="form-row-2">
                <label>
                  Company Name
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acme Health Corp"
                    value={newCompany}
                    onChange={(e) => setNewCompany(e.target.value)}
                  />
                </label>
                <label>
                  Key Contact
                  <input
                    type="text"
                    placeholder="e.g. Rachel Adams"
                    value={newContact}
                    onChange={(e) => setNewContact(e.target.value)}
                  />
                </label>
              </div>

              <div className="form-row-3">
                <label>
                  Value ($ USD)
                  <input
                    type="number"
                    min="500"
                    step="500"
                    required
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                  />
                </label>

                <label>
                  Initial Stage
                  <select value={newStage} onChange={(e) => setNewStage(e.target.value as DealStage)}>
                    {STAGES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Priority
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as 'High' | 'Medium' | 'Low')}
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </label>
              </div>

              <div className="modal-actions">
                <button type="button" className="button button-secondary" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="button button-primary">
                  Create Opportunity <ArrowRight size={14} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

