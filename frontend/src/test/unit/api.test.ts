import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fetchStockList, fetchStockHistory, fetchBatchHistory } from '../../lib/api'

// We need to mock global fetch
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

function makeResponse(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    statusText: ok ? 'OK' : 'Not Found',
    json: () => Promise.resolve(body),
  } as unknown as Response
}

beforeEach(() => {
  mockFetch.mockReset()
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('fetchStockList', () => {
  it('calls GET /api/stocks', async () => {
    const payload = { stocks: [{ symbol: 'AAPL', name: 'Apple Inc', sector: 'Technology' }] }
    mockFetch.mockResolvedValueOnce(makeResponse(payload))

    const result = await fetchStockList()

    expect(mockFetch).toHaveBeenCalledOnce()
    const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit | undefined]
    expect(url).toBe('/api/stocks')
    expect(options).toBeUndefined()
  })

  it('returns the parsed stock list response', async () => {
    const payload = {
      stocks: [
        { symbol: 'AAPL', name: 'Apple Inc', sector: 'Technology' },
        { symbol: 'MSFT', name: 'Microsoft', sector: 'Technology' },
      ],
    }
    mockFetch.mockResolvedValueOnce(makeResponse(payload))

    const result = await fetchStockList()
    expect(result).toEqual(payload)
  })

  it('throws an error when response is not ok', async () => {
    const errorBody = { error: { message: 'Server error' } }
    mockFetch.mockResolvedValueOnce(makeResponse(errorBody, false, 500))

    await expect(fetchStockList()).rejects.toThrow('Server error')
  })

  it('falls back to statusText when error body has no message', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse({}, false, 503))

    await expect(fetchStockList()).rejects.toThrow()
  })
})

describe('fetchStockHistory', () => {
  it('calls GET /api/stocks/{symbol}/history with correct URL', async () => {
    const payload = { symbol: 'AAPL', name: 'Apple Inc', data: [], mock: true }
    mockFetch.mockResolvedValueOnce(makeResponse(payload))

    await fetchStockHistory('AAPL')

    const [url] = mockFetch.mock.calls[0] as [string, RequestInit | undefined]
    expect(url).toBe('/api/stocks/AAPL/history')
  })

  it('encodes the symbol in the URL', async () => {
    const payload = { symbol: 'BRK.B', name: 'Berkshire', data: [], mock: true }
    mockFetch.mockResolvedValueOnce(makeResponse(payload))

    await fetchStockHistory('BRK.B')

    const [url] = mockFetch.mock.calls[0] as [string, RequestInit | undefined]
    expect(url).toBe('/api/stocks/BRK.B/history')
  })

  it('returns parsed StockHistory on success', async () => {
    const payload = {
      symbol: 'MSFT',
      name: 'Microsoft',
      data: [{ date: '2024-01-01', close: 400.0 }],
      mock: false,
    }
    mockFetch.mockResolvedValueOnce(makeResponse(payload))

    const result = await fetchStockHistory('MSFT')
    expect(result).toEqual(payload)
  })

  it('throws an error with the backend message on 404', async () => {
    const errorBody = { error: { message: 'No data found for symbol: UNKNOWN' } }
    mockFetch.mockResolvedValueOnce(makeResponse(errorBody, false, 404))

    await expect(fetchStockHistory('UNKNOWN')).rejects.toThrow('No data found for symbol: UNKNOWN')
  })
})

describe('fetchBatchHistory', () => {
  it('calls POST /api/stocks/batch-history', async () => {
    const payload = { results: {} }
    mockFetch.mockResolvedValueOnce(makeResponse(payload))

    await fetchBatchHistory(['AAPL', 'MSFT'])

    const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('/api/stocks/batch-history')
    expect(options.method).toBe('POST')
  })

  it('sends symbols in the request body as JSON', async () => {
    const payload = { results: {} }
    mockFetch.mockResolvedValueOnce(makeResponse(payload))

    await fetchBatchHistory(['AAPL', 'MSFT', 'GOOGL'])

    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect(options.headers).toMatchObject({ 'Content-Type': 'application/json' })
    expect(JSON.parse(options.body as string)).toEqual({ symbols: ['AAPL', 'MSFT', 'GOOGL'] })
  })

  it('returns the batch history response on success', async () => {
    const payload = {
      results: {
        AAPL: { symbol: 'AAPL', name: 'Apple Inc', data: [], mock: true },
      },
    }
    mockFetch.mockResolvedValueOnce(makeResponse(payload))

    const result = await fetchBatchHistory(['AAPL'])
    expect(result).toEqual(payload)
  })

  it('throws on non-ok response', async () => {
    const errorBody = { error: { message: 'Maximum 10 symbols per batch request' } }
    mockFetch.mockResolvedValueOnce(makeResponse(errorBody, false, 422))

    await expect(fetchBatchHistory(Array.from({ length: 11 }, (_, i) => `STOCK${i}`))).rejects.toThrow(
      'Maximum 10 symbols per batch request'
    )
  })
})
