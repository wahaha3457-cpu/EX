/** 闪兑（Convert）— 演示域模型，可对接聚合报价与成交 API */

export interface ConvertFlashAssetMeta {
  symbol: string
  /** 展示名 */
  name: string
  /** 数量展示小数位 */
  qtyDp: number
}

export interface ConvertFlashQuote {
  /** 输入币种 */
  from: string
  /** 输出币种 */
  to: string
  amountFrom: number
  amountTo: number
  /** 不含手续费前的理论输出（演示） */
  amountToBeforeFee: number
  feePct: number
  /** 参考价：1 from = ? to（用于展示行） */
  rateFromTo: number
  /** 报价生成时间 */
  generatedAt: string
  /** 演示过期时间 ISO */
  expiresAt: string
}

/** executeConvert 可选参数（弹窗核对单提交） */
export interface ExecuteConvertOptions {
  confirmedAmountTo?: number
  orderRef?: string
  snapshotUsdtEq?: number
}

export interface ConvertFlashHistoryItem {
  id: string
  time: string
  from: string
  to: string
  amountFrom: number
  amountTo: number
  /** 折合 USDT 估值（演示） */
  usdtEq: number
  /** 演示订单号（核对单生成，可与成功页一致） */
  orderRef?: string
}
