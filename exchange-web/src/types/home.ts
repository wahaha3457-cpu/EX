/** 首页行情卡片（与行情 / 交易路由对齐） */
export interface HomeTickerCard {
  pairCode: string
  /** 现货路由参数，如 BTC_USDT */
  routeSymbol: string
  baseAsset: string
  quoteAsset: string
  /** 已格式化的展示价 */
  lastPrice: string
  changePct: number
  quoteVolume24h: string
}

/** 市场概览指标 */
export interface HomeMarketStat {
  id: string
  label: string
  value: string
  sub?: string
}

/** 排行榜行（热门 / 涨跌 / 成交量榜共用结构） */
export interface HomeMoverRow {
  pairCode: string
  lastPrice: string
  changePct: number
  quoteVolume24h: string
  /** 现货跳转用 */
  routeSymbol: string
}

/** 公告 / 动态类型（展示样式与后续 API category 对齐） */
export type HomeFeedKind = 'announcement' | 'activity' | 'maintenance'

/** 首页公告与平台动态 */
export interface HomeAnnouncementItem {
  id: string
  title: string
  publishedAt: string
  kind: HomeFeedKind
  /** 简短标签文案，可与 kind 映射 */
  tag: string
}

/** 聚合：首屏数据（GET /api/v1/home/overview 或组合接口） */
export interface HomeOverviewPayload {
  hotTickers: HomeTickerCard[]
  marketStats: HomeMarketStat[]
  /** 热门榜（可与 hotTickers 数据同源，榜单顺序独立） */
  rankHot: HomeMoverRow[]
  gainers: HomeMoverRow[]
  losers: HomeMoverRow[]
  /** 24h 成交额榜 */
  rankVolume: HomeMoverRow[]
  announcements: HomeAnnouncementItem[]
}
