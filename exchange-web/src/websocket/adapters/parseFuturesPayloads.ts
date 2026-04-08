import type {
  FuturesDepthSnapshot,
  FuturesRecentTrade,
  FuturesTickerSnapshot,
} from '@/types/futuresTrade'

function isRecord(x: unknown): x is Record<string, unknown> {
  return x !== null && typeof x === 'object' && !Array.isArray(x)
}

export function tryParseFuturesTickerPayload(data: unknown): FuturesTickerSnapshot | null {
  if (!isRecord(data)) return null
  const markPrice = data.markPrice
  if (typeof markPrice !== 'number' || !Number.isFinite(markPrice)) return null
  return {
    markPrice,
    indexPrice: typeof data.indexPrice === 'number' ? data.indexPrice : markPrice,
    lastPrice: typeof data.lastPrice === 'number' ? data.lastPrice : markPrice,
    changePct24h: typeof data.changePct24h === 'number' ? data.changePct24h : 0,
    high24h: typeof data.high24h === 'number' ? data.high24h : markPrice,
    low24h: typeof data.low24h === 'number' ? data.low24h : markPrice,
    volume24hBase: typeof data.volume24hBase === 'number' ? data.volume24hBase : 0,
    quoteVolume24h: typeof data.quoteVolume24h === 'number' ? data.quoteVolume24h : 0,
    fundingRate: typeof data.fundingRate === 'number' ? data.fundingRate : 0,
    nextFundingTime:
      typeof data.nextFundingTime === 'string' ? data.nextFundingTime : new Date().toISOString(),
  }
}

export function tryParseFuturesDepthPayload(data: unknown): FuturesDepthSnapshot | null {
  if (!isRecord(data)) return null
  const seq = data.seq
  const bids = data.bids
  const asks = data.asks
  if (typeof seq !== 'number' || !Array.isArray(bids) || !Array.isArray(asks)) return null
  return { seq, bids, asks } as FuturesDepthSnapshot
}

export function tryParseFuturesTradePayload(data: unknown): FuturesRecentTrade | null {
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
