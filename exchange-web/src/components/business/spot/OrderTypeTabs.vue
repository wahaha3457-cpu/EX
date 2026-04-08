<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useSpotTradeStore } from '@/stores/spotTrade'
import type { SpotOrderType } from '@/types/spotTrade'

const store = useSpotTradeStore()
const { formType } = storeToRefs(store)

function setType(t: SpotOrderType) {
  store.setFormType(t)
}
</script>

<template>
  <div class="ott" role="tablist" aria-label="订单类型">
    <button
      type="button"
      role="tab"
      class="ott__btn"
      :class="{ 'ott__btn--on': formType === 'LIMIT' }"
      @click="setType('LIMIT')"
    >
      限价
    </button>
    <button
      type="button"
      role="tab"
      class="ott__btn"
      :class="{ 'ott__btn--on': formType === 'MARKET' }"
      @click="setType('MARKET')"
    >
      市价
    </button>
    <button type="button" class="ott__btn ott__btn--disabled" disabled title="后续接入止盈止损">
      止盈止损
    </button>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.ott {
  display: flex;
  gap: $space-2;
  margin-bottom: $space-3;
}

.ott__btn {
  flex: 1;
  padding: $space-2;
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  color: $color-text-secondary;
  background: $color-bg-base;
  border: 1px solid $color-border;
  border-radius: $radius-sm;
  cursor: pointer;
}

.ott__btn--on {
  border-color: rgba(240, 185, 11, 0.45);
  color: $color-brand;
}

.ott__btn--disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
</style>
