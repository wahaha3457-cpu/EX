<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useDeliveryTradeStore } from '@/stores/deliveryTrade'
import { TradingChartPanel } from '@/components/trading'
import { compactUnderlying } from '@/api/delivery/deliverySymbols'

const store = useDeliveryTradeStore()
const { symbol, chartInterval, chartMainTab, ticker } = storeToRefs(store)

/** K 线服务按标的永续价演示，代码与永续一致 */
const klineSymbol = computed(() => compactUnderlying(symbol.value))

const settlementRate = computed(() => ticker.value?.settlementFundingRate ?? null)
</script>

<template>
  <TradingChartPanel
    surface="futures"
    futures-ui-variant="delivery"
    :symbol="klineSymbol"
    :delivery-settlement-funding-rate="settlementRate"
    chart-subtitle="交割合约在到期日现金结算；K 线与标的现货同源演示，深度与盘口字段对齐 Mock 推送。"
    v-model:interval="chartInterval"
    v-model:main-view-tab="chartMainTab"
  />
</template>
