import { formatOrderQty, formatPrice } from '@/utils/format/number'
import {
  formatPairSymbol,
  futuresOrderTypeLabel,
  orderSideText,
  orderStatusCell,
  positionSideText,
  spotOrderTypeLabel,
} from '@/utils/order/orderDisplay'
import type { FuturesOpenOrderRow } from '@/types/futuresTrade'
import type { CurrentOpenOrderTableRow } from '@/types/currentOrdersTable'
import type { SpotOpenOrderRow } from '@/types/spotTrade'
import type { FuturesCurrentOrdersMapContext } from '@/composables/orders/futuresOrderTableShared'
import {
  FUTURES_ORDER_CELL_DASH,
  leverageDisplayForFuturesOrder,
  marginModeDisplayForFuturesOrder,
  notionalUsdt,
  refPriceForOrderNotional,
} from '@/composables/orders/futuresOrderTableShared'

export type { FuturesCurrentOrdersMapContext } from '@/composables/orders/futuresOrderTableShared'

/** 限价委托名义（计价币）；市价单无委托价时占位 */
function spotOpenOrderAmountDisplay(type: string, price: number, quantity: number): string {
  const t = type.toUpperCase()
  if (t === 'MARKET') return FUTURES_ORDER_CELL_DASH
  if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(quantity) || quantity <= 0)
    return FUTURES_ORDER_CELL_DASH
  return formatPrice(price * quantity)
}

export function mapSpotOpenOrdersToCurrentTableRows(rows: SpotOpenOrderRow[]): CurrentOpenOrderTableRow[] {
  return rows.map((o) => ({
    orderNo: o.orderNo,
    symbolDisplay: formatPairSymbol(o.symbol),
    side: {
      text: orderSideText(o.side),
      tone: o.side === 'BUY' ? 'buy' : 'sell',
    },
    typeLabel: spotOrderTypeLabel(o.type),
    priceDisplay: priceDisplayForOrder(o.type, o.price),
    quantityDisplay: formatOrderQty(o.quantity),
    filledDisplay: formatOrderQty(o.filledQty),
    amountDisplay: spotOpenOrderAmountDisplay(o.type, o.price, o.quantity),
    tpSlDisplay: FUTURES_ORDER_CELL_DASH,
    status: orderStatusCell(o.status),
    timeDisplay: formatOrderTime(o.createdAt),
  }))
}

function priceDisplayForOrder(type: string, price: number): string {
  const t = type.toUpperCase()
  if (t === 'MARKET') return '市价'
  if (!Number.isFinite(price) || price <= 0) return FUTURES_ORDER_CELL_DASH
  return formatPrice(price)
}

export function mapFuturesOpenOrdersToCurrentTableRows(
  rows: FuturesOpenOrderRow[],
  ctx?: FuturesCurrentOrdersMapContext,
): CurrentOpenOrderTableRow[] {
  const positions = ctx?.positions ?? []
  const inst = ctx?.instrument ?? null
  const markPx = ctx?.markPrice ?? 0
  const cs = inst?.contractSizeBase ?? 0
  const defLev = ctx?.defaultLeverage
  const defMm = ctx?.defaultMarginMode

  return rows.map((o) => {
    const refPx = refPriceForOrderNotional(o, markPx)
    const posNu = notionalUsdt(o.quantity, cs, refPx)
    const fillNu = notionalUsdt(o.filledQty, cs, refPx)

    return {
      orderNo: o.orderNo,
      symbolDisplay: formatPairSymbol(o.symbol),
      side: {
        text: orderSideText(o.side),
        tone: o.side === 'BUY' ? 'buy' : 'sell',
      },
      typeLabel: futuresOrderTypeLabel(o.type),
      priceDisplay: priceDisplayForOrder(o.type, o.price),
      quantityDisplay: formatOrderQty(o.quantity),
      filledDisplay: formatOrderQty(o.filledQty),
      status: orderStatusCell(o.status),
      timeDisplay: formatOrderTime(o.createdAt),
      futuresExtras: {
        positionSide: {
          text: positionSideText(o.positionSide),
          tone: o.positionSide === 'LONG' ? 'long' : 'short',
        },
        reduceOnly: o.reduceOnly,
        leverageDisplay: leverageDisplayForFuturesOrder(o, positions, defLev),
        marginModeDisplay: marginModeDisplayForFuturesOrder(o, positions, defMm),
        positionNotionalDisplay: posNu != null ? formatPrice(posNu) : FUTURES_ORDER_CELL_DASH,
        filledNotionalDisplay:
          fillNu != null ? formatOrderQty(fillNu) : FUTURES_ORDER_CELL_DASH,
      },
    }
  })
}

function formatOrderTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('zh-CN', { hour12: false })
  } catch {
    return iso
  }
}
