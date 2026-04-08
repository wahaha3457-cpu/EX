<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useFuturesTradeStore } from '@/stores/futuresTrade'
import MarginModeDialog from './MarginModeDialog.vue'

const store = useFuturesTradeStore()
const { marginMode } = storeToRefs(store)

const open = ref(false)

const label = computed(() => (marginMode.value === 'CROSS' ? '全仓' : '逐仓'))
</script>

<template>
  <div class="mms">
    <span class="mms__label">模式</span>
    <button type="button" class="mms__val" @click="open = true">
      {{ label }}
      <span class="mms__chev">▾</span>
    </button>
    <MarginModeDialog v-model="open" />
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.mms {
  display: inline-flex;
  align-items: center;
  gap: $space-1;
}

.mms__label {
  font-size: 10px;
  color: $color-text-tertiary;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.mms__val {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px $space-2;
  border-radius: $radius-sm;
  border: 1px solid $color-border;
  background: var(--ex-surface-inset);
  cursor: pointer;
  font-size: $font-size-xs;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.mms__val:hover {
  border-color: rgba(240, 185, 11, 0.35);
}

.mms__chev {
  font-size: 10px;
  color: $color-text-tertiary;
}
</style>
