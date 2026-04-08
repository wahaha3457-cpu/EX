<script setup lang="ts">
/** 与下单区一致：仅开多/开空（已移除开仓·平仓 Tab） */
import { storeToRefs } from 'pinia'
import { useFuturesTradeStore } from '@/stores/futuresTrade'

const store = useFuturesTradeStore()
const { positionSide } = storeToRefs(store)
</script>

<template>
  <div class="cpat">
    <div class="cpat__dir" role="tablist" aria-label="方向">
      <button
        type="button"
        class="cpat__dir-btn cpat__dir-btn--long"
        :class="{ 'cpat__dir-btn--on': positionSide === 'LONG' }"
        :aria-selected="positionSide === 'LONG'"
        @click="store.setPositionSide('LONG')"
      >
        开多
      </button>
      <button
        type="button"
        class="cpat__dir-btn cpat__dir-btn--short"
        :class="{ 'cpat__dir-btn--on': positionSide === 'SHORT' }"
        :aria-selected="positionSide === 'SHORT'"
        @click="store.setPositionSide('SHORT')"
      >
        开空
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.cpat__dir {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $space-2;
  margin-bottom: $space-3;
}

.cpat__dir-btn {
  padding: $space-2;
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  border: 1px solid $color-border;
  border-radius: $radius-sm;
  cursor: pointer;
  background: $color-bg-base;
  color: $color-text-tertiary;
}

.cpat__dir-btn--long.cpat__dir-btn--on {
  color: var(--ex-on-brand);
  border-color: rgba(14, 203, 129, 0.45);
  background: var(--ex-rise);
}

.cpat__dir-btn--short.cpat__dir-btn--on {
  color: #fff;
  border-color: rgba(246, 70, 93, 0.45);
  background: var(--ex-fall);
}
</style>
