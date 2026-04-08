<script setup lang="ts">
/**
 * 合约交易页右侧「U 本位行情列表」：与现货右栏结构对齐，跳转永续路由。
 */
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { RouteNames } from '@/constants/routeNames'
import { useMarketStore } from '@/stores/market'
import { useFuturesTradeStore } from '@/stores/futuresTrade'
import { pairWatchKey } from '@/composables/pairSwitcher/pairWatchKey'
import { formatPct, formatPrice } from '@/utils/format/tradingDisplay'
import type { MarketTickerRow } from '@/types/market'
import TradeFlowInfoModal from '@/components/trading/TradeFlowInfoModal.vue'
import PerpetualFlowGuideContent from '@/components/business/futures/PerpetualFlowGuideContent.vue'

const PERPETUAL_FLOW_MODAL_TITLE = '永续合约流程（资金费率为 Mock 展示）'

type ListTab = 'USDT' | 'WATCHLIST'

const router = useRouter()
const market = useMarketStore()
const futures = useFuturesTradeStore()
const { tickers, loading, watchlistKeys } = storeToRefs(market)
const { symbol: activeSymbol } = storeToRefs(futures)

const search = ref('')
const tab = ref<ListTab>('USDT')
const perpetualFlowModalOpen = ref(false)

onMounted(() => {
  if (!tickers.value.length) void market.loadTickers()
})

watch(
  () => tickers.value.length,
  (n) => {
    if (n === 0) void market.loadTickers()
  },
)

const contractUsdtRows = computed(() =>
  tickers.value.filter((r) => r.kind === 'CONTRACT' && r.quoteAsset === 'USDT'),
)

const displayRows = computed(() => {
  let rows = contractUsdtRows.value
  if (tab.value === 'WATCHLIST') {
    rows = rows.filter((r) => watchlistKeys.value.has(pairWatchKey(r)))
  }
  const q = search.value.trim().toLowerCase()
  if (q) {
    rows = rows.filter(
      (r) =>
        r.baseAsset.toLowerCase().includes(q) ||
        r.displayPair.toLowerCase().includes(q) ||
        r.routeSymbol.toLowerCase().includes(q),
    )
  }
  return [...rows].sort((a, b) => b.quoteVolume - a.quoteVolume)
})

function changeClass(pct: number): string {
  if (!Number.isFinite(pct) || pct === 0) return 'cmqt__chg--flat'
  return pct > 0 ? 'cmqt__chg--up' : 'cmqt__chg--down'
}

function onRowNavigate(row: MarketTickerRow) {
  router.push({ name: RouteNames.ContractTrade, params: { symbol: row.routeSymbol } })
}

function onStarClick(ev: MouseEvent, row: MarketTickerRow) {
  ev.stopPropagation()
  market.toggleWatchlist(row)
}

function rowActive(row: MarketTickerRow): boolean {
  return row.routeSymbol.toUpperCase() === activeSymbol.value.toUpperCase()
}
</script>

