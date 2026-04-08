/**
 * 历史委托表格 — 展示层模型（与 REST 分页 / 筛选扩展解耦）
 */

export type OrderHistoryTableVariant = 'spot' | 'futures'

/** 历史终态为主：与当前委托的 working 态区分 */
export type OrderHistoryStatusTone = 'success' | 'partial' | 'pending' | 'muted' | 'danger'

export interface OrderHistoryStatusCell {
  text: string
  tone: OrderHistoryStatusTone
}

export interface OrderHistorySideCell {
  text: string
  tone: 'buy' | 'sell'
}

export interface OrderHistoryPositionCell {
  text: string
  tone: 'long' | 'short'
}

export interface OrderHistoryFuturesExtras {
  positionSide: OrderHistoryPositionCell
  /** 与当前委托一致：如「20倍」 */
  leverageDisplay: string
  /** 与当前委托一致：全仓 / 逐仓 */
  marginModeDisplay: string
  /** 委托名义 USDT */
  positionNotionalDisplay: string
  /** 已成交名义 USDT */
  filledNotionalDisplay: string
}

/**
 * 表格行：字段均已格式化；合约行带 futuresExtras
 * 列顺序由组件按 variant 渲染；永续与「当前委托」对齐：时间→合约→方向→杠杆→类型→价格/仓位数量/已成交(USDT)→保证金模式→…
 */
export interface OrderHistoryTableRow {
  orderNo: string
  symbolDisplay: string
  typeLabel: string
  side: OrderHistorySideCell
  priceDisplay: string
  quantityDisplay: string
  /** 成交均价 */
  avgFillDisplay: string
  /** 成交量（基础资产数量，已成交张数/币数） */
  filledVolumeDisplay: string
  /** 现货：已成交名义（计价币），无成交时为占位 */
  turnoverDisplay?: string
  /** 现货：止盈止损；未接入条件单时为占位 */
  tpSlDisplay?: string
  status: OrderHistoryStatusCell
  timeDisplay: string
  futuresExtras?: OrderHistoryFuturesExtras
}

/** 预留：与分页条、筛选栏联动 */
export interface OrderHistoryPaginationMeta {
  page: number
  pageSize: number
  total: number
}
