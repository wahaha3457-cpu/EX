import { apiGet } from '@/api/common/http'
import type { SpotBalanceRowDto } from '@/api/trade/exchangeSpot'

/**
 * 主干 `GET /v1/spot/wallet/balances` 中单币种可用余额。
 * 合约 bootstrap 在尚无独立「合约账户」接口时，用现货 USDT 可用作 U 本位可开保证金参考。
 */
export async function fetchSpotAssetAvailable(asset: string): Promise<number> {
  const sym = asset.trim().toUpperCase()
  if (!sym) return 0
  try {
    const rows = await apiGet<SpotBalanceRowDto[]>('/v1/spot/wallet/balances')
    const row = rows.find((r) => (r.asset ?? '').toUpperCase() === sym)
    if (!row) return 0
    const v = row.available
    const n = typeof v === 'number' ? v : parseFloat(String(v))
    return Number.isFinite(n) ? Math.max(0, n) : 0
  } catch {
    return 0
  }
}
