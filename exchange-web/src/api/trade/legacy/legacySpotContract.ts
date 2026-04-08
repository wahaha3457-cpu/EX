/**
 * 现货交易 — 与 Knife4j「现货交易API」Swagger 路径对齐。
 * 文档：https://bian50test.qdjkdo.com/api/doc.html#/home
 */
export const LEGACY_SPOT_PATHS = {
  realtime: import.meta.env.VITE_LEGACY_SPOT_REALTIME || '/api/hobi!getRealtime.action',
  depth: import.meta.env.VITE_LEGACY_SPOT_DEPTH || '/api/hobi!getDepth.action',
  trades: import.meta.env.VITE_LEGACY_SPOT_TRADES || '/api/hobi!getStockTradeList.action',
  openview: import.meta.env.VITE_LEGACY_SPOT_OPENVIEW || '/api/exchangeapplyorder!openview.action',
  open: import.meta.env.VITE_LEGACY_SPOT_OPEN || '/api/exchangeapplyorder!open.action',
  orderList: import.meta.env.VITE_LEGACY_SPOT_ORDER_LIST || '/api/exchangeapplyorder!list.action',
  orderHistory: import.meta.env.VITE_LEGACY_SPOT_ORDER_HISTORY || '/api/exchangeapplyorder!otherList.action',
  cancel: import.meta.env.VITE_LEGACY_SPOT_CANCEL || '/api/exchangeapplyorder!cancel.action',
  assets: import.meta.env.VITE_LEGACY_SPOT_ASSETS || '/api/assets!getAll.action',
} as const

/** 路由 BTC_USDT → 旧站常用小写+下划线 */
export function toLegacySpotSymbol(routeSymbol: string): string {
  return routeSymbol.trim().replace(/-/g, '_').toLowerCase()
}

/** 列表查询里的 type：虚拟货币 */
export const LEGACY_SPOT_MARKET_TYPE = import.meta.env.VITE_LEGACY_SPOT_MARKET_TYPE || 'cryptos'
