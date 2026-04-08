/**
 * 多语言文案入口。
 * - `zh-CN.json` / `en.json` / `zh-TW.json`：基础命名空间（nav、layout、footer、common）。
 * - `fragments/*`：按域拆分的补充包（routes、auth…），由 mergeDeep 合并。
 * - 其余语种：与合并后的 en 深拷贝一致，可按需替换翻译。
 */
import type { AppLocaleCode } from '@/locales/supportedLanguages'
import { mergeDeep } from '@/locales/mergeDeep'
import zhCN from './zh-CN.json'
import en from './en.json'
import zhTW from './zh-TW.json'
import routesZhCN from './fragments/zh-CN/routes.json'
import authZhCN from './fragments/zh-CN/auth.json'
import routesEn from './fragments/en/routes.json'
import authEn from './fragments/en/auth.json'
import routesZhTW from './fragments/zh-TW/routes.json'
import authZhTW from './fragments/zh-TW/auth.json'
import pagesZhCN from './fragments/zh-CN/pages.json'
import pagesEn from './fragments/en/pages.json'
import pagesZhTW from './fragments/zh-TW/pages.json'
import adminZhCN from './fragments/zh-CN/admin.json'
import adminEn from './fragments/en/admin.json'
import adminZhTW from './fragments/zh-TW/admin.json'
import kycZhCN from './fragments/zh-CN/kyc.json'
import kycEn from './fragments/en/kyc.json'
import kycZhTW from './fragments/zh-TW/kyc.json'
import nftZhCN from './fragments/zh-CN/nft.json'
import nftEn from './fragments/en/nft.json'
import nftZhTW from './fragments/zh-TW/nft.json'
import newsZhCN from './fragments/zh-CN/news.json'
import newsEn from './fragments/en/news.json'
import newsZhTW from './fragments/zh-TW/news.json'
import charityZhCN from './fragments/zh-CN/charity.json'
import charityEn from './fragments/en/charity.json'
import charityZhTW from './fragments/zh-TW/charity.json'

function deepClone<T>(x: T): T {
  return JSON.parse(JSON.stringify(x)) as T
}

const zhCNMerged = mergeDeep(
  zhCN as Record<string, unknown>,
  routesZhCN as Record<string, unknown>,
  authZhCN as Record<string, unknown>,
  pagesZhCN as Record<string, unknown>,
  adminZhCN as Record<string, unknown>,
  kycZhCN as Record<string, unknown>,
  nftZhCN as Record<string, unknown>,
  newsZhCN as Record<string, unknown>,
  charityZhCN as Record<string, unknown>,
)
const enMerged = mergeDeep(
  en as Record<string, unknown>,
  routesEn as Record<string, unknown>,
  authEn as Record<string, unknown>,
  pagesEn as Record<string, unknown>,
  adminEn as Record<string, unknown>,
  kycEn as Record<string, unknown>,
  nftEn as Record<string, unknown>,
  newsEn as Record<string, unknown>,
  charityEn as Record<string, unknown>,
)
const zhTWMerged = mergeDeep(
  zhTW as Record<string, unknown>,
  routesZhTW as Record<string, unknown>,
  authZhTW as Record<string, unknown>,
  pagesZhTW as Record<string, unknown>,
  adminZhTW as Record<string, unknown>,
  kycZhTW as Record<string, unknown>,
  nftZhTW as Record<string, unknown>,
  newsZhTW as Record<string, unknown>,
  charityZhTW as Record<string, unknown>,
)

export function getLocaleMessages(): Record<AppLocaleCode, Record<string, unknown>> {
  const fromEn = () => deepClone(enMerged) as Record<string, unknown>

  return {
    'zh-CN': zhCNMerged,
    en: enMerged,
    'zh-TW': zhTWMerged,
    ko: fromEn(),
    ja: fromEn(),
    th: fromEn(),
    ms: fromEn(),
    km: fromEn(),
    ru: fromEn(),
    fr: fromEn(),
    de: fromEn(),
    it: fromEn(),
    ar: fromEn(),
    hi: fromEn(),
  }
}
