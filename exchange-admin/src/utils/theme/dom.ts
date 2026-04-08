import type { ThemeMode } from './constants'
import {
  EXCHANGE_THEME_STORAGE_KEY,
  LEGACY_THEME_STORAGE_KEY,
  normalizeStoredThemeId,
} from './constants'

const BG_DARK = '#0b0e11'
const BG_MONO = '#ffffff'

/** Element Plus 深色变量：仅 `default` 主题启用 html.dark */
const EP_HTML_DARK_CLASS = 'dark'

/** monochrome：与异步样式竞态时保证关键 token 已写入根节点 */
const MONOCHROME_INLINE_VARS: ReadonlyArray<readonly [string, string]> = [
  ['--ex-text-primary', '#111111'],
  ['--ex-text-secondary', '#3d3d3d'],
  ['--ex-text-tertiary', '#5a5a5a'],
  ['--ex-text-disabled', '#a0a0a0'],
  ['--ex-text-inverse', '#ffffff'],
  ['--ex-brand', '#9a7b2c'],
  ['--ex-brand-hover', '#b08a35'],
  ['--ex-brand-active', '#7a6020'],
  ['--ex-link', '#4a3a10'],
  ['--ex-link-hover', '#6b5220'],
]

function applyInlineVars(root: HTMLElement, pairs: ReadonlyArray<readonly [string, string]>) {
  for (const [key, value] of pairs) {
    root.style.setProperty(key, value)
  }
}

function clearInlineVars(root: HTMLElement, pairs: ReadonlyArray<readonly [string, string]>) {
  for (const [key] of pairs) {
    root.style.removeProperty(key)
  }
}

function syncMetaThemeColor(hex: string) {
  if (typeof document === 'undefined') return
  let meta = document.querySelector('meta[name="theme-color"]')
  if (!meta) {
    meta = document.createElement('meta')
    meta.setAttribute('name', 'theme-color')
    document.head.appendChild(meta)
  }
  meta.setAttribute('content', hex)
}

/**
 * 唯一入口：同步 data-theme、EP 深色 class、color-scheme、根画布色、meta、必要 inline token。
 */
export function applyThemeToDocument(mode: ThemeMode) {
  if (typeof document === 'undefined') return

  const root = document.documentElement
  root.setAttribute('data-theme', mode)

  const isDarkShell = mode === 'default'
  root.classList.toggle(EP_HTML_DARK_CLASS, isDarkShell)

  if (mode === 'monochrome') {
    root.style.colorScheme = 'light'
    const bg = BG_MONO
    root.style.backgroundColor = bg
    if (document.body) document.body.style.backgroundColor = bg
    syncMetaThemeColor(bg)
    applyInlineVars(root, MONOCHROME_INLINE_VARS)
    return
  }

  // default
  root.style.colorScheme = 'dark'
  const bg = BG_DARK
  root.style.backgroundColor = bg
  if (document.body) document.body.style.backgroundColor = bg
  syncMetaThemeColor(bg)
  clearInlineVars(root, MONOCHROME_INLINE_VARS)
}

/** 启动时从 localStorage 读取（含旧键、旧值 light/dark 迁移） */
export function readThemeIdFromStorage(): ThemeMode {
  try {
    let raw = localStorage.getItem(EXCHANGE_THEME_STORAGE_KEY)
    if (raw == null) {
      raw = localStorage.getItem(LEGACY_THEME_STORAGE_KEY)
    }
    return normalizeStoredThemeId(raw)
  } catch {
    return 'default'
  }
}

export function persistThemeIdToStorage(mode: ThemeMode) {
  try {
    localStorage.setItem(EXCHANGE_THEME_STORAGE_KEY, mode)
    if (localStorage.getItem(LEGACY_THEME_STORAGE_KEY) != null) {
      localStorage.removeItem(LEGACY_THEME_STORAGE_KEY)
    }
  } catch {
    /* ignore */
  }
}
