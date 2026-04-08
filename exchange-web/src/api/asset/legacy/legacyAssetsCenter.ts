import { legacyTryGet, legacyTryPost } from '@/api/auth/legacy/legacyHttp'
import type { AssetsBalanceRowRaw, AssetsCenterPayloadRaw } from '@/api/asset/asset.types'
import { unwrapPageRecords } from '@/api/trade/legacy/mapLegacySpot'

function asRec(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null
}

function numStr(v: unknown): string {
  if (v == null) return '0'
  if (typeof v === 'number' && Number.isFinite(v)) return String(v)
  return String(v)
}

function extractWalletRows(data: unknown): Record<string, unknown>[] {
  const fromPages = unwrapPageRecords(data)
    .map((x) => asRec(x))
    .filter((x): x is Record<string, unknown> => x != null)
  if (fromPages.length) return fromPages

  const o = asRec(data)
  if (Array.isArray(data)) {
    return data.map((x) => asRec(x)).filter((x): x is Record<string, unknown> => x != null)
  }
  if (!o) return []
  const inner =
    o.walletList ?? o.list ?? o.data ?? o.records ?? o.rows ?? o.balances ?? o.assets ?? o.items
  if (Array.isArray(inner)) {
    return inner.map((x) => asRec(x)).filter((x): x is Record<string, unknown> => x != null)
  }
  return []
}

function mapRow(r: Record<string, unknown>): AssetsBalanceRowRaw {
  const coin = String(r.symbol ?? r.coin ?? r.currency ?? r.asset ?? '').toUpperCase() || '—'
  const total = r.balance ?? r.total ?? r.amount
  const avail = r.available ?? r.free ?? total
  const frozen = r.frozen ?? r.lock ?? 0
  return {
    coin,
    total: numStr(total),
    available: numStr(avail),
    frozen: numStr(frozen),
    margin: r.margin != null ? numStr(r.margin) : null,
    usdt_value: numStr(r.usdtValue ?? r.usdt_amount ?? r.estimatedValue ?? r.usdt ?? total),
  }
}

function sumUsdtFromRows(rows: AssetsBalanceRowRaw[]): number {
  let s = 0
  for (const r of rows) {
    const n = parseFloat(r.usdt_value)
    if (Number.isFinite(n)) s += n
  }
  return s
}

/**
 * `/api/wallet/getNewAllSumAndAssets.action` + `/api/wallet/getAllWalletBalance`
 */
export async function fetchLegacyAssetsCenterRaw(): Promise<AssetsCenterPayloadRaw> {
  const sumPath =
    import.meta.env.VITE_LEGACY_WALLET_SUM_ASSETS || '/api/wallet/getNewAllSumAndAssets.action'
  const balancePath =
    import.meta.env.VITE_LEGACY_WALLET_ALL_BALANCE || '/api/wallet/getAllWalletBalance'

  const [sumData, listData] = await Promise.all([
    legacyTryGet<unknown>(sumPath, {}),
    legacyTryPost<unknown>(balancePath, {}),
  ])

  const rows = extractWalletRows(listData).map(mapRow)
  const totalFromApi = extractTotalUsdt(sumData)
  const totalUsdt =
    totalFromApi > 0 ? String(totalFromApi) : String(sumUsdtFromRows(rows))

  const overview = {
    total_usdt: totalUsdt,
    today_pnl_usdt: '0',
    today_pnl_pct: '0',
    nft_estimated_usdt: '0',
    nft_holdings_count: '0',
    distribution: [
      {
        account: 'spot',
        label: '现货账户',
        ratio: '1',
        value_usdt: totalUsdt,
      },
    ],
  }

  return {
    overview,
    balances: {
      overview: rows,
      spot: rows,
      futures: [],
      funding: [],
    },
    records: {
      ledger: [],
      deposits: [],
      withdraws: [],
      transfers: [],
    },
  }
}

function extractTotalUsdt(data: unknown): number {
  const o = asRec(data)
  if (!o) return 0
  const v = o.totalUsdt ?? o.total_usdt ?? o.sumUsdt ?? o.allUsdt ?? o.amount
  const n = parseFloat(String(v ?? 0))
  return Number.isFinite(n) ? n : 0
}
