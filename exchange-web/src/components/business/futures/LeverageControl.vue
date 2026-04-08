<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useFuturesTradeStore } from '@/stores/futuresTrade'
import LeverageDialog from './LeverageDialog.vue'

const store = useFuturesTradeStore()
const { leverage } = storeToRefs(store)

const open = ref(false)
</script>

<template>
  <div class="lvc">
    <span class="lvc__label">杠杆</span>
    <button type="button" class="lvc__val" @click="open = true">
      <span class="lvc__num ex-num">{{ leverage }}x</span>
      <span class="lvc__chev">▾</span>
    </button>
    <LeverageDialog v-model="open" />
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.lvc {
  display: inline-flex;
  align-items: center;
  gap: $space-1;
}

.lvc__label {
  font-size: 10px;
  color: $color-text-tertiary;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.lvc__val {
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

.lvc__val:hover {
  border-color: rgba(48, 132, 252, 0.45);
}

.lvc__num {
  font-size: inherit;
  font-weight: inherit;
}

.lvc__chev {
  font-size: 10px;
  color: $color-text-tertiary;
}
</style>
