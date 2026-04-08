/**
 * Trade（现货）模块 — Raw 与 Domain
 *
 * Domain：`SpotTradeBootstrap` 与现有 `@/types/spotTrade` 对齐。
 */

import type {
  SpotDepthSnapshot,
  SpotFillRow,
  SpotHistoryOrderRow,
  SpotOpenOrderRow,
  SpotRecentTrade,
  SpotTickerSnapshot,
} from '@/types/spotTrade'

/** 旧版 GET /v1/spot/bootstrap 或聚合接口 data 结构（示意） */
export interface SpotTickerBlockRaw {
  c: string
  P: string
  o: string
  h: string
  l: string
  v: string
  q: string
}

export interface SpotDepthBlockRaw {
  s: string
  a: [string, string][]
  b: [string, string][]
}

export interface SpotTradeRowRaw {
  i: string
  p: string
  q: string
  /** 1 买 2 卖 */
  m: string
  t: string
}

export interface SpotOrderRowRaw {
  order_id: string
  symbol: string
  side: string
  type: string
  price: string
  volume: string
  deal_volume: string
  status: string
  created_at: string
  updated_at?: string
  avg_price?: string
}

export interface SpotFillRowRaw {
  trade_id: string
  order_id: string
  price: string
  qty: string
  fee: string
  fee_coin: string
  time: string
  is_maker: string
  /** 如 BTC_USDT */
  symbol?: string
  side?: string
  /** 成交额（计价币） */
  quote_amount?: string
  /** LIMIT / MARKET */
  order_type?: string
}

export interface SpotBalancesBlockRaw {
  base: string
  quote: string
  base_avail: string
  quote_avail: string
}

export interface SpotTradeBootstrapRaw {
  symbol: string
  ticker: SpotTickerBlockRaw
  depth: SpotDepthBlockRaw
  trades: SpotTradeRowRaw[]
  open_orders: SpotOrderRowRaw[]
  history_orders: SpotOrderRowRaw[]
  fills: SpotFillRowRaw[]
  balances: SpotBalancesBlockRaw
}

/** 页面与 Store 使用的统一聚合（与原 `SpotTradeBootstrapDto` 一致） */
export interface SpotTradeBootstrap {
  ticker: SpotTickerSnapshot
  depth: SpotDepthSnapshot
  trades: SpotRecentTrade[]
  openOrders: SpotOpenOrderRow[]
  historyOrders: SpotHistoryOrderRow[]
  fills: SpotFillRow[]
  balances: {
    baseAsset: string
    quoteAsset: string
    baseAvailable: number
    quoteAvailable: number
  }
}
