/**
 * 用户中心 — 账户扩展信息与安全/日志（与 GET /v1/users/center 等对齐）。
 */

export type UserCenterNavTab =
  | 'overview'
  | 'security'
  | 'kyc'
  | 'api'
  | 'login'
  | 'preferences'

/** 安全等级：低 / 中 / 高 */
export type UserSecurityLevel = 'LOW' | 'MEDIUM' | 'HIGH'

/** 账户等级（预留：VIP） */
export type UserAccountTier = 'STANDARD' | 'VIP1' | 'VIP2' | 'VIP3'

/** KYC 状态 */
export type UserKycStatus = 'NONE' | 'PENDING' | 'VERIFIED' | 'REJECTED'

export interface UserCenterAccountCard {
  /** 展示用 UID，可与 auth.user.userCode 合并 */
  uid: string
  registeredAt: string
  accountTier: UserAccountTier
  accountTierLabel: string
  securityLevel: UserSecurityLevel
  securityScore: number
  lastLoginAt: string
  lastLoginIp: string
}

export interface UserCenterOverview {
  emailBound: boolean
  emailMasked: string | null
  phoneBound: boolean
  phoneMasked: string | null
  kycStatus: UserKycStatus
  /** 0 未通过 / 1 基础 / 2 进阶（与 KYC 面板同步） */
  kycTier?: 0 | 1 | 2
  securityTips: string[]
}

/** 安全项单行（列表展示） */
export interface UserCenterSecurityItem {
  id: string
  title: string
  description: string
  status: 'ON' | 'OFF' | 'PARTIAL'
  statusLabel: string
  actionLabel: string
  /** 是否仅展示预留文案 */
  reserved?: boolean
}

export interface UserCenterLoginRecord {
  id: string
  time: string
  ip: string
  device: string
  /** 预留：IP 解析地理位置 */
  location: string | null
  success: boolean
}

export interface UserCenterPayload {
  account: UserCenterAccountCard
  overview: UserCenterOverview
  securityItems: UserCenterSecurityItem[]
  loginRecords: UserCenterLoginRecord[]
}
