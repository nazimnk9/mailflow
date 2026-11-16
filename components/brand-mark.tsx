type BrandMarkProps = {
  compact?: boolean
  productLabel?: string
  className?: string
}

const logoSource = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-light-ieqrJhs3NRVKkesdr16EMNNzTBpCfD.png'

export function BrandMark({ compact = false, productLabel = 'Email Cloud', className = '' }: BrandMarkProps) {
  return (
    <a className={`brand-lockup ${compact ? 'brand-lockup-compact' : ''} ${className}`} href="/" aria-label="MetroVPS Email Cloud home">
      <img src={logoSource} alt="MetroVPS" />
      {!compact && <span className="brand-product-label">{productLabel}</span>}
    </a>
  )
}
