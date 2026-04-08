import type { SpotOrderType } from '@/types/spotTrade'

/** 与下单面板输入框一致：去千分位逗号 */
export function parseSpotPriceInput(s: string): number | null {
  const n = parseFloat(String(s).replace(/,/g, '').trim())
  return Number.isFinite(n) && n > 0 ? n : null
}

/**
 * 买入侧「可买」折合与快捷比例共用参考价：
 * - 市价：仅用最新价
 * - 限价：有效委托价 → 否则最新价
 */
export function resolveSpotBuyRefPrice(
  orderType: SpotOrderType,
  priceInput: string,
  lastPrice: number | null | undefined,
): number | null {
  if (orderType === 'MARKET') {
    if (lastPrice != null && Number.isFinite(lastPrice) && lastPrice > 0) return lastPrice
    return null
  }
  if (orderType === 'LIMIT' || orderType === 'STOP') {
    const lim = parseSpotPriceInput(priceInput)
    if (lim != null) return lim
    if (lastPrice != null && Number.isFinite(lastPrice) && lastPrice > 0) return lastPrice
    return null
  }
  return null
}
