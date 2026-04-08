import { formatPct, formatPrice } from '@/utils/format/number'
import {
  formatPairSymbol,
  futuresMarginModeLabel,
  futuresOrderTypeLabel,
  orderSideText,
} from '@/utils/order/orderDisplay'
import type {
  FuturesFillRow,
  FuturesInstrumentMeta,
  FuturesPositionRow,
} from '@/types/futuresTrade'

const DASH = '—'

export interface FuturesFillTradeHistoryView {
  tradeId: string
  orderNo: string
  timeLabel: string
  symbolDisplay: string
  leverageDisplay: string
  sideLabel: string
  typeLabel: string
  roiDisplay: string
  marginModeLabel: string
  liquidationDisplay: string
  entryPriceDisplay: string
  volumeUsdtDisplay: string
  feeUsdtDisplay: string
  realizedPnlDisplay: string
  isMaker: boolean
  pnlNonNeg: boolean
}

function timeLabel(iso: string): string {
  try {
    return new Date(iso).toLocaleString('zh-CN', { hour12: false })
  } catch {
    return iso
  }
}

function matchPosition(
  f: FuturesFillRow,
  defaultSymbol: string,
  positions: FuturesPositionRow[],
): FuturesPositionRow | undefined {
  const sym = (f.symbol ?? defaultSymbol).trim()
  if (!sym || !f.positionSide) return undefined
  return positions.find((p) => p.symbol === sym && p.side === f.positionSide)
}

/**
 * 永续成交记录行：合并 fill 与持仓兜底；名义/手续费/盈亏按 USDT 展示
 */
export function buildFuturesFillTradeHistoryView(
  f: FuturesFillRow,
  ctx: {
    positions: FuturesPositionRow[]
    instrument: FuturesInstrumentMeta | null
    defaultSymbol: string
  },
): FuturesFillTradeHistoryView {
  const pos = matchPosition(f, ctx.defaultSymbol, ctx.positions)
  const cs = ctx.instrument?.contractSizeBase ?? 0
  const sym = (f.symbol ?? ctx.defaultSymbol).trim()

  const lev = f.leverage ?? pos?.leverage
  const leverageDisplay =
    lev != null && Number.isFinite(lev) && lev > 0 ? `${Math.round(lev)}倍` : DASH

  const mm = f.marginMode ?? pos?.marginMode
  const marginModeLabel = mm ? futuresMarginModeLabel(mm) : DASH

  const liqRaw = f.liquidationPrice != null ? f.liquidationPrice : pos?.liquidationPrice
  const liquidationDisplay =
    liqRaw != null && Number.isFinite(liqRaw) ? formatPrice(liqRaw) : DASH

  const entryPx =
    f.entryPrice != null && Number.isFinite(f.entryPrice) && f.entryPrice > 0
      ? f.entryPrice
      : f.price
  const entryPriceDisplay = Number.isFinite(entryPx) && entryPx > 0 ? formatPrice(entryPx) : DASH

  let volumeUsdtDisplay = DASH
  if (cs > 0 && Number.isFinite(f.quantity) && f.quantity > 0 && Number.isFinite(entryPx) && entryPx > 0) {
    volumeUsdtDisplay = formatPrice(entryPx * f.quantity * cs)
  }

  const feeUsdtDisplay = Number.isFinite(f.fee) ? formatPrice(f.fee) : DASH
  const realizedPnlDisplay = Number.isFinite(f.realizedPnl) ? formatPrice(f.realizedPnl) : DASH

  let roiDisplay = DASH
  if (f.roiPct != null && Number.isFinite(f.roiPct)) {
    roiDisplay = formatPct(f.roiPct)
  } else if (
    pos &&
    pos.isolatedMargin > 0 &&
    Number.isFinite(f.realizedPnl) &&
    Math.abs(f.realizedPnl) > 1e-12
  ) {
    roiDisplay = formatPct((f.realizedPnl / pos.isolatedMargin) * 100)
  }

  const sideLabel = f.orderSide ? orderSideText(f.orderSide) : DASH
  const typeLabel = f.orderType ? futuresOrderTypeLabel(f.orderType) : DASH

  return {
    tradeId: f.tradeId,
    orderNo: f.orderNo,
    timeLabel: timeLabel(f.time),
    symbolDisplay: sym ? formatPairSymbol(sym) : DASH,
    leverageDisplay,
    sideLabel,
    typeLabel,
    roiDisplay,
    marginModeLabel,
    liquidationDisplay,
    entryPriceDisplay,
    volumeUsdtDisplay,
    feeUsdtDisplay,
    realizedPnlDisplay,
    isMaker: f.isMaker,
    pnlNonNeg: f.realizedPnl >= 0,
  }
}
