<script setup lang="ts">
/** 现货 K 线区：封装 TradingChartPanel，数据与周期由全局交易 store 驱动。 */
import { storeToRefs } from 'pinia'
import { useSpotTradeStore } from '@/stores/spotTrade'
import { TradingChartPanel } from '@/components/trading'

const store = useSpotTradeStore()
const { symbol, chartInterval } = storeToRefs(store)
</script>

<template>
  <TradingChartPanel surface="spot" :symbol="symbol" v-model:interval="chartInterval" />
</template>
