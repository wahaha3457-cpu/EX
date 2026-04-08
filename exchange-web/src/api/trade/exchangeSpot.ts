/**
 * 主干交易所（Spring Security + JWT）现货接口：与 exchange-server
 * `SpotOrderController` / `SpotWalletController` 对齐。
 */
import { apiDelete, apiGet, apiPost } from '@/api/common/http'
import type { AssetsBalanceRowRaw } from '@/api/asset/asset.types'
import type { PageResult } from '@/types/api'
import type { SpotPlaceOrderRequest } from '@/types/spotTrade'
import type {
  SpotBalancesBlockRaw,
  SpotFillRowRaw,
  SpotOrderRowRaw,
  SpotTradeBootstrapRaw,
} from '@/api/trade/trade.types'
import { getAccessToken } from '@/utils/tokenStorage'

export interface SpotBalanceRowDto {
  asset: string
  available: number | string
  frozen?: number | string
}

/** 与后端 SpotOrderVo JSON 对齐 */
export interface ExchangeSpotOrderVo {
  id: number
  pairCode: string
  clientOrderId?: string | null
  side: string
  orderType: string
  price?: number | string | null
  quantity?: number | string | null
  quoteQty?: number | string | null
  filledQty?: number | string | null
  avgFillPrice?: number | string | null
  status: string
  timeInForce?: string | null
  rejectReason?: string | null
  createdAt?: string | string[] | null
  updatedAt?: string | string[] | null
}

export interface ExchangeSpotFillVo {
  id: number
  orderId: number
  pairCode: string
  side: string
  orderType?: string | null
  price: number | string
  quantity: number | string
  quoteAmount?: number | string
  fee: number | string
  feeAsset: string
  maker: boolean
  createdAt?: string | string[] | null
}

function strNum(v: number | string | null | undefined): string {
  if (v == null) return '0'
  return typeof v === 'number' ? String(v) : String(v)
}

function numFromCell(v: number | string | undefined): number {
  if (v == null) return 0
  const n = typeof v === 'number' ? v : parseFloat(String(v))
  return Number.isFinite(n) ? n : 0
}

type UnifiedTickerDto = {
  baseCoin?: string | null
  quoteCoin?: string | null
  latestPrice?: number | null
}

/**
 * 资产中心「现货账户」列表：与交易面板同源（`GET /v1/spot/wallet/balances` + 现货 ticker 估值）。
 */
export async function fetchExchangeSpotAssetsSpotRows(): Promise<AssetsBalanceRowRaw[]> {
  let balRows: SpotBalanceRowDto[] = []
  try {
    balRows = await apiGet<SpotBalanceRowDto[]>('/v1/spot/wallet/balances')
  } catch {
    balRows = []
  }

  let tickers: UnifiedTickerDto[] = []
  try {
    tickers = await apiGet<UnifiedTickerDto[]>('/market/tickers', { params: { type: 'spot' } })
  } catch {
    tickers = []
  }

  const priceMap = new Map<string, number>()
  priceMap.set('USDT', 1)
  priceMap.set('USDC', 1)
  for (const t of tickers ?? []) {
    const b = (t.baseCoin ?? '').toUpperCase()
    const q = (t.quoteCoin ?? '').toUpperCase()
    if (b && q === 'USDT' && t.latestPrice != null) {
      const px = Number(t.latestPrice)
      if (Number.isFinite(px) && px > 0) priceMap.set(b, px)
    }
  }

  return (balRows ?? []).map((r) => {
    const asset = (r.asset ?? '').toUpperCase()
    const av = numFromCell(r.available)
    const fr = numFromCell(r.frozen)
    const total = av + fr
    const px = priceMap.get(asset) ?? 0
    const val = asset === 'USDT' || asset === 'USDC' ? total : total * px
    return {
      coin: asset,
      total: String(total),
      available: String(av),
      frozen: String(fr),
      margin: null,
      usdt_value: String(Math.round(val * 100) / 100),
    }
  })
}

/** Spring 偶发将 LocalDateTime 序列化为数组，统一成 ISO 字符串 */
function toIsoTime(v: string | string[] | null | undefined): string {
  if (v == null) return ''
  if (typeof v === 'string') return v
  if (Array.isArray(v) && v.length >= 3) {
    const [y, mo, d, h = 0, mi = 0, s = 0] = v
    const dt = new Date(y, mo - 1, d, h, mi, s)
    return Number.isNaN(dt.getTime()) ? '' : dt.toISOString()
  }
  return ''
}

