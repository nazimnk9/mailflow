'use client'

import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

export interface FloatingRowActionMenuProps {
  isOpen: boolean
  anchorRect: DOMRect | null
  onClose: () => void
  children: React.ReactNode
  minWidth?: string | number
  className?: string
}

export function FloatingRowActionMenu({
  isOpen,
  anchorRect,
  onClose,
  children,
  minWidth = '180px',
  className = '',
}: FloatingRowActionMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!isOpen) return

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null
      if (menuRef.current && target && !menuRef.current.contains(target)) {
        // If clicking on a trigger button that opened it, let the trigger handler handle toggling
        if (target.closest('.row-action-trigger') || target.closest('.row-action-cell > button')) {
          return
        }
        onClose()
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    const handleScrollOrResize = () => {
      onClose()
    }

    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('keydown', handleKeyDown)
    window.addEventListener('scroll', handleScrollOrResize, true)
    window.addEventListener('resize', handleScrollOrResize)

    return () => {
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('scroll', handleScrollOrResize, true)
      window.removeEventListener('resize', handleScrollOrResize)
    }
  }, [isOpen, onClose])

  if (!mounted || !isOpen || !anchorRect || typeof document === 'undefined') {
    return null
  }

  // Calculate viewport boundaries and open direction
  const spaceBelow = window.innerHeight - anchorRect.bottom
  const spaceAbove = anchorRect.top
  // Flip upwards if space below is less than 185px and there's more room above
  const openUp = spaceBelow < 185 && spaceAbove > spaceBelow

  const top = openUp ? undefined : Math.max(8, anchorRect.bottom + 4)
  const bottom = openUp ? Math.max(8, window.innerHeight - anchorRect.top + 4) : undefined
  const right = Math.max(8, window.innerWidth - anchorRect.right)

  return createPortal(
    <div
      ref={menuRef}
      className={`row-action-menu floating-portal ${openUp ? 'open-up' : ''} ${className}`.trim()}
      data-placement={openUp ? 'top' : 'bottom'}
      role="menu"
      aria-orientation="vertical"
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        zIndex: 999999,
        top: top !== undefined ? `${top}px` : undefined,
        bottom: bottom !== undefined ? `${bottom}px` : undefined,
        right: `${right}px`,
        display: 'flex',
        flexDirection: 'column',
        minWidth: typeof minWidth === 'number' ? `${minWidth}px` : minWidth,
        width: 'max-content',
        maxWidth: 'calc(100vw - 24px)',
        padding: '6px',
        border: '1px solid #e2e8f0',
        borderRadius: '9px',
        backgroundColor: '#ffffff',
        boxShadow:
          '0 12px 30px -4px rgba(15, 23, 42, 0.22), 0 6px 14px -3px rgba(15, 23, 42, 0.12)',
        animation: 'fadeInRowMenu 0.12s ease-out',
        transformOrigin: openUp ? 'bottom right' : 'top right',
      }}
    >
      {children}
    </div>,
    document.body
  )
}

export function RowActionMenuItem({
  icon: Icon,
  label,
  onClick,
  isDanger = false,
  disabled = false,
}: {
  icon?: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>
  label: string
  onClick: () => void
  isDanger?: boolean
  disabled?: boolean
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <button
      type="button"
      className={`row-action-menu-item ${isDanger ? 'row-action-danger' : ''}`}
      role="menuitem"
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={(e) => {
        e.stopPropagation()
        if (disabled) return
        onClick()
      }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        width: '100%',
        padding: '8px 12px',
        border: 'none',
        borderRadius: '6px',
        fontSize: '13.5px',
        fontWeight: 500,
        textAlign: 'left',
        cursor: disabled ? 'not-allowed' : 'pointer',
        whiteSpace: 'nowrap',
        userSelect: 'none',
        opacity: disabled ? 0.5 : 1,
        backgroundColor: hovered && !disabled
          ? isDanger
            ? '#fef2f2'
            : '#eff6ff'
          : '#ffffff',
        color: isDanger
          ? hovered
            ? '#b91c1c'
            : '#dc2626'
          : hovered
          ? '#1d4ed8'
          : '#334155',
        transition: 'background-color 0.15s ease, color 0.15s ease',
      }}
    >
      {Icon && (
        <Icon
          size={15}
          className="row-action-icon"
          style={{
            flexShrink: 0,
            color: isDanger
              ? hovered
                ? '#b91c1c'
                : '#ef4444'
              : hovered
              ? '#2563eb'
              : '#64748b',
            transition: 'color 0.15s ease',
          }}
        />
      )}
      <span>{label}</span>
    </button>
  )
}

export function RowActionDivider() {
  return (
    <div
      className="row-action-divider"
      role="separator"
      style={{
        height: '1px',
        margin: '4px 2px',
        backgroundColor: '#e2e8f0',
        border: 'none',
      }}
    />
  )
}
