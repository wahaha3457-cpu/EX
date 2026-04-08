<script setup lang="ts">
/** 现货盘口：接入 Pinia 深度与行情；点击档位回填委托价。 */
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useSpotTradeStore } from '@/stores/spotTrade'
import { TradingOrderBook } from '@/components/trading'
import { formatPrice } from '@/utils/format/number'

const store = useSpotTradeStore()
const { depth, ticker, loading } = storeToRefs(store)

const lastPrice = computed(() => ticker.value?.lastPrice ?? 0)
const changePct = computed(() => ticker.value?.changePct ?? null)

function onSelectPrice(p: number) {
  store.priceInput = formatPrice(p)
}
</script>

<template>
  <TradingOrderBook
    :asks="depth?.asks ?? []"
    :bids="depth?.bids ?? []"
    :last-price="lastPrice"
    :change-pct="changePct"
    :base-asset="store.baseAsset"
    :quote-asset="store.quoteAsset"
    :seq="depth?.seq ?? null"
    :loading="loading"
    mid-price-label="最新"
    :quantity-decimals="4"
    @select-ask="onSelectPrice"
    @select-bid="onSelectPrice"
  />
</template>
