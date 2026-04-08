<script setup lang="ts">
/**
 * 当前委托表格 — 现货/合约共用展示组件（数据由父级映射为 CurrentOpenOrderTableRow）
 */
import { computed } from 'vue'
import type {
  CurrentOpenOrderTableRow,
  CurrentOrdersTableVariant,
} from '@/types/currentOrdersTable'

const props = withDefaults(
  defineProps<{
    variant: CurrentOrdersTableVariant
    rows: CurrentOpenOrderTableRow[]
    /** 与 bootstrap / 轮询 / 切换交易对时的加载态对齐 */
    loading?: boolean
    emptyText?: string
    showCancelAll?: boolean
    /** 工具条左侧说明，如「当前委托」 */
    toolbarTitle?: string
    /** 滚动区域最大高度，默认与终端底部区域常见值一致 */
    maxHeight?: string
    /** 现货：数量/已成交列后缀（如 BTC） */
    spotBaseAsset?: string
    /** 现货：价格数值/金额列后缀（如 USDT） */
    spotQuoteAsset?: string
  }>(),
  {
    loading: false,
    emptyText: '暂无当前委托',
    showCancelAll: true,
    toolbarTitle: '当前委托',
    maxHeight: 'min(320px, 42vh)',
    spotBaseAsset: '',
    spotQuoteAsset: '',
  },
)

const emit = defineEmits<{
  (e: 'cancel', orderNo: string): void
  (e: 'cancel-all'): void
}>()

const scrollStyle = computed(() => ({ maxHeight: props.maxHeight }))

function onCancel(orderNo: string) {
  emit('cancel', orderNo)
}

function onCancelAll() {
  emit('cancel-all')
}

/** 无数据或与旧版 em dash 统一为「--」 */
function dashOrText(v: string | undefined | null): string {
  const s = String(v ?? '').trim()
  if (s === '' || s === '—' || s === '–' || s === '-') return '--'
  return s
}

const spotBase = computed(() => (props.spotBaseAsset ?? '').trim())
const spotQuote = computed(() => (props.spotQuoteAsset ?? '').trim())

/** 现货：基础币数量列（数量 / 已成交） */
function spotBaseQtyCell(raw: string | undefined | null): { empty: boolean; num: string } {
  const t = dashOrText(raw)
  if (t === '--') return { empty: true, num: '' }
  return { empty: false, num: t }
}

/** 现货：计价币金额列 */
function spotQuoteAmtCell(raw: string | undefined | null): { empty: boolean; num: string } {
  const t = dashOrText(raw)
  if (t === '--') return { empty: true, num: '' }
  return { empty: false, num: t }
}

/** v-memo：行内展示字段变化时才重绘 DOM，减轻高频 tick 压力 */
function rowMemoDeps(o: CurrentOpenOrderTableRow): unknown[] {
  return [
    o.orderNo,
    o.side.text,
    o.side.tone,
    o.priceDisplay,
    o.quantityDisplay,
    o.filledDisplay,
    o.amountDisplay,
    o.tpSlDisplay,
    o.status.text,
    o.status.tone,
    o.timeDisplay,
    o.futuresExtras?.reduceOnly,
    o.futuresExtras?.positionSide.text,
    o.futuresExtras?.leverageDisplay,
    o.futuresExtras?.marginModeDisplay,
    o.futuresExtras?.positionNotionalDisplay,
    o.futuresExtras?.filledNotionalDisplay,
    props.spotBaseAsset,
    props.spotQuoteAsset,
  ]
}
</script>

