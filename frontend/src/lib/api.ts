import { API_BASE } from './constants'
import type { StockListResponse, StockHistory, BatchHistoryResponse } from './types'

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options)
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    const message = (body as { error?: { message?: string } }).error?.message ?? response.statusText
    throw new Error(message)
  }
  return response.json() as Promise<T>
}

export async function fetchStockList(): Promise<StockListResponse> {
  return fetchJson<StockListResponse>(`${API_BASE}/stocks`)
}

export async function fetchStockHistory(symbol: string): Promise<StockHistory> {
  return fetchJson<StockHistory>(`${API_BASE}/stocks/${symbol}/history`)
}

export async function fetchBatchHistory(symbols: string[]): Promise<BatchHistoryResponse> {
  return fetchJson<BatchHistoryResponse>(`${API_BASE}/stocks/batch-history`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ symbols }),
  })
}
