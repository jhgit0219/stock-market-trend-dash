export interface StockInfo {
  symbol: string
  name: string
  sector: string
}

export interface StockDataPoint {
  date: string
  close: number
}

export interface StockHistory {
  symbol: string
  name: string
  data: StockDataPoint[]
  mock: boolean
}

export interface StockListResponse {
  stocks: StockInfo[]
}

export interface BatchHistoryRequest {
  symbols: string[]
}

export interface BatchHistoryResponse {
  results: Record<string, StockHistory>
}

export interface ApiError {
  error: {
    code: string
    message: string
  }
}

export type GridAction =
  | { type: 'ADD_STOCK'; symbol: string }
  | { type: 'REMOVE_STOCK'; symbol: string }
  | { type: 'REORDER_STOCKS'; symbols: string[] }

export interface GridState {
  stocks: string[]
}
