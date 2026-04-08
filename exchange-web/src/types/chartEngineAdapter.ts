import type { ChartEngineId, ChartInterval, KlineBar } from '@/types/chartKline'

/**
 * 抽象图表引擎（Lightweight / TradingView 等），便于单元测试与引擎切换。
 * TradingView Charting Library 接入时：实现该接口，在壳组件内 new TradingView.widget(...)。
 */
export interface ITradingChartEngineAdapter {
  readonly id: ChartEngineId
  mount(container: HTMLElement): void
  dispose(): void
  setBars(bars: readonly KlineBar[]): void
  /** 合并最后一根或追加（WS 推送） */
  applyRealtimeBar(bar: KlineBar): void
  resize(width: number, height: number): void
  setInterval(interval: ChartInterval): void
  setSymbol(routeSymbol: string): void
}
