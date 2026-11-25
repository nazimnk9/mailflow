'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Code2,
  Eye,
  FileText,
  Smartphone,
  Laptop,
  Columns2,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Link2,
  Undo2,
  Redo2,
  Copy,
  Download,
  Send,
  Sparkles,
  Plus,
  Trash2,
  X,
  Palette,
  Highlighter,
  Minus,
  Quote,
  Check,
  RotateCcw,
  Maximize2,
  Minimize2,
  ExternalLink,
  ChevronDown,
  Layers,
  Search,
  Image as ImageIcon,
  Upload,
  Loader2,
} from 'lucide-react'
import { uploadMediaImage } from '@/lib/api/media'
import { EMAIL_TEMPLATES, type EmailTemplate } from '@/lib/email-templates'

type EmailEditorProps = {
  onAction?: (message: string) => void
  initialHtml?: string
  initialPlainText?: string
  subject?: string
  startEmpty?: boolean
  onChange?: (content: { html: string; text: string }) => void
  onSelectTemplate?: (template: EmailTemplate) => void
}

const COLOR_SWATCHES = [
  { name: 'Dark Navy', color: '#0f172a' },
  { name: 'Primary Blue', color: '#1374f8' },
  { name: 'Deep Indigo', color: '#3654d8' },
  { name: 'Purple', color: '#7c3aed' },
  { name: 'Emerald', color: '#059669' },
  { name: 'Crimson', color: '#dc2626' },
  { name: 'Amber Orange', color: '#ea580c' },
  { name: 'Slate Gray', color: '#64748b' },
  { name: 'Charcoal', color: '#334155' },
  { name: 'Pure Black', color: '#000000' },
]

const HIGHLIGHT_SWATCHES = [
  { name: 'None', color: 'transparent' },
  { name: 'Soft Yellow', color: '#fef08a' },
  { name: 'Soft Blue', color: '#dbeafe' },
  { name: 'Soft Green', color: '#dcfce7' },
  { name: 'Soft Orange', color: '#ffedd5' },
  { name: 'Soft Purple', color: '#f3e8ff' },
  { name: 'Soft Pink', color: '#fce7f3' },
]

