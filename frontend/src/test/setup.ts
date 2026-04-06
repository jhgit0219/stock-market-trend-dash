import '@testing-library/jest-dom'

// Mock lightweight-charts since it requires a real canvas/DOM environment
vi.mock('lightweight-charts', () => ({
  createChart: vi.fn(() => ({
    addAreaSeries: vi.fn(() => ({
      setData: vi.fn(),
      applyOptions: vi.fn(),
    })),
    applyOptions: vi.fn(),
    timeScale: vi.fn(() => ({
      fitContent: vi.fn(),
    })),
    resize: vi.fn(),
    remove: vi.fn(),
  })),
  ColorType: { Solid: 'solid', VerticalGradient: 'verticalGradient' },
  CrosshairMode: { Normal: 1 },
  LineStyle: { Solid: 0 },
  PriceScaleMode: { Normal: 0 },
}))

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn()
mockIntersectionObserver.mockReturnValue({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
})
vi.stubGlobal('IntersectionObserver', mockIntersectionObserver)

// Mock ResizeObserver
const mockResizeObserver = vi.fn()
mockResizeObserver.mockReturnValue({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
})
vi.stubGlobal('ResizeObserver', mockResizeObserver)
