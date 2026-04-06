import { useEffect, useRef, useCallback } from 'react'
import { createChart, ColorType, LineStyle } from 'lightweight-charts'
import type { IChartApi, ISeriesApi, AreaData, Time } from 'lightweight-charts'
import type { StockHistory } from '../../../lib/types'
import styles from './StockChart.module.css'

interface StockChartProps {
  history: StockHistory
  visible?: boolean
}

function computeStats(history: StockHistory) {
  if (history.data.length === 0) return null
  const prices = history.data.map((d) => d.close)
  const start = prices[0]
  const end = prices[prices.length - 1]
  const high = Math.max(...prices)
  const low = Math.min(...prices)
  const pctChange = ((end - start) / start) * 100
  return { start, end, high, low, pctChange }
}

export function StockChart({ history, visible = true }: StockChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Area'> | null>(null)

  const mountChart = useCallback(() => {
    if (!containerRef.current || chartRef.current) return

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#8888a0',
      },
      grid: {
        vertLines: { color: '#1e1e2e', style: LineStyle.Dotted },
        horzLines: { color: '#1e1e2e', style: LineStyle.Dotted },
      },
      crosshair: {
        vertLine: { color: '#6366f1', width: 1, style: LineStyle.Dashed },
        horzLine: { color: '#6366f1', width: 1, style: LineStyle.Dashed },
      },
      rightPriceScale: {
        borderColor: '#1e1e2e',
        textColor: '#8888a0',
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        borderColor: '#1e1e2e',
        timeVisible: true,
        secondsVisible: false,
        fixLeftEdge: true,
        fixRightEdge: true,
      },
      handleScroll: false,
      handleScale: false,
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
    })

    const areaSeries = chart.addAreaSeries({
      lineColor: '#6366f1',
      topColor: 'rgba(99, 102, 241, 0.3)',
      bottomColor: 'rgba(99, 102, 241, 0.02)',
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 4,
      crosshairMarkerBorderColor: '#6366f1',
      crosshairMarkerBackgroundColor: '#13131a',
    })

    const chartData: AreaData<Time>[] = history.data.map((d) => ({
      time: d.date as Time,
      value: d.close,
    }))

    areaSeries.setData(chartData)
    chart.timeScale().fitContent()

    chartRef.current = chart
    seriesRef.current = areaSeries

    // Responsive resize
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry && chartRef.current) {
        chartRef.current.resize(entry.contentRect.width, entry.contentRect.height)
      }
    })

    observer.observe(containerRef.current)

    // Store observer for cleanup
    ;(containerRef.current as HTMLDivElement & { _resizeObserver?: ResizeObserver })._resizeObserver =
      observer
  }, [history])

  const destroyChart = useCallback(() => {
    if (!containerRef.current) return
    const el = containerRef.current as HTMLDivElement & { _resizeObserver?: ResizeObserver }
    el._resizeObserver?.disconnect()
    chartRef.current?.remove()
    chartRef.current = null
    seriesRef.current = null
  }, [])

  useEffect(() => {
    if (visible) {
      mountChart()
    } else {
      destroyChart()
    }

    return () => {
      destroyChart()
    }
  }, [visible, mountChart, destroyChart])

  // Update data when history changes without remounting
  useEffect(() => {
    if (!seriesRef.current) return
    const chartData: AreaData<Time>[] = history.data.map((d) => ({
      time: d.date as Time,
      value: d.close,
    }))
    seriesRef.current.setData(chartData)
    chartRef.current?.timeScale().fitContent()
  }, [history])

  const stats = computeStats(history)

  return (
    <div className={styles.wrapper}>
      <div ref={containerRef} className={styles.canvas} aria-hidden="true" />
      {stats && (
        <table className={styles.srTable} aria-label={`${history.symbol} price history summary`}>
          <thead>
            <tr>
              <th>Metric</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Start Price</td>
              <td>${stats.start.toFixed(2)}</td>
            </tr>
            <tr>
              <td>End Price</td>
              <td>${stats.end.toFixed(2)}</td>
            </tr>
            <tr>
              <td>10-Year High</td>
              <td>${stats.high.toFixed(2)}</td>
            </tr>
            <tr>
              <td>10-Year Low</td>
              <td>${stats.low.toFixed(2)}</td>
            </tr>
            <tr>
              <td>% Change</td>
              <td>{stats.pctChange >= 0 ? '+' : ''}{stats.pctChange.toFixed(2)}%</td>
            </tr>
          </tbody>
        </table>
      )}
    </div>
  )
}
