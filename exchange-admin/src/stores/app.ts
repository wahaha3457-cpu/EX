import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Composer } from 'vue-i18n'
import { i18n } from '@/i18n'
import {
  LOCALE_STORAGE_KEY,
  isAppLocaleCode,
  type AppLocaleCode,
} from '@/locales/supportedLanguages'

export type ToastType = 'info' | 'success' | 'warning' | 'error'

export interface ToastItem {
  id: number
  type: ToastType
  message: string
}

export interface WelcomeModalState {
  open: boolean
  title: string
  subtitle?: string
  /** 轻量插图类型：后续可扩展 */
  illustration: 'rocket' | 'shield' | 'spark'
}

export const useAppStore = defineStore('app', () => {
  const composer = i18n.global as unknown as Composer
  const locale = ref<AppLocaleCode>(composer.locale.value as AppLocaleCode)
  const toasts = ref<ToastItem[]>([])
  let toastSeq = 0

  const welcomeModal = ref<WelcomeModalState>({
    open: false,
    title: '',
    subtitle: '',
    illustration: 'rocket',
  })

  function setLocale(code: AppLocaleCode) {
    if (!isAppLocaleCode(code)) return
    locale.value = code
    composer.locale.value = code
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, code)
    } catch {
      /* ignore */
    }
    if (typeof document !== 'undefined') {
      document.documentElement.lang = code
      document.documentElement.setAttribute('dir', code === 'ar' ? 'rtl' : 'ltr')
    }
  }

  function pushToast(type: ToastType, message: string, duration = 4000) {
    const id = ++toastSeq
    toasts.value.push({ id, type, message })
    if (duration > 0) {
      window.setTimeout(() => dismissToast(id), duration)
    }
  }

  function dismissToast(id: number) {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  function openWelcomeModal(payload: Omit<WelcomeModalState, 'open'>, autoCloseMs = 2800) {
    welcomeModal.value = { open: true, ...payload }
    if (autoCloseMs > 0) {
      window.setTimeout(() => {
        welcomeModal.value.open = false
      }, autoCloseMs)
    }
  }

  function closeWelcomeModal() {
    welcomeModal.value.open = false
  }

  return {
    locale,
    setLocale,
    toasts,
    pushToast,
    dismissToast,
    welcomeModal,
    openWelcomeModal,
    closeWelcomeModal,
  }
})
