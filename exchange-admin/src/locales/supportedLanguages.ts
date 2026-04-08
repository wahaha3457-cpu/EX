/** 应用支持的 BCP-47 语言码（与文案文件名、Element Plus 映射一致） */
export type AppLocaleCode =
  | 'zh-CN'
  | 'zh-TW'
  | 'en'
  | 'ko'
  | 'ja'
  | 'th'
  | 'ms'
  | 'km'
  | 'ru'
  | 'fr'
  | 'de'
  | 'it'
  | 'ar'
  | 'hi'

export const LOCALE_STORAGE_KEY = 'ex-locale'

export const DEFAULT_LOCALE: AppLocaleCode = 'zh-CN'

const CODES: AppLocaleCode[] = [
  'zh-CN',
  'zh-TW',
  'en',
  'ko',
  'ja',
  'th',
  'ms',
  'km',
  'ru',
  'fr',
  'de',
  'it',
  'ar',
  'hi',
]

export function isAppLocaleCode(s: string): s is AppLocaleCode {
  return (CODES as string[]).includes(s)
}

/** 下拉展示用语种自称（运营可改文案，code 勿改） */
export const SUPPORTED_LANGUAGES: { code: AppLocaleCode; nativeName: string }[] = [
  { code: 'zh-CN', nativeName: '简体中文' },
  { code: 'zh-TW', nativeName: '繁體中文' },
  { code: 'en', nativeName: 'English' },
  { code: 'ko', nativeName: '한국어' },
  { code: 'ja', nativeName: '日本語' },
  { code: 'th', nativeName: 'ไทย' },
  { code: 'ms', nativeName: 'Bahasa Melayu' },
  { code: 'km', nativeName: 'ភាសាខ្មែរ' },
  { code: 'ru', nativeName: 'Русский' },
  { code: 'fr', nativeName: 'Français' },
  { code: 'de', nativeName: 'Deutsch' },
  { code: 'it', nativeName: 'Italiano' },
  { code: 'ar', nativeName: 'العربية' },
  { code: 'hi', nativeName: 'हिन्दी' },
]
