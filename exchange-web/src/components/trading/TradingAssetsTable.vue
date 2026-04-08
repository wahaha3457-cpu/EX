<script setup lang="ts">
/**
 * 资产中心余额表 — 展示行由 mapBalancesToAssetsTableRows 预计算；操作通过 emit 交给路由/弹窗
 */
import { computed } from 'vue'
import type { AssetsTableRow } from '@/types/assetsTable'

const props = withDefaults(
  defineProps<{
    rows: AssetsTableRow[]
    /** 是否展示「占用保证金」列（合约账户） */
    showMarginColumn: boolean
    loading?: boolean
    /** 折合估值列使用的计价单位，如 USDT */
    quoteAsset?: string
    emptyText?: string
    toolbarTitle?: string
    maxHeight?: string
  }>(),
  {
    loading: false,
    quoteAsset: 'USDT',
    emptyText: '暂无资产数据',
    toolbarTitle: '资产列表',
    maxHeight: 'min(480px, 52vh)',
  },
)

const emit = defineEmits<{
  (e: 'deposit', asset: string): void
  (e: 'withdraw', asset: string): void
  (e: 'transfer', asset: string): void
}>()

const colSpan = computed(() => (props.showMarginColumn ? 8 : 7))

const scrollStyle = computed(() => ({ maxHeight: props.maxHeight }))

function rowMemoDeps(o: AssetsTableRow): unknown[] {
  return [
    o.asset,
    o.totalDisplay,
    o.availableDisplay,
    o.frozenDisplay,
    o.marginOccupiedDisplay,
    o.valueQuoteDisplay,
  ]
}
</script>

<template>
  <div class="tat" :class="{ 'tat--loading': loading }">
    <div class="tat__toolbar">
      <div class="tat__toolbar-left">
        <span class="tat__title">{{ toolbarTitle }}</span>
        <span v-if="rows.length" class="tat__count">{{ rows.length }}</span>
      </div>
      <div class="tat__toolbar-right">
        <slot name="toolbar" />
      </div>
    </div>

    <div class="tat__body">
      <div class="tat__scroll" :style="scrollStyle">
        <table class="tat__table" :aria-busy="loading">
          <thead>
            <tr>
              <th>币种</th>
              <th class="tat__num">总额</th>
              <th class="tat__num">可用</th>
              <th class="tat__num">冻结</th>
              <th v-if="showMarginColumn" class="tat__num">占用保证金</th>
              <th class="tat__num">
                折合估值
                <span class="tat__th-unit">({{ quoteAsset }})</span>
              </th>
              <th class="tat__act">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in rows"
              :key="row.asset"
              v-memo="rowMemoDeps(row)"
              class="tat__row"
            >
              <td>
                <span class="tat__asset">{{ row.asset }}</span>
              </td>
              <td class="tat__num ex-num">{{ row.totalDisplay }}</td>
              <td class="tat__num ex-num">{{ row.availableDisplay }}</td>
              <td class="tat__num ex-num tat__frozen">{{ row.frozenDisplay }}</td>
              <td v-if="showMarginColumn" class="tat__num ex-num tat__margin">
                {{ row.marginOccupiedDisplay ?? '—' }}
              </td>
              <td class="tat__num ex-num tat__val">{{ row.valueQuoteDisplay }}</td>
              <td class="tat__act">
                <button
                  type="button"
                  class="tat__btn tat__btn--emph"
                  :disabled="loading"
                  @click="emit('deposit', row.asset)"
                >
                  充值
                </button>
                <button
                  type="button"
                  class="tat__btn"
                  :disabled="loading"
                  @click="emit('withdraw', row.asset)"
                >
                  提现
                </button>
                <button
                  type="button"
                  class="tat__btn tat__btn--ghost"
                  :disabled="loading"
                  @click="emit('transfer', row.asset)"
                >
                  划转
                </button>
              </td>
            </tr>
            <tr v-if="!rows.length && !loading" class="tat__empty-row">
              <td :colspan="colSpan" class="tat__empty">{{ emptyText }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="loading" class="tat__overlay" aria-live="polite" aria-label="加载中">
        <div class="tat__spinner" />
        <span class="tat__overlay-text">加载中</span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;
@use '@/styles/mixins' as mq;

.tat {
  display: flex;
  flex-direction: column;
  min-height: 0;
  position: relative;
  border: 1px solid $color-border;
  border-radius: $radius-lg;
  background: $color-bg-elevated;
  overflow: hidden;
}

.tat--loading .tat__scroll {
  pointer-events: none;
  opacity: 0.45;
}

.tat__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-2;
  padding: $space-3 $space-4;
  border-bottom: 1px solid $color-border;
  background: var(--ex-surface-inset);
}

.tat__toolbar-left {
  display: inline-flex;
  align-items: center;
  gap: $space-2;
}

.tat__title {
  margin: 0;
  font-size: $font-size-base;
  font-weight: $font-weight-bold;
  letter-spacing: 0.02em;
  color: $color-text-primary;
}

.tat__count {
  font-size: 10px;
  font-weight: $font-weight-bold;
  padding: 0 6px;
  border-radius: 8px;
  background: var(--ex-info-bg);
  color: var(--ex-info);
}

