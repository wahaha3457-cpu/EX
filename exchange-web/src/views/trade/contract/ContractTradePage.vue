<script setup lang="ts">
import { computed, ref, watch, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useFuturesTradeStore } from '@/stores/futuresTrade'
import { useMatchMedia } from '@/composables/useMatchMedia'
import {
  ContractPairHeader,
  ContractChartPanel,
  ContractOrderBookPanel,
  ContractRecentTradesPanel,
  ContractOrderForm,
  ContractBottomPanel,
} from '@/components/business/futures'
import ExPageState from '@/components/common/ExPageState.vue'
import { startFuturesTradeStreams, stopFuturesTradeStreams } from '@/websocket/futuresTradeWs'

const route = useRoute()
const store = useFuturesTradeStore()
const { loading, loadError, ticker } = storeToRefs(store)

const isNarrow = useMatchMedia('(max-width: 767px)')
type MobWorkspace = 'chart' | 'depth' | 'trades' | 'order'
const mobWorkspace = ref<MobWorkspace>('chart')

watch(
  () => (route.params.symbol as string) || 'BTCUSDT',
  (sym) => {
    store.setSymbol(sym)
    stopFuturesTradeStreams()
    startFuturesTradeStreams(sym)
  },
  { immediate: true },
)

watch(
  () => route.params.symbol,
  () => {
    mobWorkspace.value = 'chart'
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
  stopFuturesTradeStreams()
})
</script>

<template>
  <div class="ctp ex-trade-shell">
    <ContractPairHeader />

    <ExPageState
      class="ex-page-state--trade ctp__state"
      :loading="loading"
      :use-skeleton="loading && !ticker"
      skeleton-variant="chart"
      :error="loadError"
      loading-text="加载合约行情与盘口…"
      @retry="store.bootstrap()"
    >
      <div v-if="isNarrow" class="ctp__mob-tabs" role="tablist" aria-label="合约交易主区切换">
        <button
          type="button"
          role="tab"
          class="ctp__mob-tab"
          :class="{ 'ctp__mob-tab--on': mobWorkspace === 'chart' }"
          :aria-selected="mobWorkspace === 'chart'"
          @click="mobWorkspace = 'chart'"
        >
          图表
        </button>
        <button
          type="button"
          role="tab"
          class="ctp__mob-tab"
          :class="{ 'ctp__mob-tab--on': mobWorkspace === 'depth' }"
          :aria-selected="mobWorkspace === 'depth'"
          @click="mobWorkspace = 'depth'"
        >
          深度
        </button>
        <button
          type="button"
          role="tab"
          class="ctp__mob-tab"
          :class="{ 'ctp__mob-tab--on': mobWorkspace === 'trades' }"
          :aria-selected="mobWorkspace === 'trades'"
          @click="mobWorkspace = 'trades'"
        >
          成交
        </button>
        <button
          type="button"
          role="tab"
          class="ctp__mob-tab ctp__mob-tab--accent"
          :class="{ 'ctp__mob-tab--on': mobWorkspace === 'order' }"
          :aria-selected="mobWorkspace === 'order'"
          @click="mobWorkspace = 'order'"
        >
          下单
        </button>
      </div>

      <div class="ctp__core ex-trade-workbench">
        <div v-show="showChart()" id="trade-chart" class="ctp__chart ex-trade-panel ex-trade-workbench__primary">
          <ContractChartPanel />
        </div>

        <aside
          v-show="showBook() || showTrades()"
          class="ctp__mid ex-trade-panel ex-trade-workbench__aux"
          aria-label="盘口与最近成交"
        >
          <div v-show="showBook()" class="ctp__book-wrap">
            <ContractOrderBookPanel />
          </div>
          <div v-show="showTrades()" class="ctp__trades-wrap">
            <div class="ctp__trades-inner">
              <ContractRecentTradesPanel :trades-max-height="stackedTradesMaxHeight" />
            </div>
          </div>
        </aside>

        <div v-show="showOrderForm()" class="ctp__right ex-trade-workbench__op">
          <div class="ctp__form ex-trade-panel">
            <ContractOrderForm />
          </div>
        </div>
      </div>

      <ContractBottomPanel class="ctp__bottom ex-trade-panel ex-trade-dock" />
    </ExPageState>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;
@use '@/styles/mixins' as mq;

