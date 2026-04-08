/**
 * 资产中心 — 与 REST 对齐的类型占位（账户维度、余额行、各类记录）。
 */

/** 顶部账户分类 Tab */
export type AssetsAccountTab = 'overview' | 'spot' | 'futures' | 'funding' | 'earn' | 'nft'

/** 底部记录区 Tab */
export type AssetsRecordTab = 'ledger' | 'deposit' | 'withdraw' | 'transfer'

/** 单币种余额行（列表区） */
export interface AssetsBalanceRow {
  asset: string
  /** 总额 */
  total: number
  available: number
  frozen: number
  /** 合约等：占用保证金；非适用账户为 null */
  marginOccupied: number | null
  /** 折合 USDT */
  valueUsdt: number
}

/** 总览卡：账户分布扇区（图表占位） */
export interface AssetsDistributionSlice {
  account: 'spot' | 'futures' | 'funding' | 'earn' | 'nft'
  label: string
  ratio: number
  valueUsdt: number
}

export interface AssetsOverviewStats {
  /** 总资产估值 USDT */
  totalUsdt: number
  /** 今日盈亏 USDT（预留） */
  todayPnlUsdt: number | null
  /** 今日盈亏比例 %（预留） */
  todayPnlPct: number | null
  /** NFT 持仓参考估值 USDT（演示） */
  nftEstimatedUsdt: number
  /** NFT 持有件数（演示） */
  nftHoldingsCount: number
  distribution: AssetsDistributionSlice[]
}

/** 资金流水 */
export interface AssetsLedgerRow {
  id: string
  time: string
  type: 'TRADE' | 'TRANSFER' | 'FUNDING' | 'FEE' | 'OTHER'
  asset: string
  amount: number
  balanceAfter: number | null
  remark: string
}

/** 充值记录 */
export interface AssetsDepositRow {
  id: string
  time: string
  asset: string
  amount: number
  status: 'PENDING' | 'CONFIRMING' | 'SUCCESS' | 'FAILED'
  txId: string
  network: string
}

/** 提现记录 */
export interface AssetsWithdrawRow {
  id: string
  time: string
  asset: string
  amount: number
  fee: number
  status: 'PENDING' | 'AUDIT' | 'SUCCESS' | 'FAILED'
  address: string
  network: string
  /** Memo / Tag（部分链必填，可选） */
  memo?: string | null
}

/** 划转记录 */
export interface AssetsTransferRow {
  id: string
  time: string
  from: 'spot' | 'futures' | 'funding'
  to: 'spot' | 'futures' | 'funding'
  asset: string
  amount: number
  status: 'SUCCESS' | 'PENDING' | 'FAILED'
}

/** GET /api/v1/assets/center 聚合 */
export interface AssetsCenterPayload {
  overview: AssetsOverviewStats
  balances: {
    overview: AssetsBalanceRow[]
    spot: AssetsBalanceRow[]
    futures: AssetsBalanceRow[]
    funding: AssetsBalanceRow[]
  }
  records: {
    ledger: AssetsLedgerRow[]
    deposits: AssetsDepositRow[]
    withdraws: AssetsWithdrawRow[]
    transfers: AssetsTransferRow[]
  }
}