<template>
  <div class="tcot" :class="{ 'tcot--loading': loading }">
    <div class="tcot__toolbar">
      <div class="tcot__toolbar-left">
        <span class="tcot__title">{{ toolbarTitle }}</span>
        <span v-if="rows.length" class="tcot__count">{{ rows.length }}</span>
      </div>
      <div class="tcot__toolbar-right">
        <button
          v-if="showCancelAll"
          type="button"
          class="tcot__cancel-all"
          :disabled="!rows.length || loading"
          @click="onCancelAll"
        >
          全部撤单
        </button>
      </div>
    </div>

    <div class="tcot__body">
      <div class="tcot__scroll" :style="scrollStyle">
        <!-- 现货：固定 11 列（含金额、止盈止损），避免 thead/tbody 列数不一致 -->
        <table v-if="variant === 'spot'" class="tcot__table tcot__table--spot" :aria-busy="loading">
          <colgroup>
            <col class="tcot__col-spot tcot__col-spot--time" />
            <col class="tcot__col-spot tcot__col-spot--sym" />
            <col class="tcot__col-spot tcot__col-spot--side" />
            <col class="tcot__col-spot tcot__col-spot--type" />
            <col class="tcot__col-spot tcot__col-spot--price" />
            <col class="tcot__col-spot tcot__col-spot--qty" />
            <col class="tcot__col-spot tcot__col-spot--filled" />
            <col class="tcot__col-spot tcot__col-spot--amt" />
            <col class="tcot__col-spot tcot__col-spot--tpsl" />
            <col class="tcot__col-spot tcot__col-spot--st" />
            <col class="tcot__col-spot tcot__col-spot--act" />
          </colgroup>
          <thead>
            <tr>
              <th scope="col">时间</th>
              <th scope="col">交易对</th>
              <th scope="col">方向</th>
              <th scope="col">类型</th>
              <th scope="col" class="tcot__num-spot">
                <span class="tcot__th-label">价格</span>
                <span v-if="spotQuote" class="tcot__th-unit">{{ spotQuote }}</span>
              </th>
              <th scope="col" class="tcot__num-spot">
                <span class="tcot__th-label">数量</span>
                <span v-if="spotBase" class="tcot__th-unit">{{ spotBase }}</span>
              </th>
              <th scope="col" class="tcot__num-spot">
                <span class="tcot__th-label">已成交</span>
                <span v-if="spotBase" class="tcot__th-unit">{{ spotBase }}</span>
              </th>
              <th scope="col" class="tcot__num-spot">
                <span class="tcot__th-label">金额</span>
                <span v-if="spotQuote" class="tcot__th-unit">{{ spotQuote }}</span>
              </th>
              <th scope="col" class="tcot__cell-tpsl">止盈止损</th>
              <th scope="col">状态</th>
              <th scope="col" class="tcot__act tcot__act--spot">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="o in rows"
              :key="o.orderNo"
              v-memo="rowMemoDeps(o)"
              class="tcot__row"
            >
              <td class="tcot__muted tcot__time">{{ o.timeDisplay }}</td>
              <td class="tcot__sym">{{ o.symbolDisplay }}</td>
              <td>
                <span
                  class="tcot__side"
                  :class="o.side.tone === 'buy' ? 'tcot__side--buy' : 'tcot__side--sell'"
                >
                  {{ o.side.text }}
                </span>
              </td>
              <td>{{ o.typeLabel }}</td>
              <td class="tcot__num-spot ex-num">
                <template v-if="dashOrText(o.priceDisplay) === '--'">--</template>
                <template v-else-if="dashOrText(o.priceDisplay) === '市价'">市价</template>
                <template v-else>
                  <span class="tcot__cell-val">{{ dashOrText(o.priceDisplay) }}</span>
                  <span v-if="spotQuote" class="tcot__cell-unit">&nbsp;{{ spotQuote }}</span>
                </template>
              </td>
              <td class="tcot__num-spot ex-num">
                <template v-if="spotBaseQtyCell(o.quantityDisplay).empty">--</template>
                <template v-else>
                  <span class="tcot__cell-val">{{ spotBaseQtyCell(o.quantityDisplay).num }}</span>
                  <span v-if="spotBase" class="tcot__cell-unit">&nbsp;{{ spotBase }}</span>
                </template>
              </td>
              <td class="tcot__num-spot ex-num">
                <template v-if="spotBaseQtyCell(o.filledDisplay).empty">--</template>
                <template v-else>
                  <span class="tcot__cell-val">{{ spotBaseQtyCell(o.filledDisplay).num }}</span>
                  <span v-if="spotBase" class="tcot__cell-unit">&nbsp;{{ spotBase }}</span>
                </template>
              </td>
              <td class="tcot__num-spot ex-num">
                <template v-if="spotQuoteAmtCell(o.amountDisplay).empty">--</template>
                <template v-else>
                  <span class="tcot__cell-val">{{ spotQuoteAmtCell(o.amountDisplay).num }}</span>
                  <span v-if="spotQuote" class="tcot__cell-unit">&nbsp;{{ spotQuote }}</span>
                </template>
              </td>
              <td class="tcot__muted tcot__cell-tpsl">{{ dashOrText(o.tpSlDisplay) }}</td>
              <td>
                <span class="tcot__pill" :class="`tcot__pill--${o.status.tone}`">
                  {{ o.status.text }}
                </span>
              </td>
              <td class="tcot__act tcot__act--spot">
                <button
                  type="button"
                  class="tcot__btn-cancel"
                  :disabled="loading"
                  @click="onCancel(o.orderNo)"
                >
                  撤单
                </button>
              </td>
            </tr>
            <tr v-if="!rows.length && !loading" class="tcot__empty-row">
              <td :colspan="11" class="tcot__empty">{{ emptyText }}</td>
            </tr>
          </tbody>
        </table>

        <!-- 合约：固定 11 列（与原型：时间→合约→方向→杠杆→类型→价格/仓位数量/已成交(USDT)→保证金模式→状态→操作） -->
        <table v-else class="tcot__table tcot__table--futures" :aria-busy="loading">
          <thead>
            <tr>
              <th>时间</th>
              <th>合约</th>
              <th>方向</th>
              <th>杠杆</th>
              <th>类型</th>
              <th class="tcot__num">
                <span class="tcot__th-label">价格</span>
                <span class="tcot__th-unit">USDT</span>
              </th>
              <th class="tcot__num">
                <span class="tcot__th-label">仓位数量</span>
                <span class="tcot__th-unit">USDT</span>
              </th>
              <th class="tcot__num">
                <span class="tcot__th-label">已成交</span>
                <span class="tcot__th-unit">USDT</span>
              </th>
              <th>保证金模式</th>
              <th>状态</th>
              <th class="tcot__act">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="o in rows"
              :key="o.orderNo"
              v-memo="rowMemoDeps(o)"
              class="tcot__row"
            >
              <td class="tcot__muted tcot__time">{{ o.timeDisplay }}</td>
              <td class="tcot__sym">{{ o.symbolDisplay }}</td>
              <td>
                <span
                  class="tcot__side"
                  :class="o.side.tone === 'buy' ? 'tcot__side--buy' : 'tcot__side--sell'"
                >
                  {{ o.side.text }}
                </span>
              </td>
              <td class="tcot__ro">
                <template v-if="o.futuresExtras">{{ o.futuresExtras.leverageDisplay }}</template>
                <span v-else class="tcot__muted">—</span>
              </td>
              <td>{{ o.typeLabel }}</td>
              <td class="tcot__num ex-num">{{ o.priceDisplay }}</td>
              <td class="tcot__num ex-num">
                <template v-if="o.futuresExtras">{{ o.futuresExtras.positionNotionalDisplay }}</template>
                <span v-else class="tcot__muted">—</span>
              </td>
              <td class="tcot__num ex-num">
                <template v-if="o.futuresExtras">{{ o.futuresExtras.filledNotionalDisplay }}</template>
                <span v-else class="tcot__muted">—</span>
              </td>
              <td class="tcot__ro">
                <template v-if="o.futuresExtras">{{ o.futuresExtras.marginModeDisplay }}</template>
                <span v-else class="tcot__muted">—</span>
              </td>
              <td>
                <span class="tcot__pill" :class="`tcot__pill--${o.status.tone}`">
                  {{ o.status.text }}
                </span>
              </td>
              <td class="tcot__act">
                <button
                  type="button"
                  class="tcot__btn-cancel"
                  :disabled="loading"
                  @click="onCancel(o.orderNo)"
                >
                  撤单
                </button>
              </td>
            </tr>
            <tr v-if="!rows.length && !loading" class="tcot__empty-row">
              <td :colspan="11" class="tcot__empty">{{ emptyText }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="loading" class="tcot__overlay" aria-live="polite" aria-label="加载中">
        <div class="tcot__spinner" />
        <span class="tcot__overlay-text">加载中</span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use 'sass:color';
@use '@/styles/abstracts/variables' as *;

.tcot {
  display: flex;
  flex-direction: column;
  min-height: 0;
  position: relative;
}

.tcot--loading .tcot__scroll {
  pointer-events: none;
  opacity: 0.45;
}

.tcot__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-2;
  padding: $space-2 $space-3;
  background: var(--ex-panel-sunken);
  border-bottom: 1px solid var(--ex-border-subtle);
}

