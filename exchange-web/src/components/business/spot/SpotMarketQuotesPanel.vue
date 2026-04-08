<script setup lang="ts">
/**
 * 现货交易页右侧「行情列表」：对齐币安现货右栏上半区（搜索 + Tab + 列表 + 星标）。
 * 数据来自 {@link useMarketStore}，与行情中心 / 切换弹窗共用 ticker 池。
 */
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { RouteNames } from '@/constants/routeNames'
import { useMarketStore } from '@/stores/market'
import { useSpotTradeStore } from '@/stores/spotTrade'
import { pairWatchKey } from '@/composables/pairSwitcher/pairWatchKey'
import { formatPct, formatPrice } from '@/utils/format/tradingDisplay'
import type { MarketTickerRow } from '@/types/market'

type ListTab = 'USDT' | 'WATCHLIST'

const router = useRouter()
const market = useMarketStore()
const spot = useSpotTradeStore()
const { tickers, loading, watchlistKeys } = storeToRefs(market)
const { symbol: activeSymbol } = storeToRefs(spot)

const search = ref('')
const tab = ref<ListTab>('USDT')

onMounted(() => {
  if (!tickers.value.length) void market.loadTickers()
})

watch(
  () => tickers.value.length,
  (n) => {
    if (n === 0) void market.loadTickers()
  },
)

const spotUsdtRows = computed(() =>
  tickers.value.filter((r) => r.kind === 'SPOT' && r.quoteAsset === 'USDT'),
)

const displayRows = computed(() => {
  let rows = spotUsdtRows.value
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
  if (!Number.isFinite(pct) || pct === 0) return 'smqt__chg--flat'
  return pct > 0 ? 'smqt__chg--up' : 'smqt__chg--down'
}

function onRowNavigate(row: MarketTickerRow) {
  router.push({ name: RouteNames.SpotTrade, params: { symbol: row.routeSymbol } })
}

function onStarClick(ev: MouseEvent, row: MarketTickerRow) {
  ev.stopPropagation()
  market.toggleWatchlist(row)
}

function rowActive(row: MarketTickerRow): boolean {
  return row.routeSymbol === activeSymbol.value
}
</script>

<template>
  <section class="smqt" aria-label="现货行情列表">
    <header class="smqt__head">
      <h3 class="smqt__title">市场</h3>
    </header>

    <div class="smqt__search">
      <input
        v-model="search"
        type="search"
        class="smqt__input"
        placeholder="搜索"
        enterkeyhint="search"
        autocomplete="off"
        aria-label="搜索交易对"
      />
    </div>

    <div class="smqt__tabs" role="tablist" aria-label="行情分类">
      <button
        type="button"
        role="tab"
        class="smqt__tab"
        :class="{ 'smqt__tab--on': tab === 'USDT' }"
        :aria-selected="tab === 'USDT'"
        @click="tab = 'USDT'"
      >
        USDT
      </button>
      <button
        type="button"
        role="tab"
        class="smqt__tab"
        :class="{ 'smqt__tab--on': tab === 'WATCHLIST' }"
        :aria-selected="tab === 'WATCHLIST'"
        @click="tab = 'WATCHLIST'"
      >
        自选
      </button>
    </div>

    <div class="smqt__grid-head">
      <span class="smqt__gh smqt__gh--pair">交易对</span>
      <span class="smqt__gh smqt__gh--price">最新价</span>
      <span class="smqt__gh smqt__gh--chg">涨跌</span>
    </div>

    <div class="smqt__scroll">
      <div v-if="loading && !displayRows.length" class="smqt__hint">加载行情…</div>
      <p v-else-if="!displayRows.length" class="smqt__empty">
        {{
          tab === 'WATCHLIST'
            ? '自选为空，点击星标添加或切换 USDT 浏览全部现货。'
            : '暂无 USDT 现货数据。'
        }}
      </p>
      <ul v-else class="smqt__list" role="list">
        <li
          v-for="row in displayRows"
          :key="row.id"
          role="listitem"
          class="smqt__row"
          :class="{ 'smqt__row--active': rowActive(row) }"
          tabindex="0"
          @click="onRowNavigate(row)"
          @keydown.enter="onRowNavigate(row)"
        >
          <div class="smqt__pair">
            <button
              type="button"
              class="smqt__star"
              :aria-pressed="market.isInWatchlist(row)"
              :title="market.isInWatchlist(row) ? '取消自选' : '加入自选'"
              @click="onStarClick($event, row)"
            >
              {{ market.isInWatchlist(row) ? '★' : '☆' }}
            </button>
            <span class="smqt__pair-txt">{{ row.baseAsset }}/{{ row.quoteAsset }}</span>
          </div>
          <span class="smqt__price ex-num">{{ formatPrice(row.lastPrice) }}</span>
          <span class="smqt__chg ex-num" :class="changeClass(row.changePct)">
            {{ formatPct(row.changePct) }}
          </span>
        </li>
      </ul>
    </div>

    <footer class="smqt__foot">
      <RouterLink :to="{ name: RouteNames.Market }" class="smqt__more">全部行情</RouterLink>
    </footer>
  </section>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.smqt {
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1 1 50%;
  border: 1px solid $color-border;
  border-radius: $radius-md;
  background: var(--ex-modal-surface);
  overflow: hidden;
}

.smqt__head {
  flex-shrink: 0;
  padding: $space-2 $space-3;
  border-bottom: 1px solid $color-border;
  background: var(--ex-surface-inset-strong);
}

.smqt__title {
  margin: 0;
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
  letter-spacing: 0.02em;
}

.smqt__search {
  flex-shrink: 0;
  padding: $space-2 $space-2 0;
}

.smqt__input {
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
    border-color: rgba(240, 185, 11, 0.45);
    box-shadow: 0 0 0 1px rgba(240, 185, 11, 0.12);
  }
}

