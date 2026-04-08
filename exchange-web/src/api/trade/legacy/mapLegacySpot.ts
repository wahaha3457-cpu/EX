import type {
  SpotBalancesBlockRaw,
  SpotDepthBlockRaw,
  SpotOrderRowRaw,
  SpotTickerBlockRaw,
  SpotTradeRowRaw,
} from '@/api/trade/trade.types'

function asRec(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null
}

/** 旧站常见：data / list / records 包装，或单条 ticker 对象 */
export function unwrapLegacyArray(data: unknown): unknown[] {
  if (Array.isArray(data)) return data
  const o = asRec(data)
  if (!o) return []
  const inner = o.data ?? o.list ?? o.records ?? o.rows ?? o.items ?? o.result
  if (Array.isArray(inner)) return inner
  if (o.symbol != null || o.close != null || o.last != null || o.current != null) return [o]
  return []
}

function numStr(v: unknown): string {
  if (v == null) return '0'
  if (typeof v === 'number' && Number.isFinite(v)) return String(v)
  return String(v)
}

function tickerLastPrice(pick: Record<string, unknown>): string {
  return numStr(
    pick.close ??
      pick.last ??
      pick.current ??
      pick.currentStr ??
      pick.newPrice ??
      pick.price ??
      pick.lastPrice ??
      pick.tradePrice ??
      pick.dealPrice,
  )
}

export function mapRealtimeToTickerBlock(rows: unknown, routeSymbol: string): SpotTickerBlockRaw {
  const list = unwrapLegacyArray(rows)
  const sym = routeSymbol.toLowerCase().replace(/-/g, '_')
  let pick: Record<string, unknown> | null = null
  for (const item of list) {
    const r = asRec(item)
    if (!r) continue
    const s = String(r.symbol ?? r.symbol_data ?? '').toLowerCase()
    if (s && (s === sym || s.replace(/_/g, '') === sym.replace(/_/g, ''))) {
      pick = r
      break
    }
  }
  if (!pick && list.length) pick = asRec(list[0])
  if (!pick) {
    return {
      c: '0',
      P: '0',
      o: '0',
      h: '0',
      l: '0',
      v: '0',
      q: '0',
    }
  }
  const last = tickerLastPrice(pick)
  const open = numStr(pick.open ?? pick.openPrice ?? pick.o)
  const high = numStr(pick.high)
  const low = numStr(pick.low)
  const vol = numStr(pick.volume ?? pick.vol)
  const amt = numStr(pick.amount ?? pick.internal_volume)
  const chg = pick.change_ratio ?? pick.chg ?? pick.percent ?? 0
  return {
    c: last,
    P: numStr(chg),
    o: open,
    h: high,
    l: low,
    v: vol,
    q: amt,
  }
}

export function mapLegacyDepthData(data: unknown): SpotDepthBlockRaw | null {
  let o = asRec(data)
  if (!o) return null
  const nested = asRec(o.data)
  if (nested && (nested.bids != null || nested.asks != null || nested.tick != null)) {
    o = nested
  }
  const seq = numStr(o.version ?? o.seq ?? o.ts ?? Date.now())
  const parseSide = (v: unknown): [string, string][] => {
    if (!Array.isArray(v)) return []
    return v
      .map((row) => {
        if (Array.isArray(row) && row.length >= 2) {
          return [String(row[0]), String(row[1])] as [string, string]
        }
        const r = asRec(row)
        if (!r) return null
        const p = r.price ?? r.p ?? r[0]
        const q = r.amount ?? r.quantity ?? r.vol ?? r[1]
        if (p == null || q == null) return null
        return [String(p), String(q)] as [string, string]
      })
      .filter((x): x is [string, string] => x != null)
  }
  let bids = parseSide(o.bids ?? o.bid ?? o.buy ?? o.buys)
  let asks = parseSide(o.asks ?? o.ask ?? o.sell ?? o.sells)
  if (bids.length === 0 && asks.length === 0) {
    const tick = asRec(o.tick) ?? o
    bids = parseSide(asRec(tick)?.bids ?? o.bidList)
    asks = parseSide(asRec(tick)?.asks ?? o.askList)
  }
  if (bids.length === 0 && asks.length === 0) return null
  return { s: seq, b: bids, a: asks }
}

