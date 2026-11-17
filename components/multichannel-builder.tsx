'use client'

import { useState } from 'react'
import {
  Smartphone,
  MessageSquare,
  Send,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Phone,
  Globe,
  ExternalLink,
  Clock,
  Check,
  ShieldCheck,
  Users,
} from 'lucide-react'

type ChannelType = 'sms' | 'whatsapp'

export function MultiChannelBuilder({
  initialChannel = 'sms',
  onAction = () => {},
}: {
  initialChannel?: ChannelType
  onAction?: (message: string) => void
}) {
  const [channel, setChannel] = useState<ChannelType>(initialChannel)

  // SMS State
  const [smsSenderId, setSmsSenderId] = useState('MetroMail')
  const [smsCampaignName, setSmsCampaignName] = useState('Black Friday VIP Early Access')
  const [smsText, setSmsText] = useState(
    'Hi {{contact.FIRSTNAME}}! Your early access to the MetroVPS Black Friday cloud deals is now live. Use code CLOUD50 for 50% off: https://mvm.to/bf26 Reply STOP to opt-out.'
  )
  const [includeOptOut, setIncludeOptOut] = useState(true)

  // WhatsApp State
  const [waSenderNumber, setWaSenderNumber] = useState('+1 (888) 249-1024 (MetroVPS Verified)')
  const [waCampaignName, setWaCampaignName] = useState('Order Delivery Notification')
  const [waTemplate, setWaTemplate] = useState('order_update_v2')
  const [waCustomerName, setWaCustomerName] = useState('Alex')
  const [waOrderId, setWaOrderId] = useState('#MVP-94821')
  const [waTrackingLink, setWaTrackingLink] = useState('https://metrovps.com/track/94821')

  // Calculate SMS stats
  const smsCharCount = smsText.length
  const smsSegments = Math.ceil(smsCharCount / 160) || 1

  const handleSendTest = () => {
    onAction(`Test ${channel.toUpperCase()} message dispatched to your verified number.`)
  }

  return (
    <div className="multichannel-builder-page">
      {/* Page Heading */}
      <div className="page-heading-row">
        <div>
          <div className="page-eyebrow">CAMPAIGNS / MULTI-CHANNEL MESSAGING</div>
          <h1>{channel === 'sms' ? 'SMS Campaign Designer' : 'WhatsApp Business Campaign'}</h1>
          <p>Deliver urgent updates, time-sensitive promotions, and OTP alerts directly to your customers&apos; phones.</p>
        </div>
        <div className="page-heading-actions">
          <div className="channel-toggle-pills">
            <button
              type="button"
              className={channel === 'sms' ? 'active' : ''}
              onClick={() => setChannel('sms')}
            >
              <Smartphone size={14} /> SMS Broadcast
            </button>
            <button
              type="button"
              className={channel === 'whatsapp' ? 'active' : ''}
              onClick={() => setChannel('whatsapp')}
            >
              <MessageSquare size={14} /> WhatsApp Business
            </button>
          </div>
          <button className="button button-primary" onClick={handleSendTest}>
            <Send size={14} /> Send Test Message
          </button>
        </div>
      </div>

      <div className="multichannel-layout">
        {/* Left Column: Form & Configuration */}
        <div className="channel-config-card">
          {channel === 'sms' ? (
            /* SMS Configuration */
            <div className="channel-fields-wrap">
              <div className="config-card-head">
                <span className="channel-badge-icon icon-sms">
                  <Smartphone size={18} />
                </span>
                <div>
                  <h3>SMS Message Details</h3>
                  <p>Configure sender ID, personalization tags, and compliance text.</p>
                </div>
              </div>

              <div className="form-grid">
                <label>
                  Campaign Name
                  <input
                    type="text"
                    value={smsCampaignName}
                    onChange={(e) => setSmsCampaignName(e.target.value)}
                  />
                </label>

                <div className="form-row-2">
                  <label>
                    Sender ID
                    <input
                      type="text"
                      maxLength={11}
                      value={smsSenderId}
                      onChange={(e) => setSmsSenderId(e.target.value)}
                    />
                  </label>
                  <label>
                    Target Audience
                    <select defaultValue="Engaged customers (8,204 contacts)">
                      <option>Engaged customers (8,204 contacts)</option>
                      <option>All opted-in SMS contacts (14,210)</option>
                      <option>VIP Buyers (1,420)</option>
                    </select>
                  </label>
                </div>

                <label>
                  SMS Message Body
                  <textarea
                    rows={5}
                    value={smsText}
                    onChange={(e) => setSmsText(e.target.value)}
                  />
                </label>

                {/* Character & GSM Counter Bar */}
                <div className="char-counter-strip">
                  <div className="counter-metrics">
                    <span>
                      Characters: <b>{smsCharCount}</b> / 160
                    </span>
                    <span>·</span>
                    <span>
                      Message Credits: <b>{smsSegments} SMS</b> per recipient
                    </span>
                  </div>
                  <span className="gsm-badge">Standard GSM 7-bit</span>
                </div>

                <label className="checkbox-toggle-row">
                  <span>
                    <b>Automatic Opt-out text</b>
                    <small>Appends &ldquo;Reply STOP to opt-out&rdquo; for TCPA compliance</small>
                  </span>
                  <input
                    type="checkbox"
                    checked={includeOptOut}
                    onChange={(e) => setIncludeOptOut(e.target.checked)}
                  />
                </label>
              </div>
            </div>
          ) : (
            /* WhatsApp Configuration */
            <div className="channel-fields-wrap">
              <div className="config-card-head">
                <span className="channel-badge-icon icon-wa">
                  <MessageSquare size={18} />
                </span>
                <div>
                  <h3>WhatsApp Business Template</h3>
                  <p>Select pre-approved Meta WhatsApp templates with interactive buttons.</p>
                </div>
              </div>

              <div className="form-grid">
                <label>
                  Campaign Name
                  <input
                    type="text"
                    value={waCampaignName}
                    onChange={(e) => setWaCampaignName(e.target.value)}
                  />
                </label>

                <div className="form-row-2">
                  <label>
                    WhatsApp Business Account
                    <input type="text" readOnly value={waSenderNumber} />
                  </label>
                  <label>
                    Approved Meta Template
                    <select
                      value={waTemplate}
                      onChange={(e) => setWaTemplate(e.target.value)}
                    >
                      <option value="order_update_v2">order_update_v2 (Shipping & Tracking)</option>
                      <option value="account_alert_v1">account_alert_v1 (Security Notice)</option>
                      <option value="promo_flash_v3">promo_flash_v3 (Marketing Broadcast)</option>
                    </select>
                  </label>
                </div>

                <div className="template-variables-box">
                  <h4>Template Variables (Personalization)</h4>
                  <div className="form-row-2">
                    <label>
                      Variable {'{{1}}'} (Customer Name)
                      <input
                        type="text"
                        value={waCustomerName}
                        onChange={(e) => setWaCustomerName(e.target.value)}
                      />
                    </label>
                    <label>
                      Variable {'{{2}}'} (Order / Ticket ID)
                      <input
                        type="text"
                        value={waOrderId}
                        onChange={(e) => setWaOrderId(e.target.value)}
                      />
                    </label>
                  </div>
                  <label>
                    Tracking URL
                    <input
                      type="url"
                      value={waTrackingLink}
                      onChange={(e) => setWaTrackingLink(e.target.value)}
                    />
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Realistic Smartphone Screen Preview */}
        <div className="smartphone-preview-wrapper">
          <div className="smartphone-frame">
            {/* Phone Speaker & Camera Notch */}
            <div className="phone-top-notch">
              <span className="camera-dot" />
              <span className="speaker-slot" />
            </div>

            {channel === 'sms' ? (
              /* iOS iMessage Preview */
              <div className="phone-screen screen-imessage">
                <div className="imessage-header">
                  <span className="sender-avatar">{smsSenderId.slice(0, 2).toUpperCase()}</span>
                  <b className="sender-name">{smsSenderId}</b>
                  <small>SMS / Text Message</small>
                </div>

                <div className="imessage-content-area">
                  <div className="message-timestamp">Today 10:42 AM</div>
                  <div className="imessage-bubble outgoing">
                    <p>{smsText}</p>
                    <span className="bubble-time">10:42 AM</span>
                  </div>
                </div>

                <div className="imessage-bottom-input">
                  <span>Text Message</span>
                </div>
              </div>
            ) : (
              /* WhatsApp Official Chat Preview */
              <div className="phone-screen screen-whatsapp">
                <div className="whatsapp-header">
                  <div className="wa-avatar">M</div>
                  <div className="wa-contact-meta">
                    <b>MetroVPS Cloud</b>
                    <span className="wa-verified">
                      <CheckCircle2 size={12} /> Official Business
                    </span>
                  </div>
                </div>

                <div className="whatsapp-chat-area">
                  <div className="wa-date-pill">TODAY</div>
                  <div className="whatsapp-message-bubble">
                    <h5 className="wa-bubble-heading">Order Dispatched</h5>
                    <p>
                      Hello <b>{waCustomerName}</b>! Your MetroVPS order <b>{waOrderId}</b> has been
                      successfully processed and dispatched.
                    </p>
                    <p className="wa-body-sub">
                      You can track your package progress live using the button below.
                    </p>
                    <span className="wa-time-read">
                      10:44 AM <Check size={12} className="wa-double-check" />
                    </span>

                    {/* WhatsApp Action Buttons */}
                    <div className="wa-bubble-actions">
                      <a
                        href={waTrackingLink}
                        target="_blank"
                        rel="noreferrer"
                        className="wa-btn-link"
                      >
                        <ExternalLink size={13} /> Track Package
                      </a>
                      <button type="button" className="wa-btn-link">
                        <Phone size={13} /> Call Support
                      </button>
                    </div>
                  </div>
                </div>

                <div className="whatsapp-bottom-bar">
                  <span>Type a message...</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

