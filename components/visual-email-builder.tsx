'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  ArrowDown,
  ArrowUp,
  Check,
  Code,
  Columns2,
  Columns3,
  Copy,
  Eye,
  FileText,
  GripVertical,
  Heading1,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Info,
  Layers,
  LayoutTemplate,
  Link as LinkIcon,
  Loader2,
  Minus,
  Monitor,
  MousePointerClick,
  Palette,
  Play,
  Plus,
  Quote,
  RefreshCw,
  Settings,
  Share2,
  ShieldCheck,
  Smartphone,
  Space,
  Sparkles,
  Star,
  Trash2,
  Type,
  Upload,
  Video,
  X,
} from 'lucide-react'
import { uploadMediaImage } from '@/lib/api/media'
import { EMAIL_TEMPLATES, type EmailTemplate } from '@/lib/email-templates'

export type EmailBlockType =
  | 'header'
  | 'heading'
  | 'text'
  | 'button'
  | 'image'
  | 'two_column'
  | 'three_column'
  | 'callout'
  | 'quote'
  | 'video'
  | 'divider'
  | 'spacer'
  | 'social'
  | 'footer'
  | 'html'

export interface EmailBlock {
  id: string
  type: EmailBlockType
  data: Record<string, any>
}

// Block palette definitions
const BLOCK_CATALOG: {
  type: EmailBlockType
  label: string
  category: 'Typography' | 'Media & Actions' | 'Layout' | 'Structure'
  description: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  defaultData: Record<string, any>
}[] = [
  {
    type: 'header',
    label: 'Brand Header',
    category: 'Typography',
    description: 'Logo banner or brand company name',
    icon: LayoutTemplate,
    defaultData: {
      brandName: 'MetroMail',
      tagline: 'High-Performance Email Infrastructure',
      logoUrl: '',
      logoHeight: 44,
      align: 'center',
      bgColor: '#ffffff',
      textColor: '#0f172a',
      taglineColor: '#64748b',
      paddingY: 24,
    },
  },
  {
    type: 'heading',
    label: 'Heading Title',
    category: 'Typography',
    description: 'Prominent headline for your message',
    icon: Heading1,
    defaultData: {
      text: 'Exciting News: Our Platform Is Live!',
      level: 'h1',
      fontSize: 26,
      fontWeight: 'bold',
      lineHeight: 1.3,
      align: 'center',
      color: '#0f172a',
      bgColor: '#ffffff',
      paddingTop: 20,
      paddingBottom: 10,
    },
  },
  {
    type: 'text',
    label: 'Paragraph Text',
    category: 'Typography',
    description: 'Formatted multi-line body content',
    icon: Type,
    defaultData: {
      content:
        'We are thrilled to announce our latest release. Built for teams that demand sub-second delivery, guaranteed uptime, and automated subscriber engagement.',
      fontSize: 15,
      lineHeight: 1.6,
      align: 'left',
      color: '#475569',
      bgColor: '#ffffff',
      paddingY: 12,
    },
  },
  {
    type: 'quote',
    label: 'Customer Testimonial',
    category: 'Typography',
    description: 'Quote card with author, title, avatar and stars',
    icon: Quote,
    defaultData: {
      quote:
        '“MetroMail reduced our bounce rate by 84% in just 3 weeks. The inbox delivery rate is remarkable.”',
      author: 'Sarah Lind',
      role: 'VP Engineering at CloudFlow',
      avatar:
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      stars: 5,
      bgColor: '#f8fafc',
      textColor: '#0f172a',
      align: 'left',
      borderRadius: 8,
    },
  },
  {
    type: 'button',
    label: 'Call to Action',
    category: 'Media & Actions',
    description: 'High-converting link button',
    icon: MousePointerClick,
    defaultData: {
      text: 'Explore Platform Features →',
      url: 'https://app.metrovps.art',
      bgColor: '#1374f8',
      textColor: '#ffffff',
      fontSize: 15,
      borderRadius: 8,
      align: 'center',
      paddingY: 12,
      paddingX: 28,
      fullWidth: false,
    },
  },
  {
    type: 'image',
    label: 'Hero Banner Image',
    category: 'Media & Actions',
    description: 'High-resolution image or banner',
    icon: ImageIcon,
    defaultData: {
      url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1000&auto=format&fit=crop&q=80',
      alt: 'Platform Overview',
      link: '',
      borderRadius: 8,
      width: '100%',
      align: 'center',
      caption: '',
      paddingY: 14,
    },
  },
  {
    type: 'video',
    label: 'Video Preview Card',
    category: 'Media & Actions',
    description: 'Video thumbnail with play button overlay',
    icon: Video,
    defaultData: {
      thumbnailUrl:
        'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80',
      videoUrl: 'https://www.youtube.com',
      title: 'Watch Product Walkthrough & Setup Demo',
      duration: '3:20',
      showPlayButton: true,
      align: 'center',
    },
  },
  {
    type: 'two_column',
    label: '2-Column Product Grid',
    category: 'Layout',
    description: 'Side-by-side content or feature boxes',
    icon: Columns2,
    defaultData: {
      col1Title: 'Sub-second Relay',
      col1Text: 'Global IP pools optimized for rapid inbox arrival.',
      col1Img: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&auto=format&fit=crop&q=80',
      col1BtnText: '',
      col1Link: '',
      col2Title: 'Live Insights',
      col2Text: 'Real-time open and click telemetry with webhook streams.',
      col2Img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&auto=format&fit=crop&q=80',
      col2BtnText: '',
      col2Link: '',
      cardBgColor: '#f8fafc',
      cardBorderColor: '#e2e8f0',
      titleColor: '#0f172a',
      textColor: '#64748b',
      btnBgColor: '#1374f8',
      btnTextColor: '#ffffff',
      borderRadius: 8,
    },
  },
  {
    type: 'three_column',
    label: '3-Column Features',
    category: 'Layout',
    description: 'Key highlights in 3 responsive columns',
    icon: Columns3,
    defaultData: {
      col1Title: '⚡ 99.9% Uptime',
      col1Text: 'Redundant clusters with instant failover.',
      col1Img: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&auto=format&fit=crop&q=80',
      col1BtnText: '',
      col1Link: '',
      col2Title: '🔒 Automated DMARC',
      col2Text: 'Full SPF, DKIM, and BIMI protection.',
      col2Img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&auto=format&fit=crop&q=80',
      col2BtnText: '',
      col2Link: '',
      col3Title: '📈 Engagement Growth',
      col3Text: 'Audience tagging and smart lists.',
      col3Img: 'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=400&auto=format&fit=crop&q=80',
      col3BtnText: '',
      col3Link: '',
      cardBgColor: '#f8fafc',
      cardBorderColor: '#e2e8f0',
      titleColor: '#0f172a',
      textColor: '#64748b',
      borderRadius: 8,
    },
  },
  {
    type: 'callout',
    label: 'Callout Alert Box',
    category: 'Structure',
    description: 'Highlighted tip, notice or badge',
    icon: Info,
    defaultData: {
      title: 'Growth Tip for Senders',
      text: 'Segmenting your audience tags before sending improves inbox placement by up to 34%.',
      bgColor: '#eff6ff',
      borderColor: '#3b82f6',
      titleColor: '#0f172a',
      textColor: '#334155',
      borderRadius: 6,
      iconEmoji: '💡',
    },
  },
  {
    type: 'divider',
    label: 'Divider Line',
    category: 'Structure',
    description: 'Subtle separator line',
    icon: Minus,
    defaultData: {
      color: '#e2e8f0',
      thickness: 1,
      style: 'solid',
      width: '100%',
      spacing: 24,
    },
  },
  {
    type: 'spacer',
    label: 'Spacer Gap',
    category: 'Structure',
    description: 'Adjustable vertical blank spacing',
    icon: Space,
    defaultData: {
      height: 24,
      bgColor: 'transparent',
    },
  },
  {
    type: 'social',
    label: 'Social Follow Icons',
    category: 'Structure',
    description: 'Links to Twitter/X, LinkedIn, GitHub',
    icon: Share2,
    defaultData: {
      align: 'center',
      twitter: 'https://x.com',
      linkedin: 'https://linkedin.com',
      github: 'https://github.com',
      facebook: '',
      instagram: '',
      youtube: '',
      website: '',
      linkColor: '#1374f8',
    },
  },
  {
    type: 'footer',
    label: 'Compliance Footer',
    category: 'Structure',
    description: 'Physical address & unsubscribe merge tag',
    icon: ShieldCheck,
    defaultData: {
      companyName: 'MetroVPS Inc.',
      address: '100 Tech Blvd, Suite 400, San Francisco, CA 94105',
      unsubscribeText: 'Unsubscribe from these emails: {{unsubscribe_link}}',
      copyright: '© 2026 MetroVPS. All rights reserved.',
      color: '#94a3b8',
      bgColor: '#f8fafc',
      align: 'center',
      borderTop: true,
    },
  },
  {
    type: 'html',
    label: 'Custom HTML Embed',
    category: 'Structure',
    description: 'Raw HTML code, custom tables, or embeds',
    icon: Code,
    defaultData: {
      code: '<div style="padding: 18px; border: 1px dashed #cbd5e1; border-radius: 8px; text-align: center; color: #475569;">Custom HTML snippet or interactive embed</div>',
      bgColor: '#ffffff',
      padding: 16,
    },
  },
]

