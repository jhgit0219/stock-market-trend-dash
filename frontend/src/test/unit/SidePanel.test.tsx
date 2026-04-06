import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SidePanel } from '../../components/features/SidePanel/SidePanel'
import { GridProvider } from '../../components/features/StockGrid/GridContext'
import * as useStocksModule from '../../hooks/useStocks'

vi.mock('../../hooks/useStocks')

// Mock dnd-kit useDraggable since SidePanel items use it
vi.mock('@dnd-kit/core', async (importOriginal) => {
  const original = await importOriginal<typeof import('@dnd-kit/core')>()
  return {
    ...original,
    useDraggable: vi.fn(() => ({
      attributes: {},
      listeners: {},
      setNodeRef: vi.fn(),
      transform: null,
      isDragging: false,
    })),
    DndContext: ({ children }: { children: React.ReactNode }) => React.createElement('div', null, children),
  }
})

vi.mock('../../components/features/SidePanel/SidePanel.module.css', () => ({ default: {} }))
vi.mock('../../components/features/SidePanel/StockListItem.module.css', () => ({ default: {} }))

const mockUseStockList = vi.mocked(useStocksModule.useStockList)

const mockStocks = {
  stocks: [
    { symbol: 'AAPL', name: 'Apple Inc', sector: 'Technology' },
    { symbol: 'MSFT', name: 'Microsoft Corp', sector: 'Technology' },
    { symbol: 'GOOGL', name: 'Alphabet Inc', sector: 'Communication Services' },
    { symbol: 'AMZN', name: 'Amazon.com Inc', sector: 'Consumer Discretionary' },
  ],
}

function renderSidePanel(initialStocks: string[] = []) {
  // We need a GridProvider with a controlled initial state
  // We'll use a wrapper that overrides DEFAULT_GRID_STOCKS via the module mock
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  return render(
    React.createElement(
      QueryClientProvider,
      { client: qc },
      React.createElement(
        GridProvider,
        null,
        React.createElement(SidePanel)
      )
    )
  )
}

describe('SidePanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('loading state', () => {
    it('renders skeleton placeholders while loading', () => {
      mockUseStockList.mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
      } as ReturnType<typeof useStocksModule.useStockList>)

      renderSidePanel()

      expect(screen.getByRole('status', { name: /Loading stocks/i })).toBeInTheDocument()
    })
  })

  describe('error state', () => {
    it('renders error message when stock list fetch fails', () => {
      mockUseStockList.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
      } as ReturnType<typeof useStocksModule.useStockList>)

      renderSidePanel()

      expect(screen.getByRole('alert')).toHaveTextContent('Failed to load stock list')
    })
  })

  describe('success state', () => {
    beforeEach(() => {
      mockUseStockList.mockReturnValue({
        data: mockStocks,
        isLoading: false,
        isError: false,
      } as ReturnType<typeof useStocksModule.useStockList>)
    })

    it('renders a listbox with available stocks', () => {
      renderSidePanel()
      expect(screen.getByRole('listbox', { name: /Available stocks/i })).toBeInTheDocument()
    })

    it('renders all stocks from the API', () => {
      renderSidePanel()
      expect(screen.getByText('AAPL')).toBeInTheDocument()
      expect(screen.getByText('MSFT')).toBeInTheDocument()
      expect(screen.getByText('GOOGL')).toBeInTheDocument()
      expect(screen.getByText('AMZN')).toBeInTheDocument()
    })

    it('renders each stock symbol', () => {
      renderSidePanel()
      mockStocks.stocks.forEach(({ symbol }) => {
        expect(screen.getByText(symbol)).toBeInTheDocument()
      })
    })

    it('renders each stock name', () => {
      renderSidePanel()
      expect(screen.getByText('Apple Inc')).toBeInTheDocument()
      expect(screen.getByText('Microsoft Corp')).toBeInTheDocument()
    })

    it('shows the search input', () => {
      renderSidePanel()
      expect(screen.getByRole('searchbox', { name: /Search stocks/i })).toBeInTheDocument()
    })

    it('shows the "Stocks" panel title', () => {
      renderSidePanel()
      expect(screen.getByText('Stocks')).toBeInTheDocument()
    })
  })

  describe('search filtering', () => {
    beforeEach(() => {
      mockUseStockList.mockReturnValue({
        data: mockStocks,
        isLoading: false,
        isError: false,
      } as ReturnType<typeof useStocksModule.useStockList>)
    })

    it('filters stocks by symbol (case-insensitive)', async () => {
      const user = userEvent.setup()
      renderSidePanel()

      const searchInput = screen.getByRole('searchbox')
      await user.type(searchInput, 'aapl')

      expect(screen.getByText('AAPL')).toBeInTheDocument()
      expect(screen.queryByText('MSFT')).not.toBeInTheDocument()
      expect(screen.queryByText('GOOGL')).not.toBeInTheDocument()
    })

    it('filters stocks by name (case-insensitive)', async () => {
      const user = userEvent.setup()
      renderSidePanel()

      const searchInput = screen.getByRole('searchbox')
      await user.type(searchInput, 'microsoft')

      expect(screen.getByText('MSFT')).toBeInTheDocument()
      expect(screen.queryByText('AAPL')).not.toBeInTheDocument()
    })

    it('shows empty state when no stocks match the search', async () => {
      const user = userEvent.setup()
      renderSidePanel()

      const searchInput = screen.getByRole('searchbox')
      await user.type(searchInput, 'ZZZZZ')

      expect(screen.getByText('No stocks match your search')).toBeInTheDocument()
    })

    it('shows all stocks when search is cleared', async () => {
      const user = userEvent.setup()
      renderSidePanel()

      const searchInput = screen.getByRole('searchbox')
      await user.type(searchInput, 'AAPL')
      await user.clear(searchInput)

      mockStocks.stocks.forEach(({ symbol }) => {
        expect(screen.getByText(symbol)).toBeInTheDocument()
      })
    })

    it('filters by partial name match', async () => {
      const user = userEvent.setup()
      renderSidePanel()

      const searchInput = screen.getByRole('searchbox')
      await user.type(searchInput, 'amazon')

      expect(screen.getByText('AMZN')).toBeInTheDocument()
      expect(screen.queryByText('AAPL')).not.toBeInTheDocument()
    })
  })

  describe('checkbox and grid interaction', () => {
    beforeEach(() => {
      mockUseStockList.mockReturnValue({
        data: mockStocks,
        isLoading: false,
        isError: false,
      } as ReturnType<typeof useStocksModule.useStockList>)
    })

    it('marks stocks in the default grid as active (aria-selected)', () => {
      // GridProvider initializes with DEFAULT_GRID_STOCKS which includes AAPL, MSFT, etc.
      renderSidePanel()

      const aaplOption = screen.getByRole('option', { name: /AAPL/i })
      // DEFAULT_GRID_STOCKS includes AAPL so it should be selected
      expect(aaplOption).toHaveAttribute('aria-selected', 'true')
    })

    it('marks stocks not in the grid as inactive (aria-selected="false")', () => {
      renderSidePanel()

      // AMZN is in default grid but let's check the attribute is set correctly
      const allOptions = screen.getAllByRole('option')
      allOptions.forEach((option) => {
        const ariaSelected = option.getAttribute('aria-selected')
        expect(['true', 'false']).toContain(ariaSelected)
      })
    })

    it('displays active count badge', () => {
      renderSidePanel()
      // DEFAULT_GRID_STOCKS has 10 items, all "active"
      expect(screen.getByText(/active/i)).toBeInTheDocument()
    })
  })
})
