<script setup lang="ts">
/**
 * 限价/市价下单区共用：勾选「止盈止损」后展开止盈价、止损价（与合约下单区布局一致）。
 */
const props = withDefaults(
  defineProps<{
    enabled: boolean
    takeProfitPrice: string
    stopLossPrice: string
    /** 避免同页多实例 id 冲突 */
    fieldIdPrefix?: string
  }>(),
  { fieldIdPrefix: 'totpsl' },
)

const emit = defineEmits<{
  'update:enabled': [v: boolean]
  'update:takeProfitPrice': [v: string]
  'update:stopLossPrice': [v: string]
}>()

function onToggle(e: Event) {
  emit('update:enabled', (e.target as HTMLInputElement).checked)
}
</script>

<template>
  <div class="totpsl" aria-label="止盈止损">
    <label class="totpsl__head">
      <input
        type="checkbox"
        class="totpsl__cb"
        :checked="props.enabled"
        @change="onToggle"
      />
      止盈止损
    </label>
    <div v-if="props.enabled" class="totpsl__fields">
      <div class="totpsl__field">
        <label class="totpsl__lbl" :for="`${fieldIdPrefix}-tp`">止盈价</label>
        <input
          :id="`${fieldIdPrefix}-tp`"
          class="totpsl__input"
          type="text"
          inputmode="decimal"
          autocomplete="off"
          :value="takeProfitPrice"
          @input="emit('update:takeProfitPrice', ($event.target as HTMLInputElement).value)"
        />
      </div>
      <div class="totpsl__field">
        <label class="totpsl__lbl" :for="`${fieldIdPrefix}-sl`">止损价</label>
        <input
          :id="`${fieldIdPrefix}-sl`"
          class="totpsl__input"
          type="text"
          inputmode="decimal"
          autocomplete="off"
          :value="stopLossPrice"
          @input="emit('update:stopLossPrice', ($event.target as HTMLInputElement).value)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.totpsl {
  margin-bottom: $space-3;
}

.totpsl__head {
  display: flex;
  align-items: center;
  gap: $space-2;
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  color: $color-text-secondary;
  cursor: pointer;
}

.totpsl__cb {
  accent-color: #3084fc;
}

.totpsl__fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $space-2;
  margin-top: $space-2;
}

.totpsl__field {
  flex: 1;
  margin-bottom: 0;
  min-width: 0;
}

.totpsl__lbl {
  display: block;
  margin-bottom: $space-1;
  font-size: $font-size-xs;
  font-weight: $font-weight-medium;
  color: $color-text-tertiary;
}

.totpsl__input {
  box-sizing: border-box;
  width: 100%;
  border: 1px solid $color-border;
  border-radius: $radius-sm;
  padding: $space-1 $space-2;
  font-size: $font-size-sm;
  font-family: $font-family-mono;
  font-variant-numeric: tabular-nums;
  color: $color-text-primary;
  background: var(--ex-bg-surface);
  outline: none;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;

  &:focus {
    border-color: rgba(48, 132, 252, 0.45);
    box-shadow: 0 0 0 1px rgba(48, 132, 252, 0.12);
  }

  &::placeholder {
    color: $color-text-tertiary;
    font-family: $font-family-base;
    font-variant-numeric: normal;
  }
}
</style>
