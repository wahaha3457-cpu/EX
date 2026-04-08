/**
 * 交易所展示格式化（统一入口）。
 * 数值运算请使用 @/utils/decimal；本文件只做「字符串展示」与千分位等。
 *
 * ## 使用示例
 *
 * ```ts
 * import { displayPrice, displayQuantity, displayCompact } from '@/utils/format'
 * import { defaultSpotPrecision, toDecimal } from '@/utils/decimal'
 *
 * const p = defaultSpotPrecision('USDT')
 * const price = toDecimal('68420.12')
 * displayPrice(price, { precision: p }) // 盘口 / 行情
 * displayCompact(toDecimal('872000000')) // 成交额缩写
 * ```
 *
 * ## 页面接入建议
 *
 * - 行情列表、Ticker：{@link displayCompact} + {@link displayPercent}
 * - 订单簿、最新成交：{@link displayPrice} / {@link displayQuantity}，精度来自 instrument
 * - 资产总额、估值：{@link displayValuation}（USDT 计价）
 * - Store 中保存 string 或 Decimal，避免长期存 number
 */

import { type SymbolPrecision, Decimal, toDecimal } from '@/utils/decimal'

export type { SymbolPrecision } from '@/utils/decimal'

// ——— 选项类型 ———

export interface DisplayPriceOptions {
  precision: SymbolPrecision
  /** 覆盖 priceDecimals */
  overridePriceDp?: number
  localeGrouping?: boolean
  /** 为 true 时去掉末尾 0（盘口常用固定宽度则设 false） */
  stripTrailingZeros?: boolean
}

export interface DisplayQuantityOptions {
  precision: SymbolPrecision
  overrideQtyDp?: number
  localeGrouping?: boolean
  stripTrailingZeros?: boolean
}

export interface DisplayQuoteOptions {
  precision: SymbolPrecision
  overrideQuoteDp?: number
  localeGrouping?: boolean
}

export interface DisplayPercentOptions {
  /** 小数位，默认 2 */
  fractionDigits?: number
  /** 是否带正号 */
  showPositiveSign?: boolean
  /** 传入已为百分数（如 1.23 表示 1.23%） */
  alreadyPercent?: boolean
}

export interface DisplayCompactOptions {
  fractionDigits?: number
  /** 后缀：默认 K / M / B（十进制短级） */
  suffixes?: [string, string, string]
}

// ——— 内部工具 ———

