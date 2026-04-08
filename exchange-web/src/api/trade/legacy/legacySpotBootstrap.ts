import { legacyTryGet, legacyTryPost } from '@/api/auth/legacy/legacyHttp'
import { fetchBinanceDepthRaw } from '@/api/binance/binanceDepth'
import type { SpotTradeBootstrapRaw } from '@/api/trade/trade.types'
import {
  LEGACY_SPOT_MARKET_TYPE,
  LEGACY_SPOT_PATHS,
  toLegacySpotSymbol,
} from '@/api/trade/legacy/legacySpotContract'
import {
  mapAssetsToBalances,
  mapExchangeApplyOrderToRow,
  mapLegacyDepthData,
  mapRealtimeToTickerBlock,
  mapTradeDetailsToRows,
  unwrapPageRecords,
} from '@/api/trade/legacy/mapLegacySpot'

function routeSymbolNormalized(s: string): string {
  const p = s.trim().toUpperCase().split('_').filter(Boolean)
  if (p.length >= 2) return `${p[0]}_${p[1]}`
  return s.includes('_') ? s : `${s}_USDT`
}

export async function fetchLegacySpotTradeBootstrapRaw(routeSymbol: string): Promise<SpotTradeBootstrapRaw> {
  const sym = routeSymbolNormalized(routeSymbol)
  const [baseAsset, quoteAsset] = sym.split('_')
  const legacySym = toLegacySpotSymbol(sym)

  const [rt, dep, trd, assets, listRaw, histRaw] = await Promise.all([
    legacyTryGet<unknown>(LEGACY_SPOT_PATHS.realtime, { symbol: legacySym }),
    legacyTryGet<unknown>(LEGACY_SPOT_PATHS.depth, { symbol: legacySym }),
    legacyTryGet<unknown>(LEGACY_SPOT_PATHS.trades, { symbol: legacySym }),
    legacyTryGet<unknown>(LEGACY_SPOT_PATHS.assets, {}),
    legacyTryPost<unknown>(LEGACY_SPOT_PATHS.orderList, {
      current: 1,
      size: 50,
      symbol: legacySym,
      type: LEGACY_SPOT_MARKET_TYPE,
    }),
    legacyTryPost<unknown>(LEGACY_SPOT_PATHS.orderHistory, {
      current: 1,
      size: 50,
      symbol: legacySym,
      type: LEGACY_SPOT_MARKET_TYPE,
    }),
  ])

  const ticker = mapRealtimeToTickerBlock(rt, sym)
  let depth = mapLegacyDepthData(dep)
  if (!depth || (depth.b.length === 0 && depth.a.length === 0)) {
    try {
      const d = await fetchBinanceDepthRaw(sym, 20)
      depth = d
    } catch {
      depth = depth ?? { s: '0', b: [], a: [] }
    }
  }

  const trades = mapTradeDetailsToRows(trd)
  const openOrders = unwrapPageRecords(listRaw)
    .map((row) => mapExchangeApplyOrderToRow(row as Record<string, unknown>, sym))
    .filter((o) => o.order_id)
  const historyOrders = unwrapPageRecords(histRaw)
    .map((row) => mapExchangeApplyOrderToRow(row as Record<string, unknown>, sym))
    .filter((o) => o.order_id)

  const balances = mapAssetsToBalances(assets, baseAsset, quoteAsset)

  return {
    symbol: sym,
    ticker,
    depth,
    trades,
    open_orders: openOrders,
    history_orders: historyOrders,
    fills: [],
    balances,
  }
}
