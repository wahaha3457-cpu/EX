<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useAppStore } from '@/stores/app'

const app = useAppStore()
const { toasts } = storeToRefs(app)
</script>

<template>
  <div class="ex-toast-host" aria-live="polite">
    <TransitionGroup name="ex-toast" tag="div">
      <div
        v-for="t in toasts"
        :key="t.id"
        class="ex-toast"
        :data-type="t.type"
        role="status"
      >
        <span class="ex-toast__msg">{{ t.message }}</span>
        <button type="button" class="ex-toast__close" @click="app.dismissToast(t.id)">
          ×
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.ex-toast-host {
  position: fixed;
  top: calc(#{$header-height} + #{$space-3});
  right: $space-4;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: $space-2;
  pointer-events: none;
  max-width: min(420px, calc(100vw - 32px));
}

.ex-toast {
  pointer-events: auto;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: $space-3;
  padding: $space-3 $space-4;
  border-radius: $radius-md;
  border: 1px solid $color-border;
  background: $color-bg-elevated;
  box-shadow: $shadow-card;
  font-size: $font-size-sm;
  color: $color-text-primary;
}

.ex-toast[data-type='error'] {
  border-color: color-mix(in srgb, var(--ex-danger) 45%, transparent);
}

.ex-toast[data-type='warning'] {
  border-color: color-mix(in srgb, var(--ex-warning) 45%, transparent);
}

.ex-toast[data-type='success'] {
  border-color: color-mix(in srgb, var(--ex-success) 45%, transparent);
}

.ex-toast__msg {
  flex: 1;
  line-height: 1.4;
}

.ex-toast__close {
  flex-shrink: 0;
  background: none;
  border: none;
  color: $color-text-tertiary;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  padding: 0;
}

.ex-toast-enter-active,
.ex-toast-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.ex-toast-enter-from,
.ex-toast-leave-to {
  opacity: 0;
  transform: translateX(8px);
}
</style>
