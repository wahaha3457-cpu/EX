import type { LoginResult } from '@/types/auth'
import type { UserProfile } from '@/types/user'

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null
}

/**
 * 从 data 中取访问令牌。
 * TokenInfoVO：文档要求后续请求 Header 带 `Token`，字段优先用 `token`，其次 `accessToken`。
 */
export function extractAccessToken(data: unknown): string {
  const o = asRecord(data)
  if (!o) return ''
  const t =
    o.token ??
    o.accessToken ??
    o.access_token ??
    o.jwt ??
    (asRecord(o.data)?.token as string | undefined)
  return t != null ? String(t) : ''
}

function pickStr(o: Record<string, unknown>, keys: string[]): string | undefined {
  for (const k of keys) {
    const v = o[k]
    if (v != null && String(v).length > 0) return String(v)
  }
  return undefined
}

/** 将各种 userInfo 形状归一为前端 UserProfile */
export function extractUserProfile(data: unknown): UserProfile {
  const root = asRecord(data)
  if (!root) {
    return { userCode: 'UNKNOWN' }
  }
  const u =
    asRecord(root.user) ||
    asRecord(root.userInfo) ||
    asRecord(root.member) ||
    asRecord(root.account) ||
    asRecord(root.info) ||
    root

  const userCode =
    pickStr(u, ['userCode', 'userId', 'uid', 'id', 'memberId', 'accountId']) ||
    pickStr(root, ['userName', 'username']) ||
    'UNKNOWN'
  const nickname =
    pickStr(u, ['nickname', 'nickName', 'name', 'username']) || pickStr(root, ['userName'])
  const emailMasked = pickStr(u, ['emailMasked', 'email', 'mail'])
  const avatarUrl = pickStr(u, ['avatarUrl', 'avatar', 'headImg'])
  const kycRaw = u.kycLevel ?? u.kyc ?? u.authLevel
  const kycLevel = typeof kycRaw === 'number' ? kycRaw : kycRaw != null ? Number(kycRaw) : undefined

  return {
    userCode,
    nickname,
    emailMasked,
    avatarUrl,
    kycLevel: Number.isFinite(kycLevel) ? kycLevel : undefined,
  }
}

export function extractExpiresIn(data: unknown): number {
  const o = asRecord(data)
  if (!o) return 3600
  const e = o.expiresIn ?? o.expireTime ?? o.expires ?? o.tokenExpire
  if (typeof e === 'number' && Number.isFinite(e)) return e
  if (typeof e === 'string' && /^\d+$/.test(e)) return parseInt(e, 10)
  return 3600
}

export function extractRefreshToken(data: unknown): string | undefined {
  const o = asRecord(data)
  if (!o) return undefined
  const r = o.refreshToken ?? o.refresh_token
  return r != null ? String(r) : undefined
}

/** 将登录/注册返回的 data 块映射为统一 LoginResult */
export function mapLegacyDataToLoginResult(data: unknown): LoginResult {
  const token = extractAccessToken(data)
  if (!token) {
    throw new Error('登录成功但未解析到 token，请在 mapLegacySession.ts / legacyContract 中按文档调整字段')
  }
  return {
    accessToken: token,
    expiresIn: extractExpiresIn(data),
    refreshToken: extractRefreshToken(data),
    user: extractUserProfile(data),
  }
}
