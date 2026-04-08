import type { SpotPlaceOrderRequest } from '@/types/spotTrade'
import type { SpotConditionalIntentKind } from '@/types/spotConditional'
import {
  intentDescriptionZh,
  intentTitleZh,
} from '@/composables/spot/spotConditionalIntent'
import { formatPrice } from '@/utils/format/number'
import { formatOrderBookQuantity } from '@/utils/format/orderBook'

/** 与下单面板「预估手续费」一致的演示吃单费率 */
const DEMO_TAKER_FEE_RATE = 0.001

export interface SpotOrderConfirmRow {
  label: string
  value: string
  /** 灰色说明，单行 */
  sub?: string
  /** 交割确认：由 SpotOrderConfirmBody 与 deliveryTrade store 同步刷新 */
  deliveryLive?: 'slot_countdown' | 'pair_code'
}

export interface SpotOrderConfirmSummary {
  pairDisplay: string
  rows: SpotOrderConfirmRow[]
  /** 交割下单确认：标题与带 deliveryLive 的行随 store 的演示时钟与档位偏移实时更新 */
  deliveryConfirmLive?: boolean
}

export interface SpotOrderConfirmTpslInput {
  takeProfit?: string
  stopLoss?: string
}

function parseOptionalPositivePrice(s: string | undefined): number | null {
  if (s == null || !String(s).trim()) return null
  const n = parseFloat(String(s).replace(/,/g, '').trim())
  return Number.isFinite(n) && n > 0 ? n : null
}

function buildTpslRow(quoteAsset: string, tpsl?: SpotOrderConfirmTpslInput): SpotOrderConfirmRow | null {
  if (!tpsl) return null
  const tp = parseOptionalPositivePrice(tpsl.takeProfit)
  const sl = parseOptionalPositivePrice(tpsl.stopLoss)
  if (tp == null && sl == null) return null
  const parts: string[] = []
  if (tp != null) parts.push(`止盈 ${formatPrice(tp)} ${quoteAsset}`)
  if (sl != null) parts.push(`止损 ${formatPrice(sl)} ${quoteAsset}`)
  return { label: '止盈止损', value: parts.join(' · ') }
}

/**
 * 根据已通过校验的下单请求体生成确认弹窗展示数据（与 {@link buildSpotPlaceOrderPayload} 结果一致）。
 * @param tpsl 止盈/止损价（计价币）；表单未接入前可由 store 传入，皆空则不展示该行。
 */
