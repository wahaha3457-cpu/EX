import {
  mockFuturesDepth,
  mockFuturesFills,
  mockFuturesHistoryOrders,
  mockFuturesOpenOrders,
  mockFuturesTicker,
  mockFuturesTrades,
  mockFundingLedger,
  mockFuturesWalletAvailable,
  mockInstrument,
  mockPositions,
} from '@/api/mock/futuresTradeMock'
import { apiGet } from '@/api/common/http'
import { fetchSpotAssetAvailable } from '@/api/trade/fetchSpotAssetAvailable'
import { fetchLegacyFuturesTradeBootstrapRaw } from '@/api/contract/legacy/legacyFuturesBootstrap'
import { isMockAdminSession } from '@/mocks/authMockService'
import { getAccessToken } from '@/utils/tokenStorage'
import { isLegacyAuthMode, isMockMode, marketTickerSource } from '@/config/env'
import type {
  FuturesDepthBlockRaw,
  FuturesFillRowRaw,
  FuturesFundingRowRaw,
  FuturesInstrumentRaw,
  FuturesOrderRowRaw,
  FuturesPositionRowRaw,
  FuturesTickerBlockRaw,
  FuturesTradeBootstrapRaw,
  FuturesTradeRowRaw,
  FuturesWalletRaw,
} from '@/api/contract/contract.types'

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

function instRaw(i: ReturnType<typeof mockInstrument>): FuturesInstrumentRaw {
  return {
    symbol: i.symbol,
    contract_size: String(i.contractSizeBase),
    base: i.baseAsset,
    quote: i.quoteAsset,
    max_lev: String(i.maxLeverage),
  }
}

function tickRaw(t: ReturnType<typeof mockFuturesTicker>): FuturesTickerBlockRaw {
  return {
    mp: String(t.markPrice),
    ip: String(t.indexPrice),
    lp: String(t.lastPrice),
    pcp: String(t.changePct24h),
    hi: String(t.high24h),
    lo: String(t.low24h),
    vb: String(t.volume24hBase),
    qv: String(t.quoteVolume24h),
    fr: String(t.fundingRate),
    nft: t.nextFundingTime,
  }
}

function depthRaw(d: ReturnType<typeof mockFuturesDepth>): FuturesDepthBlockRaw {
  return {
    s: String(d.seq),
    a: d.asks.map((x) => [String(x.price), String(x.quantity)] as [string, string]),
    b: d.bids.map((x) => [String(x.price), String(x.quantity)] as [string, string]),
  }
}

function tradesRaw(rows: ReturnType<typeof mockFuturesTrades>): FuturesTradeRowRaw[] {
  return rows.map((x) => ({
    i: x.id,
    p: String(x.price),
    q: String(x.quantity),
    m: x.side === 'BUY' ? '1' : '2',
    t: x.time,
  }))
}

function posRaw(rows: ReturnType<typeof mockPositions>): FuturesPositionRowRaw[] {
  return rows.map((p) => ({
    pid: p.positionId,
    sym: p.symbol,
    ps: p.side,
    vol: String(p.contracts),
    ep: String(p.entryPrice),
    mp: String(p.markPrice),
    lev: String(p.leverage),
    mm: p.marginMode,
    im: String(p.isolatedMargin),
    upnl: String(p.unrealizedPnl),
    liq: p.liquidationPrice != null ? String(p.liquidationPrice) : '',
    mr: String(p.marginRatio),
    oty: p.entryOrderType ?? 'LIMIT',
  }))
}

function foRaw(rows: ReturnType<typeof mockFuturesOpenOrders>): FuturesOrderRowRaw[] {
  return rows.map((o) => ({
    oid: o.orderNo,
    sym: o.symbol,
    side: o.side,
    pz: o.positionSide,
    typ: o.type,
    px: String(o.price),
    vol: String(o.quantity),
    dvol: String(o.filledQty),
    ro: o.reduceOnly ? '1' : '0',
    st: o.status,
    ct: o.createdAt,
  }))
}

