/**
 * 盘口基础币数量：紧凑、等宽小数，避免高频刷新时抖动。
 */
import { toDecimal } from '@/utils/decimal'

export function formatOrderBookQuantity(n: number, decimals: number): string {
  const d = toDecimal(n)
  if (d === null || !d.isFinite()) return '—'
  return d.toFixed(decimals)
}