/**
 * 将 open/history 接口返回的 side 统一成 raw 层的 `buy` | `sell`。
 * 禁止使用 `|| 'BUY'`：side 缺省、空串、0 等假值会被误判为买入，导致卖单在列表中显示为买入。
 */
function coerceExchangeSpotOrderSide(side: unknown): string {
  if (side === null || side === undefined) return ''
  if (typeof side === 'number') {
    if (side === 1) return 'buy'
    if (side === 2) return 'sell'
    return ''
  }
  const str = String(side).trim()
  if (!str) return ''
  const low = str.toLowerCase()
  if (low === 'sell' || low === 'ask' || str === '2') return 'sell'
  if (low === 'buy' || low === 'bid' || str === '1') return 'buy'
  const up = str.toUpperCase()
  if (up === 'SELL' || up === 'ASK') return 'sell'
  if (up === 'BUY' || up === 'BID') return 'buy'
  return low
}

function mapOrderVoToRaw(o: ExchangeSpotOrderVo, fallbackSymbol: string): SpotOrderRowRaw {
  const qty =
    o.quantity != null && strNum(o.quantity) !== '0'
      ? strNum(o.quantity)
      : o.quoteQty != null
        ? strNum(o.quoteQty)
        : '0'
  const sideRaw =
    coerceExchangeSpotOrderSide(o.side) ||
    coerceExchangeSpotOrderSide((o as { orderSide?: unknown }).orderSide)
  return {
    order_id: String(o.id),
    symbol: o.pairCode || fallbackSymbol,
    /** 缺省传空串，由 {@link adaptSpotTradeBootstrap} 的 sideFromRaw 解析（勿默认 buy） */
    side: sideRaw,
    type: (o.orderType || 'LIMIT').toLowerCase(),
    price: strNum(o.price),
    volume: qty,
    deal_volume: strNum(o.filledQty),
    status: o.status,
    created_at: toIsoTime(o.createdAt) || new Date().toISOString(),
    updated_at: toIsoTime(o.updatedAt) || undefined,
    avg_price: o.avgFillPrice != null ? strNum(o.avgFillPrice) : undefined,
  }
}

function mapFillVoToRaw(f: ExchangeSpotFillVo): SpotFillRowRaw {
  return {
    trade_id: String(f.id),
    order_id: String(f.orderId),
    price: strNum(f.price),
    qty: strNum(f.quantity),
    fee: strNum(f.fee),
    fee_coin: f.feeAsset,
    time: toIsoTime(f.createdAt) || new Date().toISOString(),
    is_maker: f.maker ? '1' : '0',
    symbol: f.pairCode != null && String(f.pairCode).trim() ? String(f.pairCode).trim() : undefined,
    side: f.side != null && String(f.side).trim() ? String(f.side).trim() : undefined,
    quote_amount:
      f.quoteAmount != null && String(f.quoteAmount).trim() !== ''
        ? strNum(f.quoteAmount)
        : undefined,
    order_type:
      f.orderType != null && String(f.orderType).trim() ? String(f.orderType).trim().toUpperCase() : undefined,
  }
}

function balancesFromRows(
  rows: SpotBalanceRowDto[],
  base: string,
  quote: string,
): SpotBalancesBlockRaw {
  const find = (a: string) => rows.find((r) => r.asset?.toUpperCase() === a.toUpperCase())
  const b = find(base)
  const q = find(quote)
  return {
    base,
    quote,
    base_avail: b ? strNum(b.available) : '0',
    quote_avail: q ? strNum(q.available) : '0',
  }
}

async function safePageOrders(
  url: string,
  params: Record<string, string | number>,
): Promise<PageResult<ExchangeSpotOrderVo>> {
  try {
    return await apiGet<PageResult<ExchangeSpotOrderVo>>(url, { params })
  } catch {
    return { list: [], page: 1, pageSize: 20, total: 0, hasMore: false }
  }
}

async function safePageFills(
  url: string,
  params: Record<string, string | number>,
): Promise<PageResult<ExchangeSpotFillVo>> {
  try {
    return await apiGet<PageResult<ExchangeSpotFillVo>>(url, { params })
  } catch {
    return { list: [], page: 1, pageSize: 20, total: 0, hasMore: false }
  }
}

/**
 * 拉取当前用户在该交易对下的余额、委托、历史、成交（需登录）。
 * 余额单独优先拉取；订单/成交接口任一失败不影响可用余额展示（避免 Promise.all 一处失败整页余额变 0）。
 */
