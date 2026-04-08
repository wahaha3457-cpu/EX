import type { SpotOrderSide, SpotOrderType } from '@/types/spotTrade'

/** 现货下单表单 — 与 UI 受控字段对齐 */
export interface SpotOrderFormFields {
  side: SpotOrderSide
  orderType: SpotOrderType
  price: string
  quantity: string
  quoteQty: string
  /** 限价止盈止损：触发价（计价币） */
  triggerPrice?: string
  /** 限价/市价：勾选止盈止损区域（至少填止盈或止损价之一） */
  tpSlAttachEnabled?: boolean
  /** 附带止盈价（计价币） */
  takeProfitPrice?: string
  /** 附带止损价（计价币） */
  stopLossPrice?: string
}

export interface SpotOrderFormValidateResult {
  valid: boolean
  errors: string[]
}
