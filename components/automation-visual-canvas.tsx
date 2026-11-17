'use client'

import { useState } from 'react'
import {
  Workflow,
  Sparkles,
  Mail,
  Clock,
  Split,
  Plus,
  ArrowRight,
  Check,
  CheckCircle2,
  X,
  Settings,
  ChevronDown,
  Play,
  Pause,
  Smartphone,
  Webhook,
  UserCheck,
  Zap,
} from 'lucide-react'

type StepType = 'trigger' | 'delay' | 'email' | 'sms' | 'condition' | 'attribute'

type WorkflowNode = {
  id: string
  type: StepType
  title: string
  subtitle: string
  stats: string
  branch?: 'yes' | 'no'
}

export function AutomationVisualCanvas({ onAction = () => {} }: { onAction?: (message: string) => void }) {
  const [isActive, setIsActive] = useState(true)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null)

  const [nodes, setNodes] = useState<WorkflowNode[]>([
    {
      id: 'node-1',
      type: 'trigger',
      title: 'Contact Subscribes',
      subtitle: 'List: Product updates (Website Signup)',
      stats: '1,204 entered',
    },
    {
      id: 'node-2',
      type: 'email',
      title: 'Welcome & Getting Started',
      subtitle: 'Email: Introduction to MetroMail Cloud',
      stats: '1,204 sent · 58.4% opened',
    },
    {
      id: 'node-3',
      type: 'delay',
      title: 'Wait for 2 Days',
      subtitle: 'Give new user time to explore the dashboard',
      stats: '1,092 passed',
    },
    {
      id: 'node-4',
      type: 'condition',
      title: 'Check If Email Was Opened',
      subtitle: 'Condition: Did recipient open Welcome Email?',
      stats: '782 YES · 310 NO',
    },
    {
      id: 'node-5',
      type: 'email',
      title: 'VIP Feature Walkthrough',
      subtitle: 'Branch: YES · Share API & SMTP quickstart',
      stats: '782 sent · 42.1% clicked',
      branch: 'yes',
    },
    {
      id: 'node-6',
      type: 'sms',
      title: 'Friendly SMS Reminder',
      subtitle: 'Branch: NO · Gentle mobile nudge',
      stats: '310 sent · 98% delivered',
      branch: 'no',
    },
  ])

  const handleAddStep = (type: StepType, title: string, subtitle: string) => {
    const newNode: WorkflowNode = {
      id: `node-${Date.now()}`,
      type,
      title,
      subtitle,
      stats: '0 enrolled',
    }
    setNodes((prev) => [...prev, newNode])
    setAddModalOpen(false)
    onAction(`New workflow step “${title}” added.`)
  }

  return (
    <div className="automation-canvas-page">
      {/* Top Header */}
      <div className="page-heading-row">
        <div>
          <div className="page-eyebrow">AUTOMATIONS / VISUAL JOURNEY BUILDER</div>
          <h1>Welcome & Lifecycle Journey</h1>
          <p>Visually sequence triggers, delay intervals, If/Else branching, and multi-channel actions.</p>
        </div>
        <div className="page-heading-actions">
          <button
            type="button"
            className={`button ${isActive ? 'button-primary' : 'button-secondary'}`}
            onClick={() => {
              setIsActive(!isActive)
              onAction(isActive ? 'Journey paused.' : 'Journey activated.')
            }}
          >
            {isActive ? <Pause size={14} /> : <Play size={14} />}
            <span>{isActive ? 'Pause Workflow' : 'Activate Workflow'}</span>
          </button>
          <button
            type="button"
            className="button button-secondary"
            onClick={() => setAddModalOpen(true)}
          >
            <Plus size={14} /> Add Action Step
          </button>
        </div>
      </div>

      {/* Main Flowchart Canvas */}
      <div className="canvas-wrapper">
        <div className="canvas-status-bar">
          <span className="live-pill">
            <span className={`pulse-dot ${isActive ? 'green' : 'amber'}`} />
            {isActive ? 'Active Journey · Listening for events' : 'Paused · Editing draft'}
          </span>
          <div className="canvas-meta-stats">
            <span>
              Total Enrolled: <b>1,204 contacts</b>
            </span>
            <span>·</span>
            <span>
              Avg Completion: <b>2.8 days</b>
            </span>
          </div>
        </div>

        {/* Visual Node Chain */}
        <div className="flow-canvas-body">
          {/* Node 1: Trigger */}
          <div className="canvas-node node-trigger">
            <div className="node-icon icon-purple">
              <Zap size={18} />
            </div>
            <div className="node-content">
              <small className="node-category">ENTRY TRIGGER</small>
              <h4>{nodes[0].title}</h4>
              <p>{nodes[0].subtitle}</p>
            </div>
            <span className="node-stats-pill">{nodes[0].stats}</span>
          </div>

          <div className="flow-connector-vertical">
            <i />
          </div>

          {/* Node 2: Email */}
          <div className="canvas-node node-action">
            <div className="node-icon icon-blue">
              <Mail size={18} />
            </div>
            <div className="node-content">
              <small className="node-category">SEND EMAIL ACTION</small>
              <h4>{nodes[1].title}</h4>
              <p>{nodes[1].subtitle}</p>
            </div>
            <span className="node-stats-pill">{nodes[1].stats}</span>
          </div>

          <div className="flow-connector-vertical">
            <i />
          </div>

          {/* Node 3: Delay */}
          <div className="canvas-node node-delay">
            <div className="node-icon icon-amber">
              <Clock size={18} />
            </div>
            <div className="node-content">
              <small className="node-category">TIME DELAY</small>
              <h4>{nodes[2].title}</h4>
              <p>{nodes[2].subtitle}</p>
            </div>
            <span className="node-stats-pill">{nodes[2].stats}</span>
          </div>

          <div className="flow-connector-vertical">
            <i />
          </div>

          {/* Node 4: Condition Split */}
          <div className="canvas-node node-condition">
            <div className="node-icon icon-cyan">
              <Split size={18} />
            </div>
            <div className="node-content">
              <small className="node-category">IF / ELSE DECISION BRANCH</small>
              <h4>{nodes[3].title}</h4>
              <p>{nodes[3].subtitle}</p>
            </div>
            <span className="node-stats-pill">{nodes[3].stats}</span>
          </div>

          {/* Split Branches: Yes / No */}
          <div className="branch-split-container">
            <div className="branch-column branch-yes">
              <div className="branch-label-pill pill-yes">
                <Check size={12} /> YES (Opened)
              </div>
              <div className="flow-connector-vertical">
                <i />
              </div>
              <div className="canvas-node node-action">
                <div className="node-icon icon-blue">
                  <Mail size={16} />
                </div>
                <div className="node-content">
                  <small className="node-category">EMAIL ACTION</small>
                  <h4>{nodes[4].title}</h4>
                  <p>{nodes[4].subtitle}</p>
                </div>
                <span className="node-stats-pill">{nodes[4].stats}</span>
              </div>
            </div>

            <div className="branch-column branch-no">
              <div className="branch-label-pill pill-no">
                <X size={12} /> NO (Did not open)
              </div>
              <div className="flow-connector-vertical">
                <i />
              </div>
              <div className="canvas-node node-action">
                <div className="node-icon icon-green">
                  <Smartphone size={16} />
                </div>
                <div className="node-content">
                  <small className="node-category">SMS ACTION</small>
                  <h4>{nodes[5].title}</h4>
                  <p>{nodes[5].subtitle}</p>
                </div>
                <span className="node-stats-pill">{nodes[5].stats}</span>
              </div>
            </div>
          </div>

          {/* Append Step Button */}
          <div className="flow-append-row">
            <button
              type="button"
              className="append-step-btn"
              onClick={() => setAddModalOpen(true)}
            >
              <Plus size={15} /> Add Next Step to Journey
            </button>
          </div>
        </div>
      </div>

      {/* Add Step Modal */}
      {addModalOpen && (
        <div className="modal-backdrop">
          <div className="step-picker-modal">
            <div className="modal-head">
              <div>
                <h2>Add Journey Step</h2>
                <p>Choose an action, delay, condition, or tag update.</p>
              </div>
              <button className="icon-button" onClick={() => setAddModalOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="step-picker-grid">
              <button
                type="button"
                className="step-option-card"
                onClick={() =>
                  handleAddStep('email', 'Follow-up Email', 'Send another helpful newsletter')
                }
              >
                <span className="opt-icon icon-blue">
                  <Mail size={18} />
                </span>
                <b>Send Email</b>
                <small>Deliver a campaign or transactional template</small>
              </button>

              <button
                type="button"
                className="step-option-card"
                onClick={() =>
                  handleAddStep('sms', 'SMS Mobile Alert', 'Deliver a time-sensitive text')
                }
              >
                <span className="opt-icon icon-green">
                  <Smartphone size={18} />
                </span>
                <b>Send SMS</b>
                <small>Send direct text message alert</small>
              </button>

              <button
                type="button"
                className="step-option-card"
                onClick={() =>
                  handleAddStep('delay', 'Wait 3 Days', 'Allow contact to digest previous email')
                }
              >
                <span className="opt-icon icon-amber">
                  <Clock size={18} />
                </span>
                <b>Wait Delay</b>
                <small>Pause for hours, days, or until specific date</small>
              </button>

              <button
                type="button"
                className="step-option-card"
                onClick={() =>
                  handleAddStep(
                    'condition',
                    'Check Link Click',
                    'Branch contacts based on link clicked'
                  )
                }
              >
                <span className="opt-icon icon-cyan">
                  <Split size={18} />
                </span>
                <b>If / Else Branch</b>
                <small>Split flow based on behavior or attribute</small>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

