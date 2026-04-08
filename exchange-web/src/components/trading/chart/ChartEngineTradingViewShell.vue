<script setup lang="ts">
/**
 * TradingView Charting Library 占位壳：正式接入时在父级异步加载 `charting_library` 脚本，
 * 将 widget 挂入本容器，并实现 {@link ITradingChartEngineAdapter}。
 */
import type { ChartInterval } from '@/types/chartKline'

defineProps<{
  symbol: string
  interval: ChartInterval
}>()
</script>

<template>
  <div class="tv-shell" role="region" aria-label="TradingView 图表占位">
    <div class="tv-shell__badge">TradingView</div>
    <p class="tv-shell__title">Charting Library 接入位</p>
    <p class="tv-shell__hint">
      将 <code class="tv-shell__code">container_id</code> 指向本节点；数据仍建议走与 Lightweight
      相同的 REST / WebSocket 适配层（如 <code class="tv-shell__code">fetchChartKlines</code> 与 kline 频道）。
    </p>
    <p class="tv-shell__sym">{{ symbol }} · {{ interval }}</p>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.tv-shell {
  flex: 1;
  min-height: 320px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: $space-6;
  text-align: center;
  background:
    radial-gradient(
      ellipse at 50% 0%,
      color-mix(in srgb, var(--ex-info) 14%, transparent) 0%,
      transparent 55%
    ),
    var(--ex-chart-host-bg);
  border: 1px dashed var(--ex-border);
  border-radius: $radius-sm;
}

.tv-shell__badge {
  font-size: 10px;
  font-weight: $font-weight-bold;
  letter-spacing: 0.12em;
  color: var(--ex-info);
  margin-bottom: $space-2;
}

.tv-shell__title {
  margin: 0 0 $space-2;
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  color: $color-text-secondary;
}

.tv-shell__hint {
  margin: 0;
  max-width: 420px;
  font-size: $font-size-xs;
  color: $color-text-tertiary;
  line-height: 1.55;
}

.tv-shell__code {
  font-family: $font-family-mono;
  font-size: 10px;
  color: var(--ex-brand);
}

.tv-shell__sym {
  margin: $space-4 0 0;
  font-size: $font-size-xs;
  font-family: $font-family-mono;
  color: $color-text-tertiary;
}
</style>
