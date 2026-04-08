/**
 * 应用 locale → Element Plus 组件文案（马来语、印地语 EP 无包，回退英文）
 * 各语言包结构版本略有差异，统一按 EP 运行时类型交给 ConfigProvider。
 */
import type { AppLocaleCode } from '@/locales/supportedLanguages'
import ar from 'element-plus/es/locale/lang/ar'
import de from 'element-plus/es/locale/lang/de'
import en from 'element-plus/es/locale/lang/en'
import fr from 'element-plus/es/locale/lang/fr'
import it from 'element-plus/es/locale/lang/it'
import ja from 'element-plus/es/locale/lang/ja'
import km from 'element-plus/es/locale/lang/km'
import ko from 'element-plus/es/locale/lang/ko'
import ru from 'element-plus/es/locale/lang/ru'
import th from 'element-plus/es/locale/lang/th'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import zhTw from 'element-plus/es/locale/lang/zh-tw'

/** Element 各语言包与当前 EP 类型定义不完全一致，运行时交给 ConfigProvider 即可 */
type EpLocale = any

const fallback = en

const MAP: Record<AppLocaleCode, EpLocale> = {
  'zh-CN': zhCn,
  'zh-TW': zhTw,
  en,
  ko,
  ja,
  th,
  ms: fallback,
  km,
  ru,
  fr,
  de,
  it,
  ar,
  hi: fallback,
}

export function getElementPlusLocale(code: AppLocaleCode): EpLocale {
  return MAP[code] ?? fallback
}
