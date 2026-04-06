import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StockCard } from '../../components/features/StockCard/StockCard'
import * as useStocksModule from '../../hooks/useStocks'

// Mock CSS modules
vi.mock('../../components/features/StockCard/StockCard.module.css', () => ({ default: {} }))
vi.mock('../../components/features/StockCard/StockChart.module.css', () => ({ default: {} }))

vi.mock('../../hooks/useStocks')

const mockUseStockHistory = vi.mocked(useStocksModule.useStockHistory)

function mockHistory(symbol: string, startClose = 100, endClose = 200) {
  return {
    symbol,
    name: `${symbol} Corp`,
    data: [
      { date: '2015-01-01', close: startClose },
      { date: '2024-12-01', close: endClose },
    ],
    mock: false,
  }
}

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return React.createElement(QueryClientProvider, { client: qc }, children)
}

describe('StockCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('loading state', () => {
    it('renders skeleton with accessible loading label when isLoading is true', () => {
      mockUseStockHistory.mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        refetch: vi.fn(),
      } as ReturnType<typeof useStocksModule.useStockHistory>)

      render(<StockCard symbol="AAPL" onRemove={vi.fn()} />, { wrapper })

      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading AAPL data')
    })
  })

  describe('success state', () => {
    beforeEach(() => {
      mockUseStockHistory.mockReturnValue({
        data: mockHistory('AAPL', 100, 200),
        isLoading: false,
        isError: false,
        refetch: vi.fn(),
      } as ReturnType<typeof useStocksModule.useStockHistory>)
    })

    it('renders the stock symbol', () => {
      render(<StockCard symbol="AAPL" onRemove={vi.fn()} />, { wrapper })
      expect(screen.getByText('AAPL')).toBeInTheDocument()
    })

    it('renders the company name', () => {
      render(<StockCard symbol="AAPL" onRemove={vi.fn()} />, { wrapper })
      expect(screen.getByText('AAPL Corp')).toBeInTheDocument()
    })

    it('renders a positive percentage change badge', () => {
      // 100 -> 200 = +100.0%
      render(<StockCard symbol="AAPL" onRemove={vi.fn()} />, { wrapper })
      expect(screen.getByText('+100.0%')).toBeInTheDocument()
    })

    it('renders a negative percentage change badge', () => {
      mockUseStockHistory.mockReturnValue({
        data: mockHistory('TSLA', 200, 100),
        isLoading: false,
        isError: false,
        refetch: vi.fn(),
      } as ReturnType<typeof useStocksModule.useStockHistory>)

      render(<StockCard symbol="TSLA" onRemove={vi.fn()} />, { wrapper })
      expect(screen.getByText('-50.0%')).toBeInTheDocument()
    })

    it('renders the close button', () => {
      render(<StockCard symbol="AAPL" onRemove={vi.fn()} />, { wrapper })
      expect(screen.getByRole('button', { name: /Remove AAPL from grid/i })).toBeInTheDocument()
    })

    it('calls onRemove when close button is clicked', () => {
      const onRemove = vi.fn()
      render(<StockCard symbol="AAPL" onRemove={onRemove} />, { wrapper })

      fireEvent.click(screen.getByRole('button', { name: /Remove AAPL from grid/i }))
      expect(onRemove).toHaveBeenCalledOnce()
    })

    it('renders the card with correct article role', () => {
      render(<StockCard symbol="AAPL" onRemove={vi.fn()} />, { wrapper })
      expect(screen.getByRole('article')).toHaveAttribute('aria-label', 'AAPL stock card')
    })

    it('shows sample data badge when mock is true', () => {
      mockUseStockHistory.mockReturnValue({
        data: { ...mockHistory('AAPL'), mock: true },
        isLoading: false,
        isError: false,
        refetch: vi.fn(),
      } as ReturnType<typeof useStocksModule.useStockHistory>)

      render(<StockCard symbol="AAPL" onRemove={vi.fn()} />, { wrapper })
      expect(screen.getByText('sample')).toBeInTheDocument()
    })

    it('does not show sample badge when mock is false', () => {
      render(<StockCard symbol="AAPL" onRemove={vi.fn()} />, { wrapper })
      expect(screen.queryByText('sample')).not.toBeInTheDocument()
    })
  })

  describe('error state', () => {
    it('renders error message when isError is true', () => {
      mockUseStockHistory.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        refetch: vi.fn(),
      } as ReturnType<typeof useStocksModule.useStockHistory>)

      render(<StockCard symbol="AAPL" onRemove={vi.fn()} />, { wrapper })

      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText('Unable to load data for AAPL')).toBeInTheDocument()
    })

    it('renders a retry button in error state', () => {
      mockUseStockHistory.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        refetch: vi.fn(),
      } as ReturnType<typeof useStocksModule.useStockHistory>)

      render(<StockCard symbol="AAPL" onRemove={vi.fn()} />, { wrapper })

      expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument()
    })

    it('still shows the close button in error state', () => {
      mockUseStockHistory.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        refetch: vi.fn(),
      } as ReturnType<typeof useStocksModule.useStockHistory>)

      render(<StockCard symbol="AAPL" onRemove={vi.fn()} />, { wrapper })

      expect(screen.getByRole('button', { name: /Remove AAPL from grid/i })).toBeInTheDocument()
    })
  })
})
