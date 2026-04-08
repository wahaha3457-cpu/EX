<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useTheme } from '@/composables/useTheme'
import type { ThemeMode } from '@/utils/theme/constants'

const { t } = useI18n()
const { theme, setTheme } = useTheme()

const OPTIONS: { id: ThemeMode; labelKey: string }[] = [
  { id: 'default', labelKey: 'layout.themeModeDefault' },
  { id: 'monochrome', labelKey: 'layout.themeModeMonochrome' },
]
</script>

<template>
  <div class="ex-theme-toggle" role="radiogroup" :aria-label="t('layout.themeDisplay')">
    <button
      v-for="opt in OPTIONS"
      :key="opt.id"
      type="button"
      class="ex-theme-toggle__btn"
      role="radio"
      :class="{ 'ex-theme-toggle__btn--on': theme === opt.id }"
      :aria-checked="theme === opt.id"
      @click="setTheme(opt.id)"
    >
      {{ t(opt.labelKey) }}
    </button>
  </div>
</template>

<style scoped lang="scss">
.ex-theme-toggle {
  display: inline-flex;
  gap: 0;
  align-items: stretch;
  border-radius: var(--ex-radius-sm, 6px);
  border: 1px solid var(--ex-border);
  overflow: hidden;
  background: var(--ex-bg-surface);
}

.ex-theme-toggle__btn {
  appearance: none;
  margin: 0;
  padding: 8px 14px;
  border: none;
  border-right: 1px solid var(--ex-border);
  background: transparent;
  color: var(--ex-text-secondary);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition:
    background var(--ex-transition-fast, 0.15s ease),
    color 0.15s ease;
}

.ex-theme-toggle__btn:last-child {
  border-right: none;
}

.ex-theme-toggle__btn:hover {
  color: var(--ex-text-primary);
  background: var(--ex-fill-hover-subtle);
}

.ex-theme-toggle__btn--on {
  background: var(--ex-bg-elevated);
  color: var(--ex-text-primary);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--ex-brand) 35%, transparent);
}
</style>
