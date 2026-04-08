<script setup lang="ts">
/**
 * 合约 K 线 / 深度区：封装 {@link TradingChartPanel}（含 U 本位主图 Tab）。
 */
import { storeToRefs } from 'pinia'
import { useFuturesTradeStore } from '@/stores/futuresTrade'
import { TradingChartPanel } from '@/components/trading'

const store = useFuturesTradeStore()
const { symbol, chartInterval, chartMainTab } = storeToRefs(store)
</script>

<template>
  <TradingChartPanel
    surface="futures"
    :symbol="symbol"
    v-model:interval="chartInterval"
    v-model:main-view-tab="chartMainTab"
  />
</template>
