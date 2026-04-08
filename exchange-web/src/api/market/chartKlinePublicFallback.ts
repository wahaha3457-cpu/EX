/**
 * 当自建 / Legacy K 线为空或失败时，用币安现货公开 K 线兜底（无需登录，与行情价同源参考）。
 */
import type { ChartInterval } from '@/types/chartKline'
import type { KlineTupleRaw } from '@/api/market/market.types'
import { fetchKlinesWithRetry } from '@/api/binance/binancePublic'

const BINANCE_INTERVAL: Record<ChartInterval, string> = {
  '1m': '1m',
  '5m': '5m',
  '15m': '15m',
  '1h': '1h',
  '4h': '4h',
  '1d': '1d',
}

/** BTC_USDT / btc_usdt / BTCUSDT → BTCUSDT */
export function toBinanceSpotSymbol(routeSymbol: string): string {
  return routeSymbol.replace(/[^A-Za-z0-9]/g, '').toUpperCase() || 'BTCUSDT'
}

export async function fetchKlineTuplesFromBinancePublic(params: {
  symbol: string
  interval: ChartInterval
  limit: number
}): Promise<KlineTupleRaw[]> {
  const symbol = toBinanceSpotSymbol(params.symbol)
  const interval = BINANCE_INTERVAL[params.interval] ?? '15m'
  const limit = Math.min(1000, Math.max(1, params.limit))
  const bars = await fetchKlinesWithRetry({ symbol, interval, limit })
  return bars.map(
    (b) =>
      [String(b.time), String(b.open), String(b.high), String(b.low), String(b.close), String(b.volume)] as KlineTupleRaw,
  )
}
