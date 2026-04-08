<script setup lang="ts">
/**
 * 交割合约页顶栏：基差 + 交割倒计时；杠杆与保证金模式在下单区委托类型下方操作。
 */
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { RouteNames } from '@/constants/routeNames'
import { storeToRefs } from 'pinia'
import { useDeliveryTradeStore } from '@/stores/deliveryTrade'
import { useMarketStore } from '@/stores/market'
import { TradingPairHeaderBar, TradePairNameCluster, PairSwitcherModal } from '@/components/trading'
import type { PairSwitcherSelectPayload } from '@/types/pairSwitcherModal'
import type { MarketTickerRow } from '@/types/market'
import { formatPrice } from '@/utils/format/number'
import type { TradingPairHeaderMarketSnapshot } from '@/types/tradingPairHeader'
import { DELIVERY_DEMO_STAGGER_MS, DELIVERY_QUICK_SYMBOLS } from '@/api/delivery/deliverySymbols'
import {
  currentUtcMinuteStartMs,
  deliveryDemoCycleLabel,
  formatDeliveryCountdownHms,
  secondsUntilUtcSlotEnd,
} from '@/composables/delivery/deliveryCycleUtils'

const store = useDeliveryTradeStore()
const {
  symbol,
  ticker,
  loading,
  baseAsset,
  quoteAsset,
  leverage,
  marginMode,
  instrument,
  deliveryClockMs,
  orderableSlotOffset,
} = storeToRefs(store)
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

function buildDeliveryModalRow(sym: string): MarketTickerRow {
  const m = sym.match(/^([A-Z]+)USDT_/i)
  const baseAsset = m ? m[1] : 'BTC'
  return {
    id: `DELIVERY:${sym}`,
    kind: 'CONTRACT',
    displayPair: `${baseAsset}/USDT · ${deliveryDemoCycleLabel(sym)}`,
    routeSymbol: sym,
    baseAsset,
    quoteAsset: 'USDT',
    lastPrice: 0,
    changePct: 0,
    high24h: 0,
    low24h: 0,
    volumeBase: 0,
    quoteVolume: 0,
  }
}

const modalRows = computed(() => {
  const out = [...tickers.value]
  const routes = new Set(out.map((r) => r.routeSymbol))
  for (const sym of DELIVERY_QUICK_SYMBOLS) {
    if (!routes.has(sym)) {
      out.push(buildDeliveryModalRow(sym))
      routes.add(sym)
    }
  }
  return out
})

function isDeliveryRouteSymbol(s: string): boolean {
  return /^[A-Z0-9]+USDT_\d{6}$/i.test(s)
}

function onPairModalSelect(p: PairSwitcherSelectPayload) {
  const sym = p.row.routeSymbol
  if (isDeliveryRouteSymbol(sym)) {
    router.push({ name: RouteNames.DeliveryContract, params: { symbol: sym } })
  } else if (p.row.kind === 'SPOT') {
    router.push({ name: spotRouteForModal.value, params: { symbol: sym } })
  } else {
    router.push({ name: RouteNames.ContractTrade, params: { symbol: sym } })
  }
  pairModalOpen.value = false
}

function openPairModal() {
  pairModalOpen.value = true
}

const isFavorite = computed(() => market.isDeliverySymbolWatched(symbol.value))

function onToggleFavorite() {
  market.toggleDeliverySymbolWatchlist(symbol.value)
}

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
    basisPct: t.basisPct,
    /** 与下单区所选「第 N 档」同一演示刻度，避免顶栏仍显示当前分钟 */
    deliveryTime: new Date(
      currentUtcMinuteStartMs(deliveryClockMs.value) +
        orderableSlotOffset.value * DELIVERY_DEMO_STAGGER_MS,
    ).toISOString(),
    settlementFundingRate: t.settlementFundingRate,
  }
})

const deliveryCountdownDisplay = computed(() => {
  const now = deliveryClockMs.value
  const slotStart =
    currentUtcMinuteStartMs(now) + orderableSlotOffset.value * DELIVERY_DEMO_STAGGER_MS
  const sec = secondsUntilUtcSlotEnd(now, slotStart)
  return formatDeliveryCountdownHms(sec)
})

const displaySymbol = computed(() => {
  const inst = instrument.value
  if (inst) return `${inst.baseAsset}/${inst.quoteAsset} · ${inst.cycleLabel}`
  return symbol.value.replace(/USDT_/i, '/USDT · ')
})

