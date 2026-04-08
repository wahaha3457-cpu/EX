/**
 * User 模块 — Raw（旧版常见：枚举用数字或简码）
 */

import type { UserCenterPayload } from '@/types/userCenter'

export interface UserAccountRaw {
  uid: string
  reg_ts: string
  tier: string
  tier_label: string
  sec_lvl: string
  sec_score: string
  last_login_ts: string
  last_login_ip: string
}

export interface UserOverviewRaw {
  email_on: string
  email_mask: string | null
  phone_on: string
  phone_mask: string | null
  kyc: string
  tips: string[]
}

export interface UserSecurityItemRaw {
  id: string
  title: string
  desc: string
  st: string
  st_label: string
  act: string
  rsv: string
}

export interface UserLoginRecordRaw {
  id: string
  ts: string
  ip: string
  dev: string
  loc: string | null
  ok: string
}

export interface UserCenterPayloadRaw {
  account: UserAccountRaw
  overview: UserOverviewRaw
  security: UserSecurityItemRaw[]
  logins: UserLoginRecordRaw[]
}

export type { UserCenterPayload }
