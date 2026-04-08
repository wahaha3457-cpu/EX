import {
  LEGACY_AUTH_PATHS,
  buildLegacyLoginQuery,
  buildLegacyRegisterNoVerifyQuery,
  buildLegacyRegisterWithVerifyQuery,
  buildLegacySendCodeQuery,
} from '@/api/auth/legacy/legacyContract'
import { legacyPostQuery } from '@/api/auth/legacy/legacyHttp'
import { extractAccessToken, mapLegacyDataToLoginResult } from '@/api/auth/legacy/mapLegacySession'
import type { LoginPayload, LoginResult, RegisterPayload } from '@/types/auth'

export async function legacyLoginApi(payload: LoginPayload): Promise<LoginResult> {
  const params = buildLegacyLoginQuery(payload)
  const data = await legacyPostQuery<unknown>(LEGACY_AUTH_PATHS.login, params)
  return mapLegacyDataToLoginResult(data)
}

/**
 * 邮箱/手机走「有验证码」注册；用户名走「无验证码」注册。
 * 若「有验证码」接口未返回 TokenInfoVO，则自动用同一账号密码调一次登录。
 */
export async function legacyRegisterApi(payload: RegisterPayload): Promise<LoginResult> {
  const needPhoneEmailVerify = payload.channel === 'email' || payload.channel === 'phone'
  if (needPhoneEmailVerify) {
    const params = buildLegacyRegisterWithVerifyQuery(payload)
    const data = await legacyPostQuery<unknown>(LEGACY_AUTH_PATHS.registerWithVerify, params)
    if (extractAccessToken(data)) {
      return mapLegacyDataToLoginResult(data)
    }
    return legacyLoginApi({
      channel: payload.channel,
      principal: payload.principal,
      password: payload.password,
    })
  }
  const params = buildLegacyRegisterNoVerifyQuery(payload)
  const data = await legacyPostQuery<unknown>(LEGACY_AUTH_PATHS.registerNoVerify, params)
  return mapLegacyDataToLoginResult(data)
}

export async function legacySendVerifyCodeApi(body: { channel: 'email' | 'phone'; target: string }): Promise<void> {
  const path = LEGACY_AUTH_PATHS.sendVerifyCode
  if (!path || path === '/__disabled__') {
    throw new Error('未配置发送验证码路径：请在 legacyContract / VITE_LEGACY_PATH_SEND_CODE 中设置')
  }
  await legacyPostQuery(path, buildLegacySendCodeQuery(body))
}
