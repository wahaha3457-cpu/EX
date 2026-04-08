import type {
  FuturesInstrumentRaw,
  FuturesOrderRowRaw,
  FuturesPositionRowRaw,
  FuturesTickerBlockRaw,
  FuturesTradeRowRaw,
  FuturesWalletRaw,
} from '@/api/contract/contract.types'
import {
  mapLegacyDepthData,
  mapRealtimeToTickerBlock,
  mapTradeDetailsToRows,
  unwrapLegacyArray,
  unwrapPageRecords,
} from '@/api/trade/legacy/mapLegacySpot'
import { legacyFuturesToUiSymbol } from '@/api/contract/legacy/legacyFuturesPaths'

function asRec(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null
}

function numStr(v: unknown): string {
  if (v == null) return '0'
  if (typeof v === 'number' && Number.isFinite(v)) return String(v)
  return String(v)
}

/** 与现货共用 realtime 解包与价格字段兜底，再转为合约 Raw */
export function mapRealtimeToFuturesTickerBlock(rows: unknown, legacySym: string): FuturesTickerBlockRaw {
  const s = mapRealtimeToTickerBlock(rows, legacySym)
  const sym = legacySym.toLowerCase()
  let pick: Record<string, unknown> | null = null
  const walk = unwrapLegacyArray(rows)
  for (const item of walk) {
    const r = asRec(item)
    if (!r) continue
    const x = String(r.symbol ?? r.symbol_data ?? '').toLowerCase()
    if (x && (x === sym || x.replace(/_/g, '') === sym.replace(/_/g, ''))) {
      pick = r
      break
    }
  }
  if (!pick && walk.length) pick = asRec(walk[0])
  const fr = pick ? numStr(pick.funding ?? pick.funding_rate ?? 0) : '0'
  const nft = pick ? String(pick.next_funding_time ?? pick.funding_time ?? '') : ''
  return {
    mp: s.c,
    ip: s.c,
    lp: s.c,
    pcp: s.P,
    hi: s.h,
    lo: s.l,
    vb: s.v,
    qv: s.q,
    fr,
    nft,
  }
}

function defaultInstrument(uiSymbol: string): FuturesInstrumentRaw {
  const compact = uiSymbol.toUpperCase().replace(/_/g, '')
  let base = 'BTC'
  let quote = 'USDT'
  if (compact.endsWith('USDT')) {
    base = compact.slice(0, -4) || 'BTC'
    quote = 'USDT'
  }
  return {
    symbol: uiSymbol,
    contract_size: '0.001',
    base,
    quote,
    max_lev: '125',
  }
}

/** hobi!getContractApply 返回 JSON 中解析合约元数据（失败则兜底） */
export function pickInstrumentFromContractApply(data: unknown, legacySym: string): FuturesInstrumentRaw {
  const ui = legacyFuturesToUiSymbol(legacySym)
  const scan = (row: Record<string, unknown>): FuturesInstrumentRaw | null => {
    const sym = String(row.symbol ?? row.name ?? '').toLowerCase()
    if (!sym) return null
    if (sym !== legacySym && sym.replace(/_/g, '') !== legacySym.replace(/_/g, '')) return null
    const unit = row.unitAmount ?? row.unit_amount ?? row.contractSize ?? row.pips
    const maxLev = row.maxLeverage ?? row.lever_rate_max ?? row.leverRate ?? 125
    const base = String(row.baseSymbol ?? row.base ?? row.currency ?? '').toUpperCase() || defaultInstrument(ui).base
    const quote = String(row.quoteSymbol ?? row.quote ?? 'USDT').toUpperCase()
    return {
      symbol: ui,
      contract_size: numStr(unit || '0.001'),
      base,
      quote,
      max_lev: numStr(maxLev),
    }
  }

  const walk = (v: unknown): FuturesInstrumentRaw | null => {
    if (Array.isArray(v)) {
      for (const it of v) {
        const r = asRec(it)
        if (r) {
          const hit = scan(r)
          if (hit) return hit
          const nested = r.data ?? r.list ?? r.records ?? r.rows
          const w = walk(nested)
          if (w) return w
        }
      }
      return null
    }
    const o = asRec(v)
    if (!o) return null
    const hit = scan(o)
    if (hit) return hit
    for (const k of ['data', 'list', 'records', 'rows', 'items', 'result']) {
      const w = walk(o[k])
      if (w) return w
    }
    return null
  }

  return walk(data) ?? defaultInstrument(ui)
}

export function mapContractOrderDtoToPositionRow(
  row: Record<string, unknown>,
  uiSymbol: string,
): FuturesPositionRowRaw | null {
  const state = String(row.state ?? '').toLowerCase()
  if (state && state !== 'submitted') return null
  const dir = String(row.direction ?? '').toLowerCase()
  const ps = dir === 'sell' ? 'SHORT' : 'LONG'
  const vol = row.volume ?? row.volumeOpen ?? row.pipsAmount
  const pid = String(row.uuid ?? row.orderNo ?? '')
  if (!pid) return null
  return {
    pid,
    sym: uiSymbol,
    ps,
    vol: numStr(vol),
    ep: numStr(row.tradeAvgPrice ?? row.closeAvgPrice ?? 0),
    mp: numStr(row.mark_price ?? row.close ?? 0),
    lev: numStr(row.leverRate ?? 1),
    mm: 'CROSS',
    im: numStr(row.deposit ?? row.depositOpen ?? 0),
    upnl: numStr(row.profitLoss ?? row.profit ?? 0),
    liq: row.forceClosePrice != null ? String(row.forceClosePrice) : '',
    mr: numStr(row.changeRatio ?? 0),
    oty: 'LIMIT',
  }
}

