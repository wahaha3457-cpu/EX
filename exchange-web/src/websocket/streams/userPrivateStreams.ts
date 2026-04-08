import type { FuturesOpenOrderRow } from '@/types/futuresTrade'
import type { SpotOpenOrderRow } from '@/types/spotTrade'
import { UserChannel } from '@/websocket/channels/exchangeChannels'
import { isPrivateWsConfigured } from '@/websocket/config/wsEnv'
import { getPrivateUserRuntime } from '@/websocket/runtime/privateUserRuntime'

/**
 * 私有频道示例：注册后需在网关侧推送 `channel` 与下列键一致。
 * 实际合并/增量策略在 store 内实现，此处仅演示订阅与分发。
 */

export function subscribeUserOrders(
  userId: string,
  onSpot: (rows: SpotOpenOrderRow[]) => void,
  onFutures: (rows: FuturesOpenOrderRow[]) => void,
): () => void {
  if (!isPrivateWsConfigured()) return () => {}
  const rt = getPrivateUserRuntime()
  rt.ws.connect()
  const ch = UserChannel.order(userId)
  const off = rt.dispatcher.on(ch, (data) => {
    if (!data || typeof data !== 'object') return
    const rec = data as Record<string, unknown>
    if (rec.market === 'spot' && Array.isArray(rec.orders)) {
      onSpot(rec.orders as SpotOpenOrderRow[])
    }
    if (rec.market === 'futures' && Array.isArray(rec.orders)) {
      onFutures(rec.orders as FuturesOpenOrderRow[])
    }
  })
  const unsub = rt.subs.acquire(
    ch,
    { op: 'subscribe', channels: [ch] },
    { op: 'unsubscribe', channels: [ch] },
  )
  return () => {
    off()
    unsub()
  }
}
