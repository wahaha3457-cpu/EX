/**
 * 开发环境 Mock 认证（内存用户表 + 验证码）。
 * 切勿用于生产；密码以明文存内存仅便于本地演示。
 */
import { ErrorCode } from '@/enums/errorCode'
import type { AuthChannel, LoginPayload, LoginResult, RegisterPayload } from '@/types/auth'
import type { UserProfile } from '@/types/user'

interface StoredRecord {
  channel: AuthChannel
  principal: string
  password: string
  userCode: string
  nickname: string
  /** Mock 权限；未设则登录后为普通用户 */
  roles?: string[]
}

const MOCK_TOKEN_KEY = 'ex_mock_token_map'
const MOCK_USERS_KEY = 'ex_mock_users'

const users = new Map<string, StoredRecord>()
const tokenToProfile = new Map<string, UserProfile>()
/** 邮箱/手机注册验证码 target -> code */
const verifyCodes = new Map<string, string>()
/** 找回密码验证码 target -> code */
const resetCodes = new Map<string, string>()

/**
 * Token 映射必须放在 localStorage（与 accessToken 存根一致），否则：
 * 新标签页登录会覆盖 localStorage 中的 token，旧标签用新 token 去查
 * sessionStorage 里的映射 → 校验失败，表现为「被挤下线」。
 * 多标签 / 多人同账号并发测试时，所有已签发 token 都应可查。
 */
function hydrateTokenMap(): void {
  try {
    let raw = localStorage.getItem(MOCK_TOKEN_KEY)
    if (!raw) {
      const legacy = sessionStorage.getItem(MOCK_TOKEN_KEY)
      if (legacy) {
        localStorage.setItem(MOCK_TOKEN_KEY, legacy)
        sessionStorage.removeItem(MOCK_TOKEN_KEY)
        raw = legacy
      }
    }
    if (!raw) return
    const obj = JSON.parse(raw) as Record<string, UserProfile>
    tokenToProfile.clear()
    for (const [k, v] of Object.entries(obj)) {
      tokenToProfile.set(k, v)
    }
  } catch {
    /* ignore */
  }
}

function persistTokenMap(): void {
  try {
    localStorage.setItem(
      MOCK_TOKEN_KEY,
      JSON.stringify(Object.fromEntries(tokenToProfile.entries())),
    )
  } catch {
    /* ignore */
  }
}

function key(channel: AuthChannel, principal: string): string {
  return `${channel}:${principal}`
}

function hydrateUsers(): void {
  try {
    const raw = sessionStorage.getItem(MOCK_USERS_KEY)
    if (!raw) return
    const arr = JSON.parse(raw) as StoredRecord[]
    users.clear()
    for (const rec of arr) {
      users.set(key(rec.channel, rec.principal), rec)
    }
  } catch {
    /* ignore */
  }
}

function persistUsers(): void {
  try {
    sessionStorage.setItem(MOCK_USERS_KEY, JSON.stringify([...users.values()]))
  } catch {
    /* ignore */
  }
}

hydrateTokenMap()
hydrateUsers()

function genUserCode(): string {
  return 'U' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase()
}

function genTokens(): { accessToken: string; refreshToken: string } {
  const id = Math.random().toString(36).slice(2) + Date.now().toString(36)
  return {
    accessToken: `mock_at_${id}`,
    refreshToken: `mock_rt_${id}`,
  }
}

function toProfile(rec: StoredRecord): UserProfile {
  const masked =
    rec.channel === 'email'
      ? maskEmail(rec.principal)
      : rec.channel === 'phone'
        ? maskPhone(rec.principal)
        : undefined
  return {
    userCode: rec.userCode,
    nickname: rec.nickname,
    emailMasked: masked,
    kycLevel: 0,
    status: 1,
    roles: rec.roles?.length ? rec.roles : ['USER'],
  }
}

function maskEmail(email: string): string {
  const [a, b] = email.split('@')
  if (!b) return '***'
  const head = a.slice(0, 2)
  return `${head}***@${b}`
}

