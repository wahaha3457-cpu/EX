/**
 * 币安现货 24h 行情（公开），用于 Legacy 旧站 realtime 字段不一致或包装结构导致解析为 0 时的头部/盘口旁路对齐。
 */
import { BINANCE_REST_BASE } from '@/api/binance/binancePublic'

export interface Binance24hTickerFields {
  lastPrice: string
  priceChangePercent: string
  highPrice: string
  lowPrice: string
  volume: string
  quoteVolume: string
}

export async function fetchBinance24hTickerFields(symbol: string): Promise<Binance24hTickerFields | null> {
  const sym = symbol.replace(/[^A-Za-z0-9]/g, '').toUpperCase() || 'BTCUSDT'
  const url = `${BINANCE_REST_BASE}/api/v3/ticker/24hr?symbol=${encodeURIComponent(sym)}`
  const res = await fetch(url)
  if (!res.ok) return null
  const j = (await res.json()) as Record<string, unknown>
  return {
    lastPrice: String(j.lastPrice ?? '0'),
    priceChangePercent: String(j.priceChangePercent ?? '0'),
    highPrice: String(j.highPrice ?? '0'),
    lowPrice: String(j.lowPrice ?? '0'),
    volume: String(j.volume ?? '0'),
    quoteVolume: String(j.quoteVolume ?? '0'),
  }
}
