import { useQuery } from '@tanstack/react-query'
import { fetchStockList, fetchStockHistory } from '../lib/api'
import type { StockListResponse, StockHistory } from '../lib/types'

export function useStockList() {
  return useQuery<StockListResponse, Error>({
    queryKey: ['stocks'],
    queryFn: fetchStockList,
  })
}

export function useStockHistory(symbol: string) {
  return useQuery<StockHistory, Error>({
    queryKey: ['stock-history', symbol],
    queryFn: () => fetchStockHistory(symbol),
    enabled: Boolean(symbol),
  })
}
