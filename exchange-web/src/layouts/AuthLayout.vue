<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AuthGridScanBackground from '@/components/auth/AuthGridScanBackground.vue'
import AuthLocaleControl from '@/components/auth/AuthLocaleControl.vue'
import AuthSplashCursor from '@/components/auth/AuthSplashCursor.vue'
import { useThemeStore } from '@/stores/theme'

/**
 * 深色终端下的紫色网格扫描动态背景（AuthGridScanBackground）
 * 需要时再改为 true
 */
const AUTH_GRID_SCAN_ENABLED = false

/**
 * WebGL 流体光标（[Splash Cursor](https://reactbits.dev/animations/splash-cursor)）
 * 仅深色主题；不需要时改为 false
 */
const AUTH_SPLASH_CURSOR_ENABLED = true

const route = useRoute()
const { t } = useI18n()
const { theme } = storeToRefs(useThemeStore())
/** default = 深色终端；monochrome = 浅色，浅色不改背景 */
const useTerminalGridBg = computed(() => theme.value === 'default')

const pageTitle = computed(() => {
  const k = route.meta.titleKey as string | undefined
  return k ? (t(k) as string) : ''
})
</script>

<template>
  <div class="ex-auth" :class="{ 'ex-auth--terminal-grid': useTerminalGridBg }">
    <AuthGridScanBackground v-if="useTerminalGridBg && AUTH_GRID_SCAN_ENABLED" class="ex-auth__gridscan" />
    <AuthSplashCursor v-if="useTerminalGridBg && AUTH_SPLASH_CURSOR_ENABLED" />
    <div class="ex-auth__panel">
      <div class="ex-auth__toolbar">
        <AuthLocaleControl />
      </div>
      <div class="ex-auth__brand">
        <img class="ex-auth__logo" src="/brand-logo.png" alt="" width="48" height="48" decoding="async" />
        <h1 class="ex-auth__title">{{ pageTitle }}</h1>
        <p class="ex-auth__sub">{{ t('auth.layout.subtitle') }}</p>
      </div>
      <RouterView />
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.ex-auth {
  position: relative;
  overflow: hidden;
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $space-8 $space-4;
  background: radial-gradient(
    ellipse at top,
    color-mix(in srgb, var(--ex-bg-elevated) 95%, #ffffff) 0%,
    var(--ex-bg-base) 55%
  );
}

/* 深色终端：衬底 + 叠层压暗，削弱网格亮度，让登录面板边界更清晰 */
.ex-auth--terminal-grid {
  background: radial-gradient(
    ellipse at 50% 0%,
    color-mix(in srgb, var(--ex-bg-elevated) 58%, #030308) 0%,
    color-mix(in srgb, var(--ex-bg-base) 72%, #000000) 65%
  );
}

.ex-auth--terminal-grid::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background: radial-gradient(
    75% 60% at 50% 42%,
    color-mix(in srgb, #000000 28%, transparent),
    color-mix(in srgb, #000000 52%, transparent)
  );
}

.ex-auth__gridscan {
  z-index: 0;
}

.ex-auth__panel {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 440px;
  padding: $space-6;
  border-radius: $radius-lg;
  border: 1px solid var(--ex-border);
  background: color-mix(in srgb, var(--ex-bg-elevated) 96%, transparent);
  box-shadow: var(--ex-shadow-card);
}

/*
 * 深色终端 · Grid Scan：毛玻璃面板 + 边缘光泽，与霓虹景深呼应（浅色不变）
 */
.ex-auth--terminal-grid .ex-auth__panel {
  overflow: hidden;
  isolation: isolate;
  border-radius: $radius-xl;
  border: 1px solid color-mix(in srgb, #ffffff 14%, var(--ex-border));
  background: linear-gradient(
    168deg,
    color-mix(in srgb, var(--ex-bg-elevated) 48%, rgba(255, 255, 255, 0.04)) 0%,
    color-mix(in srgb, var(--ex-bg-base) 36%, rgba(0, 0, 0, 0.12)) 100%
  );
  backdrop-filter: blur(22px) saturate(168%);
  -webkit-backdrop-filter: blur(22px) saturate(168%);
  box-shadow:
    /* 上沿冷凝高光 */
    0 1px 0 color-mix(in srgb, #ffffff 12%, transparent) inset,
    0 0 0 1px color-mix(in srgb, #ffffff 5%, transparent) inset,
    /* 底部收光，压低眩光 */
    inset 0 -36px 72px color-mix(in srgb, #000000 38%, transparent),
    /* 落地投影 + 极淡紫光晕，贴合扫描线色相 */
    0 28px 64px color-mix(in srgb, #000000 52%, transparent),
    0 0 100px color-mix(in srgb, #ff9ffc 6%, transparent);
}

.ex-auth--terminal-grid .ex-auth__panel::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  border-radius: inherit;
  background: linear-gradient(
    180deg,
    color-mix(in srgb, #ffffff 11%, transparent) 0%,
    transparent 38%,
    transparent 100%
  );
  opacity: 0.45;
}

/* 浮在毛玻璃高光层之上（语言按钮继续保持 absolute + 更高 z-index） */
.ex-auth--terminal-grid .ex-auth__panel > *:not(.ex-auth__toolbar) {
  position: relative;
  z-index: 1;
}

.ex-auth--terminal-grid .ex-auth__logo {
  box-shadow:
    0 0 0 1px color-mix(in srgb, #ffffff 14%, transparent),
    0 10px 28px color-mix(in srgb, #000000 45%, transparent);
}

/* 无 backdrop-filter 时退化为实色，避免糊成一片 */
@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .ex-auth--terminal-grid .ex-auth__panel {
    background: color-mix(in srgb, var(--ex-bg-elevated) 96%, var(--ex-bg-base));
    box-shadow:
      0 1px 0 color-mix(in srgb, #ffffff 10%, transparent) inset,
      0 28px 56px color-mix(in srgb, #000000 48%, transparent);
  }

  .ex-auth--terminal-grid .ex-auth__panel::before {
    opacity: 0.25;
  }
}

/* 与顶栏一致的语言/地区入口：卡片右上角，不挤压中部标题与表单 */
.ex-auth__toolbar {
  position: absolute;
  top: $space-4;
  right: $space-4;
  z-index: 2;
}

.ex-auth__brand {
  text-align: center;
  margin-bottom: $space-6;
}

.ex-auth__logo {
  width: 48px;
  height: 48px;
  margin: 0 auto $space-3;
  border-radius: $radius-md;
  object-fit: contain;
  display: block;
}

.ex-auth__title {
  margin: 0;
  font-size: $font-size-xl;
  font-weight: $font-weight-bold;
  color: var(--ex-text-primary);
}

.ex-auth__sub {
  margin: $space-2 0 0;
  font-size: $font-size-sm;
  color: var(--ex-text-tertiary);
}
</style>
