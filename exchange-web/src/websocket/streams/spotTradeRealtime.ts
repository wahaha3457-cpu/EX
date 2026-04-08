import { useSpotTradeStore } from '@/stores/spotTrade'
import { SpotChannel } from '@/websocket/channels/exchangeChannels'
import { getPublicMarketRuntime } from '@/websocket/runtime/publicMarketRuntime'
import {
  tryParseSpotDepthPayload,
  tryParseSpotTickerPayload,
  tryParseSpotTradePayload,
} from '@/websocket/adapters/parseSpotPayloads'

/**
 * 现货交易页：订阅 ticker / depth / trade，写入 spotTrade store。
 * 后端推送须使用与 {@link SpotChannel} 一致的 `channel` 字段，且 `data` 为业务体。
 */
export function startSpotTradeRealtime(symbol: string): () => void {
  const rt = getPublicMarketRuntime()
  rt.ws.connect()

  const store = useSpotTradeStore()
  const unsubs: (() => void)[] = []

  const reg = (channel: string, onData: (data: unknown) => void) => {
    unsubs.push(
      rt.subs.acquire(
        channel,
        { op: 'subscribe', channels: [channel] },
        { op: 'unsubscribe', channels: [channel] },
      ),
    )
    unsubs.push(rt.dispatcher.on(channel, (data) => onData(data)))
  }

  reg(SpotChannel.ticker(symbol), (data) => {
    const t = tryParseSpotTickerPayload(data)
    if (t) store.applyTicker(t)
  })

  reg(SpotChannel.depth(symbol), (data) => {
    const d = tryParseSpotDepthPayload(data)
    if (d) store.applyDepth(d)
  })

  reg(SpotChannel.trade(symbol), (data) => {
    const tr = tryParseSpotTradePayload(data)
    if (tr) store.pushTrade(tr)
  })

  return () => {
    unsubs.forEach((u) => u())
  }
}