function fhRaw(rows: ReturnType<typeof mockFuturesHistoryOrders>): FuturesOrderRowRaw[] {
  return rows.map((o) => ({
    oid: o.orderNo,
    sym: o.symbol,
    side: o.side,
    pz: o.positionSide,
    typ: o.type,
    px: String(o.price),
    vol: String(o.quantity),
    dvol: String(o.filledQty),
    ro: o.reduceOnly ? '1' : '0',
    st: o.status,
    ct: o.createdAt,
    ut: o.updatedAt,
    ap: o.avgFillPrice != null ? String(o.avgFillPrice) : undefined,
  }))
}

function fillsRaw(rows: ReturnType<typeof mockFuturesFills>): FuturesFillRowRaw[] {
  return rows.map((f) => ({
    tid: f.tradeId,
    oid: f.orderNo,
    px: String(f.price),
    qty: String(f.quantity),
    fee: String(f.fee),
    fa: f.feeAsset,
    rpnl: String(f.realizedPnl),
    ts: f.time,
    mk: f.isMaker ? '1' : '0',
    kind: f.fillKind,
    sym: f.symbol,
    sd: f.orderSide,
    ps: f.positionSide,
    lev: f.leverage != null ? String(Math.round(f.leverage)) : undefined,
    oty: f.orderType,
    ep: f.entryPrice != null ? String(f.entryPrice) : undefined,
    mm: f.marginMode,
    liq:
      f.liquidationPrice != null && Number.isFinite(f.liquidationPrice)
        ? String(f.liquidationPrice)
        : undefined,
    roi: f.roiPct != null && Number.isFinite(f.roiPct) ? String(f.roiPct) : undefined,
  }))
}

function fundRaw(rows: ReturnType<typeof mockFundingLedger>): FuturesFundingRowRaw[] {
  return rows.map((r) => ({
    id: r.id,
    ts: r.time,
    typ: r.type,
    amt: String(r.amount),
    ast: r.asset,
    rm: r.remark,
  }))
}

/**
 * GET /v1/futures/bootstrap?symbol=BTCUSDT
 */
export async function fetchFuturesTradeBootstrapRaw(symbol: string): Promise<FuturesTradeBootstrapRaw> {
  const sym = symbol && symbol.length > 0 ? symbol : 'BTCUSDT'
  if (isMockMode()) {
    await delay(130)
    return buildMockFuturesBootstrapRaw(sym)
  }
  if (isLegacyAuthMode()) {
    return fetchLegacyFuturesTradeBootstrapRaw(sym)
  }
  if (marketTickerSource() === 'server') {
    return fetchServerFuturesBootstrapRaw(sym)
  }
  await delay(130)
  return buildMockFuturesBootstrapRaw(sym)
}

function buildMockFuturesBootstrapRaw(sym: string): FuturesTradeBootstrapRaw {
  const inst = mockInstrument(sym)
  const tick = mockFuturesTicker(sym)
  const dep = mockFuturesDepth(sym)
  return {
    symbol: sym,
    instrument: instRaw(inst),
    ticker: tickRaw(tick),
    depth: depthRaw(dep),
    trades: tradesRaw(mockFuturesTrades(sym)),
    positions: posRaw(mockPositions(sym)),
    open_orders: foRaw(mockFuturesOpenOrders(sym)),
    history_orders: fhRaw(mockFuturesHistoryOrders(sym)),
    fills: fillsRaw(mockFuturesFills(sym)),
    funding: fundRaw(mockFundingLedger(sym)),
    wallet: {
      avail: String(mockFuturesWalletAvailable(sym, isMockAdminSession(getAccessToken()))),
      ast: 'USDT',
    } satisfies FuturesWalletRaw,
  }
}

