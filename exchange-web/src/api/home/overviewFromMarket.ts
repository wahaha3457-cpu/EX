import type { HomeMoverRow, HomeOverviewPayload, HomeTickerCard } from '@/types/home'
import type { MarketTickerRow } from '@/types/market'
import { displayCompact, formatPrice } from '@/utils/format'

function toMover(r: MarketTickerRow): HomeMoverRow {
  return {
    pairCode: r.displayPair,
    lastPrice: formatPrice(r.lastPrice),
    changePct: r.changePct,
    quoteVolume24h: displayCompact(r.quoteVolume),
    routeSymbol: r.routeSymbol,
  }
}

function toHotCard(r: MarketTickerRow): HomeTickerCard {
  return {
    pairCode: r.displayPair,
    routeSymbol: r.routeSymbol,
    baseAsset: r.baseAsset,
    quoteAsset: r.quoteAsset,
    lastPrice: formatPrice(r.lastPrice),
    changePct: r.changePct,
    quoteVolume24h: displayCompact(r.quoteVolume),
  }
}

/**
 * 用行情中心同源列表（Legacy `publicRealtimeTop` 等）生成首页聚合数据。
 */
export function buildHomeOverviewFromMarketRows(
  rows: MarketTickerRow[],
  announcements: HomeOverviewPayload['announcements'] = [],
): HomeOverviewPayload {
  const list = rows.filter((r) => Number.isFinite(r.lastPrice))
  const totalVol = list.reduce((s, r) => s + (Number.isFinite(r.quoteVolume) ? r.quoteVolume : 0), 0)
  const spotRows = list.filter((r) => r.kind === 'SPOT')
  const hotSource = spotRows.length ? spotRows : list

  const hotTickers = [...hotSource]
    .sort((a, b) => b.quoteVolume - a.quoteVolume)
    .slice(0, 12)
    .map(toHotCard)

  const rankHot = [...list].sort((a, b) => b.quoteVolume - a.quoteVolume).slice(0, 8).map(toMover)
  const gainers = [...list].sort((a, b) => b.changePct - a.changePct).slice(0, 8).map(toMover)
  const losers = [...list].sort((a, b) => a.changePct - b.changePct).slice(0, 8).map(toMover)
  const rankVolume = [...list].sort((a, b) => b.quoteVolume - a.quoteVolume).slice(0, 8).map(toMover)

  return {
    hotTickers,
    marketStats: [
      {
        id: 'vol',
        label: '24h 全站成交额（USDT）',
        value: totalVol > 0 ? `$${displayCompact(totalVol)}` : '—',
        sub: '现货与合约市场合计',
      },
      {
        id: 'pairs',
        label: '可交易品种',
        value: String(list.length),
        sub: '覆盖主流数字资产与合约',
      },
      {
        id: 'latency',
        label: '行情更新',
        value: '实时',
        sub: '首页与行情列表同步刷新',
      },
      {
        id: 'uptime',
        label: '平台服务',
        value: '稳定运行',
        sub: '7×24 多线路接入，服务全球用户',
      },
    ],
    rankHot,
    gainers,
    losers,
    rankVolume,
    announcements,
  }
}
