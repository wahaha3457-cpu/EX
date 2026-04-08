/**
 * 合约交易 — 与 Knife4j「外汇管理平台」Swagger 对齐。
 * 文档：https://bian50test.qdjkdo.com/api/doc.html#/home
 */
import { LEGACY_SPOT_PATHS } from '@/api/trade/legacy/legacySpotContract'

export const LEGACY_FUTURES_PATHS = {
  /** 与现货共用：实时价、深度、最新成交 */
  realtime: LEGACY_SPOT_PATHS.realtime,
  depth: LEGACY_SPOT_PATHS.depth,
  trades: LEGACY_SPOT_PATHS.trades,

  openview: import.meta.env.VITE_LEGACY_FUTURES_OPENVIEW || '/api/contractApplyOrder!openview.action',
  open: import.meta.env.VITE_LEGACY_FUTURES_OPEN || '/api/contractApplyOrder!open.action',
  close: import.meta.env.VITE_LEGACY_FUTURES_CLOSE || '/api/contractApplyOrder!close.action',
  cancel: import.meta.env.VITE_LEGACY_FUTURES_CANCEL || '/api/contractApplyOrder!cancel.action',

  contractAssets: import.meta.env.VITE_LEGACY_FUTURES_CONTRACT_ASSETS || '/api/contractOrder!assets.action',
  /** PC 端持仓 / 合约订单列表 */
  pcOrderList: import.meta.env.VITE_LEGACY_FUTURES_PC_LIST || '/api/contractOrder!pc/list.action',
  /** 委托/条件单列表 */
  applyOrderList: import.meta.env.VITE_LEGACY_FUTURES_APPLY_LIST || '/api/contractApplyOrder!list.action',
  /** 交割/永续委托历史（文档 TFuturesOrderDTO） */
  futuresOrderList: import.meta.env.VITE_LEGACY_FUTURES_ORDER_LIST || '/api/futuresOrder!list.action',

  contractApplyMeta:
    import.meta.env.VITE_LEGACY_FUTURES_CONTRACT_META || '/api/hobi!getContractApply.action',
} as const

/** 路由 BTCUSDT / BTC_USDT → 旧站小写+下划线 */
export function toLegacyFuturesSymbol(routeSymbol: string): string {
  const t = routeSymbol.trim().toUpperCase().replace(/-/g, '_')
  if (t.includes('_')) return t.toLowerCase()
  const suf = ['USDT', 'USDC', 'BUSD', 'BTC', 'ETH']
  for (const s of suf) {
    if (t.endsWith(s) && t.length > s.length) {
      return `${t.slice(0, -s.length)}_${s.toLowerCase()}`
    }
  }
  return t.toLowerCase()
}

/** BTCUSDT → BTC_USDT */
export function normalizeFuturesRouteSymbol(s: string): string {
  const t = s.trim()
  if (!t) return 'BTC_USDT'
  if (t.includes('_')) return t.toUpperCase()
  const u = t.toUpperCase()
  const m = u.match(/^([A-Z0-9]+)(USDT|USDC|BUSD)$/)
  if (m) return `${m[1]}_${m[2]}`
  return u
}

/** btc_usdt → BTCUSDT（与 futures store 展示一致） */
export function legacyFuturesToUiSymbol(legacySym: string): string {
  const p = legacySym.trim().toLowerCase().split('_').filter(Boolean)
  if (p.length >= 2) {
    return `${p[0].toUpperCase()}${p[1].toUpperCase()}`
  }
  return legacySym.trim().toUpperCase()
}
