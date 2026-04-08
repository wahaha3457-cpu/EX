/** 持久化主键（规范名）；旧键 `ex-theme` 仅在读取时迁移 */
export const EXCHANGE_THEME_STORAGE_KEY = 'exchange-theme'

/** @deprecated 旧版 localStorage key，读取后迁移至 EXCHANGE_THEME_STORAGE_KEY */
export const LEGACY_THEME_STORAGE_KEY = 'ex-theme'

/** 前台仅二元主题：default（深色终端） / monochrome（黑白浅底）。 */
export type ThemeMode = 'default' | 'monochrome'

/** @deprecated 请使用 ThemeMode */
export type ExchangeThemeId = ThemeMode

export function isThemeMode(v: string | null): v is ThemeMode {
  return v === 'default' || v === 'monochrome'
}

/** 从 localStorage 原始值解析；旧值 light → monochrome */
export function normalizeStoredThemeId(raw: string | null): ThemeMode {
  if (raw === 'dark') return 'default'
  if (raw === 'light') return 'monochrome'
  if (isThemeMode(raw)) return raw
  return 'default'
}

/** @deprecated 请使用 isThemeMode */
export function isExchangeThemeId(v: string | null): v is ThemeMode {
  return isThemeMode(v)
}

/** @deprecated 请改用 ThemeMode */
export type ThemeFlavor = ThemeMode