<template>
  <section class="cmqt" aria-label="U 本位合约行情列表">
    <header class="cmqt__head">
      <div class="cmqt__title-left">
        <h3 class="cmqt__title">永续合约</h3>
        <button
          type="button"
          class="cmqt__info"
          aria-label="查看永续合约流程说明"
          @click="perpetualFlowModalOpen = true"
        >
          <span class="cmqt__info-icon" aria-hidden="true">i</span>
        </button>
      </div>
      <span class="cmqt__tag">U 本位</span>
    </header>

    <div class="cmqt__search">
      <input
        v-model="search"
        type="search"
        class="cmqt__input"
        placeholder="搜索"
        enterkeyhint="search"
        autocomplete="off"
        aria-label="搜索合约"
      />
    </div>

    <div class="cmqt__tabs" role="tablist" aria-label="行情分类">
      <button
        type="button"
        role="tab"
        class="cmqt__tab"
        :class="{ 'cmqt__tab--on': tab === 'USDT' }"
        :aria-selected="tab === 'USDT'"
        @click="tab = 'USDT'"
      >
        USDT
      </button>
      <button
        type="button"
        role="tab"
        class="cmqt__tab"
        :class="{ 'cmqt__tab--on': tab === 'WATCHLIST' }"
        :aria-selected="tab === 'WATCHLIST'"
        @click="tab = 'WATCHLIST'"
      >
        自选
      </button>
    </div>

    <div class="cmqt__grid-head">
      <span class="cmqt__gh cmqt__gh--pair">合约</span>
      <span class="cmqt__gh cmqt__gh--price">标记价</span>
      <span class="cmqt__gh cmqt__gh--chg">涨跌</span>
    </div>

    <div class="cmqt__scroll">
      <div v-if="loading && !displayRows.length" class="cmqt__hint">加载行情…</div>
      <p v-else-if="!displayRows.length" class="cmqt__empty">
        {{
          tab === 'WATCHLIST'
            ? '自选为空，点击星标添加或切换 USDT 浏览全部永续。'
            : '暂无 U 本位合约数据。'
        }}
      </p>
      <ul v-else class="cmqt__list" role="list">
        <li
          v-for="row in displayRows"
          :key="row.id"
          role="listitem"
          class="cmqt__row"
          :class="{ 'cmqt__row--active': rowActive(row) }"
          tabindex="0"
          @click="onRowNavigate(row)"
          @keydown.enter="onRowNavigate(row)"
        >
          <div class="cmqt__pair">
            <button
              type="button"
              class="cmqt__star"
              :aria-pressed="market.isInWatchlist(row)"
              :title="market.isInWatchlist(row) ? '取消自选' : '加入自选'"
              @click="onStarClick($event, row)"
            >
              {{ market.isInWatchlist(row) ? '★' : '☆' }}
            </button>
            <span class="cmqt__pair-txt">{{ row.baseAsset }}/{{ row.quoteAsset }}</span>
            <span class="cmqt__perp">永续</span>
          </div>
          <span class="cmqt__price ex-num">{{ formatPrice(row.lastPrice) }}</span>
          <span class="cmqt__chg ex-num" :class="changeClass(row.changePct)">
            {{ formatPct(row.changePct) }}
          </span>
        </li>
      </ul>
    </div>

    <footer class="cmqt__foot">
      <RouterLink :to="{ name: RouteNames.Market }" class="cmqt__more">全部行情</RouterLink>
    </footer>

    <TradeFlowInfoModal
      v-model="perpetualFlowModalOpen"
      :title="PERPETUAL_FLOW_MODAL_TITLE"
      accent="info"
    >
      <PerpetualFlowGuideContent />
    </TradeFlowInfoModal>
  </section>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

$cmqt-accent: rgba(48, 132, 252, 0.9);
$cmqt-accent-dim: rgba(48, 132, 252, 0.14);

.cmqt {
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1 1 50%;
  border: 1px solid $color-border;
  border-radius: $radius-md;
  background: var(--ex-elevated-panel-surface);
  box-shadow: var(--ex-elevated-panel-shadow);
  overflow: hidden;
}

.cmqt__head {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-2;
  padding: $space-2 $space-3;
  border-bottom: 1px solid $color-border;
  background: var(--ex-surface-inset-strong);
}

