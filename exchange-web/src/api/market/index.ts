import { adaptChartKlines, adaptMarketTickers } from '@/api/market/market.adapter'
import { appendDeliveryTickerRows } from '@/api/market/appendDeliveryTickerRows'
import { fetchChartKlinesRaw, fetchMarketTickersRaw, type FetchKlinesRawParams } from '@/api/market/market.api'
import type { MarketTickerRow } from '@/types/market'
import type { ChartInterval, ChartSurface, KlineBar } from '@/types/chartKline'

export async function fetchMarketTickers(): Promise<MarketTickerRow[]> {
  const raw = await fetchMarketTickersRaw()
  const rows = adaptMarketTickers(raw)
  return appendDeliveryTickerRows(rows)
}

export interface FetchKlinesParams {
  symbol: string
  interval: ChartInterval
  surface: ChartSurface
  limit?: number
  /** 当前最新价/标记价，用于 Mock 锚定及与盘口对齐 */
  referencePrice?: number
}

export async function fetchChartKlines(params: FetchKlinesParams): Promise<KlineBar[]> {
  const p: FetchKlinesRawParams = {
    symbol: params.symbol,
    interval: params.interval,
    surface: params.surface,
    limit: params.limit,
    referencePrice: params.referencePrice,
  }
  const raw = await fetchChartKlinesRaw(p)
  return adaptChartKlines(raw)
}

export type { MarketTickerItemRaw } from '@/api/market/market.types'
