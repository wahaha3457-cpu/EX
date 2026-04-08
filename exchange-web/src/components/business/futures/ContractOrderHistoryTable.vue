<script setup lang="ts">
/** 合约历史委托 */
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useFuturesTradeStore } from '@/stores/futuresTrade'
import { TradingOrderHistoryTable } from '@/components/trading'
import { mapFuturesHistoryOrdersToTableRows } from '@/composables/orders/mapHistoryOrdersToTableRows'

const store = useFuturesTradeStore()
const { historyOrders, loading, positions, instrument, markPrice, leverage, marginMode } =
  storeToRefs(store)

const rows = computed(() =>
  mapFuturesHistoryOrdersToTableRows(historyOrders.value, {
    positions: positions.value,
    instrument: instrument.value,
    markPrice: markPrice.value,
    defaultLeverage: leverage.value,
    defaultMarginMode: marginMode.value,
  }),
)
</script>

<template>
  <div class="coht-wrap">
    <TradingOrderHistoryTable variant="futures" :rows="rows" :loading="loading" toolbar-title="历史委托" />
  </div>
</template>

<style scoped lang="scss">
.coht-wrap {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
</style>
