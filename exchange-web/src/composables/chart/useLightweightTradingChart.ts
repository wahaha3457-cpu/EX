import { onUnmounted, watch, type Ref } from 'vue'
import {
  createChart,
  type CandlestickData,
  type HistogramData,
  type IChartApi,
  type ISeriesApi,
  type Time,
  type UTCTimestamp,
} from 'lightweight-charts'
import type { ChartCrosshairPayload, KlineBar } from '@/types/chartKline'
import {
  createTradingChartOptions,
  readCandleColors,
} from '@/components/trading/chart/lightweightChartTheme'
import { useThemeStore } from '@/stores/theme'

function toCandle(b: KlineBar): CandlestickData {
  return {
    time: b.time as UTCTimestamp,
    open: b.open,
    high: b.high,
    low: b.low,
    close: b.close,
  }
}

function toVolume(b: KlineBar): HistogramData {
  const { up, down, upVol, downVol } = readCandleColors()
  const isUp = b.close >= b.open
  return {
    time: b.time as UTCTimestamp,
    value: b.volume,
    color: isUp ? upVol : downVol,
  }
}

/**
 * Lightweight Charts 实例：与 Vue 生命周期解耦，由调用方在合适的宿主 ref 上 mount/dispose。
 */
export function useLightweightTradingChart(
  hostRef: Ref<HTMLElement | null>,
  options: {
    showVolume: Ref<boolean>
    onCrosshair: (p: ChartCrosshairPayload) => void
  },
) {
  const themeStore = useThemeStore()

  let chart: IChartApi | null = null
  let candle: ISeriesApi<'Candlestick'> | null = null
  let volume: ISeriesApi<'Histogram'> | null = null
  let ro: ResizeObserver | null = null
  let lastBars: KlineBar[] = []
  let lastAppliedW = 0
  let lastAppliedH = 0
  let resizeRaf = 0

  function applyChartThemeFromTokens() {
    if (!chart || !candle || !volume) return
    chart.applyOptions(createTradingChartOptions())
    const c = readCandleColors()
    candle.applyOptions({
      upColor: c.up,
      downColor: c.down,
      wickUpColor: c.up,
      wickDownColor: c.down,
      borderVisible: false,
    })
    volume.setData(lastBars.map(toVolume))
  }

  function dispose() {
    if (resizeRaf) {
      cancelAnimationFrame(resizeRaf)
      resizeRaf = 0
    }
    ro?.disconnect()
    ro = null
    chart?.remove()
    chart = null
    candle = null
    volume = null
    lastBars = []
    lastAppliedW = 0
    lastAppliedH = 0
  }

  function fit() {
    const el = hostRef.value
    if (!chart || !el) return
    const w = el.clientWidth
    const h = el.clientHeight
    if (w <= 0 || h <= 0) return
    if (w === lastAppliedW && h === lastAppliedH) return
    lastAppliedW = w
    lastAppliedH = h
    chart.applyOptions({ width: w, height: h })
    chart.timeScale().fitContent()
  }

  function scheduleFit() {
    if (resizeRaf) cancelAnimationFrame(resizeRaf)
    resizeRaf = requestAnimationFrame(() => {
      resizeRaf = 0
      fit()
    })
  }

  function mount() {
    const el = hostRef.value
    if (!el || chart) return
    const w = el.clientWidth || el.parentElement?.clientWidth || 600
    const h = el.clientHeight || 380
    chart = createChart(el, {
      ...createTradingChartOptions(),
      width: w,
      height: h,
    })
    const c = readCandleColors()
    candle = chart.addCandlestickSeries({
      upColor: c.up,
      downColor: c.down,
      borderVisible: false,
      wickUpColor: c.up,
      wickDownColor: c.down,
    })
    volume = chart.addHistogramSeries({
      priceFormat: { type: 'volume' },
      priceScaleId: '',
      color: c.upVol,
    })
    chart.priceScale('').applyOptions({
      scaleMargins: { top: 0.78, bottom: 0 },
    })
    candle.priceScale().applyOptions({
      scaleMargins: { top: 0.02, bottom: 0.2 },
    })

    chart.subscribeCrosshairMove((param) => {
      if (!candle) return
      const t = param.time
      if (t === undefined || t === null) {
        options.onCrosshair({
          time: null,
          open: null,
          high: null,
          low: null,
          close: null,
          volume: null,
        })
        return
      }
      const data = param.seriesData.get(candle) as CandlestickData<Time> | undefined
      const vData = volume ? (param.seriesData.get(volume) as HistogramData<Time> | undefined) : undefined
      options.onCrosshair({
        time: typeof t === 'number' ? t : null,
        open: data?.open ?? null,
        high: data?.high ?? null,
        low: data?.low ?? null,
        close: data?.close ?? null,
        volume: vData?.value ?? null,
      })
    })

    lastAppliedW = 0
    lastAppliedH = 0
    ro = new ResizeObserver(() => scheduleFit())
    ro.observe(el)
  }

  function setBars(bars: readonly KlineBar[]) {
    lastBars = bars.slice()
    if (!candle || !volume) return
    candle.setData(bars.map(toCandle))
    volume.setData(bars.map(toVolume))
    chart?.timeScale().fitContent()
  }

  function applyRealtimeBar(bar: KlineBar) {
    if (!candle || !volume) return
    const idx = lastBars.findIndex((b) => b.time === bar.time)
    if (idx >= 0) lastBars[idx] = bar
    else lastBars.push(bar)
    candle.update(toCandle(bar))
    volume.update(toVolume(bar))
  }

  watch(
    () => options.showVolume.value,
    (v) => {
      volume?.applyOptions({ visible: v })
    },
    { immediate: true },
  )

  watch(
    () => themeStore.theme,
    () => applyChartThemeFromTokens(),
  )

  onUnmounted(dispose)

  return {
    mount,
    dispose,
    fit,
    setBars,
    applyRealtimeBar,
  }
}
