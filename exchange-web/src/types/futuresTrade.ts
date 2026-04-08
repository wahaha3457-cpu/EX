/**
 * U 本位永续合约 — 与 REST / WebSocket 对齐的类型占位。
 * 频道示例：market.{symbol}.mark | index | depth | trade；私有 user.order / position / account
 */
import type { DepthLevel } from '@/types/spotTrade'

export interface FuturesDepthSnapshot {
  seq: number
  bids: DepthLevel[]
  asks: DepthLevel[]
}

/** 行情头部：标记价、指数价、资金费率等 */
export interface FuturesTickerSnapshot {
  markPrice: number
  indexPrice: number
  lastPrice: number
  changePct24h: number
  high24h: number
  low24h: number
  volume24hBase: number
  quoteVolume24h: number
  /** 当前周期资金费率，如 0.0001 = 0.01% */
  fundingRate: number
  /** 下次结算时间 ISO */
  nextFundingTime: string
}

export interface FuturesRecentTrade {
  id: string
  price: number
  quantity: number
  side: 'BUY' | 'SELL'
  time: string
}

export type FuturesMarginMode = 'CROSS' | 'ISOLATED'
export type FuturesPositionSide = 'LONG' | 'SHORT'
export type FuturesOrderSide = 'BUY' | 'SELL'
export type FuturesOrderType = 'LIMIT' | 'MARKET' | 'CONDITIONAL'

/** 合约元数据（张 / 乘数），用于可开数量与保证金估算 */
export interface FuturesInstrumentMeta {
  symbol: string
  /** 每张合约对应基础资产数量（线性合约） */
  contractSizeBase: number
  quoteAsset: string
  baseAsset: string
  maxLeverage: number
}

export interface FuturesPositionRow {
  positionId: string
  symbol: string
  side: FuturesPositionSide
  /** 持仓张数（或币数量，与后端约定一致；此处为张） */
  contracts: number
  entryPrice: number
  markPrice: number
  leverage: number
  marginMode: FuturesMarginMode
  isolatedMargin: number
  unrealizedPnl: number
  liquidationPrice: number | null
  marginRatio: number
  /**
   * 开仓订单类型（列表「类型」展示市价/限价）；接口字段如 oty；
   * 缺省由前端视为限价
   */
  entryOrderType?: FuturesOrderType
  /** 交割合约：该仓位到期结算时刻（毫秒）；演示到期后从列表移除 */
  deliverySettlesAtMs?: number
}

export interface FuturesOpenOrderRow {
  orderNo: string
  symbol: string
  side: FuturesOrderSide
  positionSide: FuturesPositionSide
  type: FuturesOrderType
  price: number
  quantity: number
  filledQty: number
  reduceOnly: boolean
  status: string
  createdAt: string
}

export interface FuturesHistoryOrderRow extends FuturesOpenOrderRow {
  updatedAt: string
  /** 成交均价，与私有接口字段对齐；缺省见 {@link SpotHistoryOrderRow.avgFillPrice} */
  avgFillPrice?: number | null
}

export interface FuturesFillRow {
  tradeId: string
  orderNo: string
  /** 成交价格；列表「开仓均价」优先用 {@link entryPrice} */
  price: number
  quantity: number
  fee: number
  feeAsset: string
  realizedPnl: number
  time: string
  isMaker: boolean
  /** 开仓 / 平仓（交割成交记录等扩展；缺省前端展示 —） */
  fillKind?: 'OPEN' | 'CLOSE'
  /** 合约代码，如 BTCUSDT_250627 */
  symbol?: string
  orderSide?: FuturesOrderSide
  positionSide?: FuturesPositionSide
  leverage?: number
  orderType?: FuturesOrderType
  /** 开仓均价（USDT）；缺省用成交价 */
  entryPrice?: number
  marginMode?: FuturesMarginMode
  liquidationPrice?: number | null
  /** 收益率，已乘 100 的百分点，如 5.2 表示 +5.2% */
  roiPct?: number | null
}

/** 资金流水占位 */
export interface FuturesFundingLedgerRow {
  id: string
  time: string
  type: 'FUNDING' | 'REALIZED_PNL' | 'FEE' | 'TRANSFER'
  amount: number
  asset: string
  remark: string
}

/** 底部区域 Tab */
export type FuturesBottomDockTab =
  | 'positions'
  | 'orders'
  | 'history'
  | 'fills'
  | 'ledger'
  | 'conditional'

/** POST /api/v1/futures/orders */
export interface FuturesPlaceOrderRequest {
  symbol: string
  side: FuturesOrderSide
  positionSide: FuturesPositionSide
  type: FuturesOrderType
  /** 下单数量（张）；前端可按 USDT 名义折算后写入 */
  quantity: number
  price?: number
  reduceOnly?: boolean
  leverage: number
  marginMode: FuturesMarginMode
  stopPrice?: number
  takeProfitPrice?: number
  stopLossPrice?: number
  clientOrderId?: string
}
