import React, { useRef, useEffect, useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { StockCard } from '../StockCard/StockCard'
import { useGrid } from './GridContext'
import styles from './StockGrid.module.css'

interface StockGridCellProps {
  symbol: string
  index: number
}

export function StockGridCell({ symbol, index }: StockGridCellProps) {
  const { dispatch } = useGrid()
  const cellRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(true)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({
    id: symbol,
    data: { type: 'grid-stock', symbol, index },
  })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1000 : undefined,
  }

  // IntersectionObserver for lazy chart mounting (STORY-011)
  useEffect(() => {
    const el = cellRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting)
      },
      { threshold: 0.1 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  function handleRemove() {
    dispatch({ type: 'REMOVE_STOCK', symbol })
  }

  return (
    <div
      ref={(node) => {
        setNodeRef(node)
        ;(cellRef as React.MutableRefObject<HTMLDivElement | null>).current = node
      }}
      className={styles.cell}
      style={style}
    >
      <StockCard
        symbol={symbol}
        onRemove={handleRemove}
        dragHandleProps={{ ...listeners, ...attributes }}
        isDragging={isDragging}
        isOver={isOver}
        visible={isVisible}
      />
    </div>
  )
}

interface DropZoneCellProps {
  id: string
}

export function DropZoneCell({ id }: DropZoneCellProps) {
  const { isOver, setNodeRef } = useDroppable({ id })

  return (
    <div ref={setNodeRef} className={styles.cell}>
      <div className={`${styles.dropZone} ${isOver ? styles.isOver : ''}`}>
        {isOver ? 'Drop here' : 'Empty'}
      </div>
    </div>
  )
}
