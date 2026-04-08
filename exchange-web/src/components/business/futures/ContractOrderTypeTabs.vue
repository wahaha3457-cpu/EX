<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useFuturesTradeStore } from '@/stores/futuresTrade'
import type { FuturesOrderType } from '@/types/futuresTrade'

const store = useFuturesTradeStore()
const { formType } = storeToRefs(store)

function setType(t: FuturesOrderType) {
  store.setFormType(t)
}
</script>

<template>
  <div class="cott" role="tablist" aria-label="委托类型">
    <button
      type="button"
      class="cott__btn"
      :class="{ 'cott__btn--on': formType === 'LIMIT' }"
      @click="setType('LIMIT')"
    >
      限价
    </button>
    <button
      type="button"
      class="cott__btn"
      :class="{ 'cott__btn--on': formType === 'MARKET' }"
      @click="setType('MARKET')"
    >
      市价
    </button>
    <button type="button" class="cott__btn cott__btn--dis" disabled title="后续接入条件单">
      条件
      <span class="cott__tag">预留</span>
    </button>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.cott {
  display: flex;
  gap: $space-1;
  margin-bottom: $space-3;
}

.cott__btn {
  flex: 1;
  padding: $space-2 $space-1;
  font-size: 11px;
  font-weight: $font-weight-semibold;
  color: $color-text-secondary;
  background: $color-bg-base;
  border: 1px solid $color-border;
  border-radius: $radius-sm;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.cott__btn--on {
  border-color: rgba(48, 132, 252, 0.45);
  color: #8ab4ff;
}

.cott__btn--dis {
  opacity: 0.4;
  cursor: not-allowed;
}

.cott__tag {
  font-size: 9px;
  padding: 0 3px;
  border-radius: 2px;
  background: rgba(240, 185, 11, 0.12);
  color: $color-brand;
}
</style>
