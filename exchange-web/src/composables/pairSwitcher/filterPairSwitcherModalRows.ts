import type { MarketTickerRow } from '@/types/market'
import type { PairSwitcherModalTab } from '@/types/pairSwitcherModal'
import { pairWatchKey } from '@/composables/pairSwitcher/pairWatchKey'

/**
 * 按 Tab + 搜索词过滤列表（纯函数，便于单测与复用）。
 * 「热门」Tab：优先 zone===HOT；若无则按 24h 成交额取前若干（演示兜底）。
 */
export function filterPairSwitcherModalRows(
  rows: readonly MarketTickerRow[],
  tab: PairSwitcherModalTab,
  query: string,
  watchlistKeys: ReadonlySet<string>,
  hotFallbackLimit = 24,
): MarketTickerRow[] {
  let list: MarketTickerRow[]

  switch (tab) {
    case 'WATCHLIST':
      list = rows.filter((r) => watchlistKeys.has(pairWatchKey(r)))
      break
    case 'SPOT':
      list = rows.filter((r) => r.kind === 'SPOT')
      break
    case 'CONTRACT_USDT':
      list = rows.filter((r) => r.kind === 'CONTRACT' && r.quoteAsset === 'USDT')
      break
    case 'HOT': {
      const hot = rows.filter((r) => r.zone === 'HOT')
      list =
        hot.length > 0
          ? hot
          : [...rows].sort((a, b) => b.quoteVolume - a.quoteVolume).slice(0, hotFallbackLimit)
      break
    }
    default:
      list = [...rows]
  }

  const q = query.trim().toLowerCase()
  if (!q) return list

  return list.filter(
    (r) =>
      r.baseAsset.toLowerCase().includes(q) ||
      r.displayPair.toLowerCase().includes(q) ||
      r.routeSymbol.toLowerCase().includes(q),
  )
}
