<script setup lang="ts">
/**
 * 合约持仓表格 — 展示层数据由 mapFuturesPositionsToTableRows 预计算；行情推送仅更新 store 后再映射
 */
import { computed } from 'vue'
import type { PositionsTableRow } from '@/types/positionsTable'

const props = withDefaults(
  defineProps<{
    rows: PositionsTableRow[]
    /** 计价货币，用于盈亏列表头 */
    quoteAsset?: string
    loading?: boolean
    emptyText?: string
    toolbarTitle?: string
    maxHeight?: string
    /** 空态时展示当前页交易对，如 BTCUSDT */
    contextSymbol?: string
    /** 是否展示「反手」（部分所支持） */
    showReverse?: boolean
    /** 止盈止损接入真实接口前保持 false，按钮禁用 */
    enableTpSl?: boolean
    /** 交割：增加「交割倒计时」列；数值列永续与交割均为左对齐 */
    variant?: 'futures' | 'delivery'
  }>(),
  {
    quoteAsset: 'USDT',
    loading: false,
    emptyText: '暂无持仓',
    toolbarTitle: '当前持仓',
    maxHeight: 'min(360px, 44vh)',
    contextSymbol: '',
    showReverse: true,
    enableTpSl: false,
    variant: 'futures',
  },
)

const emit = defineEmits<{
  (e: 'close', positionId: string): void
  (e: 'reverse', positionId: string): void
  (e: 'request-tp-sl', positionId: string): void
}>()

const scrollStyle = computed(() => ({ maxHeight: props.maxHeight }))

const emptyHint = computed(() => {
  if (!props.contextSymbol) return props.emptyText
  return `${props.emptyText} · ${props.contextSymbol}`
})

function pnlClass(tone: string) {
  if (tone === 'gain') return 'tpt__pnl--gain'
  if (tone === 'loss') return 'tpt__pnl--loss'
  return 'tpt__pnl--flat'
}

function roiClass(tone: string) {
  if (tone === 'gain') return 'tpt__roi--gain'
  if (tone === 'loss') return 'tpt__roi--loss'
  if (tone === 'flat') return 'tpt__roi--flat'
  return 'tpt__roi--muted'
}

function rowMemoDeps(o: PositionsTableRow): unknown[] {
  return [
    o.positionId,
    o.side.text,
    o.typeLabel,
    o.contractsDisplay,
    o.entryPriceDisplay,
    o.markPriceDisplay,
    o.unrealizedPnlDisplay,
    o.unrealizedPnlTone,
    o.roiDisplay,
    o.roiTone,
    o.liquidationDisplay,
    o.deliveryCountdownDisplay,
  ]
}
</script>

