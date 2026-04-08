import { StorageKeys } from '@/constants/storageKeys'

const LEGACY_DELIVERY_KEY = 'ex-delivery-demo-local-v1'
const DELIVERY_SCOPED_PREFIX = 'ex-delivery-demo-local-v2:'
const FUTURES_SCOPED_PREFIX = 'ex-futures-demo-local-v1:'

/** 未登录或尚未缓存 userCode 时的演示数据桶 */
export const TRADE_DEMO_GUEST_SEGMENT = '__guest__'

export function tradeDemoUserSegment(): string {
  if (typeof localStorage === 'undefined') return GUEST_SEGMENT
  try {
    const code = localStorage.getItem(StorageKeys.DEMO_SCOPE_USER_CODE)
    if (code && code.trim().length > 0) return code.trim()
  } catch {
    /* ignore */
  }
  return TRADE_DEMO_GUEST_SEGMENT
}

export function deliveryDemoStorageKey(): string {
  return `${DELIVERY_SCOPED_PREFIX}${tradeDemoUserSegment()}`
}

export function futuresDemoStorageKey(): string {
  return `${FUTURES_SCOPED_PREFIX}${tradeDemoUserSegment()}`
}

/**
 * 自 sessionStorage 的旧 key 迁入 scoped localStorage。
 * 仅迁入访客桶：旧 v1 数据未绑定账号，避免并登录后账号 A。
 */
export function migrateLegacyDeliveryDemoIfEmpty(scopedKey: string): void {
  if (typeof localStorage === 'undefined') return
  try {
    if (!scopedKey.endsWith(`:${TRADE_DEMO_GUEST_SEGMENT}`)) return
    if (localStorage.getItem(scopedKey)) return
    const raw =
      (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(LEGACY_DELIVERY_KEY) : null) ??
      localStorage.getItem(LEGACY_DELIVERY_KEY) ??
      null
    if (!raw) return
    const p = JSON.parse(raw) as { v?: number }
    if (p.v !== 1) return
    localStorage.setItem(scopedKey, raw)
    if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem(LEGACY_DELIVERY_KEY)
    localStorage.removeItem(LEGACY_DELIVERY_KEY)
  } catch {
    /* ignore */
  }
}
