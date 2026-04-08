/**
 * USDT 交割（季度）合约 — 与永续共用深度/持仓/订单结构；行情头含交割时间、基差与展示用结算资金费率（与永续每 8h 资金费不同）。
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
} from '@/types/futuresTrade'

export interface DeliveryInstrumentMeta extends FuturesInstrumentMeta {
  /** 展示用：演示为「第1期」「第2期」等 */
  cycleLabel: string
  /** 下一档交割时刻 ISO（演示为 1 分钟轮转刻度） */
  deliveryAt: string
}

export interface DeliveryTickerSnapshot {
  markPrice: number
  indexPrice: number
  lastPrice: number
  changePct24h: number
  high24h: number
  low24h: number
  volume24hBase: number
  quoteVolume24h: number
  /** 基差 %：(标记 − 指数) / 指数 × 100 */
  basisPct: number
  /** 与 instrument.deliveryAt 一致，便于头部直接读 */
  deliveryTime: string
  /**
   * 交割合约展示用「结算/资金费率」小数（如 0.0001 = 0.01%）；临近交割多为贴近 0 的 Mock。
   * 与永续资金费机制不同，仅作信息展示。
   */
  settlementFundingRate: number
}

export interface DeliveryTradeBootstrap {
  instrument: DeliveryInstrumentMeta
  ticker: DeliveryTickerSnapshot
  depth: FuturesDepthSnapshot
  trades: FuturesRecentTrade[]
  positions: FuturesPositionRow[]
  openOrders: FuturesOpenOrderRow[]
  historyOrders: FuturesHistoryOrderRow[]
  fills: FuturesFillRow[]
  fundingLedger: FuturesFundingLedgerRow[]
  wallet: { availableQuote: number; asset: string; marginBalance: number }
}
