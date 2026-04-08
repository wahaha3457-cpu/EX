import type { FuturesOrderType, FuturesPositionSide } from '@/types/futuresTrade'

/** 历史兼容：下单区已固定为开仓；接口仍可能传 CLOSE */
export type FuturesFormIntent = 'OPEN' | 'CLOSE'

/** 与合约下单 UI 同步的字段快照（校验 / 构造请求） */
export interface FuturesOrderFormFields {
  formIntent: FuturesFormIntent
  positionSide: FuturesPositionSide
  /** LIMIT / MARKET；CONDITIONAL 未开放 */
  formType: FuturesOrderType
  price: string
  /** 下单名义金额字符串（计价币，如 USDT）；提交时折算为张数 */
  quantity: string
  leverage: number
}

export interface FuturesOrderFormValidateResult {
  valid: boolean
  errors: string[]
}
