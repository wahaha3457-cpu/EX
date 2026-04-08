/**
 * 当前委托表格 — 展示层模型（与 REST/WS 原始行解耦，便于单测与复用）
 */

/** 买卖方向在表格中的配色语义 */
export type CurrentOrderSideTone = 'buy' | 'sell'

/** 合约持仓方向配色 */
export type CurrentOrderPositionTone = 'long' | 'short'

/** 与交易所常见状态标签对齐 */
export type CurrentOrderStatusTone = 'working' | 'partial' | 'pending' | 'muted'

export interface CurrentOpenOrderStatusCell {
  /** 展示文案，如「未成交」「部分成交」 */
  text: string
  tone: CurrentOrderStatusTone
}

export interface CurrentOpenOrderSideCell {
  text: string
  tone: CurrentOrderSideTone
}

export interface CurrentOpenOrderPositionCell {
  text: string
  tone: CurrentOrderPositionTone
}

/** 合约列额外信息；现货不传 */
export interface CurrentOpenOrderFuturesExtras {
  positionSide: CurrentOpenOrderPositionCell
  reduceOnly: boolean
  /** 如「20倍」 */
  leverageDisplay: string
  /** 如「全仓」「逐仓」 */
  marginModeDisplay: string
  /** 委托名义（USDT），表头「仓位数量」 */
  positionNotionalDisplay: string
  /** 已成交名义（USDT），表头「已成交」 */
  filledNotionalDisplay: string
}

/**
 * 表格行 — 所有展示字段已格式化，组件内只做渲染与事件，避免高频刷新时重复 format
 */
export interface CurrentOpenOrderTableRow {
  orderNo: string
  symbolDisplay: string
  side: CurrentOpenOrderSideCell
  typeLabel: string
  priceDisplay: string
  quantityDisplay: string
  filledDisplay: string
  /** 现货当前委托：计价币名义（限价≈价×量；市价无委托价时 —） */
  amountDisplay?: string
  /** 现货：止盈止损摘要；未接入条件单时 — */
  tpSlDisplay?: string
  status: CurrentOpenOrderStatusCell
  timeDisplay: string
  futuresExtras?: CurrentOpenOrderFuturesExtras
}

/** {@link TradingCurrentOrdersTable} 的 variant，决定列结构 */
export type CurrentOrdersTableVariant = 'spot' | 'futures'
