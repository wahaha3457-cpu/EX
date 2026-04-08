import type { ReferralDashboard } from '@/types/referralInvite'

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

/** 与 userCode 无关的演示数据；store 层会替换邀请码文案 */
export async function fetchReferralDashboard(_userCode: string): Promise<ReferralDashboard> {
  await delay(140)
  return {
    tier: {
      level: 2,
      name: '白银',
      spotRebatePct: 20,
      futuresRebatePct: 10,
      friendDiscountPct: 10,
      nextLevelNeedInvites: 4,
      effectiveInvited: 8,
    },
    stats: {
      totalInvited: 14,
      effectiveInvited: 8,
      totalCommissionUsdt: 1_286.55,
      pendingUsdt: 42.18,
      settledUsdt: 1_244.37,
    },
    invitees: [
      {
        id: 'inv-1',
        maskedAccount: 'ab***@mail.com',
        registeredAt: '2026-03-20T11:20:00+08:00',
        kycDone: true,
        firstTradeAt: '2026-03-20T14:05:00+08:00',
        volume30dUsdt: 128_400,
        contributionUsdt: 186.2,
      },
      {
        id: 'inv-2',
        maskedAccount: '138****6602',
        registeredAt: '2026-03-18T09:00:00+08:00',
        kycDone: true,
        firstTradeAt: '2026-03-19T10:12:00+08:00',
        volume30dUsdt: 56_200,
        contributionUsdt: 72.5,
      },
      {
        id: 'inv-3',
        maskedAccount: 'tr***@gmail.com',
        registeredAt: '2026-03-15T16:40:00+08:00',
        kycDone: false,
        firstTradeAt: null,
        volume30dUsdt: 0,
        contributionUsdt: 0,
      },
    ],
    commissions: [
      {
        id: 'rc-1',
        time: '2026-03-28T22:10:00+08:00',
        market: 'SPOT',
        fromMasked: 'ab***@mail.com',
        feeAsset: 'USDT',
        amountUsdt: 12.35,
      },
      {
        id: 'rc-2',
        time: '2026-03-28T18:02:00+08:00',
        market: 'FUTURES',
        fromMasked: '138****6602',
        feeAsset: 'USDT',
        amountUsdt: 6.08,
      },
      {
        id: 'rc-3',
        time: '2026-03-27T09:55:00+08:00',
        market: 'SPOT',
        fromMasked: 'ab***@mail.com',
        feeAsset: 'USDT',
        amountUsdt: 8.92,
      },
    ],
  }
}
