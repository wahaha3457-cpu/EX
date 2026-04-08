<script setup lang="ts">
/**
 * 交易页 K 线主面板：周期工具栏 + Lightweight Charts（默认）+ TradingView 壳占位。
 * 数据：REST 初始 + 演示 WS 增量；生产对接 store 或 composable 订阅。
 */
import { computed, onMounted, onUnmounted, ref, watch, nextTick } from 'vue'
import type {
  ChartCrosshairPayload,
  ChartEngineId,
  ChartInterval,
  ChartSurface,
  FuturesChartMainView,
  KlineBar,
} from '@/types/chartKline'
import { fetchChartKlines } from '@/api/chartKlines'
import { useLightweightTradingChart } from '@/composables/chart/useLightweightTradingChart'
import { useFuturesTradeStore } from '@/stores/futuresTrade'
import { useDeliveryTradeStore } from '@/stores/deliveryTrade'
import { useSpotTradeStore } from '@/stores/spotTrade'
import { useThemeStore } from '@/stores/theme'
import { formatCompact, formatFundingRatePercent, formatPrice } from '@/utils/format/tradingDisplay'
import { startChartKlineMockTimer } from '@/websocket/chartKlineMock'

const INTERVALS: ChartInterval[] = ['1m', '5m', '15m', '1h', '4h', '1d']

/** 现货：与币安「图表 / 资讯 / 交易数据」同级的主 Tab */
type SpotChartLeadTab = 'CHART' | 'INFO' | 'TRADING_DATA'
const spotLeadingTab = ref<SpotChartLeadTab>('CHART')

const props = withDefaults(
  defineProps<{
    surface: ChartSurface
    symbol: string
    interval: ChartInterval
    chartEngine?: ChartEngineId
    /** 是否显示成交量副图 */
    showVolume?: boolean
    /** futures：主视图（K 线 / 深度 / 交割资金费率说明） */
    mainViewTab?: FuturesChartMainView
    /** futures：标准永续工具栏 vs 交割三 Tab（图表 / 资金费率 / 深度） */
    futuresUiVariant?: 'standard' | 'delivery'
    /** 交割 Tab：展示用结算资金费率（小数） */
    deliverySettlementFundingRate?: number | null
    /** 图表区顶部说明文案（如交割规则提示） */
    chartSubtitle?: string
  }>(),
  {
    chartEngine: 'lightweight-charts',
    showVolume: true,
    mainViewTab: 'KLINE',
    futuresUiVariant: 'standard',
    deliverySettlementFundingRate: null,
    chartSubtitle: '',
  },
)

const emit = defineEmits<{
  (e: 'update:interval', v: ChartInterval): void
  (e: 'update:mainViewTab', v: FuturesChartMainView): void
  (e: 'crosshair-move', p: ChartCrosshairPayload): void
  (e: 'request-fullscreen'): void
  (e: 'indicators-click'): void
  (e: 'main-chart-click'): void
}>()

const themeStore = useThemeStore()
const futuresTrade = useFuturesTradeStore()
const deliveryTrade = useDeliveryTradeStore()
const spotTrade = useSpotTradeStore()

/** 与盘口/头部对齐：Mock 与兜底 K 线起点；不在 watch 里订阅以免行情推送频繁整图重载 */
const chartReferencePrice = computed(() => {
  if (props.surface === 'futures') {
    const t = props.futuresUiVariant === 'delivery' ? deliveryTrade.ticker : futuresTrade.ticker
    if (!t) return undefined
    const p = t.markPrice > 0 ? t.markPrice : t.lastPrice
    return Number.isFinite(p) && p > 0 ? p : undefined
  }
  const t = spotTrade.ticker
  if (!t) return undefined
  return Number.isFinite(t.lastPrice) && t.lastPrice > 0 ? t.lastPrice : undefined
})

const rootRef = ref<HTMLElement | null>(null)
const chartHostRef = ref<HTMLElement | null>(null)
const showVolumeModel = ref(props.showVolume)
watch(
  () => props.showVolume,
  (v) => {
    showVolumeModel.value = v
  },
)

const crosshair = ref<ChartCrosshairPayload>({
  time: null,
  open: null,
  high: null,
  low: null,
  close: null,
  volume: null,
})

const lw = useLightweightTradingChart(chartHostRef, {
  showVolume: showVolumeModel,
  onCrosshair: (p) => {
    crosshair.value = p
    emit('crosshair-move', p)
  },
})

const klineLoading = ref(false)
let stopMock: (() => void) | null = null