.ctp {
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: var(--ex-trade-gap, #{$space-3});
  min-height: 0;
  width: 100%;
  box-sizing: border-box;
}

.ctp__state {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.ctp__state :deep(.ex-page-state__content) {
  display: flex;
  flex-direction: column;
  gap: var(--ex-trade-gap, #{$space-3});
  min-height: 0;
  flex: 1;
}

#trade-chart,
#trade-positions {
  scroll-margin-top: calc(#{$header-height} + 12px);
}

.ex-trade-panel {
  min-width: 0;
  border-radius: $radius-md;
  overflow: hidden;
}

.ctp__mob-tabs {
  display: flex;
  flex-shrink: 0;
  gap: $space-1;
  padding: $space-1;
  border-radius: $radius-md;
  border: 1px solid $color-border;
  background: var(--ex-surface-inset);
  position: sticky;
  top: calc(#{$header-height} + 4px);
  z-index: 8;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.ctp__mob-tab {
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

.ctp__mob-tab--on {
  color: $color-text-primary;
  background: rgba(48, 132, 252, 0.14);
  box-shadow: 0 0 0 1px rgba(48, 132, 252, 0.35);
}

.ctp__mob-tab--accent.ctp__mob-tab--on {
  color: #8ab4ff;
}

.ctp__mid {
  display: flex;
  flex-direction: column;
  gap: var(--ex-trade-workbench-gap, #{$space-2});
  min-width: 0;
}

.ctp__right {
  display: flex;
  flex-direction: column;
  gap: var(--ex-trade-workbench-gap, #{$space-2});
  min-width: 0;
}

.ctp__book-wrap,
.ctp__trades-wrap {
  min-width: 0;
  min-height: 0;
}

.ctp__core {
  display: flex;
  flex-direction: column;
  gap: var(--ex-trade-workbench-gap, #{$space-2});
  min-width: 0;
  flex: 1;
  min-height: 0;
}

.ctp__chart {
  min-height: 320px;
  display: flex;
  flex-direction: column;
}

.ctp__chart > * {
  flex: 1;
  min-height: 0;
}

.ctp__bottom {
  flex-shrink: 0;
  min-width: 0;
}

.ctp__trades-inner {
  display: flex;
  flex-direction: column;
  gap: var(--ex-trade-workbench-gap, #{$space-2});
  min-height: 0;
  flex: 1;
}

@include mq.media-between(md, lg) {
  .ctp__core {
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

  .ctp__chart {
    grid-area: chart;
    min-height: 400px;
  }

  .ctp__mid {
    grid-area: mid;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--ex-trade-workbench-gap, #{$space-3});
    min-width: 0;
    min-height: 0;
  }

  .ctp__book-wrap,
  .ctp__trades-wrap {
    min-width: 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  .ctp__right {
    grid-area: right;
    display: flex;
    flex-direction: column;
    gap: var(--ex-trade-workbench-gap, #{$space-3});
    min-width: 0;
    min-height: 0;
  }

  .ctp__form {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    overflow-x: hidden;
    -webkit-overflow-scrolling: touch;
  }

  .ctp__form > * {
    flex: 0 0 auto;
    width: 100%;
    min-height: 0;
  }
}

@include mq.media-up(lg) {
  .ctp__core {
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

  .ctp__chart {
    grid-area: chart;
    min-height: 0;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .ctp__chart :deep(.tcp) {
    flex: 1 1 auto;
    min-height: 0;
    height: 100%;
  }

  .ctp__chart :deep(.tcp__body) {
    min-height: 0;
  }

  .ctp__chart :deep(.tcp__chart-host) {
    min-height: 0;
  }

  .ctp__mid {
    grid-area: mid;
    display: flex;
    flex-direction: column;
    gap: var(--ex-trade-workbench-gap, #{$space-2});
    min-height: 0;
    height: 100%;
    overflow: hidden;
  }

  .ctp__book-wrap {
    flex: 1 1 58%;
    min-height: 120px;
    display: flex;
    flex-direction: column;
  }

  .ctp__book-wrap > * {
    flex: 1;
    min-height: 0;
  }

  .ctp__trades-wrap {
    flex: 1 1 42%;
    min-height: 100px;
    display: flex;
    flex-direction: column;
  }

  .ctp__right {
    grid-area: right;
    min-height: 0;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .ctp__form {
    flex: 1 1 auto;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    overflow-x: hidden;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior: contain;
  }

  .ctp__form > * {
    flex: 0 0 auto;
    width: 100%;
    min-height: 0;
  }
}

@include mq.media-up(xl) {
  .ctp__core {
    grid-template-columns: minmax(0, 3.25fr) minmax(232px, 1fr) minmax(300px, 1.08fr);
    max-height: var(--ex-trade-workbench-max-h);
  }
}

@include mq.media-up('2xl') {
  .ctp__core {
    grid-template-columns: minmax(0, 3.35fr) minmax(248px, 1fr) minmax(320px, 1.1fr);
  }
}

@include mq.media-down(md) {
  .ctp__core {
    display: flex;
    flex-direction: column;
    max-height: none;
  }

  .ctp__chart {
    min-height: 300px;
  }
}

@include mq.media-down(sm) {
  .ctp__mob-tabs {
    top: calc(#{$header-height} + 4px);
  }

  .ctp__chart {
    min-height: 260px;
  }
}
</style>
