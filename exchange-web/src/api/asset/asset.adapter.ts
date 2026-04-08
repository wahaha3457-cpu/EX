import type {
  AssetsBalanceRow,
  AssetsCenterPayload,
  AssetsDepositRow,
  AssetsLedgerRow,
  AssetsOverviewStats,
  AssetsTransferRow,
  AssetsWithdrawRow,
} from '@/types/assetsCenter'
import type { AssetsCenterPayloadRaw } from '@/api/asset/asset.types'

function num(s: string): number {
  const n = parseFloat(s)
  return Number.isFinite(n) ? n : 0
}

function mapBalance(r: AssetsCenterPayloadRaw['balances']['overview'][0]): AssetsBalanceRow {
  return {
    asset: r.coin,
    total: num(r.total),
    available: num(r.available),
    frozen: num(r.frozen),
    marginOccupied: r.margin === null || r.margin === '' ? null : num(r.margin),
    valueUsdt: num(r.usdt_value),
  }
}

export function adaptAssetsCenter(raw: AssetsCenterPayloadRaw): AssetsCenterPayload {
  const overview: AssetsOverviewStats = {
    totalUsdt: num(raw.overview.total_usdt),
    todayPnlUsdt: num(raw.overview.today_pnl_usdt),
    todayPnlPct: num(raw.overview.today_pnl_pct),
    nftEstimatedUsdt: num(raw.overview.nft_estimated_usdt ?? '0'),
    nftHoldingsCount: Math.max(0, Math.floor(num(raw.overview.nft_holdings_count ?? '0'))),
    distribution: raw.overview.distribution.map((d) => ({
      account: d.account as AssetsOverviewStats['distribution'][0]['account'],
      label: d.label,
      ratio: num(d.ratio),
      valueUsdt: num(d.value_usdt),
    })),
  }

  return {
    overview,
    balances: {
      overview: raw.balances.overview.map(mapBalance),
      spot: raw.balances.spot.map(mapBalance),
      futures: raw.balances.futures.map(mapBalance),
      funding: raw.balances.funding.map(mapBalance),
    },
    records: {
      ledger: raw.records.ledger.map(
        (x): AssetsLedgerRow => ({
          id: x.id,
          time: x.time,
          type: x.type as AssetsLedgerRow['type'],
          asset: x.coin,
          amount: num(x.amount),
          balanceAfter: x.balance_after === null ? null : num(x.balance_after),
          remark: x.remark,
        }),
      ),
      deposits: raw.records.deposits.map(
        (x): AssetsDepositRow => ({
          id: x.id,
          time: x.time,
          asset: x.coin,
          amount: num(x.amount),
          status: x.status as AssetsDepositRow['status'],
          txId: x.tx_id,
          network: x.network,
        }),
      ),
      withdraws: raw.records.withdraws.map(
        (x): AssetsWithdrawRow => ({
          id: x.id,
          time: x.time,
          asset: x.coin,
          amount: num(x.amount),
          fee: num(x.fee),
          status: x.status as AssetsWithdrawRow['status'],
          address: x.address,
          network: x.network,
        }),
      ),
      transfers: raw.records.transfers.map(
        (x): AssetsTransferRow => ({
          id: x.id,
          time: x.time,
          from: x.from_acct as AssetsTransferRow['from'],
          to: x.to_acct as AssetsTransferRow['to'],
          asset: x.coin,
          amount: num(x.amount),
          status: x.status as AssetsTransferRow['status'],
        }),
      ),
    },
  }
}
