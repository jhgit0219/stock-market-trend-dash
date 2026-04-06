import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

vi.mock('../../components/features/StockGrid/StockGrid.module.css', () => ({ default: {} }))
vi.mock('../../components/features/StockCard/StockCard.module.css', () => ({ default: {} }))
vi.mock('../../components/features/StockCard/StockChart.module.css', () => ({ default: {} }))

// Mock StockCard to simplify — tested separately
vi.mock('../../components/features/StockCard/StockCard', () => ({
  StockCard: ({ symbol }: { symbol: string }) =>
    React.createElement('div', { 'data-testid': `stock-card-${symbol}`, role: 'article' }, symbol),
}))

// Mock StockGridCell to pass through
vi.mock('../../components/features/StockGrid/StockGridCell', () => ({
  StockGridCell: ({ symbol }: { symbol: string }) =>
    React.createElement(
      'div',
      { 'data-testid': `grid-cell-${symbol}` },
      React.createElement('div', { 'data-testid': `stock-card-${symbol}`, role: 'article' }, symbol)
    ),
}))

// dnd-kit mocks
vi.mock('@dnd-kit/core', async (importOriginal) => {
  const original = await importOriginal<typeof import('@dnd-kit/core')>()
  return {
    ...original,
    DndContext: ({ children }: { children: React.ReactNode }) =>
      React.createElement('div', null, children),
    DragOverlay: ({ children }: { children: React.ReactNode }) =>
      children ? React.createElement('div', null, children) : null,
    useSensor: vi.fn(),
    useSensors: vi.fn(() => []),
    PointerSensor: vi.fn(),
    KeyboardSensor: vi.fn(),
    closestCenter: vi.fn(),
  }
})

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', null, children),
  sortableKeyboardCoordinates: vi.fn(),
  arrayMove: vi.fn((arr: string[], from: number, to: number) => {
    const result = [...arr]
    const [item] = result.splice(from, 1)
    result.splice(to, 0, item)
    return result
  }),
  rectSortingStrategy: vi.fn(),
}))

vi.mock('@dnd-kit/modifiers', () => ({
  restrictToWindowEdges: vi.fn(),
}))

// Mock useGrid so we control the state
vi.mock('../../components/features/StockGrid/GridContext', () => ({
  useGrid: vi.fn(),
  GridProvider: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', null, children),
}))

import { StockGrid } from '../../components/features/StockGrid/StockGrid'
import * as GridContextModule from '../../components/features/StockGrid/GridContext'

const mockUseGrid = vi.mocked(GridContextModule.useGrid)

function makeGridState(stocks: string[]) {
  return {
    state: { stocks },
    dispatch: vi.fn(),
  }
}

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: qc }, children)
  }
}

describe('StockGrid', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('empty state', () => {
    it('shows "No stocks selected" placeholder when grid is empty', () => {
      mockUseGrid.mockReturnValue(makeGridState([]))
      render(<StockGrid />, { wrapper: createWrapper() })

      expect(screen.getByRole('status')).toBeInTheDocument()
      expect(screen.getByText(/No stocks selected/i)).toBeInTheDocument()
    })

    it('shows drag instruction text in empty state', () => {
      mockUseGrid.mockReturnValue(makeGridState([]))
      render(<StockGrid />, { wrapper: createWrapper() })

      expect(screen.getByText(/Drag a stock from the panel to get started/i)).toBeInTheDocument()
    })

    it('does not render any stock card articles in empty state', () => {
      mockUseGrid.mockReturnValue(makeGridState([]))
      render(<StockGrid />, { wrapper: createWrapper() })

      expect(screen.queryByRole('article')).not.toBeInTheDocument()
    })
  })

  describe('populated state', () => {
    it('renders one grid cell per stock', () => {
      mockUseGrid.mockReturnValue(makeGridState(['AAPL', 'MSFT', 'GOOGL']))
      render(<StockGrid />, { wrapper: createWrapper() })

      expect(screen.getByTestId('grid-cell-AAPL')).toBeInTheDocument()
      expect(screen.getByTestId('grid-cell-MSFT')).toBeInTheDocument()
      expect(screen.getByTestId('grid-cell-GOOGL')).toBeInTheDocument()
    })

    it('renders exactly as many cells as there are stocks', () => {
      const stocks = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA']
      mockUseGrid.mockReturnValue(makeGridState(stocks))
      render(<StockGrid />, { wrapper: createWrapper() })

      const articles = screen.getAllByRole('article')
      expect(articles).toHaveLength(5)
    })

    it('renders 10 cards for a full default 5x2 grid', () => {
      const stocks = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'JPM', 'V', 'JNJ']
      mockUseGrid.mockReturnValue(makeGridState(stocks))
      render(<StockGrid />, { wrapper: createWrapper() })

      const articles = screen.getAllByRole('article')
      expect(articles).toHaveLength(10)
    })

    it('does not show the empty placeholder when stocks are present', () => {
      mockUseGrid.mockReturnValue(makeGridState(['AAPL']))
      render(<StockGrid />, { wrapper: createWrapper() })

      expect(screen.queryByText(/Drag a stock from the panel/i)).not.toBeInTheDocument()
    })

    it('renders the correct symbol text inside each card', () => {
      mockUseGrid.mockReturnValue(makeGridState(['AAPL', 'MSFT']))
      render(<StockGrid />, { wrapper: createWrapper() })

      expect(screen.getByText('AAPL')).toBeInTheDocument()
      expect(screen.getByText('MSFT')).toBeInTheDocument()
    })

    it('renders grid cells with correct test ids for each stock', () => {
      const stocks = ['TSLA', 'META', 'JPM']
      mockUseGrid.mockReturnValue(makeGridState(stocks))
      render(<StockGrid />, { wrapper: createWrapper() })

      stocks.forEach((sym) => {
        expect(screen.getByTestId(`grid-cell-${sym}`)).toBeInTheDocument()
      })
    })
  })
})
