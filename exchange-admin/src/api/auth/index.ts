import { apiPost, apiGet } from '@/api/common/http'
import { isLegacyAuthMode, isMockMode } from '@/config/env'
import type { UserProfile } from '@/types/user'
import type { LoginPayload, LoginResult, RegisterPayload } from '@/types/auth'
import { getAccessToken } from '@/utils/tokenStorage'
import {
  legacyLoginApi,
  legacyRegisterApi,
  legacySendVerifyCodeApi,
} from '@/api/auth/legacy/legacyAuthApi'

export type { AuthChannel, LoginPayload, RegisterPayload, LoginResult } from '@/types/auth'

/** 登录：Mock > 原项目(legacy) > 本仓库 exchange-server 默认 /v1/auth/login */
export function loginApi(payload: LoginPayload) {
  if (isMockMode()) {
    return import('@/mocks/authMockService').then((m) => m.mockLogin(payload))
  }
  if (isLegacyAuthMode()) {
    return legacyLoginApi(payload)
  }
  return apiPost<LoginResult>('/v1/auth/login', toExchangeServerLoginBody(payload))
}

/** 注册 */
export function registerApi(payload: RegisterPayload) {
  if (isMockMode()) {
    return import('@/mocks/authMockService').then((m) => m.mockRegister(payload))
  }
  if (isLegacyAuthMode()) {
    return legacyRegisterApi(payload)
  }
  return apiPost<LoginResult>('/v1/auth/register', payload)
}

export function sendVerifyCodeApi(body: { channel: 'email' | 'phone'; target: string }) {
  if (isMockMode()) {
    return import('@/mocks/authMockService').then((m) => m.mockSendVerifyCode(body.target))
  }
  if (isLegacyAuthMode()) {
    return legacySendVerifyCodeApi(body)
  }
  return apiPost<void>('/v1/auth/verify-code/send', body)
}

/** 找回密码：发送验证码（与注册复用同一发送通道；后端可按业务模板区分） */
export function sendPasswordResetCodeApi(body: { channel: 'email' | 'phone'; target: string }) {
  if (isMockMode()) {
    return import('@/mocks/authMockService').then((m) => m.mockSendPasswordResetCode(body.target))
  }
  if (isLegacyAuthMode()) {
    // legacy 端暂复用同一验证码发送
    return legacySendVerifyCodeApi(body)
  }
  return apiPost<void>('/v1/auth/password/reset/code', body)
}

/** 找回密码：校验验证码并重置密码 */
export function resetPasswordApi(body: {
  channel: 'email' | 'phone'
  target: string
  verifyCode: string
  newPassword: string
}) {
  if (isMockMode()) {
    return import('@/mocks/authMockService').then((m) => m.mockResetPassword(body))
  }
  if (isLegacyAuthMode()) {
    return apiPost<void>('/v1/auth/password/reset', body)
  }
  return apiPost<void>('/v1/auth/password/reset', body)
}

/** 本仓库 Java 骨架仅接受 principal + password */
function toExchangeServerLoginBody(payload: LoginPayload) {
  return {
    principal: payload.principal.trim(),
    password: payload.password,
  }
}

export function fetchProfileApi() {
  if (isMockMode()) {
    return import('@/mocks/authMockService').then((m) => m.mockFetchProfile(getAccessToken()))
  }
  return apiGet<UserProfile>('/v1/users/me')
}