const showChartEngine = computed(() => {
  if (props.surface === 'spot') return spotLeadingTab.value === 'CHART'
  return props.mainViewTab === 'KLINE'
})

const deliveryFundingFormatted = computed(() =>
  formatFundingRatePercent(props.deliverySettlementFundingRate ?? 0),
)

/**
 * 未接入 Charting Library 授权时，「TradingView」引擎也走 Lightweight Charts + 同一套 REST，
 * 避免出现只有水印、无 K 线的黑屏。
 */
const showLwChart = computed(() => {
  const engine =
    props.chartEngine === 'tradingview-charting-library' ? 'lightweight-charts' : props.chartEngine
  return engine === 'lightweight-charts' && showChartEngine.value
})

function stopRealtimeMock() {
  stopMock?.()
  stopMock = null
}

function startRealtimeMock(bars: readonly KlineBar[]) {
  stopRealtimeMock()
  let last = bars[bars.length - 1]
  if (!last) return
  stopMock = startChartKlineMockTimer(() => {
    const jitter = (Math.random() - 0.5) * last!.close * 0.0004
    const close = Math.max(1e-12, last!.close + jitter)
    const high = Math.max(last!.high, last!.open, close)
    const low = Math.min(last!.low, last!.open, close)
    const next: KlineBar = {
      ...last!,
      close,
      high,
      low,
      volume: Math.max(0, last!.volume * (1 + (Math.random() - 0.5) * 0.03)),
    }
    last = next
    lw.applyRealtimeBar(next)
  })
}

function isValidKlineBar(b: KlineBar): boolean {
  return (
    Number.isFinite(b.time) &&
    b.time > 0 &&
    Number.isFinite(b.open) &&
    Number.isFinite(b.high) &&
    Number.isFinite(b.low) &&
    Number.isFinite(b.close) &&
    Number.isFinite(b.volume)
  )
}

async function loadAndRender() {
  lw.dispose()
  stopRealtimeMock()
  if (!showLwChart.value) return
  klineLoading.value = true
  try {
    let bars: KlineBar[] = []
    try {
      bars = await fetchChartKlines({
        symbol: props.symbol,
        interval: props.interval,
        surface: props.surface,
        limit: 420,
        referencePrice: chartReferencePrice.value,
      })
    } catch (e) {
      console.warn('[TradingChartPanel] fetchChartKlines failed', e)
    }
    bars = bars.filter(isValidKlineBar)
    if (bars.length === 0) {
      const { generateMockKlines } = await import('@/api/mock/chartKlinesMock')
      const hash =
        props.surface === 'futures'
          ? props.symbol.split('').reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 0)
          : props.symbol.replace(/_/g, '').split('').reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 0)
      const seedPrice =
        chartReferencePrice.value ?? Math.max(100, Math.abs(hash) % 50000 + 50)
      const raw = generateMockKlines(240, props.interval, seedPrice)
      bars = raw.map((b) => ({
        time: b.time,
        open: b.open,
        high: b.high,
        low: b.low,
        close: b.close,
        volume: b.volume,
      }))
    }
    await nextTick()
    await nextTick()
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    })
    if (!showLwChart.value || !chartHostRef.value) return
    lw.mount()
    lw.setBars(bars)
    startRealtimeMock(bars)
  } finally {
    klineLoading.value = false
  }
}

function onInterval(iv: ChartInterval) {
  emit('update:interval', iv)
}

function onFuturesMainTab(tab: FuturesChartMainView) {
  emit('update:mainViewTab', tab)
}

function onSpotLeadTab(tab: SpotChartLeadTab) {
  spotLeadingTab.value = tab
}

function onFullscreen() {
  const el = rootRef.value
  if (el && document.fullscreenElement === null) {
    void el.requestFullscreen().catch(() => emit('request-fullscreen'))
  } else if (document.fullscreenElement) {
    void document.exitFullscreen()
  } else {
    emit('request-fullscreen')
  }
}

const legendLine = computed(() => {
  const p = crosshair.value
  if (p.time == null || p.close == null) return '移动十字光标查看 OHLC'
  const t = new Date(p.time * 1000)
  const ts = `${t.getMonth() + 1}/${t.getDate()} ${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`
  const vol =
    p.volume != null && Number.isFinite(p.volume) ? formatCompact(p.volume) : '—'
  const o = p.open != null ? formatPrice(p.open) : '—'
  const h = p.high != null ? formatPrice(p.high) : '—'
  const l = p.low != null ? formatPrice(p.low) : '—'
  const c = formatPrice(p.close)
  return `O ${o}  H ${h}  L ${l}  C ${c}  Vol ${vol}  ·  ${ts}`
})

