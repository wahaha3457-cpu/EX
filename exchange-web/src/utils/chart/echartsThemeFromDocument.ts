import { readCssVar } from '@/utils/chart/readCssVar'

/**
 * ECharts 主题对象（按需 merge 进 setOption）。
 * 与 data-theme 联动：切换主题后请在实例上 dispatchAction 或 setOption 刷新。
 */
export function getEchartsThemeFromDocument(): Record<string, unknown> {
  if (typeof document === 'undefined') {
    return {}
  }
  const bg = readCssVar('--ex-chart-host-bg') || '#ffffff'
  const text = readCssVar('--ex-text-secondary') || '#707a8a'
  const axis = readCssVar('--ex-kline-axis') || readCssVar('--ex-border') || '#eaecef'
  const split = readCssVar('--ex-kline-grid') || '#eaecef'
  const tipBg = readCssVar('--ex-kline-tooltip-bg') || '#ffffff'
  const tipText = readCssVar('--ex-kline-tooltip-text') || text

  return {
    backgroundColor: bg,
    textStyle: { color: text },
    tooltip: {
      backgroundColor: tipBg,
      borderColor: readCssVar('--ex-border-subtle') || axis,
      textStyle: { color: tipText },
    },
    legend: { textStyle: { color: text } },
    categoryAxis: {
      axisLine: { lineStyle: { color: axis } },
      axisLabel: { color: text },
      splitLine: { lineStyle: { color: split } },
    },
    valueAxis: {
      axisLine: { lineStyle: { color: axis } },
      axisLabel: { color: text },
      splitLine: { lineStyle: { color: split } },
    },
  }
}
