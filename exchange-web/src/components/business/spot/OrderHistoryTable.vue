<script setup lang="ts">
/** 现货历史委托 */
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useSpotTradeStore } from '@/stores/spotTrade'
import { TradingOrderHistoryTable } from '@/components/trading'
import { mapSpotHistoryOrdersToTableRows } from '@/composables/orders/mapHistoryOrdersToTableRows'

const store = useSpotTradeStore()
const { historyOrders, loading } = storeToRefs(store)

const rows = computed(() => mapSpotHistoryOrdersToTableRows(historyOrders.value))
</script>

<template>
  <div class="oht-wrap">
    <TradingOrderHistoryTable
      variant="spot"
      :rows="rows"
      :loading="loading"
      toolbar-title="历史委托"
      :spot-base-asset="store.baseAsset"
      :spot-quote-asset="store.quoteAsset"
    />
  </div>
</template>

<style scoped lang="scss">
.oht-wrap {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
</style>