function addThousands(intPart: string): string {
  return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

function formatDecimalString(
  d: Decimal,
  dp: number,
  opts: { grouping: boolean; stripTrailing: boolean; useScientificBelow?: Decimal },
): string {
  let s = d.toFixed(dp)
  if (opts.stripTrailing && s.includes('.')) {
    s = s.replace(/\.?0+$/, '')
    if (s === '' || s === '-') s = '0'
  }
  if (opts.useScientificBelow && d.abs().lt(opts.useScientificBelow) && !d.isZero()) {
    return d.toExponential(Math.min(dp, 8))
  }
  if (!opts.grouping) return s
  const neg = s.startsWith('-')
  const raw = neg ? s.slice(1) : s
  const [intPart, frac] = raw.split('.')
  const gi = addThousands(intPart)
  const body = frac !== undefined && frac.length > 0 ? `${gi}.${frac}` : gi
  return neg ? `-${body}` : body
}

// ——— 对外 API（推荐） ———

/** 价格展示（盘口、委托、K 线 tooltip） */
export function displayPrice(
  value: string | number | Decimal | null | undefined,
  options: DisplayPriceOptions,
): string {
  const d = toDecimal(value)
  if (d === null || !d.isFinite()) return '—'
  const dp = options.overridePriceDp ?? options.precision.priceDecimals
  return formatDecimalString(d, dp, {
    grouping: options.localeGrouping !== false,
    stripTrailing: options.stripTrailingZeros === true,
  })
}

/** 基础币数量（成交数量、委托量） */
export function displayQuantity(
  value: string | number | Decimal | null | undefined,
  options: DisplayQuantityOptions,
): string {
  const d = toDecimal(value)
  if (d === null || !d.isFinite()) return '—'
  const dp = options.overrideQtyDp ?? options.precision.quantityDecimals
  return formatDecimalString(d, dp, {
    grouping: options.localeGrouping !== false,
    stripTrailing: options.stripTrailingZeros === true,
  })
}

/** 成交额 / 计价体积（USDT 等） */
export function displayTurnover(
  value: string | number | Decimal | null | undefined,
  options: DisplayQuoteOptions,
): string {
  const d = toDecimal(value)
  if (d === null || !d.isFinite()) return '—'
  const dp = options.overrideQuoteDp ?? options.precision.quoteDecimals
  return formatDecimalString(d, dp, {
    grouping: options.localeGrouping !== false,
    stripTrailing: false,
  })
}

/** 资产估值（与成交额类似，语义单独命名便于主题换肤 / 审计） */
export const displayValuation = displayTurnover

/**
 * 涨跌幅 %：
 * - 默认 `value` 为**小数变化率**（如 0.0123 → 1.23%）
 * - `alreadyPercent: true` 时 `value` 已为百分数（如 1.23 → 1.23%）
 */
export function displayPercent(
  value: string | number | Decimal | null | undefined,
  options: DisplayPercentOptions = {},
): string {
  const d = toDecimal(value)
  if (d === null || !d.isFinite()) return '—'
  const fd = options.fractionDigits ?? 2
  const pct = options.alreadyPercent === true ? d : d.mul(100)
  if (pct.isZero()) {
    const z = `0.${'0'.repeat(fd)}`
    return `${z}%`
  }
  const absStr = pct.abs().toFixed(fd)
  if (pct.isNeg()) return `−${absStr}%`
  const posSign = options.showPositiveSign === false ? '' : '+'
  return `${posSign}${absStr}%`
}

/** 大数缩写：K / M / B（基于 1000 进制，与主流终端一致） */
export function displayCompact(
  value: string | number | Decimal | null | undefined,
  options: DisplayCompactOptions = {},
): string {
  const d = toDecimal(value)
  if (d === null || !d.isFinite()) return '—'
  const fd = options.fractionDigits ?? 2
  const [k, m, b] = options.suffixes ?? ['K', 'M', 'B']
  const sign = d.isNeg() ? '-' : ''
  const a = d.abs()
  const thousand = new Decimal(1000)
  const million = new Decimal(1_000_000)
  const billion = new Decimal(1_000_000_000)
  if (a.gte(billion)) return `${sign}${a.div(billion).toFixed(fd)}${b}`
  if (a.gte(million)) return `${sign}${a.div(million).toFixed(fd)}${m}`
  if (a.gte(thousand)) return `${sign}${a.div(thousand).toFixed(fd)}${k}`
  return `${sign}${a.toFixed(fd)}`
}

// ——— 兼容旧 API：与历史 `format/number` 行为接近（基于 Decimal） ———

function legacyPriceDp(d: Decimal): number {
  const a = d.abs()
  if (a.gte(1000)) return 2
  if (a.gte(1)) return 4
  if (a.gte(new Decimal('0.0001'))) return 6
  return 8
}

/** @deprecated 优先使用 {@link displayPercent} */
export function formatPct(pct: number): string {
  return displayPercent(pct, { alreadyPercent: true, showPositiveSign: true })
}

/** @deprecated 优先使用 {@link displayCompact} */
export function formatCompact(n: number): string {
  return displayCompact(n, {})
}

/** @deprecated 优先使用 {@link displayQuantity} */
export function formatOrderQty(n: number): string {
  const d = toDecimal(n)
  if (d === null || !d.isFinite()) return '—'
  const a = d.abs()
  let dp = 8
  if (a.gte(1000)) dp = 4
  else if (a.gte(1)) dp = 6
  return formatDecimalString(d, dp, { grouping: true, stripTrailing: false })
}

/** @deprecated 优先使用 {@link displayTurnover} */
export function formatSignedQuote(n: number): string {
  const d = toDecimal(n)
  if (d === null || !d.isFinite()) return '—'
  if (d.isZero()) return '0.00'
  const body = formatPrice(d.abs().toNumber())
  return d.isPos() ? `+${body}` : `-${body}`
}

/** 交易对头部：涨跌额（计价货币） */
export function formatSignedQuoteChange(n: number): string {
  const d = toDecimal(n)
  if (d === null || !d.isFinite()) return '—'
  const sign = d.isPos() ? '+' : d.isNeg() ? '−' : ''
  return `${sign}${formatPrice(d.abs().toNumber())}`
}

/** 资金费率小数 → 百分比展示 */
export function formatFundingRatePercent(rate: number): string {
  const d = toDecimal(rate)
  if (d === null || !d.isFinite()) return '—'
  return `${d.mul(100).toFixed(4)}%`
}

/** @deprecated 优先使用 {@link displayPrice} + {@link SymbolPrecision} */
export function formatPrice(n: number): string {
  const d = toDecimal(n)
  if (d === null || !d.isFinite()) return '—'
  if (d.isZero()) return '0'
  const dp = legacyPriceDp(d)
  const a = d.abs()
  if (a.lt(new Decimal('0.0001')) && !a.isZero()) return d.toExponential(2)
  return formatDecimalString(d, dp, { grouping: true, stripTrailing: false })
}

export * from '@/utils/format/pct'
export * from '@/utils/format/orderBook'
export * from '@/utils/format/recentTradeTime'
