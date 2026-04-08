<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { ConvertFlashAssetMeta } from '@/types/convertFlash'
import { formatPrice } from '@/utils/format/number'

const props = defineProps<{
  modelValue: boolean
  title: string
  assets: ConvertFlashAssetMeta[]
  balances: Record<string, number>
  otherSymbol: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'select', symbol: string): void
}>()

const q = ref('')

watch(
  () => props.modelValue,
  (v) => {
    if (v) q.value = ''
  },
)

const filtered = computed(() => {
  const s = q.value.trim().toUpperCase()
  return props.assets.filter((a) => {
    if (!s) return true
    return a.symbol.includes(s) || a.name.toUpperCase().includes(s)
  })
})

function close() {
  emit('update:modelValue', false)
}

function pick(sym: string) {
  if (sym === props.otherSymbol) return
  emit('select', sym)
  emit('update:modelValue', false)
}

function avail(sym: string) {
  return props.balances[sym] ?? 0
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="cap-overlay"
      role="dialog"
      aria-modal="true"
      :aria-label="title"
      @click.self="close"
    >
      <div class="cap">
        <div class="cap__head">
          <span class="cap__title">{{ title }}</span>
          <button type="button" class="cap__x" aria-label="关闭" @click="close">×</button>
        </div>
        <div class="cap__search">
          <input v-model="q" type="search" class="cap__input" placeholder="搜索币种" autocomplete="off" />
        </div>
        <ul class="cap__list">
          <li v-for="a in filtered" :key="a.symbol">
            <button
              type="button"
              class="cap__row"
              :disabled="a.symbol === otherSymbol"
              @click="pick(a.symbol)"
            >
              <span class="cap__sym">{{ a.symbol }}</span>
              <span class="cap__name">{{ a.name }}</span>
              <span class="cap__bal ex-num">{{ formatPrice(avail(a.symbol)) }}</span>
            </button>
          </li>
        </ul>
      </div>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.cap-overlay {
  position: fixed;
  inset: 0;
  z-index: 530;
  background: var(--ex-overlay-backdrop);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 0;

  @media (min-width: 560px) {
    align-items: center;
    padding: $space-4;
  }
}

.cap {
  width: 100%;
  max-width: 420px;
  max-height: min(72vh, 520px);
  border-radius: $radius-md $radius-md 0 0;
  border: 1px solid $color-border;
  border-bottom: none;
  background: var(--ex-modal-surface);
  box-shadow: 0 -8px 48px rgba(0, 0, 0, 0.45);
  display: flex;
  flex-direction: column;

  @media (min-width: 560px) {
    border-radius: $radius-md;
    border-bottom: 1px solid $color-border;
    max-height: min(80vh, 560px);
    box-shadow: var(--ex-modal-shadow-elevated);
  }
}

.cap__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $space-3 $space-4;
  border-bottom: 1px solid $color-border;
  flex-shrink: 0;
}

.cap__title {
  font-weight: $font-weight-bold;
  font-size: $font-size-md;
  color: $color-text-primary;
}

.cap__x {
  border: none;
  background: transparent;
  color: $color-text-tertiary;
  font-size: 22px;
  cursor: pointer;
  line-height: 1;
}

.cap__search {
  padding: $space-2 $space-4;
  flex-shrink: 0;
}

.cap__input {
  width: 100%;
  box-sizing: border-box;
  padding: 10px $space-3;
  border-radius: $radius-sm;
  border: 1px solid $color-border;
  background: var(--ex-surface-inset-strong);
  color: $color-text-primary;
  font-size: $font-size-sm;

  &:focus {
    outline: none;
    border-color: rgba(240, 185, 11, 0.45);
  }
}

.cap__list {
  list-style: none;
  margin: 0;
  padding: 0 $space-2 $space-3;
  overflow-y: auto;
  flex: 1;
}

.cap__row {
  width: 100%;
  display: grid;
  grid-template-columns: 72px 1fr auto;
  align-items: center;
  gap: $space-2;
  padding: $space-3 $space-2;
  border: none;
  border-radius: $radius-sm;
  background: transparent;
  color: $color-text-primary;
  cursor: pointer;
  text-align: left;
  font-size: $font-size-sm;

  &:hover:not(:disabled) {
    background: rgba(240, 185, 11, 0.08);
  }

  &:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }
}

.cap__sym {
  font-weight: $font-weight-bold;
  font-family: $font-family-mono;
}

.cap__name {
  color: $color-text-tertiary;
  font-size: $font-size-xs;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cap__bal {
  font-size: $font-size-xs;
  color: $color-text-secondary;
}

.ex-num {
  font-family: $font-family-mono;
}
</style>
