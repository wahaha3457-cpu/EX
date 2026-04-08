/**
 * Asset 模块 — 旧版 REST 常见 snake_case + 字符串数字
 */

import type { AssetsCenterPayload } from '@/types/assetsCenter'

export interface AssetsBalanceRowRaw {
  coin: string
  total: string
  available: string
  frozen: string
  margin: string | null
  usdt_value: string
}

export interface AssetsOverviewRaw {
  total_usdt: string
  today_pnl_usdt: string
  today_pnl_pct: string
  /** NFT 持仓参考估值（可选，缺省 0） */
  nft_estimated_usdt?: string
  /** NFT 持有件数（可选，缺省 0） */
  nft_holdings_count?: string
  distribution: Array<{
    account: string
    label: string
    ratio: string
    value_usdt: string
  }>
}

export interface AssetsLedgerRowRaw {
  id: string
  time: string
  type: string
  coin: string
  amount: string
  balance_after: string | null
  remark: string
}

export interface AssetsDepositRowRaw {
  id: string
  time: string
  coin: string
  amount: string
  status: string
  tx_id: string
  network: string
}

export interface AssetsWithdrawRowRaw {
  id: string
  time: string
  coin: string
  amount: string
  fee: string
  status: string
  address: string
  network: string
}

export interface AssetsTransferRowRaw {
  id: string
  time: string
  from_acct: string
  to_acct: string
  coin: string
  amount: string
  status: string
}

export interface AssetsCenterPayloadRaw {
  overview: AssetsOverviewRaw
  balances: {
    overview: AssetsBalanceRowRaw[]
    spot: AssetsBalanceRowRaw[]
    futures: AssetsBalanceRowRaw[]
    funding: AssetsBalanceRowRaw[]
  }
  records: {
    ledger: AssetsLedgerRowRaw[]
    deposits: AssetsDepositRowRaw[]
    withdraws: AssetsWithdrawRowRaw[]
    transfers: AssetsTransferRowRaw[]
  }
}

export type { AssetsCenterPayload }
