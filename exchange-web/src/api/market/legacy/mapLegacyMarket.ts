import type { ChartInterval } from '@/types/chartKline'
import type { KlineTupleRaw, MarketTickerItemRaw } from '@/api/market/market.types'

function str(v: unknown): string {
  if (v == null) return ''
  if (typeof v === 'number' && Number.isFinite(v)) return String(v)
  return String(v)
}

function numStr(v: unknown): string {
  if (typeof v === 'number' && Number.isFinite(v)) return String(v)
  const s = str(v)
  return s
}

/**
 * QueryRealtimeDTO → 与 market.adapter 一致的「旧版 ticker」行
 * @see Swagger definitions/QueryRealtimeDTO
 */
export function mapQueryRealtimeToTickerItem(row: Record<string, unknown>): MarketTickerItemRaw | null {
  const symbol = str(row.symbol).trim()
  if (!symbol) return null

  const typeStr = str(row.type).toLowerCase()
  const marketStr = str(row.market).toLowerCase()
  let ty = symbol.includes('_') ? 1 : 2
  if (typeStr.includes('contract') || typeStr.includes('futures') || marketStr.includes('contract')) {
    ty = 2
  }
  if (typeStr.includes('spot') || marketStr.includes('spot')) {
    ty = 1
  }

  const changePct = row.changeRatio ?? row.chg ?? row.percent ?? 0

  return {
    sym: symbol.toLowerCase(),
    ty,
    last: numStr(row.close ?? row.last ?? row.price),
    rose: numStr(changePct),
    high: numStr(row.high),
    low: numStr(row.low),
    vol: numStr(row.volume ?? row.vol),
    amount: numStr(row.amount ?? row.turnover),
    /** 分区：文档未与旧版 area 对齐时统一 MAIN，避免错误归类 */
    area: '0',
  }
}

export function mapLegacyTickerListPayload(data: unknown): MarketTickerItemRaw[] {
  if (!Array.isArray(data)) return []
  const out: MarketTickerItemRaw[] = []
  for (const item of data) {
    if (!item || typeof item !== 'object') continue
    const row = mapQueryRealtimeToTickerItem(item as Record<string, unknown>)
    if (row) out.push(row)
  }
  return out
}

function pickKlineFields(m: Record<string, unknown>): KlineTupleRaw | null {
  const timeRaw =
    m.time ??
    m.ts ??
    m.t ??
    m.id ??
    m.openTime ??
    m.open_time ??
    m.bucket ??
    m.timestamp
  const open = m.open ?? m.o ?? m.openPrice ?? m.open_price
  const high = m.high ?? m.h ?? m.highPrice ?? m.high_price ?? m.highest
  const low = m.low ?? m.l ?? m.lowPrice ?? m.low_price ?? m.lowest
  const close = m.close ?? m.c ?? m.closePrice ?? m.close_price
  const vol = m.volume ?? m.vol ?? m.v ?? m.amount ?? m.turnover ?? m.qty
  if (timeRaw == null || open == null || high == null || low == null || close == null) return null
  let t = timeRaw
  if (typeof t === 'number' && t > 1e12) t = Math.floor(t / 1000)
  return [str(t), str(open), str(high), str(low), str(close), str(vol ?? '0')]
}

/**
 * Result data：List«Map«string,object»»，元素可能是 map 或已是数组
 */
export function mapLegacyKlinePayload(data: unknown, limit: number): KlineTupleRaw[] {
  if (!Array.isArray(data)) return []
  const rows: KlineTupleRaw[] = []
  for (const item of data) {
    if (!item || typeof item !== 'object') continue
    if (Array.isArray(item)) {
      const t = item.map((x) => str(x)) as string[]
      if (t.length >= 6) rows.push([t[0], t[1], t[2], t[3], t[4], t[5]])
      continue
    }
    const tuple = pickKlineFields(item as Record<string, unknown>)
    if (tuple) rows.push(tuple)
  }
  const sorted = [...rows].sort((a, b) => Number(a[0]) - Number(b[0]))
  if (sorted.length > limit) return sorted.slice(-limit)
  return sorted
}

export function legacyKlineStartTsSeconds(interval: ChartInterval, limit: number): number {
  const sec: Record<ChartInterval, number> = {
    '1m': 60,
    '5m': 300,
    '15m': 900,
    '1h': 3600,
    '4h': 14_400,
    '1d': 86_400,
  }
  const bar = sec[interval] ?? 60
  return Math.floor(Date.now() / 1000) - limit * bar
}
