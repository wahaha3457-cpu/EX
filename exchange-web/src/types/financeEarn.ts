/** 基金理财 / 智能矿机 — 前端域模型（演示数据可对接 REST） */

export type FundProductKind = 'FLEXIBLE' | 'FIXED'

export interface FundProduct {
  id: string
  name: string
  asset: string
  kind: FundProductKind
  /** 展示用年化，如 5.8 表示 5.8% */
  apyPct: number
  /** 定期天数；活期为 null */
  durationDays: number | null
  minAmount: number
  maxPerUser: number | null
  /** 赎回规则文案 */
  redeemRule: string
  /** 风险等级标签 */
  riskTag: 'LOW' | 'MEDIUM'
}

export interface FundPosition {
  id: string
  productId: string
  amount: number
  accruedInterest: number
  subscribedAt: string
  maturityAt: string | null
  autoRenew: boolean
}

/** 申购 / 赎回 / 续投设置等流水（演示，可对接账务 API） */
export type FundHistoryKind = 'SUBSCRIBE' | 'REDEEM' | 'RENEW_TOGGLE'

export interface FundHistoryEntry {
  id: string
  time: string
  kind: FundHistoryKind
  productId: string
  /** 申购或赎回本金规模（USDT）；续投开关可为 0 */
  amountUsdt: number
  note?: string
}

export interface MinerProduct {
  id: string
  name: string
  /** 额定算力 TH/s */
  hashrateTh: number
  durationDays: number
  priceUsdt: number
  /** 演示：预估日产出 USDT */
  estDailyUsdt: number
  coin: string
  soldPct: number
}

export type MinerOrderStatus = 'MINING' | 'SETTLED'

export interface MinerOrder {
  id: string
  productId: string
  quantity: number
  purchasedAt: string
  endAt: string
  status: MinerOrderStatus
  paidUsdt: number
}
