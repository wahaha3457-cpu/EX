import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { UserPreferencesState } from '@/types/preferences'
import { PREFERENCES_STORAGE_PREFIX } from '@/types/preferences'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { applyCandlePaletteToDocument, applyPrivacyHideBalancesToDocument } from '@/utils/preferences/dom'

function defaults(): UserPreferencesState {
  return {
    candlePalette: 'cn',
    dateFormat: 'iso',
    timeZone: 'auto',
    confirmSpotOrder: true,
    confirmFuturesOrder: true,
    notifyEmailMarketing: false,
    notifyPriceAlert: true,
    notifyOrderFilled: true,
    privacyHideBalances: false,
  }
}

function mergeParsed(raw: unknown): UserPreferencesState {
  if (!raw || typeof raw !== 'object') return defaults()
  return { ...defaults(), ...(raw as Partial<UserPreferencesState>) }
}

export const usePreferencesStore = defineStore('preferences', () => {
  const prefs = ref<UserPreferencesState>(defaults())
  let toastTimer: ReturnType<typeof setTimeout> | null = null

  function storageKey(): string {
    const auth = useAuthStore()
    const uid = auth.user?.userCode ?? 'guest'
    return `${PREFERENCES_STORAGE_PREFIX}${uid}`
  }

  function persist() {
    try {
      localStorage.setItem(storageKey(), JSON.stringify(prefs.value))
    } catch {
      /* ignore */
    }
  }

  function applyDom() {
    applyCandlePaletteToDocument(prefs.value.candlePalette)
    applyPrivacyHideBalancesToDocument(prefs.value.privacyHideBalances)
  }

  function load() {
    try {
      const raw = localStorage.getItem(storageKey())
      prefs.value = raw ? mergeParsed(JSON.parse(raw)) : defaults()
    } catch {
      prefs.value = defaults()
    }
    applyDom()
  }

  function scheduleSavedToast() {
    const app = useAppStore()
    if (toastTimer) clearTimeout(toastTimer)
    toastTimer = setTimeout(() => {
      app.pushToast('success', '偏好已保存')
      toastTimer = null
    }, 320)
  }

  /** 合并写入并持久化；会更新涨跌色、隐私模糊等 DOM */
  function savePartial(patch: Partial<UserPreferencesState>) {
    prefs.value = { ...prefs.value, ...patch }
    persist()
    applyDom()
    scheduleSavedToast()
  }

  function resetDemo() {
    prefs.value = defaults()
    persist()
    applyDom()
    useAppStore().pushToast('info', '已恢复默认偏好')
  }

  function init() {
    load()
    const auth = useAuthStore()
    watch(
      () => auth.user?.userCode,
      () => load(),
    )
  }

  return {
    prefs,
    load,
    savePartial,
    resetDemo,
    init,
  }
})
