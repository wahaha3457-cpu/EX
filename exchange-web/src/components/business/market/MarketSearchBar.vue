<script setup lang="ts">
const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: string): void
}>()
</script>

<template>
  <div class="msrch">
    <span class="msrch__icon" aria-hidden="true">⌕</span>
    <input
      class="msrch__input"
      type="search"
      :value="props.modelValue"
      placeholder="搜索币种 / 交易对"
      autocomplete="off"
      spellcheck="false"
      aria-label="搜索交易对"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.msrch {
  display: flex;
  align-items: center;
  gap: $space-2;
  min-width: 0;
  max-width: 320px;
  flex: 1;
  padding: 0 $space-3;
  height: 36px;
  border-radius: $radius-sm;
  border: 1px solid $color-border-strong;
  background: $color-bg-base;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.msrch:focus-within {
  border-color: color-mix(in srgb, var(--ex-brand) 50%, var(--ex-border-strong));
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--ex-brand) 12%, transparent);
}

.msrch__icon {
  flex-shrink: 0;
  font-size: $font-size-xl;
  line-height: 1;
  color: $color-text-tertiary;
  user-select: none;
}

.msrch__input {
  flex: 1;
  min-width: 0;
  height: 100%;
  border: none;
  background: transparent;
  color: $color-text-primary;
  font-size: $font-size-sm;
  outline: none;
}

.msrch__input::placeholder {
  color: $color-text-tertiary;
}
</style>
