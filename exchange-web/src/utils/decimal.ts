/**
 * 数字精度层：基于 decimal.js，避免 JS 双精度浮点误差。
 * 所有金额、数量、价格的运算与舍入优先走本模块，展示再走 @/utils/format。
 */

import Decimal from 'decimal.js'

/** 全局计算精度（有效数字），链上/大整数场景可调大 */
Decimal.set({ precision: 40, rounding: Decimal.ROUND_HALF_UP })

export { Decimal }
export type DecimalRounding = Decimal.Rounding

export const ROUND_DOWN = Decimal.ROUND_DOWN
export const ROUND_UP = Decimal.ROUND_UP
export const ROUND_HALF_UP = Decimal.ROUND_HALF_UP

/** 交易对 / 资产维度的精度配置（通常由后端 instrument / currency 接口下发） */
export interface SymbolPrecision {
  /** 价格小数位 */
  priceDecimals: number
  /** 基础币数量小数位 */
  quantityDecimals: number
  /** 计价货币小数位（如 USDT） */
  quoteDecimals: number
}

/** 常用计价货币默认精度 */
export const DEFAULT_QUOTE_DECIMALS: Record<string, number> = {
  USDT: 2,
  USDC: 2,
  BTC: 8,
  ETH: 8,
}

/** 按主流现货对给出默认精度（无后端配置时的兜底） */
export function defaultSpotPrecision(quoteAsset: string): SymbolPrecision {
  const q = quoteAsset.toUpperCase()
  const quoteDecimals = DEFAULT_QUOTE_DECIMALS[q] ?? 8
  return {
    priceDecimals: q === 'USDT' || q === 'USDC' ? 2 : 8,
    quantityDecimals: 8,
    quoteDecimals,
  }
}

export function defaultContractPrecision(quoteAsset: string): SymbolPrecision {
  const q = quoteAsset.toUpperCase()
  return {
    priceDecimals: q === 'USDT' ? 2 : 4,
    quantityDecimals: 4,
    quoteDecimals: DEFAULT_QUOTE_DECIMALS[q] ?? 8,
  }
}

export function toDecimal(value: string | number | Decimal | null | undefined): Decimal | null {
  if (value === null || value === undefined) return null
  if (value instanceof Decimal) return value
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return null
    return new Decimal(String(value))
  }
  const s = String(value).trim().replace(/,/g, '')
  if (s === '' || s === '-' || s === '+') return null
  try {
    return new Decimal(s)
  } catch {
    return null
  }
}

/** 与 {@link toDecimal} 相同，失败时抛出（用于必须合法数值的路径） */
export function requireDecimal(value: string | number | Decimal): Decimal {
  const d = toDecimal(value)
  if (d === null) throw new TypeError(`Invalid decimal: ${value}`)
  return d
}

export function isPositive(d: Decimal): boolean {
  return d.isFinite() && d.gt(0)
}

export function isNegative(d: Decimal): boolean {
  return d.isFinite() && d.lt(0)
}

export function roundToDp(value: Decimal, dp: number, mode: DecimalRounding = ROUND_HALF_UP): Decimal {
  return value.toDecimalPlaces(dp, mode)
}

export function roundPrice(value: Decimal, p: SymbolPrecision): Decimal {
  return roundToDp(value, p.priceDecimals, ROUND_HALF_UP)
}

export function roundQuantity(value: Decimal, p: SymbolPrecision): Decimal {
  return roundToDp(value, p.quantityDecimals, ROUND_DOWN)
}

export function roundQuote(value: Decimal, p: SymbolPrecision): Decimal {
  return roundToDp(value, p.quoteDecimals, ROUND_HALF_UP)
}

/** 名义价值 ≈ 价格 × 数量（展示用；清算以服务端为准） */
export function notional(price: Decimal, quantity: Decimal): Decimal {
  return price.mul(quantity)
}

export function add(a: Decimal, b: Decimal): Decimal {
  return a.add(b)
}

export function sub(a: Decimal, b: Decimal): Decimal {
  return a.sub(b)
}

export function mul(a: Decimal, b: Decimal): Decimal {
  return a.mul(b)
}

export function div(a: Decimal, b: Decimal): Decimal {
  return a.div(b)
}

/** 安全除法：除数为 0 返回 null */
export function safeDiv(a: Decimal, b: Decimal): Decimal | null {
  if (b.isZero()) return null
  return a.div(b)
}

/** 涨跌幅 %：(last - open) / open * 100 */
export function percentChange(last: Decimal, open: Decimal): Decimal | null {
  if (open.isZero()) return null
  return last.sub(open).div(open).mul(100)
}
