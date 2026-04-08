/** 是否启用前端 Mock（与真实 /api 互斥，开发联调时可关） */
export function isMockMode(): boolean {
  return import.meta.env.VITE_USE_MOCK === 'true'
}

/**
 * 找回密码：API 不可用时的本地模拟（写入 authMockService 内存验证码与用户表）。
 * - 开发模式 `import.meta.env.DEV` 默认开启
 * - 或显式 `VITE_DEMO_PASSWORD_RESET=true`
 */
export function allowDemoPasswordResetFallback(): boolean {
  if (import.meta.env.VITE_DEMO_PASSWORD_RESET === 'true') return true
  return import.meta.env.DEV
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

/**
 * 是否走 exchange-server 现货 REST（JWT + `/api/v1/spot/*`）。
 * 默认与 `VITE_MARKET_TICKERS_SOURCE=server` 一致；若行情仍用 binance 但现货要走主干，可设 `VITE_SPOT_TRADING_API=exchange`。
 */
export function isExchangeSpotApiEnabled(): boolean {
  if (isMockMode()) return false
  if (isLegacyAuthMode()) return false
  const v = (import.meta.env.VITE_SPOT_TRADING_API as string | undefined)?.trim().toLowerCase()
  if (v === 'exchange' || v === 'server') return true
  return marketTickerSource() === 'server'
}
