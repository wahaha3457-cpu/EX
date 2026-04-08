/**
 * 交割合约页：未配置公网 WS 时使用本地 mock 推送（与永续逻辑一致，store 分离）。
 */
import { isPublicWsConfigured } from '@/websocket/config/wsEnv'
import type { FuturesDepthSnapshot, FuturesRecentTrade } from '@/types/futuresTrade'
import type { DeliveryTickerSnapshot } from '@/types/deliveryTrade'
import { useDeliveryTradeStore } from '@/stores/deliveryTrade'

let mockTimers: number[] = []
let realtimeStop: (() => void) | null = null

export function startDeliveryTradeMockStreams(symbol: string) {
  void symbol
  stopDeliveryTradeMockStreams()
  const store = useDeliveryTradeStore()

  const t1 = window.setInterval(() => {
    const d = store.depth
    if (!d) return
    const jitter = (Math.random() - 0.5) * 0.00008
    const next: FuturesDepthSnapshot = {
      seq: d.seq + 1,
      asks: d.asks.map((x) => ({
        ...x,
        price: x.price * (1 + jitter),
        quantity: Math.max(0.5, x.quantity + (Math.random() - 0.5) * 6),
      })),
      bids: d.bids.map((x) => ({
        ...x,
        price: x.price * (1 - jitter),
        quantity: Math.max(0.5, x.quantity + (Math.random() - 0.5) * 8),
      })),
    }
    store.applyDepth(next)
  }, 3200)

  const t2 = window.setInterval(() => {
    if (!store.ticker) return
    const mark = store.ticker.markPrice * (1 + (Math.random() * 0.00015 - 0.000075))
    const idx = store.ticker.indexPrice * (1 + (Math.random() * 0.00008 - 0.00004))
    const basisPct = idx > 0 ? ((mark - idx) / idx) * 100 : 0
    const snap: DeliveryTickerSnapshot = {
      ...store.ticker,
      markPrice: mark,
      indexPrice: idx,
      lastPrice: mark * (1 + (Math.random() * 0.00005 - 0.000025)),
      basisPct: Number(basisPct.toFixed(4)),
      settlementFundingRate: store.ticker.settlementFundingRate,
    }
    store.applyTicker(snap)
  }, 5500)

  const t3 = window.setInterval(() => {
    const tr: FuturesRecentTrade = {
      id: `dws-${Date.now()}`,
      price: store.ticker?.markPrice ?? 1,
      quantity: Math.random() * 3 + 0.02,
      side: Math.random() > 0.5 ? 'BUY' : 'SELL',
      time: new Date().toISOString(),
    }
    store.pushTrade(tr)
  }, 4200)

  mockTimers.push(t1, t2, t3)
}

export function stopDeliveryTradeMockStreams() {
  mockTimers.forEach(clearInterval)
  mockTimers = []
}

export function startDeliveryTradeStreams(symbol: string) {
  stopDeliveryTradeStreams()
  if (!isPublicWsConfigured()) {
    startDeliveryTradeMockStreams(symbol)
    return
  }
  startDeliveryTradeMockStreams(symbol)
}

export function stopDeliveryTradeStreams() {
  stopDeliveryTradeMockStreams()
  if (realtimeStop) {
    realtimeStop()
    realtimeStop = null
  }
}
