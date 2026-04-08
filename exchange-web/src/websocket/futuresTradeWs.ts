/**
 * 合约交易页数据流：未配置 `VITE_WS_PUBLIC_URL` 时使用本地定时 mock；配置后走真实订阅。
 */
import { isPublicWsConfigured } from '@/websocket/config/wsEnv'
import { startFuturesTradeRealtime } from '@/websocket/streams/futuresTradeRealtime'
import type { FuturesDepthSnapshot, FuturesRecentTrade, FuturesTickerSnapshot } from '@/types/futuresTrade'
import { useFuturesTradeStore } from '@/stores/futuresTrade'

let mockTimers: number[] = []
let realtimeStop: (() => void) | null = null

export function startFuturesTradeMockStreams(symbol: string) {
  void symbol
  stopFuturesTradeMockStreams()
  const store = useFuturesTradeStore()

  const t1 = window.setInterval(() => {
    const d = store.depth
    if (!d || (d.asks.length === 0 && d.bids.length === 0)) return
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
    if (!store.ticker || !Number.isFinite(store.ticker.markPrice) || store.ticker.markPrice <= 0) return
    const mark = store.ticker.markPrice * (1 + (Math.random() * 0.00015 - 0.000075))
    const idx = store.ticker.indexPrice * (1 + (Math.random() * 0.00008 - 0.00004))
    const snap: FuturesTickerSnapshot = {
      ...store.ticker,
      markPrice: mark,
      indexPrice: idx,
      lastPrice: mark * (1 + (Math.random() * 0.00005 - 0.000025)),
    }
    store.applyTicker(snap)
  }, 5500)

  const t3 = window.setInterval(() => {
    const base =
      store.ticker && store.ticker.markPrice > 0
        ? store.ticker.markPrice
        : store.ticker && store.ticker.lastPrice > 0
          ? store.ticker.lastPrice
          : 0
    if (base <= 0) return
    const tr: FuturesRecentTrade = {
      id: `fws-${Date.now()}`,
      price: base,
      quantity: Math.random() * 3 + 0.02,
      side: Math.random() > 0.5 ? 'BUY' : 'SELL',
      time: new Date().toISOString(),
    }
    store.pushTrade(tr)
  }, 4200)

  mockTimers.push(t1, t2, t3)
}

export function stopFuturesTradeMockStreams() {
  mockTimers.forEach(clearInterval)
  mockTimers = []
}

export function startFuturesTradeStreams(symbol: string) {
  stopFuturesTradeStreams()
  if (!isPublicWsConfigured()) {
    startFuturesTradeMockStreams(symbol)
    return
  }
  realtimeStop = startFuturesTradeRealtime(symbol)
}

export function stopFuturesTradeStreams() {
  stopFuturesTradeMockStreams()
  if (realtimeStop) {
    realtimeStop()
    realtimeStop = null
  }
}
