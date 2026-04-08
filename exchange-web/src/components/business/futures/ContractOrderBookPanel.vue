<script setup lang="ts">
/** 合约盘口：标记价居中展示，深度数据结构同现货。 */
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useFuturesTradeStore } from '@/stores/futuresTrade'
import { TradingOrderBook } from '@/components/trading'
import { formatPrice } from '@/utils/format/number'

const store = useFuturesTradeStore()
const { depth, ticker, loading } = storeToRefs(store)

const lastPrice = computed(() => ticker.value?.lastPrice ?? 0)
const markPrice = computed(() => ticker.value?.markPrice ?? null)
const changePct = computed(() => ticker.value?.changePct24h ?? null)

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
    :mid-price="markPrice"
    :base-asset="store.baseAsset"
    :quote-asset="store.quoteAsset"
    :seq="depth?.seq ?? null"
    :loading="loading"
    mid-price-label="标记"
    :quantity-decimals="3"
    @select-ask="onSelectPrice"
    @select-bid="onSelectPrice"
  />
</template>
