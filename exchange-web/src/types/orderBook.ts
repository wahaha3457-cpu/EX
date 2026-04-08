import type { DepthLevel } from '@/types/spotTrade'

/**
 * 单档展示行（含累计量与深度条比例），由 {@link buildAskViewRows} / {@link buildBidViewRows} 生成。
 */
export interface OrderBookViewRow {
  price: number
  quantity: number
  cumulative: number
  /** 本侧可见档位内，按累计量归一化 [0,1]，用于深度条宽度 */
  depthRatio: number
}

export type { DepthLevel }
