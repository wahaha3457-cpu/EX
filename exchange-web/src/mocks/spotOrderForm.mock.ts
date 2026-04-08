import type { SpotOrderFormFields } from '@/types/spotOrderForm'

/** 演示用表单快照（单元测试 / Story） */
export function mockSpotOrderFormFields(
  overrides: Partial<SpotOrderFormFields> = {},
): SpotOrderFormFields {
  return {
    side: 'BUY',
    orderType: 'LIMIT',
    price: '68420.50',
    quantity: '0.001',
    quoteQty: '',
    ...overrides,
  }
}
