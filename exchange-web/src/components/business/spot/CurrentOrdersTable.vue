<script setup lang="ts">
/** 现货当前委托：映射为 {@link TradingCurrentOrdersTable} */
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useSpotTradeStore } from '@/stores/spotTrade'
import { TradingCurrentOrdersTable } from '@/components/trading'
import { mapSpotOpenOrdersToCurrentTableRows } from '@/composables/orders/mapOpenOrdersToCurrentTableRows'

const store = useSpotTradeStore()
const { openOrders, loading } = storeToRefs(store)

const rows = computed(() => mapSpotOpenOrdersToCurrentTableRows(openOrders.value))
</script>

<template>
  <div class="cot-wrap">
    <TradingCurrentOrdersTable
      variant="spot"
      :rows="rows"
      :loading="loading"
      :spot-base-asset="store.baseAsset"
      :spot-quote-asset="store.quoteAsset"
      toolbar-title="当前委托"
      @cancel="store.cancelOrder"
      @cancel-all="store.cancelAllOrders()"
    />
  </div>
</template>

<style scoped lang="scss">
.cot-wrap {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
</style>
