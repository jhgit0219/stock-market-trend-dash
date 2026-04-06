import React from 'react'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import type { StockInfo } from '../../../lib/types'
import styles from './StockListItem.module.css'

interface StockListItemProps {
  stock: StockInfo
  isChecked: boolean
  onToggle: (symbol: string) => void
}

export function StockListItem({ stock, isChecked, onToggle }: StockListItemProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `panel-${stock.symbol}`,
    data: { type: 'panel-stock', symbol: stock.symbol },
  })

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onToggle(stock.symbol)
    }
  }

  return (
    <div
      ref={setNodeRef}
      className={`${styles.item} ${isChecked ? styles.checked : ''} ${isDragging ? styles.dragging : ''}`}
      style={style}
      role="option"
      aria-selected={isChecked}
      tabIndex={0}
      onClick={() => onToggle(stock.symbol)}
      onKeyDown={handleKeyDown}
      aria-label={`${stock.symbol} ${stock.name}${isChecked ? ', currently in grid' : ''}`}
    >
      <div className={styles.checkbox} aria-hidden="true">
        <span className={styles.checkmark}>✓</span>
      </div>
      <div className={styles.info}>
        <span className={styles.symbol}>{stock.symbol}</span>
        <span className={styles.name} title={stock.name}>
          {stock.name}
        </span>
      </div>
      <div
        className={styles.dragIndicator}
        aria-hidden="true"
        {...listeners}
        {...attributes}
        title={`Drag ${stock.symbol} to grid`}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        onClick={(e) => e.stopPropagation()}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
          <circle cx="5" cy="3.5" r="1" />
          <circle cx="9" cy="3.5" r="1" />
          <circle cx="5" cy="7" r="1" />
          <circle cx="9" cy="7" r="1" />
          <circle cx="5" cy="10.5" r="1" />
          <circle cx="9" cy="10.5" r="1" />
        </svg>
      </div>
    </div>
  )
}

export function StockListItemSkeleton() {
  return (
    <div
      style={{
        height: '52px',
        margin: '2px 8px',
        borderRadius: '4px',
        background:
          'linear-gradient(90deg, var(--color-surface-overlay) 0%, var(--color-surface-raised) 50%, var(--color-surface-overlay) 100%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
      }}
    />
  )
}
