<script setup lang="ts">
/** 现货最新成交：Pinia 注入 TradingRecentTrades */
import { storeToRefs } from 'pinia'
import { useSpotTradeStore } from '@/stores/spotTrade'
import { TradingRecentTrades } from '@/components/trading'

const props = withDefaults(
  defineProps<{
    /** 右栏与行情叠放时传入，控制成交列表最大高度 */
    tradesMaxHeight?: string
  }>(),
  { tradesMaxHeight: undefined },
)

const store = useSpotTradeStore()
const { trades, loading } = storeToRefs(store)
</script>

<template>
  <TradingRecentTrades
    :trades="trades"
    :max-rows="22"
    :base-asset="store.baseAsset"
    :quote-asset="store.quoteAsset"
    :quantity-decimals="5"
    :loading="loading"
    :max-height="props.tradesMaxHeight"
  />
</template>
