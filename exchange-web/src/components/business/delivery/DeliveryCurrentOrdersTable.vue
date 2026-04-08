<script setup lang="ts">
/** 合约当前委托：映射 + {@link TradingCurrentOrdersTable} */
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useDeliveryTradeStore } from '@/stores/deliveryTrade'
import { TradingCurrentOrdersTable } from '@/components/trading'
import { mapFuturesOpenOrdersToCurrentTableRows } from '@/composables/orders/mapOpenOrdersToCurrentTableRows'

const store = useDeliveryTradeStore()
const { openOrders, loading, positions, instrument, markPrice, leverage, marginMode } =
  storeToRefs(store)

const rows = computed(() =>
  mapFuturesOpenOrdersToCurrentTableRows(openOrders.value, {
    positions: positions.value,
    instrument: instrument.value,
    markPrice: markPrice.value,
    defaultLeverage: leverage.value,
    defaultMarginMode: marginMode.value,
  }),
)
</script>

<template>
  <TradingCurrentOrdersTable
    variant="futures"
    :rows="rows"
    :loading="loading"
    toolbar-title="当前委托"
    @cancel="store.cancelOrder"
    @cancel-all="store.cancelAllOrders()"
  />
</template>
