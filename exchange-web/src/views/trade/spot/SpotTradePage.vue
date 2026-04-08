<script setup lang="ts">
import { computed, ref, watch, onUnmounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { RouteNames } from '@/constants/routeNames'
import { useSpotTradeStore } from '@/stores/spotTrade'
import { useDemoTradeStore } from '@/stores/demoTrade'
import { useAuthStore } from '@/stores/auth'
import { useMatchMedia } from '@/composables/useMatchMedia'
import TradingPairHeader from '@/components/business/spot/TradingPairHeader.vue'
import SpotChartPanel from '@/components/business/spot/SpotChartPanel.vue'
import OrderBookPanel from '@/components/business/spot/OrderBookPanel.vue'
import RecentTradesPanel from '@/components/business/spot/RecentTradesPanel.vue'
import SpotOrderForm from '@/components/business/spot/SpotOrderForm.vue'
import SpotOrdersPanel from '@/components/business/spot/SpotOrdersPanel.vue'
import ExPageState from '@/components/common/ExPageState.vue'
import { startSpotTradeStreams, stopSpotTradeStreams } from '@/websocket/spotTradeWs'

const route = useRoute()
const store = useSpotTradeStore()
const demo = useDemoTradeStore()
const auth = useAuthStore()
const { loading, loadError, ticker } = storeToRefs(store)
const { accessToken } = storeToRefs(auth)

const isDemoTrade = computed(() => route.name === RouteNames.DemoSpotTrade)

/** ≤767px：主区 Tab 切换（对齐币安移动端信息架构） */
const isNarrow = useMatchMedia('(max-width: 767px)')
type MobWorkspace = 'chart' | 'depth' | 'trades' | 'order'
const mobWorkspace = ref<MobWorkspace>('chart')

watch(
  () => ({
    sym: (route.params.symbol as string) || 'BTC_USDT',
    name: route.name as string,
  }),
  ({ sym, name }) => {
    demo.setTerminalActive(name === RouteNames.DemoSpotTrade)
    store.setSymbol(sym)
    stopSpotTradeStreams()
    startSpotTradeStreams(sym)
  },
  { immediate: true },
)

watch(
  () => route.params.symbol,
  () => {
    mobWorkspace.value = 'chart'
  },
)

/** 登录前已打开交易页时首次 bootstrap 无 Token；登录成功后需重新拉余额/委托 */
watch(
  accessToken,
  (tok, prev) => {
    if (isDemoTrade.value) return
    if (tok && tok !== prev) void store.bootstrap()
  },
)

watch(isNarrow, (n) => {
  if (!n) mobWorkspace.value = 'chart'
})

function showBook() {
  return !isNarrow.value || mobWorkspace.value === 'depth'
}

function showTrades() {
  return !isNarrow.value || mobWorkspace.value === 'trades'
}

function showChart() {
  return !isNarrow.value || mobWorkspace.value === 'chart'
}

function showOrderForm() {
  return !isNarrow.value || mobWorkspace.value === 'order'
}

const stackedTradesMaxHeight = computed(() =>
  isNarrow.value ? undefined : 'min(340px, 42vh)',
)

onUnmounted(() => {
  stopSpotTradeStreams()
  demo.setTerminalActive(false)
})
</script>

<template>
  <div class="spot ex-trade-shell">
    <div v-if="isDemoTrade" class="spot__demo-bar" role="status">
      <span class="spot__demo-pill">模拟交易</span>
      <span class="spot__demo-desc">虚拟资金，与实盘账户隔离</span>
      <RouterLink class="spot__demo-link" :to="{ name: RouteNames.DemoTrading }">规则说明</RouterLink>
    </div>
    <TradingPairHeader />

    <ExPageState
      class="ex-page-state--trade spot__state"
      :loading="loading"
      :use-skeleton="loading && !ticker"
      skeleton-variant="chart"
      :error="loadError"
      loading-text="加载行情与盘口…"
      @retry="store.bootstrap()"
    >
      <div v-if="isNarrow" class="spot__mob-tabs" role="tablist" aria-label="交易主区切换">
        <button
          type="button"
          role="tab"
          class="spot__mob-tab"
          :class="{ 'spot__mob-tab--on': mobWorkspace === 'chart' }"
          :aria-selected="mobWorkspace === 'chart'"
          @click="mobWorkspace = 'chart'"
        >
          图表
        </button>
        <button
          type="button"
          role="tab"
          class="spot__mob-tab"
          :class="{ 'spot__mob-tab--on': mobWorkspace === 'depth' }"
          :aria-selected="mobWorkspace === 'depth'"
          @click="mobWorkspace = 'depth'"
        >
          盘口
        </button>
        <button
          type="button"
          role="tab"
          class="spot__mob-tab"
          :class="{ 'spot__mob-tab--on': mobWorkspace === 'trades' }"
          :aria-selected="mobWorkspace === 'trades'"
          @click="mobWorkspace = 'trades'"
        >
          成交
        </button>
        <button
          type="button"
          role="tab"
          class="spot__mob-tab spot__mob-tab--accent"
          :class="{ 'spot__mob-tab--on': mobWorkspace === 'order' }"
          :aria-selected="mobWorkspace === 'order'"
          @click="mobWorkspace = 'order'"
        >
          下单
        </button>
      </div>

      <div class="spot__core ex-trade-workbench">
        <div v-show="showChart()" id="trade-chart" class="spot__chart ex-trade-panel ex-trade-workbench__primary">
          <SpotChartPanel />
        </div>

        <aside
          v-show="showBook() || showTrades()"
          class="spot__mid ex-trade-panel ex-trade-workbench__aux"
          aria-label="盘口与最近成交"
        >
          <div v-show="showBook()" class="spot__book-wrap">
            <OrderBookPanel />
          </div>
          <div v-show="showTrades()" class="spot__trades-wrap">
            <div class="spot__trades-inner">
              <RecentTradesPanel :trades-max-height="stackedTradesMaxHeight" />
            </div>
          </div>
        </aside>

        <div v-show="showOrderForm()" class="spot__right ex-trade-workbench__op">
          <div class="spot__form ex-trade-panel">
            <SpotOrderForm />
          </div>
        </div>
      </div>

      <SpotOrdersPanel class="spot__orders ex-trade-panel ex-trade-dock" />
    </ExPageState>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;
@use '@/styles/mixins' as mq;

/* 页面壳：与底部管理区节奏统一 */
.spot {
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: var(--ex-trade-gap, #{$space-3});
  min-height: 0;
  width: 100%;
  box-sizing: border-box;
}

.spot__demo-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: $space-2;
  padding: $space-2 $space-3;
  border-radius: $radius-md;
  border: 1px solid rgba(240, 185, 11, 0.28);
  background: rgba(240, 185, 11, 0.06);
  font-size: $font-size-xs;
  color: $color-text-secondary;
}

.spot__demo-pill {
  padding: 2px $space-2;
  font-weight: $font-weight-semibold;
  color: $color-brand;
  background: rgba(240, 185, 11, 0.12);
  border-radius: $radius-sm;
}

.spot__demo-desc {
  flex: 1 1 auto;
  min-width: 0;
}

.spot__demo-link {
  font-weight: $font-weight-semibold;
  color: $color-brand;
  text-decoration: none;
}

.spot__demo-link:hover {
  text-decoration: underline;
}

.spot__state {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

/* ExPageState 成功态：槽位纵向栈 + 统一 gap，避免子块贴边 */
.spot__state :deep(.ex-page-state__content) {
  display: flex;
  flex-direction: column;
  gap: var(--ex-trade-gap, #{$space-3});
  min-height: 0;
  flex: 1;
}

#trade-chart,
#trade-orders {
  scroll-margin-top: calc(#{$header-height} + 12px);
}

.ex-trade-panel {
  min-width: 0;
  border-radius: $radius-md;
  overflow: hidden;
}

.spot__mob-tabs {
  display: flex;
  flex-shrink: 0;
  gap: $space-1;
  padding: $space-1;
  border-radius: $radius-md;
  border: 1px solid $color-border;
  background: var(--ex-surface-inset);
  position: sticky;
  top: calc(#{$header-height} + #{$subnav-height} + 4px);
  z-index: 8;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.spot__mob-tab {
  flex: 1 0 auto;
  min-width: 72px;
  min-height: $control-height-lg;
  padding: 0 $space-2;
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  color: $color-text-tertiary;
  background: transparent;
  border: none;
  border-radius: $radius-sm;
  cursor: pointer;
}

.spot__mob-tab--on {
  color: $color-text-primary;
  background: rgba(240, 185, 11, 0.12);
  box-shadow: 0 0 0 1px rgba(240, 185, 11, 0.22);
}

.spot__mob-tab--accent.spot__mob-tab--on {
  color: $color-brand;
}

.spot__core {
  display: flex;
  flex-direction: column;
  gap: var(--ex-trade-workbench-gap, #{$space-2});
  min-width: 0;
  flex: 1;
  min-height: 0;
}

.spot__chart {
  min-height: 320px;
  display: flex;
  flex-direction: column;
}

.spot__chart > * {
  flex: 1;
  min-height: 0;
}

.spot__mid {
  display: flex;
  flex-direction: column;
  gap: var(--ex-trade-workbench-gap, #{$space-2});
  min-width: 0;
}

.spot__book-wrap,
.spot__trades-wrap {
  min-width: 0;
  min-height: 0;
}

.spot__right {
  display: flex;
  flex-direction: column;
  gap: var(--ex-trade-workbench-gap, #{$space-2});
  min-width: 0;
}

.spot__orders {
  flex-shrink: 0;
  min-width: 0;
}

.spot__trades-inner {
  display: flex;
  flex-direction: column;
  gap: var(--ex-trade-workbench-gap, #{$space-2});
  min-height: 0;
  flex: 1;
}

/* —— 平板：768–1023 图表全宽，盘口+成交横排，下单单独一行 —— */
@include mq.media-between(md, lg) {
  .spot__core {
    display: grid;
    gap: var(--ex-trade-workbench-gap, #{$space-3});
    grid-template-columns: 1fr 1fr;
    grid-template-rows: auto auto auto;
    grid-template-areas:
      'chart chart'
      'mid mid'
      'right right';
    align-items: stretch;
  }

  .spot__chart {
    grid-area: chart;
    min-height: 400px;
  }

  .spot__mid {
    grid-area: mid;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--ex-trade-workbench-gap, #{$space-3});
    min-width: 0;
    min-height: 0;
  }

  .spot__book-wrap,
  .spot__trades-wrap {
    min-width: 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  .spot__right {
    grid-area: right;
    display: flex;
    flex-direction: column;
    gap: var(--ex-trade-workbench-gap, #{$space-3});
    min-width: 0;
    min-height: 0;
  }

  .spot__form {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    overflow-x: hidden;
    -webkit-overflow-scrolling: touch;
  }

  /* 表单按内容增高，避免 flex:1 压扁后子项溢出圆角卡片外 */
  .spot__form > * {
    flex: 0 0 auto;
    width: 100%;
    min-height: 0;
  }
}

/*
 * 桌面工作站：≥1024
 * 列比例 ≈ 60% / 20% / 20%（随 minmax 略有浮动），主图区显著宽于盘口+下单
 */
@include mq.media-up(lg) {
  .spot__core {
    display: grid;
    grid-template-columns: minmax(0, 3.05fr) minmax(216px, 1fr) minmax(268px, 1.02fr);
    grid-template-rows: minmax(0, 1fr);
    grid-template-areas: 'chart mid right';
    align-items: stretch;
    align-content: stretch;
    gap: var(--ex-trade-workbench-gap, #{$space-3});
    flex: 1 1 auto;
    min-height: 0;
    max-height: var(--ex-trade-workbench-max-h);
  }

  .spot__chart {
    grid-area: chart;
    min-height: 0;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .spot__chart :deep(.tcp) {
    flex: 1 1 auto;
    min-height: 0;
    height: 100%;
  }

  .spot__chart :deep(.tcp__body) {
    min-height: 0;
  }

  .spot__chart :deep(.tcp__chart-host) {
    min-height: 0;
  }

  .spot__mid {
    grid-area: mid;
    display: flex;
    flex-direction: column;
    gap: var(--ex-trade-workbench-gap, #{$space-2});
    min-height: 0;
    height: 100%;
    overflow: hidden;
  }

  /* 盘口权重大于成交：约 58 / 42 */
  .spot__book-wrap {
    flex: 1 1 58%;
    min-height: 120px;
    display: flex;
    flex-direction: column;
  }

  .spot__book-wrap > * {
    flex: 1;
    min-height: 0;
  }

  .spot__trades-wrap {
    flex: 1 1 42%;
    min-height: 100px;
    display: flex;
    flex-direction: column;
  }

  .spot__right {
    grid-area: right;
    min-height: 0;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .spot__form {
    flex: 1 1 auto;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    overflow-x: hidden;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior: contain;
  }

  .spot__form > * {
    flex: 0 0 auto;
    width: 100%;
    min-height: 0;
  }
}

@include mq.media-up(xl) {
  .spot__core {
    grid-template-columns: minmax(0, 3.25fr) minmax(232px, 1fr) minmax(300px, 1.08fr);
    max-height: var(--ex-trade-workbench-max-h);
  }
}

@include mq.media-up('2xl') {
  .spot__core {
    grid-template-columns: minmax(0, 3.35fr) minmax(248px, 1fr) minmax(320px, 1.1fr);
  }
}

@include mq.media-down(md) {
  .spot__core {
    display: flex;
    flex-direction: column;
    max-height: none;
  }

  .spot__chart {
    min-height: 300px;
  }
}

@include mq.media-down(sm) {
  .spot__mob-tabs {
    top: calc(#{$header-height} + 4px);
  }

  .spot__chart {
    min-height: 260px;
  }
}
</style>
