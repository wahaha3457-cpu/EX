import type { FuturesMarginMode, FuturesPlaceOrderRequest } from '@/types/futuresTrade'
import type { SpotOrderConfirmRow, SpotOrderConfirmSummary } from '@/composables/spot/spotOrderConfirmSummary'
import { formatPrice } from '@/utils/format/number'
import { formatOrderBookQuantity } from '@/utils/format/orderBook'

function marginModeLabel(m: FuturesMarginMode): string {
  return m === 'CROSS' ? '全仓' : '逐仓'
}

function parseOptionalPositivePrice(s: string | undefined): number | null {
  if (s == null || !String(s).trim()) return null
  const n = parseFloat(String(s).replace(/,/g, '').trim())
  return Number.isFinite(n) && n > 0 ? n : null
}

function buildFuturesTpslRow(
  quoteAsset: string,
  takeProfit?: string,
  stopLoss?: string,
): SpotOrderConfirmRow | null {
  const tp = parseOptionalPositivePrice(takeProfit)
  const sl = parseOptionalPositivePrice(stopLoss)
  if (tp == null && sl == null) return null
  const parts: string[] = []
  if (tp != null) parts.push(`止盈 ${formatPrice(tp)} ${quoteAsset}`)
  if (sl != null) parts.push(`止损 ${formatPrice(sl)} ${quoteAsset}`)
  return { label: '止盈止损', value: parts.join(' · ') }
}

/**
 * 与现货 {@link buildSpotOrderConfirmSummaryFromPayload} 同结构的确认弹窗数据，供 {@link SpotOrderConfirmBody} 展示。
 */
export function buildFuturesOrderConfirmSummary(
  payload: FuturesPlaceOrderRequest,
  opts: {
    variant: 'perpetual' | 'delivery'
    baseAsset: string
    quoteAsset: string
    markPrice: number | null
    contractSizeBase: number
    /** 用户在下单区输入的名义金额（计价币） */
    orderNotionalUsdt: number
    tpSlEnabled: boolean
    takeProfitPrice?: string
    stopLossPrice?: string
    /** 交割：确认弹窗内倒计时/展示合约码与下单区同源实时刷新（见 SpotOrderConfirmBody） */
    deliveryConfirmLive?: boolean
  },
): SpotOrderConfirmSummary {
  const { baseAsset, quoteAsset, markPrice, contractSizeBase } = opts
  let pairDisplay = `${baseAsset}/${quoteAsset}`
  const rows: SpotOrderConfirmRow[] = []
  const deliveryLive = opts.variant === 'delivery' && opts.deliveryConfirmLive === true

  if (deliveryLive) {
    pairDisplay = ''
  }

  rows.push({
    label: '合约类型',
    value: opts.variant === 'delivery' ? '交割合约' : 'U 本位永续',
  })

  if (deliveryLive) {
    rows.push({
      label: '本期倒计时',
      value: '—',
      sub: '倒计时时间实时同步下单区',
      deliveryLive: 'slot_countdown',
    })
  }

  rows.push({
    label: '交易对',
    value: deliveryLive ? '—' : pairDisplay,
    sub: `代码 ${payload.symbol}`,
    deliveryLive: deliveryLive ? 'pair_code' : undefined,
  })

  const dir = payload.positionSide === 'LONG' ? '开多' : '开空'
  rows.push({ label: '方向', value: dir, sub: `报单方向 ${payload.side}` })

  rows.push({
    label: '委托类型',
    value: payload.type === 'LIMIT' ? '限价' : '市价',
  })
  rows.push({ label: '杠杆', value: `${payload.leverage}x` })
  rows.push({ label: '保证金模式', value: marginModeLabel(payload.marginMode) })

  if (payload.type === 'LIMIT' && payload.price != null) {
    rows.push({
      label: '委托价',
      value: `${formatPrice(payload.price)} ${quoteAsset}`,
    })
  }

  rows.push({
    label: '名义金额',
    value: `${formatPrice(opts.orderNotionalUsdt)} ${quoteAsset}`,
    sub: `约 ${formatOrderBookQuantity(payload.quantity, 4)} 张（按委托价/标记价折算）`,
  })

  if (markPrice != null && markPrice > 0) {
    rows.push({
      label: '标记价格',
      value: `${formatPrice(markPrice)} ${quoteAsset}`,
      sub:
        payload.type === 'MARKET'
          ? '市价按盘口撮合；标记价作风险与强平参考'
          : undefined,
    })
  }

  const refPx =
    payload.type === 'LIMIT' && payload.price != null && payload.price > 0
      ? payload.price
      : markPrice != null && markPrice > 0
        ? markPrice
        : null

  /** 永续确认弹窗不展示演示性质的初始保证金估算；交割仍保留 */
  if (
    opts.variant === 'delivery' &&
    refPx != null &&
    contractSizeBase > 0 &&
    payload.leverage > 0
  ) {
    const effectiveNotional = payload.quantity * contractSizeBase * refPx
    const im = effectiveNotional / payload.leverage
    rows.push({
      label: '预估初始保证金',
      value: `${formatPrice(im)} ${quoteAsset}`,
      sub: '按折算张数 × 参考价估算；以实际成交为准',
    })
  }

  if (opts.tpSlEnabled) {
    const tpsl = buildFuturesTpslRow(
      quoteAsset,
      opts.takeProfitPrice,
      opts.stopLossPrice,
    )
    if (tpsl) rows.push(tpsl)
  }

  return {
    pairDisplay,
    rows,
    deliveryConfirmLive: deliveryLive || undefined,
  }
}
