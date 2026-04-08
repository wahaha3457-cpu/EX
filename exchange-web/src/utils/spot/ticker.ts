import type { SpotTickerSnapshot } from '@/types/spotTrade'

/** 统一由 last + 涨跌比例推导 24h 涨跌额（演示；全量 ticker 应由后端给出） */
export function normalizeSpotTicker(s: SpotTickerSnapshot): SpotTickerSnapshot {
  const open = s.lastPrice / (1 + s.changePct / 100)
  return {
    ...s,
    changeQuote24h: s.lastPrice - open,
  }
}
