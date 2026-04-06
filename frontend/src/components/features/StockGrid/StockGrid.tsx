import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  arrayMove,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import { restrictToWindowEdges } from '@dnd-kit/modifiers'
import { useGrid } from './GridContext'
import { StockGridCell } from './StockGridCell'
import { StockCard } from '../StockCard/StockCard'
import styles from './StockGrid.module.css'
import { DRAG_ACTIVATION_DISTANCE } from '../../../lib/constants'

export function StockGrid() {
  const { state, dispatch } = useGrid()
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: DRAG_ACTIVATION_DISTANCE },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  function handleDragStart(event: DragStartEvent) {
    const { active } = event
    const data = active.data.current as { type?: string; symbol?: string } | undefined

    // Only handle grid stocks in start (panel stocks handled by overlay)
    if (data?.type === 'grid-stock' || data?.type === 'panel-stock') {
      const sym = data.symbol ?? (active.id as string).replace('panel-', '')
      setActiveId(sym)
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const activeData = active.data.current as { type?: string; symbol?: string } | undefined
    const overData = over.data.current as { type?: string; symbol?: string } | undefined

    // Panel stock dropped onto grid
    if (activeData?.type === 'panel-stock') {
      const symbol = activeData.symbol
      if (!symbol) return

      if (state.stocks.includes(symbol)) return // already in grid

      const overSymbol = overData?.symbol ?? (over.id as string)
      const overIndex = state.stocks.indexOf(overSymbol)

      const newStocks = [...state.stocks]
      if (overIndex >= 0) {
        newStocks.splice(overIndex, 0, symbol)
      } else {
        newStocks.push(symbol)
      }
      dispatch({ type: 'REORDER_STOCKS', symbols: newStocks })
      return
    }

    // Grid stock reordering
    if (activeData?.type === 'grid-stock' && over.id !== active.id) {
      const oldIndex = state.stocks.indexOf(active.id as string)
      const newIndex = state.stocks.indexOf(over.id as string)

      if (oldIndex !== -1 && newIndex !== -1) {
        dispatch({
          type: 'REORDER_STOCKS',
          symbols: arrayMove(state.stocks, oldIndex, newIndex),
        })
      }
    }
  }

  const isEmpty = state.stocks.length === 0

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToWindowEdges]}
      autoScroll={{
        enabled: true,
        interval: 5,
        threshold: { x: 0.2, y: 0.2 },
        acceleration: 5,
      }}
    >
      <div className={styles.gridContainer} id="stock-grid-container">
        <SortableContext items={state.stocks} strategy={rectSortingStrategy}>
          <div className={`${styles.grid} ${state.stocks.length > 0 ? styles.hasItems : ''}`}>
            {isEmpty ? (
              <div className={styles.emptyState} role="status">
                <span className={styles.emptyIcon} aria-hidden="true">
                  📈
                </span>
                <p className={styles.emptyTitle}>No stocks selected</p>
                <p className={styles.emptySubtitle}>
                  Drag a stock from the panel to get started
                </p>
                <span className={styles.emptyArrow} aria-hidden="true">
                  ←
                </span>
              </div>
            ) : (
              state.stocks.map((symbol, index) => (
                <StockGridCell key={symbol} symbol={symbol} index={index} />
              ))
            )}
          </div>
        </SortableContext>
      </div>

      <DragOverlay modifiers={[restrictToWindowEdges]}>
        {activeId && (
          <div className={styles.dragOverlay} style={{ width: '100%', height: '100%' }}>
            <StockCard
              symbol={activeId}
              onRemove={() => undefined}
              isDragging={false}
              visible={true}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
