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

/** default：右上角；order-ai：屏幕居中 AI 风格，默认约 2s 渐变消失 */
export type ToastPresentation = 'default' | 'order-ai'

export interface PushToastOptions {
  duration?: number
  presentation?: ToastPresentation
}

export interface ToastItem {
  id: number
  type: ToastType
  message: string
  presentation?: ToastPresentation
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

  /**
   * @param third 停留毫秒数，或 `{ duration, presentation }`（订单成功建议 `{ duration: 2000, presentation: 'order-ai' }`）
   */
  function pushToast(type: ToastType, message: string, third?: number | PushToastOptions) {
    let duration = 4000
    let presentation: ToastPresentation | undefined
    if (typeof third === 'number') {
      duration = third
    } else if (third && typeof third === 'object') {
      if (typeof third.duration === 'number') duration = third.duration
      presentation = third.presentation
    }
    const id = ++toastSeq
    toasts.value.push({ id, type, message, presentation })
    if (duration > 0) {
      window.setTimeout(() => dismissToast(id), duration)
    }
  }

  /** 下单成功等：屏幕居中 AI 卡片，约 2s 后渐变消失 */
  function pushOrderSuccessToast(message: string, durationMs = 2000) {
    pushToast('success', message, { duration: durationMs, presentation: 'order-ai' })
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
    pushOrderSuccessToast,
    dismissToast,
    welcomeModal,
    openWelcomeModal,
    closeWelcomeModal,
  }
})