function maskPhone(phone: string): string {
  if (phone.length < 7) return '***'
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`
}

function reject(message: string, code: string = ErrorCode.SYS_PARAM_INVALID): never {
  const err = new Error(message) as Error & { code: string }
  err.code = code
  throw err
}

export async function mockLogin(payload: LoginPayload): Promise<LoginResult> {
  await delay(280)
  hydrateUsers()
  const k = key(payload.channel, payload.principal)
  const rec = users.get(k)
  if (!rec || rec.password !== payload.password) {
    reject('账号或密码错误')
  }
  const user = toProfile(rec)
  const { accessToken, refreshToken } = genTokens()
  tokenToProfile.set(accessToken, user)
  persistTokenMap()
  return {
    accessToken,
    refreshToken,
    expiresIn: 3600,
    user,
  }
}

export async function mockRegister(payload: RegisterPayload): Promise<LoginResult> {
  await delay(320)
  hydrateUsers()
  const k = key(payload.channel, payload.principal)
  if (users.has(k)) {
    reject('该账号已注册，请直接登录')
  }
  if (payload.channel === 'email' || payload.channel === 'phone') {
    const code = verifyCodes.get(payload.principal)
    if (!code || code !== (payload.verifyCode || '').trim()) {
      reject('验证码错误或已过期')
    }
    verifyCodes.delete(payload.principal)
  }
  const userCode = genUserCode()
  const rec: StoredRecord = {
    channel: payload.channel,
    principal: payload.principal,
    password: payload.password,
    userCode,
    nickname:
      payload.channel === 'account'
        ? payload.principal
        : payload.channel === 'email'
          ? payload.principal.split('@')[0]
          : `用户${payload.principal.slice(-4)}`,
  }
  users.set(k, rec)
  persistUsers()
  const user = toProfile(rec)
  const { accessToken, refreshToken } = genTokens()
  tokenToProfile.set(accessToken, user)
  persistTokenMap()
  return {
    accessToken,
    refreshToken,
    expiresIn: 3600,
    user,
  }
}

export async function mockSendVerifyCode(target: string): Promise<void> {
  await delay(400)
  const code = String(Math.floor(100000 + Math.random() * 900000))
  verifyCodes.set(target, code)
  // 便于 MOCK 环境跑通流程
  console.info(`[Mock] 验证码 ${target} => ${code}`)
}

export async function mockSendPasswordResetCode(target: string): Promise<void> {
  await delay(380)
  const code = String(Math.floor(100000 + Math.random() * 900000))
  resetCodes.set(target, code)
  console.info(`[Mock] 找回密码验证码 ${target} => ${code}`)
}

/** 取当前 Mock 验证码（仅 MOCK 下给 UI 展示） */
export function mockPeekVerifyCode(target: string): string | undefined {
  return verifyCodes.get(target)
}

export function mockPeekResetCode(target: string): string | undefined {
  return resetCodes.get(target)
}

export async function mockResetPassword(body: {
  channel: 'email' | 'phone'
  target: string
  verifyCode: string
  newPassword: string
}): Promise<void> {
  await delay(420)
  hydrateUsers()
  const code = resetCodes.get(body.target)
  if (!code || code !== body.verifyCode.trim()) {
    reject('验证码错误或已过期')
  }
  const k = key(body.channel, body.target)
  const rec = users.get(k)
  if (!rec) {
    reject('账号不存在')
  }
  rec.password = body.newPassword
  users.set(k, rec)
  persistUsers()
  resetCodes.delete(body.target)
}

export async function mockFetchProfile(accessToken: string | null): Promise<UserProfile> {
  await delay(120)
  hydrateTokenMap()
  if (!accessToken) reject('未登录', ErrorCode.AUTH_TOKEN_MISSING)
  const u = tokenToProfile.get(accessToken)
  if (!u) reject('登录已失效', ErrorCode.AUTH_TOKEN_INVALID)
  return { ...u }
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

/** 当前 Mock 会话是否为管理员（用于放大交易/资产 Mock 余额） */
export function isMockAdminSession(accessToken: string | null): boolean {
  if (!accessToken) return false
  hydrateTokenMap()
  const u = tokenToProfile.get(accessToken)
  return !!u?.roles?.some((r) => r === 'ADMIN' || r === 'SUPER_ADMIN')
}

/** 仅清理登录态映射；保留 Mock 用户表以便再次登录 */
export function mockClearAuthStorage(): void {
  try {
    localStorage.removeItem(MOCK_TOKEN_KEY)
    sessionStorage.removeItem(MOCK_TOKEN_KEY)
  } catch {
    /* ignore */
  }
  tokenToProfile.clear()
}

/** 注册演示账号（可选） */
export function mockSeedDemoUser(): void {
  const email = 'demo@exchange.com'
  const k = key('email', email)
  if (users.has(k)) return
  users.set(k, {
    channel: 'email',
    principal: email,
    password: 'Demo12345',
    userCode: 'UDEMO001',
    nickname: 'Demo',
  })
  persistUsers()
}

/**
 * 管理员测试账号：含 ADMIN 角色；Mock 下现货/合约/资产中心返回高额余额。
 * 邮箱登录 → admin@exchange.com / admin12345（dev 多人并发登录依赖 token 映射存 localStorage）
 */
export function mockSeedAdminUser(): void {
  hydrateUsers()
  const email = 'admin@exchange.com'
  const k = key('email', email)
  const existing = users.get(k)
  if (existing) {
    if (!existing.roles?.includes('ADMIN')) {
      existing.roles = ['ADMIN', 'USER']
    }
    existing.password = 'admin12345'
    users.set(k, existing)
    persistUsers()
    return
  }
  users.set(k, {
    channel: 'email',
    principal: email,
    password: 'admin12345',
    userCode: 'UADMIN001',
    nickname: 'Exchange Admin',
    roles: ['ADMIN', 'USER'],
  })
  persistUsers()
}

/**
 * 独立运营后台门户专用 Mock 账号（与前台主站分离测试）。
 * 邮箱：portal@admin.test / AdminPortal@2026
 */
export function mockSeedPortalAdminUser(): void {
  hydrateUsers()
  const email = 'portal@admin.test'
  const k = key('email', email)
  const existing = users.get(k)
  if (existing) {
    existing.password = 'AdminPortal@2026'
    existing.roles = ['ADMIN', 'USER']
    existing.nickname = 'Portal Admin'
    users.set(k, existing)
    persistUsers()
    return
  }
  users.set(k, {
    channel: 'email',
    principal: email,
    password: 'AdminPortal@2026',
    userCode: 'APORTAL01',
    nickname: 'Portal Admin',
    roles: ['ADMIN', 'USER'],
  })
  persistUsers()
}
