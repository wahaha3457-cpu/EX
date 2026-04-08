<script setup lang="ts">
/**
 * 历史委托表格 — 现货/合约共用；现货列顺序与左对齐与「当前委托」现货表一致
 */
import { computed } from 'vue'
import type {
  OrderHistoryPaginationMeta,
  OrderHistoryTableRow,
  OrderHistoryTableVariant,
} from '@/types/orderHistoryTable'

const props = withDefaults(
  defineProps<{
    variant: OrderHistoryTableVariant
    rows: OrderHistoryTableRow[]
    loading?: boolean
    emptyText?: string
    toolbarTitle?: string
    maxHeight?: string
    /** 现货：与当前委托表一致的数量列单位（如 BTC） */
    spotBaseAsset?: string
    /** 现货：价格/均价列单位（如 USDT） */
    spotQuoteAsset?: string
    /** 传入则显示底部分页摘要，便于后续接页码按钮与接口 */
    pagination?: OrderHistoryPaginationMeta | null
  }>(),
  {
    loading: false,
    emptyText: '暂无历史委托',
    toolbarTitle: '历史委托',
    maxHeight: 'min(320px, 42vh)',
    pagination: null,
    spotBaseAsset: '',
    spotQuoteAsset: '',
  },
)

const colSpan = computed(() => (props.variant === 'futures' ? 12 : 11))

const scrollStyle = computed(() => ({ maxHeight: props.maxHeight }))

const totalPages = computed(() => {
  const p = props.pagination
  if (!p || p.pageSize <= 0) return 1
  return Math.max(1, Math.ceil(p.total / p.pageSize))
})

const spotBase = computed(() => (props.spotBaseAsset ?? '').trim())
const spotQuote = computed(() => (props.spotQuoteAsset ?? '').trim())

function rowMemoDeps(o: OrderHistoryTableRow): unknown[] {
  return [
    o.orderNo,
    o.typeLabel,
    o.priceDisplay,
    o.quantityDisplay,
    o.avgFillDisplay,
    o.filledVolumeDisplay,
    o.status.text,
    o.status.tone,
    o.timeDisplay,
    o.futuresExtras?.positionSide.text,
    o.futuresExtras?.leverageDisplay,
    o.futuresExtras?.marginModeDisplay,
    o.futuresExtras?.positionNotionalDisplay,
    o.futuresExtras?.filledNotionalDisplay,
    o.turnoverDisplay,
    o.tpSlDisplay,
    props.spotBaseAsset,
    props.spotQuoteAsset,
  ]
}

/** 与当前委托表一致：空值与旧版破折号统一为「--」 */
function dashOrText(v: string | undefined | null): string {
  const s = String(v ?? '').trim()
  if (s === '' || s === '—' || s === '–' || s === '-') return '--'
  return s
}

function spotBaseQtyCell(raw: string | undefined | null): { empty: boolean; num: string } {
  const t = dashOrText(raw)
  if (t === '--') return { empty: true, num: '' }
  return { empty: false, num: t }
}

function spotQuotePxCell(raw: string | undefined | null): { empty: boolean; num: string } {
  const t = dashOrText(raw)
  if (t === '--') return { empty: true, num: '' }
  return { empty: false, num: t }
}
</script>

