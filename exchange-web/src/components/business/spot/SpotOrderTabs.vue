<script setup lang="ts">
import type { SpotOrderDockTab } from '@/types/spotTrade'

const props = defineProps<{
  modelValue: SpotOrderDockTab
  openCount: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: SpotOrderDockTab): void
}>()

const tabs: { key: SpotOrderDockTab; label: string }[] = [
  { key: 'open', label: '当前委托' },
  { key: 'history', label: '历史委托' },
  { key: 'fills', label: '成交记录' },
  { key: 'assets', label: '资产概览' },
]

function select(k: SpotOrderDockTab) {
  emit('update:modelValue', k)
}
</script>

<template>
  <div class="sot" role="tablist" aria-label="订单与资产">
    <button
      v-for="t in tabs"
      :key="t.key"
      type="button"
      role="tab"
      class="sot__tab"
      :class="{ 'sot__tab--on': props.modelValue === t.key }"
      :aria-selected="props.modelValue === t.key"
      @click="select(t.key)"
    >
      {{ t.label }}
      <span v-if="t.key === 'open' && openCount > 0" class="sot__badge">{{ openCount }}</span>
    </button>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.sot {
  display: flex;
  align-items: stretch;
  border-bottom: 1px solid $color-border;
  background: var(--ex-surface-inset);
  overflow-x: auto;
}

.sot__tab {
  position: relative;
  flex: 1;
  min-width: 96px;
  padding: $space-3 $space-3;
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  color: $color-text-tertiary;
  background: transparent;
  border: none;
  cursor: pointer;
  white-space: nowrap;
}

.sot__tab:hover {
  color: $color-text-secondary;
}

.sot__tab--on {
  color: $color-text-primary;
}

.sot__tab--on::after {
  content: '';
  position: absolute;
  left: $space-3;
  right: $space-3;
  bottom: 0;
  height: 2px;
  background: $color-brand;
  border-radius: 1px 1px 0 0;
}

.sot__badge {
  margin-left: $space-1;
  padding: 0 6px;
  font-size: 10px;
  font-weight: $font-weight-bold;
  border-radius: 8px;
  background: rgba(240, 185, 11, 0.15);
  color: $color-brand;
}
</style>
