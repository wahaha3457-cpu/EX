/** 现货/合约订单侧通用枚举占位，后续与后端契约同步 */
export const OrderSide = {
  BUY: 'BUY',
  SELL: 'SELL',
} as const

export type OrderSideValue = (typeof OrderSide)[keyof typeof OrderSide]

export const OrderStatus = {
  NEW: 'NEW',
  PARTIALLY_FILLED: 'PARTIALLY_FILLED',
  FILLED: 'FILLED',
  CANCELED: 'CANCELED',
  REJECTED: 'REJECTED',
} as const
