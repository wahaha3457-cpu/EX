/**
 * 永续合约「当前委托 / 历史委托」共用：名义 USDT、杠杆、保证金模式（与持仓对齐）
 */
import { formatOrderQty, formatPrice } from '@/utils/format/number'
import { futuresMarginModeLabel } from '@/utils/order/orderDisplay'
import type {
  FuturesInstrumentMeta,
  FuturesMarginMode,
  FuturesPositionRow,
  FuturesPositionSide,
} from '@/types/futuresTrade'

export const FUTURES_ORDER_CELL_DASH = '--'

/** 与 {@link mapFuturesOpenOrdersToCurrentTableRows} / 历史委托映射共用 */
export interface FuturesOrderTableMapContext {
  positions: FuturesPositionRow[]
  instrument: FuturesInstrumentMeta | null
  markPrice: number
  defaultLeverage?: number
  defaultMarginMode?: FuturesMarginMode
}

export type FuturesCurrentOrdersMapContext = FuturesOrderTableMapContext

export type FuturesOrderForNotional = {
  type: string
  price: number
  quantity: number
  filledQty: number
  symbol: string
  positionSide: FuturesPositionSide
}

export function refPriceForOrderNotional(o: FuturesOrderForNotional, markPrice: number): number | null {
  const t = o.type.toUpperCase()
  if (t === 'MARKET') {
    if (Number.isFinite(markPrice) && markPrice > 0) return markPrice
    if (Number.isFinite(o.price) && o.price > 0) return o.price
    return null
  }
  if (Number.isFinite(o.price) && o.price > 0) return o.price
  if (Number.isFinite(markPrice) && markPrice > 0) return markPrice
  return null
}

export function notionalUsdt(
  qty: number,
  contractSizeBase: number,
  px: number | null,
): number | null {
  if (px == null || !Number.isFinite(contractSizeBase) || contractSizeBase <= 0) return null
  if (!Number.isFinite(qty) || qty < 0) return null
  if (qty === 0) return 0
  return qty * contractSizeBase * px
}

export function matchFuturesOrderPosition(
  o: FuturesOrderForNotional,
  positions: FuturesPositionRow[],
): FuturesPositionRow | undefined {
  return positions.find((p) => p.symbol === o.symbol && p.side === o.positionSide)
}

export function leverageDisplayForFuturesOrder(
  o: FuturesOrderForNotional,
  positions: FuturesPositionRow[],
  defaultLev: number | undefined,
): string {
  const m = matchFuturesOrderPosition(o, positions)
  if (m && Number.isFinite(m.leverage) && m.leverage > 0) return `${Math.round(m.leverage)}倍`
  if (defaultLev != null && Number.isFinite(defaultLev) && defaultLev > 0)
    return `${Math.round(defaultLev)}倍`
  return FUTURES_ORDER_CELL_DASH
}

export function marginModeDisplayForFuturesOrder(
  o: FuturesOrderForNotional,
  positions: FuturesPositionRow[],
  defaultMm: FuturesMarginMode | undefined,
): string {
  const m = matchFuturesOrderPosition(o, positions)
  if (m) return futuresMarginModeLabel(m.marginMode)
  if (defaultMm) return futuresMarginModeLabel(defaultMm)
  return FUTURES_ORDER_CELL_DASH
}
