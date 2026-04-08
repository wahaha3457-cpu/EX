/**
 * 资产中心余额表 — 展示层模型（与 REST user.wallet / 多账户聚合对齐）
 */

/** 表格行：金额类字段均为已格式化字符串，便于 v-memo 与高频刷新 */
export interface AssetsTableRow {
  /** 资产代码，如 BTC、USDT */
  asset: string
  totalDisplay: string
  availableDisplay: string
  frozenDisplay: string
  /** 占用保证金；非合约视图或不适用时为 null，列隐藏时不展示 */
  marginOccupiedDisplay: string | null
  /** 折合计价货币，如 USDT */
  valueQuoteDisplay: string
}
