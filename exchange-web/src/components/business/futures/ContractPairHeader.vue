<script setup lang="ts">
/**
 * 合约交易页顶部条：布局与 {@link DeliveryPairHeader} 统一（选币 + 合约类型分段 + 切回现货）。
 * 杠杆与保证金模式仅在下单区调整；顶栏仅展示只读摘要（与交割页一致）。
 */
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { RouteNames } from '@/constants/routeNames'
import { storeToRefs } from 'pinia'
import { useFuturesTradeStore } from '@/stores/futuresTrade'
import { useMarketStore } from '@/stores/market'
import { TradingPairHeaderBar, TradePairNameCluster, PairSwitcherModal } from '@/components/trading'
import type { PairSwitcherSelectPayload } from '@/types/pairSwitcherModal'
import type { TradingPairHeaderMarketSnapshot } from '@/types/tradingPairHeader'
import {
  DELIVERY_DEFAULT_SYMBOL,
  DELIVERY_QUICK_SYMBOLS,
} from '@/api/delivery/deliverySymbols'
import { formatPrice } from '@/utils/format'

const store = useFuturesTradeStore()
const { symbol, ticker, loading, baseAsset, quoteAsset, leverage, marginMode } = storeToRefs(store)
const market = useMarketStore()
const { tickers, loading: marketTickersLoading, watchlistKeys, hotRows } = storeToRefs(market)

const route = useRoute()
const router = useRouter()

const spotRouteForModal = computed(() =>
  route.meta.demoMode ? RouteNames.DemoSpotTrade : RouteNames.SpotTrade,
)

const pairModalOpen = ref(false)

watch(pairModalOpen, (open) => {
  if (open) void market.loadTickers()
})

const isFavorite = computed(() => market.isContractSymbolWatched(symbol.value))

function onToggleFavorite() {
  market.toggleContractSymbolWatchlist(symbol.value)
}

const now = ref(Date.now())
let tick: number | null = null

onMounted(() => {
  tick = window.setInterval(() => {
    now.value = Date.now()
  }, 1000)
})
onUnmounted(() => {
  if (tick) clearInterval(tick)
})

/** 由涨跌幅与最新价推算 24h 涨跌额（与 open 价口径一致时的代数关系） */
function changeQuoteFromPct(last: number, pct: number): number {
  if (!Number.isFinite(last) || !Number.isFinite(pct)) return 0
  const r = pct / 100
  return (last * r) / (1 + r)
}

const headerTicker = computed<TradingPairHeaderMarketSnapshot | null>(() => {
  const t = ticker.value
  if (!t) return null
  return {
    lastPrice: t.lastPrice,
    changePct24h: t.changePct24h,
    changeQuote24h: changeQuoteFromPct(t.lastPrice, t.changePct24h),
    high24h: t.high24h,
    low24h: t.low24h,
    volume24hBase: t.volume24hBase,
    quoteVolume24h: t.quoteVolume24h,
    markPrice: t.markPrice,
    indexPrice: t.indexPrice,
    fundingRate: t.fundingRate,
    nextFundingTime: t.nextFundingTime,
  }
})

const fundingCountdownDisplay = computed(() => {
  const iso = ticker.value?.nextFundingTime
  if (!iso) return ''
  const end = new Date(iso).getTime()
  let left = Math.max(0, Math.floor((end - now.value) / 1000))
  const h = Math.floor(left / 3600)
  left %= 3600
  const m = Math.floor(left / 60)
  const s = left % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})

const displaySymbol = computed(() => symbol.value.replace(/USDT$/i, '/USDT'))

function onPairModalSelect(p: PairSwitcherSelectPayload) {
  if (p.row.kind === 'CONTRACT') {
    router.push({ name: RouteNames.ContractTrade, params: { symbol: p.row.routeSymbol } })
  } else {
    router.push({ name: spotRouteForModal.value, params: { symbol: p.row.routeSymbol } })
  }
  pairModalOpen.value = false
}

function openPairModal() {
  pairModalOpen.value = true
}

function onOpenMarket() {
  router.push({ name: RouteNames.Market })
}

/** 与交割页同一套演示交割代码映射 */
function deliverySymbolForCurrentBase(): string {
  const b = (baseAsset.value ?? 'BTC').toUpperCase()
  const hit = DELIVERY_QUICK_SYMBOLS.find((s) => s.toUpperCase().startsWith(b))
  return hit ?? DELIVERY_DEFAULT_SYMBOL
}

function onOpenDelivery() {
  router.push({ name: RouteNames.DeliveryContract, params: { symbol: deliverySymbolForCurrentBase() } })
}

