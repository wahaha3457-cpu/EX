/**
 * 与 Knife4j / Swagger 对齐（外汇管理平台 v2 文档）。
 * 文档：https://bian50test.qdjkdo.com/api/doc.html#/home
 * OpenAPI：`/api/v2/api-docs?group=外汇管理平台`
 *
 * 说明：登录、注册在文档中为 **POST + Query 参数**（非 JSON body），字段名大小写需与后端一致（如 passWord、verifcode）。
 */
import type { LoginPayload, RegisterPayload } from '@/types/auth'

/** 注册类型：1 手机；2 邮箱；3 用户名（文档原文） */
export function legacyAuthType(channel: LoginPayload['channel']): number {
  if (channel === 'phone') return 1
  if (channel === 'email') return 2
  return 3
}

/** 相对 legacyAuthApiBase() 的路径（代理 `/legacy-api` → 站点 `/api`） */
export const LEGACY_AUTH_PATHS = {
  /** POST `/api/login` — 手机/邮箱/账号登录 */
  login: import.meta.env.VITE_LEGACY_PATH_LOGIN || '/api/login',
  /** POST `/api/registerNoVerifcode` — 无验证码注册（本站用于「用户名」注册） */
  registerNoVerify: import.meta.env.VITE_LEGACY_PATH_REGISTER_NO_VERIFY || '/api/registerNoVerifcode',
  /** POST `/api/registerVerifcode` — 手机/邮箱 + 验证码注册 */
  registerWithVerify: import.meta.env.VITE_LEGACY_PATH_REGISTER_WITH_VERIFY || '/api/registerVerifcode',
  /**
   * POST `/api/idcode/execute?target=` — 文档仅标注 target；用于发送注册验证码（若线上不同可改 env）。
   */
  sendVerifyCode: import.meta.env.VITE_LEGACY_PATH_SEND_CODE || '/api/idcode/execute',
} as const

/** 登录 Query：passWord、userName、type、verifyCode（可选） */
export function buildLegacyLoginQuery(payload: LoginPayload): Record<string, string | number> {
  const userName = payload.principal.trim()
  const q: Record<string, string | number> = {
    passWord: payload.password,
    userName,
    type: legacyAuthType(payload.channel),
  }
  return q
}

/**
 * 无验证码注册 Query：password、userName、type、userCode、safeword（可选）
 */
export function buildLegacyRegisterNoVerifyQuery(payload: RegisterPayload): Record<string, string | number> {
  const q: Record<string, string | number> = {
    password: payload.password,
    userName: payload.principal.trim(),
    type: legacyAuthType(payload.channel),
  }
  if (payload.inviteCode) q.userCode = payload.inviteCode
  return q
}

/**
 * 验证码注册 Query：verifcode、password、userName、type、userCode、safeword（可选）
 */
export function buildLegacyRegisterWithVerifyQuery(payload: RegisterPayload): Record<string, string | number> {
  const code = payload.verifyCode?.trim()
  if (!code) {
    throw new Error('注册验证码不能为空')
  }
  const q: Record<string, string | number> = {
    password: payload.password,
    userName: payload.principal.trim(),
    type: legacyAuthType(payload.channel),
    verifcode: code,
  }
  if (payload.inviteCode) q.userCode = payload.inviteCode
  return q
}

/** 发送验证码：仅 target（与 Swagger 一致） */
export function buildLegacySendCodeQuery(body: { channel: 'email' | 'phone'; target: string }): Record<string, string> {
  return { target: body.target.trim() }
}

/**
 * 业务成功：文档含 `succeed`，且常见 code 为 0 / 200。
 */
export function isLegacySuccess(code: unknown, succeed?: unknown): boolean {
  if (succeed === true) return true
  if (code === 0 || code === '0') return true
  if (code === 200 || code === '200') return true
  return false
}
