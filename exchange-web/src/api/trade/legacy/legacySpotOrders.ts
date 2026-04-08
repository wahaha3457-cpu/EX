import { legacyGet, legacyPost, legacyTryGet } from '@/api/auth/legacy/legacyHttp'
import type { SpotPlaceOrderRequest } from '@/types/spotTrade'
import { LEGACY_SPOT_PATHS, toLegacySpotSymbol } from '@/api/trade/legacy/legacySpotContract'
import { extractSessionToken } from '@/api/trade/legacy/mapLegacySpot'

let sessionCache: { symbol: string; token: string; at: number } | null = null
const SESSION_TTL_MS = 120_000

async function getSessionTokenForSymbol(routeSymbol: string): Promise<string> {
  const sym = toLegacySpotSymbol(routeSymbol)
  const now = Date.now()
  if (sessionCache && sessionCache.symbol === sym && now - sessionCache.at < SESSION_TTL_MS) {
    return sessionCache.token
  }
  const data = await legacyTryGet<unknown>(LEGACY_SPOT_PATHS.openview, {
    symbol: sym,
    type: import.meta.env.VITE_LEGACY_SPOT_MARKET_TYPE || 'cryptos',
  })
  const token = extractSessionToken(data)
  if (!token) {
    throw new Error('无法获取下单 session_token，请确认已登录且 openview 接口可用')
  }
  sessionCache = { symbol: sym, token, at: now }
  return token
}

function orderPriceType(req: SpotPlaceOrderRequest): string {
  if (req.type === 'MARKET') return 'market'
  return 'limit'
}

/**
 * 现货下单：GET `/api/exchangeapplyorder!open.action`（Query，与 Swagger 一致）
 */
export async function legacyPlaceSpotOrder(req: SpotPlaceOrderRequest): Promise<void> {
  const sym = toLegacySpotSymbol(req.symbol)
  const session_token = await getSessionTokenForSymbol(req.symbol)
  const order_price_type = orderPriceType(req)

  const params: Record<string, string | number> = {
    symbol: sym,
    session_token,
    order_price_type,
    /** 文档 ExchangeApplyOrderListModel：open 买入 / close 卖出 */
    offset: req.side === 'BUY' ? 'open' : 'close',
  }

  if (req.type === 'LIMIT') {
    params.price = String(req.price ?? '')
    params.volume = String(req.quantity ?? '')
  } else if (req.type === 'MARKET') {
    if (req.side === 'BUY' && req.quoteQty != null) {
      params.total = String(req.quoteQty)
      params.volume = ''
      params.price = ''
    } else {
      params.volume = String(req.quantity ?? '')
      params.price = ''
    }
  }

  await legacyGet<unknown>(LEGACY_SPOT_PATHS.open, params)
}

/**
 * 撤单：POST JSON，常见字段 orderNo
 */
export async function legacyCancelSpotOrder(orderNo: string): Promise<void> {
  await legacyPost<unknown>(LEGACY_SPOT_PATHS.cancel, { orderNo })
}
