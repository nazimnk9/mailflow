'use client'

type TablePaginationProps = {
  pageIndex: number
  pageSize: number
  totalItems: number
  pageSizeOptions?: number[]
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}

export function TablePagination({ pageIndex, pageSize, totalItems, pageSizeOptions = [6, 12, 24], onPageChange, onPageSizeChange }: TablePaginationProps) {
  const pageCount = Math.max(1, Math.ceil(totalItems / pageSize))
  const firstPage = totalItems === 0 ? 0 : pageIndex * pageSize + 1
  const lastPage = Math.min((pageIndex + 1) * pageSize, totalItems)
  const pages = pageCount <= 5
    ? Array.from({ length: pageCount }, (_, index) => index)
    : Array.from(new Set([0, pageIndex - 1, pageIndex, pageIndex + 1, pageCount - 1].filter((page) => page >= 0 && page < pageCount))).sort((left, right) => left - right)

  return <nav className="table-pagination" aria-label="Table pagination">
    <span className="pagination-summary">Showing <b>{firstPage}–{lastPage}</b> of <b>{totalItems.toLocaleString()}</b></span>
    <div className="pagination-actions">
      <label className="pagination-size">Rows
        <select aria-label="Rows per page" value={pageSize} onChange={(event) => onPageSizeChange(Number(event.target.value))}>
          {pageSizeOptions.map((size) => <option key={size} value={size}>{size}</option>)}
        </select>
      </label>
      <button className="pagination-step" aria-label="Previous page" onClick={() => onPageChange(pageIndex - 1)} disabled={pageIndex <= 0}>Previous</button>
      <div className="pagination-pages">
        {pages.map((page, index) => <span className="pagination-page-wrap" key={page}>
          {index > 0 && page - pages[index - 1] > 1 && <span className="pagination-ellipsis" aria-hidden="true">…</span>}
          <button aria-label={`Page ${page + 1}`} aria-current={pageIndex === page ? 'page' : undefined} className={pageIndex === page ? 'pagination-page pagination-page-current' : 'pagination-page'} onClick={() => onPageChange(page)}>{page + 1}</button>
        </span>)}
      </div>
      <button className="pagination-step" aria-label="Next page" onClick={() => onPageChange(pageIndex + 1)} disabled={pageIndex >= pageCount - 1}>Next</button>
    </div>
  </nav>
}