<template>
  <div class="toht" :class="{ 'toht--loading': loading }">
    <div class="toht__toolbar">
      <div class="toht__toolbar-left">
        <span class="toht__title">{{ toolbarTitle }}</span>
        <span v-if="variant === 'spot' && rows.length" class="toht__count">{{ rows.length }}</span>
        <span v-if="pagination" class="toht__meta">共 {{ pagination.total }} 条</span>
      </div>
      <div class="toht__toolbar-right">
        <div class="toht__filters">
          <slot name="filters" />
        </div>
      </div>
    </div>

    <div class="toht__body">
      <div class="toht__scroll" :style="scrollStyle">
        <!-- 现货：列顺序与当前委托一致（时间→交易对→方向→类型→价量→状态） -->
        <table
          v-if="variant === 'spot'"
          class="toht__table toht__table--spot"
          :aria-busy="loading"
        >
          <colgroup>
            <col class="toht__col-spot toht__col-spot--time" />
            <col class="toht__col-spot toht__col-spot--sym" />
            <col class="toht__col-spot toht__col-spot--side" />
            <col class="toht__col-spot toht__col-spot--type" />
            <col class="toht__col-spot toht__col-spot--price" />
            <col class="toht__col-spot toht__col-spot--qty" />
            <col class="toht__col-spot toht__col-spot--filled" />
            <col class="toht__col-spot toht__col-spot--avg" />
            <col class="toht__col-spot toht__col-spot--turnover" />
            <col class="toht__col-spot toht__col-spot--tpsl" />
            <col class="toht__col-spot toht__col-spot--st" />
          </colgroup>
          <thead>
            <tr>
              <th scope="col">时间</th>
              <th scope="col">交易对</th>
              <th scope="col">方向</th>
              <th scope="col">类型</th>
              <th scope="col" class="toht__num-spot">
                <span class="toht__th-label">价格</span>
                <span v-if="spotQuote" class="toht__th-unit">{{ spotQuote }}</span>
              </th>
              <th scope="col" class="toht__num-spot">
                <span class="toht__th-label">数量</span>
                <span v-if="spotBase" class="toht__th-unit">{{ spotBase }}</span>
              </th>
              <th scope="col" class="toht__num-spot">
                <span class="toht__th-label">已成交</span>
                <span v-if="spotBase" class="toht__th-unit">{{ spotBase }}</span>
              </th>
              <th scope="col" class="toht__num-spot">
                <span class="toht__th-label">成交均价</span>
                <span v-if="spotQuote" class="toht__th-unit">{{ spotQuote }}</span>
              </th>
              <th scope="col" class="toht__num-spot">
                <span class="toht__th-label">成交额</span>
                <span v-if="spotQuote" class="toht__th-unit">{{ spotQuote }}</span>
              </th>
              <th scope="col" class="toht__cell-tpsl">止盈止损</th>
              <th scope="col">状态</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="o in rows"
              :key="o.orderNo"
              v-memo="rowMemoDeps(o)"
              class="toht__row"
            >
              <td class="toht__muted toht__time">{{ o.timeDisplay }}</td>
              <td class="toht__sym">{{ o.symbolDisplay }}</td>
              <td>
                <span
                  class="toht__side"
                  :class="o.side.tone === 'buy' ? 'toht__side--buy' : 'toht__side--sell'"
                >
                  {{ o.side.text }}
                </span>
              </td>
              <td>{{ o.typeLabel }}</td>
              <td class="toht__num-spot ex-num">
                <template v-if="dashOrText(o.priceDisplay) === '--'">--</template>
                <template v-else-if="dashOrText(o.priceDisplay) === '市价'">市价</template>
                <template v-else>
                  <span class="toht__cell-val">{{ dashOrText(o.priceDisplay) }}</span>
                  <span v-if="spotQuote" class="toht__cell-unit">&nbsp;{{ spotQuote }}</span>
                </template>
              </td>
              <td class="toht__num-spot ex-num">
                <template v-if="spotBaseQtyCell(o.quantityDisplay).empty">--</template>
                <template v-else>
                  <span class="toht__cell-val">{{ spotBaseQtyCell(o.quantityDisplay).num }}</span>
                  <span v-if="spotBase" class="toht__cell-unit">&nbsp;{{ spotBase }}</span>
                </template>
              </td>
              <td class="toht__num-spot ex-num">
                <template v-if="spotBaseQtyCell(o.filledVolumeDisplay).empty">--</template>
                <template v-else>
                  <span class="toht__cell-val">{{ spotBaseQtyCell(o.filledVolumeDisplay).num }}</span>
                  <span v-if="spotBase" class="toht__cell-unit">&nbsp;{{ spotBase }}</span>
                </template>
              </td>
              <td class="toht__num-spot ex-num">
                <template v-if="spotQuotePxCell(o.avgFillDisplay).empty">--</template>
                <template v-else>
                  <span class="toht__cell-val">{{ spotQuotePxCell(o.avgFillDisplay).num }}</span>
                  <span v-if="spotQuote" class="toht__cell-unit">&nbsp;{{ spotQuote }}</span>
                </template>
              </td>
              <td class="toht__num-spot ex-num">
                <template v-if="spotQuotePxCell(o.turnoverDisplay).empty">--</template>
                <template v-else>
                  <span class="toht__cell-val">{{ spotQuotePxCell(o.turnoverDisplay).num }}</span>
                  <span v-if="spotQuote" class="toht__cell-unit">&nbsp;{{ spotQuote }}</span>
                </template>
              </td>
              <td class="toht__muted toht__cell-tpsl">{{ dashOrText(o.tpSlDisplay) }}</td>
              <td>
                <span class="toht__pill" :class="`toht__pill--${o.status.tone}`">
                  {{ o.status.text }}
                </span>
              </td>
            </tr>
            <tr v-if="!rows.length && !loading" class="toht__empty-row">
              <td :colspan="colSpan" class="toht__empty">{{ emptyText }}</td>
            </tr>
          </tbody>
        </table>

        <!-- 合约：列顺序与永续「当前委托」对齐（时间→合约→方向→杠杆→类型→价格/仓位数量/已成交 USDT→保证金模式→成交均价→成交量→状态） -->
        <table v-else class="toht__table toht__table--futures" :aria-busy="loading">
          <thead>
            <tr>
              <th class="toht__time">时间</th>
              <th>合约</th>
              <th>方向</th>
              <th>杠杆</th>
              <th>类型</th>
              <th class="toht__num">
                <span class="toht__th-label">价格</span>
                <span class="toht__th-unit">USDT</span>
              </th>
              <th class="toht__num">
                <span class="toht__th-label">仓位数量</span>
                <span class="toht__th-unit">USDT</span>
              </th>
              <th class="toht__num">
                <span class="toht__th-label">已成交</span>
                <span class="toht__th-unit">USDT</span>
              </th>
              <th>保证金模式</th>
              <th class="toht__num">
                <span class="toht__th-label">成交均价</span>
                <span class="toht__th-unit">USDT</span>
              </th>
              <th class="toht__num">成交量</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="o in rows"
              :key="o.orderNo"
              v-memo="rowMemoDeps(o)"
              class="toht__row"
            >
              <td class="toht__muted toht__time">{{ o.timeDisplay }}</td>
              <td class="toht__sym">{{ o.symbolDisplay }}</td>
              <td>
                <span
                  class="toht__side"
                  :class="o.side.tone === 'buy' ? 'toht__side--buy' : 'toht__side--sell'"
                >
                  {{ o.side.text }}
                </span>
              </td>
              <td>
                <template v-if="o.futuresExtras">{{ o.futuresExtras.leverageDisplay }}</template>
                <span v-else class="toht__muted">—</span>
              </td>
              <td>{{ o.typeLabel }}</td>
              <td class="toht__num ex-num">{{ o.priceDisplay }}</td>
              <td class="toht__num ex-num">
                <template v-if="o.futuresExtras">{{ o.futuresExtras.positionNotionalDisplay }}</template>
                <span v-else class="toht__muted">—</span>
              </td>
              <td class="toht__num ex-num">
                <template v-if="o.futuresExtras">{{ o.futuresExtras.filledNotionalDisplay }}</template>
                <span v-else class="toht__muted">—</span>
              </td>
              <td>
                <template v-if="o.futuresExtras">{{ o.futuresExtras.marginModeDisplay }}</template>
                <span v-else class="toht__muted">—</span>
              </td>
              <td class="toht__num ex-num">{{ o.avgFillDisplay }}</td>
              <td class="toht__num ex-num">{{ o.filledVolumeDisplay }}</td>
              <td>
                <span class="toht__pill" :class="`toht__pill--${o.status.tone}`">
                  {{ o.status.text }}
                </span>
              </td>
            </tr>
            <tr v-if="!rows.length && !loading" class="toht__empty-row">
              <td :colspan="colSpan" class="toht__empty">{{ emptyText }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="loading" class="toht__overlay" aria-live="polite" aria-label="加载中">
        <div class="toht__spinner" />
        <span class="toht__overlay-text">加载中</span>
      </div>
    </div>

    <div v-if="pagination && pagination.total > 0" class="toht__footer">
      <span class="toht__footer-text">
        第 {{ pagination.page }} / {{ totalPages }} 页 · 每页 {{ pagination.pageSize }} 条
      </span>
      <div class="toht__footer-actions">
        <slot name="pagination" :meta="pagination" :total-pages="totalPages" />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.toht {
  display: flex;
  flex-direction: column;
  min-height: 0;
  position: relative;
}

.toht--loading .toht__scroll {
  pointer-events: none;
  opacity: 0.45;
}

.toht__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-2;
  padding: $space-2 $space-3;
  background: var(--ex-panel-sunken);
  border-bottom: 1px solid var(--ex-border-subtle);
  min-height: 36px;
}

