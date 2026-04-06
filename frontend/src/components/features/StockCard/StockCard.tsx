import React, { Component } from 'react'
import { useStockHistory } from '../../../hooks/useStocks'
import { StockChart } from './StockChart'
import type { StockHistory } from '../../../lib/types'
import styles from './StockCard.module.css'

interface CardHeaderProps {
  symbol: string
  history: StockHistory | undefined
  onRemove: () => void
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>
  isDragging?: boolean
}

function computeChange(history: StockHistory): number {
  if (history.data.length < 2) return 0
  const start = history.data[0].close
  const end = history.data[history.data.length - 1].close
  return ((end - start) / start) * 100
}

function CardHeader({ symbol, history, onRemove, dragHandleProps, isDragging }: CardHeaderProps) {
  const change = history ? computeChange(history) : null
  const name = history?.name ?? symbol

  const badgeClass =
    change === null
      ? styles.neutral
      : change > 0
        ? styles.positive
        : change < 0
          ? styles.negative
          : styles.neutral

  const ariaLabel = history
    ? `${symbol}, ${name}, ${change !== null && change >= 0 ? 'up' : 'down'} ${Math.abs(change ?? 0).toFixed(1)}% over 10 years`
    : `${symbol}, loading`

  return (
    <div className={styles.header} aria-label={ariaLabel}>
      <div
        className={styles.dragHandle}
        aria-hidden="true"
        {...dragHandleProps}
        style={isDragging ? { cursor: 'grabbing' } : undefined}
      >
        <DragIcon />
      </div>
      <span className={styles.symbol}>{symbol}</span>
      <span className={styles.name} title={name}>
        {name}
      </span>
      {change !== null && (
        <span className={`${styles.badge} ${badgeClass}`}>
          {change >= 0 ? '+' : ''}
          {change.toFixed(1)}%
        </span>
      )}
      <button
        className={styles.closeButton}
        onClick={onRemove}
        aria-label={`Remove ${symbol} from grid`}
        title={`Remove ${symbol}`}
      >
        ×
      </button>
    </div>
  )
}

function DragIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
      <circle cx="4" cy="3" r="1" />
      <circle cx="8" cy="3" r="1" />
      <circle cx="4" cy="6" r="1" />
      <circle cx="8" cy="6" r="1" />
      <circle cx="4" cy="9" r="1" />
      <circle cx="8" cy="9" r="1" />
    </svg>
  )
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

class ChartErrorBoundary extends Component<
  { children: React.ReactNode; symbol: string },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode; symbol: string }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  reset = () => this.setState({ hasError: false, error: null })

  render() {
    if (this.state.hasError) {
      return (
        <div className={styles.errorState} role="alert">
          <span className={styles.errorIcon}>⚠</span>
          <p className={styles.errorMessage}>Chart error for {this.props.symbol}</p>
          <button className={styles.retryButton} onClick={this.reset}>
            Retry
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

interface StockCardContentProps {
  symbol: string
  onRemove: () => void
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>
  isDragging?: boolean
  visible?: boolean
}

function StockCardContent({
  symbol,
  onRemove,
  dragHandleProps,
  isDragging,
  visible = true,
}: StockCardContentProps) {
  const { data: history, isLoading, isError, refetch } = useStockHistory(symbol)

  if (isLoading) {
    return (
      <div className={styles.skeleton} role="status" aria-label={`Loading ${symbol} data`}>
        <div className={styles.skeletonHeader} />
        <div className={styles.skeletonChart} />
      </div>
    )
  }

  if (isError || !history) {
    return (
      <>
        <CardHeader
          symbol={symbol}
          history={undefined}
          onRemove={onRemove}
          dragHandleProps={dragHandleProps}
          isDragging={isDragging}
        />
        <div className={styles.errorState} role="alert">
          <span className={styles.errorIcon}>⚠</span>
          <p className={styles.errorMessage}>Unable to load data for {symbol}</p>
          <button className={styles.retryButton} onClick={() => void refetch()}>
            Retry
          </button>
        </div>
      </>
    )
  }

  return (
    <>
      <CardHeader
        symbol={symbol}
        history={history}
        onRemove={onRemove}
        dragHandleProps={dragHandleProps}
        isDragging={isDragging}
      />
      <div className={styles.chartArea}>
        <ChartErrorBoundary symbol={symbol}>
          <StockChart history={history} visible={visible} />
        </ChartErrorBoundary>
      </div>
    </>
  )
}

export interface StockCardProps {
  symbol: string
  onRemove: () => void
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>
  isDragging?: boolean
  isOver?: boolean
  visible?: boolean
}

export function StockCard({
  symbol,
  onRemove,
  dragHandleProps,
  isDragging,
  isOver,
  visible = true,
}: StockCardProps) {
  return (
    <div
      className={`${styles.card} ${isDragging ? styles.dragging : ''} ${isOver ? styles.dragOver : ''}`}
      role="article"
      aria-label={`${symbol} stock card`}
    >
      <StockCardContent
        symbol={symbol}
        onRemove={onRemove}
        dragHandleProps={dragHandleProps}
        isDragging={isDragging}
        visible={visible}
      />
    </div>
  )
}
