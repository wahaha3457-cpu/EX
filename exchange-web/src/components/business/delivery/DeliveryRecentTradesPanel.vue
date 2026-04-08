<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useDeliveryTradeStore } from '@/stores/deliveryTrade'
import { TradingRecentTrades } from '@/components/trading'

const props = withDefaults(
  defineProps<{
    tradesMaxHeight?: string
  }>(),
  { tradesMaxHeight: undefined },
)

const store = useDeliveryTradeStore()
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