function onOpenMarket() {
  router.push({ name: RouteNames.Market })
}

function onOpenPerp() {
  const base = instrument.value?.baseAsset ?? 'BTC'
  router.push({ name: RouteNames.ContractTrade, params: { symbol: `${base}USDT` } })
}

function spotSymbolParam() {
  const b = instrument.value?.baseAsset ?? 'BTC'
  return `${b}_USDT`
}
</script>

<template>
  <div class="dph">
    <TradingPairHeaderBar
      mode="delivery"
      :symbol-display="displaySymbol"
      :base-asset="baseAsset"
      :quote-asset="quoteAsset"
      :loading="loading"
      :ticker="headerTicker"
      :leverage="leverage"
      :margin-mode="marginMode"
      :funding-countdown-display="deliveryCountdownDisplay"
      :favorite-visible="false"
      product-tag="USDT 交割"
      @open-market="onOpenMarket"
      @click-last-price="(p) => (store.priceInput = formatPrice(p))"
    >
      <template #pair-selector>
        <div class="dph-pair">
          <TradePairNameCluster
            :base-asset="baseAsset ?? 'BTC'"
            :is-favorite="isFavorite"
            @toggle-favorite="onToggleFavorite"
          >
            <button
              type="button"
              class="dph-select dph-select--trigger"
              aria-haspopup="dialog"
              :aria-expanded="pairModalOpen"
              aria-label="选择交割合约"
              @click="openPairModal"
            >
              <span class="dph-select__sym">{{ displaySymbol }}</span>
              <svg class="dph-select__chev" width="10" height="6" viewBox="0 0 10 6" aria-hidden="true">
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
            :rows="modalRows"
            :hot-rows="hotRows"
            :loading="marketTickersLoading"
            :watchlist-keys="watchlistKeys"
            @select="onPairModalSelect"
            @toggle-favorite="market.toggleWatchlist($event.row)"
          />
          <div class="dph-seg" role="group" aria-label="合约类型">
            <button type="button" class="dph-seg__btn" @click="onOpenPerp">永续合约</button>
            <span class="dph-seg__btn dph-seg__btn--on" aria-current="page">交割合约</span>
          </div>
          <RouterLink
            class="dph-link dph-link--spot"
            :to="{ name: RouteNames.SpotTrade, params: { symbol: spotSymbolParam() } }"
          >
            切回现货
          </RouterLink>
        </div>
      </template>
    </TradingPairHeaderBar>
    <p v-if="instrument" class="dph__hint">
      交割合约到期将按规则现金结算或交割；请在到期前自行平仓或关注自动展期说明（演示数据）。
    </p>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.dph__hint {
  margin: -4px 0 $space-2;
  padding: $space-2 $space-3;
  font-size: $font-size-xs;
  line-height: 1.45;
  color: $color-text-tertiary;
  border-radius: $radius-sm;
  border: 1px solid rgba(240, 185, 11, 0.2);
  background: rgba(240, 185, 11, 0.06);
}

.dph-select--trigger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: min(200px, 36vw);
  max-width: min(320px, 52vw);
}

.dph-select__sym {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: left;
}

.dph-select__chev {
  flex-shrink: 0;
  color: var(--ex-text-tertiary);
  opacity: 0.9;
}

.dph-select {
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

.dph-select:hover {
  border-color: rgba(240, 185, 11, 0.4);
}

.dph-pair {
  display: flex;
  align-items: center;
  gap: $space-2;
  flex-wrap: wrap;
}

.dph-link {
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

.dph-link:hover {
  background: rgba(48, 132, 252, 0.16);
}

.dph-link--spot {
  text-decoration: none;
  display: inline-flex;
  align-items: center;
}

.dph-seg {
  display: inline-flex;
  border-radius: $radius-sm;
  border: 1px solid $color-border;
  overflow: hidden;
  background: var(--ex-surface-inset);
}

.dph-seg__btn {
  padding: 6px 10px;
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  color: $color-text-tertiary;
  background: transparent;
  border: none;
  cursor: pointer;
}

.dph-seg__btn:hover:not(.dph-seg__btn--on) {
  color: $color-text-secondary;
  background: var(--ex-fill-ghost);
}

.dph-seg__btn--on {
  color: $color-text-primary;
  background: rgba(240, 185, 11, 0.12);
  box-shadow: inset 0 0 0 1px rgba(240, 185, 11, 0.28);
  cursor: default;
}
</style>
