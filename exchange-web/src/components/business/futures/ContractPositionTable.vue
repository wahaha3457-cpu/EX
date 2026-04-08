<script setup lang="ts">
/** 合约持仓：Pinia → {@link PositionsTableRow} → {@link TradingPositionsTable} */
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useFuturesTradeStore } from '@/stores/futuresTrade'
import { TradingPositionsTable } from '@/components/trading'
import { mapFuturesPositionsToTableRows } from '@/composables/orders/mapPositionsToTableRows'

const store = useFuturesTradeStore()
const { positions, loading, symbol, quoteAsset, instrument } = storeToRefs(store)

const rows = computed(() =>
  mapFuturesPositionsToTableRows(positions.value, {
    perpetualUi: true,
    positionQtyAsUsdtNotional: true,
    contractSizeBase: instrument.value?.contractSizeBase ?? 0,
  }),
)
</script>

<template>
  <TradingPositionsTable
    :rows="rows"
    :loading="loading"
    :quote-asset="quoteAsset"
    :context-symbol="symbol"
    toolbar-title="当前持仓"
    @close="store.closePosition"
    @reverse="store.reversePosition"
  />
</template>
