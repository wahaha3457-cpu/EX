import { apiGet } from '@/api/common/http'
import type { ChartInterval, ChartSurface } from '@/types/chartKline'
import type { KlineTupleRaw, MarketTickerItemRaw } from '@/api/market/market.types'
import { fetchBinanceMarketTickersRaw } from '@/api/binance/binanceMarketTickers'
import { generateMockKlines } from '@/api/mock/chartKlinesMock'
import {
  isBinanceMarketTickerSource,
  isLegacyAuthMode,
  isMockMode,
  marketTickerSource,
} from '@/config/env'
import {
  fetchLegacyChartKlinesRaw,
  fetchLegacyMarketTickersRaw,
} from '@/api/market/legacy/legacyMarketApi'
import { fetchKlineTuplesFromBinancePublic } from '@/api/market/chartKlinePublicFallback'

type UnifiedTickerDto = {
  symbol: string
  baseCoin: string
  quoteCoin: string
  marketType: 'SPOT' | 'CONTRACT'
  latestPrice: number
  high24h: number
  low24h: number
  volume24h: number
  turnover24h: number
  priceChangePercent24h: number
}

type UnifiedKlineDto = {
  time: number // ms
  open: number
  high: number
  low: number
  close: number
  volume: number
}

function toRawSymSpot(unified: string): string {
  const s = unified.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
  if (s.endsWith('USDT') && s.length > 4) {
    return `${s.slice(0, -4).toLowerCase()}_usdt`
  }
  return s.toLowerCase()
}

function toRawSymContract(unified: string): string {
  return unified.replace(/[^A-Za-z0-9]/g, '').toLowerCase()
}

async function fetchServerTickersRaw(): Promise<MarketTickerItemRaw[]> {
  const [spot, contract] = await Promise.all([
    apiGet<UnifiedTickerDto[]>('/market/tickers', { params: { type: 'spot' } }),
    apiGet<UnifiedTickerDto[]>('/market/tickers', { params: { type: 'contract' } }),
  ])
  const toRow = (t: UnifiedTickerDto): MarketTickerItemRaw => {
    const isSpot = t.marketType === 'SPOT'
    return {
      sym: isSpot ? toRawSymSpot(t.symbol) : toRawSymContract(t.symbol),
      ty: isSpot ? 1 : 2,
      last: String(t.latestPrice ?? 0),
      rose: String(t.priceChangePercent24h ?? 0),
      high: String(t.high24h ?? 0),
      low: String(t.low24h ?? 0),
      vol: String(t.volume24h ?? 0),
      amount: String(t.turnover24h ?? 0),
      area: '0',
    }
  }
  return [...spot.map(toRow), ...contract.map(toRow)]
}

/**
 * 仅负责 HTTP 与「原始结构」返回，不做业务字段映射。
 * - Mock：内存演示数据
 * - `VITE_MARKET_TICKERS_SOURCE=binance`（默认）：币安现货 USDT 成交额 Top 268 + U 本位永续 Top N
 * - `legacy`：外汇测试站 publicRealtimeTop 等
 * - `server`：自建 `GET /v1/market/tickers`
 */

/** GET /v1/market/tickers → data 为列表 */
export async function fetchMarketTickersRaw(): Promise<MarketTickerItemRaw[]> {
  if (isMockMode()) {
    return Promise.resolve(getMarketTickersRawMock())
  }
  const src = marketTickerSource()
  if (src === 'binance') {
    try {
      return await fetchBinanceMarketTickersRaw()
    } catch (e) {
      console.warn('[market] Binance tickers failed, fallback', e)
      if (isLegacyAuthMode()) {
        return fetchLegacyMarketTickersRaw()
      }
      throw e
    }
  }
  if (src === 'legacy') {
    return fetchLegacyMarketTickersRaw()
  }
  // server：只依赖我方后端 /api/market/*
  return fetchServerTickersRaw()
}

export interface FetchKlinesRawParams {
  symbol: string
  interval: ChartInterval
  surface: ChartSurface
  limit?: number
  /** 与盘口/头部最新价对齐；Mock 或兜底随机 K 线时作起点，避免 K 线与 ticker 数量级不一致 */
  referencePrice?: number
}

