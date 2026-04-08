import type {
  FuturesDepthSnapshot,
  FuturesFillRow,
  FuturesFundingLedgerRow,
  FuturesHistoryOrderRow,
  FuturesInstrumentMeta,
  FuturesOpenOrderRow,
  FuturesPositionRow,
  FuturesRecentTrade,
  FuturesTickerSnapshot,
} from '@/types/futuresTrade'

function midForSymbol(symbol: string): number {
  if (symbol.startsWith('ETH')) return 3508
  if (symbol.startsWith('SOL')) return 178
  if (symbol.startsWith('WIF')) return 2.85
  if (symbol.startsWith('PEPE')) return 0.00001234
  return 68380
}

export function mockInstrument(symbol: string): FuturesInstrumentMeta {
  const base =
    symbol.replace(/USDT$/i, '').replace(/PERP$/i, '') || 'BTC'
  return {
    symbol,
    contractSizeBase: base === 'BTC' ? 0.001 : base === 'ETH' ? 0.01 : 0.1,
    baseAsset: base,
    quoteAsset: 'USDT',
    maxLeverage: base === 'BTC' ? 125 : 100,
  }
}

export function mockFuturesTicker(symbol: string): FuturesTickerSnapshot {
  const mid = midForSymbol(symbol)
  const mark = mid * (1 + (Math.random() * 0.0004 - 0.0002))
  const idx = mark * (1 + (Math.random() * 0.0002 - 0.0001))
  const next = new Date(Date.now() + 3 * 3600 * 1000 + 24 * 60 * 1000)

  return {
    markPrice: mark,
    indexPrice: idx,
    lastPrice: mid * (1 + (Math.random() * 0.001 - 0.0005)),
    changePct24h: Number((Math.random() * 5 - 2).toFixed(2)),
    high24h: mid * 1.015,
    low24h: mid * 0.985,
    volume24hBase: 1.2e6 + Math.random() * 2e5,
    quoteVolume24h: mid * 8e6,
    fundingRate: Number((Math.random() * 0.0002 - 0.00005).toFixed(6)),
    nextFundingTime: next.toISOString(),
  }
}

export function mockFuturesDepth(symbol: string, seq = 1): FuturesDepthSnapshot {
  const mid = midForSymbol(symbol)
  const asks: FuturesDepthSnapshot['asks'] = []
  const bids: FuturesDepthSnapshot['bids'] = []
  for (let i = 1; i <= 14; i++) {
    asks.push({
      price: mid * (1 + 0.00015 * i),
      quantity: Math.random() * 120 + 5,
    })
    bids.push({
      price: mid * (1 - 0.00015 * i),
      quantity: Math.random() * 150 + 8,
    })
  }
  return { seq, asks, bids }
}

export function mockFuturesTrades(symbol: string): FuturesRecentTrade[] {
  const mid = midForSymbol(symbol)
  const out: FuturesRecentTrade[] = []
  for (let i = 0; i < 32; i++) {
    const side: 'BUY' | 'SELL' = Math.random() > 0.5 ? 'BUY' : 'SELL'
    out.push({
      id: `${symbol}-t-${i}`,
      price: mid * (1 + (Math.random() * 0.0005 - 0.00025)),
      quantity: Math.random() * 4 + 0.05,
      side,
      time: new Date(Date.now() - i * 900).toISOString(),
    })
  }
  return out
}

export function mockPositions(symbol: string): FuturesPositionRow[] {
  const mid = midForSymbol(symbol)
  const uPnL = mid * 12 * 0.001 * 0.35
  return [
    {
      positionId: 'P1',
      symbol,
      side: 'LONG',
      contracts: 12,
      entryPrice: mid * 0.998,
      markPrice: mid,
      leverage: 20,
      marginMode: 'ISOLATED',
      isolatedMargin: 420.5,
      unrealizedPnl: uPnL,
      liquidationPrice: mid * 0.72,
      marginRatio: 0.14,
      entryOrderType: 'LIMIT',
    },
  ]
}

export function mockFuturesOpenOrders(symbol: string): FuturesOpenOrderRow[] {
  const mid = midForSymbol(symbol)
  return [
    {
      orderNo: 'FO' + Math.random().toString(36).slice(2, 10),
      symbol,
      side: 'BUY',
      positionSide: 'LONG',
      type: 'LIMIT',
      price: mid * 0.994,
      quantity: 5,
      filledQty: 0,
      reduceOnly: false,
      status: 'NEW',
      createdAt: new Date(Date.now() - 1800000).toISOString(),
    },
  ]
}

export function mockFuturesHistoryOrders(symbol: string): FuturesHistoryOrderRow[] {
  const mid = midForSymbol(symbol)
  return [
    {
      orderNo: 'FH1',
      symbol,
      side: 'SELL',
      positionSide: 'LONG',
      type: 'LIMIT',
      price: mid * 1.005,
      quantity: 2,
      filledQty: 2,
      avgFillPrice: mid * 1.0045,
      reduceOnly: true,
      status: 'FILLED',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 86350000).toISOString(),
    },
    {
      orderNo: 'FH2',
      symbol,
      side: 'BUY',
      positionSide: 'LONG',
      type: 'LIMIT',
      price: mid * 0.992,
      quantity: 1,
      filledQty: 0,
      avgFillPrice: undefined,
      reduceOnly: false,
      status: 'CANCELED',
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      updatedAt: new Date(Date.now() - 7100000).toISOString(),
    },
  ]
}

export function mockFuturesFills(symbol: string): FuturesFillRow[] {
  const mid = midForSymbol(symbol)
  const entry = mid * 1.0045
  const liq = mid * 0.72
  return [
    {
      tradeId: 'FT1',
      orderNo: 'FH1',
      price: mid * 1.005,
      quantity: 2,
      fee: 2.4,
      feeAsset: 'USDT',
      realizedPnl: 18.2,
      time: new Date(Date.now() - 86350000).toISOString(),
      isMaker: false,
      fillKind: 'CLOSE',
      symbol,
      orderSide: 'SELL',
      positionSide: 'LONG',
      leverage: 20,
      orderType: 'LIMIT',
      entryPrice: entry,
      marginMode: 'ISOLATED',
      liquidationPrice: liq,
      roiPct: 4.32,
    },
  ]
}

export function mockFundingLedger(_symbol: string): FuturesFundingLedgerRow[] {
  void _symbol
  const now = Date.now()
  return [
    {
      id: 'L1',
      time: new Date(now - 3600000).toISOString(),
      type: 'FUNDING',
      amount: -2.15,
      asset: 'USDT',
      remark: '资金费率结算',
    },
    {
      id: 'L2',
      time: new Date(now - 7200000).toISOString(),
      type: 'FEE',
      amount: -0.48,
      asset: 'USDT',
      remark: '开仓成交手续费',
    },
    {
      id: 'L3',
      time: new Date(now - 86400000).toISOString(),
      type: 'TRANSFER',
      amount: 5000,
      asset: 'USDT',
      remark: '账户转入',
    },
  ]
}

/** 合约账户可用保证金（USDT） */
export function mockFuturesWalletAvailable(symbol: string, rich = false): number {
  void symbol
  if (rich) return 88_888_888.88
  return 128_450.88
}
