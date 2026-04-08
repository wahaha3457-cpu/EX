/** 邀请返佣 — 域模型（演示，可对接分销与结算 API） */

export interface ReferralTierInfo {
  level: 1 | 2 | 3
  name: string
  /** 您从好友手续费中获得的返佣比例（展示 %） */
  spotRebatePct: number
  futuresRebatePct: number
  /** 好友享受的交易手续费折扣（展示 %） */
  friendDiscountPct: number
  /** 升级还需有效邀请人数；null 表示已满级 */
  nextLevelNeedInvites: number | null
  /** 当前有效邀请（已交易）人数 */
  effectiveInvited: number
}

export interface ReferralStats {
  totalInvited: number
  effectiveInvited: number
  totalCommissionUsdt: number
  pendingUsdt: number
  settledUsdt: number
}

export interface ReferralInviteeRow {
  id: string
  maskedAccount: string
  registeredAt: string
  kycDone: boolean
  firstTradeAt: string | null
  volume30dUsdt: number
  /** 该好友累计贡献返佣 USDT（演示） */
  contributionUsdt: number
}

export type ReferralCommissionMarket = 'SPOT' | 'FUTURES'

export interface ReferralCommissionRow {
  id: string
  time: string
  market: ReferralCommissionMarket
  fromMasked: string
  feeAsset: string
  amountUsdt: number
}

export interface ReferralDashboard {
  tier: ReferralTierInfo
  stats: ReferralStats
  invitees: ReferralInviteeRow[]
  commissions: ReferralCommissionRow[]
}
