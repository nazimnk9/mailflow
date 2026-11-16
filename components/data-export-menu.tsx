'use client'

import { useState, type MouseEvent } from 'react'
import { ArrowDownToLine, FileSpreadsheet, FileText, LoaderCircle } from 'lucide-react'
import { exportTableData, type ExportFormat, type ExportRow } from '@/lib/exports'

type DataExportMenuProps = {
  rows: ExportRow[]
  fileName: string
  onAction?: (message: string) => void
}

const formats: { id: ExportFormat; label: string; icon: typeof FileText }[] = [
  { id: 'csv', label: 'CSV file', icon: FileText },
  { id: 'excel', label: 'Excel workbook', icon: FileSpreadsheet },
  { id: 'pdf', label: 'PDF document', icon: FileText },
]

export function DataExportMenu({ rows, fileName, onAction }: DataExportMenuProps) {
  const [working, setWorking] = useState(false)

  const exportAs = async (format: ExportFormat, event: MouseEvent<HTMLButtonElement>) => {
    const details = event.currentTarget.closest('details')
    setWorking(true)
    try {
      await exportTableData(rows, fileName, format)
      details?.removeAttribute('open')
      details?.querySelector('summary')?.focus()
      onAction?.(`${rows.length.toLocaleString()} ${rows.length === 1 ? 'row' : 'rows'} exported.`)
    } catch {
      onAction?.('The export could not be created. Please try again.')
    } finally {
      setWorking(false)
    }
  }

  return <details className="data-export-menu">
    <summary className="button button-secondary"><ArrowDownToLine size={14} /> Export <span className="sr-only">table data</span></summary>
    <div className="data-export-options" role="group" aria-label="Choose export format">
      {formats.map(({ id, label, icon: Icon }) => <button key={id} type="button" disabled={working || rows.length === 0} onClick={(event) => void exportAs(id, event)}>
        {working ? <LoaderCircle className="export-spinner" size={15} /> : <Icon size={15} />}
        <span>{label}</span>
        <small>{id === 'excel' ? '.xlsx' : `.${id}`}</small>
      </button>)}
    </div>
  </details>
}
