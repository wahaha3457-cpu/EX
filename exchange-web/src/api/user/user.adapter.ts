import type {
  UserAccountTier,
  UserCenterAccountCard,
  UserCenterLoginRecord,
  UserCenterOverview,
  UserCenterPayload,
  UserCenterSecurityItem,
  UserKycStatus,
  UserSecurityLevel,
} from '@/types/userCenter'
import type { UserCenterPayloadRaw } from '@/api/user/user.types'

function num(s: string): number {
  const n = parseInt(s, 10)
  return Number.isFinite(n) ? n : 0
}

function tierFromRaw(s: string): UserAccountTier {
  const u = s.toUpperCase()
  if (u === 'VIP1' || u === 'VIP2' || u === 'VIP3') return u
  return 'STANDARD'
}

function secLevelFromRaw(s: string): UserSecurityLevel {
  const u = s.toUpperCase()
  if (u === 'LOW' || u === 'HIGH') return u
  return 'MEDIUM'
}

function kycFromRaw(s: string): UserKycStatus {
  const u = s.toUpperCase()
  if (u === 'PENDING' || u === 'VERIFIED' || u === 'REJECTED') return u
  return 'NONE'
}

export function adaptUserCenter(raw: UserCenterPayloadRaw): UserCenterPayload {
  const account: UserCenterAccountCard = {
    uid: raw.account.uid,
    registeredAt: raw.account.reg_ts,
    accountTier: tierFromRaw(raw.account.tier),
    accountTierLabel: raw.account.tier_label,
    securityLevel: secLevelFromRaw(raw.account.sec_lvl),
    securityScore: num(raw.account.sec_score),
    lastLoginAt: raw.account.last_login_ts,
    lastLoginIp: raw.account.last_login_ip,
  }

  const overview: UserCenterOverview = {
    emailBound: raw.overview.email_on === '1',
    emailMasked: raw.overview.email_mask,
    phoneBound: raw.overview.phone_on === '1',
    phoneMasked: raw.overview.phone_mask,
    kycStatus: kycFromRaw(raw.overview.kyc),
    securityTips: raw.overview.tips,
  }

  const securityItems: UserCenterSecurityItem[] = raw.security.map((s) => ({
    id: s.id,
    title: s.title,
    description: s.desc,
    status: s.st as UserCenterSecurityItem['status'],
    statusLabel: s.st_label,
    actionLabel: s.act,
    reserved: s.rsv === '1',
  }))

  const loginRecords: UserCenterLoginRecord[] = raw.logins.map((r) => ({
    id: r.id,
    time: r.ts,
    ip: r.ip,
    device: r.dev,
    location: r.loc,
    success: r.ok === '1',
  }))

  return { account, overview, securityItems, loginRecords }
}