.toht__toolbar-left {
  display: inline-flex;
  align-items: center;
  gap: $space-2;
  min-width: 0;
}

.toht__title {
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  color: $color-text-secondary;
  letter-spacing: 0.02em;
}

.toht__count {
  font-size: 10px;
  font-weight: $font-weight-bold;
  padding: 0 6px;
  border-radius: 8px;
  background: rgba(48, 132, 252, 0.18);
  color: #8ab4ff;
}

.toht__meta {
  font-size: 10px;
  color: $color-text-tertiary;
}

.toht__filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: $space-2;
  min-height: 24px;
}

.toht__body {
  position: relative;
  min-height: 120px;
}

.toht__scroll {
  overflow: auto;
  -webkit-overflow-scrolling: touch;
}

.toht__table {
  width: 100%;
  border-collapse: collapse;
  font-size: $font-size-xs;
}

.toht__table--futures {
  min-width: 1200px;
}

.toht__table--spot {
  min-width: 1040px;
  table-layout: fixed;
}

.toht__table--spot col.toht__col-spot--time {
  width: 12%;
}
.toht__table--spot col.toht__col-spot--sym {
  width: 9%;
}
.toht__table--spot col.toht__col-spot--side {
  width: 6%;
}
.toht__table--spot col.toht__col-spot--type {
  width: 6%;
}
.toht__table--spot col.toht__col-spot--price {
  width: 11%;
}
.toht__table--spot col.toht__col-spot--qty {
  width: 11%;
}
.toht__table--spot col.toht__col-spot--filled {
  width: 11%;
}
.toht__table--spot col.toht__col-spot--avg {
  width: 10%;
}
.toht__table--spot col.toht__col-spot--turnover {
  width: 10%;
}
.toht__table--spot col.toht__col-spot--tpsl {
  width: 8%;
}
.toht__table--spot col.toht__col-spot--st {
  width: 10%;
}