.tcot__toolbar-left {
  display: inline-flex;
  align-items: center;
  gap: $space-2;
  min-width: 0;
}

.tcot__title {
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  color: $color-text-secondary;
  letter-spacing: 0.02em;
}

.tcot__count {
  font-size: 10px;
  font-weight: $font-weight-bold;
  padding: 0 6px;
  border-radius: 8px;
  background: rgba(48, 132, 252, 0.18);
  color: #8ab4ff;
}

.tcot__cancel-all {
  padding: 4px $space-3;
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  color: var(--ex-fall-hover);
  background: rgba(246, 70, 93, 0.1);
  border: 1px solid rgba(246, 70, 93, 0.32);
  border-radius: $radius-sm;
  cursor: pointer;
  transition: border-color 0.12s ease, background 0.12s ease;

  &:hover:not(:disabled) {
    background: rgba(246, 70, 93, 0.16);
    border-color: rgba(246, 70, 93, 0.45);
  }

  &:disabled {
    opacity: 0.38;
    cursor: not-allowed;
  }
}

.tcot__body {
  position: relative;
  min-height: 120px;
}

.tcot__scroll {
  overflow: auto;
  -webkit-overflow-scrolling: touch;
}

.tcot__table {
  width: 100%;
  min-width: 720px;
  table-layout: fixed;
  border-collapse: collapse;
  font-size: $font-size-xs;
}