// Preset templates for quick-start in visual builder
export const STARTER_LAYOUTS: {
  id: string
  name: string
  tag: string
  blocks: Omit<EmailBlock, 'id'>[]
}[] = [
  {
    id: 'saas-launch',
    name: 'Product Launch & Feature Announcement',
    tag: 'Feature Release',
    blocks: [
      {
        type: 'header',
        data: {
          brandName: 'MetroMail',
          tagline: "WHAT'S NEW IN V2.4",
          logoUrl: '',
          align: 'center',
          bgColor: '#ffffff',
          textColor: '#1374f8',
          taglineColor: '#3654d8',
          paddingY: 24,
        },
      },
      {
        type: 'heading',
        data: {
          text: 'Supercharge your deliverability with AI insights',
          level: 'h1',
          fontSize: 26,
          fontWeight: 'bold',
          lineHeight: 1.25,
          align: 'left',
          color: '#0f172a',
          bgColor: '#ffffff',
          paddingTop: 28,
          paddingBottom: 10,
        },
      },
      {
        type: 'text',
        data: {
          content:
            'Hey {{first_name}},\n\nWe’ve spent the last 3 months redesigning how messages get routed. Today, we’re thrilled to unveil our new intelligent deliverability engine.',
          fontSize: 15,
          lineHeight: 1.6,
          color: '#475569',
          align: 'left',
          bgColor: '#ffffff',
          paddingY: 10,
        },
      },
      {
        type: 'callout',
        data: {
          title: '99.98% Inbox Placement',
          text: 'Proprietary reputation warming and adaptive sending rate limits ensure your campaigns always bypass spam filters.',
          iconEmoji: '🚀',
          bgColor: '#0b1a32',
          borderColor: '#3b82f6',
          titleColor: '#ffffff',
          textColor: '#cbd5e1',
          borderRadius: 10,
        },
      },
      {
        type: 'three_column',
        data: {
          cardBgColor: '#f8fafc',
          cardBorderColor: '#edf2f7',
          borderRadius: 8,
          titleColor: '#0f172a',
          textColor: '#64748b',
          col1Title: '⚡ Smart Queueing',
          col1Text: 'Dynamically paces throughput for Gmail, Outlook, and Yahoo.',
          col2Title: '🛡️ Reputation Shield',
          col2Text: 'Automated DNS health checks notify you before SPF/DKIM issues.',
          col3Title: '📊 Fast Webhooks',
          col3Text: 'Sub-second opened, clicked, and bounced event streams.',
        },
      },
      {
        type: 'button',
        data: {
          text: 'Explore New Features Now →',
          url: 'https://app.metrovps.com/campaigns',
          bgColor: '#1374f8',
          textColor: '#ffffff',
          fontSize: 14,
          borderRadius: 8,
          align: 'center',
          paddingY: 14,
          paddingX: 32,
          fullWidth: false,
        },
      },
      {
        type: 'quote',
        data: {
          quote: 'MetroMail reduced our bounce rate by 84% in just 3 weeks. The reliability is unmatched.',
          author: 'Sarah Lind',
          role: 'VP Engineering at CloudFlow',
          avatar: '',
          stars: 5,
          bgColor: '#f0f7ff',
          textColor: '#1e3a8a',
          align: 'left',
          borderRadius: 8,
        },
      },
      {
        type: 'footer',
        data: {
          companyName: 'MetroMail Cloud Inc.',
          address: '100 Montgomery St, Suite 1200 · San Francisco, CA',
          unsubscribeText: 'Unsubscribe from product updates: {{unsubscribe_link}}',
          copyright: '© 2026 MetroMail Cloud Inc. All rights reserved.',
          color: '#94a3b8',
          bgColor: '#f8fafc',
          align: 'center',
          borderTop: true,
        },
      },
    ],
  },
  {
    id: 'flash-sale',
    name: 'Flash Sale & Limited Discount',
    tag: 'Promotion',
    blocks: [
      {
        type: 'callout',
        data: {
          title: '⚡ 48-Hour Flash Sale · Offer Ends Wednesday',
          text: 'Exclusive seasonal discount on dedicated IP pools and enterprise clusters.',
          iconEmoji: '🔥',
          bgColor: '#ea580c',
          borderColor: '#c2410c',
          titleColor: '#ffffff',
          textColor: '#ffedd5',
          borderRadius: 0,
        },
      },
      {
        type: 'callout',
        data: {
          title: 'ANNUAL UPGRADE PROMOTION',
          text: 'Lock in 40% off your email infrastructure for the next 12 months with our biggest discount of the season.',
          iconEmoji: '🏷️',
          bgColor: '#ffedd5',
          borderColor: '#ea580c',
          titleColor: '#c2410c',
          textColor: '#9a3412',
          borderRadius: 20,
        },
      },
      {
        type: 'heading',
        data: {
          text: 'SAVE 40% ON ALL PLANS',
          level: 'h1',
          fontSize: 32,
          fontWeight: 'extrabold',
          lineHeight: 1.15,
          align: 'center',
          color: '#0f172a',
          bgColor: '#ffffff',
          paddingTop: 24,
          paddingBottom: 8,
        },
      },
      {
        type: 'callout',
        data: {
          title: 'PROMO CODE: METRO40',
          text: 'Enter this voucher at checkout to redeem 40% off any annual subscription tier.',
          iconEmoji: '🎟️',
          bgColor: '#f8fafc',
          borderColor: '#ea580c',
          titleColor: '#c2410c',
          textColor: '#475569',
          borderRadius: 10,
        },
      },
      {
        type: 'two_column',
        data: {
          cardBgColor: '#fffaf5',
          cardBorderColor: '#fed7aa',
          borderRadius: 10,
          titleColor: '#0f172a',
          textColor: '#475569',
          btnBgColor: '#ea580c',
          btnTextColor: '#ffffff',
          col1Title: 'GROWTH PLAN · $29/mo',
          col1Text: '50,000 emails/mo, Custom domain SPF/DKIM, Full analytics & export tools.',
          col1BtnText: 'Select Growth',
          col1Link: 'https://app.metrovps.com/billing',
          col2Title: 'SCALE PLAN · $119/mo (POPULAR)',
          col2Text: '250,000 emails/mo, Dedicated IP address, Priority 24/7 deliverability relay.',
          col2BtnText: 'Select Scale',
          col2Link: 'https://app.metrovps.com/billing',
        },
      },
      {
        type: 'button',
        data: {
          text: 'Claim Your 40% Off Today →',
          url: 'https://app.metrovps.com/billing/plans',
          bgColor: '#ea580c',
          textColor: '#ffffff',
          fontSize: 16,
          borderRadius: 8,
          align: 'center',
          paddingY: 15,
          paddingX: 36,
          fullWidth: true,
        },
      },
      {
        type: 'footer',
        data: {
          companyName: 'MetroMail Promotions',
          address: 'Offer valid on annual billing cycles only.',
          unsubscribeText: 'Unsubscribe from promotional offers: {{unsubscribe_link}}',
          copyright: '30-Day Money-Back Guarantee · Cancel Anytime',
          color: '#a8a29e',
          bgColor: '#fafaf9',
          align: 'center',
          borderTop: true,
        },
      },
    ],
  },
  {
    id: 'webinar-invite',
    name: 'Live Product Webinar Invitation',
    tag: 'Webinar',
    blocks: [
      {
        type: 'callout',
        data: {
          title: 'LIVE MASTERCLASS · DEC 3',
          text: 'Interactive tactical workshop for engineering & growth teams.',
          iconEmoji: '🎙️',
          bgColor: '#ede9fe',
          borderColor: '#7c3aed',
          titleColor: '#6d28d9',
          textColor: '#5b21b6',
          borderRadius: 6,
        },
      },
      {
        type: 'heading',
        data: {
          text: 'Scaling from 10k to 10M Emails Without Landing in Spam',
          level: 'h1',
          fontSize: 26,
          fontWeight: 'bold',
          lineHeight: 1.25,
          align: 'left',
          color: '#0f172a',
          bgColor: '#ffffff',
          paddingTop: 20,
          paddingBottom: 10,
        },
      },
      {
        type: 'text',
        data: {
          content:
            'Join us for an exclusive 45-minute tactical masterclass where we break down the exact sending reputation protocols used by top SaaS platforms.',
          fontSize: 15,
          lineHeight: 1.6,
          color: '#475569',
          align: 'left',
          bgColor: '#ffffff',
          paddingY: 8,
        },
      },
      {
        type: 'three_column',
        data: {
          cardBgColor: '#faf5ff',
          cardBorderColor: '#f3e8ff',
          borderRadius: 8,
          titleColor: '#7c3aed',
          textColor: '#1e1b4b',
          col1Title: 'DATE',
          col1Text: 'Thursday, Dec 3',
          col2Title: 'TIME',
          col2Text: '2:00 PM EST',
          col3Title: 'DURATION',
          col3Text: '45 Mins + Q&A',
        },
      },
      {
        type: 'callout',
        data: {
          title: 'Speaker: Sarah Jenkins',
          text: 'Head of Deliverability · MetroMail. Ex-SendGrid Principal Reliability Engineer.',
          iconEmoji: '👩‍💼',
          bgColor: '#f8fafc',
          borderColor: '#7c3aed',
          titleColor: '#0f172a',
          textColor: '#64748b',
          borderRadius: 8,
        },
      },
      {
        type: 'text',
        data: {
          content:
            'What you will learn:\n• Why traditional domain warming scripts trigger modern AI spam filters\n• How to configure DMARC with strict quarantine without breaking forwarding\n• Live audit of real campaign setups to find deliverability leaks',
          fontSize: 14,
          lineHeight: 1.65,
          color: '#475569',
          align: 'left',
          bgColor: '#ffffff',
          paddingY: 12,
        },
      },
      {
        type: 'button',
        data: {
          text: 'Reserve Your Free Seat →',
          url: 'https://app.metrovps.com/events',
          bgColor: '#7c3aed',
          textColor: '#ffffff',
          fontSize: 15,
          borderRadius: 8,
          align: 'center',
          paddingY: 14,
          paddingX: 36,
          fullWidth: false,
        },
      },
      {
        type: 'footer',
        data: {
          companyName: 'MetroMail Events Team',
          address: "Can't attend live? Register anyway and we'll send you the full recording and slides!",
          unsubscribeText: 'Manage event notifications: {{unsubscribe_link}}',
          copyright: '© 2026 MetroVPS. All rights reserved.',
          color: '#94a3b8',
          bgColor: '#f8fafc',
          align: 'center',
          borderTop: true,
        },
      },
    ],
  },
  {
    id: 'newsletter-digest',
    name: 'Weekly Tech Digest Newsletter',
    tag: 'Newsletter',
    blocks: [
      {
        type: 'header',
        data: {
          brandName: 'METROVPS DIGEST',
          tagline: 'Issue #42 · October 2026',
          logoUrl: '',
          align: 'center',
          bgColor: '#ffffff',
          textColor: '#0f172a',
          taglineColor: '#64748b',
          paddingY: 22,
        },
      },
      {
        type: 'heading',
        data: {
          text: 'Edge Computing Trends, Rust in Infrastructure & Email AI',
          level: 'h1',
          fontSize: 26,
          fontWeight: 'bold',
          lineHeight: 1.3,
          align: 'left',
          color: '#0f172a',
          bgColor: '#ffffff',
          paddingTop: 20,
          paddingBottom: 8,
        },
      },
      {
        type: 'image',
        data: {
          url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1000&auto=format&fit=crop&q=80',
          alt: 'Server Racks Edge Architecture',
          link: 'https://app.metrovps.com/blog',
          borderRadius: 8,
          width: '100%',
          align: 'center',
          caption: 'Inside our new Stockholm Edge Point of Presence (PoP)',
          paddingY: 12,
        },
      },
      {
        type: 'text',
        data: {
          content:
            'Welcome to this week’s issue of the MetroVPS Engineering digest. In this edition, we dive into how WebAssembly edge workers are transforming latency profiles, and benchmark Rust vs Go in high-throughput network relays.',
          fontSize: 15,
          lineHeight: 1.6,
          color: '#475569',
          align: 'left',
          bgColor: '#ffffff',
          paddingY: 10,
        },
      },
      {
        type: 'three_column',
        data: {
          cardBgColor: '#f8fafc',
          cardBorderColor: '#e2e8f0',
          borderRadius: 8,
          titleColor: '#0f172a',
          textColor: '#64748b',
          col1Title: '🦀 Rust Edge Proxies',
          col1Text: '10x lower memory overhead for TLS termination.',
          col2Title: '⚡ WebAssembly PoPs',
          col2Text: 'Sub-millisecond cold starts across 45 edge regions.',
          col3Title: '🤖 AI Spam Filtering',
          col3Text: 'Detecting phishing attacks before delivery.',
        },
      },
      {
        type: 'quote',
        data: {
          quote: 'Deploying our workers at the edge lowered our P99 latencies from 120ms to 9ms globally.',
          author: 'David Chen',
          role: 'VP of Engineering, Veloce Labs',
          avatar: '',
          stars: 5,
          bgColor: '#f1f5f9',
          textColor: '#0f172a',
          align: 'left',
          borderRadius: 8,
        },
      },
      {
        type: 'button',
        data: {
          text: 'Read Full Digest on Engineering Blog →',
          url: 'https://app.metrovps.com/blog',
          bgColor: '#0f172a',
          textColor: '#ffffff',
          fontSize: 14,
          borderRadius: 8,
          align: 'center',
          paddingY: 13,
          paddingX: 30,
          fullWidth: false,
        },
      },
      {
        type: 'footer',
        data: {
          companyName: 'MetroVPS Engineering Digest',
          address: 'Curated weekly by the MetroVPS Systems Architecture team.',
          unsubscribeText: 'Unsubscribe from weekly newsletter: {{unsubscribe_link}}',
          copyright: '© 2026 MetroVPS Inc. All rights reserved.',
          color: '#94a3b8',
          bgColor: '#f8fafc',
          align: 'center',
          borderTop: true,
        },
      },
    ],
  },
  {
    id: 'corporate-letter',
    name: 'Executive Corporate Announcement',
    tag: 'Formal Letter',
    blocks: [
      {
        type: 'header',
        data: {
          brandName: 'METROMAIL CLOUD INC.',
          tagline: '100 Montgomery Street, Suite 1200 · San Francisco, CA 94104',
          logoUrl: '',
          align: 'center',
          bgColor: '#ffffff',
          textColor: '#0f172a',
          taglineColor: '#64748b',
          paddingY: 26,
        },
      },
      {
        type: 'heading',
        data: {
          text: 'Important Update Regarding Your MetroMail Enterprise Services',
          level: 'h2',
          fontSize: 22,
          fontWeight: 'bold',
          lineHeight: 1.35,
          align: 'left',
          color: '#0f172a',
          bgColor: '#ffffff',
          paddingTop: 16,
          paddingBottom: 8,
        },
      },
      {
        type: 'text',
        data: {
          content:
            'November 16, 2026\n\nDear {{first_name}},\n\nI am writing to personally share an important update regarding our core email delivery infrastructure and upcoming service enhancements.\n\nOver the past year, our engineering team has been building a second-generation multi-region network to provide sub-millisecond dispatch times and guaranteed zero-downtime failover for your enterprise workloads.',
          fontSize: 15,
          lineHeight: 1.7,
          color: '#334155',
          align: 'left',
          bgColor: '#ffffff',
          paddingY: 10,
        },
      },
      {
        type: 'callout',
        data: {
          title: 'Key Infrastructure Enhancements',
          text: '1. Multi-Region Active Failover: Messages automatically reroute if any regional data center experiences network degradation.\n2. Enhanced Post-Quantum Encryption: All SMTP transit connections now support TLS 1.3 with quantum-resistant cipher suites.\n3. Dedicated Compliance Logging: 365-day immutable audit trails for strict SOC2 and HIPAA compliance.',
          iconEmoji: '🛡️',
          bgColor: '#f8fafc',
          borderColor: '#0f172a',
          titleColor: '#0f172a',
          textColor: '#334155',
          borderRadius: 4,
        },
      },
      {
        type: 'text',
        data: {
          content:
            'No action is required on your part. These upgrades will roll out transparently over the coming weekend during our standard maintenance window.\n\nWarm regards,\n\nAlex Morgan\nChief Executive Officer\nMetroMail Cloud Inc.',
          fontSize: 15,
          lineHeight: 1.7,
          color: '#334155',
          align: 'left',
          bgColor: '#ffffff',
          paddingY: 10,
        },
      },
      {
        type: 'footer',
        data: {
          companyName: 'MetroMail Legal & Compliance Notice',
          address: 'Confidentiality Note: This transmission is intended solely for the recipient named above.',
          unsubscribeText: 'Manage communication preferences: {{unsubscribe_link}}',
          copyright: '© 2026 MetroMail Cloud Inc. All rights reserved.',
          color: '#94a3b8',
          bgColor: '#f8fafc',
          align: 'center',
          borderTop: true,
        },
      },
    ],
  },
  {
    id: 'account-welcome',
    name: 'Account Welcome & Onboarding Guide',
    tag: 'Onboarding',
    blocks: [
      {
        type: 'header',
        data: {
          brandName: 'METROMAIL',
          tagline: 'High-Performance Delivery Infrastructure',
          logoUrl: '',
          align: 'center',
          bgColor: '#ffffff',
          textColor: '#16a34a',
          taglineColor: '#64748b',
          paddingY: 24,
        },
      },
      {
        type: 'heading',
        data: {
          text: 'Welcome to MetroMail, {{first_name}}!',
          level: 'h1',
          fontSize: 26,
          fontWeight: 'bold',
          lineHeight: 1.25,
          align: 'center',
          color: '#0f172a',
          bgColor: '#ffffff',
          paddingTop: 18,
          paddingBottom: 8,
        },
      },
      {
        type: 'text',
        data: {
          content:
            'We’re thrilled to have you onboard! Here is your 3-step quickstart guide to sending your first email in under 5 minutes.',
          fontSize: 15,
          lineHeight: 1.6,
          color: '#475569',
          align: 'center',
          bgColor: '#ffffff',
          paddingY: 8,
        },
      },
      {
        type: 'three_column',
        data: {
          cardBgColor: '#f0fdf4',
          cardBorderColor: '#bbf7d0',
          borderRadius: 8,
          titleColor: '#15803d',
          textColor: '#166534',
          btnBgColor: '#16a34a',
          btnTextColor: '#ffffff',
          col1Title: '1. Verify Domain',
          col1Text: 'Publish your SPF and DKIM DNS records to authenticate your sender reputation.',
          col1BtnText: 'Verify Domain',
          col1Link: 'https://app.metrovps.com/domains',
          col2Title: '2. API Credentials',
          col2Text: 'Generate production SMTP credentials or high-speed REST API tokens.',
          col2BtnText: 'Get API Key',
          col2Link: 'https://app.metrovps.com/api-keys',
          col3Title: '3. Send First Email',
          col3Text: 'Use our Node.js, Python, or cURL code samples to send a test message.',
          col3BtnText: 'Send Test',
          col3Link: 'https://app.metrovps.com/docs',
        },
      },
      {
        type: 'button',
        data: {
          text: 'Open Developer Documentation →',
          url: 'https://app.metrovps.com/docs',
          bgColor: '#16a34a',
          textColor: '#ffffff',
          fontSize: 15,
          borderRadius: 8,
          align: 'center',
          paddingY: 14,
          paddingX: 32,
          fullWidth: false,
        },
      },
      {
        type: 'callout',
        data: {
          title: 'Need Any Assistance?',
          text: 'Our team of deliverability engineers is available 24/7. Just reply to this email or visit our help center.',
          iconEmoji: '💬',
          bgColor: '#f8fafc',
          borderColor: '#16a34a',
          titleColor: '#0f172a',
          textColor: '#475569',
          borderRadius: 8,
        },
      },
      {
        type: 'footer',
        data: {
          companyName: 'MetroMail Customer Success Team',
          address: '100 Montgomery St, Suite 1200 · San Francisco, CA',
          unsubscribeText: 'Manage onboarding communications: {{unsubscribe_link}}',
          copyright: '© 2026 MetroMail Cloud Inc. All rights reserved.',
          color: '#94a3b8',
          bgColor: '#f8fafc',
          align: 'center',
          borderTop: true,
        },
      },
    ],
  },
  {
    id: 'invoice-receipt',
    name: 'Payment Receipt & Order Invoice',
    tag: 'Receipt',
    blocks: [
      {
        type: 'header',
        data: {
          brandName: 'METROMAIL BILLING',
          tagline: 'Invoice #MM-INV-2026-9812 · PAID',
          logoUrl: '',
          align: 'center',
          bgColor: '#ffffff',
          textColor: '#0f172a',
          taglineColor: '#16a34a',
          paddingY: 24,
        },
      },
      {
        type: 'heading',
        data: {
          text: 'Thank you for your payment of $64.00',
          level: 'h1',
          fontSize: 24,
          fontWeight: 'bold',
          lineHeight: 1.3,
          align: 'center',
          color: '#0f172a',
          bgColor: '#ffffff',
          paddingTop: 16,
          paddingBottom: 6,
        },
      },
      {
        type: 'two_column',
        data: {
          cardBgColor: '#f8fafc',
          cardBorderColor: '#e2e8f0',
          borderRadius: 8,
          titleColor: '#0f172a',
          textColor: '#64748b',
          col1Title: 'Billed To',
          col1Text: '{{first_name}} ({{company}})\nBilling ID: #CUST-9821\nTerms: Due on receipt',
          col2Title: 'Payment Method',
          col2Text: 'Visa ending in 4242\nStatus: PAID IN FULL\nDate: November 16, 2026',
        },
      },
      {
        type: 'callout',
        data: {
          title: 'Itemized Charges',
          text: '• MetroMail Growth Plan (Monthly): $49.00\n• Dedicated Clean IP Address Add-on: $15.00\n-----------------------------------\nSubtotal: $64.00 | Tax (0%): $0.00 | Total Paid: $64.00',
          iconEmoji: '🧾',
          bgColor: '#f8fafc',
          borderColor: '#10b981',
          titleColor: '#0f172a',
          textColor: '#334155',
          borderRadius: 8,
        },
      },
      {
        type: 'button',
        data: {
          text: 'Download PDF Invoice Receipt →',
          url: 'https://app.metrovps.com/billing/invoices',
          bgColor: '#0f172a',
          textColor: '#ffffff',
          fontSize: 14,
          borderRadius: 8,
          align: 'center',
          paddingY: 13,
          paddingX: 30,
          fullWidth: false,
        },
      },
      {
        type: 'footer',
        data: {
          companyName: 'MetroMail Billing & Financial Operations',
          address: 'Questions about this charge? Contact billing@metrovps.com',
          unsubscribeText: 'Manage receipt preferences: {{unsubscribe_link}}',
          copyright: '© 2026 MetroMail Cloud Inc. All rights reserved.',
          color: '#94a3b8',
          bgColor: '#f8fafc',
          align: 'center',
          borderTop: true,
        },
      },
    ],
  },
]

/**
 * Returns a clone of blocks for any given preset template so it loads in Visual Builder
 */
export function getBlocksForPreset(preset: { id: string; name: string; tag?: string; description?: string }): EmailBlock[] {
  const match = STARTER_LAYOUTS.find(
    (l) =>
      l.id === preset.id ||
      l.name.toLowerCase() === preset.name.toLowerCase() ||
      (preset.tag && l.tag.toLowerCase() === preset.tag.toLowerCase())
  )
  if (match) {
    return match.blocks.map((b) => ({
      ...b,
      id: `blk_${Math.random().toString(36).substring(2, 9)}`,
      data: JSON.parse(JSON.stringify(b.data)),
    }))
  }
  return STARTER_LAYOUTS[0].blocks.map((b) => ({
    ...b,
    id: `blk_${Math.random().toString(36).substring(2, 9)}`,
    data: JSON.parse(JSON.stringify(b.data)),
  }))
}

/**
 * Converts any raw or rich HTML email into visual EmailBlocks
 * so switching between Rich Text/HTML code editor and Visual Drag & Drop Builder preserves everything seamlessly!
 */
