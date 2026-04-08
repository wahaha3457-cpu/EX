<script setup lang="ts">
/**
 * 现货交易页：将 Pinia 行情映射为 {@link TradingPairHeaderBar} 所需快照。
 */
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { RouteNames } from '@/constants/routeNames'
import { useSpotTradeStore } from '@/stores/spotTrade'
import { useMarketStore } from '@/stores/market'
import { TradingPairHeaderBar } from '@/components/trading'
import type { TradingPairHeaderMarketSnapshot } from '@/types/tradingPairHeader'
import PairSwitcher from './PairSwitcher.vue'

const spot = useSpotTradeStore()
const market = useMarketStore()
const { symbol, ticker, loading, baseAsset, quoteAsset } = storeToRefs(spot)
const route = useRoute()
const router = useRouter()

const productTag = computed(() => (route.meta.demoMode ? '模拟现货' : '现货'))

const displaySymbol = computed(() => symbol.value.replace('_', '/'))

const headerTicker = computed<TradingPairHeaderMarketSnapshot | null>(() => {
  const t = ticker.value
  if (!t) return null
  return {
    lastPrice: t.lastPrice,
    changePct24h: t.changePct,
    changeQuote24h: t.changeQuote24h,
    high24h: t.high24h,
    low24h: t.low24h,
    volume24hBase: t.volume24hBase,
    quoteVolume24h: t.quoteVolume24h,
  }
})

const isFav = computed(() => market.isSpotSymbolWatched(symbol.value))

function onToggleFavorite() {
  market.toggleSpotSymbolWatchlist(symbol.value)
}

function onOpenMarket() {
  router.push({ name: RouteNames.Market })
}
</script>

<template>
  <TradingPairHeaderBar
    mode="spot"
    :symbol-display="displaySymbol"
    :base-asset="baseAsset"
    :quote-asset="quoteAsset"
    :loading="loading"
    :ticker="headerTicker"
    :favorite-visible="false"
    :product-tag="productTag"
    @open-market="onOpenMarket"
  >
    <template #pair-selector>
      <PairSwitcher
        :symbol="symbol"
        :base-asset="baseAsset"
        :is-favorite="isFav"
        @toggle-favorite="onToggleFavorite"
      />
    </template>
  </TradingPairHeaderBar>
</template>