type UnifiedTickerDto = {
  symbol: string
  baseCoin: string
  quoteCoin: string
  marketType: 'SPOT' | 'CONTRACT'
  latestPrice: number
  openPrice24h: number
  high24h: number
  low24h: number
  volume24h: number
  turnover24h: number
  priceChangePercent24h: number
}

type UnifiedDepthDto = {
  symbol: string
  marketType: 'SPOT' | 'CONTRACT'
  timestamp: number
  bids: Array<{ price: string | number; amount: string | number }>
  asks: Array<{ price: string | number; amount: string | number }>
}

type UnifiedTradeDto = {
  price: string | number
  qty: string | number
  side: 'BUY' | 'SELL'
  time: number
  tradeId?: string | null
}

type UnifiedContractSummaryDto = {
  symbol: string
  markPrice: number
  indexPrice: number
  fundingRate: number
  nextFundingTime: number | null
  openInterest: number
}

async function fetchServerFuturesBootstrapRaw(sym: string): Promise<FuturesTradeBootstrapRaw> {
  const unified = sym.replace(/[^A-Za-z0-9]/g, '').toUpperCase() || 'BTCUSDT'
  const [t, d, trades, c] = await Promise.all([
    apiGet<UnifiedTickerDto>('/market/summary', { params: { symbol: unified, type: 'contract' } }),
    apiGet<UnifiedDepthDto>('/market/depth', { params: { symbol: unified, type: 'contract', limit: 20 } }),
    apiGet<UnifiedTradeDto[]>('/market/trades', { params: { symbol: unified, type: 'contract', limit: 60 } }),
    apiGet<UnifiedContractSummaryDto>('/contract/summary', { params: { symbol: unified } }),
  ])

  const ticker: FuturesTickerBlockRaw = {
    mp: String(c.markPrice ?? 0),
    ip: String(c.indexPrice ?? 0),
    lp: String(t.latestPrice ?? 0),
    pcp: String(t.priceChangePercent24h ?? 0),
    hi: String(t.high24h ?? 0),
    lo: String(t.low24h ?? 0),
    vb: String(t.volume24h ?? 0),
    qv: String(t.turnover24h ?? 0),
    fr: String(c.fundingRate ?? 0),
    nft: c.nextFundingTime != null ? String(c.nextFundingTime) : '',
  }

  const depth: FuturesDepthBlockRaw = {
    s: String(d.timestamp ?? Date.now()),
    a: (d.asks ?? []).map((x) => [String(x.price ?? 0), String(x.amount ?? 0)] as [string, string]),
    b: (d.bids ?? []).map((x) => [String(x.price ?? 0), String(x.amount ?? 0)] as [string, string]),
  }

  const tradeRows: FuturesTradeRowRaw[] = (trades ?? []).map((x, i) => ({
    i: String(x.tradeId ?? `${x.time ?? Date.now()}-${i}`),
    p: String(x.price ?? 0),
    q: String(x.qty ?? 0),
    m: x.side === 'SELL' ? '2' : '1',
    t: String(x.time ?? Date.now()),
  }))

  const base = t.baseCoin || unified.replace(/USDT$/i, '') || 'BTC'
  const quote = t.quoteCoin || 'USDT'
  const instrument: FuturesInstrumentRaw = {
    symbol: unified,
    contract_size: '1',
    base,
    quote,
    max_lev: '100',
  }

  const walletAvail = await fetchSpotAssetAvailable(quote)

  return {
    symbol: unified,
    instrument,
    ticker,
    depth,
    trades: tradeRows,
    positions: [],
    open_orders: [],
    history_orders: [],
    fills: [],
    funding: fundRaw(
      mockFundingLedger(unified).map((r, i) =>
        i === 0
          ? {
              ...r,
              remark: '合约演示 · 账户推送前占位流水',
            }
          : r,
      ),
    ),
    wallet: { avail: String(walletAvail), ast: quote } satisfies FuturesWalletRaw,
  }
}
