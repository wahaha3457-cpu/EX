<script setup lang="ts">
/**
 * 最新成交：价格（方向色）· 数量 · 时间；数据只读，新成交在数组前部（与 Pinia push 顺序一致）。
 */
import { computed } from 'vue'
import type { RecentTradeRow } from '@/types/recentTrades'
import { formatPrice } from '@/utils/format/number'
import { formatOrderBookQuantity } from '@/utils/format/orderBook'
import { formatRecentTradeTime } from '@/utils/format/recentTradeTime'

const props = withDefaults(
  defineProps<{
    trades: readonly RecentTradeRow[]
    maxRows?: number
    baseAsset: string
    quoteAsset: string
    quantityDecimals?: number
    loading?: boolean
    title?: string
    /** 时间列是否显示秒（高频场景更易区分） */
    timeWithSeconds?: boolean
    /**
     * 面板最大高度（与右栏「行情+成交」叠放时收窄成交区，例如 `min(260px, 32vh)`）。
     * 未传时使用默认 320px。
     */
    maxHeight?: string
  }>(),
  {
    maxRows: 24,
    quantityDecimals: 5,
    loading: false,
    title: '最新成交',
    timeWithSeconds: false,
    maxHeight: undefined,
  },
)

const visible = computed(() => props.trades.slice(0, props.maxRows))

const rootStyle = computed(() =>
  props.maxHeight ? ({ '--trt-max-h': props.maxHeight } as Record<string, string>) : {},
)

function fmtQty(n: number): string {
  return formatOrderBookQuantity(n, props.quantityDecimals)
}

function fmtTime(iso: string): string {
  return formatRecentTradeTime(iso, props.timeWithSeconds)
}
</script>

<template>
  <section
    class="trt"
    :class="{ 'trt--loading': loading }"
    :style="rootStyle"
    aria-label="最新成交"
  >
    <h3 class="trt__title">{{ title }}</h3>
    <div class="trt__head">
      <span class="trt__h-price">价格({{ quoteAsset }})</span>
      <span class="trt__h-qty">数量({{ baseAsset }})</span>
      <span class="trt__h-time">时间</span>
    </div>
    <ul class="trt__list" role="list">
      <li
        v-for="t in visible"
        :key="t.id"
        v-memo="[t.id, t.price, t.quantity, t.side, t.time, timeWithSeconds]"
        class="trt__row"
        role="listitem"
      >
        <span
          class="trt__price ex-num"
          :class="t.side === 'BUY' ? 'trt__price--buy' : 'trt__price--sell'"
        >
          {{ formatPrice(t.price) }}
        </span>
        <span class="trt__qty ex-num">{{ fmtQty(t.quantity) }}</span>
        <span class="trt__time ex-num">{{ fmtTime(t.time) }}</span>
      </li>
    </ul>
    <div v-if="!visible.length && !loading" class="trt__empty">暂无成交</div>
  </section>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.trt {
  border: 1px solid $color-border;
  border-radius: $radius-md;
  background: var(--ex-modal-surface);
  display: flex;
  flex-direction: column;
  max-height: var(--trt-max-h, 320px);
  min-height: 120px;
  overflow: hidden;
  position: relative;
  contain: layout style;
}

.trt--loading::after {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--ex-panel-sunken);
  pointer-events: none;
}

.trt__title {
  margin: 0;
  padding: $space-2 $space-3;
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
  letter-spacing: 0.02em;
  border-bottom: 1px solid $color-border;
  background: var(--ex-surface-inset-strong);
  flex-shrink: 0;
}

.trt__head {
  display: grid;
  grid-template-columns: 1fr 1fr 72px;
  align-items: center;
  padding: 6px $space-2;
  font-size: 10px;
  font-weight: $font-weight-semibold;
  color: $color-text-tertiary;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  border-bottom: 1px solid var(--ex-border-subtle);
  flex-shrink: 0;
}

.trt__h-qty,
.trt__h-time {
  text-align: right;
}

.trt__list {
  list-style: none;
  margin: 0;
  padding: 0;
  overflow-y: auto;
  overflow-x: hidden;
  flex: 1;
  scrollbar-width: thin;

  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: $color-border-strong;
    border-radius: 4px;
  }
}

.trt__row {
  display: grid;
  grid-template-columns: 1fr 1fr 72px;
  align-items: center;
  min-height: 22px;
  padding: 3px $space-2;
  font-size: $font-size-xs;
  font-family: $font-family-mono;
  border-bottom: 1px solid transparent;
  transition: background 0.12s ease;

  &:hover {
    background: var(--ex-fill-ghost);
  }
}

.trt__price {
  font-weight: $font-weight-semibold;
  font-variant-numeric: tabular-nums;
}

.trt__price--buy {
  color: $color-rise;
}

.trt__price--sell {
  color: $color-fall;
}

.trt__qty {
  text-align: right;
  color: $color-text-secondary;
  font-variant-numeric: tabular-nums;
}

.trt__time {
  text-align: right;
  color: $color-text-tertiary;
  font-variant-numeric: tabular-nums;
}

.trt__empty {
  padding: $space-4 $space-3;
  text-align: center;
  font-size: $font-size-xs;
  color: $color-text-tertiary;
}

.ex-num {
  font-family: $font-family-mono;
}
</style>
