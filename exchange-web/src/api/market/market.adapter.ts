import type { MarketPairKind, MarketTickerRow, MarketZone } from '@/types/market'
import type { KlineBar } from '@/types/chartKline'
import type { KlineTupleRaw, MarketTickerItemRaw } from '@/api/market/market.types'

function num(s: string): number {
  const n = parseFloat(s)
  return Number.isFinite(n) ? n : 0
}

function zoneFromArea(area: string | undefined): MarketZone | undefined {
  switch (area) {
    case '0':
      return 'MAIN'
    case '1':
      return 'INNOVATION'
    case '2':
      return 'HOT'
    default:
      return undefined
  }
}

function kindFromTy(ty: number): MarketPairKind {
  return ty === 2 ? 'CONTRACT' : 'SPOT'
}

function parsePair(r: MarketTickerItemRaw): {
  kind: MarketPairKind
  routeSymbol: string
  displayPair: string
  baseAsset: string
  quoteAsset: string
  id: string
} {
  const kind = kindFromTy(r.ty)
  const sym = r.sym.trim()
  if (kind === 'SPOT') {
    const parts = sym.toLowerCase().split('_').filter(Boolean)
    const base = (parts[0] || 'btc').toUpperCase()
    const quote = (parts[1] || 'usdt').toUpperCase()
    const routeSymbol = `${base}_${quote}`
    return {
      kind,
      routeSymbol,
      displayPair: `${base}/${quote}`,
      baseAsset: base,
      quoteAsset: quote,
      id: `SPOT:${routeSymbol}`,
    }
  }
  const compact = sym.toLowerCase().replace(/_/g, '')
  let base = 'BTC'
  let quote = 'USDT'
  if (compact.endsWith('usdt')) {
    base = compact.slice(0, -4).toUpperCase() || 'BTC'
    quote = 'USDT'
  }
  const routeSymbol = `${base}${quote}`
  return {
    kind,
    routeSymbol,
    displayPair: `${base}/${quote} 永续`,
    baseAsset: base,
    quoteAsset: quote,
    id: `CONTRACT:${routeSymbol}`,
  }
}

/**
 * 旧版 ticker 列表 → 行情中心统一行模型
 */
export function adaptMarketTickers(raw: MarketTickerItemRaw[]): MarketTickerRow[] {
  return raw.map((r) => {
    const pair = parsePair(r)
    const zone = zoneFromArea(r.area)
    return {
      id: pair.id,
      kind: pair.kind,
      displayPair: pair.displayPair,
      routeSymbol: pair.routeSymbol,
      baseAsset: pair.baseAsset,
      quoteAsset: pair.quoteAsset,
      lastPrice: num(r.last),
      changePct: num(r.rose),
      high24h: num(r.high),
      low24h: num(r.low),
      volumeBase: num(r.vol),
      quoteVolume: num(r.amount),
      /* 旧接口无市值时：用 24h 成交额比例派生演示排序用刻度 */
      marketCapUsdt: Math.max(num(r.amount) * 220, 1),
      zone,
    }
  })
}

/**
 * 旧版 K 线 string 数组 → KlineBar
 */
export function adaptChartKlines(raw: KlineTupleRaw[]): KlineBar[] {
  const rows = raw
    .map((t) => ({
      // lightweight-charts 需要秒级整数 UTCTimestamp，且必须按 time 升序
      time: Math.floor(num(t[0])),
      open: num(t[1]),
      high: num(t[2]),
      low: num(t[3]),
      close: num(t[4]),
      volume: num(t[5]),
    }))
    .filter((b) => Number.isFinite(b.time) && b.time > 0)
    .sort((a, b) => a.time - b.time)

  // 去重（极少数源会重复最后一根）
  const out: KlineBar[] = []
  let lastT = -1
  for (const b of rows) {
    if (b.time === lastT) continue
    out.push(b)
    lastT = b.time
  }
  return out
}