.tcot__table--spot {
  min-width: 960px;
}

/* 现货 11 列：colgroup 与表头/表体共用宽度，避免滚动容器下列错位 */
.tcot__table--spot col.tcot__col-spot--time {
  width: 10%;
}
.tcot__table--spot col.tcot__col-spot--sym {
  width: 8%;
}
.tcot__table--spot col.tcot__col-spot--side {
  width: 6%;
}
.tcot__table--spot col.tcot__col-spot--type {
  width: 6%;
}
.tcot__table--spot col.tcot__col-spot--price {
  width: 9%;
}
.tcot__table--spot col.tcot__col-spot--qty {
  width: 10%;
}
.tcot__table--spot col.tcot__col-spot--filled {
  width: 10%;
}
.tcot__table--spot col.tcot__col-spot--amt {
  width: 10%;
}
.tcot__table--spot col.tcot__col-spot--tpsl {
  width: 8%;
}
.tcot__table--spot col.tcot__col-spot--st {
  width: 11%;
}
.tcot__table--spot col.tcot__col-spot--act {
  width: 12%;
}

.tcot__table--spot th.tcot__cell-tpsl,
.tcot__table--spot td.tcot__cell-tpsl {
  text-align: center;
}

.tcot__table--spot th.tcot__act--spot,
.tcot__table--spot td.tcot__act--spot {
  text-align: center;
}

.tcot__table--futures {
  min-width: 1040px;
}

/* 合约表：与当前持仓一致，列表字段左对齐 */
.tcot__table--futures td {
  text-align: left;
}

.tcot__table--futures th.tcot__num,
.tcot__table--futures td.tcot__num {
  text-align: left;
}

.tcot__table--futures th.tcot__act,
.tcot__table--futures td.tcot__act {
  text-align: left;
}

