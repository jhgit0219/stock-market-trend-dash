import { useState, useMemo } from 'react'
import { useStockList } from '../../../hooks/useStocks'
import { useGrid } from '../StockGrid/GridContext'
import { StockListItem, StockListItemSkeleton } from './StockListItem'
import styles from './SidePanel.module.css'

export function SidePanel() {
  const [search, setSearch] = useState('')
  const { data, isLoading, isError } = useStockList()
  const { state, dispatch } = useGrid()

  const filteredStocks = useMemo(() => {
    if (!data) return []
    const q = search.toLowerCase().trim()
    if (!q) return data.stocks
    return data.stocks.filter(
      (s) => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
    )
  }, [data, search])

  function handleToggle(symbol: string) {
    if (state.stocks.includes(symbol)) {
      dispatch({ type: 'REMOVE_STOCK', symbol })
    } else {
      dispatch({ type: 'ADD_STOCK', symbol })
    }
  }

  const activeCount = state.stocks.length

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <div className={styles.headerRow}>
          <span className={styles.panelTitle}>Stocks</span>
          <span className={styles.countBadge}>{activeCount} active</span>
        </div>
        <div className={styles.searchWrapper}>
          <span className={styles.searchIcon} aria-hidden="true">
            ⌕
          </span>
          <input
            type="search"
            className={styles.searchInput}
            placeholder="Search stocks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search stocks by symbol or name"
          />
        </div>
      </div>

      <div className={styles.divider} />

      <div className={styles.listContainer}>
        {isLoading && (
          <div aria-label="Loading stocks" role="status">
            {Array.from({ length: 8 }, (_, i) => (
              <StockListItemSkeleton key={i} />
            ))}
          </div>
        )}

        {isError && (
          <div className={styles.emptyState} role="alert">
            Failed to load stock list
          </div>
        )}

        {!isLoading && !isError && (
          <div
            className={styles.listbox}
            role="listbox"
            aria-label="Available stocks"
            aria-multiselectable="true"
          >
            {filteredStocks.length === 0 ? (
              <div className={styles.emptyState}>No stocks match your search</div>
            ) : (
              filteredStocks.map((stock) => (
                <StockListItem
                  key={stock.symbol}
                  stock={stock}
                  isChecked={state.stocks.includes(stock.symbol)}
                  onToggle={handleToggle}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
