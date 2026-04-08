import type { SpotPlaceOrderRequest } from '@/types/spotTrade'
import type { SpotOrderFormFields, SpotOrderFormValidateResult } from '@/types/spotOrderForm'

export function parseSpotOrderNum(s: string): number | null {
  const n = parseFloat(String(s).replace(/,/g, '').trim())
  return Number.isFinite(n) ? n : null
}

/**
 * 限价/市价主单勾选「附带止盈止损」时的方向与数值校验。
 * 限价以委托价为参考；市价以最新价为参考。
 */
export function validateSpotAttachedTpsl(
  f: SpotOrderFormFields,
  ctx: { lastPrice?: number | null },
): string[] {
  const out: string[] = []
  if (f.orderType !== 'LIMIT' && f.orderType !== 'MARKET') return out
  if (!f.tpSlAttachEnabled) return out

  let entry: number | null = null
  if (f.orderType === 'LIMIT') {
    entry = parseSpotOrderNum(f.price)
    if (entry == null || entry <= 0) return out
  } else {
    const lp = ctx.lastPrice
    if (lp == null || !Number.isFinite(lp) || lp <= 0) {
      out.push('暂无有效最新价，无法校验附带止盈止损')
      return out
    }
    entry = lp
  }

  if (entry == null || entry <= 0) return out

  const tp = parseSpotOrderNum(f.takeProfitPrice ?? '')
  const sl = parseSpotOrderNum(f.stopLossPrice ?? '')
  const tpOk = tp != null && tp > 0
  const slOk = sl != null && sl > 0
  if (!tpOk && !slOk) {
    out.push('已开启止盈止损，请至少填写止盈价或止损价')
    return out
  }

  if (tpOk && tp != null) {
    if (f.side === 'BUY' && tp <= entry) out.push('买入时止盈价须高于委托/参考价')
    else if (f.side === 'SELL' && tp >= entry) out.push('卖出时止盈价须低于委托/参考价')
  }
  if (slOk && sl != null) {
    if (f.side === 'BUY' && sl >= entry) out.push('买入时止损价须低于委托/参考价')
    else if (f.side === 'SELL' && sl <= entry) out.push('卖出时止损价须高于委托/参考价')
  }
  if (tpOk && slOk && tp != null && sl != null && f.side === 'BUY' && sl >= tp) {
    out.push('买入时止损价须低于止盈价')
  }
  if (tpOk && slOk && tp != null && sl != null && f.side === 'SELL' && sl <= tp) {
    out.push('卖出时止损价须高于止盈价')
  }
  return out
}

/**
 * 提交前校验：错误文案用于 toast / 内联提示。
 */