onMounted(() => {
  void loadAndRender()
})

watch(
  () => [
    props.symbol,
    props.interval,
    props.chartEngine,
    props.mainViewTab,
    props.surface,
    props.futuresUiVariant,
    spotLeadingTab.value,
    themeStore.theme,
    chartReferencePrice.value,
  ],
  () => {
    void loadAndRender()
  },
)

onUnmounted(() => {
  stopRealtimeMock()
  lw.dispose()
})
</script>

<template>
  <section ref="rootRef" class="tcp" aria-label="K 线图">
    <header class="tcp__toolbar">
      <div v-if="surface === 'spot'" class="tcp__lead" role="tablist" aria-label="图表主区">
        <button
          type="button"
          role="tab"
          class="tcp__lead-tab"
          :class="{ 'tcp__lead-tab--on': spotLeadingTab === 'CHART' }"
          :aria-selected="spotLeadingTab === 'CHART'"
          @click="onSpotLeadTab('CHART')"
        >
          图表
        </button>
        <button
          type="button"
          role="tab"
          class="tcp__lead-tab"
          :class="{ 'tcp__lead-tab--on': spotLeadingTab === 'INFO' }"
          :aria-selected="spotLeadingTab === 'INFO'"
          @click="onSpotLeadTab('INFO')"
        >
          资讯
          <span class="tcp__badge">占位</span>
        </button>
        <button
          type="button"
          role="tab"
          class="tcp__lead-tab"
          :class="{ 'tcp__lead-tab--on': spotLeadingTab === 'TRADING_DATA' }"
          :aria-selected="spotLeadingTab === 'TRADING_DATA'"
          @click="onSpotLeadTab('TRADING_DATA')"
        >
          交易数据
          <span class="tcp__badge">占位</span>
        </button>
      </div>

      <div v-if="surface === 'futures'" class="tcp__lead" role="tablist" aria-label="主图切换">
        <template v-if="futuresUiVariant === 'delivery'">
          <button
            type="button"
            role="tab"
            class="tcp__lead-tab"
            :class="{ 'tcp__lead-tab--on': mainViewTab === 'KLINE' }"
            :aria-selected="mainViewTab === 'KLINE'"
            @click="onFuturesMainTab('KLINE')"
          >
            图表
          </button>
          <button
            type="button"
            role="tab"
            class="tcp__lead-tab"
            :class="{ 'tcp__lead-tab--on': mainViewTab === 'DELIVERY_FUNDING' }"
            :aria-selected="mainViewTab === 'DELIVERY_FUNDING'"
            @click="onFuturesMainTab('DELIVERY_FUNDING')"
          >
            资金费率
          </button>
          <button
            type="button"
            role="tab"
            class="tcp__lead-tab"
            :class="{ 'tcp__lead-tab--on': mainViewTab === 'DEPTH' }"
            :aria-selected="mainViewTab === 'DEPTH'"
            @click="onFuturesMainTab('DEPTH')"
          >
            深度
          </button>
        </template>
        <template v-else>
          <button
            type="button"
            role="tab"
            class="tcp__lead-tab"
            :class="{ 'tcp__lead-tab--on': mainViewTab === 'KLINE' }"
            :aria-selected="mainViewTab === 'KLINE'"
            @click="onFuturesMainTab('KLINE')"
          >
            K 线
          </button>
          <button
            type="button"
            role="tab"
            class="tcp__lead-tab"
            :class="{ 'tcp__lead-tab--on': mainViewTab === 'DEPTH' }"
            :aria-selected="mainViewTab === 'DEPTH'"
            @click="onFuturesMainTab('DEPTH')"
          >
            深度图
            <span class="tcp__badge">预留</span>
          </button>
        </template>
      </div>

      <div
        v-if="showChartEngine"
        class="tcp__intervals"
        role="tablist"
        aria-label="K 线周期"
      >
        <button
          v-for="iv in INTERVALS"
          :key="iv"
          type="button"
          role="tab"
          class="tcp__iv"
          :class="{ 'tcp__iv--on': interval === iv }"
          :aria-selected="interval === iv"
          @click="onInterval(iv)"
        >
          {{ iv }}
        </button>
      </div>

      <div v-if="showChartEngine" class="tcp__actions">
        <button type="button" class="tcp__action" @click="emit('main-chart-click')">主图</button>
        <button type="button" class="tcp__action" @click="emit('indicators-click')">指标</button>
        <button type="button" class="tcp__action" @click="onFullscreen">全屏</button>
      </div>
    </header>

    <p v-if="chartSubtitle" class="tcp__subtitle">{{ chartSubtitle }}</p>

    <div v-if="surface === 'futures' && mainViewTab === 'DEPTH'" class="tcp__depth">
      <p class="tcp__depth-title">深度图</p>
      <p class="tcp__depth-hint">
        与盘口共享 depth 快照 ·
        <code class="tcp__code">market.{{ symbol }}.depth</code>
      </p>
    </div>

    <div v-else-if="surface === 'futures' && mainViewTab === 'DELIVERY_FUNDING'" class="tcp__delivery-fund">
      <p class="tcp__delivery-fund-title">资金费率（交割）</p>
      <p class="tcp__delivery-fund-val ex-num">{{ deliveryFundingFormatted }}</p>
      <p class="tcp__delivery-fund-hint">
        交割合约无永续式每 8h 资金费；临近到期展示贴近 0 的结算相关费率（Mock）。真实费率与规则以所内公告与接口为准。
      </p>
      <p class="tcp__delivery-fund-meta">
        状态：<span class="tcp__delivery-fund-ok">Mock 撮合 · 正常</span>
      </p>
    </div>

    <div v-else-if="surface === 'spot' && spotLeadingTab === 'INFO'" class="tcp__spot-secondary">
      <p class="tcp__spot-secondary-title">资讯</p>
      <p class="tcp__spot-secondary-hint">
        对接项目内资讯 / 公告 / 币种简介；当前为占位，便于与
        <a
          class="tcp__link"
          href="https://www.binance.com/zh-CN/trade/BTC_USDT?type=spot"
          target="_blank"
          rel="noopener noreferrer"
        >币安现货</a>
        图表区 Tab 结构对齐。
      </p>
    </div>

    <div v-else-if="surface === 'spot' && spotLeadingTab === 'TRADING_DATA'" class="tcp__spot-secondary">
      <p class="tcp__spot-secondary-title">交易数据</p>
      <p class="tcp__spot-secondary-hint">
        可展示资金费率（合约）、大户多空、主动买卖量等；现货侧建议放 24h 成交统计、挂单分布摘要等。数据接入后替换本区域。
      </p>
    </div>

    <div v-else class="tcp__body">
      <div v-if="klineLoading && showLwChart" class="tcp__loading" aria-live="polite">加载 K 线…</div>

      <div
        v-if="showLwChart"
        ref="chartHostRef"
        class="tcp__chart-host"
        :class="{ 'tcp__chart-host--dim': klineLoading }"
      />

      <footer v-if="showLwChart" class="tcp__legend" aria-live="polite">
        <span class="tcp__legend-text">{{ legendLine }}</span>
      </footer>
    </div>
  </section>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;
