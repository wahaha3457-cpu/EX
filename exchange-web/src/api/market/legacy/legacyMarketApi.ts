import { legacyGet } from '@/api/auth/legacy/legacyHttp'
import type { ChartInterval, ChartSurface } from '@/types/chartKline'
import type { KlineTupleRaw, MarketTickerItemRaw } from '@/api/market/market.types'
import {
  LEGACY_KLINE_LINE,
  LEGACY_KLINE_PATH,
  buildLegacyTickerQueryParams,
  LEGACY_TICKER_PATH,
  toLegacyKlineSymbol,
} from '@/api/market/legacy/legacyMarketContract'
import {
  legacyKlineStartTsSeconds,
  mapLegacyKlinePayload,
  mapLegacyTickerListPayload,
} from '@/api/market/legacy/mapLegacyMarket'

export async function fetchLegacyMarketTickersRaw(): Promise<MarketTickerItemRaw[]> {
  const params = buildLegacyTickerQueryParams()
  const data = await legacyGet<unknown>(LEGACY_TICKER_PATH, params)
  return mapLegacyTickerListPayload(data)
}

async function legacyKlineTry(params: {
  symbol: string
  line: string
  startTs?: number
}): Promise<unknown | null> {
  try {
    const q: Record<string, string | number> = { symbol: params.symbol, line: params.line }
    if (params.startTs != null) q.startTs = params.startTs
    return await legacyGet<unknown>(LEGACY_KLINE_PATH, q)
  } catch {
    return null
  }
}

export async function fetchLegacyChartKlinesRaw(params: {
  symbol: string
  interval: ChartInterval
  surface: ChartSurface
  limit?: number
}): Promise<KlineTupleRaw[]> {
  const limit = Math.min(params.limit ?? 500, 1500)
  const line = LEGACY_KLINE_LINE[params.interval]
  const symbol = toLegacyKlineSymbol(params.surface, params.symbol)
  const startTs = legacyKlineStartTsSeconds(params.interval, limit)

  let data = await legacyKlineTry({ symbol, line, startTs })
  let rows = data != null ? mapLegacyKlinePayload(data, limit) : []
  if (rows.length === 0) {
    data = await legacyKlineTry({ symbol, line })
    rows = data != null ? mapLegacyKlinePayload(data, limit) : []
  }
  return rows
}
