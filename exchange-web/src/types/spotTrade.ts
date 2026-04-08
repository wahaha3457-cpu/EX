/** 现货交易对快照（REST / WS ticker 对齐） */
export interface SpotTickerSnapshot {
  lastPrice: number
  /** 24h 涨跌幅 % */
  changePct: number
  /** 24h 涨跌额（计价货币，如 USDT） */
  changeQuote24h: number
  high24h: number
  low24h: number
  volume24hBase: number
  quoteVolume24h: number
}

/** 盘口档位 */
export interface DepthLevel {
  price: number
  quantity: number
}

export interface SpotDepthSnapshot {
  seq: number
  bids: DepthLevel[]
  asks: DepthLevel[]
}

/** 最新成交 */
export interface SpotRecentTrade {
  id: string
  price: number
  quantity: number
  side: 'BUY' | 'SELL'
  time: string
}

export type SpotOrderSide = 'BUY' | 'SELL'
export type SpotOrderType = 'LIMIT' | 'MARKET' | 'STOP' // STOP 预留

export interface SpotOpenOrderRow {
  orderNo: string
  symbol: string
  side: SpotOrderSide
  type: SpotOrderType
  price: number
  quantity: number
  filledQty: number
  status: string
  createdAt: string
}

export interface SpotHistoryOrderRow extends SpotOpenOrderRow {
  updatedAt: string
  /**
   * 成交均价（VWAP），与 REST `avgPrice` / `avgFillPrice` 对齐；缺省时由前端按成交明细聚合或展示占位
   */
  avgFillPrice?: number | null
}

export interface SpotFillRow {
  tradeId: string
  orderNo: string
  /** 交易对代码，如 BTC_USDT；缺省时由页面用当前 symbol 兜底 */
  symbol?: string
  side?: SpotOrderSide
  price: number
  quantity: number
  /** 成交额（计价币，与后端 quoteAmount 对齐）；缺省时由前端用 价×量 推算 */
  quoteAmount?: number
  /** 原委托类型 */
  orderType?: SpotOrderType
  fee: number
  feeCoin: string
  time: string
  isMaker: boolean
}

/** 现货页底部 Tab：委托 / 成交 / 资产 */
export type SpotOrderDockTab = 'open' | 'history' | 'fills' | 'assets'

/** 下单请求（对接 POST /api/v1/spot/orders） */
export interface SpotPlaceOrderRequest {
  symbol: string
  side: SpotOrderSide
  type: SpotOrderType
  price?: number
  quantity?: number
  quoteQty?: number
  clientOrderId?: string
}
