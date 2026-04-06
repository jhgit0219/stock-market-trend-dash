import React, { createContext, useContext, useReducer } from 'react'
import type { GridAction, GridState } from '../../../lib/types'
import { DEFAULT_GRID_STOCKS } from '../../../lib/constants'

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

interface GridContextValue {
  state: GridState
  dispatch: React.Dispatch<GridAction>
}

const GridContext = createContext<GridContextValue | null>(null)

export function GridProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(gridReducer, { stocks: DEFAULT_GRID_STOCKS })

  return <GridContext.Provider value={{ state, dispatch }}>{children}</GridContext.Provider>
}

export function useGrid(): GridContextValue {
  const ctx = useContext(GridContext)
  if (!ctx) throw new Error('useGrid must be used within GridProvider')
  return ctx
}
