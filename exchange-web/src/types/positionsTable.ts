/**
 * 合约持仓表格 — 展示层模型（与 mark WS / REST 推送字段解耦）
 */

export type PositionSideTone = 'long' | 'short'

/** 盈亏与收益率配色：与终端红涨绿跌 / 绿涨红跌主题可后续切换 */
export type PositionPnlTone = 'gain' | 'loss' | 'flat'

export interface PositionsTableSideCell {
  text: string
  tone: PositionSideTone
}

export interface PositionsTableRow {
  positionId: string
  symbolDisplay: string
  side: PositionsTableSideCell
  /** 永续「类型」列：市价 / 限价（来自持仓 entryOrderType） */
  typeLabel?: string
  /** 仓位数量（张/币，与后端约定一致） */
  contractsDisplay: string
  entryPriceDisplay: string
  markPriceDisplay: string
  /** 已含正负号 */
  unrealizedPnlDisplay: string
  unrealizedPnlTone: PositionPnlTone
  /** 收益率，如 +12.34%；无保证金基准时为 — */
  roiDisplay: string
  roiTone: PositionPnlTone | 'muted'
  marginModeLabel: string
  leverageDisplay: string
  liquidationDisplay: string
  /** 交割：距结算倒计时展示（HH:MM:SS），由 nowMs 与 deliverySettlesAtMs 计算 */
  deliveryCountdownDisplay?: string
}
