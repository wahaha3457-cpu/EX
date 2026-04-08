<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useDeliveryTradeStore } from '@/stores/deliveryTrade'
import DeliveryLeverageDialog from './DeliveryLeverageDialog.vue'

const store = useDeliveryTradeStore()
const { leverage } = storeToRefs(store)

const open = ref(false)
</script>

<template>
  <div class="dlvc">
    <span class="dlvc__label">杠杆</span>
    <button type="button" class="dlvc__val" @click="open = true">
      <span class="dlvc__num ex-num">{{ leverage }}x</span>
      <span class="dlvc__chev">▾</span>
    </button>
    <DeliveryLeverageDialog v-model="open" />
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.dlvc {
  display: inline-flex;
  align-items: center;
  gap: $space-1;
}

.dlvc__label {
  font-size: 10px;
  color: $color-text-tertiary;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.dlvc__val {
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
  color: #8ab4ff;
}

.dlvc__val:hover {
  border-color: rgba(48, 132, 252, 0.45);
}

.dlvc__chev {
  font-size: 10px;
  color: $color-text-tertiary;
}
</style>
