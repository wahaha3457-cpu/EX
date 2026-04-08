/**
 * 行情 WebSocket 接入预留
 *
 * 建议频道：!ticker@arr 或按 symbol 分片订阅，消息体映射为 MarketTickerPatch[]。
 * 合并策略：useMarketStore().applyTickerPatches(patches, seq) 幂等按 seq 去重。
 *
 * 生命周期：进入 MarketPage onMounted 可 subscribe；离开 onUnmounted unsubscribe。
 * 全局 ticker：可在 App.vue 或 bootstrap 中单例连接，与页面解耦。
 *
 * 后端就绪后：在应用启动或进入行情页时 subscribe，离开时 unsubscribe。
 * 消息格式建议：{ topic, seq, ts, data: MarketTickerPatch | MarketTickerPatch[] }
 */
import type { MarketTickerPatch } from '@/types/market'
import { useMarketStore } from '@/stores/market'

export type MarketTickerWsHandler = (patches: MarketTickerPatch[], seq?: number) => void

let mockTimer: number | null = null

/** 占位：模拟推送（开发调试用，生产环境删除） */
export function startMockMarketTickerStream(intervalMs = 8000) {
  stopMockMarketTickerStream()
  const store = useMarketStore()
  mockTimer = window.setInterval(() => {
    const rows = store.tickers
    if (!rows.length) return
    const pick = rows[Math.floor(Math.random() * rows.length)]!
    const jitter = pick.lastPrice * (Math.random() * 0.0008 - 0.0004)
    const patch: MarketTickerPatch = {
      id: pick.id,
      lastPrice: pick.lastPrice + jitter,
      ts: Date.now(),
    }
    store.applyTickerPatches([patch], Date.now())
  }, intervalMs)
}

export function stopMockMarketTickerStream() {
  if (mockTimer != null) {
    clearInterval(mockTimer)
    mockTimer = null
  }
}

/**
 * 真实接入示例（伪代码）：
 * ws.send(JSON.stringify({ op: 'subscribe', channel: 'market.all.ticker' }))
 * ws.onmessage = (ev) => { const msg = JSON.parse(ev.data); store.applyTickerPatches(msg.data, msg.seq) }
 */
export function subscribeGlobalMarketTickers(_onPatch: MarketTickerWsHandler) {
  // return () => unsubscribe()
}
