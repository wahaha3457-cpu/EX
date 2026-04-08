import type { SpotOrderSide } from '@/types/spotTrade'

/** 限价条件单（止盈止损 Tab）：触发后下限价委托 */
export type SpotConditionalIntentKind = 'breakout_buy' | 'dip_buy' | 'stop_sell' | 'tp_sell'

export type SpotConditionalOrderStatus = 'PENDING' | 'TRIGGERED' | 'CANCELLED'

export interface SpotConditionalOrder {
  id: string
  symbol: string
  side: SpotOrderSide
  triggerPrice: number
  limitPrice: number
  quantity: number
  intentKind: SpotConditionalIntentKind
  /** 创建时最新价，用于展示与审计 */
  referenceLastAtCreate: number
  status: SpotConditionalOrderStatus
  createdAt: string
  triggeredAt?: string
  /** 触发后生成的模拟限价委托 orderNo（DM-…-L-…） */
  resultingOrderNo?: string
}
