/**
 * 现货交易页数据流：未配置 `VITE_WS_PUBLIC_URL` 时使用本地定时 mock；配置后走真实订阅。
 */
import { isPublicWsConfigured } from '@/websocket/config/wsEnv'
import { startSpotTradeRealtime } from '@/websocket/streams/spotTradeRealtime'
import type { SpotDepthSnapshot, SpotRecentTrade, SpotTickerSnapshot } from '@/types/spotTrade'
import { useSpotTradeStore } from '@/stores/spotTrade'

export type SpotWsTickerHandler = (t: SpotTickerSnapshot) => void
export type SpotWsDepthHandler = (d: SpotDepthSnapshot) => void
export type SpotWsTradeHandler = (t: SpotRecentTrade) => void

let mockTimers: number[] = []
let realtimeStop: (() => void) | null = null

export function startSpotTradeMockStreams(_symbol: string) {
  stopSpotTradeMockStreams()
  const store = useSpotTradeStore()
  const t1 = window.setInterval(() => {
    const d = store.depth
    if (!d) return
    const jitter = (Math.random() - 0.5) * 0.0001
    const next: SpotDepthSnapshot = {
      seq: d.seq + 1,
      asks: d.asks.map((x) => ({
        ...x,
        price: x.price * (1 + jitter),
        quantity: Math.max(0.01, x.quantity + (Math.random() - 0.5) * 0.05),
      })),
      bids: d.bids.map((x) => ({
        ...x,
        price: x.price * (1 - jitter),
        quantity: Math.max(0.01, x.quantity + (Math.random() - 0.5) * 0.05),
      })),
    }
    store.applyDepth(next)
  }, 4000)
  const t2 = window.setInterval(() => {
    if (!store.ticker) return
    const last = store.ticker.lastPrice * (1 + (Math.random() * 0.0002 - 0.0001))
    const snap: SpotTickerSnapshot = {
      ...store.ticker,
      lastPrice: last,
    }
    store.applyTicker(snap)
  }, 6000)
  const t3 = window.setInterval(() => {
    const tr: SpotRecentTrade = {
      id: `ws-${Date.now()}`,
      price: store.ticker?.lastPrice ?? 1,
      quantity: Math.random() * 0.2,
      side: Math.random() > 0.5 ? 'BUY' : 'SELL',
      time: new Date().toISOString(),
    }
    store.pushTrade(tr)
  }, 5000)
  mockTimers.push(t1, t2, t3)
}

export function stopSpotTradeMockStreams() {
  mockTimers.forEach(clearInterval)
  mockTimers = []
}

/** 统一入口：有公网 WS 配置则实连，否则 mock */
export function startSpotTradeStreams(symbol: string) {
  stopSpotTradeStreams()
  if (!isPublicWsConfigured()) {
    startSpotTradeMockStreams(symbol)
    return
  }
  realtimeStop = startSpotTradeRealtime(symbol)
}

export function stopSpotTradeStreams() {
  stopSpotTradeMockStreams()
  if (realtimeStop) {
    realtimeStop()
    realtimeStop = null
  }
}
