<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/stores/app'
import NavMenuIcon from '@/components/layout/nav/NavMenuIcon.vue'
import { SUPPORTED_LANGUAGES, type AppLocaleCode } from '@/locales/supportedLanguages'

const { t } = useI18n()
const app = useAppStore()
const { locale: currentLocale } = storeToRefs(app)

const open = ref(false)
const rootRef = ref<HTMLElement | null>(null)

function selectLocale(code: AppLocaleCode) {
  app.setLocale(code)
  open.value = false
}

function onDocPointerDown(e: MouseEvent) {
  const el = e.target as Node
  if (!rootRef.value?.contains(el)) open.value = false
}

onMounted(() => {
  document.addEventListener('pointerdown', onDocPointerDown, true)
})

onUnmounted(() => {
  document.removeEventListener('pointerdown', onDocPointerDown, true)
})
</script>

<template>
  <div ref="rootRef" class="auth-locale">
    <button
      type="button"
      class="auth-locale__trigger"
      :class="{ 'auth-locale__trigger--open': open }"
      :aria-label="t('layout.localeRegion')"
      :aria-expanded="open"
      aria-haspopup="true"
      @click.stop="open = !open"
    >
      <span class="auth-locale__icon-el"><NavMenuIcon name="locale" /></span>
    </button>
    <div
      v-show="open"
      class="auth-locale__panel"
      role="menu"
      @click.stop
    >
      <button
        v-for="lang in SUPPORTED_LANGUAGES"
        :key="lang.code"
        type="button"
        class="auth-locale__item"
        :class="{ 'auth-locale__item--active': currentLocale === lang.code }"
        role="menuitem"
        @click="selectLocale(lang.code)"
      >
        {{ lang.nativeName }}
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.auth-locale {
  position: relative;
  flex-shrink: 0;
  z-index: 2;
}

.auth-locale__trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--ex-icon-btn-size);
  height: var(--ex-icon-btn-size);
  padding: 0;
  color: var(--ex-icon-secondary);
  background: var(--ex-icon-btn-bg);
  border: 1px solid var(--ex-icon-btn-border);
  border-radius: var(--ex-icon-btn-radius);
  cursor: pointer;
  transition:
    color var(--ex-transition-fast),
    background var(--ex-transition-fast),
    border-color var(--ex-transition-fast);
}

.auth-locale__trigger:hover {
  color: var(--ex-icon-primary);
  background: var(--ex-icon-btn-hover-bg);
  border-color: var(--ex-icon-btn-border-hover);
}

.auth-locale__trigger--open {
  color: var(--ex-icon-active);
  border-color: var(--ex-icon-btn-active-border);
  background: var(--ex-icon-btn-active-bg);
}

.auth-locale__trigger:focus-visible {
  outline: 2px solid var(--ex-border-focus);
  outline-offset: 2px;
}

.auth-locale__icon-el {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  /**
   * NavMenuIcon「locale」中外圆 r=9 → 直径占 viewBox 18/24；令该圆直径 = 触发器圆直径的 50%
   * → 1em 边长 = --ex-icon-btn-size × (50% / (18/24)) = × 12/18 = × 2/3
   */
  font-size: calc(var(--ex-icon-btn-size) * 12 / 18);
}

.auth-locale__panel {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  min-width: 200px;
  max-height: min(360px, 72vh);
  overflow-x: hidden;
  overflow-y: auto;
  padding: $space-2 0;
  border-radius: var(--ex-nav-float-radius, #{$radius-md});
  border: 1px solid var(--ex-nav-float-border);
  background: var(--ex-bg-nav-float);
  box-shadow: var(--ex-nav-float-shadow);
}

.auth-locale__item {
  display: block;
  width: 100%;
  padding: $space-2 $space-3;
  border: none;
  background: transparent;
  text-align: left;
  font: inherit;
  font-size: $font-size-sm;
  font-weight: $font-weight-medium;
  color: var(--ex-text-primary);
  cursor: pointer;
}

.auth-locale__item:hover {
  background: var(--ex-nav-float-hover);
}

.auth-locale__item--active {
  color: var(--ex-brand);
  font-weight: $font-weight-semibold;
  background: var(--ex-brand-muted);
}
</style>
