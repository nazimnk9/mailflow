export type EmailTemplate = {
  id: string
  name: string
  category: 'Marketing' | 'Traditional' | 'Transactional'
  tag: string
  color: string
  description: string
  subject: string
  preheader: string
  html: string
  plainText: string
}

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'saas-launch',
    name: 'Product Launch & Feature Announcement',
    category: 'Marketing',
    tag: 'Feature Release',
    color: 'blue',
    description: 'High-converting announcement template with gradient hero, feature highlight cards, and social proof.',
    subject: 'Introducing MetroMail v2.4: Smarter Delivery & AI Insights',
    preheader: 'See what is new in the latest update to boost your email performance.',
    plainText: `METROMAIL - PRODUCT UPDATE (v2.4)
=====================================

Hey {{first_name}},

We are thrilled to introduce MetroMail v2.4 — our biggest update yet, engineered to keep your messages in the primary inbox.

WHAT'S NEW:
* Smart Queueing: Intelligently balance send volume across Gmail, Outlook, and Yahoo.
* Reputation Shield: Real-time domain protection and instant DKIM health alerts.
* Sub-Second Webhooks: Instant event streaming to your application backend.

Ready to explore what's new?
Try the new features now: https://app.metrovps.com/campaigns

"MetroMail reduced our bounce rate by 84% in just 3 weeks."
— Sarah Lind, VP Engineering at CloudFlow

Best,
The MetroMail Team

--
You received this email because you subscribed to product updates.
Unsubscribe: {{unsubscribe_link}} | Preferences: https://app.metrovps.com/preferences`,
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Product Launch</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f7fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1e293b;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#f4f7fb;padding:30px 15px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(15,23,42,0.06);border:1px solid #e2e8f0;">
          <!-- Top Brand Header -->
          <tr>
            <td style="padding:28px 36px 20px;border-bottom:1px solid #f1f5f9;background:#ffffff;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <span style="display:inline-block;padding:6px 12px;background:linear-gradient(135deg,#1374f8,#075ce0);color:#ffffff;font-size:14px;font-weight:700;border-radius:6px;letter-spacing:0.5px;">MetroMail</span>
                  </td>
                  <td align="right">
                    <span style="display:inline-block;padding:4px 10px;background:#eef2ff;color:#3654d8;font-size:11px;font-weight:600;border-radius:999px;">WHAT'S NEW IN V2.4</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Hero Section -->
          <tr>
            <td style="padding:36px 36px 24px;text-align:left;">
              <h1 style="margin:0 0 14px;font-size:26px;line-height:1.25;font-weight:750;color:#0f172a;letter-spacing:-0.5px;">Supercharge your deliverability with AI insights</h1>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#475569;">Hey {{first_name}}, we’ve spent the last 3 months redesigning how messages get routed. Today, we’re thrilled to unveil our new intelligent deliverability engine.</p>
              
              <!-- Hero Visual Callout -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background:linear-gradient(135deg,#0b1a32,#162a4d);border-radius:10px;padding:22px;color:#ffffff;margin-bottom:28px;">
                <tr>
                  <td>
                    <span style="font-size:11px;color:#93c5fd;font-weight:700;letter-spacing:1px;text-transform:uppercase;">Performance Benchmark</span>
                    <h3 style="margin:6px 0 10px;font-size:20px;color:#ffffff;font-weight:700;">99.98% Inbox Placement</h3>
                    <p style="margin:0;font-size:13px;line-height:1.5;color:#cbd5e1;">Proprietary reputation warming and adaptive sending rate limits ensure your campaigns always bypass spam filters.</p>
                  </td>
                </tr>
              </table>

              <!-- 3 Feature Highlights -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding:14px;background:#f8fafc;border-radius:8px;border:1px solid #edf2f7;margin-bottom:12px;">
                    <strong style="color:#0f172a;font-size:14px;">⚡ Smart Provider Queueing</strong>
                    <p style="margin:4px 0 0;font-size:13px;color:#64748b;line-height:1.5;">Dynamically paces throughput for Gmail, Outlook, and Yahoo to prevent throttling.</p>
                  </td>
                </tr>
                <tr><td style="height:10px;"></td></tr>
                <tr>
                  <td style="padding:14px;background:#f8fafc;border-radius:8px;border:1px solid #edf2f7;">
                    <strong style="color:#0f172a;font-size:14px;">🛡️ Reputation Shield</strong>
                    <p style="margin:4px 0 0;font-size:13px;color:#64748b;line-height:1.5;">Automated DNS health checks that notify you before an SPF or DKIM issue impacts delivery.</p>
                  </td>
                </tr>
                <tr><td style="height:10px;"></td></tr>
                <tr>
                  <td style="padding:14px;background:#f8fafc;border-radius:8px;border:1px solid #edf2f7;">
                    <strong style="color:#0f172a;font-size:14px;">📊 Sub-Second Webhooks</strong>
                    <p style="margin:4px 0 0;font-size:13px;color:#64748b;line-height:1.5;">Receive instant opened, clicked, and bounced events directly in your product backend.</p>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top:28px;">
                <tr>
                  <td align="center">
                    <a href="https://app.metrovps.com/campaigns" style="display:inline-block;padding:14px 28px;background:linear-gradient(135deg,#1374f8,#075ce0);color:#ffffff;text-decoration:none;font-size:14px;font-weight:650;border-radius:8px;box-shadow:0 4px 12px rgba(19,116,248,0.25);">Explore New Features Now &rarr;</a>
                  </td>
                </tr>
              </table>

              <!-- Quote / Social Proof -->
              <div style="margin-top:30px;padding:16px 20px;border-left:3px solid #1374f8;background:#f0f7ff;border-radius:0 8px 8px 0;">
                <p style="margin:0;font-size:13px;font-style:italic;color:#1e3a8a;line-height:1.5;">“MetroMail reduced our bounce rate by 84% in just 3 weeks. The reliability is unmatched.”</p>
                <span style="display:block;margin-top:6px;font-size:12px;font-weight:600;color:#2563eb;">— Sarah Lind, VP Engineering at CloudFlow</span>
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 36px;background-color:#f8fafc;border-top:1px solid #edf2f7;text-align:center;">
              <p style="margin:0 0 10px;font-size:12px;color:#94a3b8;line-height:1.5;">You received this email because you are subscribed to product updates.<br>MetroMail Cloud Inc. · 100 Montgomery St, Suite 1200 · San Francisco, CA</p>
              <p style="margin:0;font-size:12px;color:#64748b;">
                <a href="{{unsubscribe_link}}" style="color:#64748b;text-decoration:underline;">Unsubscribe</a> &nbsp;&middot;&nbsp; 
                <a href="https://app.metrovps.com/preferences" style="color:#64748b;text-decoration:underline;">Preferences</a> &nbsp;&middot;&nbsp; 
                <a href="https://app.metrovps.com/support" style="color:#64748b;text-decoration:underline;">Help Center</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  },
  {
    id: 'flash-sale',
    name: 'Flash Sale & Limited Discount',
    category: 'Marketing',
    tag: 'Promotion',
    color: 'orange',
    description: 'High-urgency promotional email with coupon code voucher, discount badges, and plan pricing cards.',
    subject: '⚡ Flash Sale: 40% Off Annual Plans (48 Hours Only)',
    preheader: 'Upgrade your email tier today and save 40% with coupon METRO40.',
    plainText: `FLASH SALE - 48 HOURS ONLY
==========================

Hey {{first_name}},

For the next 48 hours, save 40% on any annual plan upgrade.

Use Coupon Code: METRO40
(Applied automatically at checkout)

PLANS ON SALE:
* Growth Plan: Normally $49/mo -> Now $29/mo (Billed annually)
* Enterprise Plan: Normally $199/mo -> Now $119/mo (Billed annually)

Claim your 40% discount here:
https://app.metrovps.com/billing/plans?coupon=METRO40

Every plan includes:
- Dedicated sending IP option
- Custom DKIM & SPF authentication
- Priority 24/7 deliverability support
- 30-day money-back guarantee

Offer expires in 48 hours. Don't miss out!

Best,
The MetroMail Team`,
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Flash Sale</title>
</head>
<body style="margin:0;padding:0;background-color:#fff7ed;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1e293b;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#fff7ed;padding:30px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 6px 24px rgba(234,88,12,0.12);border:1px solid #fed7aa;">
          <!-- Urgency Banner -->
          <tr>
            <td style="padding:10px;background:linear-gradient(90deg,#ea580c,#c2410c);color:#ffffff;text-align:center;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">
              ⚡ 48-Hour Flash Sale &middot; Offer Ends Wednesday
            </td>
          </tr>
          <!-- Main Content -->
          <tr>
            <td style="padding:36px;text-align:center;">
              <span style="display:inline-block;padding:6px 14px;background:#ffedd5;color:#c2410c;font-size:13px;font-weight:700;border-radius:999px;">ANNUAL UPGRADE PROMOTION</span>
              <h1 style="margin:16px 0 8px;font-size:34px;font-weight:800;color:#0f172a;letter-spacing:-1px;">SAVE 40% ON ALL PLANS</h1>
              <p style="margin:0 auto 24px;max-width:440px;font-size:15px;line-height:1.6;color:#64748b;">Lock in 40% off your email infrastructure for the next 12 months with our biggest discount of the season.</p>

              <!-- Coupon Voucher Box -->
              <div style="display:inline-block;padding:14px 28px;background:#f8fafc;border:2px dashed #ea580c;border-radius:10px;margin-bottom:28px;">
                <span style="display:block;font-size:11px;color:#64748b;font-weight:600;letter-spacing:0.5px;">PROMO CODE</span>
                <strong style="display:block;font-size:22px;color:#c2410c;letter-spacing:2px;font-family:monospace;margin-top:2px;">METRO40</strong>
              </div>

              <!-- Pricing Cards Grid -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom:28px;">
                <tr>
                  <td width="48%" style="padding:20px;border:1px solid #e2e8f0;border-radius:10px;background:#ffffff;vertical-align:top;text-align:left;">
                    <span style="display:block;font-size:11px;font-weight:700;color:#64748b;">GROWTH PLAN</span>
                    <div style="margin:10px 0;"><span style="text-decoration:line-through;color:#94a3b8;font-size:14px;">$49/mo</span> <b style="font-size:24px;color:#0f172a;">$29</b><span style="font-size:12px;color:#64748b;">/mo</span></div>
                    <ul style="margin:12px 0 0;padding-left:18px;font-size:12px;color:#475569;line-height:1.6;">
                      <li>50,000 emails/mo</li>
                      <li>Custom domain SPF/DKIM</li>
                      <li>Analytics & export tools</li>
                    </ul>
                  </td>
                  <td width="4%"></td>
                  <td width="48%" style="padding:20px;border:2px solid #ea580c;border-radius:10px;background:#fffaf5;vertical-align:top;text-align:left;">
                    <span style="display:inline-block;padding:2px 8px;background:#ea580c;color:#ffffff;font-size:10px;font-weight:700;border-radius:4px;">POPULAR</span>
                    <span style="display:block;font-size:11px;font-weight:700;color:#c2410c;margin-top:4px;">SCALE PLAN</span>
                    <div style="margin:10px 0;"><span style="text-decoration:line-through;color:#94a3b8;font-size:14px;">$199/mo</span> <b style="font-size:24px;color:#ea580c;">$119</b><span style="font-size:12px;color:#64748b;">/mo</span></div>
                    <ul style="margin:12px 0 0;padding-left:18px;font-size:12px;color:#475569;line-height:1.6;">
                      <li>250,000 emails/mo</li>
                      <li>Dedicated IP address</li>
                      <li>Priority 24/7 deliverability</li>
                    </ul>
                  </td>
                </tr>
              </table>

              <!-- Big Button -->
              <a href="https://app.metrovps.com/billing/plans" style="display:inline-block;width:80%;padding:15px;background:linear-gradient(135deg,#ea580c,#c2410c);color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;border-radius:8px;box-shadow:0 4px 14px rgba(234,88,12,0.3);">Claim Your 40% Off Today &rarr;</a>
              <p style="margin:12px 0 0;font-size:12px;color:#94a3b8;">30-Day Money-Back Guarantee &middot; Cancel Anytime</p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 36px;background-color:#fafaf9;border-top:1px solid #f5f5f4;text-align:center;font-size:12px;color:#a8a29e;">
              <p style="margin:0 0 6px;">Offer valid on annual billing cycles only. Cannot be combined with other offers.</p>
              <a href="{{unsubscribe_link}}" style="color:#a8a29e;text-decoration:underline;">Unsubscribe</a> &nbsp;|&nbsp; <a href="https://app.metrovps.com" style="color:#a8a29e;text-decoration:underline;">View in browser</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  },
  {
    id: 'webinar-invite',
    name: 'Webinar & Event Invitation',
    category: 'Marketing',
    tag: 'Webinar',
    color: 'purple',
    description: 'Clean event invitation with speaker bio, key takeaways checklist, and one-click calendar booking.',
    subject: 'Live Masterclass: Scaling from 10k to 10M Emails Without Landing in Spam',
    preheader: 'Join our Head of Deliverability on Thursday, Dec 3 at 2:00 PM EST.',
    plainText: `LIVE MASTERCLASS INVITATION
============================

Scaling from 10k to 10M Emails Without Landing in Spam
Date: Thursday, December 3, 2026
Time: 2:00 PM EST / 11:00 AM PST
Duration: 45 minutes + Live Q&A

FEATURED SPEAKER:
Sarah Jenkins — Head of Deliverability at MetroMail
Former deliverability architect at Fortune 500 email networks.

KEY TAKEAWAYS:
* Why traditional domain warming scripts trigger modern Gmail & Yahoo spam filters
* How to configure DMARC with strict quarantine without breaking forwarding
* Live audit of 3 real campaign setups

Reserve your free seat here:
https://app.metrovps.com/events/scaling-deliverability

Can't attend live? Register anyway and we'll send you the full recording and slides!`,
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Live Webinar</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f3ff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1e293b;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#f5f3ff;padding:30px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(109,40,217,0.08);border:1px solid #e9d5ff;">
          <!-- Top Badge -->
          <tr>
            <td style="padding:28px 36px 0;text-align:left;">
              <span style="display:inline-block;padding:5px 12px;background:#ede9fe;color:#6d28d9;font-size:12px;font-weight:700;border-radius:6px;letter-spacing:0.5px;">LIVE MASTERCLASS &middot; DEC 3</span>
            </td>
          </tr>
          <!-- Main Content -->
          <tr>
            <td style="padding:20px 36px 30px;text-align:left;">
              <h1 style="margin:0 0 14px;font-size:26px;font-weight:800;color:#0f172a;line-height:1.25;">Scaling from 10k to 10M Emails Without Landing in Spam</h1>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#475569;">Join us for an exclusive 45-minute tactical masterclass where we break down the exact sending reputation protocols used by top SaaS platforms.</p>

              <!-- Event Details Card -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background:#faf5ff;border:1px solid #f3e8ff;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
                <tr>
                  <td width="33%">
                    <small style="display:block;font-size:11px;color:#7c3aed;font-weight:700;">DATE</small>
                    <strong style="font-size:14px;color:#1e1b4b;">Thursday, Dec 3</strong>
                  </td>
                  <td width="33%">
                    <small style="display:block;font-size:11px;color:#7c3aed;font-weight:700;">TIME</small>
                    <strong style="font-size:14px;color:#1e1b4b;">2:00 PM EST</strong>
                  </td>
                  <td width="33%">
                    <small style="display:block;font-size:11px;color:#7c3aed;font-weight:700;">DURATION</small>
                    <strong style="font-size:14px;color:#1e1b4b;">45 Mins + Q&amp;A</strong>
                  </td>
                </tr>
              </table>

              <!-- Speaker Spotlight -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="padding:16px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;margin-bottom:24px;">
                <tr>
                  <td width="48" style="vertical-align:top;">
                    <div style="width:46px;height:46px;border-radius:50%;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#ffffff;display:inline-block;text-align:center;line-height:46px;font-weight:700;font-size:16px;">SJ</div>
                  </td>
                  <td style="padding-left:14px;vertical-align:middle;">
                    <strong style="display:block;font-size:14px;color:#0f172a;">Sarah Jenkins</strong>
                    <span style="font-size:12px;color:#64748b;">Head of Deliverability &middot; MetroMail</span>
                  </td>
                </tr>
              </table>

              <!-- What you'll learn -->
              <h3 style="margin:0 0 12px;font-size:15px;color:#0f172a;">What you will learn:</h3>
              <ul style="margin:0 0 24px;padding-left:20px;font-size:14px;line-height:1.65;color:#475569;">
                <li>Why traditional domain warming scripts trigger modern AI spam filters</li>
                <li>How to configure DMARC with strict quarantine without breaking forwarding</li>
                <li>Live audit of real campaign setups to find deliverability leaks</li>
              </ul>

              <!-- Register Button -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <a href="https://app.metrovps.com/events" style="display:inline-block;padding:14px 32px;background:#7c3aed;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;border-radius:8px;box-shadow:0 4px 12px rgba(124,58,237,0.3);">Reserve Your Free Seat &rarr;</a>
                  </td>
                </tr>
              </table>
              <p style="margin:14px 0 0;font-size:12px;color:#94a3b8;text-align:center;">Can’t attend live? Register anyway and we’ll email you the recording.</p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 36px;background-color:#f8fafc;border-top:1px solid #f1f5f9;text-align:center;font-size:12px;color:#94a3b8;">
              <p style="margin:0 0 4px;">MetroMail Live Events &middot; Empowering developers to send better email.</p>
              <a href="{{unsubscribe_link}}" style="color:#94a3b8;text-decoration:underline;">Unsubscribe</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  },
  {
    id: 'newsletter-digest',
    name: 'Weekly Newsletter & Curated Digest',
    category: 'Marketing',
    tag: 'Newsletter',
    color: 'cyan',
    description: 'Editorial digest format with issue numbering, featured story card, quick snippets, and feedback poll.',
    subject: 'MetroMail Dispatch #48: The Future of Email Deliverability',
    preheader: 'Your weekly breakdown of email infrastructure trends, tips, and tutorials.',
    plainText: `METROMAIL DISPATCH · ISSUE #48
==============================

Hey {{first_name}},

Welcome to this week's edition of the Dispatch.

FEATURED STORY:
The End of Open-Rate Tracking as We Know It (5 min read)
How Apple Mail Privacy Protection and new Google policies are shifting metrics toward verified click-to-open rates.
Read full story: https://app.metrovps.com/blog/open-rate-shifts

QUICK HITS:
* Node.js SDK v3 Released: Native TypeScript types and built-in connection pooling.
* SPF Flattening Guide: How to avoid the 10-DNS-lookup limit when using multiple SaaS tools.
* Deliverability Tip: Why sending from subdomain (e.g. news.company.com) protects your main root domain.

QUOTE OF THE WEEK:
"Great email isn't about sending more messages. It's about sending messages your customers actually anticipate."

Did you enjoy this issue?
Reply directly to this email or let us know at feedback@metrovps.com

--
Unsubscribe: {{unsubscribe_link}}`,
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weekly Dispatch</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1e293b;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#f1f5f9;padding:30px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 16px rgba(15,23,42,0.06);border:1px solid #e2e8f0;">
          <!-- Newsletter Masthead -->
          <tr>
            <td style="padding:28px 36px 20px;border-bottom:2px solid #0f172a;background:#ffffff;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <span style="font-size:20px;font-weight:800;letter-spacing:-0.5px;color:#0f172a;">THE DISPATCH</span>
                  </td>
                  <td align="right">
                    <span style="font-size:12px;color:#64748b;font-weight:600;">ISSUE #48 &middot; NOV 2026</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:28px 36px;text-align:left;">
              <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#334155;">Good morning, {{first_name}}. This week, we’re looking closely at how AI algorithms inside major mailbox providers are redefining what constitutes high-quality sender reputation.</p>

              <!-- Featured Story Card -->
              <div style="border:1px solid #cbd5e1;border-radius:8px;padding:22px;background:#f8fafc;margin-bottom:26px;">
                <span style="display:inline-block;padding:3px 8px;background:#0284c7;color:#ffffff;font-size:10px;font-weight:700;border-radius:4px;letter-spacing:0.5px;">DEEP DIVE &middot; 5 MIN READ</span>
                <h2 style="margin:10px 0 8px;font-size:18px;font-weight:750;color:#0f172a;">The End of Open-Rate Tracking as We Know It</h2>
                <p style="margin:0 0 14px;font-size:14px;line-height:1.55;color:#475569;">With automatic prefetching across Apple Mail and Google Workspace, traditional tracking pixels are becoming obsolete. Here is how modern growth teams measure engagement now.</p>
                <a href="https://app.metrovps.com/blog" style="color:#0284c7;font-weight:650;font-size:13px;text-decoration:none;">Read full analysis &rarr;</a>
              </div>

              <!-- Quick Curated Hits -->
              <h3 style="margin:0 0 12px;font-size:14px;color:#0f172a;text-transform:uppercase;letter-spacing:0.5px;">Quick Hits &amp; Tools</h3>
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom:24px;">
                <tr>
                  <td style="padding:10px 0;border-top:1px solid #f1f5f9;">
                    <strong style="font-size:13px;color:#0f172a;">Node.js SDK v3 Released</strong>
                    <span style="display:block;font-size:13px;color:#64748b;margin-top:2px;">Includes native TypeScript definitions, zero-dependency payload compression, and connection pooling.</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-top:1px solid #f1f5f9;">
                    <strong style="font-size:13px;color:#0f172a;">The SPF Flattening Guide</strong>
                    <span style="display:block;font-size:13px;color:#64748b;margin-top:2px;">How to avoid the RFC 10-DNS-lookup barrier when integrating multiple third-party marketing services.</span>
                  </td>
                </tr>
              </table>

              <!-- Quote of the Week -->
              <div style="padding:16px 20px;background:#f1f5f9;border-radius:8px;text-align:center;margin-bottom:10px;">
                <p style="margin:0;font-size:14px;font-style:italic;color:#334155;">“Great email isn’t about sending more messages. It’s about sending messages your customers genuinely anticipate.”</p>
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 36px;background-color:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;font-size:12px;color:#94a3b8;">
              <p style="margin:0 0 8px;">Curated by the MetroMail Engineering &amp; Growth Team.</p>
              <a href="{{unsubscribe_link}}" style="color:#94a3b8;text-decoration:underline;">Unsubscribe</a> &nbsp;&middot;&nbsp; 
              <a href="https://app.metrovps.com/preferences" style="color:#94a3b8;text-decoration:underline;">Preferences</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  },
  {
    id: 'corporate-letter',
    name: 'Executive Corporate Announcement',
    category: 'Traditional',
    tag: 'Formal Letter',
    color: 'navy',
    description: 'Traditional corporate letterhead with clean typography, formal executive structure, and signature block.',
    subject: 'Important Update Regarding Your MetroMail Enterprise Services',
    preheader: 'A personal update from our CEO regarding network expansion and security upgrades.',
    plainText: `METROMAIL CLOUD INC.
100 Montgomery Street, Suite 1200
San Francisco, CA 94104

November 16, 2026

Dear {{first_name}},

I am writing to personally share an important update regarding our core email delivery infrastructure and upcoming service enhancements.

Over the past year, our engineering team has been building a second-generation multi-region network to provide sub-millisecond dispatch times and guaranteed zero-downtime failover for your enterprise workloads.

KEY HIGHLIGHTS:
1. Multi-Region Active Failover: Messages automatically reroute if any regional data center experiences network degradation.
2. Enhanced Post-Quantum Encryption: All SMTP transit connections now support TLS 1.3 with quantum-resistant cipher suites.
3. Dedicated Compliance Logging: 365-day immutable audit trails for strict SOC2 and HIPAA compliance.

No action is required on your part. These upgrades will roll out transparently over the coming weekend during our standard maintenance window.

If you have any questions or require bespoke compliance documentation, please reply directly to this message or contact your dedicated account manager.

Thank you for your continued trust in our platform.

Warm regards,

Alex Morgan
Chief Executive Officer
MetroMail Cloud Inc.
alex@metrovps.com

--
Confidentiality Note: This transmission is intended solely for the recipient named above.
Manage preferences: {{unsubscribe_link}}`,
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Corporate Letter</title>
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:Georgia,Cambria,'Times New Roman',serif;color:#1e293b;line-height:1.7;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#f8fafc;padding:35px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:620px;background-color:#ffffff;border-radius:4px;border:1px solid #e2e8f0;padding:45px 50px;box-shadow:0 2px 10px rgba(0,0,0,0.03);">
          <!-- Traditional Letterhead -->
          <tr>
            <td style="border-bottom:2px solid #0f172a;padding-bottom:18px;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <span style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:16px;font-weight:800;letter-spacing:1px;color:#0f172a;">METROMAIL CLOUD INC.</span>
                  </td>
                  <td align="right" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px;color:#64748b;">
                    November 16, 2026
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Letter Body -->
          <tr>
            <td style="padding-top:30px;">
              <p style="margin:0 0 16px;font-size:15px;color:#1e293b;">Dear {{first_name}},</p>
              <p style="margin:0 0 16px;font-size:15px;color:#334155;">I am writing to personally share an important update regarding our core email delivery infrastructure and upcoming service enhancements.</p>
              <p style="margin:0 0 16px;font-size:15px;color:#334155;">Over the past year, our engineering team has been building a second-generation multi-region network to provide sub-millisecond dispatch times and guaranteed zero-downtime failover for your enterprise workloads.</p>
              
              <!-- Callout Box -->
              <div style="margin:24px 0;padding:18px 22px;background:#f8fafc;border-left:4px solid #0f172a;">
                <strong style="display:block;margin-bottom:8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:13px;color:#0f172a;text-transform:uppercase;letter-spacing:0.5px;">Key Infrastructure Highlights</strong>
                <ul style="margin:0;padding-left:18px;font-size:14px;color:#475569;line-height:1.6;">
                  <li><strong>Multi-Region Active Failover:</strong> Messages automatically reroute if any regional data center experiences network degradation.</li>
                  <li><strong>Post-Quantum Encryption:</strong> All transit connections now enforce TLS 1.3 with quantum-resistant cipher suites.</li>
                  <li><strong>Dedicated Audit Logging:</strong> 365-day immutable compliance logs for strict SOC2 and HIPAA requirements.</li>
                </ul>
              </div>

              <p style="margin:0 0 16px;font-size:15px;color:#334155;">No action is required on your part. These upgrades will roll out transparently over the coming weekend during our standard maintenance window.</p>
              <p style="margin:0 0 28px;font-size:15px;color:#334155;">If you have any questions or require bespoke compliance documentation, please reply directly to this message or contact your dedicated account manager.</p>
              
              <!-- Formal Signature Block -->
              <div style="margin-top:30px;padding-top:20px;border-top:1px solid #f1f5f9;">
                <p style="margin:0 0 8px;font-size:15px;color:#1e293b;">Warm regards,</p>
                <div style="font-family:'Brush Script MT',cursive,serif;font-size:26px;color:#0f172a;margin:10px 0 6px;">Alex Morgan</div>
                <strong style="display:block;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:13px;color:#0f172a;">Alex Morgan</strong>
                <span style="display:block;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px;color:#64748b;">Chief Executive Officer &middot; MetroMail Cloud Inc.</span>
                <span style="display:block;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px;color:#64748b;">alex@metrovps.com</span>
              </div>
            </td>
          </tr>
          <!-- Formal Legal Footer -->
          <tr>
            <td style="padding-top:40px;border-top:1px solid #e2e8f0;margin-top:30px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:11px;color:#94a3b8;line-height:1.5;text-align:center;">
              MetroMail Cloud Inc. &middot; 100 Montgomery Street, Suite 1200 &middot; San Francisco, CA 94104<br>
              This official notification was transmitted to {{email}}.<br>
              <a href="{{unsubscribe_link}}" style="color:#64748b;text-decoration:underline;">Communication Preferences</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  },
  {
    id: 'account-welcome',
    name: 'Account Welcome & Onboarding Guide',
    category: 'Transactional',
    tag: 'Onboarding',
    color: 'green',
    description: 'Friendly onboarding email with numbered 3-step checklist, documentation links, and primary getting-started CTA.',
    subject: 'Welcome to MetroMail! Here is how to get started in 5 minutes',
    preheader: 'Follow these 3 quick steps to send your first message.',
    plainText: `WELCOME TO METROMAIL!
=====================

Hey {{first_name}},

Welcome aboard! We are excited to help you send high-performing, reliable email.

HERE ARE 3 QUICK STEPS TO GET STARTED:
1. Verify Your Sending Domain
   Add your SPF and DKIM records so your messages land in the inbox.
   Verify domain: https://app.metrovps.com/domains

2. Create an API Key or SMTP Credential
   Generate production credentials for your application.
   Get credentials: https://app.metrovps.com/api-keys

3. Send Your First Message
   Use our Node.js, Python, or cURL examples to send a test email.
   Quickstart docs: https://app.metrovps.com/api-keys/docs

Need any help? Our team of deliverability engineers is here 24/7.
Just reply to this email or visit our help center: https://app.metrovps.com/support

Best,
The MetroMail Team`,
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to MetroMail</title>
</head>
<body style="margin:0;padding:0;background-color:#f0fdf4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1e293b;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#f0fdf4;padding:30px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 18px rgba(22,101,52,0.06);border:1px solid #bbf7d0;">
          <!-- Top Welcome Header -->
          <tr>
            <td style="padding:32px 36px 20px;text-align:center;background:linear-gradient(180deg,#dcfce7,#ffffff);">
              <div style="width:52px;height:52px;border-radius:12px;background:#16a34a;color:#ffffff;display:inline-block;text-align:center;line-height:52px;font-size:24px;box-shadow:0 4px 10px rgba(22,163,74,0.3);">✓</div>
              <h1 style="margin:16px 0 6px;font-size:26px;font-weight:800;color:#0f172a;">Welcome to MetroMail, {{first_name}}!</h1>
              <p style="margin:0;font-size:15px;color:#475569;">We’re thrilled to have you. Here is your quickstart guide to sending your first email in under 5 minutes.</p>
            </td>
          </tr>
          <!-- Step-by-Step Checklist -->
          <tr>
            <td style="padding:10px 36px 30px;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <!-- Step 1 -->
                <tr>
                  <td width="36" style="vertical-align:top;padding-top:2px;">
                    <span style="display:inline-block;width:26px;height:26px;border-radius:50%;background:#dcfce7;color:#15803d;text-align:center;line-height:26px;font-size:12px;font-weight:700;">1</span>
                  </td>
                  <td style="padding-bottom:20px;">
                    <strong style="font-size:14px;color:#0f172a;display:block;">Verify Your Sending Domain</strong>
                    <span style="font-size:13px;color:#64748b;line-height:1.5;display:block;margin-top:2px;">Publish your SPF and DKIM DNS records to authenticate your sender reputation.</span>
                  </td>
                </tr>
                <!-- Step 2 -->
                <tr>
                  <td width="36" style="vertical-align:top;padding-top:2px;">
                    <span style="display:inline-block;width:26px;height:26px;border-radius:50%;background:#dcfce7;color:#15803d;text-align:center;line-height:26px;font-size:12px;font-weight:700;">2</span>
                  </td>
                  <td style="padding-bottom:20px;">
                    <strong style="font-size:14px;color:#0f172a;display:block;">Create an API Key or SMTP Relay</strong>
                    <span style="font-size:13px;color:#64748b;line-height:1.5;display:block;margin-top:2px;">Generate production credentials to connect your app or framework.</span>
                  </td>
                </tr>
                <!-- Step 3 -->
                <tr>
                  <td width="36" style="vertical-align:top;padding-top:2px;">
                    <span style="display:inline-block;width:26px;height:26px;border-radius:50%;background:#dcfce7;color:#15803d;text-align:center;line-height:26px;font-size:12px;font-weight:700;">3</span>
                  </td>
                  <td style="padding-bottom:10px;">
                    <strong style="font-size:14px;color:#0f172a;display:block;">Send Your First Message</strong>
                    <span style="font-size:13px;color:#64748b;line-height:1.5;display:block;margin-top:2px;">Use our official Node.js, Python, or cURL SDK to dispatch test messages.</span>
                  </td>
                </tr>
              </table>

              <!-- Action Button -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top:22px;">
                <tr>
                  <td align="center">
                    <a href="https://app.metrovps.com/overview" style="display:inline-block;padding:14px 28px;background:#16a34a;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;border-radius:8px;box-shadow:0 4px 12px rgba(22,163,74,0.25);">Open Your Dashboard &rarr;</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 36px;background-color:#f8fafc;border-top:1px solid #f1f5f9;text-align:center;font-size:12px;color:#94a3b8;">
              <p style="margin:0;">Need assistance? Reply directly to this email or visit our <a href="https://app.metrovps.com/support" style="color:#16a34a;text-decoration:underline;">Support Center</a>.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  },
  {
    id: 'invoice-receipt',
    name: 'Payment Receipt & Order Invoice',
    category: 'Transactional',
    tag: 'Receipt',
    color: 'emerald',
    description: 'Clean transactional invoice with payment confirmation badge, itemized billing summary, and download button.',
    subject: 'Your MetroMail Receipt for Invoice #MM-INV-2026-9812',
    preheader: 'Thank you for your payment of $64.00. Here is your official invoice receipt.',
    plainText: `PAYMENT RECEIPT - METROMAIL
===========================

Invoice Number: #MM-INV-2026-9812
Status: PAID
Date: November 16, 2026
Billed To: {{first_name}} ({{company}})

ITEMIZED CHARGES:
* MetroMail Growth Plan (Monthly): $49.00
* Dedicated IP Address Add-on: $15.00
-----------------------------------
Subtotal: $64.00
Tax (0%): $0.00
TOTAL PAID: $64.00

Payment Method: Visa ending in 4242

You can download a PDF copy of this receipt at:
https://app.metrovps.com/billing/invoices

Thank you for your business!
The MetroMail Billing Team`,
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Receipt</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1e293b;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#f1f5f9;padding:30px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:580px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 18px rgba(15,23,42,0.06);border:1px solid #e2e8f0;">
          <!-- Top Receipt Header -->
          <tr>
            <td style="padding:28px 36px 20px;border-bottom:1px solid #f1f5f9;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <span style="font-size:18px;font-weight:800;color:#0f172a;">MetroMail</span>
                    <span style="display:block;font-size:12px;color:#64748b;margin-top:2px;">Invoice #MM-INV-2026-9812</span>
                  </td>
                  <td align="right">
                    <span style="display:inline-block;padding:4px 10px;background:#dcfce7;color:#15803d;font-size:11px;font-weight:700;border-radius:999px;">PAID</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Receipt Body -->
          <tr>
            <td style="padding:26px 36px;">
              <p style="margin:0 0 16px;font-size:14px;color:#334155;">Hello {{first_name}}, this is a confirmation that your monthly subscription payment was processed successfully.</p>
              
              <!-- Meta Row -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background:#f8fafc;border-radius:8px;padding:12px 16px;margin-bottom:20px;">
                <tr>
                  <td width="50%">
                    <small style="display:block;font-size:11px;color:#64748b;font-weight:600;">DATE PAID</small>
                    <span style="font-size:13px;color:#0f172a;font-weight:600;">November 16, 2026</span>
                  </td>
                  <td width="50%">
                    <small style="display:block;font-size:11px;color:#64748b;font-weight:600;">PAYMENT METHOD</small>
                    <span style="font-size:13px;color:#0f172a;font-weight:600;">Visa &middot;&middot;&middot;&middot; 4242</span>
                  </td>
                </tr>
              </table>

              <!-- Line Items Table -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin-bottom:20px;">
                <thead>
                  <tr style="border-bottom:1px solid #e2e8f0;">
                    <th align="left" style="padding:8px 0;font-size:12px;color:#64748b;font-weight:600;">DESCRIPTION</th>
                    <th align="right" style="padding:8px 0;font-size:12px;color:#64748b;font-weight:600;">AMOUNT</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style="border-bottom:1px solid #f1f5f9;">
                    <td style="padding:10px 0;font-size:13px;color:#0f172a;">MetroMail Growth Plan (Monthly)</td>
                    <td align="right" style="padding:10px 0;font-size:13px;color:#0f172a;">$49.00</td>
                  </tr>
                  <tr style="border-bottom:1px solid #f1f5f9;">
                    <td style="padding:10px 0;font-size:13px;color:#0f172a;">Dedicated IP Address Add-on</td>
                    <td align="right" style="padding:10px 0;font-size:13px;color:#0f172a;">$15.00</td>
                  </tr>
                  <tr>
                    <td style="padding:12px 0 0;font-size:14px;font-weight:700;color:#0f172a;">Total Amount Paid</td>
                    <td align="right" style="padding:12px 0 0;font-size:16px;font-weight:800;color:#059669;">$64.00</td>
                  </tr>
                </tbody>
              </table>

              <!-- Download Button -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top:20px;">
                <tr>
                  <td align="center">
                    <a href="https://app.metrovps.com/billing" style="display:inline-block;padding:12px 24px;background:#0f172a;color:#ffffff;text-decoration:none;font-size:13px;font-weight:600;border-radius:6px;">Download PDF Invoice &rarr;</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:18px 36px;background-color:#f8fafc;border-top:1px solid #f1f5f9;text-align:center;font-size:11px;color:#94a3b8;">
              Questions about this charge? Contact billing@metrovps.com.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  }
]
