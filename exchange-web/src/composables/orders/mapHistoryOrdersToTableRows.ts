import { formatOrderQty, formatPrice } from '@/utils/format/number'
import {
  FUTURES_ORDER_CELL_DASH,
  leverageDisplayForFuturesOrder,
  marginModeDisplayForFuturesOrder,
  notionalUsdt,
  refPriceForOrderNotional,
  type FuturesOrderTableMapContext,
} from '@/composables/orders/futuresOrderTableShared'
import {
  formatPairSymbol,
  futuresOrderTypeLabel,
  historyOrderStatusCell,
  orderSideText,
  positionSideText,
  spotOrderTypeLabel,
} from '@/utils/order/orderDisplay'
import type { FuturesHistoryOrderRow } from '@/types/futuresTrade'
import type { OrderHistoryTableRow } from '@/types/orderHistoryTable'
import type { SpotHistoryOrderRow } from '@/types/spotTrade'

export type { FuturesOrderTableMapContext } from '@/composables/orders/futuresOrderTableShared'

const CELL_DASH = '—'

function formatOrderTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('zh-CN', { hour12: false })
  } catch {
    return iso
  }
}

function priceDisplayForHistory(type: string, price: number): string {
  const t = type.toUpperCase()
  if (t === 'MARKET') return '市价'
  if (!Number.isFinite(price) || price <= 0) return '—'
  return formatPrice(price)
}

/**
 * 成交均价：优先服务端字段；否则仅在全成限价且无量价异常时用委托价近似（生产应以成交明细聚合为准）
 */
function avgFillDisplay(
  type: string,
  price: number,
  quantity: number,
  filledQty: number,
  avgFillPrice?: number | null,
): string {
  if (!Number.isFinite(filledQty) || filledQty <= 0) return '—'
  if (avgFillPrice != null && Number.isFinite(avgFillPrice)) return formatPrice(avgFillPrice)
  const t = type.toUpperCase()
  if (t === 'LIMIT' && Number.isFinite(quantity) && quantity > 0 && filledQty >= quantity * 0.9999) {
    return formatPrice(price)
  }
  return '—'
}

/** 历史委托成交额：已成交部分计价币名义（均价×已成交量，可回退委托价×已成交量） */
function historyTurnoverDisplay(o: SpotHistoryOrderRow): string {
  const filled = o.filledQty
  if (!Number.isFinite(filled) || filled <= 0) return CELL_DASH
  const avg = o.avgFillPrice
  if (avg != null && Number.isFinite(avg) && avg > 0) {
    return formatPrice(avg * filled)
  }
  if (Number.isFinite(o.price) && o.price > 0) {
    return formatPrice(o.price * filled)
  }
  return CELL_DASH
}

export function mapSpotHistoryOrdersToTableRows(rows: SpotHistoryOrderRow[]): OrderHistoryTableRow[] {
  return rows.map((o) => ({
    orderNo: o.orderNo,
    symbolDisplay: formatPairSymbol(o.symbol),
    typeLabel: spotOrderTypeLabel(o.type),
    side: {
      text: orderSideText(o.side),
      tone: o.side === 'BUY' ? 'buy' : 'sell',
    },
    priceDisplay: priceDisplayForHistory(o.type, o.price),
    quantityDisplay: formatOrderQty(o.quantity),
    avgFillDisplay: avgFillDisplay(o.type, o.price, o.quantity, o.filledQty, o.avgFillPrice),
    filledVolumeDisplay: formatOrderQty(o.filledQty),
    turnoverDisplay: historyTurnoverDisplay(o),
    tpSlDisplay: CELL_DASH,
    status: historyOrderStatusCell(o.status),
    timeDisplay: formatOrderTime(o.updatedAt),
  }))
}

export function mapFuturesHistoryOrdersToTableRows(
  rows: FuturesHistoryOrderRow[],
  ctx?: FuturesOrderTableMapContext,
): OrderHistoryTableRow[] {
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
      typeLabel: futuresOrderTypeLabel(o.type),
      side: {
        text: orderSideText(o.side),
        tone: o.side === 'BUY' ? 'buy' : 'sell',
      },
      priceDisplay: priceDisplayForHistory(o.type, o.price),
      quantityDisplay: formatOrderQty(o.quantity),
      avgFillDisplay: avgFillDisplay(o.type, o.price, o.quantity, o.filledQty, o.avgFillPrice),
      filledVolumeDisplay: formatOrderQty(o.filledQty),
      status: historyOrderStatusCell(o.status),
      timeDisplay: formatOrderTime(o.updatedAt),
      futuresExtras: {
        positionSide: {
          text: positionSideText(o.positionSide),
          tone: o.positionSide === 'LONG' ? 'long' : 'short',
        },
        leverageDisplay: leverageDisplayForFuturesOrder(o, positions, defLev),
        marginModeDisplay: marginModeDisplayForFuturesOrder(o, positions, defMm),
        positionNotionalDisplay: posNu != null ? formatPrice(posNu) : FUTURES_ORDER_CELL_DASH,
        filledNotionalDisplay:
          fillNu != null ? formatOrderQty(fillNu) : FUTURES_ORDER_CELL_DASH,
      },
    }
  })
}
