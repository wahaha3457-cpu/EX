import type { FuturesPlaceOrderRequest } from '@/types/futuresTrade'
import type {
  FuturesFormIntent,
  FuturesOrderFormFields,
  FuturesOrderFormValidateResult,
} from '@/types/futuresOrderForm'
import type { FuturesMarginMode, FuturesOrderSide, FuturesPositionSide } from '@/types/futuresTrade'
import {
  floorFuturesContracts,
  futuresNotionalUsdtToContracts,
  resolveFuturesQtyRefPrice,
} from '@/composables/futures/futuresQuoteOrder'

export function parseFuturesOrderNum(s: string): number | null {
  const n = parseFloat(String(s).replace(/,/g, '').trim())
  return Number.isFinite(n) ? n : null
}

/** 与 store.deriveOrderSide 一致 */
export function deriveFuturesOrderSide(
  intent: FuturesFormIntent,
  positionSide: FuturesPositionSide,
): FuturesOrderSide {
  if (intent === 'OPEN') {
    return positionSide === 'LONG' ? 'BUY' : 'SELL'
  }
  return positionSide === 'LONG' ? 'SELL' : 'BUY'
}

export function validateFuturesOrderForm(
  f: FuturesOrderFormFields,
  ctx: {
    maxLeverage: number
  },
): FuturesOrderFormValidateResult {
  const errors: string[] = []

  if (f.formType === 'CONDITIONAL') {
    errors.push('条件单尚未开放')
    return { valid: false, errors }
  }

  const qty = parseFuturesOrderNum(f.quantity)
  if (qty == null || qty <= 0) errors.push('请输入有效的名义金额')

  if (f.formType === 'LIMIT') {
    const price = parseFuturesOrderNum(f.price)
    if (price == null || price <= 0) errors.push('请输入有效委托价')
  }

  if (f.leverage < 1 || f.leverage > ctx.maxLeverage) {
    errors.push(`杠杆需在 1～${ctx.maxLeverage}x`)
  }

  return { valid: errors.length === 0, errors }
}

export type BuildFuturesPlaceOrderResult =
  | { ok: true; payload: FuturesPlaceOrderRequest }
  | { ok: false; error: string }

/**
 * 按 USDT 名义下单：限价用委托价、市价用标记价折算张数后写入 {@link FuturesPlaceOrderRequest.quantity}。
 */
export function tryBuildFuturesPlaceOrderPayload(
  f: FuturesOrderFormFields,
  symbol: string,
  marginMode: FuturesMarginMode,
  ctx: { maxLeverage: number; contractSizeBase: number; markPrice: number },
): BuildFuturesPlaceOrderResult {
  const v = validateFuturesOrderForm(f, ctx)
  if (!v.valid) return { ok: false, error: v.errors[0] ?? '校验失败' }

  const refPrice = resolveFuturesQtyRefPrice(f.formType, f.price, ctx.markPrice)
  if (refPrice == null || refPrice <= 0) {
    return {
      ok: false,
      error:
        f.formType === 'LIMIT' ? '请输入有效委托价' : '标记价未就绪，暂无法按名义金额下单',
    }
  }

  if (!(ctx.contractSizeBase > 0)) {
    return { ok: false, error: '合约面值未就绪' }
  }

  const notionalUsdt = parseFuturesOrderNum(f.quantity)!
  const rawContracts = futuresNotionalUsdtToContracts(notionalUsdt, ctx.contractSizeBase, refPrice)
  const quantity = floorFuturesContracts(rawContracts)
  if (quantity <= 0) {
    return { ok: false, error: '名义金额过小，折算后张数不足' }
  }

  /** 下单区仅保留开仓：方向由「开多/开空」决定，不再支持平仓 Tab */
  const side = deriveFuturesOrderSide('OPEN', f.positionSide)
  const reduceOnly = false

  const base: FuturesPlaceOrderRequest = {
    symbol,
    side,
    positionSide: f.positionSide,
    type: f.formType,
    quantity,
    leverage: f.leverage,
    marginMode,
    reduceOnly,
  }

  if (f.formType === 'LIMIT') {
    const price = parseFuturesOrderNum(f.price)!
    return { ok: true, payload: { ...base, price } }
  }

  return { ok: true, payload: base }
}

export function buildFuturesPlaceOrderPayload(
  f: FuturesOrderFormFields,
  symbol: string,
  marginMode: FuturesMarginMode,
  ctx: { maxLeverage: number; contractSizeBase: number; markPrice: number },
): FuturesPlaceOrderRequest | null {
  const r = tryBuildFuturesPlaceOrderPayload(f, symbol, marginMode, ctx)
  return r.ok ? r.payload : null
}