@use '@/styles/mixins' as mq;

.tcp {
  display: flex;
  flex-direction: column;
  min-height: 400px;
  border: 1px solid $color-border;
  border-radius: $radius-md;
  background: var(--ex-chart-host-bg);
  overflow: hidden;
}

.tcp__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: $space-2;
  padding: $space-2 $space-3;
  border-bottom: 1px solid $color-border;
  background: var(--ex-surface-inset-strong);
}

.tcp__subtitle {
  margin: 0;
  padding: $space-2 $space-3;
  font-size: $font-size-xs;
  line-height: 1.5;
  color: $color-text-tertiary;
  border-bottom: 1px solid var(--ex-border-subtle);
  background: var(--ex-panel-sunken);
}

.tcp__delivery-fund {
  flex: 1;
  min-height: 360px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: $space-2;
  padding: $space-6;
  background: linear-gradient(165deg, rgba(48, 132, 252, 0.06) 0%, var(--ex-panel-sunken) 55%);
}

.tcp__delivery-fund-title {
  margin: 0;
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  color: $color-text-secondary;
}

.tcp__delivery-fund-val {
  margin: 0;
  font-size: 22px;
  font-weight: $font-weight-bold;
  color: $color-rise;
}

.tcp__delivery-fund-hint {
  margin: 0;
  max-width: 520px;
  font-size: $font-size-xs;
  color: $color-text-tertiary;
  line-height: 1.6;
}

.tcp__delivery-fund-meta {
  margin: $space-2 0 0;
  font-size: $font-size-xs;
  color: $color-text-secondary;
}

.tcp__delivery-fund-ok {
  font-weight: $font-weight-semibold;
  color: $color-rise;
}