/** GET /v1/market/klines 或 /v1/spot/klines — 旧版常返回二维 string 数组 */
export async function fetchChartKlinesRaw(params: FetchKlinesRawParams): Promise<KlineTupleRaw[]> {
  const limit = Math.min(params.limit ?? 500, 1500)
  if (isMockMode()) {
    const ref =
      params.referencePrice != null &&
      Number.isFinite(params.referencePrice) &&
      params.referencePrice > 0
        ? params.referencePrice
        : null
    const seed =
      ref ??
      (params.surface === 'futures'
        ? hashSeed(params.symbol) % 50000 + 50
        : hashSeed(params.symbol.replace('_', '')) % 50000 + 50)
    await delay(80)
    const bars = generateMockKlines(Math.min(limit, 360), params.interval, seed)
    return bars.map((b) => [
      String(b.time),
      String(b.open),
      String(b.high),
      String(b.low),
      String(b.close),
      String(b.volume),
    ])
  }
  // server：K 线直接走我方 /api/market/kline
  if (marketTickerSource() === 'server') {
    const type = params.surface === 'futures' ? 'contract' : 'spot'
    const rows = await apiGet<UnifiedKlineDto[]>('/market/kline', {
      params: {
        symbol: params.symbol,
        type,
        period: params.interval,
        limit,
      },
    })
    return rows.map((b) => [
      String(Math.floor((b.time ?? 0) / 1000)),
      String(b.open ?? 0),
      String(b.high ?? 0),
      String(b.low ?? 0),
      String(b.close ?? 0),
      String(b.volume ?? 0),
    ])
  }
  /** 行情列表走币安时：现货 K 线优先币安公开接口，与 markets 同源 */
  if (isBinanceMarketTickerSource() && params.surface === 'spot') {
    try {
      const rows = await fetchKlineTuplesFromBinancePublic({
        symbol: params.symbol,
        interval: params.interval,
        limit,
      })
      if (rows.length > 0) return rows
    } catch {
      /* fall through */
    }
    if (isLegacyAuthMode()) {
      const legacy = await fetchLegacyChartKlinesRaw({ ...params, limit })
      if (legacy.length > 0) return legacy
    }
  }
  if (isLegacyAuthMode()) {
    /** 优先旧站 hobi!getKline；无数据时再走币安公开 K 线兜底 */
    const legacy = await fetchLegacyChartKlinesRaw({ ...params, limit })
    if (legacy.length > 0) return legacy
    try {
      return await fetchKlineTuplesFromBinancePublic({
        symbol: params.symbol,
        interval: params.interval,
        limit,
      })
    } catch {
      return []
    }
  }
  try {
    const rows = await apiGet<KlineTupleRaw[]>('/v1/market/klines', {
      params: {
        symbol: params.symbol,
        interval: params.interval,
        surface: params.surface,
        limit,
      },
    })
    if (rows?.length) return rows
  } catch {
    /* fall through */
  }
  try {
    return await fetchKlineTuplesFromBinancePublic({
      symbol: params.symbol,
      interval: params.interval,
      limit,
    })
  } catch {
    return []
  }
}

function hashSeed(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

/** 演示：与旧后端字段风格一致的 mock */
function getMarketTickersRawMock(): MarketTickerItemRaw[] {
  return [
    { sym: 'btc_usdt', ty: 1, last: '68420.5', rose: '1.82', high: '69000', low: '67000', vol: '12800', amount: '872000000', area: '0' },
    { sym: 'eth_usdt', ty: 1, last: '3512.08', rose: '-0.45', high: '3600', low: '3400', vol: '980000', amount: '321000000', area: '0' },
    { sym: 'sol_usdt', ty: 1, last: '178.32', rose: '3.21', high: '182', low: '170', vol: '4200000', amount: '65000000', area: '2' },
    { sym: 'btcusdt', ty: 2, last: '68380.0', rose: '1.79', high: '68800', low: '67800', vol: '9200000', amount: '5900000000', area: '0' },
    { sym: 'ethusdt', ty: 2, last: '3508.2', rose: '-0.48', high: '3550', low: '3450', vol: '48000000', amount: '1550000000', area: '0' },
    { sym: 'wifusdt', ty: 2, last: '2.845', rose: '12.1', high: '3.1', low: '2.4', vol: '410000000', amount: '1050000000', area: '1' },
  ]
}