.toht__table--spot th.toht__cell-tpsl,
.toht__table--spot td.toht__cell-tpsl {
  text-align: center;
}

.toht__table--spot th.toht__num-spot,
.toht__table--spot td.toht__num-spot {
  text-align: left;
  font-variant-numeric: tabular-nums;
}

.toht__th-label {
  font-weight: inherit;
}

.toht__th-unit {
  margin-left: 4px;
  font-size: 10px;
  font-weight: $font-weight-regular;
  color: $color-text-tertiary;
  letter-spacing: 0.02em;
}

.toht__cell-val {
  font-weight: $font-weight-semibold;
}

.toht__cell-unit {
  font-size: 10px;
  font-weight: $font-weight-regular;
  color: $color-text-tertiary;
}

.toht__table th {
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

.toht__table td {
  padding: $space-2 $space-3;
  border-bottom: 1px solid var(--ex-border-subtle);
  vertical-align: middle;
}

.toht__row:hover td {
  background: var(--ex-fill-ghost);
}

.toht__num {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

/* 合约表（永续/交割共用 variant=futures）：与当前持仓一致，列表字段左对齐 */
.toht__table--futures td {
  text-align: left;
}

.toht__table--futures th.toht__num,
.toht__table--futures td.toht__num {
  text-align: left;
}

.toht__sym {
  font-family: $font-family-mono;
  font-size: 11px;
  color: $color-text-secondary;
}

.toht__side {
  font-weight: $font-weight-semibold;
}

.toht__side--buy {
  color: $color-rise;
}

.toht__side--sell {
  color: $color-fall;
}

.toht__pos {
  font-weight: $font-weight-bold;
}

.toht__pos--long {
  color: $color-rise;
}

.toht__pos--short {
  color: $color-fall;
}

.toht__muted {
  color: $color-text-tertiary;
}

.toht__time {
  white-space: nowrap;
  font-size: 11px;
}

.toht__pill {
  display: inline-flex;
  align-items: center;
  padding: 1px 8px;
  font-size: 10px;
  font-weight: $font-weight-semibold;
  border-radius: 4px;
  border: 1px solid transparent;
  white-space: nowrap;
}

.toht__pill--success {
  color: #0ecb81;
  background: rgba(14, 203, 129, 0.1);
  border-color: rgba(14, 203, 129, 0.28);
}

.toht__pill--partial {
  color: #f0b90b;
  background: rgba(240, 185, 11, 0.1);
  border-color: rgba(240, 185, 11, 0.28);
}

.toht__pill--pending {
  color: #a78bfa;
  background: rgba(139, 92, 246, 0.12);
  border-color: rgba(139, 92, 246, 0.28);
}

.toht__pill--muted {
  color: $color-text-tertiary;
  background: var(--ex-fill-ghost);
  border-color: var(--ex-border);
}

.toht__pill--danger {
  color: $color-fall;
  background: rgba(246, 70, 93, 0.1);
  border-color: rgba(246, 70, 93, 0.28);
}

.toht__empty-row .toht__empty {
  text-align: center;
  padding: $space-8 $space-4 !important;
  color: $color-text-tertiary;
  font-size: $font-size-xs;
}

.toht__overlay {
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

.toht__spinner {
  width: 22px;
  height: 22px;
  border: 2px solid var(--ex-border-strong);
  border-top-color: rgba(48, 132, 252, 0.85);
  border-radius: 50%;
  animation: toht-spin 0.7s linear infinite;
}

.toht__overlay-text {
  font-size: 11px;
  color: $color-text-tertiary;
}

@keyframes toht-spin {
  to {
    transform: rotate(360deg);
  }
}

.toht__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: $space-2;
  padding: $space-2 $space-3;
  border-top: 1px solid var(--ex-border-subtle);
  background: var(--ex-panel-sunken);
}

.toht__footer-text {
  font-size: 10px;
  color: $color-text-tertiary;
}

.toht__footer-actions {
  display: flex;
  align-items: center;
  gap: $space-1;
}
</style>
