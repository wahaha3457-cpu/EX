/**
 * 成交时间列：固定格式，避免每次渲染 new Date 抖动。
 */
export function formatRecentTradeTime(iso: string, withSeconds = false): string {
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return '—'
    return d.toLocaleTimeString('zh-CN', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: withSeconds ? '2-digit' : undefined,
    })
  } catch {
    return '—'
  }
}
