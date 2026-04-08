/** 是否启用前端 Mock（与真实 /api 互斥，开发联调时可关） */
export function isMockMode(): boolean {
  return import.meta.env.VITE_USE_MOCK === 'true'
}

/**
 * 是否走「原项目 / 测试环境」认证接口（见 src/api/auth/legacy）。
 * 与 isMockMode 互斥：Mock 为 true 时不应再开 legacy。
 */
export function isLegacyAuthMode(): boolean {
  return import.meta.env.VITE_AUTH_PROVIDER === 'legacy'
}

/** 旧版认证 API 根路径：开发环境默认走 Vite 代理 `/legacy-api`，避免浏览器 CORS */
export function legacyAuthApiBase(): string {
  return import.meta.env.VITE_LEGACY_API_BASE || '/legacy-api'
}

/** 全站行情列表来源：`binance`（默认）| `legacy` | `server` */
export type MarketTickerSource = 'binance' | 'legacy' | 'server'

export function marketTickerSource(): MarketTickerSource {
  const v = (import.meta.env.VITE_MARKET_TICKERS_SOURCE as string | undefined)?.toLowerCase()
  if (v === 'legacy') return 'legacy'
  if (v === 'server') return 'server'
  return 'binance'
}

/** 是否与币安 markets 同源（用于优先走币安 K 线等） */
export function isBinanceMarketTickerSource(): boolean {
  if (isMockMode()) return false
  return marketTickerSource() === 'binance'
}