export function validateSpotOrderForm(
  f: SpotOrderFormFields,
  ctx: {
    symbol: string
    baseAvailable: number
    quoteAvailable: number
    /** 市价单：数量↔成交额折算依赖有效最新价 */
    lastPrice?: number | null
  },
): SpotOrderFormValidateResult {
  const errors: string[] = []

  if (f.orderType === 'STOP') {
    const trigger = parseSpotOrderNum(f.triggerPrice ?? '')
    const price = parseSpotOrderNum(f.price)
    const qty = parseSpotOrderNum(f.quantity)
    const lp = ctx.lastPrice
    if (trigger == null || trigger <= 0) errors.push('请输入有效触发价')
    if (price == null || price <= 0) errors.push('请输入有效委托价（限价）')
    if (qty == null || qty <= 0) errors.push('请输入有效数量')
    if (lp == null || !Number.isFinite(lp) || lp <= 0) {
      errors.push('暂无有效最新价，无法校验条件意图，请稍候再试')
    }
    if (price != null && qty != null && price * qty > ctx.quoteAvailable && f.side === 'BUY') {
      errors.push('可用余额不足（计价币，按委托价估算）')
    }
    if (qty != null && qty > ctx.baseAvailable && f.side === 'SELL') {
      errors.push('可卖数量不足（基础币）')
    }
    return { valid: errors.length === 0, errors }
  }

  if (f.orderType === 'LIMIT') {
    const price = parseSpotOrderNum(f.price)
    const qty = parseSpotOrderNum(f.quantity)
    if (price == null || price <= 0) errors.push(`请输入有效价格（${ctx.symbol}）`)
    if (qty == null || qty <= 0) errors.push('请输入有效数量')
    if (price != null && qty != null && price * qty > ctx.quoteAvailable && f.side === 'BUY') {
      errors.push('可用余额不足（计价币）')
    }
    if (qty != null && qty > ctx.baseAvailable && f.side === 'SELL') {
      errors.push('可卖数量不足（基础币）')
    }
  }

  if (f.orderType === 'MARKET') {
    if (f.side === 'BUY') {
      const quoteIn = parseSpotOrderNum(f.quoteQty)
      const qtyIn = parseSpotOrderNum(f.quantity)
      let effQuote: number | null = null
      if (quoteIn != null && quoteIn > 0) {
        effQuote = quoteIn
      } else if (qtyIn != null && qtyIn > 0) {
        const lp = ctx.lastPrice
        if (lp == null || !Number.isFinite(lp) || lp <= 0) {
          errors.push('暂无有效行情，请填写成交额（计价币）或稍后再试')
        } else {
          effQuote = qtyIn * lp
        }
      } else {
        errors.push('请输入有效成交额或数量')
      }
      if (effQuote != null && effQuote > ctx.quoteAvailable) {
        errors.push('可用余额不足（计价币）')
      }
    } else {
      const qtyIn = parseSpotOrderNum(f.quantity)
      const quoteIn = parseSpotOrderNum(f.quoteQty)
      let effQty: number | null = null
      if (qtyIn != null && qtyIn > 0) {
        effQty = qtyIn
      } else if (quoteIn != null && quoteIn > 0) {
        const lp = ctx.lastPrice
        if (lp == null || !Number.isFinite(lp) || lp <= 0) {
          errors.push('暂无有效行情，请填写数量（基础币）或稍后再试')
        } else {
          effQty = quoteIn / lp
        }
      } else {
        errors.push('请输入有效数量或成交额')
      }
      if (effQty != null && effQty > ctx.baseAvailable) {
        errors.push('可卖数量不足（基础币）')
      }
    }
  }

  errors.push(
    ...validateSpotAttachedTpsl(f, {
      lastPrice: ctx.lastPrice,
    }),
  )

  return { valid: errors.length === 0, errors }
}

/**
 * 构造 REST 请求体（幂等键由调用方补全）。
 */
export function buildSpotPlaceOrderPayload(
  f: SpotOrderFormFields,
  symbol: string,
  baseAvailable: number,
  quoteAvailable: number,
  lastPrice?: number | null,
): SpotPlaceOrderRequest | null {
  const v = validateSpotOrderForm(f, {
    symbol,
    baseAvailable,
    quoteAvailable,
    lastPrice: lastPrice ?? undefined,
  })
  if (!v.valid) return null

  const price = parseSpotOrderNum(f.price)
  const qty = parseSpotOrderNum(f.quantity)
  let quote = parseSpotOrderNum(f.quoteQty)

  if (f.orderType === 'LIMIT') {
    if (price == null || qty == null) return null
    return {
      symbol,
      side: f.side,
      type: 'LIMIT',
      price,
      quantity: qty,
    }
  }

  if (f.orderType === 'MARKET') {
    if (f.side === 'BUY') {
      if (quote == null || quote <= 0) {
        const q = qty
        const lp = lastPrice
        if (q == null || q <= 0 || lp == null || !Number.isFinite(lp) || lp <= 0) return null
        quote = q * lp
      }
      return { symbol, side: f.side, type: 'MARKET', quoteQty: quote }
    }
    let effQty = qty
    if (effQty == null || effQty <= 0) {
      const q = quote
      const lp = lastPrice
      if (q == null || q <= 0 || lp == null || !Number.isFinite(lp) || lp <= 0) return null
      effQty = q / lp
    }
    return { symbol, side: f.side, type: 'MARKET', quantity: effQty }
  }

  return null
}
