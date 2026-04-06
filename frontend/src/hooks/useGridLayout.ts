import { useGrid } from '../components/features/StockGrid/GridContext'
import { MAX_GRID_COLUMNS } from '../lib/constants'

export function useGridLayout() {
  const { state } = useGrid()
  const count = state.stocks.length
  const rows = Math.ceil(count / MAX_GRID_COLUMNS)
  const isScrollable = rows > 2

  return {
    stocks: state.stocks,
    count,
    rows,
    isScrollable,
    isEmpty: count === 0,
  }
}