.cmqt__title-left {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.cmqt__title {
  margin: 0;
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
  letter-spacing: 0.02em;
}

.cmqt__info {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  padding: 0;
  border: 1px solid var(--ex-border);
  border-radius: 50%;
  background: transparent;
  color: $color-text-tertiary;
  font-size: 11px;
  font-weight: $font-weight-bold;
  font-style: italic;
  font-family: $font-family-base;
  line-height: 1;
  cursor: pointer;
  transition:
    color 0.15s ease,
    border-color 0.15s ease,
    background 0.15s ease;
}

.cmqt__info:hover,
.cmqt__info:focus-visible {
  color: $cmqt-accent;
  border-color: rgba(48, 132, 252, 0.45);
  background: $cmqt-accent-dim;
  outline: none;
}

.cmqt__tag {
  flex-shrink: 0;
  padding: 2px 8px;
  font-size: 10px;
  font-weight: $font-weight-bold;
  color: var(--ex-info);
  background: var(--ex-info-bg);
  border-radius: 4px;
  border: 1px solid color-mix(in srgb, var(--ex-info) 28%, transparent);
}

.cmqt__search {
  flex-shrink: 0;
  padding: $space-2 $space-2 0;
}

.cmqt__input {
  width: 100%;
  box-sizing: border-box;
  padding: 6px $space-2;
  font-size: $font-size-xs;
  color: $color-text-primary;
  background: var(--ex-surface-inset-strong);
  border: 1px solid var(--ex-border);
  border-radius: $radius-sm;
  outline: none;

  &::placeholder {
    color: $color-text-tertiary;
  }

  &:focus {
    border-color: rgba(48, 132, 252, 0.55);
    box-shadow: 0 0 0 1px rgba(48, 132, 252, 0.15);
  }
}

.cmqt__tabs {
  display: flex;
  gap: 2px;
  padding: $space-2;
  flex-shrink: 0;
}

.cmqt__tab {
  flex: 1;
  padding: 6px $space-2;
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  color: $color-text-tertiary;
  background: var(--ex-surface-inset);
  border: none;
  border-radius: $radius-sm;
  cursor: pointer;

  &--on {
    color: #e8f0ff;
    background: $cmqt-accent-dim;
    box-shadow: 0 0 0 1px rgba(48, 132, 252, 0.35);
  }
}

.cmqt__grid-head {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 78px 56px;
  align-items: center;
  padding: 4px $space-2 6px;
  font-size: 10px;
  font-weight: $font-weight-semibold;
  color: $color-text-tertiary;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid var(--ex-border-subtle);
  flex-shrink: 0;
}

.cmqt__gh--price,
.cmqt__gh--chg {
  text-align: right;
}

.cmqt__scroll {
  flex: 1;
  min-height: 120px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.cmqt__hint,
.cmqt__empty {
  margin: 0;
  padding: $space-4 $space-3;
  font-size: $font-size-xs;
  color: $color-text-tertiary;
  text-align: center;
  line-height: 1.5;
}

.cmqt__list {
  list-style: none;
  margin: 0;
  padding: 0;
  overflow-y: auto;
  flex: 1;
  scrollbar-width: thin;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: $color-border-strong;
    border-radius: 4px;
  }
}

.cmqt__row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 78px 56px;
  align-items: center;
  gap: 0 4px;
  min-height: 30px;
  padding: 4px $space-2;
  font-size: $font-size-xs;
  font-family: $font-family-mono;
  cursor: pointer;
  border-bottom: 1px solid transparent;
  transition: background 0.1s ease;

  &:hover {
    background: var(--ex-fill-ghost);
  }

  &--active {
    background: rgba(48, 132, 252, 0.1);
    box-shadow: inset 0 0 0 1px rgba(48, 132, 252, 0.22);
  }

  &:focus-visible {
    outline: 1px solid rgba(48, 132, 252, 0.55);
    outline-offset: -1px;
  }
}

.cmqt__pair {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
}

.cmqt__star {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  padding: 0;
  font-size: 12px;
  line-height: 1;
  color: $color-text-tertiary;
  background: transparent;
  border: none;
  border-radius: $radius-sm;
  cursor: pointer;

  &:hover {
    color: $cmqt-accent;
  }
}

.cmqt__pair-txt {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: $font-weight-semibold;
  color: $color-text-secondary;
}

.cmqt__perp {
  flex-shrink: 0;
  padding: 0 4px;
  font-size: 9px;
  font-weight: $font-weight-bold;
  color: $color-text-tertiary;
  background: var(--ex-fill-hover-subtle);
  border-radius: 2px;
}

.cmqt__price {
  text-align: right;
  font-weight: $font-weight-semibold;
  color: $color-text-primary;
  font-variant-numeric: tabular-nums;
}

.cmqt__chg {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.cmqt__chg--up {
  color: $color-rise;
}

.cmqt__chg--down {
  color: $color-fall;
}

.cmqt__chg--flat {
  color: $color-text-tertiary;
}

.cmqt__foot {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px $space-2;
  border-top: 1px solid var(--ex-border-subtle);
  background: var(--ex-panel-sunken);
}

.cmqt__more {
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  color: #8ab4ff;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

.ex-num {
  font-family: $font-family-mono;
}
</style>
