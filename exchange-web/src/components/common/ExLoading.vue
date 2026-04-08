<template>
  <div class="ex-loading" role="status" aria-live="polite">
    <div class="ex-loading__spinner" aria-hidden="true" />
    <p v-if="text" class="ex-loading__text">{{ text }}</p>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    /** 兼容旧调用：不再产生 overlay / 全屏层 */
    text?: string
    layout?: 'inline' | 'full' | 'block' | 'overlay'
    size?: 'sm' | 'md'
  }>(),
  {
    text: '加载中…',
    layout: 'inline',
    size: 'md',
  },
)
</script>

<style scoped lang="scss">
/* 仅块级占位：禁止 fixed/全屏/inset:0/Teleport — 由父级 ExPageState 容器约束宽度 */
.ex-loading {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 180px;
  width: 100%;
  max-width: 100%;
  padding: 24px 16px;
  box-sizing: border-box;
  background: transparent;
  opacity: 1;
  filter: none;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  isolation: isolate;
}

.ex-loading__spinner {
  width: 34px;
  height: 34px;
  border-radius: 999px;
  border: 3px solid color-mix(in srgb, var(--ex-text-primary) 10%, transparent);
  border-top-color: var(--ex-brand, #d4a017);
  animation: ex-loading-spin 0.9s linear infinite;
}

.ex-loading__text {
  margin: 14px 0 0;
  font-size: 14px;
  line-height: 1.5;
  color: var(--ex-text-secondary);
}

@keyframes ex-loading-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
