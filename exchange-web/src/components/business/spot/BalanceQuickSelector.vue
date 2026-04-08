<script setup lang="ts">
import { useSpotTradeStore } from '@/stores/spotTrade'

const store = useSpotTradeStore()

const pctButtons = [25, 50, 75, 100] as const
</script>

<template>
  <div class="bqs" aria-label="按可用余额比例填充数量">
    <button
      v-for="p in pctButtons"
      :key="p"
      type="button"
      class="bqs__btn"
      @click="store.applyQtyPercent(p)"
    >
      {{ p }}%
    </button>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.bqs {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: $space-1;
  margin-bottom: $space-3;
}

.bqs__btn {
  padding: $space-2 0;
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  color: $color-text-secondary;
  background: $color-bg-base;
  border: 1px solid $color-border;
  border-radius: $radius-sm;
  cursor: pointer;
}

.bqs__btn:hover {
  border-color: rgba(240, 185, 11, 0.35);
  color: $color-brand;
}
</style>