@include mq.media-down(md) {
  .tcp {
    min-height: min(400px, 56vh);
  }

  .tcp__toolbar {
    flex-wrap: nowrap;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior-x: contain;
  }

  .tcp__intervals {
    flex-wrap: nowrap;
  }

  .tcp__body {
    min-height: 220px;
  }

  .tcp__chart-host {
    min-height: 200px;
  }
}

.tcp__lead {
  display: flex;
  gap: 2px;
  padding: 2px;
  border-radius: $radius-sm;
  background: $color-bg-base;
}

.tcp__lead-tab {
  display: inline-flex;
  align-items: center;
  gap: $space-1;
  padding: $space-1 $space-3;
  font-size: $font-size-xs;
  font-weight: $font-weight-bold;
  color: $color-text-tertiary;
  background: transparent;
  border: none;
  border-radius: $radius-sm;
  cursor: pointer;

  &--on {
    color: $color-text-primary;
    background: $color-bg-surface;
  }
}

.tcp__badge {
  font-size: 9px;
  padding: 0 4px;
  border-radius: 2px;
  background: rgba(240, 185, 11, 0.15);
  color: $color-brand;
}

.tcp__intervals {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  margin-left: $space-1;
}

.tcp__iv {
  padding: 4px $space-2;
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  font-family: $font-family-mono;
  color: $color-text-tertiary;
  background: transparent;
  border: none;
  border-radius: $radius-sm;
  cursor: pointer;

  &--on {
    color: $color-brand;
    background: rgba(240, 185, 11, 0.12);
  }
}

.tcp__actions {
  margin-left: auto;
  display: flex;
  flex-wrap: wrap;
  gap: $space-1;
}

.tcp__action {
  padding: 4px $space-2;
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  color: $color-text-tertiary;
  background: var(--ex-fill-ghost);
  border: 1px solid var(--ex-border);
  border-radius: $radius-sm;
  cursor: pointer;

  &:hover {
    color: $color-text-secondary;
    border-color: rgba(240, 185, 11, 0.25);
  }
}

.tcp__body {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 360px;
}

.tcp__chart-host {
  flex: 1;
  min-height: 320px;
  width: 100%;

  &--dim {
    opacity: 0.35;
    pointer-events: none;
  }
}

.tcp__loading {
  position: absolute;
  z-index: 2;
  left: 50%;
  top: $space-4;
  transform: translateX(-50%);
  padding: $space-1 $space-3;
  font-size: $font-size-xs;
  color: $color-text-secondary;
  background: color-mix(in srgb, var(--ex-bg-elevated) 92%, transparent);
  border-radius: $radius-sm;
  border: 1px solid $color-border;
  box-shadow: var(--ex-shadow-sm);
}

.tcp__legend {
  flex-shrink: 0;
  padding: $space-2 $space-3;
  border-top: 1px solid var(--ex-border-subtle);
  background: var(--ex-surface-inset);
}

.tcp__legend-text {
  font-size: $font-size-xs;
  font-family: $font-family-mono;
  color: $color-text-tertiary;
  font-variant-numeric: tabular-nums;
}

.tcp__depth {
  flex: 1;
  min-height: 360px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: $space-6;
  background: repeating-linear-gradient(
    45deg,
    $color-bg-base,
    $color-bg-base 14px,
    rgba(14, 203, 129, 0.03) 14px,
    rgba(14, 203, 129, 0.03) 28px
  );
}

.tcp__depth-title {
  margin: 0 0 $space-2;
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  color: $color-text-secondary;
}

.tcp__depth-hint {
  margin: 0;
  font-size: $font-size-xs;
  color: $color-text-tertiary;
  text-align: center;
  max-width: 480px;
  line-height: 1.5;
}

.tcp__code {
  display: inline-block;
  margin-top: $space-2;
  padding: 2px $space-2;
  font-size: 10px;
  font-family: $font-family-mono;
  color: #8ab4ff;
  background: var(--ex-surface-inset-strong);
  border-radius: $radius-sm;
}

.tcp__spot-secondary {
  flex: 1;
  min-height: 360px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  padding: $space-5 $space-6;
  background: var(--ex-panel-sunken);
}

.tcp__spot-secondary-title {
  margin: 0 0 $space-2;
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  color: $color-text-secondary;
}

.tcp__spot-secondary-hint {
  margin: 0;
  max-width: 520px;
  font-size: $font-size-xs;
  color: $color-text-tertiary;
  line-height: 1.6;
}

.tcp__link {
  color: $color-brand;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}
</style>
