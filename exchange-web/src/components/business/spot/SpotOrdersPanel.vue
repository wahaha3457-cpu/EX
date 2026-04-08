<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useSpotTradeStore } from '@/stores/spotTrade'
import type { SpotOrderDockTab } from '@/types/spotTrade'
import SpotOrderTabs from './SpotOrderTabs.vue'
import CurrentOrdersTable from './CurrentOrdersTable.vue'
import OrderHistoryTable from './OrderHistoryTable.vue'
import TradeHistoryTable from './TradeHistoryTable.vue'
import AssetOverviewMini from './AssetOverviewMini.vue'

const store = useSpotTradeStore()
const { openOrders } = storeToRefs(store)

const tab = ref<SpotOrderDockTab>('open')
</script>

<template>
  <section id="trade-orders" class="sop" aria-label="委托与成交">
    <SpotOrderTabs v-model="tab" :open-count="openOrders.length" />

    <CurrentOrdersTable v-if="tab === 'open'" />
    <OrderHistoryTable v-else-if="tab === 'history'" />
    <TradeHistoryTable v-else-if="tab === 'fills'" />
    <AssetOverviewMini v-else />
  </section>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.sop {
  border: 1px solid $color-border;
  border-radius: $radius-md;
  background: $color-bg-elevated;
  overflow: hidden;
  min-height: 200px;
  display: flex;
  flex-direction: column;
}
</style>
