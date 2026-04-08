<script setup lang="ts">
import { computed, ref, watch, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useDeliveryTradeStore } from '@/stores/deliveryTrade'
import { useMatchMedia } from '@/composables/useMatchMedia'
import DeliveryPairHeader from '@/components/business/delivery/DeliveryPairHeader.vue'
import DeliveryChartPanel from '@/components/business/delivery/DeliveryChartPanel.vue'
import DeliveryOrderBookPanel from '@/components/business/delivery/DeliveryOrderBookPanel.vue'
import DeliveryRecentTradesPanel from '@/components/business/delivery/DeliveryRecentTradesPanel.vue'
import DeliveryOrderForm from '@/components/business/delivery/DeliveryOrderForm.vue'
import DeliveryBottomPanel from '@/components/business/delivery/DeliveryBottomPanel.vue'
import ExPageState from '@/components/common/ExPageState.vue'
import { DELIVERY_DEFAULT_SYMBOL } from '@/api/delivery/deliverySymbols'
import { startDeliveryTradeStreams, stopDeliveryTradeStreams } from '@/websocket/deliveryTradeWs'

const route = useRoute()
const store = useDeliveryTradeStore()
const { loading, loadError, ticker, positions } = storeToRefs(store)

const isNarrow = useMatchMedia('(max-width: 767px)')
/** 移动端主区：图表 / 盘口 / 成交 / 持仓（底部 dock）/ 下单 */
type MobWorkspace = 'chart' | 'depth' | 'trades' | 'dock' | 'order'
const mobWorkspace = ref<MobWorkspace>('chart')

const dockActivityCount = computed(() => positions.value.length)