export async function fetchExchangeSpotPrivateSnapshot(
  pairCode: string,
  baseCoin: string,
  quoteCoin: string,
): Promise<Pick<SpotTradeBootstrapRaw, 'balances' | 'open_orders' | 'history_orders' | 'fills'>> {
  let balRows: SpotBalanceRowDto[] = []
  try {
    balRows = await apiGet<SpotBalanceRowDto[]>('/v1/spot/wallet/balances')
  } catch {
    balRows = []
  }

  const q = { pairCode, page: 1, pageSize: 50 } as const
  const [openPage, histPage, fillPage] = await Promise.all([
    safePageOrders('/v1/spot/orders/open', q),
    safePageOrders('/v1/spot/orders/history', q),
    safePageFills('/v1/spot/orders/fills', q),
  ])

  const listOpen = openPage?.list ?? []
  const listHist = histPage?.list ?? []
  const listFill = fillPage?.list ?? []

  return {
    balances: balancesFromRows(balRows ?? [], baseCoin, quoteCoin),
    open_orders: listOpen.map((o) => mapOrderVoToRaw(o, pairCode)),
    history_orders: listHist.map((o) => mapOrderVoToRaw(o, pairCode)),
    fills: listFill.map(mapFillVoToRaw),
  }
}

/**
 * 在已拼好的公开行情 bootstrap 上合并用户私有数据；未登录则保持空委托与零余额。
 */
export async function enrichServerSpotBootstrapWithAuth(
  pairCodeRoute: string,
  draft: SpotTradeBootstrapRaw,
): Promise<SpotTradeBootstrapRaw> {
  const parts = pairCodeRoute.trim().toUpperCase().split('_').filter(Boolean)
  const base = parts[0] || 'BTC'
  const quote = parts[1] || 'USDT'
  const pair = `${base}_${quote}`

  if (!getAccessToken()) {
    return {
      ...draft,
      symbol: pair,
      open_orders: [],
      history_orders: [],
      fills: [],
      balances: {
        base,
        quote,
        base_avail: '0',
        quote_avail: '0',
      },
    }
  }

  try {
    const priv = await fetchExchangeSpotPrivateSnapshot(pair, base, quote)
    return {
      ...draft,
      symbol: pair,
      ...priv,
    }
  } catch {
    try {
      const balRows = await apiGet<SpotBalanceRowDto[]>('/v1/spot/wallet/balances')
      return {
        ...draft,
        symbol: pair,
        open_orders: [],
        history_orders: [],
        fills: [],
        balances: balancesFromRows(balRows ?? [], base, quote),
      }
    } catch {
      return {
        ...draft,
        symbol: pair,
        open_orders: [],
        history_orders: [],
        fills: [],
        balances: {
          base,
          quote,
          base_avail: '0',
          quote_avail: '0',
        },
      }
    }
  }
}

/** 与 symbol_pair.pair_code 对齐：大写 + 下划线 */
function normalizeSpotPairCodeForApi(symbol: string): string {
  return symbol
    .trim()
    .replace(/\//g, '_')
    .replace(/[^A-Za-z0-9_]/g, '')
    .toUpperCase()
}

export async function placeExchangeSpotOrder(req: SpotPlaceOrderRequest): Promise<void> {
  const side: 'BUY' | 'SELL' = req.side === 'SELL' ? 'SELL' : 'BUY'
  const body: Record<string, unknown> = {
    pairCode: normalizeSpotPairCodeForApi(req.symbol),
    side,
    orderType: req.type,
    clientOrderId:
      req.clientOrderId ?? `web-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
  }
  if (req.type === 'LIMIT') {
    body.price = req.price
    body.quantity = req.quantity
  } else if (req.type === 'MARKET') {
    if (side === 'BUY') {
      body.quoteQty = req.quoteQty
    } else {
      body.quantity = req.quantity
    }
  }
  await apiPost<unknown>('/v1/spot/orders', body)
}

export async function cancelExchangeSpotOrder(orderId: string): Promise<void> {
  await apiDelete<unknown>(`/v1/spot/orders/${orderId}`)
}

export async function cancelAllExchangeSpotOrders(pairCode: string): Promise<void> {
  const page = await apiGet<PageResult<ExchangeSpotOrderVo>>('/v1/spot/orders/open', {
    params: { pairCode, page: 1, pageSize: 100 },
  })
  const list = page?.list ?? []
  await Promise.all(list.map((o) => apiDelete<unknown>(`/v1/spot/orders/${o.id}`)))
}
