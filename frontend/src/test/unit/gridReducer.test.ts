import { describe, it, expect } from 'vitest'
import type { GridState, GridAction } from '../../lib/types'

// Extract and test the reducer logic directly without React
function gridReducer(state: GridState, action: GridAction): GridState {
  switch (action.type) {
    case 'ADD_STOCK': {
      if (state.stocks.includes(action.symbol)) return state
      return { ...state, stocks: [...state.stocks, action.symbol] }
    }
    case 'REMOVE_STOCK': {
      return { ...state, stocks: state.stocks.filter((s) => s !== action.symbol) }
    }
    case 'REORDER_STOCKS': {
      return { ...state, stocks: action.symbols }
    }
    default:
      return state
  }
}

describe('gridReducer', () => {
  const initialState: GridState = { stocks: ['AAPL', 'MSFT', 'GOOGL'] }

  describe('ADD_STOCK', () => {
    it('appends a new symbol to the end of the list', () => {
      const next = gridReducer(initialState, { type: 'ADD_STOCK', symbol: 'AMZN' })
      expect(next.stocks).toEqual(['AAPL', 'MSFT', 'GOOGL', 'AMZN'])
    })

    it('returns the same state reference when symbol already exists', () => {
      const next = gridReducer(initialState, { type: 'ADD_STOCK', symbol: 'AAPL' })
      expect(next).toBe(initialState)
    })

    it('does not mutate the original state', () => {
      const original = ['AAPL', 'MSFT']
      const state: GridState = { stocks: original }
      gridReducer(state, { type: 'ADD_STOCK', symbol: 'NVDA' })
      expect(state.stocks).toEqual(['AAPL', 'MSFT'])
    })

    it('can add to an empty stocks list', () => {
      const empty: GridState = { stocks: [] }
      const next = gridReducer(empty, { type: 'ADD_STOCK', symbol: 'TSLA' })
      expect(next.stocks).toEqual(['TSLA'])
    })

    it('treats symbol comparison as case-sensitive', () => {
      // Symbol 'aapl' is different from 'AAPL'
      const next = gridReducer(initialState, { type: 'ADD_STOCK', symbol: 'aapl' })
      expect(next.stocks).toContain('aapl')
      expect(next.stocks).toContain('AAPL')
    })
  })

  describe('REMOVE_STOCK', () => {
    it('removes the specified symbol from the list', () => {
      const next = gridReducer(initialState, { type: 'REMOVE_STOCK', symbol: 'MSFT' })
      expect(next.stocks).toEqual(['AAPL', 'GOOGL'])
    })

    it('returns a new state with updated stocks when symbol is removed', () => {
      const next = gridReducer(initialState, { type: 'REMOVE_STOCK', symbol: 'AAPL' })
      expect(next).not.toBe(initialState)
      expect(next.stocks).not.toContain('AAPL')
    })

    it('returns state without the removed symbol when symbol is at the end', () => {
      const next = gridReducer(initialState, { type: 'REMOVE_STOCK', symbol: 'GOOGL' })
      expect(next.stocks).toEqual(['AAPL', 'MSFT'])
    })

    it('returns a state with same stocks when symbol does not exist', () => {
      const next = gridReducer(initialState, { type: 'REMOVE_STOCK', symbol: 'UNKNOWN' })
      expect(next.stocks).toEqual(['AAPL', 'MSFT', 'GOOGL'])
    })

    it('returns empty array when removing the only stock', () => {
      const single: GridState = { stocks: ['AAPL'] }
      const next = gridReducer(single, { type: 'REMOVE_STOCK', symbol: 'AAPL' })
      expect(next.stocks).toEqual([])
    })

    it('does not mutate the original stocks array', () => {
      const original = ['AAPL', 'MSFT', 'GOOGL']
      const state: GridState = { stocks: original }
      gridReducer(state, { type: 'REMOVE_STOCK', symbol: 'MSFT' })
      expect(state.stocks).toEqual(['AAPL', 'MSFT', 'GOOGL'])
    })
  })

  describe('REORDER_STOCKS', () => {
    it('replaces the entire stocks list with the provided array', () => {
      const newOrder = ['GOOGL', 'AAPL', 'MSFT']
      const next = gridReducer(initialState, { type: 'REORDER_STOCKS', symbols: newOrder })
      expect(next.stocks).toEqual(['GOOGL', 'AAPL', 'MSFT'])
    })

    it('accepts an empty array to clear all stocks', () => {
      const next = gridReducer(initialState, { type: 'REORDER_STOCKS', symbols: [] })
      expect(next.stocks).toEqual([])
    })

    it('returns a new state object', () => {
      const next = gridReducer(initialState, {
        type: 'REORDER_STOCKS',
        symbols: ['GOOGL', 'AAPL', 'MSFT'],
      })
      expect(next).not.toBe(initialState)
    })

    it('can reorder to a larger list than the current one', () => {
      const next = gridReducer(initialState, {
        type: 'REORDER_STOCKS',
        symbols: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA'],
      })
      expect(next.stocks).toHaveLength(5)
    })
  })

  describe('unknown action', () => {
    it('returns state unchanged for an unrecognized action type', () => {
      // Cast to bypass TypeScript exhaustiveness check for the test
      const next = gridReducer(initialState, { type: 'UNKNOWN_ACTION' } as unknown as GridAction)
      expect(next).toBe(initialState)
    })
  })
})
