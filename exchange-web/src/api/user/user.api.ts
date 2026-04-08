import { getUserCenterDomainMock } from '@/api/user/user.domainMock'
import type { UserCenterPayloadRaw } from '@/api/user/user.types'
import type { UserCenterPayload } from '@/types/userCenter'

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

export function userCenterDomainToRaw(p: UserCenterPayload): UserCenterPayloadRaw {
  return {
    account: {
      uid: p.account.uid,
      reg_ts: p.account.registeredAt,
      tier: p.account.accountTier,
      tier_label: p.account.accountTierLabel,
      sec_lvl: p.account.securityLevel,
      sec_score: String(p.account.securityScore),
      last_login_ts: p.account.lastLoginAt,
      last_login_ip: p.account.lastLoginIp,
    },
    overview: {
      email_on: p.overview.emailBound ? '1' : '0',
      email_mask: p.overview.emailMasked,
      phone_on: p.overview.phoneBound ? '1' : '0',
      phone_mask: p.overview.phoneMasked,
      kyc: p.overview.kycStatus,
      tips: p.overview.securityTips,
    },
    security: p.securityItems.map((s) => ({
      id: s.id,
      title: s.title,
      desc: s.description,
      st: s.status,
      st_label: s.statusLabel,
      act: s.actionLabel,
      rsv: s.reserved ? '1' : '0',
    })),
    logins: p.loginRecords.map((r) => ({
      id: r.id,
      ts: r.time,
      ip: r.ip,
      dev: r.device,
      loc: r.location,
      ok: r.success ? '1' : '0',
    })),
  }
}

export async function fetchUserCenterPayloadRaw(): Promise<UserCenterPayloadRaw> {
  await delay(35)
  // return apiGet<UserCenterPayloadRaw>('/v1/users/center')
  return userCenterDomainToRaw(getUserCenterDomainMock())
}
