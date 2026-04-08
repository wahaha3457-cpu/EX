import {
  mockFuturesDepth,
  mockFuturesFills,
  mockFuturesTrades,
  mockFundingLedger,
  mockFuturesWalletAvailable,
  mockInstrument,
  mockPositions,
} from '@/api/mock/futuresTradeMock'
import { apiGet } from '@/api/common/http'
import { isMockAdminSession } from '@/mocks/authMockService'
import { getAccessToken } from '@/utils/tokenStorage'
import type { DeliveryInstrumentMeta, DeliveryTickerSnapshot, DeliveryTradeBootstrap } from '@/types/deliveryTrade'
import { compactUnderlying, normalizeDeliverySymbol } from '@/api/delivery/deliverySymbols'
import {
  computeRollingDemoDeliveryAt,
  deliveryDemoCycleLabel,
  orderableSlotDeliveryEndMs,
} from '@/composables/delivery/deliveryCycleUtils'
import { isMockMode, marketTickerSource } from '@/config/env'
import { fetchSpotAssetAvailable } from '@/api/trade/fetchSpotAssetAvailable'

function midForCompact(compact: string): number {
  if (compact.startsWith('ETH')) return 3508
  if (compact.startsWith('SOL')) return 178
  if (compact.startsWith('WIF')) return 2.85
  if (compact.startsWith('PEPE')) return 0.00001234
  return 68380
}

function mockDeliveryInstrument(symbol: string): DeliveryInstrumentMeta {
  const compact = compactUnderlying(symbol)
  const base = mockInstrument(compact)
  const now = Date.now()
  return {
    ...base,
    symbol,
    maxLeverage: Math.min(base.maxLeverage, 75),
    cycleLabel: deliveryDemoCycleLabel(symbol),
    deliveryAt: computeRollingDemoDeliveryAt(symbol, now),
  }
}

