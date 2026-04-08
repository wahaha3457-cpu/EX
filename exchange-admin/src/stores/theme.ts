import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  EXCHANGE_THEME_STORAGE_KEY,
  type ThemeMode,
  isThemeMode,
} from '@/utils/theme/constants'
import {
  applyThemeToDocument,
  persistThemeIdToStorage,
  readThemeIdFromStorage,
} from '@/utils/theme/dom'

const DEFAULT_THEME: ThemeMode = 'default'

let crossTabListenerAttached = false

export const useThemeStore = defineStore('theme', () => {
  const theme = ref<ThemeMode>(DEFAULT_THEME)

  const isMonochrome = computed(() => theme.value === 'monochrome')

  function applyTheme(next: ThemeMode) {
    applyThemeToDocument(next)
  }

  function setTheme(next: ThemeMode) {
    if (theme.value === next) {
      applyTheme(next)
      return
    }
    theme.value = next
    persistThemeIdToStorage(next)
    applyTheme(next)
  }

  function applyThemeMode(next: ThemeMode) {
    setTheme(next)
  }

  /** default ↔ monochrome */
  function toggleTheme() {
    setTheme(theme.value === 'default' ? 'monochrome' : 'default')
  }

  function initTheme() {
    const stored = readThemeIdFromStorage()
    theme.value = stored
    applyTheme(stored)
    persistThemeIdToStorage(stored)

    if (typeof window === 'undefined' || crossTabListenerAttached) return
    crossTabListenerAttached = true
    window.addEventListener('storage', (e: StorageEvent) => {
      if (e.key !== EXCHANGE_THEME_STORAGE_KEY || e.newValue == null) return
      if (!isThemeMode(e.newValue)) return
      if (e.newValue === theme.value) return
      theme.value = e.newValue
      applyThemeToDocument(e.newValue)
    })
  }

  function init() {
    initTheme()
  }

  function ensureApplied() {
    applyThemeToDocument(theme.value)
  }

  return {
    theme,
    isMonochrome,
    setTheme,
    applyTheme: applyThemeMode,
    toggleTheme,
    initTheme,
    init,
    ensureApplied,
  }
})

export type { ThemeMode }
/** @deprecated */
export type ExchangeThemeId = ThemeMode
/** @deprecated */
export type ThemeFlavor = ThemeMode
