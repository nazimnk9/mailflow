export type ExportFormat = 'csv' | 'excel' | 'pdf'
export type ExportRow = Record<string, string | number | boolean | null | undefined>

function safeFileName(value: string) {
  return value.trim().replace(/[^a-z0-9-_]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'workspace-export'
}

function formatCell(value: ExportRow[string]) {
  if (value === null || value === undefined) return ''
  return String(value)
}

function downloadCsv(rows: ExportRow[], fileName: string) {
  const headers = Object.keys(rows[0] ?? {})
  const csvRows = [headers, ...rows.map((row) => headers.map((header) => {
    const rawValue = row[header]
    const value = formatCell(rawValue)
    return typeof rawValue === 'string' && /^[\s]*[=+@-]/.test(value) ? `'${value}` : value
  }))].map((row) => row.map((value) => `"${value.replace(/"/g, '""')}"`).join(','))
  const blob = new Blob([`\uFEFF${csvRows.join('\r\n')}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${safeFileName(fileName)}.csv`
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

async function downloadExcel(rows: ExportRow[], fileName: string) {
  const XLSX = await import('xlsx')
  const headers = Object.keys(rows[0] ?? {})
  const sheet = XLSX.utils.aoa_to_sheet([headers, ...rows.map((row) => headers.map((header) => row[header] ?? ''))])
  sheet['!cols'] = headers.map((header) => ({ wch: Math.min(42, rows.reduce((width, row) => Math.max(width, formatCell(row[header]).length + 2), header.length + 2)) }))
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, 'Workspace data')
  XLSX.writeFile(workbook, `${safeFileName(fileName)}.xlsx`)
}

async function downloadPdf(rows: ExportRow[], fileName: string) {
  const { jsPDF } = await import('jspdf')
  const document = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
  const headers = Object.keys(rows[0] ?? {})
  const pageWidth = document.internal.pageSize.getWidth()
  const pageHeight = document.internal.pageSize.getHeight()
  const margin = 34
  const columnWidth = (pageWidth - margin * 2) / Math.max(headers.length, 1)
  const title = fileName.replace(/[-_]+/g, ' ')

  document.setFont('helvetica', 'bold')
  document.setFontSize(16)
  document.setTextColor(24, 39, 69)
  document.text(title, margin, 34)
  document.setFont('helvetica', 'normal')
  document.setFontSize(8)
  document.setTextColor(104, 119, 143)
  document.text(`${rows.length.toLocaleString()} records · Exported ${new Date().toLocaleString()}`, margin, 49)

  const drawHeader = (y: number) => {
    document.setFillColor(239, 243, 251)
    document.roundedRect(margin, y - 12, pageWidth - margin * 2, 25, 4, 4, 'F')
    document.setFont('helvetica', 'bold')
    document.setFontSize(7)
    document.setTextColor(48, 68, 105)
    headers.forEach((header, index) => {
      const label = header.replace(/([A-Z])/g, ' $1').replace(/[_-]/g, ' ').trim()
      document.text(document.splitTextToSize(label, columnWidth - 12), margin + index * columnWidth + 6, y)
    })
    document.setFont('helvetica', 'normal')
    document.setTextColor(61, 76, 99)
  }

  let y = 76
  drawHeader(y)
  y += 25
  rows.forEach((row, rowIndex) => {
    const cells = headers.map((header) => document.splitTextToSize(formatCell(row[header]), columnWidth - 12).slice(0, 3))
    const lineCount = Math.max(1, ...cells.map((lines) => lines.length))
    const rowHeight = Math.max(24, lineCount * 9 + 12)
    if (y + rowHeight > pageHeight - 30) {
      document.addPage()
      y = 44
      drawHeader(y)
      y += 25
    }
    if (rowIndex % 2 === 0) {
      document.setFillColor(250, 251, 253)
      document.rect(margin, y - 11, pageWidth - margin * 2, rowHeight, 'F')
    }
    cells.forEach((lines, index) => document.text(lines.length ? lines : [''], margin + index * columnWidth + 6, y + 2))
    document.setDrawColor(233, 237, 244)
    document.line(margin, y + rowHeight - 7, pageWidth - margin, y + rowHeight - 7)
    y += rowHeight
  })
  document.save(`${safeFileName(fileName)}.pdf`)
}

export async function exportTableData(rows: ExportRow[], fileName: string, format: ExportFormat) {
  if (format === 'csv') downloadCsv(rows, fileName)
  if (format === 'excel') await downloadExcel(rows, fileName)
  if (format === 'pdf') await downloadPdf(rows, fileName)
}