function mockDeliveryTicker(symbol: string): DeliveryTickerSnapshot {
  const compact = compactUnderlying(symbol)
  const mid = midForCompact(compact)
  const mark = mid * (1 + (Math.random() * 0.0012 - 0.0004))
  const idx = mid * (1 + (Math.random() * 0.0003 - 0.00015))
  const basisPct = idx > 0 ? ((mark - idx) / idx) * 100 : 0
  const deliveryTime = computeRollingDemoDeliveryAt(symbol, Date.now())

  return {
    markPrice: mark,
    indexPrice: idx,
    lastPrice: mid * (1 + (Math.random() * 0.001 - 0.0005)),
    changePct24h: Number((Math.random() * 5 - 2).toFixed(2)),
    high24h: mid * 1.015,
    low24h: mid * 0.985,
    volume24hBase: 4.2e5 + Math.random() * 9e4,
    quoteVolume24h: mid * 3.2e6,
    basisPct: Number(basisPct.toFixed(4)),
    deliveryTime,
    settlementFundingRate: Number((Math.random() * 0.00002 - 0.00001).toFixed(8)),
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

export async function fetchDeliveryTradeBootstrap(rawSymbol?: string): Promise<DeliveryTradeBootstrap> {
  const symbol = normalizeDeliverySymbol(rawSymbol)
  const compact = compactUnderlying(symbol)
  if (isMockMode() || marketTickerSource() !== 'server') {
    await delay(140)
    const inst = mockDeliveryInstrument(symbol)
    const tick = mockDeliveryTicker(symbol)
    const dep = mockFuturesDepth(compact, 1)
    const rich = isMockAdminSession(getAccessToken())
    const nowMs = Date.now()
    return {
      instrument: inst,
      ticker: tick,
      depth: dep,
      trades: mockFuturesTrades(compact).map((t, i) => ({
        ...t,
        id: `${symbol}-t-${i}`,
      })),
      positions: mockPositions(symbol).map((p) => ({
        ...p,
        /** 与下单区默认第 1 档（orderableSlotOffset=0）本期结束时刻一致 */
        deliverySettlesAtMs: Math.max(orderableSlotDeliveryEndMs(nowMs, 0), nowMs + 2_000),
      })),
      openOrders: [],
      historyOrders: [],
      fills: mockFuturesFills(symbol),
      fundingLedger: mockFundingLedger(symbol).map((r, i) =>
        i === 0
          ? {
              ...r,
              type: 'FUNDING' as const,
              remark: '交割合约演示 · 资金费项在交割中通常弱化，流水占位',
            }
          : r,
      ),
      wallet: (() => {
        const availableQuote = mockFuturesWalletAvailable(compact, rich)
        return { availableQuote, asset: 'USDT', marginBalance: availableQuote }
      })(),
    }
  }

  // 交割合约真实行情：当前后端先复用“同标的永续”作为真实数据源（盘口/成交/K 线同步）。
  const unified = compact.replace(/[^A-Za-z0-9]/g, '').toUpperCase() || 'BTCUSDT'
  const [t, d, trades, c] = await Promise.all([
    apiGet<any>('/market/summary', { params: { symbol: unified, type: 'contract' } }),
    apiGet<any>('/market/depth', { params: { symbol: unified, type: 'contract', limit: 20 } }),
    apiGet<any[]>('/market/trades', { params: { symbol: unified, type: 'contract', limit: 60 } }),
    apiGet<any>('/contract/summary', { params: { symbol: unified } }),
  ])

  const now = Date.now()
  const deliveryTime = computeRollingDemoDeliveryAt(symbol, now)
  const inst: DeliveryInstrumentMeta = {
    ...mockInstrument(unified),
    symbol,
    maxLeverage: Math.min(mockInstrument(unified).maxLeverage, 75),
    cycleLabel: deliveryDemoCycleLabel(symbol),
    deliveryAt: deliveryTime,
  }

  const mark = Number(c?.markPrice ?? 0)
  const idx = Number(c?.indexPrice ?? 0)
  const basisPct = idx > 0 ? ((mark - idx) / idx) * 100 : 0

  const tick: DeliveryTickerSnapshot = {
    markPrice: mark,
    indexPrice: idx,
    lastPrice: Number(t?.latestPrice ?? 0),
    changePct24h: Number(t?.priceChangePercent24h ?? 0),
    high24h: Number(t?.high24h ?? 0),
    low24h: Number(t?.low24h ?? 0),
    volume24hBase: Number(t?.volume24h ?? 0),
    quoteVolume24h: Number(t?.turnover24h ?? 0),
    basisPct,
    deliveryTime,
    settlementFundingRate: Number(c?.fundingRate ?? 0),
  }

  const dep = {
    seq: Number(d?.timestamp ?? Date.now()),
    bids: (d?.bids ?? []).map((x: any) => ({ price: Number(x.price ?? 0), quantity: Number(x.amount ?? 0) })),
    asks: (d?.asks ?? []).map((x: any) => ({ price: Number(x.price ?? 0), quantity: Number(x.amount ?? 0) })),
  }

  const trds = (trades ?? []).map((x: any, i: number) => ({
    id: String(x.tradeId ?? `${x.time ?? Date.now()}-${i}`),
    price: Number(x.price ?? 0),
    quantity: Number(x.qty ?? 0),
    side: x.side === 'SELL' ? ('SELL' as const) : ('BUY' as const),
    time: String(x.time ?? Date.now()),
  }))

  const quote = inst.quoteAsset || 'USDT'
  const walletAvail = await fetchSpotAssetAvailable(quote)

  return {
    instrument: inst,
    ticker: tick,
    depth: dep,
    trades: trds,
    positions: [],
    openOrders: [],
    historyOrders: [],
    fills: [],
    fundingLedger: mockFundingLedger(symbol).map((r, i) =>
      i === 0
        ? {
            ...r,
            remark: '交割演示 · 账户推送前占位流水（资金费与结算规则以实际为准）',
          }
        : r,
    ),
    wallet: { availableQuote: walletAvail, asset: quote, marginBalance: walletAvail },
  }
}