watch(
  () => (route.params.symbol as string) || DELIVERY_DEFAULT_SYMBOL,
  (sym) => {
    store.setSymbol(sym)
    stopDeliveryTradeStreams()
    startDeliveryTradeStreams(sym)
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

function showWorkbench() {
  return !isNarrow.value || mobWorkspace.value !== 'dock'
}

function showDockPanelMobile() {
  return isNarrow.value && mobWorkspace.value === 'dock'
}

function showBook() {
  return showWorkbench() && (!isNarrow.value || mobWorkspace.value === 'depth')
}

function showTrades() {
  return showWorkbench() && (!isNarrow.value || mobWorkspace.value === 'trades')
}

function showChart() {
  return showWorkbench() && (!isNarrow.value || mobWorkspace.value === 'chart')
}

function showOrderForm() {
  return showWorkbench() && (!isNarrow.value || mobWorkspace.value === 'order')
}

const stackedTradesMaxHeight = computed(() =>
  isNarrow.value ? undefined : 'min(340px, 42vh)',
)

onUnmounted(() => {
  stopDeliveryTradeStreams()
})
</script>

<template>
  <div class="dtp ex-trade-shell">
    <DeliveryPairHeader />

    <ExPageState
      class="ex-page-state--trade dtp__state"
      :loading="loading"
      :use-skeleton="loading && !ticker"
      skeleton-variant="chart"
      :error="loadError"
      loading-text="加载交割合约行情与盘口…"
      @retry="store.bootstrap()"
    >
      <div v-if="isNarrow" class="dtp__mob-tabs" role="tablist" aria-label="交割交易主区切换">
        <button
          type="button"
          role="tab"
          class="dtp__mob-tab"
          :class="{ 'dtp__mob-tab--on': mobWorkspace === 'chart' }"
          :aria-selected="mobWorkspace === 'chart'"
          @click="mobWorkspace = 'chart'"
        >
          图表
        </button>
        <button
          type="button"
          role="tab"
          class="dtp__mob-tab"
          :class="{ 'dtp__mob-tab--on': mobWorkspace === 'depth' }"
          :aria-selected="mobWorkspace === 'depth'"
          @click="mobWorkspace = 'depth'"
        >
          深度
        </button>
        <button
          type="button"
          role="tab"
          class="dtp__mob-tab"
          :class="{ 'dtp__mob-tab--on': mobWorkspace === 'trades' }"
          :aria-selected="mobWorkspace === 'trades'"
          @click="mobWorkspace = 'trades'"
        >
          成交
        </button>
        <button
          type="button"
          role="tab"
          class="dtp__mob-tab"
          :class="{ 'dtp__mob-tab--on': mobWorkspace === 'dock' }"
          :aria-selected="mobWorkspace === 'dock'"
          @click="mobWorkspace = 'dock'"
        >
          持仓
          <span v-if="dockActivityCount > 0" class="dtp__mob-badge">{{ dockActivityCount }}</span>
        </button>
        <button
          type="button"
          role="tab"
          class="dtp__mob-tab dtp__mob-tab--accent"
          :class="{ 'dtp__mob-tab--on': mobWorkspace === 'order' }"
          :aria-selected="mobWorkspace === 'order'"
          @click="mobWorkspace = 'order'"
        >
          下单
        </button>
      </div>

      <DeliveryBottomPanel
        v-if="showDockPanelMobile()"
        class="dtp__dock ex-trade-panel ex-trade-dock"
      />

      <div v-show="showWorkbench()" class="dtp__core ex-trade-workbench">
        <div v-show="showChart()" id="trade-chart" class="dtp__chart ex-trade-panel ex-trade-workbench__primary">
          <DeliveryChartPanel />
        </div>

        <aside
          v-show="showBook() || showTrades()"
          class="dtp__mid ex-trade-panel ex-trade-workbench__aux"
          aria-label="盘口与最近成交"
        >
          <div v-show="showBook()" class="dtp__book-wrap">
            <DeliveryOrderBookPanel />
          </div>
          <div v-show="showTrades()" class="dtp__trades-wrap">
            <div class="dtp__trades-inner">
              <DeliveryRecentTradesPanel :trades-max-height="stackedTradesMaxHeight" />
            </div>
          </div>
        </aside>

        <div v-show="showOrderForm()" class="dtp__right ex-trade-workbench__op">
          <div class="dtp__form ex-trade-panel">
            <DeliveryOrderForm />
          </div>
        </div>
      </div>

      <DeliveryBottomPanel
        v-show="!isNarrow"
        class="dtp__bottom ex-trade-panel ex-trade-dock"
      />
    </ExPageState>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;
@use '@/styles/mixins' as mq;

.dtp {
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: var(--ex-trade-gap, #{$space-3});
  min-height: 0;
  width: 100%;
  box-sizing: border-box;
}

.dtp__state {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.dtp__state :deep(.ex-page-state__content) {
  display: flex;
  flex-direction: column;
  gap: var(--ex-trade-gap, #{$space-3});
  min-height: 0;
  flex: 1;
}

/** 窄屏：主列可滚动，避免底部管理区仅在视口外且无法到达 */
@include mq.media-down(md) {
  .dtp__state :deep(.ex-page-state__content) {
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior: contain;
  }
}

.dtp__dock {
  flex: 1 1 auto;
  min-height: min(520px, 62vh);
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.dtp__dock :deep(.dbp) {
  flex: 1;
  min-height: 0;
}

#trade-chart,
#trade-delivery-positions {
  scroll-margin-top: calc(#{$header-height} + 12px);
}

.ex-trade-panel {
  min-width: 0;
  border-radius: $radius-md;
  overflow: hidden;
}

.dtp__mob-tabs {
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

.dtp__mob-tab {
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

.dtp__mob-tab--on {
  color: $color-text-primary;
  background: rgba(240, 185, 11, 0.12);
  box-shadow: 0 0 0 1px rgba(240, 185, 11, 0.28);
}

.dtp__mob-tab--accent.dtp__mob-tab--on {
  color: $color-brand;
}

.dtp__mob-badge {
  margin-left: 2px;
  padding: 0 5px;
  font-size: 9px;
  font-weight: $font-weight-bold;
  border-radius: 8px;
  background: rgba(48, 132, 252, 0.22);
  color: #8ab4ff;
}

.dtp__mid {
  display: flex;
  flex-direction: column;
  gap: var(--ex-trade-workbench-gap, #{$space-2});
  min-width: 0;
}

.dtp__right {
  display: flex;
  flex-direction: column;
  gap: var(--ex-trade-workbench-gap, #{$space-2});
  min-width: 0;
}

.dtp__book-wrap,
.dtp__trades-wrap {
  min-width: 0;
  min-height: 0;
}

.dtp__core {
  display: flex;
  flex-direction: column;
  gap: var(--ex-trade-workbench-gap, #{$space-2});
  min-width: 0;
  flex: 1;
  min-height: 0;
}

.dtp__chart {
  min-height: 320px;
  display: flex;
  flex-direction: column;
}

.dtp__chart > * {
  flex: 1;
  min-height: 0;
}

.dtp__bottom {
  flex-shrink: 0;
  min-width: 0;
}

.dtp__trades-inner {
  display: flex;
  flex-direction: column;
  gap: var(--ex-trade-workbench-gap, #{$space-2});
  min-height: 0;
  flex: 1;
}

@include mq.media-between(md, lg) {
  .dtp__core {
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

  .dtp__chart {
    grid-area: chart;
    min-height: 400px;
  }

  .dtp__mid {
    grid-area: mid;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--ex-trade-workbench-gap, #{$space-3});
    min-width: 0;
    min-height: 0;
  }

  .dtp__book-wrap,
  .dtp__trades-wrap {
    min-width: 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  .dtp__right {
    grid-area: right;
    display: flex;
    flex-direction: column;
    gap: var(--ex-trade-workbench-gap, #{$space-3});
    min-width: 0;
    min-height: 0;
  }

  .dtp__form {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    overflow-x: hidden;
    -webkit-overflow-scrolling: touch;
  }

  .dtp__form > * {
    flex: 0 0 auto;
    width: 100%;
    min-height: 0;
  }
}

@include mq.media-up(lg) {
  .dtp__core {
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

  .dtp__chart {
    grid-area: chart;
    min-height: 0;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .dtp__chart :deep(.tcp) {
    flex: 1 1 auto;
    min-height: 0;
    height: 100%;
  }

  .dtp__chart :deep(.tcp__body) {
    min-height: 0;
  }

  .dtp__chart :deep(.tcp__chart-host) {
    min-height: 0;
  }

  .dtp__mid {
    grid-area: mid;
    display: flex;
    flex-direction: column;
    gap: var(--ex-trade-workbench-gap, #{$space-2});
    min-height: 0;
    height: 100%;
    overflow: hidden;
  }

  .dtp__book-wrap {
    flex: 1 1 58%;
    min-height: 120px;
    display: flex;
    flex-direction: column;
  }

  .dtp__book-wrap > * {
    flex: 1;
    min-height: 0;
  }

  .dtp__trades-wrap {
    flex: 1 1 42%;
    min-height: 100px;
    display: flex;
    flex-direction: column;
  }

  .dtp__right {
    grid-area: right;
    min-height: 0;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .dtp__form {
    flex: 1 1 auto;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    overflow-x: hidden;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior: contain;
  }

  .dtp__form > * {
    flex: 0 0 auto;
    width: 100%;
    min-height: 0;
  }
}

@include mq.media-up(xl) {
  .dtp__core {
    grid-template-columns: minmax(0, 3.25fr) minmax(232px, 1fr) minmax(300px, 1.08fr);
    max-height: var(--ex-trade-workbench-max-h);
  }
}

@include mq.media-up('2xl') {
  .dtp__core {
    grid-template-columns: minmax(0, 3.35fr) minmax(248px, 1fr) minmax(320px, 1.1fr);
  }
}

@include mq.media-down(md) {
  .dtp__core {
    display: flex;
    flex-direction: column;
    max-height: none;
  }

  .dtp__chart {
    min-height: 300px;
  }
}

@include mq.media-down(sm) {
  .dtp__mob-tabs {
    top: calc(#{$header-height} + 4px);
  }

  .dtp__chart {
    min-height: 260px;
  }
}
</style>
