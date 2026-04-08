/** 移动端 H5 与后端契约占位 — 路径以 /app 或业务网关为准，对接时与后端文档对齐 */

export interface MobileWalletOverview {
  totalUsdt: string
  availableUsdt: string
  frozenUsdt: string
  escrowUsdt: string
  fiatApproxCny?: string
  change24hPct?: string
}

export interface MobileOtcAdRow {
  id: string
  merchantName: string
  pricePerFiat: string
  limitMin: string
  limitMax: string
  completionRate: string
  payMethods: string[]
}

export interface MobileTaskRow {
  id: string
  title: string
  category: string
  rewardUsdt: string
  deadlineLabel: string
}

export interface MobileUserProfile {
  nickname: string
  uid: string
  creditScore: number
  levelLabel: string
  badges: string[]
}
