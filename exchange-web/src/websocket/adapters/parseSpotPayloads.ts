import type { SpotDepthSnapshot, SpotRecentTrade, SpotTickerSnapshot } from '@/types/spotTrade'

function isRecord(x: unknown): x is Record<string, unknown> {
  return x !== null && typeof x === 'object' && !Array.isArray(x)
}

/** 将 WS data 收窄为 SpotTickerSnapshot；不匹配返回 null */
export function tryParseSpotTickerPayload(data: unknown): SpotTickerSnapshot | null {
  if (!isRecord(data)) return null
  const lastPrice = data.lastPrice
  if (typeof lastPrice !== 'number' || !Number.isFinite(lastPrice)) return null
  return {
    lastPrice,
    changePct: typeof data.changePct === 'number' ? data.changePct : 0,
    changeQuote24h: typeof data.changeQuote24h === 'number' ? data.changeQuote24h : 0,
    high24h: typeof data.high24h === 'number' ? data.high24h : lastPrice,
    low24h: typeof data.low24h === 'number' ? data.low24h : lastPrice,
    volume24hBase: typeof data.volume24hBase === 'number' ? data.volume24hBase : 0,
    quoteVolume24h: typeof data.quoteVolume24h === 'number' ? data.quoteVolume24h : 0,
  }
}

export function tryParseSpotDepthPayload(data: unknown): SpotDepthSnapshot | null {
  if (!isRecord(data)) return null
  const seq = data.seq
  const bids = data.bids
  const asks = data.asks
  if (typeof seq !== 'number' || !Array.isArray(bids) || !Array.isArray(asks)) return null
  return { seq, bids, asks } as SpotDepthSnapshot
}

export function tryParseSpotTradePayload(data: unknown): SpotRecentTrade | null {
  if (!isRecord(data)) return null
  const id = data.id
  const price = data.price
  const quantity = data.quantity
  const side = data.side
  const time = data.time
  if (typeof id !== 'string' || typeof price !== 'number' || typeof quantity !== 'number') return null
  if (side !== 'BUY' && side !== 'SELL') return null
  if (typeof time !== 'string') return null
  return { id, price, quantity, side, time }
}
