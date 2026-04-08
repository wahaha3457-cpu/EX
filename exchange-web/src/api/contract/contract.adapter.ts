import type {
  FuturesDepthSnapshot,
  FuturesFillRow,
  FuturesFundingLedgerRow,
  FuturesHistoryOrderRow,
  FuturesInstrumentMeta,
  FuturesMarginMode,
  FuturesOpenOrderRow,
  FuturesOrderSide,
  FuturesOrderType,
  FuturesPositionRow,
  FuturesPositionSide,
  FuturesRecentTrade,
  FuturesTickerSnapshot,
} from '@/types/futuresTrade'
import type { FuturesTradeBootstrap, FuturesTradeBootstrapRaw } from '@/api/contract/contract.types'

function num(s: string): number {
  const n = parseFloat(s)
  return Number.isFinite(n) ? n : 0
}

function sideOrder(s: string): FuturesOrderSide {
  return s.toUpperCase() === 'SELL' ? 'SELL' : 'BUY'
}

function posSide(s: string): FuturesPositionSide {
  return s.toUpperCase() === 'SHORT' ? 'SHORT' : 'LONG'
}

function marginMode(s: string): FuturesMarginMode {
  return s.toUpperCase() === 'ISOLATED' ? 'ISOLATED' : 'CROSS'
}

function orderType(s: string): FuturesOrderType {
  const u = s.toUpperCase()
  if (u === 'MARKET') return 'MARKET'
  if (u === 'CONDITIONAL' || u === 'STOP') return 'CONDITIONAL'
  return 'LIMIT'
}

function fundingType(s: string): FuturesFundingLedgerRow['type'] {
  const u = s.toUpperCase()
  if (u === 'REALIZED_PNL' || u === 'REALIZED') return 'REALIZED_PNL'
  if (u === 'FEE') return 'FEE'
  if (u === 'TRANSFER') return 'TRANSFER'
  return 'FUNDING'
}

export function adaptFuturesTradeBootstrap(raw: FuturesTradeBootstrapRaw): FuturesTradeBootstrap {
  const instrument: FuturesInstrumentMeta = {
    symbol: raw.instrument.symbol,
    contractSizeBase: num(raw.instrument.contract_size),
    baseAsset: raw.instrument.base,
    quoteAsset: raw.instrument.quote,
    maxLeverage: num(raw.instrument.max_lev),
  }

  const ticker: FuturesTickerSnapshot = {
    markPrice: num(raw.ticker.mp),
    indexPrice: num(raw.ticker.ip),
    lastPrice: num(raw.ticker.lp),
    changePct24h: num(raw.ticker.pcp),
    high24h: num(raw.ticker.hi),
    low24h: num(raw.ticker.lo),
    volume24hBase: num(raw.ticker.vb),
    quoteVolume24h: num(raw.ticker.qv),
    fundingRate: num(raw.ticker.fr),
    nextFundingTime: raw.ticker.nft,
  }

  const depth: FuturesDepthSnapshot = {
    seq: num(raw.depth.s),
    asks: raw.depth.a.map(([p, q]) => ({ price: num(p), quantity: num(q) })),
    bids: raw.depth.b.map(([p, q]) => ({ price: num(p), quantity: num(q) })),
  }

  const trades: FuturesRecentTrade[] = raw.trades.map((r) => ({
    id: r.i,
    price: num(r.p),
    quantity: num(r.q),
    side: r.m === '1' ? 'BUY' : 'SELL',
    time: r.t,
  }))

  const positions: FuturesPositionRow[] = raw.positions.map((p) => ({
    positionId: p.pid,
    symbol: p.sym,
    side: posSide(p.ps),
    contracts: num(p.vol),
    entryPrice: num(p.ep),
    markPrice: num(p.mp),
    leverage: num(p.lev),
    marginMode: marginMode(p.mm),
    isolatedMargin: num(p.im),
    unrealizedPnl: num(p.upnl),
    liquidationPrice: p.liq === '' ? null : num(p.liq),
    marginRatio: num(p.mr),
    entryOrderType: p.oty != null && String(p.oty).trim() !== '' ? orderType(p.oty) : undefined,
  }))

  const mapOrder = (o: (typeof raw.open_orders)[0]): FuturesOpenOrderRow => ({
    orderNo: o.oid,
    symbol: o.sym,
    side: sideOrder(o.side),
    positionSide: posSide(o.pz),
    type: orderType(o.typ),
    price: num(o.px),
    quantity: num(o.vol),
    filledQty: num(o.dvol),
    reduceOnly: o.ro === '1',
    status: o.st,
    createdAt: o.ct,
  })

  const openOrders: FuturesOpenOrderRow[] = raw.open_orders.map(mapOrder)

  const historyOrders: FuturesHistoryOrderRow[] = raw.history_orders.map((o) => ({
    ...mapOrder(o),
    updatedAt: o.ut ?? o.ct,
    avgFillPrice: o.ap != null ? num(o.ap) : null,
  }))

  const fills: FuturesFillRow[] = raw.fills.map((f) => {
    const kind = f.kind?.toUpperCase()
    const fillKind = kind === 'OPEN' || kind === 'CLOSE' ? kind : undefined
    const sd = f.sd?.toUpperCase()
    const orderSide = sd === 'BUY' || sd === 'SELL' ? sd : undefined
    const ps = f.ps?.toUpperCase()
    const positionSide = ps === 'LONG' || ps === 'SHORT' ? ps : undefined
    const oty = f.oty?.toUpperCase()
    const orderType =
      oty === 'LIMIT' || oty === 'MARKET' || oty === 'CONDITIONAL' ? oty : undefined
    const levN = f.lev != null ? num(f.lev) : NaN
    const roiN = f.roi != null && String(f.roi).trim() !== '' ? num(f.roi) : NaN
    return {
      tradeId: f.tid,
      orderNo: f.oid,
      price: num(f.px),
      quantity: num(f.qty),
      fee: num(f.fee),
      feeAsset: f.fa,
      realizedPnl: num(f.rpnl),
      time: f.ts,
      isMaker: f.mk === '1',
      fillKind,
      symbol: f.sym?.trim() || undefined,
      orderSide,
      positionSide,
      leverage: Number.isFinite(levN) && levN > 0 ? levN : undefined,
      orderType,
      entryPrice: f.ep != null && String(f.ep).trim() !== '' ? num(f.ep) : undefined,
      marginMode:
        f.mm != null && String(f.mm).trim() !== '' ? marginMode(String(f.mm)) : undefined,
      liquidationPrice:
        f.liq != null && String(f.liq).trim() !== '' ? num(f.liq) : null,
      roiPct: f.roi != null && String(f.roi).trim() !== '' && Number.isFinite(roiN) ? roiN : null,
    }
  })

  const fundingLedger: FuturesFundingLedgerRow[] = raw.funding.map((r) => ({
    id: r.id,
    time: r.ts,
    type: fundingType(r.typ),
    amount: num(r.amt),
    asset: r.ast,
    remark: r.rm,
  }))

  return {
    instrument,
    ticker,
    depth,
    trades,
    positions,
    openOrders,
    historyOrders,
    fills,
    fundingLedger,
    wallet: (() => {
      const availableQuote = num(raw.wallet.avail)
      return {
        availableQuote,
        asset: raw.wallet.ast,
        marginBalance: availableQuote,
      }
    })(),
  }
}
