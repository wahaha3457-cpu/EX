import { readCssVar } from '@/utils/chart/readCssVar'

/**
 * TradingView Charting Library：在创建 widget 时合并进 overrides / studies_overrides。
 * 正式接入 charting_library 时由适配层调用，保持与 CSS token 一致。
 */
export function getTradingViewColorOverrides(): Record<string, string> {
  if (typeof document === 'undefined') return {}
  return {
    'paneProperties.background': readCssVar('--ex-chart-host-bg') || '#13161b',
    'paneProperties.vertGridProperties.color': readCssVar('--ex-kline-grid') || '#2e353d',
    'paneProperties.horzGridProperties.color': readCssVar('--ex-kline-grid') || '#2e353d',
    'scalesProperties.textColor': readCssVar('--ex-text-secondary') || '#b7bdc6',
    'mainSeriesProperties.candleStyle.upColor': readCssVar('--ex-rise') || '#0ecb81',
    'mainSeriesProperties.candleStyle.downColor': readCssVar('--ex-fall') || '#f6465d',
    'mainSeriesProperties.candleStyle.borderUpColor': readCssVar('--ex-rise') || '#0ecb81',
    'mainSeriesProperties.candleStyle.borderDownColor': readCssVar('--ex-fall') || '#f6465d',
    'mainSeriesProperties.candleStyle.wickUpColor': readCssVar('--ex-rise') || '#0ecb81',
    'mainSeriesProperties.candleStyle.wickDownColor': readCssVar('--ex-fall') || '#f6465d',
  }
}
