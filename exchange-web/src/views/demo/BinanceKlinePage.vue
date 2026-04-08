<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, shallowRef, watch } from 'vue'
import {
  ColorType,
  createChart,
  type CandlestickData,
  type HistogramData,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from 'lightweight-charts'
import type { BinanceKlineInterval, ParsedKlineBar } from '@/api/binance/binancePublic'
import { fetchKlinesWithRetry } from '@/api/binance/binancePublic'
import { useBinanceKlineSocket } from '@/composables/useBinanceKlineSocket'

const MAX_BARS = 500

const symbol = ref('BTCUSDT')
const interval = ref<BinanceKlineInterval>('1m')
const limit = ref(500)

const symbolOptions = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT'] as const
const intervalOptions: { value: BinanceKlineInterval; label: string }[] = [
  { value: '1m', label: '1 分钟' },
  { value: '5m', label: '5 分钟' },
  { value: '1h', label: '1 小时' },
  { value: '1d', label: '1 天' },
]
const limitOptions = [100, 200, 500]

const loading = ref(false)
const restError = ref<string | null>(null)
const latestPrice = ref<string>('—')

const chartContainer = ref<HTMLElement | null>(null)
const chartApi = shallowRef<IChartApi | null>(null)
const candleSeries = shallowRef<ISeriesApi<'Candlestick'> | null>(null)
const volumeSeries = shallowRef<ISeriesApi<'Histogram'> | null>(null)

const bars = ref<ParsedKlineBar[]>([])

const ws = useBinanceKlineSocket()

const statusText = computed(() => {
  if (restError.value) return '异常'
  if (ws.connected.value) return '实时已连接'
  return '实时重连中…'
})

function trimBars(list: ParsedKlineBar[]): ParsedKlineBar[] {
  if (list.length <= MAX_BARS) return list
  return list.slice(list.length - MAX_BARS)
}

function toCandleData(list: ParsedKlineBar[]): CandlestickData[] {
  return list.map((b) => ({
    time: b.time as UTCTimestamp,
    open: b.open,
    high: b.high,
    low: b.low,
    close: b.close,
  }))
}

function toVolumeData(list: ParsedKlineBar[]): HistogramData[] {
  return list.map((b) => ({
    time: b.time as UTCTimestamp,
    value: b.volume,
    color:
      b.close >= b.open ? 'rgba(38, 166, 154, 0.45)' : 'rgba(239, 83, 80, 0.45)',
  }))
}

function applyTheme() {
  const isDark =
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  const bg = isDark ? '#131722' : '#ffffff'
  const text = isDark ? '#d1d4dc' : '#131722'
  const grid = isDark ? '#2a2e39' : '#e0e3eb'
  chartApi.value?.applyOptions({
    layout: {
      background: { type: ColorType.Solid, color: bg },
      textColor: text,
    },
    grid: {
      vertLines: { color: grid },
      horzLines: { color: grid },
    },
  })
}

let resizeObs: ResizeObserver | null = null

async function loadHistory() {
  restError.value = null
  loading.value = true
  try {
    const data = await fetchKlinesWithRetry({
      symbol: symbol.value,
      interval: interval.value,
      limit: limit.value,
    })
    bars.value = trimBars(data)
    const last = bars.value[bars.value.length - 1]
    if (last) {
      latestPrice.value = formatPrice(last.close)
    }
    if (candleSeries.value && volumeSeries.value) {
      candleSeries.value.setData(toCandleData(bars.value))
      volumeSeries.value.setData(toVolumeData(bars.value))
      chartApi.value?.timeScale().fitContent()
    }
  } catch (e) {
    restError.value = '行情获取异常，请刷新页面'
    console.error('[BinanceKline]', e)
  } finally {
    loading.value = false
  }
}

function formatPrice(n: number) {
  if (n >= 1000) return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  if (n >= 1) return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })
  return n.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 8 })
}

function mergeKlineFromWs(openTimeMs: number, o: number, h: number, l: number, c: number, v: number) {
  if (!candleSeries.value || !volumeSeries.value) return

  const timeSec = Math.floor(openTimeMs / 1000)
  const next: ParsedKlineBar = {
    timestamp: openTimeMs,
    time: timeSec,
    open: o,
    high: h,
    low: l,
    close: c,
    volume: v,
  }

  let list = [...bars.value]
  const last = list[list.length - 1]

  if (last && last.timestamp === openTimeMs) {
    list[list.length - 1] = next
  } else if (!last || openTimeMs > last.timestamp) {
    list.push(next)
  } else {
    const idx = list.findIndex((b) => b.timestamp === openTimeMs)
    if (idx >= 0) list[idx] = next
    else return
  }

  const needFullSet = list.length > MAX_BARS
  list = trimBars(list)
  bars.value = list
  latestPrice.value = formatPrice(c)

  const t = timeSec as UTCTimestamp
  const volColor = c >= o ? 'rgba(38, 166, 154, 0.45)' : 'rgba(239, 83, 80, 0.45)'

  if (needFullSet) {
    candleSeries.value?.setData(toCandleData(list))
    volumeSeries.value?.setData(toVolumeData(list))
  } else {
    candleSeries.value?.update({ time: t, open: o, high: h, low: l, close: c })
    volumeSeries.value?.update({ time: t, value: v, color: volColor })
  }
}