export function convertHtmlToEmailBlocks(html: string): EmailBlock[] {
  if (!html || !html.trim()) {
    return []
  }

  // 1. Check if HTML matches any preset in EMAIL_TEMPLATES or STARTER_LAYOUTS
  const foundPreset = EMAIL_TEMPLATES.find(
    (t) =>
      t.html.trim() === html.trim() ||
      html.includes(t.id) ||
      (t.name && html.includes(t.name)) ||
      (t.subject && html.includes(t.subject))
  )
  if (foundPreset) {
    return getBlocksForPreset(foundPreset)
  }

  // 2. In browser environment, parse DOM elements into visual blocks
  if (typeof window !== 'undefined') {
    try {
      const parser = new DOMParser()
      const doc = parser.parseFromString(html, 'text/html')
      const body = doc.body
      const newId = () => `blk_${Math.random().toString(36).substring(2, 9)}`
      const parsedBlocks: EmailBlock[] = []

      // Check for header or brand banner
      const brandLogo = body.querySelector('img[alt*="logo" i], img[src*="logo" i], header img')
      const brandH1 = body.querySelector('header h1, header h2, .email-header h2')
      if (brandLogo || brandH1) {
        parsedBlocks.push({
          id: newId(),
          type: 'header',
          data: {
            brandName: brandH1?.textContent?.trim() || 'METROMAIL',
            tagline: body.querySelector('header p, .email-header p')?.textContent?.trim() || '',
            logoUrl: brandLogo?.getAttribute('src') || '',
            logoHeight: 44,
            align: 'center',
            bgColor: '#ffffff',
            textColor: '#0f172a',
            taglineColor: '#64748b',
            paddingY: 24,
          },
        })
      }

      // Collect primary elements
      const elements = Array.from(
        body.querySelectorAll('h1, h2, h3, h4, p, img, a.btn, a[style*="background"], hr, blockquote')
      )

      elements.forEach((el) => {
        if (el === brandLogo) return
        const tag = el.tagName.toLowerCase()

        if (['h1', 'h2', 'h3', 'h4'].includes(tag)) {
          const text = el.textContent?.trim()
          if (text) {
            parsedBlocks.push({
              id: newId(),
              type: 'heading',
              data: {
                text,
                level: tag,
                fontSize: tag === 'h1' ? 26 : tag === 'h2' ? 22 : 18,
                fontWeight: 'bold',
                lineHeight: 1.3,
                align: 'center',
                color: '#0f172a',
                bgColor: '#ffffff',
                paddingTop: 20,
                paddingBottom: 10,
              },
            })
          }
        } else if (tag === 'img') {
          const src = el.getAttribute('src')
          if (src) {
            const link = el.closest('a')?.getAttribute('href') || ''
            parsedBlocks.push({
              id: newId(),
              type: 'image',
              data: {
                url: src,
                alt: el.getAttribute('alt') || 'Email Image',
                link,
                borderRadius: 8,
                width: '100%',
                align: 'center',
                caption: '',
                paddingY: 14,
              },
            })
          }
        } else if (tag === 'p') {
          const text = el.textContent?.trim()
          if (!text) return

          // Unsubscribe / footer text check
          if (
            text.includes('unsubscribe') ||
            text.includes('All rights reserved') ||
            text.includes('©') ||
            text.includes('{{unsubscribe_link}}')
          ) {
            if (!parsedBlocks.some((b) => b.type === 'footer')) {
              parsedBlocks.push({
                id: newId(),
                type: 'footer',
                data: {
                  companyName: 'MetroVPS Inc.',
                  address: text.split('\n')[0] || '100 Tech Blvd, Suite 400',
                  unsubscribeText: 'Unsubscribe from these emails: {{unsubscribe_link}}',
                  copyright: '© 2026 MetroVPS. All rights reserved.',
                  color: '#94a3b8',
                  bgColor: '#f8fafc',
                  align: 'center',
                  borderTop: true,
                },
              })
            }
          } else {
            // Check if paragraph is just a button link
            const childA = el.querySelector('a')
            if (childA && childA.textContent?.trim() === text) {
              parsedBlocks.push({
                id: newId(),
                type: 'button',
                data: {
                  text: childA.textContent.trim(),
                  url: childA.getAttribute('href') || '#',
                  bgColor: '#1374f8',
                  textColor: '#ffffff',
                  fontSize: 15,
                  borderRadius: 8,
                  align: 'center',
                  paddingY: 12,
                  paddingX: 28,
                  fullWidth: false,
                },
              })
            } else {
              parsedBlocks.push({
                id: newId(),
                type: 'text',
                data: {
                  content: text,
                  fontSize: 15,
                  lineHeight: 1.6,
                  align: 'left',
                  color: '#475569',
                  bgColor: '#ffffff',
                  paddingY: 12,
                },
              })
            }
          }
        } else if (
          tag === 'a' &&
          (el.getAttribute('style')?.includes('background') ||
            el.classList.contains('button') ||
            el.classList.contains('btn'))
        ) {
          const btnText = el.textContent?.trim()
          if (btnText) {
            parsedBlocks.push({
              id: newId(),
              type: 'button',
              data: {
                text: btnText,
                url: el.getAttribute('href') || '#',
                bgColor: '#1374f8',
                textColor: '#ffffff',
                fontSize: 15,
                borderRadius: 8,
                align: 'center',
                paddingY: 12,
                paddingX: 28,
                fullWidth: false,
              },
            })
          }
        } else if (tag === 'hr') {
          parsedBlocks.push({
            id: newId(),
            type: 'divider',
            data: {
              color: '#e2e8f0',
              thickness: 1,
              style: 'solid',
              width: '100%',
              spacing: 24,
            },
          })
        } else if (tag === 'blockquote') {
          parsedBlocks.push({
            id: newId(),
            type: 'quote',
            data: {
              quote: el.textContent?.trim() || '',
              author: 'Customer',
              role: 'Product Leader',
              avatar: '',
              stars: 5,
              bgColor: '#f8fafc',
              textColor: '#0f172a',
              align: 'left',
              borderRadius: 8,
            },
          })
        }
      })

      if (parsedBlocks.length > 0) {
        return parsedBlocks
      }

      // If no discrete blocks detected, package as HTML embed block
      return [
        {
          id: newId(),
          type: 'html',
          data: {
            code: html,
            bgColor: '#ffffff',
            padding: 16,
          },
        },
      ]
    } catch {
      // Fall through to starter layout
    }
  }

  return []
}

/**
 * Compiles array of EmailBlocks into clean, standard responsive HTML email string
 */