export function buildSpotOrderConfirmSummaryFromPayload(
  payload: SpotPlaceOrderRequest,
  baseAsset: string,
  quoteAsset: string,
  lastPrice: number | null,
  tpsl?: SpotOrderConfirmTpslInput,
): SpotOrderConfirmSummary {
  const pairDisplay = payload.symbol.replace(/_/g, '/')
  const sideLabel = payload.side === 'BUY' ? '买入' : '卖出'
  const typeLabel = payload.type === 'LIMIT' ? '限价' : '市价'
  const rows: SpotOrderConfirmRow[] = []
  const feeHint = '按 0.1% 吃单费率估算；Maker 减免、VIP 及活动以实际成交为准'

  rows.push({ label: '类型', value: typeLabel })
  rows.push({ label: '方向', value: sideLabel })
  const tpslRow = buildTpslRow(quoteAsset, tpsl)
  if (tpslRow) rows.push(tpslRow)

  if (payload.type === 'LIMIT') {
    const price = payload.price!
    const qty = payload.quantity!
    rows.push({ label: '价格', value: `${formatPrice(price)} ${quoteAsset}` })
    rows.push({ label: '数量', value: `${formatOrderBookQuantity(qty, 6)} ${baseAsset}` })
    const notional = price * qty
    rows.push({ label: '成交额', value: `${formatPrice(notional)} ${quoteAsset}` })
    rows.push({
      label: '预估手续费',
      value: `≈ ${formatPrice(notional * DEMO_TAKER_FEE_RATE)} ${quoteAsset}`,
      sub: feeHint,
    })
  } else if (payload.side === 'BUY') {
    const quote = payload.quoteQty!
    rows.push({
      label: '买入金额',
      value: `${formatPrice(quote)} ${quoteAsset}`,
      sub: '市价按此金额在盘口撮合，成交数量以实际为准',
    })
    rows.push({
      label: '数量（预估）',
      value:
        lastPrice != null && lastPrice > 0
          ? `${formatOrderBookQuantity(quote / lastPrice, 6)} ${baseAsset}`
          : '—',
      sub:
        lastPrice != null && lastPrice > 0
          ? '按最新价折算，市价成交数量以撮合为准'
          : '成交数量以撮合结果为准',
    })
    rows.push({
      label: '预估手续费',
      value: `≈ ${formatPrice(quote * DEMO_TAKER_FEE_RATE)} ${quoteAsset}`,
      sub: feeHint,
    })
  } else {
    const qty = payload.quantity!
    rows.push({ label: '数量', value: `${formatOrderBookQuantity(qty, 6)} ${baseAsset}` })
    if (lastPrice != null && lastPrice > 0) {
      const est = qty * lastPrice
      rows.push({
        label: '参考成交额',
        value: `≈ ${formatPrice(est)} ${quoteAsset}`,
        sub: '按当前最新价估算，市价卖出以实际成交为准',
      })
      rows.push({
        label: '预估手续费',
        value: `≈ ${formatPrice(est * DEMO_TAKER_FEE_RATE)} ${quoteAsset}`,
        sub: feeHint,
      })
    } else {
      rows.push({
        label: '参考成交额',
        value: '—',
        sub: '暂无有效最新价，无法展示估算成交额',
      })
      rows.push({ label: '预估手续费', value: '—', sub: feeHint })
    }
  }

  return { pairDisplay, rows }
}

export interface SpotConditionalConfirmInput {
  symbol: string
  side: 'BUY' | 'SELL'
  triggerPrice: number
  limitPrice: number
  quantity: number
  intentKind: SpotConditionalIntentKind
  lastPrice: number | null
}

/** 限价止盈止损（条件限价）确认弹窗摘要 */
export function buildSpotConditionalConfirmSummary(
  input: SpotConditionalConfirmInput,
  baseAsset: string,
  quoteAsset: string,
): SpotOrderConfirmSummary {
  const pairDisplay = input.symbol.replace(/_/g, '/')
  const sideLabel = input.side === 'BUY' ? '买入' : '卖出'
  const feeHint = '触发后按限价委托挂簿；按 0.1% 吃单费率估算，实际以成交为准'
  const rows: SpotOrderConfirmRow[] = []

  rows.push({ label: '类型', value: '限价止盈止损（条件单）' })
  rows.push({ label: '方向', value: sideLabel })
  rows.push({
    label: '订单意图',
    value: intentTitleZh(input.intentKind),
    sub: intentDescriptionZh(input.intentKind),
  })
  rows.push({
    label: '触发价',
    value: `${formatPrice(input.triggerPrice)} ${quoteAsset}`,
    sub:
      input.lastPrice != null && input.lastPrice > 0
        ? `当前参考最新价 ${formatPrice(input.lastPrice)} ${quoteAsset}`
        : undefined,
  })
  rows.push({ label: '委托价', value: `${formatPrice(input.limitPrice)} ${quoteAsset}` })
  rows.push({ label: '数量', value: `${formatOrderBookQuantity(input.quantity, 6)} ${baseAsset}` })
  const notional = input.limitPrice * input.quantity
  rows.push({ label: '预估成交额', value: `${formatPrice(notional)} ${quoteAsset}` })
  rows.push({
    label: '预估手续费',
    value: `≈ ${formatPrice(notional * DEMO_TAKER_FEE_RATE)} ${quoteAsset}`,
    sub: feeHint,
  })

  return { pairDisplay, rows }
}
