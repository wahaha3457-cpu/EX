import type { DepthLevel } from '@/types/spotTrade'
import type { OrderBookViewRow } from '@/types/orderBook'

/**
 * 卖盘：由低价→高价累加后，展示为高价→低价（靠上远离成交价），符合主流终端习惯。
 */
export function buildAskViewRows(
  levels: readonly DepthLevel[],
  maxLevels: number,
): OrderBookViewRow[] {
  const slice = levels.slice(0, maxLevels)
  if (!slice.length) return []
  const asc = [...slice].sort((a, b) => a.price - b.price)
  let running = 0
  const withCum = asc.map((lv) => {
    running += lv.quantity
    return {
      price: lv.price,
      quantity: lv.quantity,
      cumulative: running,
    }
  })
  const maxCum = withCum[withCum.length - 1]?.cumulative ?? 1
  const highToLow = [...withCum].reverse()
  return highToLow.map((r) => ({
    ...r,
    depthRatio: maxCum > 0 ? r.cumulative / maxCum : 0,
  }))
}

/**
 * 买盘：价格从高到低排序，由最优买价向外累加累计量。
 */
export function buildBidViewRows(
  levels: readonly DepthLevel[],
  maxLevels: number,
): OrderBookViewRow[] {
  const slice = levels.slice(0, maxLevels)
  if (!slice.length) return []
  const desc = [...slice].sort((a, b) => b.price - a.price)
  let running = 0
  const rows = desc.map((lv) => {
    running += lv.quantity
    return {
      price: lv.price,
      quantity: lv.quantity,
      cumulative: running,
    }
  })
  const maxCum = rows[rows.length - 1]?.cumulative ?? 1
  return rows.map((r) => ({
    ...r,
    depthRatio: maxCum > 0 ? r.cumulative / maxCum : 0,
  }))
}
