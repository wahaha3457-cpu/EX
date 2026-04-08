<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import { mountAuthSplashCursor } from './authSplashCursor'

const canvasRef = ref<HTMLCanvasElement | null>(null)
const cleanupRef = shallowRef<(() => void) | null>(null)

onMounted(() => {
  if (typeof window === 'undefined') return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const el = canvasRef.value
  if (!el) return
  try {
    cleanupRef.value = mountAuthSplashCursor(el)
  } catch {
    /* WebGL 不可用则静默跳过 */
  }
})

onBeforeUnmount(() => {
  cleanupRef.value?.()
  cleanupRef.value = null
})
</script>

<template>
  <canvas ref="canvasRef" class="auth-splash-cursor" aria-hidden="true" />
</template>

<style scoped lang="scss">
.auth-splash-cursor {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  /* 高于 .ex-auth--terminal-grid::after (1)，与面板同级由 DOM 后序保证卡片在上 */
  z-index: 2;
}
</style>
