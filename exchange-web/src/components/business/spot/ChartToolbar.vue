<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useSpotTradeStore } from '@/stores/spotTrade'

const store = useSpotTradeStore()
const { chartInterval } = storeToRefs(store)

const intervals = ['1m', '5m', '15m', '1h', '4h', '1d'] as const
</script>

<template>
  <div class="ctbar">
    <div class="ctbar__tabs" role="tablist" aria-label="K 线周期">
      <button
        v-for="iv in intervals"
        :key="iv"
        type="button"
        role="tab"
        class="ctbar__tab"
        :class="{ 'ctbar__tab--on': chartInterval === iv }"
        @click="store.setChartInterval(iv)"
      >
        {{ iv }}
      </button>
    </div>
    <div class="ctbar__tools" aria-label="图表工具预留">
      <span class="ctbar__pill">主图</span>
      <span class="ctbar__pill">指标</span>
      <span class="ctbar__pill">深度图</span>
      <span class="ctbar__pill">画线</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.ctbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: $space-2;
  padding: $space-2 $space-3;
  border-bottom: 1px solid $color-border;
  background: var(--ex-surface-inset);
}

.ctbar__tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
}

.ctbar__tab {
  padding: $space-2 $space-3;
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  color: $color-text-tertiary;
  background: transparent;
  border: none;
  border-radius: $radius-sm;
  cursor: pointer;
}

.ctbar__tab--on {
  color: $color-brand;
  background: rgba(240, 185, 11, 0.1);
}

.ctbar__tools {
  display: flex;
  flex-wrap: wrap;
  gap: $space-1;
}

.ctbar__pill {
  font-size: 10px;
  color: $color-text-tertiary;
  padding: 4px $space-2;
  border-radius: $radius-sm;
  border: 1px dashed var(--ex-border);
}
</style>
