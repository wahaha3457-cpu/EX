/**
 * K 线 / 图表面板 — 与 REST、WebSocket、TradingView 迁移层对齐。
 */

/** 与交易页 Pinia `chartInterval` 一致 */
export type ChartInterval = '1m' | '5m' | '15m' | '1h' | '4h' | '1d'

/** 图表引擎：默认 Lightweight Charts；TV 为独立壳层占位 */
export type ChartEngineId = 'lightweight-charts' | 'tradingview-charting-library'

/** 现货 `BTC_USDT` / 合约 `BTCUSDT` 等路由口径 */
export type ChartRouteSymbol = string

export type ChartSurface = 'spot' | 'futures'

/** 合约主视图：K 线 或 深度（与现有 futures store 对齐） */
export type FuturesChartMainView = 'KLINE' | 'DEPTH' | 'DELIVERY_FUNDING'

/**
 * 后端 / REST 单根 K 线（时间戳秒，与 Lightweight Charts UTCTimestamp 一致）
 */
export interface KlineBar {
  time: number
  open: number
  high: number
  low: number
  close: number
  /** 基础币成交量 */
  volume: number
}

/** WebSocket 单根更新（合并最后一根或推送新根） */
export interface KlineBarPatch {
  time: number
  open?: number
  high?: number
  low?: number
  close?: number
  volume?: number
}

/** 十字光标悬停展示（预留联动委托价等） */
export interface ChartCrosshairPayload {
  time: number | null
  open: number | null
  high: number | null
  low: number | null
  close: number | null
  volume: number | null
}