export function EmailEditor({
  onAction = () => {},
  initialHtml,
  initialPlainText,
  subject = 'A few things we’ve been working on',
  startEmpty = false,
  onChange,
  onSelectTemplate,
}: EmailEditorProps) {
  // Current active template
  const defaultTemplate = EMAIL_TEMPLATES[0]
  const [currentTemplateId, setCurrentTemplateId] = useState<string | null>(() => {
    if (initialHtml) {
      const match = EMAIL_TEMPLATES.find((t) => t.html === initialHtml)
      return match ? match.id : null
    }
    if (startEmpty) return null
    return defaultTemplate.id
  })
  const [htmlContent, setHtmlContent] = useState<string>(() => {
    if (initialHtml !== undefined) return initialHtml
    if (startEmpty) return ''
    return defaultTemplate.html
  })
  const [plainTextContent, setPlainTextContent] = useState<string>(() => {
    if (initialPlainText !== undefined) return initialPlainText
    if (startEmpty) return ''
    return defaultTemplate.plainText
  })

  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const lastEmittedRef = useRef({ html: '', text: '' })

  useEffect(() => {
    if (
      lastEmittedRef.current.html !== htmlContent ||
      lastEmittedRef.current.text !== plainTextContent
    ) {
      lastEmittedRef.current = { html: htmlContent, text: plainTextContent }
      onChangeRef.current?.({ html: htmlContent, text: plainTextContent })
    }
  }, [htmlContent, plainTextContent])

  // Synchronize when initialHtml or initialPlainText changes externally (e.g. from preset selection)
  const prevInitialHtmlRef = useRef(initialHtml)
  useEffect(() => {
    if (initialHtml !== undefined && initialHtml !== prevInitialHtmlRef.current) {
      prevInitialHtmlRef.current = initialHtml
      setHtmlContent(initialHtml)
      const match = EMAIL_TEMPLATES.find(
        (t) =>
          t.html.trim() === initialHtml.trim() ||
          (t.id && initialHtml.includes(t.id)) ||
          (t.name && initialHtml.includes(t.name))
      )
      if (match) {
        setCurrentTemplateId(match.id)
      }
      lastEmittedRef.current = { html: initialHtml, text: plainTextContent }
      if (visualEditorRef.current) {
        visualEditorRef.current.innerHTML = initialHtml
      }
    }
  }, [initialHtml, plainTextContent])

  const prevInitialTextRef = useRef(initialPlainText)
  useEffect(() => {
    if (initialPlainText !== undefined && initialPlainText !== prevInitialTextRef.current) {
      prevInitialTextRef.current = initialPlainText
      setPlainTextContent(initialPlainText)
      lastEmittedRef.current = { html: htmlContent, text: initialPlainText }
    }
  }, [initialPlainText, htmlContent])
  
  // Editor view modes: 'visual' | 'html' | 'plaintext'
  const [editorMode, setEditorMode] = useState<'visual' | 'html' | 'plaintext'>('visual')
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop')
  const [splitView, setSplitView] = useState(false)
  
  // Modals & Popovers
  const [templateModalOpen, setTemplateModalOpen] = useState(false)
  const [templateCategory, setTemplateCategory] = useState<'All' | 'Marketing' | 'Traditional' | 'Transactional'>('All')
  const [templateSearch, setTemplateSearch] = useState('')
  const [previewModalTemplate, setPreviewModalTemplate] = useState<EmailTemplate | null>(null)
  
  // Quick Insertion Modals
  const [ctaModalOpen, setCtaModalOpen] = useState(false)
  const [ctaText, setCtaText] = useState('Explore What’s New')
  const [ctaUrl, setCtaUrl] = useState('https://app.metrovps.com')
  const [ctaBgColor, setCtaBgColor] = useState('#1374f8')
  const [ctaTextColor, setCtaTextColor] = useState('#ffffff')

  const [linkModalOpen, setLinkModalOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState('https://')
  const [linkText, setLinkText] = useState('')

  // Image Upload & Insertion Modal
  const [imageModalOpen, setImageModalOpen] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [imageAlt, setImageAlt] = useState('')
  const [imageLink, setImageLink] = useState('')
  const [imageWidth, setImageWidth] = useState('100%')
  const [imageAlign, setImageAlign] = useState<'center' | 'left' | 'right'>('center')
  const [imageBorderRadius, setImageBorderRadius] = useState(8)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [imageUploadDragOver, setImageUploadDragOver] = useState(false)
  const [imageErrorMsg, setImageErrorMsg] = useState<string | null>(null)
  const [canvasDragOver, setCanvasDragOver] = useState(false)
  const editorImageFileInputRef = useRef<HTMLInputElement>(null)

  const [textColorOpen, setTextColorOpen] = useState(false)
  const [bgColorOpen, setBgColorOpen] = useState(false)
  const [customTextColor, setCustomTextColor] = useState('#1374f8')
  const [customBgColor, setCustomBgColor] = useState('#fef08a')

  const [testEmailModalOpen, setTestEmailModalOpen] = useState(false)
  const [testEmailAddress, setTestEmailAddress] = useState('alex@example.com')
  const [copiedStatus, setCopiedStatus] = useState(false)
  const [isFullScreen, setIsFullScreen] = useState(false)

  // Listen to Escape key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullScreen) {
        setIsFullScreen(false)
        onAction('Exited full-screen.')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isFullScreen, onAction])

  // Visual contentEditable ref & HTML textarea ref
  const visualEditorRef = useRef<HTMLDivElement>(null)
  const htmlTextareaRef = useRef<HTMLTextAreaElement>(null)

  // Keep visual editor in sync when switching back to visual mode or when html changes externally
  useEffect(() => {
    if (visualEditorRef.current && editorMode === 'visual') {
      if (visualEditorRef.current.innerHTML !== htmlContent) {
        visualEditorRef.current.innerHTML = htmlContent
      }
    }
  }, [editorMode, htmlContent])

  // Handle changes in visual editable area
  const handleVisualInput = useCallback(() => {
    if (visualEditorRef.current) {
      setHtmlContent(visualEditorRef.current.innerHTML)
    }
  }, [])

  // Execute standard formatting commands
  const execFormat = (command: string, value: string | undefined = undefined) => {
    if (editorMode !== 'visual') return
    visualEditorRef.current?.focus()
    document.execCommand(command, false, value)
    handleVisualInput()
  }

  // Insert HTML into contentEditable or HTML textarea
  const insertHtmlAtCursor = (htmlSnippet: string) => {
    if (editorMode !== 'visual') {
      // In HTML mode, insert snippet at cursor if textarea is focused, otherwise append
      if (htmlTextareaRef.current) {
        const textarea = htmlTextareaRef.current
        const startPos = textarea.selectionStart ?? textarea.value.length
        const endPos = textarea.selectionEnd ?? textarea.value.length
        const val = textarea.value
        const newHtml = val.substring(0, startPos) + htmlSnippet + val.substring(endPos)
        setHtmlContent(newHtml)
        setTimeout(() => {
          textarea.focus()
          textarea.selectionStart = textarea.selectionEnd = startPos + htmlSnippet.length
        }, 10)
      } else {
        setHtmlContent((prev) => prev + '\n' + htmlSnippet)
      }
      return
    }
    visualEditorRef.current?.focus()
    document.execCommand('insertHTML', false, htmlSnippet)
    handleVisualInput()
  }

  // Upload image file from computer
  const handleUploadImageFile = async (file: File) => {
    if (!file) return ''
    setImageErrorMsg(null)
    setIsUploadingImage(true)
    try {
      const url = await uploadMediaImage(file)
      setImageUrl(url)
      onAction('Image uploaded successfully.')
      return url
    } catch (err: any) {
      setImageErrorMsg(err?.message || 'Failed to upload image.')
      return ''
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleUploadImageFile(file)
    }
    e.target.value = ''
  }

  const handleImageFileDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setImageUploadDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) {
      handleUploadImageFile(file)
    }
  }

  // Insert customized image element into visual editor or HTML editor
  const handleInsertImage = () => {
    if (!imageUrl.trim()) {
      setImageErrorMsg('Please upload an image or provide an Image URL.')
      return
    }

    const alt = imageAlt.trim() || 'Email Graphic'
    const link = imageLink.trim()
    const widthStyle = imageWidth.trim() || '100%'
    const radius = Number(imageBorderRadius) || 0

    if (editorMode === 'visual') {
      const imageSnippet = `
        <table role="presentation" border="0" cellspacing="0" cellpadding="0" width="100%" style="margin:16px 0;text-align:${imageAlign};">
          <tr>
            <td align="${imageAlign}">
              ${link ? `<a href="${link}" target="_blank" style="text-decoration:none;display:inline-block;">` : ''}
              <img src="${imageUrl}" alt="${alt}" style="max-width:100%;width:${widthStyle};height:auto;border-radius:${radius}px;display:inline-block;border:0;outline:none;" />
              ${link ? `</a>` : ''}
            </td>
          </tr>
        </table>
      `
      insertHtmlAtCursor(imageSnippet)
      onAction('Image inserted into visual editor.')
    } else {
      // In HTML mode, insert standard responsive email markup
      const htmlSnippet = `
<!-- Embedded Email Image -->
<div style="text-align: ${imageAlign}; margin: 16px 0;">
  ${link ? `<a href="${link}" target="_blank">` : ''}
  <img src="${imageUrl}" alt="${alt}" style="max-width: 100%; width: ${widthStyle}; height: auto; border-radius: ${radius}px; display: inline-block; border: 0;" />
  ${link ? `</a>` : ''}
</div>`
      insertHtmlAtCursor(htmlSnippet)
      onAction('Image HTML markup inserted.')
    }

    // Reset and close modal
    setImageModalOpen(false)
    setImageUrl('')
    setImageAlt('')
    setImageLink('')
    setImageWidth('100%')
    setImageAlign('center')
    setImageBorderRadius(8)
    setImageErrorMsg(null)
  }

  // Handle direct file drop on visual canvas
  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setCanvasDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) {
      handleUploadImageFile(file).then((url) => {
        if (url) {
          const imgSnippet = `
            <table role="presentation" border="0" cellspacing="0" cellpadding="0" width="100%" style="margin:16px 0;text-align:center;">
              <tr>
                <td align="center">
                  <img src="${url}" alt="Dropped Image" style="max-width:100%;height:auto;border-radius:8px;display:inline-block;border:0;" />
                </td>
              </tr>
            </table>
          `
          insertHtmlAtCursor(imgSnippet)
        }
      })
    }
  }

  // Insert Custom CTA Button
  const handleInsertButton = () => {
    const buttonHtml = `
      <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin:20px auto;text-align:center;">
        <tr>
          <td align="center">
            <a href="${ctaUrl}" style="display:inline-block;padding:12px 28px;background:${ctaBgColor};color:${ctaTextColor};text-decoration:none;font-size:14px;font-weight:600;border-radius:6px;box-shadow:0 3px 10px rgba(0,0,0,0.12);" target="_blank">
              ${ctaText} &rarr;
            </a>
          </td>
        </tr>
      </table>
    `
    insertHtmlAtCursor(buttonHtml)
    setCtaModalOpen(false)
    onAction('CTA button inserted.')
  }

  // Insert Custom Link
  const handleInsertLink = () => {
    if (!linkUrl) return
    if (linkText) {
      const linkHtml = `<a href="${linkUrl}" style="color:#1374f8;text-decoration:underline;" target="_blank">${linkText}</a>`
      insertHtmlAtCursor(linkHtml)
    } else {
      execFormat('createLink', linkUrl)
    }
    setLinkModalOpen(false)
    setLinkText('')
    setLinkUrl('https://')
    onAction('Link inserted.')
  }

  // Insert Divider
  const handleInsertDivider = () => {
    insertHtmlAtCursor('<hr style="border:0;border-top:1px solid #e2e8f0;margin:24px 0;" />')
    onAction('Divider added.')
  }

  // Insert Callout Box
  const handleInsertCallout = () => {
    const calloutHtml = `
      <div style="margin:20px 0;padding:16px 20px;border-left:4px solid #1374f8;background:#f0f7ff;border-radius:0 8px 8px 0;">
        <strong style="color:#1e3a8a;font-size:14px;display:block;margin-bottom:4px;">Important Note</strong>
        <p style="margin:0;font-size:13px;color:#3b82f6;line-height:1.5;">Add your high-priority notice or promotional update right here.</p>
      </div>
    `
    insertHtmlAtCursor(calloutHtml)
    onAction('Callout box inserted.')
  }

  // Insert Personalization Tag
  const handleInsertVariable = (variable: string) => {
    insertHtmlAtCursor(`<span style="background:#e0f2fe;color:#0369a1;padding:2px 6px;border-radius:4px;font-family:monospace;font-size:13px;">${variable}</span>&nbsp;`)
    onAction(`Personalization tag ${variable} inserted.`)
  }

  // Generate plain text from HTML
  const generatePlainTextFromHtml = () => {
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = htmlContent
    // Replace breaks and paragraphs with newlines
    tempDiv.querySelectorAll('br').forEach((br) => br.replaceWith('\n'))
    tempDiv.querySelectorAll('p, div, h1, h2, h3, tr').forEach((el) => {
      el.after('\n')
    })
    const text = (tempDiv.textContent || tempDiv.innerText || '').replace(/\n{3,}/g, '\n\n').trim()
    setPlainTextContent(text)
    onAction('Plain text generated from HTML content.')
  }

  // Load a chosen template
  const handleLoadTemplate = (template: EmailTemplate) => {
    setCurrentTemplateId(template.id)
    setHtmlContent(template.html)
    setPlainTextContent(template.plainText)
    if (visualEditorRef.current) {
      visualEditorRef.current.innerHTML = template.html
    }
    setTemplateModalOpen(false)
    setPreviewModalTemplate(null)
    onSelectTemplate?.(template)
    onAction(`Loaded “${template.name}” template.`)
  }

  // Copy HTML to clipboard
  const handleCopyHtml = async () => {
    try {
      await navigator.clipboard.writeText(htmlContent)
      setCopiedStatus(true)
      setTimeout(() => setCopiedStatus(false), 2000)
      onAction('HTML code copied to clipboard.')
    } catch {
      onAction('Could not access clipboard.')
    }
  }

  // Export HTML as file
  const handleExportHtml = () => {
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `email-template-${currentTemplateId || 'custom'}.html`
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(url)
    onAction('HTML template downloaded.')
  }

  // Send simulated test email
  const handleSendTestEmail = (e: React.FormEvent) => {
    e.preventDefault()
    if (!testEmailAddress.trim()) return
    setTestEmailModalOpen(false)
    onAction(`Test email dispatched to ${testEmailAddress.trim()}.`)
  }

  // Format / Beautify HTML
  const handleBeautifyHtml = () => {
    let formatted = ''
    let indent = 0
    const tab = '  '
    htmlContent.split(/>\s*</).forEach((element) => {
      if (element.match(/^\/\w/)) indent = Math.max(0, indent - 1)
      formatted += tab.repeat(indent) + '<' + element + '>\n'
      if (element.match(/^<?\w[^>]*[^\/]$/) && !element.startsWith('input') && !element.startsWith('img') && !element.startsWith('br') && !element.startsWith('hr')) {
        indent += 1
      }
    })
    setHtmlContent(formatted.trim())
    onAction('HTML formatted.')
  }

  // Filtered templates for gallery
  const filteredTemplates = EMAIL_TEMPLATES.filter((tpl) => {
    const matchesCat = templateCategory === 'All' || tpl.category === templateCategory
    const matchesSearch =
      tpl.name.toLowerCase().includes(templateSearch.toLowerCase()) ||
      tpl.description.toLowerCase().includes(templateSearch.toLowerCase()) ||
      tpl.tag.toLowerCase().includes(templateSearch.toLowerCase())
    return matchesCat && matchesSearch
  })

  const currentTemplate = currentTemplateId
    ? EMAIL_TEMPLATES.find((t) => t.id === currentTemplateId) || null
    : null

  return (
    <div className={`email-builder-wrapper ${isFullScreen ? 'is-fullscreen-editor' : ''}`}>
      {/* Top Header Bar */}
      <header className="email-builder-header">
        <div className="builder-header-left">
          <button
            type="button"
            className="template-selector-pill"
            onClick={() => setTemplateModalOpen(true)}
            title="Browse and load ready-made email templates"
          >
            <Sparkles size={14} className="text-amber-500" />
            <span className="template-label">Template:</span>
            <strong>{currentTemplate ? currentTemplate.name : 'Choose template'}</strong>
            <ChevronDown size={14} />
          </button>
          {currentTemplate && <span className="builder-header-badge">{currentTemplate.category}</span>}
        </div>

        {/* Central Mode Switcher */}
        <div className="builder-header-center">
          <div className="editor-mode-nav" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={editorMode === 'visual'}
              className={`mode-btn ${editorMode === 'visual' ? 'active' : ''}`}
              onClick={() => setEditorMode('visual')}
            >
              <FileText size={14} />
              <span>Rich Visual Editor</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={editorMode === 'html'}
              className={`mode-btn ${editorMode === 'html' ? 'active' : ''}`}
              onClick={() => setEditorMode('html')}
            >
              <Code2 size={14} />
              <span>HTML Source Code</span>
            </button>
            {/* <button
              type="button"
              role="tab"
              aria-selected={editorMode === 'plaintext'}
              className={`mode-btn ${editorMode === 'plaintext' ? 'active' : ''}`}
              onClick={() => setEditorMode('plaintext')}
            >
              <Quote size={14} />
              <span>Plain Text Fallback</span>
            </button> */}
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="builder-header-right">
          <button
            type="button"
            className={`tool-action-btn ${isFullScreen ? 'active' : ''}`}
            onClick={() => {
              setIsFullScreen(!isFullScreen)
              onAction(!isFullScreen ? 'Full-screen editor enabled. Press Esc to exit.' : 'Exited full-screen.')
            }}
            title={isFullScreen ? 'Exit Full Screen (Esc)' : 'Open Full Screen Editor'}
          >
            {isFullScreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            <span className="hidden md:inline">{isFullScreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
          </button>

          <button
            type="button"
            className={`tool-action-btn ${splitView ? 'active' : ''}`}
            onClick={() => setSplitView(!splitView)}
            title={splitView ? 'Close split preview' : 'Open live side-by-side preview'}
          >
            <Columns2 size={15} />
            <span className="hidden md:inline">{splitView ? 'Editor Only' : 'Split View'}</span>
          </button>

          <button
            type="button"
            className="tool-action-btn"
            onClick={() => setTestEmailModalOpen(true)}
            title="Send test email to your inbox"
          >
            <Send size={14} />
            <span>Send Test</span>
          </button>

          <button
            type="button"
            className="tool-action-btn"
            onClick={handleCopyHtml}
            title="Copy full HTML code"
          >
            {copiedStatus ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
            <span>{copiedStatus ? 'Copied!' : 'Copy HTML'}</span>
          </button>

          <button
            type="button"
            className="tool-action-btn"
            onClick={handleExportHtml}
            title="Export as .html file"
          >
            <Download size={14} />
          </button>
        </div>
      </header>

      {/* Rich Formatting Toolbar (Active in Visual Mode) */}
      {editorMode === 'visual' && (
        <div className="rich-format-toolbar" role="toolbar" aria-label="Text Formatting Toolbar">
          {/* Headings & Blocks */}
          <div className="toolbar-group">
            <select
              className="toolbar-select font-medium"
              onChange={(e) => {
                const val = e.target.value
                if (val === 'p') execFormat('formatBlock', '<p>')
                else if (val === 'h1') execFormat('formatBlock', '<h1>')
                else if (val === 'h2') execFormat('formatBlock', '<h2>')
                else if (val === 'h3') execFormat('formatBlock', '<h3>')
                else if (val === 'blockquote') execFormat('formatBlock', '<blockquote>')
              }}
              defaultValue="p"
              aria-label="Text Style"
            >
              <option value="p">Paragraph</option>
              <option value="h1">Heading 1</option>
              <option value="h2">Heading 2</option>
              <option value="h3">Heading 3</option>
              <option value="blockquote">Quote Block</option>
            </select>

            <select
              className="toolbar-select"
              onChange={(e) => execFormat('fontName', e.target.value)}
              defaultValue="Inter, sans-serif"
              aria-label="Font Family"
            >
              <option value="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">Modern Sans-Serif</option>
              <option value="Georgia, Cambria, 'Times New Roman', serif">Classic Serif</option>
              <option value="ui-monospace, SFMono-Regular, Menlo, monospace">Code Monospace</option>
            </select>

            <select
              className="toolbar-select w-16"
              onChange={(e) => execFormat('fontSize', e.target.value)}
              defaultValue="3"
              aria-label="Font Size"
            >
              <option value="1">12px</option>
              <option value="2">13px</option>
              <option value="3">15px</option>
              <option value="4">18px</option>
              <option value="5">22px</option>
              <option value="6">28px</option>
            </select>
          </div>

          <div className="toolbar-divider" />

          {/* Text Styling */}
          <div className="toolbar-group">
            <button
              type="button"
              className="toolbar-btn"
              onClick={() => execFormat('bold')}
              title="Bold (Ctrl+B)"
              aria-label="Bold"
            >
              <Bold size={15} />
            </button>
            <button
              type="button"
              className="toolbar-btn"
              onClick={() => execFormat('italic')}
              title="Italic (Ctrl+I)"
              aria-label="Italic"
            >
              <Italic size={15} />
            </button>
            <button
              type="button"
              className="toolbar-btn"
              onClick={() => execFormat('underline')}
              title="Underline (Ctrl+U)"
              aria-label="Underline"
            >
              <Underline size={15} />
            </button>
            <button
              type="button"
              className="toolbar-btn"
              onClick={() => execFormat('strikeThrough')}
              title="Strikethrough"
              aria-label="Strikethrough"
            >
              <Strikethrough size={15} />
            </button>
          </div>

          <div className="toolbar-divider" />

          {/* Colors */}
          <div className="toolbar-group relative">
            <button
              type="button"
              className="toolbar-btn"
              onClick={() => {
                setTextColorOpen(!textColorOpen)
                setBgColorOpen(false)
              }}
              title="Text Color"
              aria-label="Text Color"
            >
              <Palette size={15} style={{ color: customTextColor }} />
              <ChevronDown size={11} />
            </button>
            {textColorOpen && (
              <div className="color-palette-popover">
                <span className="popover-title">Text Color</span>
                <div className="palette-grid">
                  {COLOR_SWATCHES.map((swatch) => (
                    <button
                      key={swatch.name}
                      type="button"
                      className="color-dot"
                      style={{ backgroundColor: swatch.color }}
                      title={swatch.name}
                      onClick={() => {
                        setCustomTextColor(swatch.color)
                        execFormat('foreColor', swatch.color)
                        setTextColorOpen(false)
                      }}
                    />
                  ))}
                </div>
                <div className="custom-color-row">
                  <input
                    type="color"
                    value={customTextColor}
                    onChange={(e) => {
                      setCustomTextColor(e.target.value)
                      execFormat('foreColor', e.target.value)
                    }}
                  />
                  <span>Custom Hex</span>
                </div>
              </div>
            )}

            <button
              type="button"
              className="toolbar-btn"
              onClick={() => {
                setBgColorOpen(!bgColorOpen)
                setTextColorOpen(false)
              }}
              title="Highlight Background Color"
              aria-label="Highlight Color"
            >
              <Highlighter size={15} />
              <ChevronDown size={11} />
            </button>
            {bgColorOpen && (
              <div className="color-palette-popover">
                <span className="popover-title">Highlight Color</span>
                <div className="palette-grid">
                  {HIGHLIGHT_SWATCHES.map((swatch) => (
                    <button
                      key={swatch.name}
                      type="button"
                      className="color-dot border"
                      style={{ backgroundColor: swatch.color }}
                      title={swatch.name}
                      onClick={() => {
                        setCustomBgColor(swatch.color)
                        execFormat('hiliteColor', swatch.color)
                        setBgColorOpen(false)
                      }}
                    />
                  ))}
                </div>
                <div className="custom-color-row">
                  <input
                    type="color"
                    value={customBgColor === 'transparent' ? '#ffffff' : customBgColor}
                    onChange={(e) => {
                      setCustomBgColor(e.target.value)
                      execFormat('hiliteColor', e.target.value)
                    }}
                  />
                  <span>Custom Highlight</span>
                </div>
              </div>
            )}
          </div>

          <div className="toolbar-divider" />

          {/* Alignment */}
          <div className="toolbar-group">
            <button
              type="button"
              className="toolbar-btn"
              onClick={() => execFormat('justifyLeft')}
              title="Align Left"
              aria-label="Align Left"
            >
              <AlignLeft size={15} />
            </button>
            <button
              type="button"
              className="toolbar-btn"
              onClick={() => execFormat('justifyCenter')}
              title="Align Center"
              aria-label="Align Center"
            >
              <AlignCenter size={15} />
            </button>
            <button
              type="button"
              className="toolbar-btn"
              onClick={() => execFormat('justifyRight')}
              title="Align Right"
              aria-label="Align Right"
            >
              <AlignRight size={15} />
            </button>
            <button
              type="button"
              className="toolbar-btn"
              onClick={() => execFormat('justifyFull')}
              title="Justify"
              aria-label="Justify"
            >
              <AlignJustify size={15} />
            </button>
          </div>

          <div className="toolbar-divider" />

          {/* Lists */}
          <div className="toolbar-group">
            <button
              type="button"
              className="toolbar-btn"
              onClick={() => execFormat('insertUnorderedList')}
              title="Bullet List"
              aria-label="Bullet List"
            >
              <List size={15} />
            </button>
            <button
              type="button"
              className="toolbar-btn"
              onClick={() => execFormat('insertOrderedList')}
              title="Numbered List"
              aria-label="Numbered List"
            >
              <ListOrdered size={15} />
            </button>
          </div>

          <div className="toolbar-divider" />

          {/* Special Elements */}
          <div className="toolbar-group">
            <button
              type="button"
              className="toolbar-btn-text"
              onClick={() => setCtaModalOpen(true)}
              title="Insert customizable CTA Button"
            >
              <Plus size={13} />
              <span>Insert Button</span>
            </button>

            <button
              type="button"
              className="toolbar-btn-text"
              onClick={() => setImageModalOpen(true)}
              title="Upload or Insert Image"
            >
              <ImageIcon size={14} className="text-sky-600" />
              <span>Insert Image</span>
            </button>

            <button
              type="button"
              className="toolbar-btn"
              onClick={() => setLinkModalOpen(true)}
              title="Insert Link"
              aria-label="Insert Link"
            >
              <Link2 size={15} />
            </button>

            <button
              type="button"
              className="toolbar-btn"
              onClick={handleInsertDivider}
              title="Insert Divider"
              aria-label="Insert Divider"
            >
              <Minus size={15} />
            </button>

            <button
              type="button"
              className="toolbar-btn"
              onClick={handleInsertCallout}
              title="Insert Callout Alert"
              aria-label="Insert Callout"
            >
              <Quote size={15} />
            </button>
          </div>

          <div className="toolbar-divider" />

          {/* Variables Dropdown */}
          <div className="toolbar-group">
            <select
              className="toolbar-select font-mono text-xs text-sky-700 bg-sky-50 border-sky-200"
              onChange={(e) => {
                if (e.target.value) {
                  handleInsertVariable(e.target.value)
                  e.target.value = ''
                }
              }}
              defaultValue=""
              aria-label="Insert Variable"
            >
              <option value="" disabled>
                + Variable Tag
              </option>
              <option value="{{first_name}}">First Name</option>
              <option value="{{last_name}}">Last Name</option>
              <option value="{{email}}">Email Address</option>
              <option value="{{company}}">Company Name</option>
              <option value="{{unsubscribe_link}}">Unsubscribe Link</option>
              <option value="{{current_date}}">Current Date</option>
            </select>
          </div>

          {/* Undo / Redo */}
          <div className="toolbar-group ml-auto">
            <button
              type="button"
              className="toolbar-btn"
              onClick={() => execFormat('undo')}
              title="Undo (Ctrl+Z)"
              aria-label="Undo"
            >
              <Undo2 size={14} />
            </button>
            <button
              type="button"
              className="toolbar-btn"
              onClick={() => execFormat('redo')}
              title="Redo (Ctrl+Y)"
              aria-label="Redo"
            >
              <Redo2 size={14} />
            </button>
            <button
              type="button"
              className="toolbar-btn"
              onClick={() => execFormat('removeFormat')}
              title="Clear Formatting"
              aria-label="Clear Formatting"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>
      )}

      {/* HTML Mode Action Tags Bar */}
      {editorMode === 'html' && (
        <div className="html-tags-toolbar">
          <span className="html-toolbar-title">Quick HTML Elements:</span>
          <div className="html-tag-chips">
            <button
              type="button"
              className="highlight-tag-btn"
              onClick={() => setImageModalOpen(true)}
              title="Upload an image from computer or enter URL to insert <img> HTML"
            >
              <ImageIcon size={13} className="inline mr-1 text-sky-600" />
              + &lt;img&gt; Image Upload
            </button>
            <button
              type="button"
              onClick={() => insertHtmlAtCursor('<h2>Subheading Title</h2>')}
            >
              + &lt;h2&gt; Title
            </button>
            <button
              type="button"
              onClick={() => insertHtmlAtCursor('<p style="font-size:15px;line-height:1.6;color:#475569;">Enter your message paragraph here...</p>')}
            >
              + &lt;p&gt; Paragraph
            </button>
            <button
              type="button"
              onClick={() => setCtaModalOpen(true)}
            >
              + &lt;a&gt; CTA Button
            </button>
            <button
              type="button"
              onClick={() => insertHtmlAtCursor('<table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="16" style="background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;"><tr><td>Content in 2-column container</td></tr></table>')}
            >
              + &lt;table&gt; Container
            </button>
            <button
              type="button"
              onClick={() => insertHtmlAtCursor('<hr style="border:0;border-top:1px solid #e2e8f0;margin:24px 0;" />')}
            >
              + &lt;hr&gt; Divider
            </button>
            <button
              type="button"
              onClick={() => insertHtmlAtCursor('<div style="height:24px;line-height:24px;">&nbsp;</div>')}
            >
              + 24px Spacer
            </button>
            <button
              type="button"
              onClick={() => insertHtmlAtCursor('<span style="font-size:11px;color:#94a3b8;display:block;text-align:center;">Unsubscribe: {{unsubscribe_link}}</span>')}
            >
              + Unsubscribe Tag
            </button>
          </div>
          <button
            type="button"
            className="html-beautify-btn"
            onClick={handleBeautifyHtml}
            title="Auto-format indentation and line-breaks"
          >
            <Code2 size={13} />
            <span>Format HTML</span>
          </button>
        </div>
      )}

      {/* Main Workspace Area (Split / Single) */}
      <div className={`email-builder-workspace ${splitView ? 'is-split' : ''}`}>
        {/* Editor Pane */}
        <div className="editor-pane">
          {/* Visual Rich Text Mode */}
          {editorMode === 'visual' && (
            <div className="visual-editor-container">
              <div
                ref={visualEditorRef}
                className={`visual-editable-canvas ${canvasDragOver ? 'canvas-drag-active' : ''}`}
                contentEditable
                suppressContentEditableWarning
                onInput={handleVisualInput}
                onDragOver={(e) => {
                  e.preventDefault()
                  setCanvasDragOver(true)
                }}
                onDragLeave={() => setCanvasDragOver(false)}
                onDrop={handleCanvasDrop}
                data-placeholder="Click here and start typing your email content, or pick a template above..."
                aria-label="Email Template Visual Editor"
              />
            </div>
          )}

          {/* HTML Code Editor Mode */}
          {editorMode === 'html' && (
            <div className="html-editor-container">
              <textarea
                ref={htmlTextareaRef}
                className="html-code-textarea"
                value={htmlContent}
                onChange={(e) => setHtmlContent(e.target.value)}
                placeholder="Write or paste your custom email HTML code here..."
                spellCheck={false}
                aria-label="HTML Source Code"
              />
            </div>
          )}

          {/* Plain Text Mode */}
          {editorMode === 'plaintext' && (
            <div className="plaintext-editor-container">
              <div className="plaintext-toolbar">
                <div>
                  <strong>Plain Text Fallback Version</strong>
                  <p>Sent to email clients that disable HTML rendering.</p>
                </div>
                <button
                  type="button"
                  className="button button-secondary text-xs"
                  onClick={generatePlainTextFromHtml}
                >
                  <RotateCcw size={13} /> Auto-Generate from HTML
                </button>
              </div>
              <textarea
                className="plaintext-textarea"
                value={plainTextContent}
                onChange={(e) => setPlainTextContent(e.target.value)}
                placeholder="Plain text email content..."
                rows={18}
              />
              <div className="plaintext-stats">
                <span>{plainTextContent.length} characters</span>
                <span>{plainTextContent.trim().split(/\s+/).filter(Boolean).length} words</span>
              </div>
            </div>
          )}
        </div>

        {/* Live Preview Pane (Shown if splitView is active or on Preview Tab) */}
        {splitView && (
          <div className="preview-pane">
            <div className="preview-pane-header">
              <div className="preview-client-info">
                <Eye size={14} className="text-primary" />
                <span>Live Interactive Preview</span>
              </div>
              <div className="viewport-toggle">
                <button
                  type="button"
                  className={`device-btn ${previewDevice === 'desktop' ? 'active' : ''}`}
                  onClick={() => setPreviewDevice('desktop')}
                  title="Desktop View (Full Width)"
                >
                  <Laptop size={14} />
                  <span>Desktop</span>
                </button>
                <button
                  type="button"
                  className={`device-btn ${previewDevice === 'mobile' ? 'active' : ''}`}
                  onClick={() => setPreviewDevice('mobile')}
                  title="Mobile View (375px)"
                >
                  <Smartphone size={14} />
                  <span>Mobile</span>
                </button>
              </div>
            </div>

            {/* Email Inbox Simulation Header */}
            <div className="email-envelope-preview">
              <div className="envelope-row">
                <span className="envelope-label">Subject:</span>
                <strong className="envelope-subject">{subject}</strong>
              </div>
              <div className="envelope-row">
                <span className="envelope-label">From:</span>
                <span className="envelope-from">MetroVPS Team &lt;hello@updates.metrovps.com&gt;</span>
              </div>
              <div className="envelope-row">
                <span className="envelope-label">Preheader:</span>
                <span className="envelope-preheader">{currentTemplate?.preheader || '—'}</span>
              </div>
            </div>

            {/* Frame Body */}
            <div className={`preview-viewport-frame ${previewDevice}`}>
              <iframe
                title="Email Live Preview"
                srcDoc={htmlContent}
                className="preview-iframe"
                sandbox="allow-same-origin"
              />
            </div>
          </div>
        )}
      </div>

      {/* Bottom Status & Info Bar */}
      <footer className="email-builder-footer">
        <div className="footer-status-pill">
          <span className="status-dot green-dot" />
          <span>Live Synchronized &middot; Auto-saved</span>
        </div>
        <div className="footer-quick-tips">
          <span>Tip: Switch between <strong>Visual Editor</strong> for drag & color and <strong>HTML Code</strong> for direct markup.</span>
        </div>
        <div className="footer-actions">
          <button
            type="button"
            className="text-link text-xs"
            onClick={() => setTemplateModalOpen(true)}
          >
            <Layers size={13} /> Change Template
          </button>
        </div>
      </footer>

      {/* =========================================================================
          MODALS & DIALOGS
         ========================================================================= */}

      {/* 1. Reusable Template Gallery Modal */}
      {templateModalOpen && (
        <div className="dialog-backdrop" onClick={() => setTemplateModalOpen(false)}>
          <div
            className="action-dialog template-gallery-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="dialog-close"
              onClick={() => setTemplateModalOpen(false)}
            >
              <X size={17} />
            </button>

            <div className="template-gallery-head">
              <div className="eyebrow">EMAIL TEMPLATE LIBRARY</div>
              <h2>Choose an Email Template</h2>
              <p>Explore production-ready, beautiful marketing and traditional business email designs.</p>
            </div>

            {/* Search & Category Pills */}
            <div className="template-gallery-filters">
              <div className="gallery-search">
                <Search size={15} />
                <input
                  type="text"
                  placeholder="Search templates (e.g. sale, webinar, corporate)..."
                  value={templateSearch}
                  onChange={(e) => setTemplateSearch(e.target.value)}
                />
              </div>

              <div className="category-pills">
                {(['All', 'Marketing', 'Transactional'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className={`category-pill ${templateCategory === cat ? 'active' : ''}`}
                    onClick={() => setTemplateCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Template Cards Grid */}
            <div className="template-grid-scroll">
              <div className="template-cards-grid">
                {filteredTemplates.map((template) => {
                  const isCurrent = template.id === currentTemplateId
                  return (
                    <article
                      key={template.id}
                      className={`template-preview-card ${isCurrent ? 'is-selected' : ''}`}
                    >
                      <div className={`card-banner-accent banner-${template.color}`}>
                        <div className="card-mock-header">
                          <span className="card-mock-brand">MetroMail</span>
                          <span className="card-mock-tag">{template.tag}</span>
                        </div>
                        <h4 className="card-mock-title">{template.name}</h4>
                        <div className="card-mock-btn">Preview Button</div>
                      </div>

                      <div className="card-content">
                        <div className="card-meta">
                          <span className="card-cat-badge">{template.category}</span>
                          {isCurrent && <span className="card-active-indicator">Active Now</span>}
                        </div>
                        <h3 className="card-title">{template.name}</h3>
                        <p className="card-desc">{template.description}</p>

                        <div className="card-actions">
                          <button
                            type="button"
                            className="button button-secondary text-xs"
                            onClick={() => setPreviewModalTemplate(template)}
                          >
                            <Eye size={13} /> Preview
                          </button>
                          <button
                            type="button"
                            className="button button-primary text-xs"
                            onClick={() => handleLoadTemplate(template)}
                          >
                            <Check size={13} /> Use Template
                          </button>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>

              {filteredTemplates.length === 0 && (
                <div className="empty-templates-notice">
                  <p>No email templates match your filter or search query.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. Full Template Preview Modal */}
      {previewModalTemplate && (
        <div className="dialog-backdrop" onClick={() => setPreviewModalTemplate(null)}>
          <div
            className="action-dialog preview-fullscreen-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dialog-top-bar flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <span className="eyebrow">{previewModalTemplate.category.toUpperCase()} TEMPLATE</span>
                <h3 className="text-base font-bold text-slate-800">{previewModalTemplate.name}</h3>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="button button-primary"
                  onClick={() => handleLoadTemplate(previewModalTemplate)}
                >
                  <Check size={14} /> Apply to Editor
                </button>
                <button
                  type="button"
                  className="dialog-close"
                  onClick={() => setPreviewModalTemplate(null)}
                >
                  <X size={17} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-hidden mt-3 bg-slate-100 rounded-lg p-3">
              <iframe
                title="Full Template Preview"
                srcDoc={previewModalTemplate.html}
                className="w-full h-full border-0 rounded bg-white shadow-sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* 3. Insert CTA Button Dialog */}
      {ctaModalOpen && (
        <div className="dialog-backdrop" onClick={() => setCtaModalOpen(false)}>
          <div className="action-dialog" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="dialog-close"
              onClick={() => setCtaModalOpen(false)}
            >
              <X size={17} />
            </button>
            <div className="eyebrow">BUTTON ELEMENT</div>
            <h2>Insert Call-to-Action Button</h2>
            <p>Add a clickable button with custom colors and destination link.</p>

            <form
              className="dialog-form"
              onSubmit={(e) => {
                e.preventDefault()
                handleInsertButton()
              }}
            >
              <label>
                Button Text
                <input
                  type="text"
                  value={ctaText}
                  onChange={(e) => setCtaText(e.target.value)}
                  placeholder="e.g. Claim 40% Discount"
                  required
                />
              </label>

              <label>
                Destination URL
                <input
                  type="url"
                  value={ctaUrl}
                  onChange={(e) => setCtaUrl(e.target.value)}
                  placeholder="https://yourbrand.com/action"
                  required
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label>
                  Background Color
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="color"
                      value={ctaBgColor}
                      onChange={(e) => setCtaBgColor(e.target.value)}
                      className="w-10 h-9 p-0 border border-slate-200 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={ctaBgColor}
                      onChange={(e) => setCtaBgColor(e.target.value)}
                      className="flex-1 font-mono text-xs uppercase"
                    />
                  </div>
                </label>

                <label>
                  Text Color
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="color"
                      value={ctaTextColor}
                      onChange={(e) => setCtaTextColor(e.target.value)}
                      className="w-10 h-9 p-0 border border-slate-200 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={ctaTextColor}
                      onChange={(e) => setCtaTextColor(e.target.value)}
                      className="flex-1 font-mono text-xs uppercase"
                    />
                  </div>
                </label>
              </div>

              {/* Preview */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-center mt-2">
                <span className="text-xs text-slate-500 block mb-2 font-medium">Button Preview</span>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '10px 24px',
                    backgroundColor: ctaBgColor,
                    color: ctaTextColor,
                    borderRadius: '6px',
                    fontWeight: 600,
                    fontSize: '13px',
                  }}
                >
                  {ctaText || 'Button Text'} &rarr;
                </span>
              </div>

              <div className="flex justify-end gap-2 mt-3">
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => setCtaModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="button button-primary">
                  Insert into Email
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Insert Link Dialog */}
      {linkModalOpen && (
        <div className="dialog-backdrop" onClick={() => setLinkModalOpen(false)}>
          <div className="action-dialog" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="dialog-close"
              onClick={() => setLinkModalOpen(false)}
            >
              <X size={17} />
            </button>
            <div className="eyebrow">HYPERLINK</div>
            <h2>Insert Hyperlink</h2>
            <p>Link selected text or insert a new custom anchor link.</p>

            <form
              className="dialog-form"
              onSubmit={(e) => {
                e.preventDefault()
                handleInsertLink()
              }}
            >
              <label>
                Destination URL
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                  required
                  autoFocus
                />
              </label>

              <label>
                Link Text (Optional if text is highlighted)
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="e.g. Read full announcement"
                />
              </label>

              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => setLinkModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="button button-primary">
                  Insert Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Send Test Email Dialog */}
      {testEmailModalOpen && (
        <div className="dialog-backdrop" onClick={() => setTestEmailModalOpen(false)}>
          <div className="action-dialog" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="dialog-close"
              onClick={() => setTestEmailModalOpen(false)}
            >
              <X size={17} />
            </button>
            <div className="eyebrow">QUALITY ASSURANCE</div>
            <h2>Send Test Email</h2>
            <p>Send a real test render of your email template directly to your inbox to check how it renders across Gmail, Apple Mail, and Outlook.</p>

            <form className="dialog-form" onSubmit={handleSendTestEmail}>
              <label>
                Recipient Email Address
                <input
                  type="email"
                  value={testEmailAddress}
                  onChange={(e) => setTestEmailAddress(e.target.value)}
                  placeholder="name@company.com"
                  required
                  autoFocus
                />
              </label>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 leading-relaxed">
                Test messages will include an indicator subject tag `[TEST]` and sample personalization tags filled automatically.
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => setTestEmailModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="button button-primary">
                  <Send size={14} /> Send Test Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Insert Image Dialog (Upload from Computer + URL + Customization) */}
      {imageModalOpen && (
        <div className="dialog-backdrop" onClick={() => setImageModalOpen(false)}>
          <div
            className="action-dialog action-dialog-lg"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '540px' }}
          >
            <button
              type="button"
              className="dialog-close"
              onClick={() => setImageModalOpen(false)}
            >
              <X size={17} />
            </button>
            <div className="eyebrow">IMAGE MEDIA ELEMENT</div>
            <h2>Insert Image</h2>
            <p>Upload an image from your computer or paste an online URL to embed into your email.</p>

            <form
              className="dialog-form"
              onSubmit={(e) => {
                e.preventDefault()
                handleInsertImage()
              }}
            >
              {/* Image Source Selection */}
              <div className="dialog-image-upload-section">
                <label className="font-semibold text-xs text-slate-700 mb-1.5 block">
                  Image Source
                </label>

                {imageUrl ? (
                  <div className="dialog-image-preview-box">
                    <div className="dialog-preview-thumb">
                      <img src={imageUrl} alt="Uploaded preview" />
                    </div>
                    <div className="dialog-preview-info">
                      <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                        <Check size={13} /> Image Ready
                      </span>
                      <small className="text-slate-500 block truncate max-w-xs">{imageUrl}</small>
                      <div className="flex gap-2 mt-2">
                        <button
                          type="button"
                          className="button button-secondary text-xs py-1 px-2.5"
                          onClick={() => editorImageFileInputRef.current?.click()}
                          disabled={isUploadingImage}
                        >
                          <Upload size={12} /> Change Image
                        </button>
                        <button
                          type="button"
                          className="text-red-600 hover:text-red-700 text-xs font-medium px-2 py-1"
                          onClick={() => {
                            setImageUrl('')
                            setImageErrorMsg(null)
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`dialog-dropzone-uploader ${imageUploadDragOver ? 'drag-over' : ''} ${
                      isUploadingImage ? 'is-uploading' : ''
                    }`}
                    onDragOver={(e) => {
                      e.preventDefault()
                      setImageUploadDragOver(true)
                    }}
                    onDragLeave={() => setImageUploadDragOver(false)}
                    onDrop={handleImageFileDrop}
                    onClick={() => !isUploadingImage && editorImageFileInputRef.current?.click()}
                  >
                    {isUploadingImage ? (
                      <div className="uploader-status py-4">
                        <Loader2 size={24} className="animate-spin text-sky-600 mb-1" />
                        <span className="text-xs font-medium text-slate-700">Uploading image to server...</span>
                      </div>
                    ) : (
                      <div className="uploader-status py-3">
                        <Upload size={22} className="text-sky-600 mb-1" />
                        <span className="text-xs font-semibold text-slate-800">
                          Click to upload from computer
                        </span>
                        <small className="text-slate-500 text-[11px]">or drag & drop file here (PNG, JPG, WebP, GIF up to 5MB)</small>
                      </div>
                    )}
                  </div>
                )}

                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={editorImageFileInputRef}
                  onChange={handleImageFileChange}
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  style={{ display: 'none' }}
                />

                {/* Direct Image URL fallback */}
                <div className="mt-3">
                  <label className="text-[11.5px] text-slate-600 block mb-1">
                    Or paste Image URL directly:
                  </label>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => {
                      setImageUrl(e.target.value)
                      setImageErrorMsg(null)
                    }}
                    placeholder="https://images.unsplash.com/... or hosted CDN link"
                    className="w-full text-xs"
                  />
                </div>

                {imageErrorMsg && (
                  <p className="text-xs text-red-600 mt-1">{imageErrorMsg}</p>
                )}
              </div>

              {/* Image Properties */}
              <div className="grid grid-cols-2 gap-3 mt-3">
                <label>
                  Alt Text
                  <input
                    type="text"
                    value={imageAlt}
                    onChange={(e) => setImageAlt(e.target.value)}
                    placeholder="e.g. Product overview banner"
                  />
                </label>

                <label>
                  Image Link (Optional)
                  <input
                    type="url"
                    value={imageLink}
                    onChange={(e) => setImageLink(e.target.value)}
                    placeholder="https://metrovps.art/store"
                  />
                </label>
              </div>

              <div className="grid grid-cols-3 gap-3 mt-2">
                <label>
                  Width
                  <select
                    value={imageWidth}
                    onChange={(e) => setImageWidth(e.target.value)}
                    className="w-full mt-1 text-xs"
                  >
                    <option value="100%">100% (Full Width)</option>
                    <option value="560px">560px (Standard)</option>
                    <option value="420px">420px (Medium)</option>
                    <option value="300px">300px (Compact)</option>
                    <option value="180px">180px (Logo/Small)</option>
                  </select>
                </label>

                <label>
                  Alignment
                  <select
                    value={imageAlign}
                    onChange={(e) => setImageAlign(e.target.value as any)}
                    className="w-full mt-1 text-xs"
                  >
                    <option value="center">Center</option>
                    <option value="left">Left</option>
                    <option value="right">Right</option>
                  </select>
                </label>

                <label>
                  Corner Radius
                  <select
                    value={imageBorderRadius}
                    onChange={(e) => setImageBorderRadius(Number(e.target.value))}
                    className="w-full mt-1 text-xs"
                  >
                    <option value={0}>0px (Square)</option>
                    <option value={6}>6px (Subtle)</option>
                    <option value={8}>8px (Medium)</option>
                    <option value={12}>12px (Smooth)</option>
                    <option value={20}>20px (Pill)</option>
                  </select>
                </label>
              </div>

              {/* Live Preview Box */}
              {imageUrl && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center mt-3">
                  <span className="text-[11px] text-slate-500 block mb-1.5 font-medium">Layout Preview</span>
                  <div style={{ textAlign: imageAlign }}>
                    <img
                      src={imageUrl}
                      alt="Preview"
                      style={{
                        maxWidth: '100%',
                        width: imageWidth === '100%' ? '100%' : imageWidth,
                        maxHeight: '130px',
                        objectFit: 'cover',
                        borderRadius: `${imageBorderRadius}px`,
                        display: 'inline-block',
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => setImageModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="button button-primary"
                  disabled={!imageUrl || isUploadingImage}
                >
                  <ImageIcon size={14} />
                  <span>Insert into {editorMode === 'visual' ? 'Visual Editor' : 'HTML Code'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
