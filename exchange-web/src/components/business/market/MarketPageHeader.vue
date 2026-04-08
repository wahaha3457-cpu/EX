<script setup lang="ts">
import { computed } from 'vue'
import { formatCompact } from '@/utils/format/number'

const props = defineProps<{
  pairCount: number
  /** 全市场 24h 计价成交额合计 */
  totalQuoteVolume: number
  loading?: boolean
}>()

const volLabel = computed(() =>
  props.loading ? '—' : `${formatCompact(props.totalQuoteVolume)} USDT`,
)
</script>

<template>
  <header class="mph">
    <div class="mph__titles">
      <h1 class="mph__title">行情中心</h1>
      <p class="mph__desc">
        全市场现货与合约（永续、交割）行情一览。支持搜索、分类、榜单与表头排序；开发环境可开启模拟
        WebSocket 增量推送（见 <code class="mph__code">websocket/marketTicker</code>）。
      </p>
    </div>
    <dl class="mph__stats" aria-label="市场概览摘要">
      <div class="mph__stat">
        <dt class="mph__stat-k">交易对</dt>
        <dd class="mph__stat-v ex-num">{{ loading ? '—' : pairCount }}</dd>
      </div>
      <div class="mph__stat">
        <dt class="mph__stat-k">全市场 24h 成交额（计）</dt>
        <dd class="mph__stat-v ex-num">{{ volLabel }}</dd>
      </div>
    </dl>
  </header>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;
@use '@/styles/mixins' as mq;

.mph {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: $space-4 $space-5;
  padding-bottom: $space-3;
  border-bottom: 1px solid var(--ex-border-subtle);
}

.mph__titles {
  flex: 1;
  min-width: 240px;
  max-width: min(640px, 55%);
}

.mph__title {
  margin: 0 0 $space-2;
  font-size: clamp(22px, 2.5vw, 28px);
  font-weight: $font-weight-bold;
  letter-spacing: -0.02em;
  color: $color-text-primary;
}

.mph__desc {
  margin: 0;
  font-size: $font-size-sm;
  line-height: 1.55;
  color: $color-text-tertiary;
}

.mph__code {
  font-family: $font-family-mono;
  font-size: 0.92em;
  color: $color-text-secondary;
}

.mph__stats {
  display: flex;
  gap: $space-6;
  margin: 0;
  padding: $space-3 $space-4;
  border-radius: $radius-md;
  border: 1px solid var(--ex-border);
  background: var(--ex-panel-sunken);
}

:global([data-theme='monochrome']) .mph__stats {
  background: var(--ex-bg-elevated);
  box-shadow: var(--ex-shadow-sm);
}

.mph__stat {
  margin: 0;
}

.mph__stat-k {
  margin: 0 0 $space-1;
  font-size: $font-size-sm;
  font-weight: $font-weight-medium;
  color: $color-text-secondary;
  letter-spacing: 0.04em;
}

.mph__stat-v {
  margin: 0;
  font-size: $font-size-lg;
  font-weight: $font-weight-semibold;
  color: $color-text-primary;
  font-variant-numeric: tabular-nums;
}

@include mq.media-down(md) {
  .mph {
    flex-direction: column;
    align-items: stretch;
  }

  .mph__stats {
    width: 100%;
    justify-content: space-between;
    gap: $space-4;
  }

  .mph__desc {
    font-size: $font-size-sm;
  }
}
</style>