function spotSymbolParam(): string {
  const b = baseAsset.value ?? 'BTC'
  return `${b}_USDT`
}
</script>

<template>
  <TradingPairHeaderBar
    mode="futures"
    :symbol-display="displaySymbol"
    :base-asset="baseAsset"
    :quote-asset="quoteAsset"
    :loading="loading"
    :ticker="headerTicker"
    :leverage="leverage"
    :margin-mode="marginMode"
    :funding-countdown-display="fundingCountdownDisplay"
    :favorite-visible="false"
    product-tag="U 本位永续"
    @open-market="onOpenMarket"
    @click-last-price="(p) => (store.priceInput = formatPrice(p))"
  >
    <template #pair-selector>
      <div class="cph-pair">
        <TradePairNameCluster
          :base-asset="baseAsset ?? 'BTC'"
          :is-favorite="isFavorite"
          @toggle-favorite="onToggleFavorite"
        >
          <button
            type="button"
            class="cph-select cph-select--trigger"
            aria-haspopup="dialog"
            :aria-expanded="pairModalOpen"
            aria-label="选择合约交易对"
            @click="openPairModal"
          >
            <span class="cph-select__sym">{{ displaySymbol }}</span>
            <svg class="cph-select__chev" width="10" height="6" viewBox="0 0 10 6" aria-hidden="true">
              <path
                d="M1 1.2 L5 4.8 L9 1.2"
                fill="none"
                stroke="currentColor"
                stroke-width="1.35"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
        </TradePairNameCluster>
        <PairSwitcherModal
          v-model="pairModalOpen"
          :current-route-symbol="symbol"
          page-context="futures"
          :rows="tickers"
          :hot-rows="hotRows"
          :loading="marketTickersLoading"
          :watchlist-keys="watchlistKeys"
          @select="onPairModalSelect"
          @toggle-favorite="market.toggleWatchlist($event.row)"
        />
        <div class="cph-seg" role="group" aria-label="合约类型">
          <span class="cph-seg__btn cph-seg__btn--on" aria-current="page">永续合约</span>
          <button type="button" class="cph-seg__btn" @click="onOpenDelivery">交割合约</button>
        </div>
        <RouterLink
          class="cph-link cph-link--spot"
          :to="{ name: RouteNames.SpotTrade, params: { symbol: spotSymbolParam() } }"
        >
          切回现货
        </RouterLink>
      </div>
    </template>
  </TradingPairHeaderBar>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

/* 与 DeliveryPairHeader（dph-*）同一套尺寸与层级，保持永续 / 交割顶栏一致 */
.cph-select--trigger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 200px;
  max-width: min(240px, 46vw);
}

.cph-select__sym {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: left;
}

.cph-select__chev {
  flex-shrink: 0;
  color: var(--ex-text-tertiary);
  opacity: 0.9;
}

.cph-select {
  padding: 6px 10px;
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  font-family: $font-family-mono;
  color: $color-text-primary;
  background: $color-bg-base;
  border: 1px solid $color-border;
  border-radius: $radius-sm;
  cursor: pointer;
}

.cph-select:hover {
  border-color: rgba(240, 185, 11, 0.4);
}

.cph-pair {
  display: flex;
  align-items: center;
  gap: $space-2;
  flex-wrap: wrap;
}

.cph-link {
  padding: 6px 10px;
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  color: #8ab4ff;
  background: rgba(48, 132, 252, 0.1);
  border: 1px solid rgba(48, 132, 252, 0.28);
  border-radius: $radius-sm;
  cursor: pointer;
  white-space: nowrap;
}

.cph-link:hover {
  background: rgba(48, 132, 252, 0.16);
}

.cph-link--spot {
  text-decoration: none;
  display: inline-flex;
  align-items: center;
}

.cph-seg {
  display: inline-flex;
  border-radius: $radius-sm;
  border: 1px solid $color-border;
  overflow: hidden;
  background: var(--ex-surface-inset);
}

.cph-seg__btn {
  padding: 6px 10px;
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  color: $color-text-tertiary;
  background: transparent;
  border: none;
  cursor: pointer;
}

.cph-seg__btn:hover:not(.cph-seg__btn--on) {
  color: $color-text-secondary;
  background: var(--ex-fill-ghost);
}

.cph-seg__btn--on {
  color: $color-text-primary;
  background: rgba(240, 185, 11, 0.12);
  box-shadow: inset 0 0 0 1px rgba(240, 185, 11, 0.28);
  cursor: default;
}
</style>
