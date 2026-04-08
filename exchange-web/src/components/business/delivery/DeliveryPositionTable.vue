<script setup lang="ts">
/** 合约持仓：Pinia → {@link PositionsTableRow} → {@link TradingPositionsTable} */
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useDeliveryTradeStore } from '@/stores/deliveryTrade'
import { TradingPositionsTable } from '@/components/trading'
import { mapFuturesPositionsToTableRows } from '@/composables/orders/mapPositionsToTableRows'

const store = useDeliveryTradeStore()
const { positions, loading, symbol, quoteAsset, deliveryClockMs, instrument } = storeToRefs(store)

const rows = computed(() =>
  mapFuturesPositionsToTableRows(positions.value, {
    nowMs: deliveryClockMs.value,
    positionQtyAsUsdtNotional: true,
    contractSizeBase: instrument.value?.contractSizeBase ?? 0,
    deliveryContractPeriodCode: true,
  }),
)
</script>

<template>
  <TradingPositionsTable
    variant="delivery"
    :rows="rows"
    :loading="loading"
    :quote-asset="quoteAsset"
    :context-symbol="symbol"
    toolbar-title="当前持仓"
    @close="store.closePosition"
    @reverse="store.reversePosition"
  />
</template>

<style lang="scss">
/* MessageBox 挂 body：交割反手确认 */
.ex-delivery-reverse-confirm-msgbox {
  width: min(400px, calc(100vw - 32px)) !important;
  border-radius: 12px !important;
  border: 1px solid color-mix(in srgb, var(--ex-warning, #f0b90b) 28%, var(--el-border-color-lighter)) !important;
  box-shadow:
    0 16px 40px color-mix(in srgb, #000 48%, transparent),
    0 0 64px color-mix(in srgb, var(--ex-warning, #f0b90b) 6%, transparent);
}

.ex-delivery-reverse-confirm-msgbox .el-message-box__message {
  font-size: 13px;
  line-height: 1.65;
  color: var(--ex-text-secondary, #b7bdc6);
}

.ex-delivery-reverse-confirm-msgbox .el-message-box__btns {
  padding-top: 8px;
}

.ex-delivery-reverse-confirm-msgbox .el-button--primary {
  font-weight: 700;
  border-radius: 8px;
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--ex-warning, #f0b90b) 90%, #fff) 0%,
    color-mix(in srgb, var(--ex-warning, #f0b90b) 72%, #b8860b) 100%
  ) !important;
  border: none !important;
  color: #1a1a1a !important;
}
</style>
