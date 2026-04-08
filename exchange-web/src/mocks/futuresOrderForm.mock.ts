import type { FuturesOrderFormFields } from '@/types/futuresOrderForm'

/** 演示 / 单测用：与合约下单表单字段对齐的快照 */
export const mockFuturesOrderFormFieldsOpenLimit: FuturesOrderFormFields = {
  formIntent: 'OPEN',
  positionSide: 'LONG',
  formType: 'LIMIT',
  price: '68250.50',
  quantity: '0.15',
  leverage: 20,
}

export const mockFuturesOrderFormFieldsOpenMarket: FuturesOrderFormFields = {
  formIntent: 'OPEN',
  positionSide: 'LONG',
  formType: 'MARKET',
  price: '',
  quantity: '0.05',
  leverage: 20,
}
