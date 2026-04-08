/**
 * 基金理财 / 智能矿机 — 日收益率与日估收益（演示口径）
 * 基金：年化按单利均摊至自然日；矿机：日估产出 ÷ 实付（或单价）。
 */

/** 基金参考日收益率（%）：年化 / 365（单利均摊） */
export function fundDailyYieldPct(apyPct: number): number {
  return apyPct / 365
}

/** 基金持仓日估收益（USDT）：本金 × 年化 / 365 */
export function fundEstimatedDailyUsdt(principalUsdt: number, apyPct: number): number {
  if (principalUsdt <= 0) return 0
  return (principalUsdt * apyPct) / 100 / 365
}

/** 矿机参考日收益率（%）：日估产出 / 套餐单价 × 100（相对本金的日回报比例） */
export function minerDailyYieldPct(product: { estDailyUsdt: number; priceUsdt: number }): number {
  if (product.priceUsdt <= 0) return 0
  return (product.estDailyUsdt / product.priceUsdt) * 100
}

/** 订单日估产出（USDT） */
export function minerOrderEstimatedDailyUsdt(product: { estDailyUsdt: number }, quantity: number): number {
  return product.estDailyUsdt * Math.max(0, quantity)
}

/**
 * 订单相对实付的日收益率（%）：日估产出 / 实付 × 100
 * 与单套餐 `minerDailyYieldPct` 在整单为同一产品倍数时一致。
 */
export function minerOrderDailyYieldPct(order: { quantity: number; paidUsdt: number }, product: { estDailyUsdt: number }): number {
  if (order.paidUsdt <= 0) return 0
  const dailyOut = minerOrderEstimatedDailyUsdt(product, order.quantity)
  return (dailyOut / order.paidUsdt) * 100
}
