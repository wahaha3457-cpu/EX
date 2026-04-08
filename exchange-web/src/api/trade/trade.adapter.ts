import type {
  SpotDepthSnapshot,
  SpotFillRow,
  SpotHistoryOrderRow,
  SpotOpenOrderRow,
  SpotOrderSide,
  SpotOrderType,
  SpotRecentTrade,
  SpotTickerSnapshot,
} from '@/types/spotTrade'
import type { SpotTradeBootstrap, SpotTradeBootstrapRaw } from '@/api/trade/trade.types'

function num(s: string): number {
  const n = parseFloat(s)
  return Number.isFinite(n) ? n : 0
}

/** 与 {@link coerceExchangeSpotOrderSide} 语义对齐；空串/未知不按买入处理 */
function sideFromRaw(s: string): SpotOrderSide {
  const u = String(s).trim().toUpperCase()
  if (u === 'SELL' || u === '2' || u === 'ASK' || u === 'S') return 'SELL'
  if (u === 'BUY' || u === '1' || u === 'BID' || u === 'B') return 'BUY'
  return 'SELL'
}

function typeFromRaw(s: string): SpotOrderType {
  const u = s.toUpperCase()
  if (u === 'MARKET') return 'MARKET'
  if (u === 'STOP') return 'STOP'
  return 'LIMIT'
}

/** 成交明细 side；未知时不默认卖出 */
function fillSideFromRaw(s: string | undefined): SpotOrderSide | undefined {
  if (s == null || !String(s).trim()) return undefined
  return sideFromRaw(s)
}

function fillOrderTypeFromRaw(s: string | undefined): SpotOrderType | undefined {
  if (s == null || !String(s).trim()) return undefined
  const u = String(s).trim().toUpperCase()
  if (u === 'MARKET') return 'MARKET'
  if (u === 'LIMIT') return 'LIMIT'
  if (u === 'STOP') return 'STOP'
  return undefined
}

export function adaptSpotTradeBootstrap(raw: SpotTradeBootstrapRaw): SpotTradeBootstrap {
  const ticker: SpotTickerSnapshot = {
    lastPrice: num(raw.ticker.c),
    changePct: num(raw.ticker.P),
    changeQuote24h: num(raw.ticker.c) - num(raw.ticker.o),
    high24h: num(raw.ticker.h),
    low24h: num(raw.ticker.l),
    volume24hBase: num(raw.ticker.v),
    quoteVolume24h: num(raw.ticker.q),
  }

  const depth: SpotDepthSnapshot = {
    seq: num(raw.depth.s),
    asks: raw.depth.a.map(([p, q]) => ({ price: num(p), quantity: num(q) })),
    bids: raw.depth.b.map(([p, q]) => ({ price: num(p), quantity: num(q) })),
  }

  const trades: SpotRecentTrade[] = raw.trades.map((r) => ({
    id: r.i,
    price: num(r.p),
    quantity: num(r.q),
    side: r.m === '1' ? 'BUY' : 'SELL',
    time: r.t,
  }))

  const openOrders: SpotOpenOrderRow[] = raw.open_orders.map((o) => ({
    orderNo: o.order_id,
    symbol: o.symbol,
    side: sideFromRaw(o.side),
    type: typeFromRaw(o.type),
    price: num(o.price),
    quantity: num(o.volume),
    filledQty: num(o.deal_volume),
    status: o.status,
    createdAt: o.created_at,
  }))

  const historyOrders: SpotHistoryOrderRow[] = raw.history_orders.map((o) => ({
    orderNo: o.order_id,
    symbol: o.symbol,
    side: sideFromRaw(o.side),
    type: typeFromRaw(o.type),
    price: num(o.price),
    quantity: num(o.volume),
    filledQty: num(o.deal_volume),
    avgFillPrice: o.avg_price != null ? num(o.avg_price) : null,
    status: o.status,
    createdAt: o.created_at,
    updatedAt: o.updated_at ?? o.created_at,
  }))

  const fills: SpotFillRow[] = raw.fills.map((f) => {
    const price = num(f.price)
    const quantity = num(f.qty)
    const qaRaw = f.quote_amount != null ? num(f.quote_amount) : NaN
    const quoteAmount =
      Number.isFinite(qaRaw) && qaRaw > 0 ? qaRaw : price > 0 && quantity > 0 ? price * quantity : undefined
    return {
      tradeId: f.trade_id,
      orderNo: f.order_id,
      symbol: f.symbol?.trim() || raw.symbol,
      side: fillSideFromRaw(f.side),
      orderType: fillOrderTypeFromRaw(f.order_type),
      price,
      quantity,
      quoteAmount,
      fee: num(f.fee),
      feeCoin: f.fee_coin,
      time: f.time,
      isMaker: f.is_maker === '1',
    }
  })

  return {
    ticker,
    depth,
    trades,
    openOrders,
    historyOrders,
    fills,
    balances: {
      baseAsset: raw.balances.base,
      quoteAsset: raw.balances.quote,
      baseAvailable: num(raw.balances.base_avail),
      quoteAvailable: num(raw.balances.quote_avail),
    },
  }
}
