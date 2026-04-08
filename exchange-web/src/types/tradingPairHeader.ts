/**
 * 交易对顶部信息条 — 与 REST ticker / WS 推送字段对齐的展示快照。
 * 业务页从 Pinia 映射到此结构后传入 {@link TradingPairHeaderBar}。
 */

/** 保证金模式（合约） */
export type TradingPairHeaderMarginMode = 'CROSS' | 'ISOLATED'

/**
 * 行情快照：现货与合约共用基础字段；合约扩展字段可选。
 * 推送时建议原地 mutate 同一对象或配合 shallowRef 降低开销。
 */
export interface TradingPairHeaderMarketSnapshot {
  lastPrice: number
  /** 24h 涨跌幅，百分比数值，如 1.25 表示 +1.25% */
  changePct24h: number
  /** 24h 涨跌额（计价货币，如 USDT） */
  changeQuote24h: number
  high24h: number
  low24h: number
  /** 24h 基础资产成交量 */
  volume24hBase: number
  /** 24h 计价成交额 */
  quoteVolume24h: number
  /** 标记价格（合约） */
  markPrice?: number
  /** 指数价格（合约） */
  indexPrice?: number
  /** 当期资金费率，小数形式，如 0.0001 = 0.01% */
  fundingRate?: number
  /** 下次资金费结算时间 ISO8601（用于父组件计算倒计时文案） */
  nextFundingTime?: string
  /** 交割合约：基差 % */
  basisPct?: number
  /** 交割合约：交割时间 ISO（与倒计时文案配合） */
  deliveryTime?: string
  /** 交割合约：结算侧资金费率展示（小数），与永续 fundingRate 区分展示文案 */
  settlementFundingRate?: number
}
