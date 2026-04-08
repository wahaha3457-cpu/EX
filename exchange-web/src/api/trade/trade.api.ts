import {
  mockBalances,
  mockDepth,
  mockFills,
  mockHistoryOrders,
  mockOpenOrders,
  mockTicker,
  mockTrades,
} from '@/api/mock/spotTradeMock'
import { apiGet } from '@/api/common/http'
import { isMockAdminSession } from '@/mocks/authMockService'
import { getAccessToken } from '@/utils/tokenStorage'
import { isLegacyAuthMode, isMockMode, marketTickerSource } from '@/config/env'
import { fetchLegacySpotTradeBootstrapRaw } from '@/api/trade/legacy/legacySpotBootstrap'
import type {
  SpotBalancesBlockRaw,
  SpotDepthBlockRaw,
  SpotFillRowRaw,
  SpotOrderRowRaw,
  SpotTickerBlockRaw,
  SpotTradeBootstrapRaw,
  SpotTradeRowRaw,
} from '@/api/trade/trade.types'

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

function toTickerRaw(t: ReturnType<typeof mockTicker>): SpotTickerBlockRaw {
  return {
    c: String(t.lastPrice),
    P: String(t.changePct),
    o: String(t.lastPrice - t.changeQuote24h),
    h: String(t.high24h),
    l: String(t.low24h),
    v: String(t.volume24hBase),
    q: String(t.quoteVolume24h),
  }
}

function toDepthRaw(d: ReturnType<typeof mockDepth>): SpotDepthBlockRaw {
  return {
    s: String(d.seq),
    a: d.asks.map((x) => [String(x.price), String(x.quantity)] as [string, string]),
    b: d.bids.map((x) => [String(x.price), String(x.quantity)] as [string, string]),
  }
}

function toTradesRaw(trades: ReturnType<typeof mockTrades>): SpotTradeRowRaw[] {
  return trades.map((x) => ({
    i: x.id,
    p: String(x.price),
    q: String(x.quantity),
    m: x.side === 'BUY' ? '1' : '2',
    t: x.time,
  }))
}

function toOrdersRaw(rows: ReturnType<typeof mockOpenOrders>): SpotOrderRowRaw[] {
  return rows.map((o) => ({
    order_id: o.orderNo,
    symbol: o.symbol,
    side: o.side.toLowerCase(),
    type: o.type.toLowerCase(),
    price: String(o.price),
    volume: String(o.quantity),
    deal_volume: String(o.filledQty),
    status: o.status,
    created_at: o.createdAt,
  }))
}

function toHistoryRaw(rows: ReturnType<typeof mockHistoryOrders>): SpotOrderRowRaw[] {
  return rows.map((o) => ({
    order_id: o.orderNo,
    symbol: o.symbol,
    side: o.side.toLowerCase(),
    type: o.type.toLowerCase(),
    price: String(o.price),
    volume: String(o.quantity),
    deal_volume: String(o.filledQty),
    status: o.status,
    created_at: o.createdAt,
    updated_at: o.updatedAt,
    avg_price: o.avgFillPrice != null ? String(o.avgFillPrice) : undefined,
  }))
}

function toFillsRaw(rows: ReturnType<typeof mockFills>, symbol: string): SpotFillRowRaw[] {
  return rows.map((f) => ({
    trade_id: f.tradeId,
    order_id: f.orderNo,
    price: String(f.price),
    qty: String(f.quantity),
    fee: String(f.fee),
    fee_coin: f.feeCoin,
    time: f.time,
    is_maker: f.isMaker ? '1' : '0',
    symbol: f.symbol ?? symbol,
    side: f.side ?? 'BUY',
    quote_amount:
      f.quoteAmount != null && Number.isFinite(f.quoteAmount)
        ? String(f.quoteAmount)
        : String(f.price * f.quantity),
    order_type: f.orderType ?? 'LIMIT',
  }))
}

function toBalancesRaw(b: ReturnType<typeof mockBalances>): SpotBalancesBlockRaw {
  return {
    base: b.baseAsset,
    quote: b.quoteAsset,
    base_avail: String(b.baseAvailable),
    quote_avail: String(b.quoteAvailable),
  }
}

/**
 * GET /v1/spot/bootstrap?symbol=BTC_USDT
 * 仅返回旧版 data 结构；映射在 adapter。
 */