<template>
  <div
    class="tpt"
    :class="{ 'tpt--loading': loading }"
  >
    <div class="tpt__toolbar">
      <div class="tpt__toolbar-left">
        <span class="tpt__title">{{ toolbarTitle }}</span>
        <span v-if="rows.length" class="tpt__count">{{ rows.length }}</span>
      </div>
      <div class="tpt__toolbar-right">
        <slot name="toolbar" />
      </div>
    </div>

    <div class="tpt__body">
      <div class="tpt__scroll" :style="scrollStyle">
        <table class="tpt__table" :aria-busy="loading">
          <thead>
            <tr>
              <th>合约</th>
              <th v-if="variant === 'delivery'">交割倒计时</th>
              <th>方向</th>
              <th v-if="variant === 'futures'">类型</th>
              <th class="tpt__cell-num-left">
                仓位数量
                <span v-if="variant === 'futures' || variant === 'delivery'" class="tpt__th-unit">(USDT)</span>
              </th>
              <th class="tpt__cell-num-left">
                开仓均价
                <span v-if="variant === 'futures' || variant === 'delivery'" class="tpt__th-unit">(USDT)</span>
              </th>
              <th class="tpt__cell-num-left">
                标记价格
                <span v-if="variant === 'futures' || variant === 'delivery'" class="tpt__th-unit">(USDT)</span>
              </th>
              <th class="tpt__cell-num-left">
                未实现盈亏
                <span v-if="variant === 'futures' || variant === 'delivery'" class="tpt__th-unit">(USDT)</span>
                <span v-else class="tpt__th-unit">({{ quoteAsset }})</span>
              </th>
              <th class="tpt__cell-num-left">收益率</th>
              <th>保证金模式</th>
              <th>杠杆</th>
              <th class="tpt__cell-num-left">
                强平价
                <span v-if="variant === 'futures' || variant === 'delivery'" class="tpt__th-unit">(USDT)</span>
              </th>
              <th class="tpt__act">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in rows"
              :key="row.positionId"
              v-memo="rowMemoDeps(row)"
              class="tpt__row"
            >
              <td class="tpt__sym">{{ row.symbolDisplay }}</td>
              <td v-if="variant === 'delivery'" class="tpt__delivery-cd ex-num">
                {{ row.deliveryCountdownDisplay ?? '—' }}
              </td>
              <td>
                <span
                  class="tpt__side"
                  :class="row.side.tone === 'long' ? 'tpt__side--long' : 'tpt__side--short'"
                >
                  {{ row.side.text }}
                </span>
              </td>
              <td v-if="variant === 'futures'" class="tpt__ptype">{{ row.typeLabel ?? '—' }}</td>
              <td class="ex-num tpt__cell-num-left">
                {{ row.contractsDisplay }}
              </td>
              <td class="ex-num tpt__cell-num-left">
                {{ row.entryPriceDisplay }}
              </td>
              <td class="ex-num tpt__cell-num-left">
                {{ row.markPriceDisplay }}
              </td>
              <td class="ex-num tpt__cell-num-left" :class="pnlClass(row.unrealizedPnlTone)">
                {{ row.unrealizedPnlDisplay }}
              </td>
              <td class="ex-num tpt__cell-num-left" :class="roiClass(row.roiTone)">
                {{ row.roiDisplay }}
              </td>
              <td class="tpt__mm">{{ row.marginModeLabel }}</td>
              <td class="tpt__lev">{{ row.leverageDisplay }}</td>
              <td class="ex-num tpt__liq tpt__cell-num-left">
                {{ row.liquidationDisplay }}
              </td>
              <td class="tpt__act">
                <button
                  type="button"
                  class="tpt__btn tpt__btn--primary"
                  :disabled="loading"
                  @click="emit('close', row.positionId)"
                >
                  平仓
                </button>
                <button
                  v-if="showReverse"
                  type="button"
                  class="tpt__btn"
                  :class="{ 'tpt__btn--reverse': variant === 'delivery' }"
                  :disabled="loading"
                  @click="emit('reverse', row.positionId)"
                >
                  反手
                </button>
                <button
                  type="button"
                  class="tpt__btn tpt__btn--ghost"
                  :disabled="loading || !enableTpSl"
                  :title="enableTpSl ? '止盈止损' : '接入止盈止损接口后开放'"
                  @click="emit('request-tp-sl', row.positionId)"
                >
                  止盈止损
                </button>
              </td>
            </tr>
            <tr v-if="!rows.length && !loading" class="tpt__empty-row">
              <td colspan="12" class="tpt__empty">{{ emptyHint }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="loading" class="tpt__overlay" aria-live="polite" aria-label="加载中">
        <div class="tpt__spinner" />
        <span class="tpt__overlay-text">加载中</span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use 'sass:color';
@use '@/styles/abstracts/variables' as *;

.tpt {
  display: flex;
  flex-direction: column;
  min-height: 0;
  position: relative;
}

.tpt--loading .tpt__scroll {
  pointer-events: none;
  opacity: 0.45;
}

.tpt__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-2;
  padding: $space-2 $space-3;
  background: var(--ex-panel-sunken);
  border-bottom: 1px solid var(--ex-border-subtle);
}

.tpt__toolbar-left {
  display: inline-flex;
  align-items: center;
  gap: $space-2;
}

.tpt__title {
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  color: $color-text-secondary;
  letter-spacing: 0.02em;
}

.tpt__count {
  font-size: 10px;
  font-weight: $font-weight-bold;
  padding: 0 6px;
  border-radius: 8px;
  background: rgba(14, 203, 129, 0.12);
  color: #0ecb81;
}

.tpt__toolbar-right {
  display: flex;
  align-items: center;
  gap: $space-2;
}

.tpt__body {
  position: relative;
  min-height: 120px;
}

.tpt__scroll {
  overflow: auto;
  -webkit-overflow-scrolling: touch;
}

.tpt__table {
  width: 100%;
  border-collapse: collapse;
  font-size: $font-size-xs;
}

.tpt__table th {
  position: sticky;
  top: 0;
  z-index: 1;
  padding: $space-2 $space-3;
  text-align: left;
  font-weight: $font-weight-semibold;
  color: $color-text-tertiary;
  background: $color-bg-surface;
  border-bottom: 1px solid $color-border;
  white-space: nowrap;
}

.tpt__th-unit {
  font-weight: $font-weight-regular;
  color: $color-text-tertiary;
  opacity: 0.85;
}

.tpt__table td {
  padding: $space-2 $space-3;
  border-bottom: 1px solid var(--ex-border-subtle);
  vertical-align: middle;
}

.tpt__row:hover td {
  background: var(--ex-fill-ghost);
}

/** 合约持仓：数值列与表头左对齐（永续 / 交割一致） */
.tpt__cell-num-left {
  text-align: left;
  font-variant-numeric: tabular-nums;
}

.tpt__delivery-cd {
  font-family: $font-family-mono;
  font-size: 11px;
  font-weight: $font-weight-semibold;
  color: $color-brand;
  white-space: nowrap;
}

