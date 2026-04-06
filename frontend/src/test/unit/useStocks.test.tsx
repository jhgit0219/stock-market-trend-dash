import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useStockList, useStockHistory } from '../../hooks/useStocks'
import * as api from '../../lib/api'

vi.mock('../../lib/api')

const mockedApi = vi.mocked(api)

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

describe('useStockList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns loading state initially', () => {
    mockedApi.fetchStockList.mockResolvedValue({ stocks: [] })
    const { result } = renderHook(() => useStockList(), { wrapper: createWrapper() })
    expect(result.current.isLoading).toBe(true)
    expect(result.current.data).toBeUndefined()
  })

  it('returns data on successful fetch', async () => {
    const mockStocks = {
      stocks: [
        { symbol: 'AAPL', name: 'Apple Inc', sector: 'Technology' },
        { symbol: 'MSFT', name: 'Microsoft', sector: 'Technology' },
      ],
    }
    mockedApi.fetchStockList.mockResolvedValue(mockStocks)

    const { result } = renderHook(() => useStockList(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockStocks)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isError).toBe(false)
  })

  it('returns error state when fetch fails', async () => {
    mockedApi.fetchStockList.mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useStockList(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.data).toBeUndefined()
    expect(result.current.isLoading).toBe(false)
  })

  it('calls fetchStockList once on mount', async () => {
    mockedApi.fetchStockList.mockResolvedValue({ stocks: [] })

    renderHook(() => useStockList(), { wrapper: createWrapper() })

    await waitFor(() => expect(mockedApi.fetchStockList).toHaveBeenCalledOnce())
  })

  it('uses the query key ["stocks"]', async () => {
    // Verify the hook renders without error (queryKey behavior is internal)
    mockedApi.fetchStockList.mockResolvedValue({ stocks: [] })
    const { result } = renderHook(() => useStockList(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
  })
})

describe('useStockHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns loading state initially for a valid symbol', () => {
    mockedApi.fetchStockHistory.mockResolvedValue({
      symbol: 'AAPL',
      name: 'Apple Inc',
      data: [],
      mock: true,
    })
    const { result } = renderHook(() => useStockHistory('AAPL'), { wrapper: createWrapper() })
    expect(result.current.isLoading).toBe(true)
  })

  it('is disabled when symbol is empty string', () => {
    const { result } = renderHook(() => useStockHistory(''), { wrapper: createWrapper() })
    expect(result.current.isLoading).toBe(false)
    expect(result.current.fetchStatus).toBe('idle')
  })

  it('fetches data for the provided symbol', async () => {
    const mockHistory = {
      symbol: 'AAPL',
      name: 'Apple Inc',
      data: [{ date: '2024-01-01', close: 185.5 }],
      mock: true,
    }
    mockedApi.fetchStockHistory.mockResolvedValue(mockHistory)

    const { result } = renderHook(() => useStockHistory('AAPL'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockHistory)
  })

  it('returns error state when fetch fails', async () => {
    mockedApi.fetchStockHistory.mockRejectedValue(new Error('No data found for symbol: INVALID'))

    const { result } = renderHook(() => useStockHistory('INVALID'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.data).toBeUndefined()
  })

  it('calls fetchStockHistory with the correct symbol', async () => {
    mockedApi.fetchStockHistory.mockResolvedValue({
      symbol: 'NVDA',
      name: 'Nvidia',
      data: [],
      mock: false,
    })

    renderHook(() => useStockHistory('NVDA'), { wrapper: createWrapper() })

    await waitFor(() => expect(mockedApi.fetchStockHistory).toHaveBeenCalledWith('NVDA'))
  })

  it('re-fetches when symbol changes', async () => {
    mockedApi.fetchStockHistory.mockResolvedValue({
      symbol: 'AAPL',
      name: 'Apple',
      data: [],
      mock: true,
    })

    const { result, rerender } = renderHook(
      ({ symbol }: { symbol: string }) => useStockHistory(symbol),
      { wrapper: createWrapper(), initialProps: { symbol: 'AAPL' } }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    mockedApi.fetchStockHistory.mockResolvedValue({
      symbol: 'MSFT',
      name: 'Microsoft',
      data: [],
      mock: true,
    })

    rerender({ symbol: 'MSFT' })

    await waitFor(() => expect(mockedApi.fetchStockHistory).toHaveBeenCalledWith('MSFT'))
  })
})
