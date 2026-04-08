<script setup lang="ts">
/** 合约当前委托 */
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useFuturesTradeStore } from '@/stores/futuresTrade'
import { TradingCurrentOrdersTable } from '@/components/trading'
import { mapFuturesOpenOrdersToCurrentTableRows } from '@/composables/orders/mapOpenOrdersToCurrentTableRows'

const store = useFuturesTradeStore()
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
  <div class="ccot-wrap">
    <TradingCurrentOrdersTable
      variant="futures"
      :rows="rows"
      :loading="loading"
      toolbar-title="当前委托"
      @cancel="store.cancelOrder"
      @cancel-all="store.cancelAllOrders()"
    />
  </div>
</template>

<style scoped lang="scss">
.ccot-wrap {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
</style>
