<script setup lang="ts">
/** 合约最新成交：数据结构与现货一致 */
import { storeToRefs } from 'pinia'
import { useFuturesTradeStore } from '@/stores/futuresTrade'
import { TradingRecentTrades } from '@/components/trading'

const props = withDefaults(
  defineProps<{
    tradesMaxHeight?: string
  }>(),
  { tradesMaxHeight: undefined },
)

const store = useFuturesTradeStore()
const { trades, loading } = storeToRefs(store)
</script>

<template>
  <TradingRecentTrades
    :trades="trades"
    :max-rows="24"
    :base-asset="store.baseAsset"
    :quote-asset="store.quoteAsset"
    :quantity-decimals="4"
    :loading="loading"
    :max-height="props.tradesMaxHeight"
  />
</template>
