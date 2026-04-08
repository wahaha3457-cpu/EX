/** 展示用涨跌幅，保留两位小数并带符号 */
export function formatChangePct(pct: number): string {
  const sign = pct > 0 ? '+' : ''
  return `${sign}${pct.toFixed(2)}%`
}
