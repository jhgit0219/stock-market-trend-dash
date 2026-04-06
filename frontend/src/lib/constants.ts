export const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api'

export const DEFAULT_GRID_STOCKS = [
  'AAPL',
  'MSFT',
  'GOOGL',
  'AMZN',
  'NVDA',
  'META',
  'TSLA',
  'JPM',
  'V',
  'JNJ',
]

export const MAX_GRID_COLUMNS = 5

export const QUERY_STALE_TIME = 15 * 60 * 1000 // 15 minutes
export const QUERY_GC_TIME = 60 * 60 * 1000 // 1 hour

export const DRAG_ACTIVATION_DISTANCE = 8 // pixels

export const SIDE_PANEL_WIDTH = 280
export const SIDE_PANEL_COLLAPSED_WIDTH = 48
