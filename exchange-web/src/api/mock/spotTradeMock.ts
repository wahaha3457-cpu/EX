import type {
  SpotDepthSnapshot,
  SpotFillRow,
  SpotHistoryOrderRow,
  SpotOpenOrderRow,
  SpotRecentTrade,
  SpotTickerSnapshot,
} from '@/types/spotTrade'

function midForSymbol(symbol: string): number {
  if (symbol.startsWith('ETH')) return 3500
  if (symbol.startsWith('SOL')) return 178
  return 68420
}

export function mockTicker(symbol: string): SpotTickerSnapshot {
  const mid = midForSymbol(symbol)
  const changePct = Number((Math.random() * 4 - 1.5).toFixed(2))
  const lastPrice = mid * (1 + (Math.random() * 0.002 - 0.001))
  const open24h = lastPrice / (1 + changePct / 100)
  const changeQuote24h = lastPrice - open24h
  return {
    lastPrice,
    changePct,
    changeQuote24h,
    high24h: mid * 1.012,
    low24h: mid * 0.988,
    volume24hBase: 12000 + Math.random() * 2000,
    quoteVolume24h: mid * 9000,
  }
}

export function mockDepth(symbol: string, seq = 1): SpotDepthSnapshot {
  const mid = midForSymbol(symbol)
  const asks: { price: number; quantity: number }[] = []
  const bids: { price: number; quantity: number }[] = []
  for (let i = 1; i <= 12; i++) {
    asks.push({
      price: mid * (1 + 0.0002 * i),
      quantity: Math.random() * 3 + 0.1,
    })
    bids.push({
      price: mid * (1 - 0.0002 * i),
      quantity: Math.random() * 4 + 0.1,
    })
  }
  return { seq, asks, bids }
}

export function mockTrades(symbol: string): SpotRecentTrade[] {
  const mid = midForSymbol(symbol)
  const out: SpotRecentTrade[] = []
  for (let i = 0; i < 28; i++) {
    const side: 'BUY' | 'SELL' = Math.random() > 0.5 ? 'BUY' : 'SELL'
    out.push({
      id: `${symbol}-${i}`,
      price: mid * (1 + (Math.random() * 0.0006 - 0.0003)),
      quantity: Math.random() * 0.8 + 0.02,
      side,
      time: new Date(Date.now() - i * 1300).toISOString(),
    })
  }
  return out
}

export function mockOpenOrders(symbol: string): SpotOpenOrderRow[] {
  const mid = midForSymbol(symbol)
  return [
    {
      orderNo: 'O' + Math.random().toString(36).slice(2, 10),
      symbol,
      side: 'BUY',
      type: 'LIMIT',
      price: mid * 0.995,
      quantity: 0.05,
      filledQty: 0,
      status: 'NEW',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
  ]
}

export function mockHistoryOrders(symbol: string): SpotHistoryOrderRow[] {
  const mid = midForSymbol(symbol)
  return [
    {
      orderNo: 'H1',
      symbol,
      side: 'SELL',
      type: 'LIMIT',
      price: mid * 1.002,
      quantity: 0.02,
      filledQty: 0.02,
      avgFillPrice: mid * 1.0018,
      status: 'FILLED',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 86000000).toISOString(),
    },
  ]
}

export function mockFills(symbol: string): SpotFillRow[] {
  const mid = midForSymbol(symbol)
  return [
    {
      tradeId: 'T1',
      orderNo: 'H1',
      symbol,
      side: 'BUY',
      orderType: 'LIMIT',
      price: mid * 1.002,
      quantity: 0.02,
      quoteAmount: mid * 1.002 * 0.02,
      fee: 0.00002 * mid,
      feeCoin: 'BNB',
      time: new Date(Date.now() - 86000000).toISOString(),
      isMaker: true,
    },
  ]
}

/** 模拟可用余额；管理员会话下放大便于压测下单 */
export function mockBalances(symbol: string, rich = false) {
  const base = symbol.split('_')[0] || 'BTC'
  const quote = symbol.split('_')[1] || 'USDT'
  if (rich) {
    return {
      baseAsset: base,
      quoteAsset: quote,
      baseAvailable: base === 'BTC' ? 888.88888888 : base === 'ETH' ? 8888.88 : 9_999_999,
      quoteAvailable: 99_999_999.99,
    }
  }
  return {
    baseAsset: base,
    quoteAsset: quote,
    baseAvailable: base === 'BTC' ? 1.2543 : 12.5,
    quoteAvailable: 256_780.12,
  }
}
