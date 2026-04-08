/**
 * 外汇平台 Swagger：`/api/publicRealtimeTop`、`/api/publicNewRealtimeByType`、`/api/hobi!getKline.action`
 * OpenAPI：`/api/v2/api-docs?group=外汇管理平台`
 */
import type { ChartInterval, ChartSurface } from '@/types/chartKline'

/** 行情列表 GET 路径（返回 Result«List«QueryRealtimeDTO»»） */
export const LEGACY_TICKER_PATH =
  import.meta.env.VITE_LEGACY_TICKER_PATH || '/api/publicRealtimeTop'

/**
 * 若改用 `publicNewRealtimeByType`，需同时传 type + subType（均为必填，见文档）。
 * 在 .env 中设置 VITE_LEGACY_TICKER_PATH=/api/publicNewRealtimeByType 并配置 SUBTYPE。
 */
export function buildLegacyTickerQueryParams(): Record<string, string | number> {
  const path = LEGACY_TICKER_PATH
  const q: Record<string, string | number> = {}
  if (path.includes('publicNewRealtimeByType')) {
    q.type = import.meta.env.VITE_LEGACY_TICKER_TYPE || 'cryptos'
    q.subType = import.meta.env.VITE_LEGACY_TICKER_SUBTYPE || 'usdt'
  } else {
    const t = import.meta.env.VITE_LEGACY_TICKER_TYPE
    if (t) q.type = t
    const c = import.meta.env.VITE_LEGACY_TICKER_CATEGORY
    if (c) q.category = c
  }
  const pageNo = import.meta.env.VITE_LEGACY_TICKER_PAGE_NO
  if (pageNo) q.pageNo = Number(pageNo)
  const pageSize = import.meta.env.VITE_LEGACY_TICKER_PAGE_SIZE
  if (pageSize) q.pageSize = Number(pageSize)
  return q
}

/** K 线 GET：`/api/hobi!getKline.action` */
export const LEGACY_KLINE_PATH =
  import.meta.env.VITE_LEGACY_KLINE_PATH || '/api/hobi!getKline.action'

/** 前端 interval → 文档 line 参数（与常见 Huobi 风格一致；若不对可在 env 覆盖整条 path 或改此处映射） */
export const LEGACY_KLINE_LINE: Record<ChartInterval, string> = {
  '1m': '1min',
  '5m': '5min',
  '15m': '15min',
  '1h': '60min',
  '4h': '4hour',
  '1d': '1day',
}

export function toLegacyKlineSymbol(surface: ChartSurface, routeSymbol: string): string {
  const s = routeSymbol.trim()
  if (!s) return s
  if (surface === 'spot') {
    return s.replace(/_/g, '_').toLowerCase()
  }
  return s.replace(/_/g, '').toLowerCase()
}
