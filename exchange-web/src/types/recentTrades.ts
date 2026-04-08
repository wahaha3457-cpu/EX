/** 最新成交列表 — 现货 / 合约共用（与 SpotRecentTrade / FuturesRecentTrade 字段一致）。 */
export type RecentTradeAggressorSide = 'BUY' | 'SELL'

export interface RecentTradeRow {
  id: string
  price: number
  quantity: number
  /** 主动方：买为绿 / 卖为红（与主流终端一致） */
  side: RecentTradeAggressorSide
  /** ISO 8601 */
  time: string
}