export function mapTradeDetailsToRows(rows: unknown): SpotTradeRowRaw[] {
  const list = unwrapLegacyArray(rows)
  const out: SpotTradeRowRaw[] = []
  let idx = 0
  for (const item of list) {
    const r = asRec(item)
    if (!r) continue
    const price = numStr(
      r.current ??
        r.currentStr ??
        r.price ??
        r.tradePrice ??
        r.dealPrice ??
        r.deal_price ??
        r.avgPrice ??
        r.p ??
        r.px,
    )
    const qty = numStr(r.trade_volume ?? r.volume ?? r.qty ?? 1)
    const side = Number(r.side) === 1 || String(r.trade_type).toLowerCase().includes('buy') ? '1' : '2'
    const ts = r.timestamp != null ? String(r.timestamp) : String(Date.now())
    out.push({
      i: String(r.trade_unique_id ?? r.uuid ?? `lt-${idx++}`),
      p: price,
      q: qty,
      m: side,
      t: ts,
    })
  }
  return out.slice(0, 80)
}

function mapOrderPriceTypeToSpot(raw: unknown): string {
  const s = String(raw ?? '').toLowerCase()
  if (s.includes('market') || s.includes('市价')) return 'market'
  return 'limit'
}

export function mapExchangeApplyOrderToRow(o: Record<string, unknown>, routeSymbol: string): SpotOrderRowRaw {
  const offset = String(o.offset ?? '').toLowerCase()
  const rawDir = o.side ?? o.direction ?? o.orderSide ?? o.bsFlag
  let side: string
  if (rawDir != null && String(rawDir).trim() !== '') {
    const rs = String(rawDir).trim().toLowerCase()
    if (rs === 'sell' || rs === '2' || rs === 'ask' || rs === 's' || rs.includes('sell'))
      side = 'sell'
    else if (rs === 'buy' || rs === '1' || rs === 'bid' || rs === 'b' || rs.includes('buy')) side = 'buy'
    else side = offset === 'close' || offset === 'sell' ? 'sell' : 'buy'
  } else {
    side = offset === 'close' || offset === 'sell' ? 'sell' : 'buy'
  }
  const typ = mapOrderPriceTypeToSpot(o.orderPriceType)
  const created = String(o.createTime ?? o.createTimeTs ?? new Date().toISOString())
  return {
    order_id: String(o.orderNo ?? o.uuid ?? ''),
    symbol: routeSymbol,
    side,
    type: typ,
    price: numStr(o.price),
    volume: numStr(o.volume ?? o.symbolValue),
    deal_volume: numStr(o.successVolume ?? 0),
    status: String(o.state ?? 'unknown'),
    created_at: created,
    updated_at: String(o.updateTimeTs ?? created),
    avg_price: o.costPrice != null ? numStr(o.costPrice) : undefined,
  }
}

export function unwrapPageRecords(data: unknown): unknown[] {
  if (Array.isArray(data)) return data
  const o = asRec(data)
  if (!o) return []
  const inner = o.records ?? o.list ?? o.rows ?? o.items
  return Array.isArray(inner) ? inner : []
}

export function mapAssetsToBalances(
  data: unknown,
  baseAsset: string,
  quoteAsset: string,
): SpotBalancesBlockRaw {
  const base = baseAsset.toUpperCase()
  const quote = quoteAsset.toUpperCase()
  let baseAvail = '0'
  let quoteAvail = '0'

  const scanRow = (row: Record<string, unknown>) => {
    const coin = String(
      row.symbol ?? row.coin ?? row.currency ?? row.asset ?? row.coinType ?? '',
    ).toUpperCase()
    const avail = row.available ?? row.balance ?? row.free ?? row.amount
    if (coin === base) baseAvail = numStr(avail)
    if (coin === quote) quoteAvail = numStr(avail)
  }

  if (Array.isArray(data)) {
    for (const item of data) {
      const r = asRec(item)
      if (r) scanRow(r)
    }
  } else {
    const o = asRec(data)
    if (o) {
      const arr = o.walletList ?? o.balances ?? o.data ?? o.assets
      if (Array.isArray(arr)) {
        for (const item of arr) {
          const r = asRec(item)
          if (r) scanRow(r)
        }
      } else {
        scanRow(o)
      }
    }
  }

  return {
    base: baseAsset,
    quote: quoteAsset,
    base_avail: baseAvail,
    quote_avail: quoteAvail,
  }
}

export function extractSessionToken(data: unknown): string | undefined {
  const o = asRec(data)
  if (!o) return undefined
  const t =
    o.session_token ??
    o.sessionToken ??
    o.session ??
    asRec(o.data)?.session_token ??
    asRec(o.data)?.sessionToken
  if (t != null && String(t).length > 0) return String(t)
  return undefined
}
