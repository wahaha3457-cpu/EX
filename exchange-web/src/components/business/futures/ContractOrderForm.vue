<script setup lang="ts">
/** 合约下单：Pinia 绑定 {@link TradingContractOrderForm}；杠杆/模式与交割页同款紧凑控件 + 弹窗 */
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useFuturesTradeStore } from '@/stores/futuresTrade'
import { TradingContractOrderForm } from '@/components/trading'
import LeverageControl from './LeverageControl.vue'
import MarginModeSwitcher from './MarginModeSwitcher.vue'

const store = useFuturesTradeStore()
const {
  symbol,
  positionSide,
  formType,
  priceInput,
  qtyInput,
  leverage,
  marginMode,
  tpSlEnabled,
  tpPriceInput,
  slPriceInput,
  availableQuote,
  marginBalance,
  maxOpenNotionalUsdt,
  instrument,
  loading,
} = storeToRefs(store)

const maxLev = computed(() => instrument.value?.maxLeverage ?? 125)

function onPrice(v: string) {
  priceInput.value = v
}
function onQty(v: string) {
  qtyInput.value = v
}
function onTp(v: string) {
  tpPriceInput.value = v
}
function onSl(v: string) {
  slPriceInput.value = v
}

function setTpSlEnabled(v: boolean) {
  tpSlEnabled.value = v
}
</script>

<template>
  <div class="cof">
    <TradingContractOrderForm
      embed-delivery-lev-margin
      :symbol="symbol"
      :position-side="positionSide"
      :form-type="formType"
      :price="priceInput"
      :quantity="qtyInput"
      :leverage="leverage"
      :max-leverage="maxLev"
      :margin-mode="marginMode"
      :base-asset="store.baseAsset"
      :quote-asset="store.quoteAsset"
      :wallet-asset="store.walletAsset"
      :available-quote="availableQuote"
      :margin-balance="marginBalance"
      :max-open-notional-usdt="maxOpenNotionalUsdt"
      :mark-price="store.markPrice"
      :tp-sl-enabled="tpSlEnabled"
      :tp-price-input="tpPriceInput"
      :sl-price-input="slPriceInput"
      :loading="loading"
      @update:position-side="store.setPositionSide"
      @update:form-type="store.setFormType"
      @update:price="onPrice"
      @update:quantity="onQty"
      @update:leverage="store.setLeverage"
      @update:margin-mode="store.setMarginMode"
      @update:tp-sl-enabled="setTpSlEnabled"
      @update:tp-price-input="onTp"
      @update:sl-price-input="onSl"
      @apply-percent="store.applyQtyPercent"
      @submit="store.placeOrder"
    >
      <template #delivery-lev-margin>
        <div class="cof__tcf-chrome">
          <LeverageControl />
          <MarginModeSwitcher />
        </div>
      </template>
    </TradingContractOrderForm>
  </div>
</template>

<style scoped lang="scss">
/* 与 DeliveryOrderForm.dof__tcf-chrome 一致：子节点参与 .tcf__del-chrome 的 flex 布局 */
.cof__tcf-chrome {
  display: contents;
}
</style>
