/** 指数退避 + 抖动，避免重连惊群 */

export function nextReconnectDelayMs(attempt: number, baseMs = 800, maxMs = 30_000): number {
  const exp = Math.min(maxMs, baseMs * 2 ** Math.min(attempt, 10))
  const jitter = exp * 0.25 * (Math.random() - 0.5)
  return Math.max(200, Math.round(exp + jitter))
}