function startSocket() {
  ws.stop()
  ws.start({
    symbol: () => symbol.value,
    interval: () => interval.value,
    onKline: (p) => {
      mergeKlineFromWs(p.openTime, p.open, p.high, p.low, p.close, p.volume)
    },
    /** 逐笔成交更新最新价（组合流），本地/线上均可，与部署无关 */
    onTradePrice: (price) => {
      latestPrice.value = formatPrice(price)
    },
  })
}

function initChart() {
  const el = chartContainer.value
  if (!el) return

  const chart = createChart(el, {
    width: el.clientWidth,
    height: 520,
    layout: {
      background: { type: ColorType.Solid, color: '#131722' },
      textColor: '#d1d4dc',
    },
    grid: {
      vertLines: { color: '#2a2e39' },
      horzLines: { color: '#2a2e39' },
    },
    crosshair: { mode: 1 },
    rightPriceScale: { borderColor: '#2a2e39', scaleMargins: { top: 0.08, bottom: 0.2 } },
    timeScale: {
      borderColor: '#2a2e39',
      timeVisible: true,
      secondsVisible: false,
    },
  })

  const candle = chart.addCandlestickSeries({
    upColor: '#26a69a',
    downColor: '#ef5350',
    borderVisible: false,
    wickUpColor: '#26a69a',
    wickDownColor: '#ef5350',
  })

  const vol = chart.addHistogramSeries({
    priceFormat: { type: 'volume' },
    priceScaleId: '',
    color: '#26a69a',
  })
  chart.priceScale('').applyOptions({
    scaleMargins: { top: 0.85, bottom: 0 },
  })

  chartApi.value = chart
  candleSeries.value = candle
  volumeSeries.value = vol

  applyTheme()

  resizeObs = new ResizeObserver(() => {
    if (!chartContainer.value || !chartApi.value) return
    chartApi.value.applyOptions({ width: chartContainer.value.clientWidth })
  })
  resizeObs.observe(el)
}

function destroyChart() {
  resizeObs?.disconnect()
  resizeObs = null
  chartApi.value?.remove()
  chartApi.value = null
  candleSeries.value = null
  volumeSeries.value = null
}

async function applyParams() {
  await loadHistory()
  startSocket()
}

onMounted(async () => {
  initChart()
  await applyParams()
})

onUnmounted(() => {
  ws.stop()
  destroyChart()
})

watch([symbol, interval, limit], async () => {
  if (!candleSeries.value) return
  await applyParams()
})
</script>

<template>
  <div class="bk">
    <header class="bk__head">
      <div>
        <h1 class="bk__title">Binance 公开行情 · K 线</h1>
        <p class="bk__sub">
          本地开发即可接 Binance 公开流，无需部署线上。REST 走开发代理，行情为
          <abbr title="K 线 + 逐笔成交">组合 WebSocket</abbr>
          ；头部价格为成交明细价，K 线由 kline 通道更新。若长期「重连中」，多为网络或地区无法访问 stream.binance.com。
        </p>
      </div>
      <div class="bk__price">
        <span class="bk__pair">{{ symbol }}</span>
        <span class="bk__last ex-num">{{ latestPrice }}</span>
        <span class="bk__st" :data-ok="!restError && ws.connected">{{ statusText }}</span>
      </div>
    </header>

    <el-alert v-if="restError" :title="restError" type="error" show-icon :closable="false" class="bk__alert" />

    <div class="bk__toolbar">
      <el-select v-model="symbol" placeholder="交易对" style="width: 130px">
        <el-option v-for="s in symbolOptions" :key="s" :label="s" :value="s" />
      </el-select>
      <el-select v-model="interval" placeholder="周期" style="width: 120px">
        <el-option v-for="it in intervalOptions" :key="it.value" :label="it.label" :value="it.value" />
      </el-select>
      <el-select v-model="limit" placeholder="条数" style="width: 100px">
        <el-option v-for="n in limitOptions" :key="n" :label="`${n} 条`" :value="n" />
      </el-select>
      <el-button type="primary" :loading="loading" @click="applyParams">刷新数据</el-button>
    </div>

    <div ref="chartContainer" class="bk__chart" />
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.bk {
  max-width: min(1200px, var(--ex-container-max));
  margin: 0 auto;
  padding: $space-4 $space-4 $space-8;
  box-sizing: border-box;
}

.bk__head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: $space-3;
  margin-bottom: $space-4;
}

.bk__title {
  margin: 0 0 $space-1;
  font-size: $font-size-xl;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.bk__sub {
  margin: 0;
  font-size: $font-size-sm;
  color: $color-text-tertiary;
  max-width: 560px;
  line-height: 1.5;
}

.bk__price {
  text-align: right;
}

.bk__pair {
  display: block;
  font-size: $font-size-xs;
  color: $color-text-tertiary;
  margin-bottom: 4px;
}

.bk__last {
  display: block;
  font-size: $font-size-xl;
  font-weight: $font-weight-bold;
  color: $color-brand;
}

.bk__st {
  display: inline-block;
  margin-top: 6px;
  font-size: 11px;
  color: $color-text-tertiary;

  &[data-ok='true'] {
    color: $color-rise;
  }
}

.bk__alert {
  margin-bottom: $space-3;
}

.bk__toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
  align-items: center;
  margin-bottom: $space-3;
}

.bk__chart {
  width: 100%;
  min-height: 520px;
  border-radius: $radius-md;
  border: 1px solid $color-border;
  overflow: hidden;
  background: var(--ex-panel-sunken);
}
</style>
