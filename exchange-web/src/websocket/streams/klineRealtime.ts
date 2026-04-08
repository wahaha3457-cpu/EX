import type { KlineBarPatch } from '@/types/chartKline'
import { FuturesChannel, SpotChannel } from '@/websocket/channels/exchangeChannels'
import { getPublicMarketRuntime } from '@/websocket/runtime/publicMarketRuntime'

function tryParseKlinePatch(data: unknown): KlineBarPatch | null {
  if (!data || typeof data !== 'object') return null
  const o = data as Record<string, unknown>
  const time = o.time
  if (typeof time !== 'number' || !Number.isFinite(time)) return null
  const patch: KlineBarPatch = { time }
  if (typeof o.open === 'number') patch.open = o.open
  if (typeof o.high === 'number') patch.high = o.high
  if (typeof o.low === 'number') patch.low = o.low
  if (typeof o.close === 'number') patch.close = o.close
  if (typeof o.volume === 'number') patch.volume = o.volume
  return patch
}

/** 现货 K 线：与图表面板 `chartInterval` 联动时传入对应 interval */
export function startSpotKlineRealtime(
  symbol: string,
  interval: string,
  onPatch: (p: KlineBarPatch) => void,
): () => void {
  const rt = getPublicMarketRuntime()
  rt.ws.connect()
  const ch = SpotChannel.kline(symbol, interval)
  const unsub = rt.subs.acquire(
    ch,
    { op: 'subscribe', channels: [ch] },
    { op: 'unsubscribe', channels: [ch] },
  )
  const off = rt.dispatcher.on(ch, (data) => {
    const p = tryParseKlinePatch(data)
    if (p) onPatch(p)
  })
  return () => {
    off()
    unsub()
  }
}

/** 合约 K 线 */
export function startFuturesKlineRealtime(
  symbol: string,
  interval: string,
  onPatch: (p: KlineBarPatch) => void,
): () => void {
  const rt = getPublicMarketRuntime()
  rt.ws.connect()
  const ch = FuturesChannel.kline(symbol, interval)
  const unsub = rt.subs.acquire(
    ch,
    { op: 'subscribe', channels: [ch] },
    { op: 'unsubscribe', channels: [ch] },
  )
  const off = rt.dispatcher.on(ch, (data) => {
    const p = tryParseKlinePatch(data)
    if (p) onPatch(p)
  })
  return () => {
    off()
    unsub()
  }
}
