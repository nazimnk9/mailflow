'use client'

import { useState } from 'react'
import {
  Sliders,
  Eye,
  Code2,
  Copy,
  Check,
  Plus,
  Trash2,
  Share2,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Laptop,
  Smartphone,
  Layers,
  Palette,
  ShieldCheck,
} from 'lucide-react'

type FormType = 'embedded' | 'popup' | 'floating'

export function FormBuilderView({ onAction = () => {} }: { onAction?: (message: string) => void }) {
  const [formType, setFormType] = useState<FormType>('embedded')
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop')

  // Form Content
  const [headline, setHeadline] = useState('Stay updated with product news')
  const [description, setDescription] = useState('Join 25,000+ engineers receiving our weekly high-performance sending notes.')
  const [buttonText, setButtonText] = useState('Subscribe to Updates')
  const [successMessage, setSuccessMessage] = useState('Thank you for subscribing! Check your inbox to confirm.')

  // Field Toggles
  const [includeName, setIncludeName] = useState(true)
  const [includePhone, setIncludePhone] = useState(false)
  const [includeGdpr, setIncludeGdpr] = useState(true)
  const [gdprText, setGdprText] = useState('I agree to receive product updates and agree to the Privacy Policy.')

  // Design Customization
  const [buttonBgColor, setButtonBgColor] = useState('#1374f8')
  const [buttonTextColor, setButtonTextColor] = useState('#ffffff')
  const [borderRadius, setBorderRadius] = useState('8')
  const [copiedCode, setCopiedCode] = useState(false)
  const [activeTab, setActiveTab] = useState<'design' | 'embed'>('design')

  // Embed Code Generator
  const embedCodeSnippet = `<!-- MetroMail Lead Capture Form (${formType}) -->
<div id="metromail-signup-container" data-form-type="${formType}"></div>
<script src="https://metromail.email/embed/v1/form.js" data-form-id="frm_demo_82a7f" async></script>`

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(embedCodeSnippet)
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 2000)
      onAction('Embed HTML code copied to clipboard.')
    } catch {
      onAction('Failed to copy to clipboard.')
    }
  }

  return (
    <div className="form-builder-page">
      {/* Page Heading */}
      <div className="page-heading-row">
        <div>
          <div className="page-eyebrow">CONTACTS / SIGNUP FORMS</div>
          <h1>Interactive Form Builder</h1>
          <p>Create high-converting embedded forms, popups, and floating subscription bars for your site.</p>
        </div>
        <div className="page-heading-actions">
          <div className="form-mode-pills">
            <button
              className={activeTab === 'design' ? 'active' : ''}
              onClick={() => setActiveTab('design')}
            >
              <Sliders size={14} /> Visual Designer
            </button>
            <button
              className={activeTab === 'embed' ? 'active' : ''}
              onClick={() => setActiveTab('embed')}
            >
              <Code2 size={14} /> Get Embed Code
            </button>
          </div>
          <button
            className="button button-primary"
            onClick={() => onAction('Form changes published live.')}
          >
            Publish Form <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {activeTab === 'design' ? (
        <div className="form-builder-layout">
          {/* Left: Customizer Controls Panel */}
          <div className="form-customizer-panel">
            {/* Form Type Selector */}
            <div className="customizer-section">
              <label className="section-label">Form Display Type</label>
              <div className="form-type-grid">
                <button
                  type="button"
                  className={`type-btn ${formType === 'embedded' ? 'active' : ''}`}
                  onClick={() => setFormType('embedded')}
                >
                  <b>Embedded Form</b>
                  <small>Inline on page</small>
                </button>
                <button
                  type="button"
                  className={`type-btn ${formType === 'popup' ? 'active' : ''}`}
                  onClick={() => setFormType('popup')}
                >
                  <b>Pop-up Modal</b>
                  <small>Trigger on exit/time</small>
                </button>
                <button
                  type="button"
                  className={`type-btn ${formType === 'floating' ? 'active' : ''}`}
                  onClick={() => setFormType('floating')}
                >
                  <b>Floating Bar</b>
                  <small>Sticky top/bottom</small>
                </button>
              </div>
            </div>

            {/* Content Customization */}
            <div className="customizer-section">
              <label className="section-label">Content & Copy</label>
              <div className="customizer-fields">
                <label>
                  Headline
                  <input
                    type="text"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                  />
                </label>
                <label>
                  Description
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </label>
                <label>
                  Button Text
                  <input
                    type="text"
                    value={buttonText}
                    onChange={(e) => setButtonText(e.target.value)}
                  />
                </label>
              </div>
            </div>

            {/* Field Toggles */}
            <div className="customizer-section">
              <label className="section-label">Form Fields</label>
              <div className="toggles-list">
                <label className="checkbox-toggle-row">
                  <span>
                    <b>Email Address</b>
                    <small>Primary identifier (Required)</small>
                  </span>
                  <input type="checkbox" checked disabled />
                </label>

                <label className="checkbox-toggle-row">
                  <span>
                    <b>First Name</b>
                    <small>Collect contact name for personalizing</small>
                  </span>
                  <input
                    type="checkbox"
                    checked={includeName}
                    onChange={(e) => setIncludeName(e.target.checked)}
                  />
                </label>

                <label className="checkbox-toggle-row">
                  <span>
                    <b>Phone Number</b>
                    <small>Collect phone for SMS campaigns</small>
                  </span>
                  <input
                    type="checkbox"
                    checked={includePhone}
                    onChange={(e) => setIncludePhone(e.target.checked)}
                  />
                </label>

                <label className="checkbox-toggle-row">
                  <span>
                    <b>GDPR Consent Checkbox</b>
                    <small>Compliance opt-in consent</small>
                  </span>
                  <input
                    type="checkbox"
                    checked={includeGdpr}
                    onChange={(e) => setIncludeGdpr(e.target.checked)}
                  />
                </label>
              </div>
            </div>

            {/* Styling Controls */}
            <div className="customizer-section">
              <label className="section-label">Styling & Colors</label>
              <div className="styling-controls-grid">
                <label>
                  Button Color
                  <div className="color-input-wrap">
                    <input
                      type="color"
                      value={buttonBgColor}
                      onChange={(e) => setButtonBgColor(e.target.value)}
                    />
                    <code>{buttonBgColor}</code>
                  </div>
                </label>

                <label>
                  Corner Radius: {borderRadius}px
                  <input
                    type="range"
                    min="0"
                    max="24"
                    value={borderRadius}
                    onChange={(e) => setBorderRadius(e.target.value)}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Right: Real-time Live Form Preview Canvas */}
          <div className="form-preview-workspace">
            <div className="preview-toolbar">
              <div className="device-switch-wrap">
                <button
                  type="button"
                  className={previewDevice === 'desktop' ? 'active' : ''}
                  onClick={() => setPreviewDevice('desktop')}
                >
                  <Laptop size={14} /> Desktop Preview
                </button>
                <button
                  type="button"
                  className={previewDevice === 'mobile' ? 'active' : ''}
                  onClick={() => setPreviewDevice('mobile')}
                >
                  <Smartphone size={14} /> Mobile View
                </button>
              </div>
              <span className="live-preview-tag">
                <span className="live-dot" /> Live Preview
              </span>
            </div>

            <div className={`form-preview-canvas-container device-${previewDevice}`}>
              <div className={`rendered-form-wrapper form-type-${formType}`}>
                {formType === 'popup' && (
                  <div className="popup-backdrop-simulation">
                    <div className="popup-close-x">&times;</div>
                  </div>
                )}

                <div
                  className="interactive-form-card"
                  style={{ borderRadius: `${borderRadius}px` }}
                >
                  <div className="form-card-header">
                    <span className="form-icon-mark">
                      <Sparkles size={18} />
                    </span>
                    <h3>{headline}</h3>
                    <p>{description}</p>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      onAction('Form submission simulated.')
                    }}
                    className="live-rendered-form"
                  >
                    {includeName && (
                      <div className="rendered-field">
                        <label>Your Name</label>
                        <input
                          type="text"
                          placeholder="Alex Morgan"
                          style={{ borderRadius: `${Math.max(4, parseInt(borderRadius) - 2)}px` }}
                        />
                      </div>
                    )}

                    <div className="rendered-field">
                      <label>Work Email</label>
                      <input
                        type="email"
                        required
                        placeholder="alex@company.com"
                        style={{ borderRadius: `${Math.max(4, parseInt(borderRadius) - 2)}px` }}
                      />
                    </div>

                    {includePhone && (
                      <div className="rendered-field">
                        <label>Phone Number (SMS)</label>
                        <input
                          type="tel"
                          placeholder="+1 (555) 019-2834"
                          style={{ borderRadius: `${Math.max(4, parseInt(borderRadius) - 2)}px` }}
                        />
                      </div>
                    )}

                    {includeGdpr && (
                      <label className="rendered-gdpr-check">
                        <input type="checkbox" defaultChecked />
                        <span>{gdprText}</span>
                      </label>
                    )}

                    <button
                      type="submit"
                      className="rendered-submit-btn"
                      style={{
                        background: buttonBgColor,
                        color: buttonTextColor,
                        borderRadius: `${borderRadius}px`,
                      }}
                    >
                      {buttonText} <ArrowRight size={14} />
                    </button>
                  </form>

                  <div className="form-card-foot">
                    <ShieldCheck size={13} />
                    <span>We respect your privacy. One-click unsubscribe at any time.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Embed Code & Integration Tab */
        <div className="form-embed-view">
          <div className="embed-card">
            <div className="embed-card-head">
              <div>
                <h2>Copy Your Embed Snippet</h2>
                <p>Paste this JavaScript snippet into your HTML, Webflow, WordPress, or React app.</p>
              </div>
              <button className="button button-primary" onClick={handleCopyCode}>
                {copiedCode ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedCode ? 'Copied Snippet!' : 'Copy Code'}</span>
              </button>
            </div>

            <pre className="embed-code-block">
              <code>{embedCodeSnippet}</code>
            </pre>

            <div className="embed-options-grid">
              <div className="embed-option-box">
                <b>Double Opt-in Engine</b>
                <p>Contacts will receive an automated activation link before entering marketing segments.</p>
                <span className="badge-active">Enabled</span>
              </div>

              <div className="embed-option-box">
                <b>Default Target List</b>
                <p>Submissions automatically routed to &ldquo;Website Signups&rdquo; list.</p>
                <span className="badge-target">Product updates (6,890 contacts)</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

