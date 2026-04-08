import type { ChartInterval, KlineBar } from '@/types/chartKline'

function intervalMs(iv: ChartInterval): number {
  switch (iv) {
    case '1m':
      return 60_000
    case '5m':
      return 5 * 60_000
    case '15m':
      return 15 * 60_000
    case '1h':
      return 60 * 60_000
    case '4h':
      return 4 * 60 * 60_000
    case '1d':
      return 24 * 60 * 60_000
    default:
      return 60_000
  }
}

/**
 * 演示用随机游走 OHLCV；生产由 REST 返回真实历史。
 */
export function generateMockKlines(
  count: number,
  interval: ChartInterval,
  seedPrice: number,
): KlineBar[] {
  const step = intervalMs(interval)
  const now = Date.now()
  const start = now - count * step
  const out: KlineBar[] = []
  let prevClose = seedPrice
  for (let i = 0; i < count; i++) {
    const t = Math.floor((start + i * step) / 1000)
    const drift = (Math.random() - 0.48) * prevClose * 0.002
    const open = prevClose
    const close = Math.max(1e-8, open + drift)
    const wick = Math.abs(drift) + Math.random() * prevClose * 0.001
    const high = Math.max(open, close) + wick * Math.random()
    const low = Math.min(open, close) - wick * Math.random()
    const volume = Math.random() * seedPrice * 12 + 1
    out.push({
      time: t,
      open,
      high,
      low,
      close,
      volume,
    })
    prevClose = close
  }
  return out
}
