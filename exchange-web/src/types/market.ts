/** 行情中心 — 交易对类型（路由与后端契约） */
export type MarketPairKind = 'SPOT' | 'CONTRACT' | 'DELIVERY'

/** 分区标签（创新区 / 热门专区等，与后端 zone 字段对齐） */
export type MarketZone = 'MAIN' | 'INNOVATION' | 'HOT'

/**
 * 顶部分类 Tab（与 UI 一一对应）
 * - WATCHLIST：仅展示自选
 * - SPOT：现货
 * - CONTRACT：合约（见 store `contractSub`：永续 / 交割）
 * - HOT / GAINERS / LOSERS / VOLUME_24H：全市场榜单类（与表格默认排序联动）
 */
export type MarketSegment =
  | 'WATCHLIST'
  | 'SPOT'
  | 'CONTRACT'
  | 'HOT'
  | 'GAINERS'
  | 'LOSERS'
  | 'VOLUME_24H'

/** 「合约」Tab 下二级：永续 U 本位 / 交割 */
export type MarketContractSub = 'PERPETUAL' | 'DELIVERY'

/** 「自选」Tab 下二级：现货 / 永续 U 本位 / 交割 */
export type MarketWatchlistSub = 'SPOT' | 'PERPETUAL' | 'DELIVERY'

/** @deprecated 使用 MarketSegment */
export type MarketListCategory = 'ALL' | 'SPOT_USDT' | 'SPOT_BTC' | 'CONTRACT'

/** 涨跌筛选 */
export type MarketChangeFilter = 'all' | 'up' | 'down'

/** 表格一行（数值用 number，展示层格式化） */
export interface MarketTickerRow {
  /** 稳定唯一键：如 SPOT:BTC_USDT */
  id: string
  kind: MarketPairKind
  /** 展示用 BTC/USDT */
  displayPair: string
  /** 现货路由参数 BTC_USDT；合约 BTCUSDT */
  routeSymbol: string
  baseAsset: string
  quoteAsset: string
  lastPrice: number
  changePct: number
  high24h: number
  low24h: number
  /** 24h 基础币成交量 */
  volumeBase: number
  /** 24h 计价成交额 */
  quoteVolume: number
  /**
   * 市值（USDT 计价，演示/接口可选）
   * 缺省时表格内用 `quoteVolume` 派生近似值排序与展示
   */
  marketCapUsdt?: number
  /** 分区：用于创新区 / 热门专区 Tab */
  zone?: MarketZone
}

/** WebSocket 增量更新载荷（与后端契约对齐的占位） */
export interface MarketTickerPatch {
  id: string
  lastPrice?: number
  changePct?: number
  high24h?: number
  low24h?: number
  volumeBase?: number
  quoteVolume?: number
  marketCapUsdt?: number
  ts?: number
}
