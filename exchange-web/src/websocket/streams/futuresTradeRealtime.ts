import { useFuturesTradeStore } from '@/stores/futuresTrade'
import { FuturesChannel } from '@/websocket/channels/exchangeChannels'
import { getPublicMarketRuntime } from '@/websocket/runtime/publicMarketRuntime'
import {
  tryParseFuturesDepthPayload,
  tryParseFuturesTickerPayload,
  tryParseFuturesTradePayload,
} from '@/websocket/adapters/parseFuturesPayloads'

/**
 * 合约交易页：订阅 mark（合并 ticker）/ depth / trade。
 */
export function startFuturesTradeRealtime(symbol: string): () => void {
  const rt = getPublicMarketRuntime()
  rt.ws.connect()

  const store = useFuturesTradeStore()
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

  reg(FuturesChannel.mark(symbol), (data) => {
    const t = tryParseFuturesTickerPayload(data)
    if (t) store.applyTicker(t)
  })

  reg(FuturesChannel.depth(symbol), (data) => {
    const d = tryParseFuturesDepthPayload(data)
    if (d) store.applyDepth(d)
  })

  reg(FuturesChannel.trade(symbol), (data) => {
    const tr = tryParseFuturesTradePayload(data)
    if (tr) store.pushTrade(tr)
  })

  return () => {
    unsubs.forEach((u) => u())
  }
}
