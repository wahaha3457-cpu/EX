import { legacyGet, legacyPostQuery, legacyTryGet } from '@/api/auth/legacy/legacyHttp'
import { LEGACY_FUTURES_PATHS, normalizeFuturesRouteSymbol, toLegacyFuturesSymbol } from '@/api/contract/legacy/legacyFuturesPaths'
import { extractSessionToken } from '@/api/trade/legacy/mapLegacySpot'
import type { FuturesPlaceOrderRequest } from '@/types/futuresTrade'

let sessionCache: { key: string; token: string; at: number } | null = null
const SESSION_TTL_MS = 120_000

function sessionKey(legacySym: string, lev: number): string {
  return `${legacySym}:${lev}`
}

async function getFuturesSessionToken(legacySym: string, leverRate: number): Promise<string> {
  const key = sessionKey(legacySym, leverRate)
  const now = Date.now()
  if (sessionCache && sessionCache.key === key && now - sessionCache.at < SESSION_TTL_MS) {
    return sessionCache.token
  }
  const data = await legacyTryGet<unknown>(LEGACY_FUTURES_PATHS.openview, {
    symbol: legacySym,
    leverRate: leverRate,
  })
  const token = extractSessionToken(data)
  if (!token) {
    throw new Error('无法获取合约 session_token，请确认已登录且 openview 可用')
  }
  sessionCache = { key, token, at: now }
  return token
}

/**
 * 开仓：GET `/api/contractApplyOrder!open.action`
 * 平仓：GET `/api/contractApplyOrder!close.action`（无 session_token）
 */
export async function legacyPlaceFuturesOrder(req: FuturesPlaceOrderRequest): Promise<void> {
  const routeSym = normalizeFuturesRouteSymbol(req.symbol)
  const legacySym = toLegacyFuturesSymbol(routeSym)

  if (req.reduceOnly) {
    const price_type = req.type === 'LIMIT' ? 'limit' : 'opponent'
    const price = req.type === 'LIMIT' ? Number(req.price ?? 0) : Number(req.price ?? 0)
    await legacyGet<unknown>(LEGACY_FUTURES_PATHS.close, {
      symbol: legacySym,
      amount: req.quantity,
      price_type,
      price: price > 0 ? price : 0,
      direction: req.side === 'BUY' ? 'buy' : 'sell',
    })
    return
  }

  const session_token = await getFuturesSessionToken(legacySym, req.leverage)
  const direction = req.side === 'BUY' ? 'buy' : 'sell'
  const price_type = req.type === 'LIMIT' ? 'limit' : 'opponent'
  const params: Record<string, string | number> = {
    symbol: legacySym,
    session_token,
    direction,
    price_type,
    amount: req.quantity,
    lever_rate: req.leverage,
  }
  if (req.type === 'LIMIT' && req.price != null) {
    params.price = req.price
  }
  await legacyGet<unknown>(LEGACY_FUTURES_PATHS.open, params)
}

/** POST Query `/api/contractApplyOrder!cancel.action` */
export async function legacyCancelFuturesOrder(orderNo: string): Promise<void> {
  await legacyPostQuery<unknown>(LEGACY_FUTURES_PATHS.cancel, { order_no: orderNo })
}
