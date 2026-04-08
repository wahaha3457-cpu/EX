/** 助力贷 / 质押借币 — 域模型（演示，可对接信贷与抵押借贷 API） */

export interface LendingAssistPlan {
  id: string
  name: string
  termDays: number
  /** 日利率 % 展示 */
  dailyRatePct: number
  minAmount: number
  maxAmount: number
  /** 用途说明 */
  purposeHint: string
}

/** PENDING_REVIEW：已提交、待平台审核；通过后变为 ACTIVE */
export type LendingLoanStatus = 'PENDING_REVIEW' | 'ACTIVE' | 'OVERDUE' | 'SETTLED'

export interface LendingLoan {
  id: string
  planId: string
  principal: number
  /** 应计利息 */
  accruedInterest: number
  borrowedAt: string
  dueAt: string
  status: LendingLoanStatus
}

export interface StakingCollateralAsset {
  id: string
  symbol: string
  /** 钱包可用（可划入质押） */
  walletBalance: number
  /** 已质押数量 */
  lockedAmount: number
  /** 最大初始 LTV % */
  maxInitialLtvPct: number
  /** 补仓/清算线 LTV % */
  liquidationLtvPct: number
  /**
   * 借款日利率（%）展示，与助力贷 dailyRatePct 同口径：如 0.002 表示 0.002%/日。
   * 日利息 ≈ 未偿本金 × (dailyBorrowRatePct / 100)。
   */
  dailyBorrowRatePct: number
}

export interface StakingLoanPosition {
  id: string
  collateralAsset: string
  collateralAmount: number
  borrowedUsdt: number
  /** 应计利息 USDT */
  accruedInterestUsdt: number
  /** 当前 LTV % */
  currentLtvPct: number
  openedAt: string
}

/** 借币 / 还款 / 追加质押 / 结清 流水 */
export type StakingLedgerKind = 'BORROW' | 'REPAY' | 'ADD_COLLATERAL' | 'CLOSED'

export interface StakingLedgerEntry {
  id: string
  time: string
  kind: StakingLedgerKind
  summary: string
}
