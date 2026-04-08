import { storeToRefs } from 'pinia'
import { useThemeStore } from '@/stores/theme'
import type { ThemeMode } from '@/utils/theme/constants'

/** 主题：薄封装 Pinia（仅 default / monochrome） */
export function useTheme() {
  const store = useThemeStore()
  const { theme, isMonochrome } = storeToRefs(store)

  function setTheme(id: ThemeMode) {
    store.setTheme(id)
  }

  function toggleTheme() {
    store.toggleTheme()
  }

  return {
    theme,
    isMonochrome,
    setTheme,
    toggleTheme,
    applyTheme: store.applyTheme,
    initTheme: store.initTheme,
    ensureApplied: store.ensureApplied,
  }
}
