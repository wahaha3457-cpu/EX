import type { UserProfile } from '@/types/user'

export type AuthChannel = 'email' | 'phone' | 'account'

export interface LoginPayload {
  channel: AuthChannel
  principal: string
  password: string
}

export interface RegisterPayload {
  channel: AuthChannel
  principal: string
  password: string
  /** 邮箱/手机注册必填 */
  verifyCode?: string
  inviteCode?: string
}

export interface LoginResult {
  accessToken: string
  expiresIn: number
  refreshToken?: string
  user: UserProfile
}
