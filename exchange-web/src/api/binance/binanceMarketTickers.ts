/**
 * 币安全站行情：现货 USDT 交易对 + U 本位永续（公开 REST，与 markets 页同源参考）。
 * @see https://www.binance.com/zh-CN/markets/overview
 */
import { BINANCE_REST_BASE } from '@/api/binance/binancePublic'
import type { MarketTickerItemRaw } from '@/api/market/market.types'

const FAPI_BASE = import.meta.env.DEV ? '/binance-fapi' : 'https://fapi.binance.com'

const EXCHANGE_INFO_TTL_MS = 3_600_000

let spotUsdtCache: { symbols: string[]; at: number } | null = null

/** 杠杆代币等：常见以 UP/DOWN 结尾的 USDT 现货 */
function isLeveragedEtpSymbol(symbol: string): boolean {
  return /(UP|DOWN)USDT$/i.test(symbol)
}

function areaFromRank(idx: number): string {
  if (idx < 12) return '2'
  if (idx < 48) return '1'
  return '0'
}

async function fetchUsdtSpotSymbolWhitelist(): Promise<string[]> {
  const now = Date.now()
  if (spotUsdtCache && now - spotUsdtCache.at < EXCHANGE_INFO_TTL_MS) {
    return spotUsdtCache.symbols
  }
  const url = `${BINANCE_REST_BASE}/api/v3/exchangeInfo`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`exchangeInfo HTTP ${res.status}`)
  const j = (await res.json()) as {
    symbols?: Array<{ symbol: string; quoteAsset?: string; status?: string }>
  }
  const symbols = (j.symbols ?? [])
    .filter((s) => s.quoteAsset === 'USDT' && s.status === 'TRADING')
    .map((s) => s.symbol)
    .filter((sym) => !isLeveragedEtpSymbol(sym))
  spotUsdtCache = { symbols, at: now }
  return symbols
}

type Ticker24hRow = {
  symbol: string
  lastPrice: string
  priceChangePercent: string
  highPrice: string
  lowPrice: string
  volume: string
  quoteVolume: string
}

async function fetchSpot24hAll(): Promise<Ticker24hRow[]> {
  const url = `${BINANCE_REST_BASE}/api/v3/ticker/24hr`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`ticker/24hr HTTP ${res.status}`)
  return (await res.json()) as Ticker24hRow[]
}

async function fetchFutures24hAll(): Promise<Ticker24hRow[]> {
  const url = `${FAPI_BASE}/fapi/v1/ticker/24hr`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`fapi ticker/24hr HTTP ${res.status}`)
  return (await res.json()) as Ticker24hRow[]
}

function toSpotRaw(t: Ticker24hRow, rankIdx: number): MarketTickerItemRaw {
  const sym = t.symbol
  const base = sym.endsWith('USDT') ? sym.slice(0, -4) : sym
  return {
    sym: `${base.toLowerCase()}_usdt`,
    ty: 1,
    last: t.lastPrice,
    rose: t.priceChangePercent,
    high: t.highPrice,
    low: t.lowPrice,
    vol: t.volume,
    amount: t.quoteVolume,
    area: areaFromRank(rankIdx),
  }
}

function toFuturesRaw(t: Ticker24hRow): MarketTickerItemRaw {
  return {
    sym: t.symbol.toLowerCase(),
    ty: 2,
    last: t.lastPrice,
    rose: t.priceChangePercent,
    high: t.highPrice,
    low: t.lowPrice,
    vol: t.volume,
    amount: t.quoteVolume,
    area: '0',
  }
}

function num(v: string): number {
  const n = parseFloat(v)
  return Number.isFinite(n) ? n : 0
}

/**
 * 现货 USDT：按 24h 计价成交额排序，取前 `spotLimit`（默认 268）。
 * 另附 U 本位永续前 `futuresLimit` 条，供「合约」Tab。
 */
export async function fetchBinanceMarketTickersRaw(options?: {
  spotLimit?: number
  futuresLimit?: number
}): Promise<MarketTickerItemRaw[]> {
  const envSpot = parseInt(String(import.meta.env.VITE_BINANCE_SPOT_TOP || '268'), 10)
  const envFut = parseInt(String(import.meta.env.VITE_BINANCE_FUTURES_TOP || '40'), 10)
  const spotLimit = Math.min(
    500,
    Math.max(50, options?.spotLimit ?? (Number.isFinite(envSpot) ? envSpot : 268)),
  )
  const futuresLimit = Math.min(
    80,
    Math.max(0, options?.futuresLimit ?? (Number.isFinite(envFut) ? envFut : 40)),
  )

  const [whitelist, spotTickers] = await Promise.all([fetchUsdtSpotSymbolWhitelist(), fetchSpot24hAll()])
  const allow = new Set(whitelist)
  const merged = spotTickers
    .filter((t) => allow.has(t.symbol))
    .map((t) => ({ t, qv: num(t.quoteVolume) }))
    .sort((a, b) => b.qv - a.qv)

  const spotOut: MarketTickerItemRaw[] = merged.slice(0, spotLimit).map((x, idx) => toSpotRaw(x.t, idx))

  let futuresOut: MarketTickerItemRaw[] = []
  if (futuresLimit > 0) {
    const fut = await fetchFutures24hAll()
    futuresOut = fut
      .filter((t) => t.symbol.endsWith('USDT'))
      .sort((a, b) => num(b.quoteVolume) - num(a.quoteVolume))
      .slice(0, futuresLimit)
      .map(toFuturesRaw)
  }

  return [...spotOut, ...futuresOut]
}
