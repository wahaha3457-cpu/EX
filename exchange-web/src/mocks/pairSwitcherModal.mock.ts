import type { MarketTickerRow } from '@/types/market'
import { getMarketTickersMock } from '@/api/mock/marketTickersMock'

/** 弹窗联调用：全市场 ticker（现货 + 合约） */
export function mockPairSwitcherModalRows(): MarketTickerRow[] {
  return getMarketTickersMock()
}

/** 热门横条：按 24h 计价成交额降序 */
export function mockPairSwitcherHotStrip(rows: readonly MarketTickerRow[]): MarketTickerRow[] {
  return [...rows].sort((a, b) => b.quoteVolume - a.quoteVolume).slice(0, 8)
}