.tat__toolbar-right {
  display: flex;
  align-items: center;
  gap: $space-2;
}

.tat__body {
  position: relative;
  min-height: 120px;
}

.tat__scroll {
  overflow: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
}

.tat__table {
  width: 100%;
  min-width: 680px;
  border-collapse: collapse;
  font-size: $font-size-sm;
}

.tat__table th {
  position: sticky;
  top: 0;
  z-index: 2;
  padding: $space-3 $space-4;
  text-align: left;
  font-weight: $font-weight-semibold;
  font-size: $font-size-xs;
  color: $color-text-tertiary;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  white-space: nowrap;
  background: $color-bg-surface;
  border-bottom: 1px solid $color-border;
}

.tat__table th:first-child,
.tat__table td:first-child {
  position: sticky;
  left: 0;
  z-index: 1;
  background: $color-bg-elevated;
  box-shadow: 1px 0 0 var(--ex-border-subtle);
}

.tat__table thead th:first-child {
  z-index: 3;
  background: $color-bg-surface;
}

.tat__th-unit {
  font-weight: $font-weight-regular;
  text-transform: none;
  letter-spacing: 0;
  opacity: 0.9;
}

.tat__table td {
  padding: $space-3 $space-4;
  border-bottom: 1px solid var(--ex-border-subtle);
  vertical-align: middle;
}

.tat__row:hover td {
  background: var(--ex-fill-ghost);
}

.tat__row:hover td:first-child {
  background: var(--ex-fill-ghost);
}

.tat__asset {
  font-weight: $font-weight-bold;
  font-size: $font-size-md;
  letter-spacing: 0.04em;
  font-family: $font-family-mono;
}

.tat__num {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.tat__frozen {
  color: $color-text-secondary;
}

.tat__margin {
  color: var(--ex-brand);
}

.tat__val {
  color: var(--ex-text-secondary);
  font-weight: $font-weight-semibold;
}

.tat__act {
  text-align: right;
  white-space: nowrap;
}

.tat__btn {
  margin-left: $space-1;
  padding: 4px $space-2;
  font-size: 10px;
  font-weight: $font-weight-semibold;
  letter-spacing: 0.02em;
  color: var(--ex-info);
  background: var(--ex-info-bg);
  border: 1px solid color-mix(in srgb, var(--ex-info) 32%, transparent);
  border-radius: $radius-sm;
  cursor: pointer;
  transition:
    background 0.12s ease,
    border-color 0.12s ease;

  &:first-child {
    margin-left: 0;
  }

  &:hover:not(:disabled) {
    background: color-mix(in srgb, var(--ex-info) 18%, transparent);
    border-color: color-mix(in srgb, var(--ex-info) 48%, transparent);
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
}

/** 行内主行动：充值 — 主题品牌单色（与主站 --ex-brand 一致） */
.tat__btn--emph {
  color: var(--ex-on-brand);
  background: var(--ex-brand);
  border-color: color-mix(in srgb, var(--ex-brand) 55%, transparent);
  font-weight: $font-weight-bold;
  box-shadow: inset 0 1px 0 color-mix(in srgb, #ffffff 22%, transparent);
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    box-shadow 0.15s ease;

  &:hover:not(:disabled) {
    background: var(--ex-brand-hover);
    border-color: color-mix(in srgb, var(--ex-brand-hover) 60%, transparent);
    box-shadow:
      inset 0 1px 0 color-mix(in srgb, #ffffff 28%, transparent),
      0 2px 8px color-mix(in srgb, var(--ex-brand) 22%, transparent);
  }

  &:active:not(:disabled) {
    background: var(--ex-brand-active);
    border-color: color-mix(in srgb, var(--ex-brand-active) 65%, transparent);
    box-shadow: inset 0 1px 0 color-mix(in srgb, #000000 12%, transparent);
  }

  &:focus-visible {
    outline: 2px solid var(--ex-border-focus);
    outline-offset: 2px;
  }
}

.tat__btn--ghost {
  color: $color-text-secondary;
  background: var(--ex-fill-ghost);
  border-color: var(--ex-border-strong);

  &:hover:not(:disabled) {
    color: $color-brand;
    border-color: rgba(240, 185, 11, 0.35);
    background: rgba(240, 185, 11, 0.06);
  }
}

.tat__empty-row .tat__empty {
  text-align: center;
  padding: $space-8 $space-4 !important;
  color: $color-text-tertiary;
  font-size: $font-size-sm;
}

.tat__overlay {
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

.tat__spinner {
  width: 22px;
  height: 22px;
  border: 2px solid var(--ex-border-strong);
  border-top-color: rgba(48, 132, 252, 0.85);
  border-radius: 50%;
  animation: tat-spin 0.7s linear infinite;
}

.tat__overlay-text {
  font-size: 11px;
  color: $color-text-tertiary;
}

@keyframes tat-spin {
  to {
    transform: rotate(360deg);
  }
}

@include mq.media-down(md) {
  .tat__toolbar {
    flex-wrap: wrap;
    padding: $space-2 $space-3;
  }

  .tat__title {
    font-size: $font-size-sm;
  }

  .tat__btn {
    min-height: 28px;
    padding: 4px $space-2;
    font-size: $font-size-xs;
  }
}
</style>
