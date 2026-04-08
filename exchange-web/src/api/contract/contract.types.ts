/**
 * Contract（合约）模块 — Raw 与 Domain
 */

import type {
  FuturesDepthSnapshot,
  FuturesFillRow,
  FuturesFundingLedgerRow,
  FuturesHistoryOrderRow,
  FuturesInstrumentMeta,
  FuturesOpenOrderRow,
  FuturesPositionRow,
  FuturesRecentTrade,
  FuturesTickerSnapshot,
} from '@/types/futuresTrade'

export interface FuturesInstrumentRaw {
  symbol: string
  contract_size: string
  base: string
  quote: string
  max_lev: string
}

export interface FuturesTickerBlockRaw {
  mp: string
  ip: string
  lp: string
  pcp: string
  hi: string
  lo: string
  vb: string
  qv: string
  fr: string
  nft: string
}

export interface FuturesDepthBlockRaw {
  s: string
  a: [string, string][]
  b: [string, string][]
}

export interface FuturesTradeRowRaw {
  i: string
  p: string
  q: string
  m: string
  t: string
}

export interface FuturesPositionRowRaw {
  pid: string
  sym: string
  ps: string
  vol: string
  ep: string
  mp: string
  lev: string
  mm: string
  im: string
  upnl: string
  liq: string
  mr: string
  /** 可选：LIMIT / MARKET，开仓订单类型 */
  oty?: string
}

export interface FuturesOrderRowRaw {
  oid: string
  sym: string
  side: string
  pz: string
  typ: string
  px: string
  vol: string
  dvol: string
  ro: string
  st: string
  ct: string
  ut?: string
  ap?: string
}

export interface FuturesFillRowRaw {
  tid: string
  oid: string
  px: string
  qty: string
  fee: string
  fa: string
  rpnl: string
  ts: string
  mk: string
  /** 可选：OPEN/CLOSE */
  kind?: string
  /** 可选：合约代码 */
  sym?: string
  /** 可选：BUY/SELL */
  sd?: string
  /** 可选：LONG/SHORT */
  ps?: string
  /** 可选：杠杆整数 */
  lev?: string
  /** 可选：LIMIT/MARKET */
  oty?: string
  /** 可选：开仓均价（USDT） */
  ep?: string
  /** 可选：CROSS / ISOLATED */
  mm?: string
  /** 可选：强平价 */
  liq?: string
  /** 可选：收益率百分点数字符串，如 "5.2" 表示 5.2% */
  roi?: string
}

export interface FuturesFundingRowRaw {
  id: string
  ts: string
  typ: string
  amt: string
  ast: string
  rm: string
}

export interface FuturesWalletRaw {
  avail: string
  ast: string
}

export interface FuturesTradeBootstrapRaw {
  symbol: string
  instrument: FuturesInstrumentRaw
  ticker: FuturesTickerBlockRaw
  depth: FuturesDepthBlockRaw
  trades: FuturesTradeRowRaw[]
  positions: FuturesPositionRowRaw[]
  open_orders: FuturesOrderRowRaw[]
  history_orders: FuturesOrderRowRaw[]
  fills: FuturesFillRowRaw[]
  funding: FuturesFundingRowRaw[]
  wallet: FuturesWalletRaw
}

/** 与现有 Store 对齐的聚合名 */
export interface FuturesTradeBootstrap {
  instrument: FuturesInstrumentMeta
  ticker: FuturesTickerSnapshot
  depth: FuturesDepthSnapshot
  trades: FuturesRecentTrade[]
  positions: FuturesPositionRow[]
  openOrders: FuturesOpenOrderRow[]
  historyOrders: FuturesHistoryOrderRow[]
  fills: FuturesFillRow[]
  fundingLedger: FuturesFundingLedgerRow[]
  wallet: {
    availableQuote: number
    asset: string
    /** 合约保证金余额（计价）；暂无独立字段时与 availableQuote 同源 */
    marginBalance: number
  }
}