function mapContractOrderToFuturesOrderRow(row: Record<string, unknown>, uiSymbol: string): FuturesOrderRowRaw | null {
  const oid = String(row.orderNo ?? row.uuid ?? '')
  if (!oid) return null
  const dir = String(row.direction ?? '').toLowerCase()
  const side = dir === 'sell' ? 'SELL' : 'BUY'
  const pz = dir === 'sell' ? 'SHORT' : 'LONG'
  const vOpen = Number(row.volumeOpen ?? row.pipsAmount ?? 0)
  const vRem = Number(row.volume ?? 0)
  const filled = Math.max(0, vOpen - vRem)
  return {
    oid,
    sym: uiSymbol,
    side,
    pz,
    typ: 'LIMIT',
    px: numStr(row.tradeAvgPrice ?? row.close ?? row.price ?? 0),
    vol: numStr(vOpen || vRem || Number(row.pipsAmount ?? 0)),
    dvol: numStr(filled),
    ro: '0',
    st: String(row.state ?? 'unknown'),
    ct: String(row.createTime ?? row.createDate ?? new Date().toISOString()),
    ut: String(row.closeTimeTs ?? row.updateTime ?? row.createTime ?? ''),
    ap: row.closeAvgPrice != null ? numStr(row.closeAvgPrice) : undefined,
  }
}

function mapTfuturesOrderDtoToHistoryRow(row: Record<string, unknown>, uiSymbol: string): FuturesOrderRowRaw | null {
  const oid = String(row.orderNo ?? row.uuid ?? '')
  if (!oid) return null
  const dir = String(row.direction ?? '').toLowerCase()
  const side = dir === 'sell' ? 'SELL' : 'BUY'
  const pz = dir === 'sell' ? 'SHORT' : 'LONG'
  return {
    oid,
    sym: String(row.symbol ?? uiSymbol),
    side,
    pz,
    typ: 'LIMIT',
    px: numStr(row.closeAvgPrice ?? 0),
    vol: numStr(row.profit ?? 0),
    dvol: '0',
    ro: '0',
    st: String(row.state ?? 'created'),
    ct: String(row.createTime ?? row.createDate ?? ''),
    ut: String(row.settlementTime ?? row.closeTime ?? row.createTime ?? ''),
    ap: row.closeAvgPrice != null ? numStr(row.closeAvgPrice) : undefined,
  }
}

export function mapPcListToPositions(data: unknown, uiSymbol: string): FuturesPositionRowRaw[] {
  const rows = unwrapPageRecords(data)
  const out: FuturesPositionRowRaw[] = []
  for (const item of rows) {
    const r = asRec(item)
    if (!r) continue
    const mapped = mapContractOrderDtoToPositionRow(r, uiSymbol)
    if (mapped) out.push(mapped)
  }
  return out
}

export function mapApplyListToOpenOrders(data: unknown, uiSymbol: string): FuturesOrderRowRaw[] {
  const rows = unwrapPageRecords(data)
  const out: FuturesOrderRowRaw[] = []
  for (const item of rows) {
    const r = asRec(item)
    if (!r) continue
    const o = mapContractOrderToFuturesOrderRow(r, uiSymbol)
    if (o) out.push(o)
  }
  return out
}

export function mapFuturesOrderListToHistory(data: unknown, uiSymbol: string): FuturesOrderRowRaw[] {
  const rows = unwrapPageRecords(data)
  const out: FuturesOrderRowRaw[] = []
  for (const item of rows) {
    const r = asRec(item)
    if (!r) continue
    const o = mapTfuturesOrderDtoToHistoryRow(r, uiSymbol)
    if (o) out.push(o)
  }
  return out
}

export function mapContractAssetsToWallet(data: unknown): FuturesWalletRaw {
  let avail = '0'
  const scan = (row: Record<string, unknown>) => {
    const coin = String(row.symbol ?? row.coin ?? row.currency ?? row.asset ?? '').toUpperCase()
    const a = row.available ?? row.balance ?? row.free ?? row.money
    if (coin === 'USDT' && a != null) avail = numStr(a)
  }
  if (Array.isArray(data)) {
    for (const it of data) {
      const r = asRec(it)
      if (r) scan(r)
    }
  } else {
    const o = asRec(data)
    if (o) {
      const arr = o.walletList ?? o.list ?? o.data ?? o.balances ?? o.assets ?? o.records
      if (Array.isArray(arr)) {
        for (const it of arr) {
          const r = asRec(it)
          if (r) scan(r)
        }
      } else {
        scan(o)
        const m = o.money ?? o.balance
        if (m != null) avail = numStr(m)
      }
    }
  }
  return { avail, ast: 'USDT' }
}

export function mapDepthToFutures(depth: unknown): { s: string; b: [string, string][]; a: [string, string][] } {
  const d = mapLegacyDepthData(depth)
  if (!d) return { s: '0', b: [], a: [] }
  return d
}

export function mapTradesToFutures(trades: unknown): FuturesTradeRowRaw[] {
  return mapTradeDetailsToRows(trades) as FuturesTradeRowRaw[]
}