export async function fetchSpotTradeBootstrapRaw(symbol: string): Promise<SpotTradeBootstrapRaw> {
  const sym = symbol && symbol.length > 0 ? symbol : 'BTC_USDT'
  if (isMockMode()) {
    await delay(120)
    const t = mockTicker(sym)
    const d = mockDepth(sym)
    return {
      symbol: sym,
      ticker: toTickerRaw(t),
      depth: toDepthRaw(d),
      trades: toTradesRaw(mockTrades(sym)),
      open_orders: toOrdersRaw(mockOpenOrders(sym)),
      history_orders: toHistoryRaw(mockHistoryOrders(sym)),
      fills: toFillsRaw(mockFills(sym), sym),
      balances: toBalancesRaw(mockBalances(sym, isMockAdminSession(getAccessToken()))),
    }
  }
  if (isLegacyAuthMode()) {
    return fetchLegacySpotTradeBootstrapRaw(sym)
  }
  if (marketTickerSource() === 'server') {
    return fetchServerSpotTradeBootstrapRaw(sym)
  }
  await delay(120)
  const t = mockTicker(sym)
  const d = mockDepth(sym)
  return {
    symbol: sym,
    ticker: toTickerRaw(t),
    depth: toDepthRaw(d),
    trades: toTradesRaw(mockTrades(sym)),
    open_orders: toOrdersRaw(mockOpenOrders(sym)),
    history_orders: toHistoryRaw(mockHistoryOrders(sym)),
    fills: toFillsRaw(mockFills(sym), sym),
    balances: toBalancesRaw(mockBalances(sym, isMockAdminSession(getAccessToken()))),
  }
}

type UnifiedTickerDto = {
  symbol: string
  baseCoin: string
  quoteCoin: string
  marketType: 'SPOT' | 'CONTRACT'
  latestPrice: number
  openPrice24h: number
  high24h: number
  low24h: number
  volume24h: number
  turnover24h: number
  priceChangePercent24h: number
}

type UnifiedDepthDto = {
  symbol: string
  marketType: 'SPOT' | 'CONTRACT'
  timestamp: number
  bids: Array<{ price: string | number; amount: string | number }>
  asks: Array<{ price: string | number; amount: string | number }>
}

type UnifiedTradeDto = {
  price: string | number
  qty: string | number
  side: 'BUY' | 'SELL'
  time: number
  tradeId?: string | null
}

function toUnifiedSymbolFromSpotRoute(routeSymbol: string): string {
  return routeSymbol.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
}

async function fetchServerSpotTradeBootstrapRaw(routeSymbol: string): Promise<SpotTradeBootstrapRaw> {
  const sym = routeSymbol && routeSymbol.length > 0 ? routeSymbol : 'BTC_USDT'
  const unified = toUnifiedSymbolFromSpotRoute(sym)
  const [t, d, trades] = await Promise.all([
    apiGet<UnifiedTickerDto>('/market/summary', { params: { symbol: unified, type: 'spot' } }),
    apiGet<UnifiedDepthDto>('/market/depth', { params: { symbol: unified, type: 'spot', limit: 20 } }),
    apiGet<UnifiedTradeDto[]>('/market/trades', { params: { symbol: unified, type: 'spot', limit: 60 } }),
  ])

  const ticker: SpotTickerBlockRaw = {
    c: String(t.latestPrice ?? 0),
    P: String(t.priceChangePercent24h ?? 0),
    o: String(t.openPrice24h ?? 0),
    h: String(t.high24h ?? 0),
    l: String(t.low24h ?? 0),
    v: String(t.volume24h ?? 0),
    q: String(t.turnover24h ?? 0),
  }

  const depth: SpotDepthBlockRaw = {
    s: String(d.timestamp ?? Date.now()),
    a: (d.asks ?? []).map((x) => [String(x.price ?? 0), String(x.amount ?? 0)] as [string, string]),
    b: (d.bids ?? []).map((x) => [String(x.price ?? 0), String(x.amount ?? 0)] as [string, string]),
  }

  const rows: SpotTradeRowRaw[] = (trades ?? []).map((x, i) => ({
    i: String(x.tradeId ?? `${x.time ?? Date.now()}-${i}`),
    p: String(x.price ?? 0),
    q: String(x.qty ?? 0),
    m: x.side === 'SELL' ? '2' : '1',
    t: String(x.time ?? Date.now()),
  }))

  const parts = sym.trim().toUpperCase().split('_').filter(Boolean)
  const base = parts[0] || 'BTC'
  const quote = parts[1] || 'USDT'

  const draft: SpotTradeBootstrapRaw = {
    symbol: `${base}_${quote}`,
    ticker,
    depth,
    trades: rows,
    open_orders: [],
    history_orders: [],
    fills: [],
    balances: {
      base,
      quote,
      base_avail: '0',
      quote_avail: '0',
    },
  }

  const { enrichServerSpotBootstrapWithAuth } = await import('@/api/trade/exchangeSpot')
  return enrichServerSpotBootstrapWithAuth(sym, draft)
}