.tpt__sym {
  font-family: $font-family-mono;
  font-size: 11px;
  font-weight: $font-weight-semibold;
  color: $color-text-secondary;
}

.tpt__side {
  display: inline-flex;
  align-items: center;
  padding: 1px 8px;
  font-size: 11px;
  font-weight: $font-weight-bold;
  border-radius: 4px;
  border: 1px solid transparent;
}

.tpt__side--long {
  color: $color-rise;
  background: rgba(14, 203, 129, 0.08);
  border-color: rgba(14, 203, 129, 0.22);
}

.tpt__side--short {
  color: $color-fall;
  background: rgba(246, 70, 93, 0.08);
  border-color: rgba(246, 70, 93, 0.22);
}

.tpt__pnl--gain {
  color: $color-rise;
  font-weight: $font-weight-semibold;
}

.tpt__pnl--loss {
  color: $color-fall;
  font-weight: $font-weight-semibold;
}

.tpt__pnl--flat {
  color: $color-text-tertiary;
}

.tpt__roi--gain {
  color: $color-rise;
  font-weight: $font-weight-semibold;
}

.tpt__roi--loss {
  color: $color-fall;
  font-weight: $font-weight-semibold;
}

.tpt__roi--flat {
  color: $color-text-tertiary;
}

.tpt__roi--muted {
  color: $color-text-tertiary;
}

.tpt__mm {
  font-size: 11px;
  color: $color-text-secondary;
}

.tpt__ptype {
  font-size: 11px;
  color: $color-text-secondary;
  white-space: nowrap;
}

.tpt__lev {
  font-weight: $font-weight-semibold;
  color: #8ab4ff;
}

.tpt__liq {
  color: $color-text-secondary;
}

.tpt__act {
  white-space: nowrap;
  text-align: left;
}

.tpt__btn {
  margin-left: $space-1;
  padding: 3px $space-2;
  font-size: 10px;
  font-weight: $font-weight-semibold;
  letter-spacing: 0.02em;
  color: #8ab4ff;
  background: rgba(48, 132, 252, 0.12);
  border: 1px solid rgba(48, 132, 252, 0.35);
  border-radius: $radius-sm;
  cursor: pointer;
  transition:
    background 0.12s ease,
    border-color 0.12s ease;

  &:first-child {
    margin-left: 0;
  }

  &:hover:not(:disabled) {
    background: rgba(48, 132, 252, 0.2);
    border-color: rgba(48, 132, 252, 0.5);
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
}

.tpt__btn--primary {
  color: $color-text-primary;
  background: var(--ex-fill-hover-subtle);
  border-color: var(--ex-border-strong);

  &:hover:not(:disabled) {
    color: var(--ex-fall-hover);
    border-color: rgba(246, 70, 93, 0.45);
    background: rgba(246, 70, 93, 0.1);
  }
}

/** 交割反手：琥珀强调，与截单提示色系一致，区别于普通蓝框按钮 */
.tpt__btn--reverse {
  color: var(--ex-warning, #f0b90b);
  background: linear-gradient(
    180deg,
    rgba(240, 185, 11, 0.14) 0%,
    rgba(240, 185, 11, 0.06) 100%
  );
  border-color: color-mix(in srgb, var(--ex-warning, #f0b90b) 52%, transparent);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--ex-warning, #f0b90b) 12%, transparent);

  &:hover:not(:disabled) {
    color: color-mix(in srgb, var(--ex-warning, #f0b90b) 92%, #fff);
    background: linear-gradient(
      180deg,
      rgba(240, 185, 11, 0.22) 0%,
      rgba(240, 185, 11, 0.1) 100%
    );
    border-color: color-mix(in srgb, var(--ex-warning, #f0b90b) 68%, transparent);
  }
}

.tpt__btn--ghost {
  color: $color-text-tertiary;
  border-color: var(--ex-border);
  background: transparent;
  opacity: 0.75;

  &:hover:not(:disabled) {
    opacity: 1;
    border-color: rgba(240, 185, 11, 0.35);
    color: $color-brand;
  }
}

.tpt__empty-row .tpt__empty {
  text-align: center;
  padding: $space-8 $space-4 !important;
  color: $color-text-tertiary;
  font-size: $font-size-xs;
}

.tpt__overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: $space-2;
  background: rgba(10, 12, 16, 0.42);
  pointer-events: none;
}

.tpt__spinner {
  width: 22px;
  height: 22px;
  border: 2px solid var(--ex-border-strong);
  border-top-color: rgba(48, 132, 252, 0.85);
  border-radius: 50%;
  animation: tpt-spin 0.7s linear infinite;
}

.tpt__overlay-text {
  font-size: 11px;
  color: $color-text-tertiary;
}

@keyframes tpt-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
