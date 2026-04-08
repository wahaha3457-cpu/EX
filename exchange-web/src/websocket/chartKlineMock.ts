/**
 * K 线演示用定时推送（生产替换为真实 WebSocket `kline` 频道）。
 */
export function startChartKlineMockTimer(onTick: () => void, intervalMs = 2200): () => void {
  const id = window.setInterval(onTick, intervalMs)
  return () => clearInterval(id)
}
