import type { MarketTickerRow } from '@/types/market'

/**
 * 交易对切换弹窗：页面上下文（决定路由与默认 Tab、高亮规则）。
 */
export type PairSwitcherPageContext = 'spot' | 'futures'

/**
 * 与行情中心 {@link MarketSegment} 对齐的子集：自选 / 现货 / U 本位 / 热门。
 */
export type PairSwitcherModalTab = 'WATCHLIST' | 'SPOT' | 'CONTRACT_USDT' | 'HOT'

/** 选中一行并切换路由时抛出（父级负责 router.push 与关窗） */
export interface PairSwitcherSelectPayload {
  row: MarketTickerRow
  pageContext: PairSwitcherPageContext
}

/** 自选星标（预留：父级写 Pinia / 调 API） */
export interface PairSwitcherToggleFavoritePayload {
  row: MarketTickerRow
}
