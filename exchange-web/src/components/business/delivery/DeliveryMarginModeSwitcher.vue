<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useDeliveryTradeStore } from '@/stores/deliveryTrade'
import DeliveryMarginModeDialog from './DeliveryMarginModeDialog.vue'

const store = useDeliveryTradeStore()
const { marginMode } = storeToRefs(store)

const open = ref(false)

const label = computed(() => (marginMode.value === 'CROSS' ? '全仓' : '逐仓'))
</script>

<template>
  <div class="dmms">
    <span class="dmms__label">模式</span>
    <button type="button" class="dmms__val" @click="open = true">
      {{ label }}
      <span class="dmms__chev">▾</span>
    </button>
    <DeliveryMarginModeDialog v-model="open" />
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.dmms {
  display: inline-flex;
  align-items: center;
  gap: $space-1;
}

.dmms__label {
  font-size: 10px;
  color: $color-text-tertiary;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.dmms__val {
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

.dmms__val:hover {
  border-color: rgba(240, 185, 11, 0.35);
}

.dmms__chev {
  font-size: 10px;
  color: $color-text-tertiary;
}
</style>
