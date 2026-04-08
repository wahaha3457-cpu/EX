<script setup lang="ts">
/**
 * 交易台「流程 / Mock 说明」轻量弹窗：与 PairSwitcherModal 同 Teleport + 遮罩交互。
 */
import { watch, onUnmounted } from 'vue'

const titleId = `tfim-h-${Math.random().toString(36).slice(2, 11)}`

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    title: string
    /** 顶栏强调色：交割偏品牌金，永续偏信息蓝 */
    accent?: 'brand' | 'info'
  }>(),
  { accent: 'brand' },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

function close() {
  emit('update:modelValue', false)
}

function onKeydown(ev: KeyboardEvent) {
  if (ev.key === 'Escape') close()
}

watch(
  () => props.modelValue,
  (v) => {
    if (v) document.addEventListener('keydown', onKeydown)
    else document.removeEventListener('keydown', onKeydown)
  },
)

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="tfim-overlay"
      role="presentation"
      aria-hidden="false"
      @click.self="close"
    >
      <div
        class="tfim"
        :class="{ 'tfim--accent-info': props.accent === 'info' }"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        @click.stop
      >
        <header class="tfim__head">
          <h2 :id="titleId" class="tfim__title">{{ title }}</h2>
          <button type="button" class="tfim__close" aria-label="关闭" @click="close">×</button>
        </header>
        <div class="tfim__body">
          <slot />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.tfim-overlay {
  position: fixed;
  inset: 0;
  z-index: 500;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: $space-8 $space-4;
  background: var(--ex-overlay-backdrop);
}

.tfim {
  width: min(520px, 100%);
  max-height: min(640px, calc(100vh - 48px));
  display: flex;
  flex-direction: column;
  border-radius: $radius-lg;
  border: 1px solid $color-border-strong;
  background: var(--ex-pair-modal-surface);
  box-shadow: var(--ex-modal-shadow-elevated), 0 0 0 1px var(--ex-divider-on-white) inset;
}

.tfim--accent-info .tfim__head {
  border-bottom-color: color-mix(in srgb, var(--ex-info) 22%, $color-border);
}

.tfim__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: $space-3;
  padding: $space-4 $space-4 $space-3;
  border-bottom: 1px solid $color-border;
}

.tfim__title {
  margin: 0;
  font-size: $font-size-md;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
  line-height: 1.35;
  letter-spacing: 0.02em;
}

.tfim__close {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  margin: -6px -6px 0 0;
  border: none;
  border-radius: $radius-sm;
  background: transparent;
  color: $color-text-tertiary;
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;

  &:hover {
    color: $color-text-primary;
    background: var(--ex-fill-hover-subtle);
  }
}

.tfim__body {
  padding: $space-4;
  overflow-y: auto;
  min-height: 0;
}
</style>
