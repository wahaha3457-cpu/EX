/**
 * 用户偏好（演示：按账号本地持久化；生产可对齐 GET/PUT /v1/users/preferences）
 */

export const PREFERENCES_STORAGE_PREFIX = 'ex-prefs:v1:' as const

export type CandlePaletteMode = 'cn' | 'intl'

/** 日期展示习惯（演示记录；账单/导出可对齐） */
export type DateFormatPreference = 'iso' | 'locale_cn' | 'locale_us'

export interface UserPreferencesState {
  candlePalette: CandlePaletteMode
  dateFormat: DateFormatPreference
  /** IANA 时区标识，或 `auto` 跟随浏览器 */
  timeZone: string
  confirmSpotOrder: boolean
  confirmFuturesOrder: boolean
  notifyEmailMarketing: boolean
  notifyPriceAlert: boolean
  notifyOrderFilled: boolean
  privacyHideBalances: boolean
}
