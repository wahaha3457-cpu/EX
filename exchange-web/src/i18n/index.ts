import { createI18n } from 'vue-i18n'
import { getLocaleMessages } from '@/locales/messages'
import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  isAppLocaleCode,
  type AppLocaleCode,
} from '@/locales/supportedLanguages'

export function readPersistedLocale(): AppLocaleCode {
  try {
    const raw = localStorage.getItem(LOCALE_STORAGE_KEY)
    if (raw && isAppLocaleCode(raw)) return raw
  } catch {
    /* ignore */
  }
  return DEFAULT_LOCALE
}

const startingLocale = readPersistedLocale()

/**
 * fallback 策略说明（减少中英混杂）：
 * - 主文案语言应对齐（见 `npm run i18n:parity`）；fallback 只兜底缺失 key，不应依赖其长期存在。
 * - 扩展语言（ko/ja/…）当前消息体来自 en 克隆：在页面仍存在硬编码中文时，切语言会出现「英文 JSON + 中文模板」混杂，应通过覆盖率治理后再开放。
 * - 严格模式：构建时设 `VITE_I18N_STRICT=true`，缺失 key 将抛错，便于 CI 拦截。
 */
const strictI18n = import.meta.env.VITE_I18N_STRICT === 'true'

export const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: startingLocale,
  /** 主站英文用户：缺失时回退到 en；若希望全站以中文为最终兜底可改为 `['en', 'zh-CN']`（仍可能混语，优先补 key） */
  fallbackLocale: 'en',
  messages: getLocaleMessages(),
  missingWarn: import.meta.env.DEV && !strictI18n,
  fallbackWarn: import.meta.env.DEV && !strictI18n,
  missing: strictI18n
    ? (locale, key) => {
        throw new Error(`[i18n missing] locale=${String(locale)} key=${key}`)
      }
    : undefined,
} as Parameters<typeof createI18n>[0])

if (typeof document !== 'undefined') {
  document.documentElement.lang = startingLocale
  document.documentElement.setAttribute('dir', startingLocale === 'ar' ? 'rtl' : 'ltr')
}

/** 在非 setup 处（如 axios 拦截器）取文案，避免 vue-i18n 泛型推导过深 */
export function translate(key: string): string {
  return (i18n as { global: { t: (k: string) => string } }).global.t(key) as string
}
