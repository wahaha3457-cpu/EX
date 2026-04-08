import { ColorType, CrosshairMode } from 'lightweight-charts'
import type { DeepPartial, ChartOptions } from 'lightweight-charts'
import { readCssVar } from '@/utils/chart/readCssVar'

/**
 * 从 document 上的设计令牌生成 Lightweight Charts 配置（随 data-theme 自动变化）。
 */
export function createTradingChartOptions(): DeepPartial<ChartOptions> {
  if (typeof document === 'undefined') {
    return createTerminalDarkFallback()
  }
  const root = document.documentElement
  const bg = readCssVar('--ex-chart-host-bg', root) || '#13161b'
  const text = readCssVar('--ex-text-secondary', root) || '#b7bdc6'
  const grid = readCssVar('--ex-kline-grid', root) || 'rgba(46, 53, 61, 0.9)'
  const axis = readCssVar('--ex-kline-axis', root) || readCssVar('--ex-border', root) || '#2e353d'
  const cross = readCssVar('--ex-kline-crosshair', root) || 'rgba(240, 185, 11, 0.35)'
  const tipBg = readCssVar('--ex-kline-tooltip-bg', root) || '#2b3139'
  const tipText = readCssVar('--ex-kline-tooltip-text', root) || '#eaecef'

  return {
    layout: {
      background: { type: ColorType.Solid, color: bg },
      textColor: text,
      fontFamily: "'JetBrains Mono', 'IBM Plex Mono', ui-monospace, monospace",
      fontSize: 11,
    },
    grid: {
      vertLines: { color: grid, style: 0 },
      horzLines: { color: grid, style: 0 },
    },
    crosshair: {
      mode: CrosshairMode.Normal,
      vertLine: {
        color: cross,
        width: 1,
        style: 2,
        labelBackgroundColor: tipBg,
      },
      horzLine: {
        color: cross,
        width: 1,
        style: 2,
        labelBackgroundColor: tipBg,
      },
    },
    rightPriceScale: {
      borderColor: axis,
    },
    timeScale: {
      borderColor: axis,
      timeVisible: true,
      secondsVisible: false,
    },
    localization: {
      locale: 'zh-CN',
    },
  }
}

function volumeTint(hex: string, suffix = '73'): string {
  if (hex.startsWith('#') && hex.length === 7) return `${hex}${suffix}`
  return hex
}

export function readCandleColors(): { up: string; down: string; upVol: string; downVol: string } {
  if (typeof document === 'undefined') {
    return {
      up: '#0ecb81',
      down: '#f6465d',
      upVol: 'rgba(14, 203, 129, 0.45)',
      downVol: 'rgba(246, 70, 93, 0.45)',
    }
  }
  const root = document.documentElement
  const up = readCssVar('--ex-rise', root) || '#0ecb81'
  const down = readCssVar('--ex-fall', root) || '#f6465d'
  return {
    up,
    down,
    upVol: volumeTint(up),
    downVol: volumeTint(down),
  }
}

function createTerminalDarkFallback(): DeepPartial<ChartOptions> {
  return {
    layout: {
      background: { type: ColorType.Solid, color: '#13161b' },
      textColor: '#b7bdc6',
      fontFamily: "'JetBrains Mono', 'IBM Plex Mono', ui-monospace, monospace",
      fontSize: 11,
    },
    grid: {
      vertLines: { color: 'rgba(46, 53, 61, 0.9)', style: 0 },
      horzLines: { color: 'rgba(46, 53, 61, 0.9)', style: 0 },
    },
    crosshair: {
      mode: CrosshairMode.Normal,
      vertLine: {
        color: 'rgba(240, 185, 11, 0.35)',
        width: 1,
        style: 2,
        labelBackgroundColor: '#2b3139',
      },
      horzLine: {
        color: 'rgba(240, 185, 11, 0.35)',
        width: 1,
        style: 2,
        labelBackgroundColor: '#2b3139',
      },
    },
    rightPriceScale: { borderColor: '#2e353d' },
    timeScale: { borderColor: '#2e353d', timeVisible: true, secondsVisible: false },
    localization: { locale: 'zh-CN' },
  }
}
