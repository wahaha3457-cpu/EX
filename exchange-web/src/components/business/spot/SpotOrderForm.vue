<script setup lang="ts">
/** 现货下单业务壳：Pinia 状态绑定 TradingSpotOrderForm */
import { storeToRefs } from 'pinia'
import { useSpotTradeStore } from '@/stores/spotTrade'
import { TradingSpotOrderForm } from '@/components/trading'

const store = useSpotTradeStore()
const {
  symbol,
  formSide,
  formType,
  priceInput,
  qtyInput,
  quoteQtyInput,
  takeProfitPriceInput,
  stopLossPriceInput,
  tpSlAttachEnabled,
  conditionalTriggerPriceInput,
  baseAvailable,
  quoteAvailable,
  ticker,
  loading,
} = storeToRefs(store)

function onPrice(v: string) {
  priceInput.value = v
}
function onQty(v: string) {
  qtyInput.value = v
}
function onQuote(v: string) {
  quoteQtyInput.value = v
}
function onTriggerPrice(v: string) {
  conditionalTriggerPriceInput.value = v
}
function onTpSlAttach(v: boolean) {
  tpSlAttachEnabled.value = v
}
function onTakeProfitPrice(v: string) {
  takeProfitPriceInput.value = v
}
function onStopLossPrice(v: string) {
  stopLossPriceInput.value = v
}
</script>

<template>
  <TradingSpotOrderForm
    :symbol="symbol"
    :side="formSide"
    :order-type="formType"
    :trigger-price="conditionalTriggerPriceInput"
    :tp-sl-attach-enabled="tpSlAttachEnabled"
    :take-profit-price="takeProfitPriceInput"
    :stop-loss-price="stopLossPriceInput"
    :price="priceInput"
    :quantity="qtyInput"
    :quote-qty="quoteQtyInput"
    :base-asset="store.baseAsset"
    :quote-asset="store.quoteAsset"
    :base-available="baseAvailable"
    :quote-available="quoteAvailable"
    :last-price="ticker?.lastPrice ?? null"
    :loading="loading"
    @update:side="store.setFormSide"
    @update:order-type="store.setFormType"
    @update:trigger-price="onTriggerPrice"
    @update:tp-sl-attach-enabled="onTpSlAttach"
    @update:take-profit-price="onTakeProfitPrice"
    @update:stop-loss-price="onStopLossPrice"
    @update:price="onPrice"
    @update:quantity="onQty"
    @update:quote-qty="onQuote"
    @apply-percent="store.applyQtyPercent"
    @submit="store.placeOrder"
  />
</template>
