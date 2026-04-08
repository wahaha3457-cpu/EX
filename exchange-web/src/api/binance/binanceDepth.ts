/**
 * 币安现货深度（公开），作 legacy 盘口兜底。
 */
import { BINANCE_REST_BASE } from '@/api/binance/binancePublic'
import type { SpotDepthBlockRaw } from '@/api/trade/trade.types'

export async function fetchBinanceDepthRaw(routeSymbol: string, limit = 20): Promise<SpotDepthBlockRaw> {
  const sym = routeSymbol.replace(/[^A-Za-z0-9]/g, '').toUpperCase() || 'BTCUSDT'
  const url = `${BINANCE_REST_BASE}/api/v3/depth?symbol=${encodeURIComponent(sym)}&limit=${Math.min(100, Math.max(5, limit))}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`depth HTTP ${res.status}`)
  const j = (await res.json()) as {
    lastUpdateId?: number
    bids?: [string, string][]
    asks?: [string, string][]
  }
  return {
    s: String(j.lastUpdateId ?? Date.now()),
    b: (j.bids ?? []).map(([p, q]) => [String(p), String(q)]),
    a: (j.asks ?? []).map(([p, q]) => [String(p), String(q)]),
  }
}
