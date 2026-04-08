/**
 * Market 模块 — 类型定义
 *
 * - `*Raw`：与旧版后端 JSON 字段一一对应（页面/Store 禁止直接使用）
 * - Domain：统一业务结构，见 `@/types/market`、`@/types/chartKline`
 */

import type { MarketTickerRow } from '@/types/market'
import type { KlineBar } from '@/types/chartKline'

/** 旧版列表接口：GET /v1/market/tickers 单条（示意字段名） */
export interface MarketTickerItemRaw {
  /** 后端统一小写交易对键，如 btc_usdt、btcusdt */
  sym: string
  /** 1 现货 2 U 本位永续 */
  ty: number
  /** 最新价（字符串金额） */
  last: string
  /** 24h 涨跌幅 % */
  rose: string
  high: string
  low: string
  /** 基础币成交量 */
  vol: string
  /** 计价成交额 */
  amount: string
  /** 分区：0 MAIN 1 INNOVATION 2 HOT */
  area: string
}

/** 旧版 K 线数组行：[时间戳秒, open, high, low, close, vol] 均为字符串 */
export type KlineTupleRaw = [string, string, string, string, string, string]

/** Domain 导出别名：适配层输出与全局类型一致 */
export type MarketTicker = MarketTickerRow
export type ChartKlineBar = KlineBar