.tcot__table th {
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

.tcot__table td {
  padding: $space-2 $space-3;
  border-bottom: 1px solid var(--ex-border-subtle);
  vertical-align: middle;
}

.tcot__row:hover td {
  background: var(--ex-fill-ghost);
}

.tcot__num {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

/* 现货：价格 / 数量 / 已成交 / 金额 — 左对齐，数字与单位分层 */
.tcot__table--spot th.tcot__num-spot,
.tcot__table--spot td.tcot__num-spot {
  text-align: left;
  font-variant-numeric: tabular-nums;
}

.tcot__th-label {
  font-weight: inherit;
}

.tcot__th-unit {
  margin-left: 4px;
  font-size: 10px;
  font-weight: $font-weight-regular;
  color: $color-text-tertiary;
  letter-spacing: 0.02em;
}

.tcot__cell-val {
  font-weight: $font-weight-semibold;
}

.tcot__cell-unit {
  font-size: 10px;
  font-weight: $font-weight-regular;
  color: $color-text-tertiary;
}

.tcot__muted {
  color: $color-text-tertiary;
}

.tcot__time {
  white-space: nowrap;
  font-size: 11px;
}

.tcot__sym {
  font-family: $font-family-mono;
  font-size: 11px;
  color: $color-text-secondary;
}

.tcot__side {
  font-weight: $font-weight-semibold;
}

.tcot__side--buy {
  color: $color-rise;
}

.tcot__side--sell {
  color: $color-fall;
}

.tcot__pos {
  font-weight: $font-weight-bold;
}

.tcot__pos--long {
  color: $color-rise;
}

.tcot__pos--short {
  color: $color-fall;
}

.tcot__ro {
  font-size: 11px;
  color: $color-text-tertiary;
}

.tcot__pill {
  display: inline-flex;
  align-items: center;
  padding: 1px 8px;
  font-size: 10px;
  font-weight: $font-weight-semibold;
  border-radius: 4px;
  border: 1px solid transparent;
  white-space: nowrap;
}

.tcot__pill--working {
  color: #8ab4ff;
  background: rgba(48, 132, 252, 0.12);
  border-color: rgba(48, 132, 252, 0.28);
}

.tcot__pill--partial {
  color: #f0b90b;
  background: rgba(240, 185, 11, 0.1);
  border-color: rgba(240, 185, 11, 0.28);
}

.tcot__pill--pending {
  color: #a78bfa;
  background: rgba(139, 92, 246, 0.12);
  border-color: rgba(139, 92, 246, 0.28);
}

.tcot__pill--muted {
  color: $color-text-tertiary;
  background: var(--ex-fill-ghost);
  border-color: var(--ex-border);
}

.tcot__act {
  text-align: right;
  white-space: nowrap;
}

.tcot__btn-cancel {
  padding: 3px $space-2;
  font-size: 10px;
  font-weight: $font-weight-semibold;
  letter-spacing: 0.02em;
  color: $color-text-secondary;
  background: var(--ex-fill-hover-subtle);
  border: 1px solid var(--ex-border-strong);
  border-radius: $radius-sm;
  cursor: pointer;
  transition:
    color 0.12s ease,
    border-color 0.12s ease,
    background 0.12s ease;

  &:hover:not(:disabled) {
    color: var(--ex-fall-hover);
    border-color: rgba(246, 70, 93, 0.4);
    background: rgba(246, 70, 93, 0.08);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

.tcot__empty-row .tcot__empty {
  text-align: center;
  padding: $space-8 $space-4 !important;
  color: $color-text-tertiary;
  font-size: $font-size-xs;
}

.tcot__overlay {
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

.tcot__spinner {
  width: 22px;
  height: 22px;
  border: 2px solid var(--ex-border-strong);
  border-top-color: rgba(48, 132, 252, 0.85);
  border-radius: 50%;
  animation: tcot-spin 0.7s linear infinite;
}

.tcot__overlay-text {
  font-size: 11px;
  color: $color-text-tertiary;
}

@keyframes tcot-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