.smqt__tabs {
  display: flex;
  gap: 2px;
  padding: $space-2;
  flex-shrink: 0;
}

.smqt__tab {
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
    color: $color-text-primary;
    background: rgba(240, 185, 11, 0.12);
    box-shadow: 0 0 0 1px rgba(240, 185, 11, 0.2);
  }
}

.smqt__grid-head {
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

.smqt__gh--price,
.smqt__gh--chg {
  text-align: right;
}

.smqt__scroll {
  flex: 1;
  min-height: 120px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.smqt__hint,
.smqt__empty {
  margin: 0;
  padding: $space-4 $space-3;
  font-size: $font-size-xs;
  color: $color-text-tertiary;
  text-align: center;
  line-height: 1.5;
}

.smqt__list {
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

.smqt__row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 78px 56px;
  align-items: center;
  gap: 0 4px;
  min-height: 28px;
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
    background: rgba(240, 185, 11, 0.08);
    box-shadow: inset 0 0 0 1px rgba(240, 185, 11, 0.15);
  }

  &:focus-visible {
    outline: 1px solid rgba(240, 185, 11, 0.5);
    outline-offset: -1px;
  }
}

.smqt__pair {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
}

.smqt__star {
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
    color: $color-brand;
  }
}

.smqt__pair-txt {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: $font-weight-semibold;
  color: $color-text-secondary;
}

.smqt__price {
  text-align: right;
  font-weight: $font-weight-semibold;
  color: $color-text-primary;
  font-variant-numeric: tabular-nums;
}

.smqt__chg {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.smqt__chg--up {
  color: $color-rise;
}

.smqt__chg--down {
  color: $color-fall;
}

.smqt__chg--flat {
  color: $color-text-tertiary;
}

.smqt__foot {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px $space-2;
  border-top: 1px solid var(--ex-border-subtle);
  background: var(--ex-panel-sunken);
}

.smqt__more {
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  color: $color-brand;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

.ex-num {
  font-family: $font-family-mono;
}
</style>