export function compileBlocksToHtml(blocks: EmailBlock[]): string {
  const renderedBlocks = blocks
    .map((block) => {
      const d = block.data
      switch (block.type) {
        case 'header':
          return `
            <tr>
              <td align="${d.align || 'center'}" style="padding: ${d.paddingY || 24}px 28px; background-color: ${
            d.bgColor || '#ffffff'
          }; border-bottom: 1px solid #f1f5f9;">
                ${
                  d.logoUrl
                    ? `<img src="${d.logoUrl}" alt="${
                        d.brandName || ''
                      }" style="max-height: ${d.logoHeight || 44}px; max-width: 220px; height: auto; display: inline-block; margin-bottom: 8px;" /><br/>`
                    : `<table border="0" cellspacing="0" cellpadding="0" style="margin: ${
                        d.align === 'left' ? '0' : d.align === 'right' ? '0 0 0 auto' : '0 auto'
                      };">
                        <tr>
                          <td style="background: linear-gradient(135deg,#1374f8,#075ce0); padding: 8px 18px; border-radius: 10px; font-size: 18px; font-weight: 800; letter-spacing: 1px; color: #ffffff; text-align: center;">
                            ${d.brandName || 'METROMAIL'}
                          </td>
                        </tr>
                      </table>`
                }
                ${
                  d.tagline
                    ? `<div style="margin-top: 6px;">
                        <span style="display: inline-block; font-size: 11px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; color: ${
                          d.taglineColor || '#4338ca'
                        }; background-color: #eef2ff; padding: 3px 10px; border-radius: 20px;">
                          ${d.tagline}
                        </span>
                      </div>`
                    : ''
                }
              </td>
            </tr>`

        case 'heading': {
          const Tag = (['h1', 'h2', 'h3', 'h4'].includes(d.level) ? d.level : 'h1') as string
          const weight = d.fontWeight === 'normal' ? 400 : d.fontWeight === 'medium' ? 500 : 750
          return `
            <tr>
              <td align="${d.align || 'center'}" style="padding: ${d.paddingTop ?? 20}px 28px ${
            d.paddingBottom ?? 10
          }px; background-color: ${d.bgColor || '#ffffff'};">
                <${Tag} style="margin: 0; font-size: ${d.fontSize || 24}px; font-weight: ${weight}; color: ${
            d.color || '#0f172a'
          }; line-height: ${d.lineHeight || 1.3};">
                  ${d.text}
                </${Tag}>
              </td>
            </tr>`
        }

        case 'text':
          return `
            <tr>
              <td align="${d.align || 'left'}" style="padding: ${d.paddingY || 12}px 28px; background-color: ${
            d.bgColor || '#ffffff'
          };">
                <p style="margin: 0; font-size: ${d.fontSize || 15}px; line-height: ${
            d.lineHeight || 1.6
          }; color: ${d.color || '#475569'}; white-space: pre-line; text-align: ${d.align || 'left'};">
                  ${d.content}
                </p>
              </td>
            </tr>`

        case 'button':
          return `
            <tr>
              <td align="${d.align || 'center'}" style="padding: ${d.paddingY || 14}px 28px 20px;">
                <table border="0" cellspacing="0" cellpadding="0" ${
                  d.fullWidth ? 'width="100%"' : ''
                } style="${d.fullWidth ? 'width: 100%;' : ''}">
                  <tr>
                    <td align="center" style="border-radius: ${d.borderRadius || 8}px; background-color: ${
            d.bgColor || '#1374f8'
          };">
                      <a href="${
                        d.url || '#'
                      }" target="_blank" style="display: ${
            d.fullWidth ? 'block' : 'inline-block'
          }; padding: ${d.paddingY || 12}px ${d.paddingX || 28}px; font-size: ${
            d.fontSize || 15
          }px; font-weight: 600; color: ${
            d.textColor || '#ffffff'
          }; text-decoration: none; border-radius: ${
            d.borderRadius || 8
          }px; font-family: sans-serif; text-align: center;">
                        ${d.text || 'Click Here'}
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>`

        case 'image':
          return `
            <tr>
              <td align="${d.align || 'center'}" style="padding: ${d.paddingY || 14}px 28px;">
                ${d.link ? `<a href="${d.link}" target="_blank">` : ''}
                <img src="${d.url}" alt="${
            d.alt || ''
          }" style="display: block; max-width: 100%; width: ${
            d.width || '100%'
          }; height: auto; border-radius: ${
            d.borderRadius || 8
          }px; border: 0; margin: ${
            d.align === 'center' ? '0 auto' : d.align === 'right' ? '0 0 0 auto' : '0 auto 0 0'
          };" />
                ${d.link ? `</a>` : ''}
                ${
                  d.caption
                    ? `<p style="margin: 6px 0 0; font-size: 12px; color: #64748b; text-align: ${
                        d.align || 'center'
                      };">${d.caption}</p>`
                    : ''
                }
              </td>
            </tr>`

        case 'two_column':
          return `
            <tr>
              <td style="padding: 16px 28px;">
                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td width="48%" valign="top" style="background-color: ${
                      d.cardBgColor || '#f8fafc'
                    }; border-radius: ${d.borderRadius || 8}px; border: 1px solid ${
            d.cardBorderColor || '#e2e8f0'
          }; padding: 16px;">
                      ${
                        d.col1Img
                          ? `<img src="${d.col1Img}" alt="${
                              d.col1Title || ''
                            }" style="width: 100%; height: 120px; object-fit: cover; border-radius: 6px; margin-bottom: 10px; display: block;" />`
                          : ''
                      }
                      <h4 style="margin: 0 0 6px; font-size: 15px; font-weight: 700; color: ${
                        d.titleColor || '#0f172a'
                      };">${d.col1Title || ''}</h4>
                      <p style="margin: 0 0 10px; font-size: 13px; line-height: 1.5; color: ${
                        d.textColor || '#64748b'
                      }; white-space: pre-line;">${d.col1Text || ''}</p>
                      ${
                        d.col1BtnText
                          ? `<a href="${
                              d.col1Link || '#'
                            }" target="_blank" style="display: inline-block; padding: 7px 14px; font-size: 12px; font-weight: 600; color: ${
                              d.btnTextColor || '#ffffff'
                            }; background-color: ${
                              d.btnBgColor || '#1374f8'
                            }; border-radius: 6px; text-decoration: none;">${d.col1BtnText}</a>`
                          : ''
                      }
                    </td>
                    <td width="4%"></td>
                    <td width="48%" valign="top" style="background-color: ${
                      d.cardBgColor || '#f8fafc'
                    }; border-radius: ${d.borderRadius || 8}px; border: 1px solid ${
            d.cardBorderColor || '#e2e8f0'
          }; padding: 16px;">
                      ${
                        d.col2Img
                          ? `<img src="${d.col2Img}" alt="${
                              d.col2Title || ''
                            }" style="width: 100%; height: 120px; object-fit: cover; border-radius: 6px; margin-bottom: 10px; display: block;" />`
                          : ''
                      }
                      <h4 style="margin: 0 0 6px; font-size: 15px; font-weight: 700; color: ${
                        d.titleColor || '#0f172a'
                      };">${d.col2Title || ''}</h4>
                      <p style="margin: 0 0 10px; font-size: 13px; line-height: 1.5; color: ${
                        d.textColor || '#64748b'
                      }; white-space: pre-line;">${d.col2Text || ''}</p>
                      ${
                        d.col2BtnText
                          ? `<a href="${
                              d.col2Link || '#'
                            }" target="_blank" style="display: inline-block; padding: 7px 14px; font-size: 12px; font-weight: 600; color: ${
                              d.btnTextColor || '#ffffff'
                            }; background-color: ${
                              d.btnBgColor || '#1374f8'
                            }; border-radius: 6px; text-decoration: none;">${d.col2BtnText}</a>`
                          : ''
                      }
                    </td>
                  </tr>
                </table>
              </td>
            </tr>`

        case 'three_column':
          return `
            <tr>
              <td style="padding: 16px 28px;">
                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td width="30%" valign="top" style="background-color: ${
                      d.cardBgColor || '#f8fafc'
                    }; border-radius: ${d.borderRadius || 8}px; border: 1px solid ${
            d.cardBorderColor || '#e2e8f0'
          }; padding: 12px; text-align: center;">
                      ${
                        d.col1Img
                          ? `<img src="${d.col1Img}" alt="${
                              d.col1Title || ''
                            }" style="width: 100%; height: 85px; object-fit: cover; border-radius: 6px; margin-bottom: 8px; display: block;" />`
                          : ''
                      }
                      <h4 style="margin: 0 0 4px; font-size: 13.5px; font-weight: 700; color: ${
                        d.titleColor || '#0f172a'
                      };">${d.col1Title || ''}</h4>
                      <p style="margin: 0 0 8px; font-size: 11.5px; line-height: 1.45; color: ${
                        d.textColor || '#64748b'
                      }; white-space: pre-line;">${d.col1Text || ''}</p>
                      ${
                        d.col1BtnText
                          ? `<a href="${
                              d.col1Link || '#'
                            }" target="_blank" style="display: inline-block; padding: 5px 10px; font-size: 11px; font-weight: 600; color: #ffffff; background-color: #1374f8; border-radius: 4px; text-decoration: none;">${d.col1BtnText}</a>`
                          : ''
                      }
                    </td>
                    <td width="5%"></td>
                    <td width="30%" valign="top" style="background-color: ${
                      d.cardBgColor || '#f8fafc'
                    }; border-radius: ${d.borderRadius || 8}px; border: 1px solid ${
            d.cardBorderColor || '#e2e8f0'
          }; padding: 12px; text-align: center;">
                      ${
                        d.col2Img
                          ? `<img src="${d.col2Img}" alt="${
                              d.col2Title || ''
                            }" style="width: 100%; height: 85px; object-fit: cover; border-radius: 6px; margin-bottom: 8px; display: block;" />`
                          : ''
                      }
                      <h4 style="margin: 0 0 4px; font-size: 13.5px; font-weight: 700; color: ${
                        d.titleColor || '#0f172a'
                      };">${d.col2Title || ''}</h4>
                      <p style="margin: 0 0 8px; font-size: 11.5px; line-height: 1.45; color: ${
                        d.textColor || '#64748b'
                      }; white-space: pre-line;">${d.col2Text || ''}</p>
                      ${
                        d.col2BtnText
                          ? `<a href="${
                              d.col2Link || '#'
                            }" target="_blank" style="display: inline-block; padding: 5px 10px; font-size: 11px; font-weight: 600; color: #ffffff; background-color: #1374f8; border-radius: 4px; text-decoration: none;">${d.col2BtnText}</a>`
                          : ''
                      }
                    </td>
                    <td width="5%"></td>
                    <td width="30%" valign="top" style="background-color: ${
                      d.cardBgColor || '#f8fafc'
                    }; border-radius: ${d.borderRadius || 8}px; border: 1px solid ${
            d.cardBorderColor || '#e2e8f0'
          }; padding: 12px; text-align: center;">
                      ${
                        d.col3Img
                          ? `<img src="${d.col3Img}" alt="${
                              d.col3Title || ''
                            }" style="width: 100%; height: 85px; object-fit: cover; border-radius: 6px; margin-bottom: 8px; display: block;" />`
                          : ''
                      }
                      <h4 style="margin: 0 0 4px; font-size: 13.5px; font-weight: 700; color: ${
                        d.titleColor || '#0f172a'
                      };">${d.col3Title || ''}</h4>
                      <p style="margin: 0 0 8px; font-size: 11.5px; line-height: 1.45; color: ${
                        d.textColor || '#64748b'
                      }; white-space: pre-line;">${d.col3Text || ''}</p>
                      ${
                        d.col3BtnText
                          ? `<a href="${
                              d.col3Link || '#'
                            }" target="_blank" style="display: inline-block; padding: 5px 10px; font-size: 11px; font-weight: 600; color: #ffffff; background-color: #1374f8; border-radius: 4px; text-decoration: none;">${d.col3BtnText}</a>`
                          : ''
                      }
                    </td>
                  </tr>
                </table>
              </td>
            </tr>`

        case 'callout':
          return `
            <tr>
              <td style="padding: 14px 28px;">
                <table width="100%" border="0" cellspacing="0" cellpadding="16" style="background-color: ${
                  d.bgColor || '#eff6ff'
                }; ${
            d.borderColor ? `border-left: 4px solid ${d.borderColor};` : ''
          } border-radius: ${d.borderRadius || 6}px;">
                  <tr>
                    <td>
                      ${
                        d.title
                          ? `<h4 style="margin: 0 0 6px; font-size: 14px; font-weight: 650; color: ${
                              d.titleColor || '#0f172a'
                            };">
                              ${d.iconEmoji ? `${d.iconEmoji} ` : ''}${d.title}
                            </h4>`
                          : ''
                      }
                      <p style="margin: 0; font-size: 13.5px; line-height: 1.6; color: ${
                        d.textColor || '#334155'
                      }; white-space: pre-line;">
                        ${d.text || ''}
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>`

        case 'quote': {
          const stars = '★'.repeat(Number(d.stars) || 5)
          return `
            <tr>
              <td style="padding: 16px 28px;">
                <table width="100%" border="0" cellspacing="0" cellpadding="18" style="background-color: ${
                  d.bgColor || '#f8fafc'
                }; border-radius: ${d.borderRadius || 8}px; border: 1px solid #e2e8f0;">
                  <tr>
                    <td align="${d.align || 'left'}">
                      <div style="color: #f59e0b; font-size: 15px; margin-bottom: 8px;">${stars}</div>
                      <p style="margin: 0 0 12px; font-size: 14.5px; font-style: italic; line-height: 1.6; color: ${
                        d.textColor || '#0f172a'
                      };">${d.quote || ''}</p>
                      <table border="0" cellspacing="0" cellpadding="0" style="${
                        d.align === 'center' ? 'margin: 0 auto;' : ''
                      }">
                        <tr>
                          ${
                            d.avatar
                              ? `<td style="padding-right: 10px;"><img src="${d.avatar}" alt="${
                                  d.author || ''
                                }" style="width: 38px; height: 38px; border-radius: 50%; object-fit: cover; display: block;" /></td>`
                              : ''
                          }
                          <td>
                            <strong style="display: block; font-size: 13px; color: #0f172a;">${
                              d.author || ''
                            }</strong>
                            <span style="font-size: 11.5px; color: #64748b;">${d.role || ''}</span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>`
        }

        case 'video':
          return `
            <tr>
              <td align="${d.align || 'center'}" style="padding: 16px 28px;">
                <a href="${
                  d.videoUrl || '#'
                }" target="_blank" style="display: inline-block; position: relative; text-decoration: none; max-width: 100%;">
                  <img src="${d.thumbnailUrl}" alt="${
            d.title || 'Video'
          }" style="width: 100%; max-width: 544px; height: auto; border-radius: 8px; display: block;" />
                  ${
                    d.showPlayButton !== false
                      ? `<div style="margin-top: 8px; text-align: center;"><span style="display: inline-block; background-color: #dc2626; color: #ffffff; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 700;">▶ Watch Video ${
                          d.duration ? `(${d.duration})` : ''
                        }</span></div>`
                      : ''
                  }
                </a>
                ${
                  d.title
                    ? `<h4 style="margin: 10px 0 0; font-size: 14px; font-weight: 650; color: #0f172a; text-align: ${
                        d.align || 'center'
                      };">${d.title}</h4>`
                    : ''
                }
              </td>
            </tr>`

        case 'divider':
          return `
            <tr>
              <td align="center" style="padding: ${d.spacing || 20}px 28px;">
                <hr style="border: 0; border-top: ${d.thickness || 1}px ${
            d.style || 'solid'
          } ${d.color || '#e2e8f0'}; width: ${d.width || '100%'}; margin: 0 auto;" />
              </td>
            </tr>`

        case 'spacer':
          return `
            <tr>
              <td height="${d.height || 24}" style="line-height: ${
            d.height || 24
          }px; font-size: 0; background-color: ${d.bgColor || 'transparent'};">&nbsp;</td>
            </tr>`

        case 'social': {
          const color = d.linkColor || '#1374f8'
          const links = [
            d.twitter &&
              `<a href="${d.twitter}" target="_blank" style="color: ${color}; text-decoration: none; font-weight: 600; font-size: 13px; margin: 0 8px;">X (Twitter)</a>`,
            d.linkedin &&
              `<a href="${d.linkedin}" target="_blank" style="color: ${color}; text-decoration: none; font-weight: 600; font-size: 13px; margin: 0 8px;">LinkedIn</a>`,
            d.github &&
              `<a href="${d.github}" target="_blank" style="color: ${color}; text-decoration: none; font-weight: 600; font-size: 13px; margin: 0 8px;">GitHub</a>`,
            d.facebook &&
              `<a href="${d.facebook}" target="_blank" style="color: ${color}; text-decoration: none; font-weight: 600; font-size: 13px; margin: 0 8px;">Facebook</a>`,
            d.instagram &&
              `<a href="${d.instagram}" target="_blank" style="color: ${color}; text-decoration: none; font-weight: 600; font-size: 13px; margin: 0 8px;">Instagram</a>`,
            d.youtube &&
              `<a href="${d.youtube}" target="_blank" style="color: ${color}; text-decoration: none; font-weight: 600; font-size: 13px; margin: 0 8px;">YouTube</a>`,
            d.website &&
              `<a href="${d.website}" target="_blank" style="color: ${color}; text-decoration: none; font-weight: 600; font-size: 13px; margin: 0 8px;">Website</a>`,
          ].filter(Boolean)
          return `
            <tr>
              <td align="${d.align || 'center'}" style="padding: 16px 28px;">
                ${links.join(' &middot; ')}
              </td>
            </tr>`
        }

        case 'footer':
          return `
            <tr>
              <td align="${d.align || 'center'}" style="padding: 24px 28px; background-color: ${
            d.bgColor || '#f8fafc'
          }; ${d.borderTop !== false ? 'border-top: 1px solid #f1f5f9;' : ''}">
                <p style="margin: 0 0 6px; font-size: 12.5px; font-weight: 600; color: #475569;">${
                  d.companyName || 'MetroVPS Inc.'
                }</p>
                <p style="margin: 0 0 10px; font-size: 11.5px; color: ${
                  d.color || '#94a3b8'
                }; line-height: 1.4;">
                  ${d.address || ''}
                </p>
                <p style="margin: 0 0 6px; font-size: 11.5px; color: ${
                  d.color || '#94a3b8'
                };">
                  ${d.unsubscribeText || '{{unsubscribe_link}}'}
                </p>
                <p style="margin: 0; font-size: 11px; color: #cbd5e1;">${
                  d.copyright || ''
                }</p>
              </td>
            </tr>`

        case 'html':
          return `
            <tr>
              <td style="padding: ${d.padding ?? 16}px 28px; background-color: ${
            d.bgColor || '#ffffff'
          };">
                ${d.code || ''}
              </td>
            </tr>`

        default:
          return ''
      }
    })
    .join('\n')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Template</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 32px 12px;">
    <tr>
      <td align="center">
        <!-- Main Email Container -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 16px rgba(15,23,42,0.04);">
          ${renderedBlocks}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

interface VisualEmailBuilderProps {
  initialDesign?: EmailBlock[] | null
  initialHtml?: string
  onChange: (result: { html: string; design: EmailBlock[] }) => void
  onAction?: (msg: string) => void
}

export function VisualEmailBuilder({
  initialDesign,
  initialHtml,
  onChange,
  onAction = () => {},
}: VisualEmailBuilderProps) {
  // Blocks state
  const [blocks, setBlocks] = useState<EmailBlock[]>(() => {
    if (Array.isArray(initialDesign) && initialDesign.length > 0) {
      return initialDesign
    }
    if (initialHtml && initialHtml.trim()) {
      const match = EMAIL_TEMPLATES.find(
        (t) =>
          t.html.trim() === initialHtml.trim() ||
          (t.id && initialHtml.includes(t.id)) ||
          (t.name && initialHtml.includes(t.name)) ||
          (t.subject && initialHtml.includes(t.subject))
      )
      if (match) {
        return getBlocksForPreset(match)
      }
      const converted = convertHtmlToEmailBlocks(initialHtml)
      if (converted.length > 0) return converted
    }
    // Default: Clean empty canvas with NO pre-designed template
    return []
  })

  // Selected block ID for properties inspector
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)

  // Drag-and-drop state
  const [draggedBlockIndex, setDraggedBlockIndex] = useState<number | null>(null)
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null)
  const [canvasDragOver, setCanvasDragOver] = useState(false)

  // Synchronize when initialDesign changes externally (e.g. preset loaded from library)
  // Track our own emitted references so parent round-trips don't reset selection or close Block Inspector
  const lastExternalDesignRef = useRef(initialDesign)
  const lastEmittedDesignRef = useRef<EmailBlock[] | null>(null)
  const lastEmittedHtmlRef = useRef<string>('')
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => {
    if (
      Array.isArray(initialDesign) &&
      initialDesign.length > 0 &&
      initialDesign !== lastExternalDesignRef.current &&
      initialDesign !== lastEmittedDesignRef.current
    ) {
      lastExternalDesignRef.current = initialDesign
      setBlocks(initialDesign)
      setSelectedBlockId(null)
    }
  }, [initialDesign])

  // Synchronize when initialHtml changes externally if design is empty
  const lastExternalHtmlRef = useRef(initialHtml)
  useEffect(() => {
    if (
      (!initialDesign || initialDesign.length === 0) &&
      initialHtml &&
      initialHtml.trim() &&
      initialHtml !== lastExternalHtmlRef.current &&
      initialHtml !== lastEmittedHtmlRef.current
    ) {
      lastExternalHtmlRef.current = initialHtml
      const match = EMAIL_TEMPLATES.find(
        (t) =>
          t.html.trim() === initialHtml.trim() ||
          (t.id && initialHtml.includes(t.id)) ||
          (t.name && initialHtml.includes(t.name)) ||
          (t.subject && initialHtml.includes(t.subject))
      )
      if (match) {
        setBlocks(getBlocksForPreset(match))
      } else {
        setBlocks(convertHtmlToEmailBlocks(initialHtml))
      }
      setSelectedBlockId(null)
    }
  }, [initialHtml, initialDesign])

  // View mode: Interactive visual blocks canvas OR 1:1 Same-to-Same Real HTML Preview
  const [studioViewMode, setStudioViewMode] = useState<'canvas' | 'preview'>('canvas')

  // Device view mode
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop')

  // Block Category Filter in Left Sidebar
  const [categoryFilter, setCategoryFilter] = useState<
    'All' | 'Typography' | 'Media & Actions' | 'Layout' | 'Structure'
  >('All')

  // Variable helper
  const [variableDropdownOpen, setVariableDropdownOpen] = useState(false)

  // Synchronize compiled HTML & blocks to parent without triggering feedback loops
  const lastCompiledRef = useRef('')
  useEffect(() => {
    const html = blocks.length === 0 ? '' : compileBlocksToHtml(blocks)
    if (html !== lastCompiledRef.current || blocks !== lastEmittedDesignRef.current) {
      lastCompiledRef.current = html
      lastEmittedDesignRef.current = blocks
      lastEmittedHtmlRef.current = html
      onChangeRef.current({ html, design: blocks })
    }
  }, [blocks])

  // Selected block reference
  const selectedBlock = useMemo(() => {
    return blocks.find((b) => b.id === selectedBlockId) || null
  }, [blocks, selectedBlockId])

  // Add block from palette
  const handleAddBlock = (type: EmailBlockType) => {
    const catalogItem = BLOCK_CATALOG.find((c) => c.type === type)
    if (!catalogItem) return

    const newBlock: EmailBlock = {
      id: `blk_${Math.random().toString(36).substring(2, 9)}`,
      type,
      data: JSON.parse(JSON.stringify(catalogItem.defaultData)),
    }

    setBlocks((prev) => [...prev, newBlock])
    setSelectedBlockId(newBlock.id)
    onAction(`Added ${catalogItem.label} to canvas.`)
  }

  // Insert block at specific index
  const handleInsertBlockAt = (type: EmailBlockType, index: number) => {
    const catalogItem = BLOCK_CATALOG.find((c) => c.type === type)
    if (!catalogItem) return

    const newBlock: EmailBlock = {
      id: `blk_${Math.random().toString(36).substring(2, 9)}`,
      type,
      data: JSON.parse(JSON.stringify(catalogItem.defaultData)),
    }

    setBlocks((prev) => {
      const copy = [...prev]
      copy.splice(index, 0, newBlock)
      return copy
    })
    setSelectedBlockId(newBlock.id)
    onAction(`Inserted ${catalogItem.label}.`)
  }

  // Move block via drag and drop
  const handleMoveBlock = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return
    setBlocks((prev) => {
      const copy = [...prev]
      const [moved] = copy.splice(fromIndex, 1)
      copy.splice(toIndex, 0, moved)
      return copy
    })
    onAction('Reordered email blocks.')
  }

  // Move block up
  const handleMoveUp = (index: number) => {
    if (index === 0) return
    setBlocks((prev) => {
      const copy = [...prev]
      const temp = copy[index - 1]
      copy[index - 1] = copy[index]
      copy[index] = temp
      return copy
    })
  }

  // Move block down
  const handleMoveDown = (index: number) => {
    if (index === blocks.length - 1) return
    setBlocks((prev) => {
      const copy = [...prev]
      const temp = copy[index + 1]
      copy[index + 1] = copy[index]
      copy[index] = temp
      return copy
    })
  }

  // Duplicate block
  const handleDuplicateBlock = (index: number) => {
    const target = blocks[index]
    const clone: EmailBlock = {
      ...target,
      id: `blk_${Math.random().toString(36).substring(2, 9)}`,
      data: JSON.parse(JSON.stringify(target.data)),
    }
    setBlocks((prev) => {
      const copy = [...prev]
      copy.splice(index + 1, 0, clone)
      return copy
    })
    setSelectedBlockId(clone.id)
    onAction('Block duplicated.')
  }

  // Delete block
  const handleDeleteBlock = (id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id))
    if (selectedBlockId === id) setSelectedBlockId(null)
    onAction('Block removed.')
  }

  // Update selected block data
  const handleUpdateBlockData = (field: string, value: any) => {
    if (!selectedBlockId) return
    setBlocks((prev) =>
      prev.map((b) => {
        if (b.id !== selectedBlockId) return b
        return {
          ...b,
          data: {
            ...b.data,
            [field]: value,
          },
        }
      })
    )
  }

  // Load starter layout
  const handleLoadStarterLayout = (layoutId: string) => {
    if (layoutId === 'clear_empty') {
      setBlocks([])
      setSelectedBlockId(null)
      onAction('Canvas cleared to empty layout.')
      return
    }
    const layout = STARTER_LAYOUTS.find((l) => l.id === layoutId)
    if (!layout) return
    const newBlocks: EmailBlock[] = layout.blocks.map((b) => ({
      ...b,
      id: `blk_${Math.random().toString(36).substring(2, 9)}`,
      data: JSON.parse(JSON.stringify(b.data)),
    }))
    setBlocks(newBlocks)
    setSelectedBlockId(null)
    onAction(`Loaded “${layout.name}” starter layout.`)
  }

  // Filtered block catalog
  const filteredCatalog = useMemo(() => {
    if (categoryFilter === 'All') return BLOCK_CATALOG
    return BLOCK_CATALOG.filter((c) => c.category === categoryFilter)
  }, [categoryFilter])

  return (
    <div className="visual-builder-studio">
      {/* Visual Studio Top Controls */}
      <div className="studio-top-bar">
        <div className="top-bar-left">
          <div className="starter-layouts-select">
            <span className="starter-label">Starter Layouts:</span>
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleLoadStarterLayout(e.target.value)
                  e.target.value = ''
                }
              }}
              defaultValue=""
            >
              <option value="" disabled>
                Load Starter Template...
              </option>
              {STARTER_LAYOUTS.map((layout) => (
                <option key={layout.id} value={layout.id}>
                  {layout.name} ({layout.tag})
                </option>
              ))}
              <option value="clear_empty">Empty Blank Canvas</option>
            </select>
          </div>
        </div>

        {/* Studio View Mode & Device Switchers */}
        <div className="top-bar-center" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="device-switcher-pill">
            <button
              type="button"
              className={`device-toggle-btn ${studioViewMode === 'canvas' ? 'active' : ''}`}
              onClick={() => setStudioViewMode('canvas')}
              title="Interactive Visual Drag & Drop Canvas"
            >
              <LayoutTemplate size={13} /> Visual Canvas
            </button>
            <button
              type="button"
              className={`device-toggle-btn ${studioViewMode === 'preview' ? 'active' : ''}`}
              onClick={() => setStudioViewMode('preview')}
              title="100% Same-to-Same Live Email Preview"
            >
              <Eye size={13} /> Same-to-Same Preview
            </button>
          </div>

          <div className="device-switcher-pill">
            <button
              type="button"
              className={`device-toggle-btn ${device === 'desktop' ? 'active' : ''}`}
              onClick={() => setDevice('desktop')}
              title="Desktop View (600px)"
            >
              <Monitor size={13} /> Desktop
            </button>
            <button
              type="button"
              className={`device-toggle-btn ${device === 'mobile' ? 'active' : ''}`}
              onClick={() => setDevice('mobile')}
              title="Mobile Responsive View (375px)"
            >
              <Smartphone size={13} /> Mobile
            </button>
          </div>
        </div>

        {/* Quick Merge Variables Insertion Helper */}
        <div className="top-bar-right">
          <div className="relative">
            <button
              type="button"
              className="button button-secondary text-xs"
              onClick={() => setVariableDropdownOpen(!variableDropdownOpen)}
            >
              <Sparkles size={13} className="text-sky-600" />
              <span>Insert Variable Tag</span>
            </button>
            {variableDropdownOpen && (
              <div className="variable-quick-dropdown">
                <span className="dropdown-head">Merge Tags:</span>
                {[
                  { tag: '{{first_name}}', label: 'First Name' },
                  { tag: '{{last_name}}', label: 'Last Name' },
                  { tag: '{{email}}', label: 'Email Address' },
                  { tag: '{{company}}', label: 'Company Name' },
                  { tag: '{{unsubscribe_link}}', label: 'Unsubscribe Link' },
                  { tag: '{{current_date}}', label: 'Current Date' },
                ].map((item) => (
                  <button
                    key={item.tag}
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(item.tag)
                      onAction(`Copied tag ${item.tag} to clipboard! Paste it into any text block.`)
                      setVariableDropdownOpen(false)
                    }}
                  >
                    <code>{item.tag}</code>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Studio 3-Column Layout */}
      <div className="studio-main-workspace">
        {/* =========================================================================
            LEFT COLUMN: BLOCKS PALETTE
           ========================================================================= */}
        <aside className="studio-blocks-sidebar">
          <div className="sidebar-section-head">
            <Layers size={16} color="#1374f8" />
            <span>Content Blocks</span>
          </div>

          {/* Category Tabs */}
          <div className="palette-category-pills">
            {(['All', 'Typography', 'Media & Actions', 'Layout', 'Structure'] as const).map(
              (cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`palette-cat-btn ${categoryFilter === cat ? 'active' : ''}`}
                  onClick={() => setCategoryFilter(cat)}
                >
                  {cat}
                </button>
              )
            )}
          </div>

          {/* Blocks Grid */}
          <div className="blocks-palette-grid">
            {filteredCatalog.map((item) => {
              const IconComp = item.icon
              return (
                <button
                  key={item.type}
                  type="button"
                  className="palette-block-btn"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', item.type)
                    e.dataTransfer.effectAllowed = 'copy'
                  }}
                  onClick={() => handleAddBlock(item.type)}
                  title={`${item.description} (Click or drag onto canvas)`}
                >
                  <div className="palette-icon-box">
                    <IconComp size={18} />
                  </div>
                  <div className="palette-info">
                    <strong>{item.label}</strong>
                    <small>{item.description}</small>
                  </div>
                  <GripVertical size={13} className="text-slate-300 mr-1" />
                  <Plus size={14} className="palette-add-icon" />
                </button>
              )
            })}
          </div>
        </aside>

        {/* =========================================================================
            MIDDLE COLUMN: INTERACTIVE VISUAL CANVAS
           ========================================================================= */}
        <main className="studio-canvas-area">
          {studioViewMode === 'preview' ? (
            <div className={`canvas-viewport-frame ${device}`}>
              <div
                style={{
                  width: device === 'mobile' ? '375px' : '620px',
                  maxWidth: '100%',
                  background: '#ffffff',
                  borderRadius: '12px',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
                  overflow: 'hidden',
                  border: '1px solid #e2e8f0',
                  margin: '0 auto',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div
                  style={{
                    padding: '8px 14px',
                    background: '#f8fafc',
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '12px',
                    color: '#64748b',
                    fontWeight: 600,
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Eye size={13} className="text-blue-600" />
                    Pixel-Perfect Live Email Preview
                  </span>
                  <span className="badge badge-primary text-[10px] py-0.5 px-2">1:1 Same as Rich Editor</span>
                </div>
                <iframe
                  title="Same-to-Same Email Preview"
                  srcDoc={
                    blocks.length === 0
                      ? '<div style="font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;padding:80px 20px;text-align:center;background:#ffffff;border-radius:12px;margin:20px;"><div style="font-size:36px;margin-bottom:12px;">✉️</div><h3 style="font-size:18px;font-weight:700;margin:0 0 8px;color:#0f172a;">Canvas Is Currently Empty</h3><p style="font-size:13.5px;margin:0;color:#64748b;line-height:1.5;">Switch back to <strong>Visual Canvas</strong> mode to drag and drop content blocks or pick a preset layout from the top dropdown.</p></div>'
                      : compileBlocksToHtml(blocks)
                  }
                  style={{
                    width: '100%',
                    minHeight: '720px',
                    height: 'calc(100vh - 280px)',
                    border: 'none',
                    display: 'block',
                    background: '#f1f5f9',
                  }}
                  sandbox="allow-same-origin"
                />
              </div>
            </div>
          ) : (
            <div className={`canvas-viewport-frame ${device}`}>
              {/* Visual Container */}
              <div
                className={`canvas-email-container ${canvasDragOver ? 'canvas-drag-active' : ''}`}
              onDragOver={(e) => {
                e.preventDefault()
                e.dataTransfer.dropEffect = 'copy'
                setCanvasDragOver(true)
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setCanvasDragOver(false)
                  setDropTargetIndex(null)
                }
              }}
              onDrop={(e) => {
                e.preventDefault()
                setCanvasDragOver(false)
                setDropTargetIndex(null)
                const blockType = e.dataTransfer.getData('text/plain') as EmailBlockType
                if (blockType && BLOCK_CATALOG.some((c) => c.type === blockType)) {
                  handleAddBlock(blockType)
                }
              }}
            >
              {blocks.length === 0 ? (
                <div
                  className="canvas-empty-prompt"
                  onDragOver={(e) => {
                    e.preventDefault()
                    setCanvasDragOver(true)
                  }}
                  onDrop={(e) => {
                    e.preventDefault()
                    setCanvasDragOver(false)
                    const blockType = e.dataTransfer.getData('text/plain') as EmailBlockType
                    if (blockType) handleAddBlock(blockType)
                  }}
                >
                  <LayoutTemplate size={40} color="#cbd5e1" />
                  <h4>Your Email Canvas Is Empty</h4>
                  <p>Drag and drop any block from the left panel onto this canvas, or click any block in the palette to start designing your email.</p>
                  <button
                    type="button"
                    className="button button-primary text-xs"
                    onClick={() => handleLoadStarterLayout('saas-launch')}
                  >
                    Load Sample Template
                  </button>
                </div>
              ) : (
                blocks.map((block, index) => {
                  const isSelected = block.id === selectedBlockId
                  const isDropTarget = dropTargetIndex === index
                  return (
                    <div
                      key={block.id}
                      draggable
                      onDragStart={(e) => {
                        setDraggedBlockIndex(index)
                        e.dataTransfer.setData('reorderIndex', String(index))
                      }}
                      onDragEnd={() => {
                        setDraggedBlockIndex(null)
                        setDropTargetIndex(null)
                        setCanvasDragOver(false)
                      }}
                      onDragOver={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setDropTargetIndex(index)
                      }}
                      onDragLeave={(e) => {
                        e.stopPropagation()
                        if (dropTargetIndex === index) setDropTargetIndex(null)
                      }}
                      onDrop={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setDropTargetIndex(null)
                        const reorderIdxStr = e.dataTransfer.getData('reorderIndex')
                        if (reorderIdxStr !== '') {
                          const fromIdx = Number(reorderIdxStr)
                          if (!isNaN(fromIdx) && fromIdx !== index) {
                            handleMoveBlock(fromIdx, index)
                          }
                        } else {
                          const blockType = e.dataTransfer.getData('text/plain') as EmailBlockType
                          if (blockType && BLOCK_CATALOG.some((c) => c.type === blockType)) {
                            handleInsertBlockAt(blockType, index + 1)
                          }
                        }
                      }}
                      className={`canvas-block-wrapper ${isSelected ? 'is-selected' : ''} ${
                        isDropTarget ? 'drop-target-active' : ''
                      }`}
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedBlockId(block.id)
                      }}
                    >
                      {/* Block Floating Controls Toolbar */}
                      <div className="block-hover-toolbar" onClick={(e) => e.stopPropagation()}>
                        <span className="block-type-tag">{block.type.replace('_', ' ')}</span>
                        <div className="btn-group">
                          <button
                            type="button"
                            onClick={() => handleMoveUp(index)}
                            disabled={index === 0}
                            title="Move Up"
                          >
                            <ArrowUp size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveDown(index)}
                            disabled={index === blocks.length - 1}
                            title="Move Down"
                          >
                            <ArrowDown size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDuplicateBlock(index)}
                            title="Duplicate"
                          >
                            <Copy size={13} />
                          </button>
                          <button
                            type="button"
                            className="danger-btn"
                            onClick={() => handleDeleteBlock(block.id)}
                            title="Delete Block"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Render Block Content */}
                      <BlockRenderer block={block} />

                      {/* Visual Drop insertion indicator */}
                      {isDropTarget && <div className="drop-insert-indicator" />}
                    </div>
                  )
                })
              )}
            </div>
          </div>
          )}
        </main>

        {/* =========================================================================
            RIGHT COLUMN: PROPERTIES INSPECTOR PANEL
           ========================================================================= */}
        <aside className="studio-inspector-sidebar">
          <div className="sidebar-section-head">
            <Settings size={16} color="#1374f8" />
            <span>Block Inspector</span>
          </div>

          {studioViewMode === 'preview' ? (
            <div className="inspector-empty-state">
              <Eye size={32} color="#1374f8" />
              <h4>Same-to-Same Preview Mode</h4>
              <p>You are viewing the compiled, pixel-perfect email preview. Switch back to <strong>Visual Canvas</strong> to click and edit any block.</p>
              <button
                type="button"
                className="button button-primary button-sm mt-3"
                onClick={() => setStudioViewMode('canvas')}
              >
                <LayoutTemplate size={13} /> Switch to Visual Canvas
              </button>
            </div>
          ) : selectedBlock ? (
            <div className="inspector-fields-scroll">
              <div className="inspector-head">
                <div>
                  <strong>{selectedBlock.type.replace('_', ' ').toUpperCase()}</strong>
                  <p>Customize content & visual properties</p>
                </div>
                <button
                  type="button"
                  className="icon-close-btn"
                  onClick={() => setSelectedBlockId(null)}
                >
                  <X size={15} />
                </button>
              </div>

              {/* Inspector Content according to Block Type */}
              <BlockInspectorForm
                block={selectedBlock}
                onUpdate={handleUpdateBlockData}
              />
            </div>
          ) : (
            <div className="inspector-empty-state">
              <Settings size={32} color="#cbd5e1" />
              <h4>No Block Selected</h4>
              <p>Click on any element in the middle canvas to inspect and edit its properties.</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}

/* =========================================================================
   BLOCK RENDERER COMPONENT (LIVE PREVIEW IN CANVAS)
   ========================================================================= */

function BlockRenderer({ block }: { block: EmailBlock }) {
  const d = block.data

  switch (block.type) {
    case 'header':
      return (
        <div
          style={{
            padding: `${d.paddingY || 24}px 28px`,
            backgroundColor: d.bgColor || '#ffffff',
            textAlign: d.align || 'center',
            borderBottom: '1px solid #f1f5f9',
          }}
        >
          {d.logoUrl ? (
            <img
              src={d.logoUrl}
              alt={d.brandName || ''}
              style={{
                maxHeight: `${d.logoHeight || 44}px`,
                maxWidth: '220px',
                height: 'auto',
                display: 'inline-block',
                marginBottom: '8px',
              }}
            />
          ) : (
            <div
              style={{
                display: 'inline-block',
                padding: '8px 18px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg,#1374f8,#075ce0)',
                color: '#ffffff',
                fontSize: '18px',
                fontWeight: 800,
                letterSpacing: '1px',
                boxShadow: '0 4px 12px rgba(19, 116, 248, 0.25)',
              }}
            >
              {d.brandName || 'METROMAIL'}
            </div>
          )}
          {d.tagline && (
            <div style={{ marginTop: '6px' }}>
              <span
                style={{
                  display: 'inline-block',
                  fontSize: '11px',
                  fontWeight: 600,
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  color: d.taglineColor || '#4338ca',
                  backgroundColor: '#eef2ff',
                  padding: '3px 10px',
                  borderRadius: '20px',
                }}
              >
                {d.tagline}
              </span>
            </div>
          )}
        </div>
      )

    case 'heading': {
      const Tag = (['h1', 'h2', 'h3', 'h4'].includes(d.level) ? d.level : 'h1') as any
      const weight = d.fontWeight === 'normal' ? 400 : d.fontWeight === 'medium' ? 500 : 750
      return (
        <div
          style={{
            padding: `${d.paddingTop ?? 20}px 28px ${d.paddingBottom ?? 10}px`,
            textAlign: d.align || 'center',
            backgroundColor: d.bgColor || '#ffffff',
          }}
        >
          <Tag
            style={{
              margin: 0,
              fontSize: `${d.fontSize || 24}px`,
              fontWeight: weight,
              color: d.color || '#0f172a',
              lineHeight: d.lineHeight || 1.3,
            }}
          >
            {d.text || 'Heading Title'}
          </Tag>
        </div>
      )
    }

    case 'text':
      return (
        <div
          style={{
            padding: `${d.paddingY || 12}px 28px`,
            textAlign: d.align || 'left',
            backgroundColor: d.bgColor || '#ffffff',
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: `${d.fontSize || 15}px`,
              lineHeight: d.lineHeight || 1.6,
              color: d.color || '#475569',
              whiteSpace: 'pre-line',
              textAlign: d.align || 'left',
            }}
          >
            {d.content || 'Enter your text message here...'}
          </p>
        </div>
      )

    case 'button':
      return (
        <div style={{ padding: `${d.paddingY || 14}px 28px 20px`, textAlign: d.align || 'center' }}>
          <span
            style={{
              display: d.fullWidth ? 'block' : 'inline-block',
              padding: `${d.paddingY || 12}px ${d.paddingX || 28}px`,
              backgroundColor: d.bgColor || '#1374f8',
              color: d.textColor || '#ffffff',
              fontSize: `${d.fontSize || 15}px`,
              fontWeight: 600,
              borderRadius: `${d.borderRadius || 8}px`,
              textDecoration: 'none',
              boxShadow: '0 2px 6px rgba(19, 116, 248, 0.2)',
              textAlign: 'center',
            }}
          >
            {d.text || 'Click Button'}
          </span>
        </div>
      )

    case 'image':
      return (
        <div style={{ padding: `${d.paddingY || 12}px 28px`, textAlign: d.align || 'center' }}>
          <img
            src={d.url}
            alt={d.alt || ''}
            style={{
              display: 'block',
              maxWidth: '100%',
              width: d.width || '100%',
              height: 'auto',
              borderRadius: `${d.borderRadius || 8}px`,
              margin: d.align === 'center' ? '0 auto' : d.align === 'right' ? '0 0 0 auto' : '0 auto 0 0',
            }}
          />
          {d.caption && (
            <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#64748b', textAlign: d.align || 'center' }}>
              {d.caption}
            </p>
          )}
        </div>
      )

    case 'two_column':
      return (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '14px',
            padding: '14px 28px',
          }}
        >
          <div
            style={{
              backgroundColor: d.cardBgColor || '#f8fafc',
              border: `1px solid ${d.cardBorderColor || '#e2e8f0'}`,
              borderRadius: `${d.borderRadius || 8}px`,
              padding: '14px',
            }}
          >
            {d.col1Img && (
              <img
                src={d.col1Img}
                alt=""
                style={{
                  width: '100%',
                  height: '110px',
                  objectFit: 'cover',
                  borderRadius: '6px',
                  marginBottom: '10px',
                }}
              />
            )}
            <h4 style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 700, color: d.titleColor || '#0f172a' }}>
              {d.col1Title}
            </h4>
            <p style={{ margin: '0 0 10px', fontSize: '12.5px', color: d.textColor || '#64748b', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
              {d.col1Text}
            </p>
            {d.col1BtnText && (
              <span
                style={{
                  display: 'inline-block',
                  padding: '6px 12px',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  color: d.btnTextColor || '#ffffff',
                  backgroundColor: d.btnBgColor || '#1374f8',
                  borderRadius: '4px',
                }}
              >
                {d.col1BtnText}
              </span>
            )}
          </div>
          <div
            style={{
              backgroundColor: d.cardBgColor || '#f8fafc',
              border: `1px solid ${d.cardBorderColor || '#e2e8f0'}`,
              borderRadius: `${d.borderRadius || 8}px`,
              padding: '14px',
            }}
          >
            {d.col2Img && (
              <img
                src={d.col2Img}
                alt=""
                style={{
                  width: '100%',
                  height: '110px',
                  objectFit: 'cover',
                  borderRadius: '6px',
                  marginBottom: '10px',
                }}
              />
            )}
            <h4 style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 700, color: d.titleColor || '#0f172a' }}>
              {d.col2Title}
            </h4>
            <p style={{ margin: '0 0 10px', fontSize: '12.5px', color: d.textColor || '#64748b', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
              {d.col2Text}
            </p>
            {d.col2BtnText && (
              <span
                style={{
                  display: 'inline-block',
                  padding: '6px 12px',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  color: d.btnTextColor || '#ffffff',
                  backgroundColor: d.btnBgColor || '#1374f8',
                  borderRadius: '4px',
                }}
              >
                {d.col2BtnText}
              </span>
            )}
          </div>
        </div>
      )

    case 'three_column':
      return (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '10px',
            padding: '14px 28px',
          }}
        >
          {[
            { img: d.col1Img, title: d.col1Title, text: d.col1Text, btn: d.col1BtnText },
            { img: d.col2Img, title: d.col2Title, text: d.col2Text, btn: d.col2BtnText },
            { img: d.col3Img, title: d.col3Title, text: d.col3Text, btn: d.col3BtnText },
          ].map((col, idx) => (
            <div
              key={idx}
              style={{
                backgroundColor: d.cardBgColor || '#f8fafc',
                border: `1px solid ${d.cardBorderColor || '#e2e8f0'}`,
                borderRadius: `${d.borderRadius || 8}px`,
                padding: '12px',
                textAlign: 'center',
              }}
            >
              {col.img && (
                <img
                  src={col.img}
                  alt=""
                  style={{
                    width: '100%',
                    height: '85px',
                    objectFit: 'cover',
                    borderRadius: '6px',
                    marginBottom: '8px',
                    display: 'block',
                  }}
                />
              )}
              <h5 style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: 650, color: d.titleColor || '#0f172a' }}>
                {col.title}
              </h5>
              <p style={{ margin: '0 0 6px', fontSize: '11.5px', color: d.textColor || '#64748b', lineHeight: 1.4, whiteSpace: 'pre-line' }}>
                {col.text}
              </p>
              {col.btn && (
                <span
                  style={{
                    display: 'inline-block',
                    padding: '4px 8px',
                    fontSize: '10.5px',
                    fontWeight: 600,
                    color: '#ffffff',
                    backgroundColor: '#1374f8',
                    borderRadius: '4px',
                  }}
                >
                  {col.btn}
                </span>
              )}
            </div>
          ))}
        </div>
      )

    case 'callout':
      return (
        <div style={{ padding: '12px 28px' }}>
          <div
            style={{
              backgroundColor: d.bgColor || '#eff6ff',
              borderLeft: d.borderColor ? `4px solid ${d.borderColor}` : 'none',
              borderRadius: `${d.borderRadius || 6}px`,
              padding: '16px 18px',
            }}
          >
            {d.title && (
              <h4
                style={{
                  margin: '0 0 6px',
                  fontSize: '14px',
                  fontWeight: 650,
                  color: d.titleColor || '#0f172a',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {d.iconEmoji && <span>{d.iconEmoji}</span>} {d.title}
              </h4>
            )}
            <p
              style={{
                margin: 0,
                fontSize: '13.5px',
                color: d.textColor || '#334155',
                lineHeight: 1.6,
                whiteSpace: 'pre-line',
              }}
            >
              {d.text}
            </p>
          </div>
        </div>
      )

    case 'quote': {
      const stars = '★'.repeat(Number(d.stars) || 5)
      return (
        <div style={{ padding: '14px 28px' }}>
          <div
            style={{
              backgroundColor: d.bgColor || '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: `${d.borderRadius || 8}px`,
              padding: '18px 20px',
              textAlign: d.align || 'left',
            }}
          >
            <div style={{ color: '#f59e0b', fontSize: '15px', marginBottom: '8px' }}>{stars}</div>
            <p
              style={{
                margin: '0 0 12px',
                fontSize: '14px',
                fontStyle: 'italic',
                lineHeight: 1.6,
                color: d.textColor || '#0f172a',
              }}
            >
              {d.quote}
            </p>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                justifyContent: d.align === 'center' ? 'center' : 'flex-start',
              }}
            >
              {d.avatar && (
                <img
                  src={d.avatar}
                  alt={d.author || ''}
                  style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }}
                />
              )}
              <div>
                <strong style={{ display: 'block', fontSize: '13px', color: '#0f172a' }}>
                  {d.author || 'Customer Name'}
                </strong>
                <span style={{ fontSize: '11.5px', color: '#64748b' }}>{d.role || ''}</span>
              </div>
            </div>
          </div>
        </div>
      )
    }

    case 'video':
      return (
        <div style={{ padding: '14px 28px', textAlign: d.align || 'center' }}>
          <div style={{ position: 'relative', display: 'inline-block', maxWidth: '100%' }}>
            <img
              src={d.thumbnailUrl}
              alt={d.title || ''}
              style={{ width: '100%', maxWidth: '544px', height: 'auto', borderRadius: '8px', display: 'block' }}
            />
            {d.showPlayButton !== false && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'grid',
                  placeItems: 'center',
                  background: 'rgba(15, 23, 42, 0.25)',
                  borderRadius: '8px',
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: '#dc2626',
                    display: 'grid',
                    placeItems: 'center',
                    color: '#ffffff',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
                  }}
                >
                  <Play size={22} fill="#ffffff" style={{ marginLeft: '3px' }} />
                </div>
              </div>
            )}
          </div>
          {d.title && (
            <h4 style={{ margin: '8px 0 0', fontSize: '14px', fontWeight: 650, color: '#0f172a' }}>
              {d.title}
            </h4>
          )}
        </div>
      )

    case 'divider':
      return (
        <div style={{ padding: `${d.spacing || 20}px 28px` }}>
          <hr
            style={{
              border: 0,
              borderTop: `${d.thickness || 1}px ${d.style || 'solid'} ${d.color || '#e2e8f0'}`,
              width: d.width || '100%',
              margin: '0 auto',
            }}
          />
        </div>
      )

    case 'spacer':
      return <div style={{ height: `${d.height || 24}px`, backgroundColor: d.bgColor || 'transparent' }} />

    case 'social':
      return (
        <div style={{ padding: '16px 28px', textAlign: d.align || 'center', fontSize: '13px' }}>
          {[
            d.twitter && 'X (Twitter)',
            d.linkedin && 'LinkedIn',
            d.github && 'GitHub',
            d.facebook && 'Facebook',
            d.instagram && 'Instagram',
            d.youtube && 'YouTube',
            d.website && 'Website',
          ]
            .filter(Boolean)
            .map((name, i) => (
              <span key={i} style={{ color: d.linkColor || '#1374f8', fontWeight: 600, margin: '0 8px' }}>
                {name}
              </span>
            ))}
        </div>
      )

    case 'footer':
      return (
        <div
          style={{
            padding: '24px 28px',
            backgroundColor: d.bgColor || '#f8fafc',
            borderTop: d.borderTop !== false ? '1px solid #f1f5f9' : 'none',
            textAlign: d.align || 'center',
          }}
        >
          <p style={{ margin: '0 0 4px', fontSize: '12px', fontWeight: 600, color: '#475569' }}>
            {d.companyName}
          </p>
          <p style={{ margin: '0 0 8px', fontSize: '11px', color: d.color || '#94a3b8' }}>
            {d.address}
          </p>
          <p style={{ margin: '0 0 6px', fontSize: '11px', color: d.color || '#94a3b8' }}>
            {d.unsubscribeText}
          </p>
          <small style={{ fontSize: '10.5px', color: '#cbd5e1' }}>{d.copyright}</small>
        </div>
      )

    case 'html':
      return (
        <div
          style={{
            padding: `${d.padding ?? 16}px 28px`,
            backgroundColor: d.bgColor || '#ffffff',
          }}
          dangerouslySetInnerHTML={{ __html: d.code || '' }}
        />
      )

    default:
      return null
  }
}

/* =========================================================================
   IMAGE UPLOAD COMPONENT (COMPUTER UPLOAD + DRAG-DROP + URL + PREVIEW)
   ========================================================================= */

interface ImageUploadFieldProps {
  label: string
  value: string
  onChange: (val: string) => void
  placeholder?: string
  helpText?: string
}

function ImageUploadField({
  label,
  value,
  onChange,
  placeholder = 'https://... or choose from computer',
  helpText,
}: ImageUploadFieldProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleProcessFile = async (file: File) => {
    if (!file) return
    setErrorMsg(null)
    setIsUploading(true)
    try {
      const url = await uploadMediaImage(file)
      onChange(url)
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to upload image.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleProcessFile(file)
    }
    e.target.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) {
      handleProcessFile(file)
    }
  }

  return (
    <div className="inspector-image-control">
      <div className="inspector-image-header">
        <label className="inspector-image-label">{label}</label>
        {value && (
          <button
            type="button"
            className="clear-image-link"
            onClick={() => {
              onChange('')
              setErrorMsg(null)
            }}
            title="Remove image"
          >
            <Trash2 size={12} /> Clear
          </button>
        )}
      </div>

      {/* Preview Card if image is present */}
      {value ? (
        <div className="inspector-image-preview-card">
          <div className="preview-img-wrapper">
            <img src={value} alt="Preview" className="preview-thumb-img" />
          </div>
          <div className="preview-actions">
            <button
              type="button"
              className="change-image-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <Upload size={13} />
              <span>{isUploading ? 'Uploading...' : 'Change Image'}</span>
            </button>
          </div>
        </div>
      ) : (
        /* Upload Drag & Drop Area */
        <div
          className={`image-dropzone-uploader ${dragOver ? 'drag-over' : ''} ${
            isUploading ? 'is-uploading' : ''
          }`}
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
        >
          {isUploading ? (
            <div className="uploader-status">
              <Loader2 size={18} className="animate-spin text-blue-600" />
              <span>Uploading image...</span>
            </div>
          ) : (
            <div className="uploader-status">
              <Upload size={18} className="upload-icon" />
              <div className="uploader-text">
                <strong>Upload from Computer</strong> or drag & drop
              </div>
              <small className="uploader-hint">PNG, JPG, WebP, GIF (Max 5MB)</small>
            </div>
          )}
        </div>
      )}

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/png,image/jpeg,image/webp,image/gif"
        style={{ display: 'none' }}
      />

      {/* Direct URL Input fallback */}
      <div className="image-url-input-wrap">
        <div className="url-input-icon">
          <LinkIcon size={12} />
        </div>
        <input
          type="url"
          value={value || ''}
          onChange={(e) => {
            onChange(e.target.value)
            setErrorMsg(null)
          }}
          placeholder={placeholder}
          className="image-url-field"
        />
      </div>

      {errorMsg && <p className="image-upload-error">{errorMsg}</p>}
      {helpText && <span className="inspector-hint-text">{helpText}</span>}
    </div>
  )
}

/* =========================================================================
   BLOCK INSPECTOR FORM (RIGHT PANEL CONTROLS - FULL A-Z PROPERTY EDITING)
   ========================================================================= */

function BlockInspectorForm({
  block,
  onUpdate,
}: {
  block: EmailBlock
  onUpdate: (field: string, val: any) => void
}) {
  const d = block.data

  switch (block.type) {
    case 'header':
      return (
        <div className="inspector-group">
          <div className="inspector-section-label">Brand Content</div>
          <ImageUploadField
            label="Brand Logo Image (Optional)"
            value={d.logoUrl || ''}
            onChange={(val) => onUpdate('logoUrl', val)}
            placeholder="https://... or upload logo from computer"
            helpText="Displayed above brand title in header"
          />

          {d.logoUrl && (
            <>
              <label>Logo Max Height ({d.logoHeight || 44}px)</label>
              <input
                type="range"
                min={20}
                max={100}
                value={d.logoHeight || 44}
                onChange={(e) => onUpdate('logoHeight', Number(e.target.value))}
              />
            </>
          )}

          <label>Brand / Company Name</label>
          <input
            type="text"
            value={d.brandName || ''}
            onChange={(e) => onUpdate('brandName', e.target.value)}
            placeholder="e.g. METROMAIL"
          />

          <label>Tagline / Subheader</label>
          <input
            type="text"
            value={d.tagline || ''}
            onChange={(e) => onUpdate('tagline', e.target.value)}
            placeholder="e.g. High-Performance Email Infrastructure"
          />

          <div className="inspector-section-label">Styling &amp; Colors</div>
          <div className="inspector-field-row">
            <div>
              <label>Brand Text Color</label>
              <input
                type="color"
                value={d.textColor || '#0f172a'}
                onChange={(e) => onUpdate('textColor', e.target.value)}
              />
            </div>
            <div>
              <label>Tagline Color</label>
              <input
                type="color"
                value={d.taglineColor || '#64748b'}
                onChange={(e) => onUpdate('taglineColor', e.target.value)}
              />
            </div>
          </div>

          <label>Header Background Color</label>
          <input
            type="color"
            value={d.bgColor || '#ffffff'}
            onChange={(e) => onUpdate('bgColor', e.target.value)}
          />

          <label>Alignment</label>
          <div className="align-buttons-row">
            {(['left', 'center', 'right'] as const).map((pos) => (
              <button
                key={pos}
                type="button"
                className={`align-btn ${d.align === pos ? 'active' : ''}`}
                onClick={() => onUpdate('align', pos)}
              >
                {pos === 'left' ? <AlignLeft size={14} /> : pos === 'center' ? <AlignCenter size={14} /> : <AlignRight size={14} />}
              </button>
            ))}
          </div>

          <label>Vertical Padding ({d.paddingY || 24}px)</label>
          <input
            type="range"
            min={10}
            max={60}
            value={d.paddingY || 24}
            onChange={(e) => onUpdate('paddingY', Number(e.target.value))}
          />
        </div>
      )

    case 'heading':
      return (
        <div className="inspector-group">
          <div className="inspector-section-label">Heading Content</div>
          <label>Heading Text</label>
          <input
            type="text"
            value={d.text || ''}
            onChange={(e) => onUpdate('text', e.target.value)}
            placeholder="Enter title text..."
          />

          <div className="inspector-field-row">
            <div>
              <label>Heading Level</label>
              <select
                value={d.level || 'h1'}
                onChange={(e) => onUpdate('level', e.target.value)}
              >
                <option value="h1">H1 (Main Headline)</option>
                <option value="h2">H2 (Section Header)</option>
                <option value="h3">H3 (Sub-section)</option>
                <option value="h4">H4 (Minor Heading)</option>
              </select>
            </div>
            <div>
              <label>Font Weight</label>
              <select
                value={d.fontWeight || 'bold'}
                onChange={(e) => onUpdate('fontWeight', e.target.value)}
              >
                <option value="normal">Normal (400)</option>
                <option value="medium">Medium (500)</option>
                <option value="bold">Bold (700)</option>
              </select>
            </div>
          </div>

          <div className="inspector-section-label">Typography &amp; Layout</div>
          <label>Font Size ({d.fontSize || 24}px)</label>
          <input
            type="range"
            min={14}
            max={48}
            value={d.fontSize || 24}
            onChange={(e) => onUpdate('fontSize', Number(e.target.value))}
          />

          <label>Line Height ({d.lineHeight || 1.3})</label>
          <input
            type="range"
            min={10}
            max={22}
            step={1}
            value={Math.round((d.lineHeight || 1.3) * 10)}
            onChange={(e) => onUpdate('lineHeight', Number(e.target.value) / 10)}
          />

          <label>Alignment</label>
          <div className="align-buttons-row">
            {(['left', 'center', 'right'] as const).map((pos) => (
              <button
                key={pos}
                type="button"
                className={`align-btn ${d.align === pos ? 'active' : ''}`}
                onClick={() => onUpdate('align', pos)}
              >
                {pos === 'left' ? <AlignLeft size={14} /> : pos === 'center' ? <AlignCenter size={14} /> : <AlignRight size={14} />}
              </button>
            ))}
          </div>

          <div className="inspector-section-label">Colors &amp; Spacing</div>
          <div className="inspector-field-row">
            <div>
              <label>Text Color</label>
              <input
                type="color"
                value={d.color || '#0f172a'}
                onChange={(e) => onUpdate('color', e.target.value)}
              />
            </div>
            <div>
              <label>Background Color</label>
              <input
                type="color"
                value={d.bgColor === 'transparent' ? '#ffffff' : d.bgColor || '#ffffff'}
                onChange={(e) => onUpdate('bgColor', e.target.value)}
              />
            </div>
          </div>

          <div className="inspector-field-row">
            <div>
              <label>Top Gap ({d.paddingTop ?? 20}px)</label>
              <input
                type="range"
                min={0}
                max={50}
                value={d.paddingTop ?? 20}
                onChange={(e) => onUpdate('paddingTop', Number(e.target.value))}
              />
            </div>
            <div>
              <label>Bottom Gap ({d.paddingBottom ?? 10}px)</label>
              <input
                type="range"
                min={0}
                max={50}
                value={d.paddingBottom ?? 10}
                onChange={(e) => onUpdate('paddingBottom', Number(e.target.value))}
              />
            </div>
          </div>
        </div>
      )

    case 'text':
      return (
        <div className="inspector-group">
          <div className="inspector-section-label">Paragraph Content</div>
          <label>Text Content (Markdown &amp; Merge tags supported)</label>
          <textarea
            rows={6}
            value={d.content || ''}
            onChange={(e) => onUpdate('content', e.target.value)}
            placeholder="Type body paragraphs or copy-paste content..."
          />

          <div className="inspector-section-label">Typography &amp; Layout</div>
          <label>Font Size ({d.fontSize || 15}px)</label>
          <input
            type="range"
            min={12}
            max={26}
            value={d.fontSize || 15}
            onChange={(e) => onUpdate('fontSize', Number(e.target.value))}
          />

          <label>Line Spacing ({d.lineHeight || 1.6})</label>
          <input
            type="range"
            min={12}
            max={24}
            step={1}
            value={Math.round((d.lineHeight || 1.6) * 10)}
            onChange={(e) => onUpdate('lineHeight', Number(e.target.value) / 10)}
          />

          <label>Alignment</label>
          <div className="align-buttons-row">
            {(['left', 'center', 'right'] as const).map((pos) => (
              <button
                key={pos}
                type="button"
                className={`align-btn ${d.align === pos ? 'active' : ''}`}
                onClick={() => onUpdate('align', pos)}
              >
                {pos === 'left' ? <AlignLeft size={14} /> : pos === 'center' ? <AlignCenter size={14} /> : <AlignRight size={14} />}
              </button>
            ))}
          </div>

          <div className="inspector-section-label">Colors &amp; Spacing</div>
          <div className="inspector-field-row">
            <div>
              <label>Text Color</label>
              <input
                type="color"
                value={d.color || '#475569'}
                onChange={(e) => onUpdate('color', e.target.value)}
              />
            </div>
            <div>
              <label>Background</label>
              <input
                type="color"
                value={d.bgColor === 'transparent' ? '#ffffff' : d.bgColor || '#ffffff'}
                onChange={(e) => onUpdate('bgColor', e.target.value)}
              />
            </div>
          </div>

          <label>Vertical Spacing ({d.paddingY || 12}px)</label>
          <input
            type="range"
            min={4}
            max={40}
            value={d.paddingY || 12}
            onChange={(e) => onUpdate('paddingY', Number(e.target.value))}
          />
        </div>
      )

    case 'quote':
      return (
        <div className="inspector-group">
          <div className="inspector-section-label">Testimonial Content</div>
          <label>Quote Text</label>
          <textarea
            rows={4}
            value={d.quote || ''}
            onChange={(e) => onUpdate('quote', e.target.value)}
            placeholder="“Enter customer review or testimonial quote...”"
          />

          <div className="inspector-field-row">
            <div>
              <label>Author Name</label>
              <input
                type="text"
                value={d.author || ''}
                onChange={(e) => onUpdate('author', e.target.value)}
                placeholder="e.g. Sarah Lind"
              />
            </div>
            <div>
              <label>Title / Role</label>
              <input
                type="text"
                value={d.role || ''}
                onChange={(e) => onUpdate('role', e.target.value)}
                placeholder="e.g. VP Engineering at SaaSFlow"
              />
            </div>
          </div>

          <ImageUploadField
            label="Author Avatar Image"
            value={d.avatar || ''}
            onChange={(val) => onUpdate('avatar', val)}
            placeholder="https://... or upload photo from computer"
            helpText="Small circular photo of quote author"
          />

          <label>Star Rating ({d.stars || 5} Stars)</label>
          <input
            type="range"
            min={1}
            max={5}
            value={d.stars || 5}
            onChange={(e) => onUpdate('stars', Number(e.target.value))}
          />

          <div className="inspector-section-label">Card Styling</div>
          <div className="inspector-field-row">
            <div>
              <label>Card Background</label>
              <input
                type="color"
                value={d.bgColor || '#f8fafc'}
                onChange={(e) => onUpdate('bgColor', e.target.value)}
              />
            </div>
            <div>
              <label>Quote Text Color</label>
              <input
                type="color"
                value={d.textColor || '#0f172a'}
                onChange={(e) => onUpdate('textColor', e.target.value)}
              />
            </div>
          </div>

          <label>Card Corner Radius ({d.borderRadius || 8}px)</label>
          <input
            type="range"
            min={0}
            max={24}
            value={d.borderRadius || 8}
            onChange={(e) => onUpdate('borderRadius', Number(e.target.value))}
          />

          <label>Alignment</label>
          <div className="align-buttons-row">
            {(['left', 'center'] as const).map((pos) => (
              <button
                key={pos}
                type="button"
                className={`align-btn ${d.align === pos ? 'active' : ''}`}
                onClick={() => onUpdate('align', pos)}
              >
                {pos === 'left' ? <AlignLeft size={14} /> : <AlignCenter size={14} />}
              </button>
            ))}
          </div>
        </div>
      )

    case 'button':
      return (
        <div className="inspector-group">
          <div className="inspector-section-label">Button Action &amp; Label</div>
          <label>Button Label Text</label>
          <input
            type="text"
            value={d.text || ''}
            onChange={(e) => onUpdate('text', e.target.value)}
            placeholder="e.g. Explore Features →"
          />

          <label>Destination Link URL</label>
          <input
            type="url"
            value={d.url || ''}
            onChange={(e) => onUpdate('url', e.target.value)}
            placeholder="https://yourdomain.com/landing-page"
          />

          <div className="inspector-section-label">Button Colors</div>
          <div className="inspector-field-row">
            <div>
              <label>Button Color</label>
              <input
                type="color"
                value={d.bgColor || '#1374f8'}
                onChange={(e) => onUpdate('bgColor', e.target.value)}
              />
            </div>
            <div>
              <label>Text Color</label>
              <input
                type="color"
                value={d.textColor || '#ffffff'}
                onChange={(e) => onUpdate('textColor', e.target.value)}
              />
            </div>
          </div>

          <div className="inspector-section-label">Dimensions &amp; Shape</div>
          <label>Font Size ({d.fontSize || 15}px)</label>
          <input
            type="range"
            min={12}
            max={22}
            value={d.fontSize || 15}
            onChange={(e) => onUpdate('fontSize', Number(e.target.value))}
          />

          <label>Corner Radius ({d.borderRadius || 8}px)</label>
          <input
            type="range"
            min={0}
            max={36}
            value={d.borderRadius || 8}
            onChange={(e) => onUpdate('borderRadius', Number(e.target.value))}
          />

          <div className="inspector-field-row">
            <div>
              <label>Vertical Padding ({d.paddingY || 12}px)</label>
              <input
                type="range"
                min={6}
                max={26}
                value={d.paddingY || 12}
                onChange={(e) => onUpdate('paddingY', Number(e.target.value))}
              />
            </div>
            <div>
              <label>Horizontal Padding ({d.paddingX || 28}px)</label>
              <input
                type="range"
                min={12}
                max={50}
                value={d.paddingX || 28}
                onChange={(e) => onUpdate('paddingX', Number(e.target.value))}
              />
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '6px' }}>
            <input
              type="checkbox"
              checked={!!d.fullWidth}
              onChange={(e) => onUpdate('fullWidth', e.target.checked)}
              style={{ width: '16px', height: '16px' }}
            />
            <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#0f172a' }}>
              Full-Width Button (100% width)
            </span>
          </label>

          <label>Alignment</label>
          <div className="align-buttons-row">
            {(['left', 'center', 'right'] as const).map((pos) => (
              <button
                key={pos}
                type="button"
                className={`align-btn ${d.align === pos ? 'active' : ''}`}
                onClick={() => onUpdate('align', pos)}
              >
                {pos === 'left' ? <AlignLeft size={14} /> : pos === 'center' ? <AlignCenter size={14} /> : <AlignRight size={14} />}
              </button>
            ))}
          </div>
        </div>
      )

    case 'image':
      return (
        <div className="inspector-group">
          <div className="inspector-section-label">Image Source</div>
          <ImageUploadField
            label="Image Media (Computer Upload or URL)"
            value={d.url || ''}
            onChange={(val) => onUpdate('url', val)}
            placeholder="https://... or click upload"
            helpText="Upload PNG, JPG, GIF or paste high-res CDN URL"
          />

          <label>Alt Description Text (For accessibility &amp; SEO)</label>
          <input
            type="text"
            value={d.alt || ''}
            onChange={(e) => onUpdate('alt', e.target.value)}
            placeholder="Describe image for screen readers..."
          />

          <label>Click Through Link URL (Optional)</label>
          <input
            type="url"
            value={d.link || ''}
            onChange={(e) => onUpdate('link', e.target.value)}
            placeholder="https://yourstore.com/product"
          />

          <div className="inspector-section-label">Dimensions &amp; Styling</div>
          <label>Image Width ({d.width || '100%'})</label>
          <select
            value={d.width || '100%'}
            onChange={(e) => onUpdate('width', e.target.value)}
          >
            <option value="100%">100% (Full Container)</option>
            <option value="85%">85% Width</option>
            <option value="70%">70% Width</option>
            <option value="50%">50% Half-Width</option>
            <option value="400px">Fixed 400px</option>
            <option value="320px">Fixed 320px</option>
          </select>

          <label>Alignment</label>
          <div className="align-buttons-row">
            {(['left', 'center', 'right'] as const).map((pos) => (
              <button
                key={pos}
                type="button"
                className={`align-btn ${d.align === pos ? 'active' : ''}`}
                onClick={() => onUpdate('align', pos)}
              >
                {pos === 'left' ? <AlignLeft size={14} /> : pos === 'center' ? <AlignCenter size={14} /> : <AlignRight size={14} />}
              </button>
            ))}
          </div>

          <label>Corner Radius ({d.borderRadius || 8}px)</label>
          <input
            type="range"
            min={0}
            max={32}
            value={d.borderRadius || 8}
            onChange={(e) => onUpdate('borderRadius', Number(e.target.value))}
          />

          <label>Image Caption Text (Optional)</label>
          <input
            type="text"
            value={d.caption || ''}
            onChange={(e) => onUpdate('caption', e.target.value)}
            placeholder="Caption displayed below image..."
          />

          <label>Vertical Spacing ({d.paddingY || 14}px)</label>
          <input
            type="range"
            min={4}
            max={40}
            value={d.paddingY || 14}
            onChange={(e) => onUpdate('paddingY', Number(e.target.value))}
          />
        </div>
      )

    case 'video':
      return (
        <div className="inspector-group">
          <div className="inspector-section-label">Video Details</div>
          <ImageUploadField
            label="Video Thumbnail Image"
            value={d.thumbnailUrl || ''}
            onChange={(val) => onUpdate('thumbnailUrl', val)}
            placeholder="https://... or upload poster image"
            helpText="Displayed as the high-res poster image"
          />

          <label>Video Watch URL (YouTube / Vimeo / Loom / Custom)</label>
          <input
            type="url"
            value={d.videoUrl || ''}
            onChange={(e) => onUpdate('videoUrl', e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
          />

          <label>Video Title</label>
          <input
            type="text"
            value={d.title || ''}
            onChange={(e) => onUpdate('title', e.target.value)}
            placeholder="e.g. Watch Product Demo & Setup Guide"
          />

          <label>Duration Badge (Optional)</label>
          <input
            type="text"
            value={d.duration || ''}
            onChange={(e) => onUpdate('duration', e.target.value)}
            placeholder="e.g. 4:15"
          />

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '6px' }}>
            <input
              type="checkbox"
              checked={d.showPlayButton !== false}
              onChange={(e) => onUpdate('showPlayButton', e.target.checked)}
              style={{ width: '16px', height: '16px' }}
            />
            <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#0f172a' }}>
              Show Red Play Button Overlay
            </span>
          </label>

          <label>Alignment</label>
          <div className="align-buttons-row">
            {(['left', 'center', 'right'] as const).map((pos) => (
              <button
                key={pos}
                type="button"
                className={`align-btn ${d.align === pos ? 'active' : ''}`}
                onClick={() => onUpdate('align', pos)}
              >
                {pos === 'left' ? <AlignLeft size={14} /> : pos === 'center' ? <AlignCenter size={14} /> : <AlignRight size={14} />}
              </button>
            ))}
          </div>
        </div>
      )

    case 'two_column':
      return (
        <div className="inspector-group">
          {/* Column 1 Controls */}
          <div className="inspector-column-card">
            <div className="column-card-badge">Column 1 (Left Card)</div>
            <ImageUploadField
              label="Column 1 Image"
              value={d.col1Img || ''}
              onChange={(val) => onUpdate('col1Img', val)}
              placeholder="https://... or upload photo"
            />
            <label style={{ marginTop: '6px' }}>Column 1 Title</label>
            <input
              type="text"
              value={d.col1Title || ''}
              onChange={(e) => onUpdate('col1Title', e.target.value)}
              placeholder="e.g. Sub-second Relay"
            />
            <label>Column 1 Description</label>
            <textarea
              rows={2}
              value={d.col1Text || ''}
              onChange={(e) => onUpdate('col1Text', e.target.value)}
              placeholder="Short feature description..."
            />
            <label>Column 1 Button Label (Optional)</label>
            <input
              type="text"
              value={d.col1BtnText || ''}
              onChange={(e) => onUpdate('col1BtnText', e.target.value)}
              placeholder="e.g. Learn More"
            />
            <label>Column 1 Button Link</label>
            <input
              type="url"
              value={d.col1Link || ''}
              onChange={(e) => onUpdate('col1Link', e.target.value)}
              placeholder="https://..."
            />
          </div>

          {/* Column 2 Controls */}
          <div className="inspector-column-card">
            <div className="column-card-badge">Column 2 (Right Card)</div>
            <ImageUploadField
              label="Column 2 Image"
              value={d.col2Img || ''}
              onChange={(val) => onUpdate('col2Img', val)}
              placeholder="https://... or upload photo"
            />
            <label style={{ marginTop: '6px' }}>Column 2 Title</label>
            <input
              type="text"
              value={d.col2Title || ''}
              onChange={(e) => onUpdate('col2Title', e.target.value)}
              placeholder="e.g. Live Insights"
            />
            <label>Column 2 Description</label>
            <textarea
              rows={2}
              value={d.col2Text || ''}
              onChange={(e) => onUpdate('col2Text', e.target.value)}
              placeholder="Short feature description..."
            />
            <label>Column 2 Button Label (Optional)</label>
            <input
              type="text"
              value={d.col2BtnText || ''}
              onChange={(e) => onUpdate('col2BtnText', e.target.value)}
              placeholder="e.g. Learn More"
            />
            <label>Column 2 Button Link</label>
            <input
              type="url"
              value={d.col2Link || ''}
              onChange={(e) => onUpdate('col2Link', e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className="inspector-section-label">Columns Card Styling</div>
          <div className="inspector-field-row">
            <div>
              <label>Card Background</label>
              <input
                type="color"
                value={d.cardBgColor || '#f8fafc'}
                onChange={(e) => onUpdate('cardBgColor', e.target.value)}
              />
            </div>
            <div>
              <label>Border Color</label>
              <input
                type="color"
                value={d.cardBorderColor || '#e2e8f0'}
                onChange={(e) => onUpdate('cardBorderColor', e.target.value)}
              />
            </div>
          </div>

          <div className="inspector-field-row">
            <div>
              <label>Title Color</label>
              <input
                type="color"
                value={d.titleColor || '#0f172a'}
                onChange={(e) => onUpdate('titleColor', e.target.value)}
              />
            </div>
            <div>
              <label>Description Color</label>
              <input
                type="color"
                value={d.textColor || '#64748b'}
                onChange={(e) => onUpdate('textColor', e.target.value)}
              />
            </div>
          </div>

          <div className="inspector-field-row">
            <div>
              <label>Button Background</label>
              <input
                type="color"
                value={d.btnBgColor || '#1374f8'}
                onChange={(e) => onUpdate('btnBgColor', e.target.value)}
              />
            </div>
            <div>
              <label>Button Text Color</label>
              <input
                type="color"
                value={d.btnTextColor || '#ffffff'}
                onChange={(e) => onUpdate('btnTextColor', e.target.value)}
              />
            </div>
          </div>

          <label>Card Corner Radius ({d.borderRadius || 8}px)</label>
          <input
            type="range"
            min={0}
            max={20}
            value={d.borderRadius || 8}
            onChange={(e) => onUpdate('borderRadius', Number(e.target.value))}
          />
        </div>
      )

    case 'three_column':
      return (
        <div className="inspector-group">
          {/* Column 1 */}
          <div className="inspector-column-card">
            <div className="column-card-badge">Column 1</div>
            <ImageUploadField
              label="Column 1 Image"
              value={d.col1Img || ''}
              onChange={(val) => onUpdate('col1Img', val)}
              placeholder="https://... or upload photo"
            />
            <label style={{ marginTop: '6px' }}>Column 1 Title</label>
            <input
              type="text"
              value={d.col1Title || ''}
              onChange={(e) => onUpdate('col1Title', e.target.value)}
              placeholder="e.g. ⚡ 99.9% Uptime"
            />
            <label>Column 1 Description</label>
            <textarea
              rows={2}
              value={d.col1Text || ''}
              onChange={(e) => onUpdate('col1Text', e.target.value)}
              placeholder="Brief description..."
            />
            <label>Button Label (Optional)</label>
            <input
              type="text"
              value={d.col1BtnText || ''}
              onChange={(e) => onUpdate('col1BtnText', e.target.value)}
              placeholder="e.g. View"
            />
            <label>Button Link</label>
            <input
              type="url"
              value={d.col1Link || ''}
              onChange={(e) => onUpdate('col1Link', e.target.value)}
              placeholder="https://..."
            />
          </div>

          {/* Column 2 */}
          <div className="inspector-column-card">
            <div className="column-card-badge">Column 2</div>
            <ImageUploadField
              label="Column 2 Image"
              value={d.col2Img || ''}
              onChange={(val) => onUpdate('col2Img', val)}
              placeholder="https://... or upload photo"
            />
            <label style={{ marginTop: '6px' }}>Column 2 Title</label>
            <input
              type="text"
              value={d.col2Title || ''}
              onChange={(e) => onUpdate('col2Title', e.target.value)}
              placeholder="e.g. 🔒 Automated DMARC"
            />
            <label>Column 2 Description</label>
            <textarea
              rows={2}
              value={d.col2Text || ''}
              onChange={(e) => onUpdate('col2Text', e.target.value)}
              placeholder="Brief description..."
            />
            <label>Button Label (Optional)</label>
            <input
              type="text"
              value={d.col2BtnText || ''}
              onChange={(e) => onUpdate('col2BtnText', e.target.value)}
              placeholder="e.g. View"
            />
            <label>Button Link</label>
            <input
              type="url"
              value={d.col2Link || ''}
              onChange={(e) => onUpdate('col2Link', e.target.value)}
              placeholder="https://..."
            />
          </div>

          {/* Column 3 */}
          <div className="inspector-column-card">
            <div className="column-card-badge">Column 3</div>
            <ImageUploadField
              label="Column 3 Image"
              value={d.col3Img || ''}
              onChange={(val) => onUpdate('col3Img', val)}
              placeholder="https://... or upload photo"
            />
            <label style={{ marginTop: '6px' }}>Column 3 Title</label>
            <input
              type="text"
              value={d.col3Title || ''}
              onChange={(e) => onUpdate('col3Title', e.target.value)}
              placeholder="e.g. 📈 Growth"
            />
            <label>Column 3 Description</label>
            <textarea
              rows={2}
              value={d.col3Text || ''}
              onChange={(e) => onUpdate('col3Text', e.target.value)}
              placeholder="Brief description..."
            />
            <label>Button Label (Optional)</label>
            <input
              type="text"
              value={d.col3BtnText || ''}
              onChange={(e) => onUpdate('col3BtnText', e.target.value)}
              placeholder="e.g. View"
            />
            <label>Button Link</label>
            <input
              type="url"
              value={d.col3Link || ''}
              onChange={(e) => onUpdate('col3Link', e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className="inspector-section-label">Columns Card Styling</div>
          <div className="inspector-field-row">
            <div>
              <label>Card Background</label>
              <input
                type="color"
                value={d.cardBgColor || '#f8fafc'}
                onChange={(e) => onUpdate('cardBgColor', e.target.value)}
              />
            </div>
            <div>
              <label>Border Color</label>
              <input
                type="color"
                value={d.cardBorderColor || '#e2e8f0'}
                onChange={(e) => onUpdate('cardBorderColor', e.target.value)}
              />
            </div>
          </div>

          <div className="inspector-field-row">
            <div>
              <label>Title Color</label>
              <input
                type="color"
                value={d.titleColor || '#0f172a'}
                onChange={(e) => onUpdate('titleColor', e.target.value)}
              />
            </div>
            <div>
              <label>Text Color</label>
              <input
                type="color"
                value={d.textColor || '#64748b'}
                onChange={(e) => onUpdate('textColor', e.target.value)}
              />
            </div>
          </div>

          <label>Card Corner Radius ({d.borderRadius || 8}px)</label>
          <input
            type="range"
            min={0}
            max={20}
            value={d.borderRadius || 8}
            onChange={(e) => onUpdate('borderRadius', Number(e.target.value))}
          />
        </div>
      )

    case 'callout':
      return (
        <div className="inspector-group">
          <div className="inspector-section-label">Callout Content</div>
          <label>Callout Title</label>
          <input
            type="text"
            value={d.title || ''}
            onChange={(e) => onUpdate('title', e.target.value)}
            placeholder="e.g. Growth Tip for Senders"
          />

          <label>Callout Message</label>
          <textarea
            rows={3}
            value={d.text || ''}
            onChange={(e) => onUpdate('text', e.target.value)}
            placeholder="Important message, alert or pro-tip..."
          />

          <label>Icon Emoji</label>
          <input
            type="text"
            value={d.iconEmoji || '💡'}
            onChange={(e) => onUpdate('iconEmoji', e.target.value)}
            placeholder="💡, ⚡, 🔔, ⚠️, ℹ️, 🎯"
          />

          <div className="inspector-section-label">Colors &amp; Border</div>
          <div className="inspector-field-row">
            <div>
              <label>Left Highlight Border</label>
              <input
                type="color"
                value={d.borderColor || '#3b82f6'}
                onChange={(e) => onUpdate('borderColor', e.target.value)}
              />
            </div>
            <div>
              <label>Background Color</label>
              <input
                type="color"
                value={d.bgColor || '#eff6ff'}
                onChange={(e) => onUpdate('bgColor', e.target.value)}
              />
            </div>
          </div>

          <div className="inspector-field-row">
            <div>
              <label>Title Color</label>
              <input
                type="color"
                value={d.titleColor || '#0f172a'}
                onChange={(e) => onUpdate('titleColor', e.target.value)}
              />
            </div>
            <div>
              <label>Text Color</label>
              <input
                type="color"
                value={d.textColor || '#334155'}
                onChange={(e) => onUpdate('textColor', e.target.value)}
              />
            </div>
          </div>

          <label>Corner Radius ({d.borderRadius || 6}px)</label>
          <input
            type="range"
            min={0}
            max={18}
            value={d.borderRadius || 6}
            onChange={(e) => onUpdate('borderRadius', Number(e.target.value))}
          />
        </div>
      )

    case 'divider':
      return (
        <div className="inspector-group">
          <div className="inspector-section-label">Divider Line Properties</div>
          <label>Line Style</label>
          <select
            value={d.style || 'solid'}
            onChange={(e) => onUpdate('style', e.target.value)}
          >
            <option value="solid">Solid Line</option>
            <option value="dashed">Dashed Line</option>
            <option value="dotted">Dotted Line</option>
          </select>

          <label>Line Color</label>
          <input
            type="color"
            value={d.color || '#e2e8f0'}
            onChange={(e) => onUpdate('color', e.target.value)}
          />

          <label>Line Thickness ({d.thickness || 1}px)</label>
          <input
            type="range"
            min={1}
            max={8}
            value={d.thickness || 1}
            onChange={(e) => onUpdate('thickness', Number(e.target.value))}
          />

          <label>Line Width ({d.width || '100%'})</label>
          <select
            value={d.width || '100%'}
            onChange={(e) => onUpdate('width', e.target.value)}
          >
            <option value="100%">100% (Full Width)</option>
            <option value="80%">80% Width</option>
            <option value="60%">60% Width</option>
            <option value="40%">40% Width</option>
          </select>

          <label>Vertical Spacing ({d.spacing || 20}px)</label>
          <input
            type="range"
            min={8}
            max={60}
            value={d.spacing || 20}
            onChange={(e) => onUpdate('spacing', Number(e.target.value))}
          />
        </div>
      )

    case 'spacer':
      return (
        <div className="inspector-group">
          <div className="inspector-section-label">Spacer Properties</div>
          <label>Height Gap ({d.height || 24}px)</label>
          <input
            type="range"
            min={8}
            max={100}
            value={d.height || 24}
            onChange={(e) => onUpdate('height', Number(e.target.value))}
          />

          <label>Background Color (Optional)</label>
          <input
            type="color"
            value={d.bgColor === 'transparent' ? '#ffffff' : d.bgColor || '#ffffff'}
            onChange={(e) => onUpdate('bgColor', e.target.value)}
          />
        </div>
      )

    case 'social':
      return (
        <div className="inspector-group">
          <div className="inspector-section-label">Social Profile URLs</div>
          <label>X (Twitter) Profile URL</label>
          <input
            type="url"
            value={d.twitter || ''}
            onChange={(e) => onUpdate('twitter', e.target.value)}
            placeholder="https://x.com/username"
          />

          <label>LinkedIn Page URL</label>
          <input
            type="url"
            value={d.linkedin || ''}
            onChange={(e) => onUpdate('linkedin', e.target.value)}
            placeholder="https://linkedin.com/company/..."
          />

          <label>GitHub Organization URL</label>
          <input
            type="url"
            value={d.github || ''}
            onChange={(e) => onUpdate('github', e.target.value)}
            placeholder="https://github.com/..."
          />

          <label>Facebook URL</label>
          <input
            type="url"
            value={d.facebook || ''}
            onChange={(e) => onUpdate('facebook', e.target.value)}
            placeholder="https://facebook.com/..."
          />

          <label>Instagram URL</label>
          <input
            type="url"
            value={d.instagram || ''}
            onChange={(e) => onUpdate('instagram', e.target.value)}
            placeholder="https://instagram.com/..."
          />

          <label>YouTube Channel URL</label>
          <input
            type="url"
            value={d.youtube || ''}
            onChange={(e) => onUpdate('youtube', e.target.value)}
            placeholder="https://youtube.com/@channel"
          />

          <label>Website / Blog URL</label>
          <input
            type="url"
            value={d.website || ''}
            onChange={(e) => onUpdate('website', e.target.value)}
            placeholder="https://yourwebsite.com"
          />

          <div className="inspector-section-label">Styling &amp; Alignment</div>
          <label>Social Links Color</label>
          <input
            type="color"
            value={d.linkColor || '#1374f8'}
            onChange={(e) => onUpdate('linkColor', e.target.value)}
          />

          <label>Alignment</label>
          <div className="align-buttons-row">
            {(['left', 'center', 'right'] as const).map((pos) => (
              <button
                key={pos}
                type="button"
                className={`align-btn ${d.align === pos ? 'active' : ''}`}
                onClick={() => onUpdate('align', pos)}
              >
                {pos === 'left' ? <AlignLeft size={14} /> : pos === 'center' ? <AlignCenter size={14} /> : <AlignRight size={14} />}
              </button>
            ))}
          </div>
        </div>
      )

    case 'footer':
      return (
        <div className="inspector-group">
          <div className="inspector-section-label">Compliance &amp; Company Info</div>
          <label>Company / Organization Name</label>
          <input
            type="text"
            value={d.companyName || ''}
            onChange={(e) => onUpdate('companyName', e.target.value)}
            placeholder="e.g. MetroVPS Inc."
          />

          <label>Physical Mailing Address (CAN-SPAM compliance)</label>
          <textarea
            rows={2}
            value={d.address || ''}
            onChange={(e) => onUpdate('address', e.target.value)}
            placeholder="100 Tech Blvd, Suite 400, San Francisco, CA"
          />

          <label>Unsubscribe Merge Text</label>
          <input
            type="text"
            value={d.unsubscribeText || ''}
            onChange={(e) => onUpdate('unsubscribeText', e.target.value)}
            placeholder="Unsubscribe: {{unsubscribe_link}}"
          />

          <label>Copyright Notice</label>
          <input
            type="text"
            value={d.copyright || ''}
            onChange={(e) => onUpdate('copyright', e.target.value)}
            placeholder="© 2026 MetroVPS. All rights reserved."
          />

          <div className="inspector-section-label">Colors &amp; Styling</div>
          <div className="inspector-field-row">
            <div>
              <label>Footer Text Color</label>
              <input
                type="color"
                value={d.color || '#94a3b8'}
                onChange={(e) => onUpdate('color', e.target.value)}
              />
            </div>
            <div>
              <label>Footer Background</label>
              <input
                type="color"
                value={d.bgColor || '#f8fafc'}
                onChange={(e) => onUpdate('bgColor', e.target.value)}
              />
            </div>
          </div>

          <label>Alignment</label>
          <div className="align-buttons-row">
            {(['left', 'center', 'right'] as const).map((pos) => (
              <button
                key={pos}
                type="button"
                className={`align-btn ${d.align === pos ? 'active' : ''}`}
                onClick={() => onUpdate('align', pos)}
              >
                {pos === 'left' ? <AlignLeft size={14} /> : pos === 'center' ? <AlignCenter size={14} /> : <AlignRight size={14} />}
              </button>
            ))}
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '6px' }}>
            <input
              type="checkbox"
              checked={d.borderTop !== false}
              onChange={(e) => onUpdate('borderTop', e.target.checked)}
              style={{ width: '16px', height: '16px' }}
            />
            <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#0f172a' }}>
              Show Top Divider Border
            </span>
          </label>
        </div>
      )

    case 'html':
      return (
        <div className="inspector-group">
          <div className="inspector-section-label">Custom HTML Code</div>
          <label>HTML / Embed Snippet</label>
          <textarea
            rows={8}
            value={d.code || ''}
            onChange={(e) => onUpdate('code', e.target.value)}
            style={{ fontFamily: 'monospace', fontSize: '12px' }}
            placeholder="<div>Enter raw HTML code...</div>"
          />

          <div className="inspector-section-label">Container Styling</div>
          <label>Background Color</label>
          <input
            type="color"
            value={d.bgColor || '#ffffff'}
            onChange={(e) => onUpdate('bgColor', e.target.value)}
          />

          <label>Container Padding ({d.padding ?? 16}px)</label>
          <input
            type="range"
            min={0}
            max={40}
            value={d.padding ?? 16}
            onChange={(e) => onUpdate('padding', Number(e.target.value))}
          />
        </div>
      )

    default:
      return <p style={{ fontSize: '13px', color: '#64748b' }}>No editable options for this block.</p>
  }
}
