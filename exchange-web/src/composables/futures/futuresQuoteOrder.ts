import type { FuturesOrderType } from '@/types/futuresTrade'
import { parseFuturesOrderNum } from '@/composables/futures/validateFuturesOrderForm'

/** 折算张数时的参考价：限价用委托价，市价用标记价 */
export function resolveFuturesQtyRefPrice(
  formType: FuturesOrderType,
  limitPriceStr: string,
  markPrice: number,
): number | null {
  if (formType === 'LIMIT') {
    const p = parseFuturesOrderNum(limitPriceStr)
    return p != null && p > 0 ? p : null
  }
  return markPrice > 0 ? markPrice : null
}

/** 名义（USDT）= 张数 × 每张基础币数量 × 价格（USDT/基础币） */
export function futuresNotionalUsdtToContracts(
  notionalUsdt: number,
  contractSizeBase: number,
  refPrice: number,
): number {
  const denom = contractSizeBase * refPrice
  if (!(denom > 0) || !Number.isFinite(notionalUsdt)) return 0
  return notionalUsdt / denom
}

/** 向下取整到 4 位小数，避免名义略超；为 0 表示不足最小步长 */
export function floorFuturesContracts(n: number): number {
  if (!Number.isFinite(n) || n <= 0) return 0
  return Math.floor(n * 10_000) / 10_000
}
