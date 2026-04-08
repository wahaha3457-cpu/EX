<script setup lang="ts">
/** 现货成交记录：工具条与表格列与「当前委托」现货表左对齐、单位展示一致 */
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useSpotTradeStore } from '@/stores/spotTrade'
import { formatOrderQty, formatPrice } from '@/utils/format/number'
import { formatPairSymbol, spotOrderTypeLabel } from '@/utils/order/orderDisplay'
import type { SpotFillRow } from '@/types/spotTrade'

const store = useSpotTradeStore()
const { fills, loading } = storeToRefs(store)

const spotBase = computed(() => store.baseAsset)
const spotQuote = computed(() => store.quoteAsset)

function timeCell(iso: string) {
  try {
    return new Date(iso).toLocaleString('zh-CN', { hour12: false })
  } catch {
    return iso
  }
}

function pairLabel(f: SpotFillRow): string {
  return formatPairSymbol(f.symbol?.trim() || store.symbol)
}

function fillTypeLabel(f: SpotFillRow): string {
  return f.orderType ? spotOrderTypeLabel(f.orderType) : '--'
}

function roleText(isMaker: boolean): string {
  return isMaker ? 'Maker' : 'Taker'
}

/** 成交额：优先接口 quoteAmount，否则 成交价×成交量 */
function fillTurnoverCell(f: SpotFillRow): { empty: boolean; text: string } {
  const qa = f.quoteAmount
  const n =
    qa != null && Number.isFinite(qa) && qa > 0
      ? qa
      : (() => {
          const x = f.price * f.quantity
          return Number.isFinite(x) && x > 0 ? x : NaN
        })()
  if (!Number.isFinite(n) || n <= 0) return { empty: true, text: '' }
  return { empty: false, text: formatPrice(n) }
}
</script>

<template>
  <div class="sft" :class="{ 'sft--loading': loading }">
    <div class="sft__toolbar">
      <div class="sft__toolbar-left">
        <span class="sft__title">成交记录</span>
        <span v-if="fills.length" class="sft__count">{{ fills.length }}</span>
      </div>
    </div>

    <div class="sft__body">
      <div class="sft__scroll">
        <table class="sft__table" :aria-busy="loading">
          <colgroup>
            <col class="sft__col sft__col--time" />
            <col class="sft__col sft__col--sym" />
            <col class="sft__col sft__col--side" />
            <col class="sft__col sft__col--type" />
            <col class="sft__col sft__col--price" />
            <col class="sft__col sft__col--qty" />
            <col class="sft__col sft__col--turnover" />
            <col class="sft__col sft__col--fee" />
            <col class="sft__col sft__col--role" />
          </colgroup>
          <thead>
            <tr>
              <th scope="col">时间</th>
              <th scope="col">交易对</th>
              <th scope="col">方向</th>
              <th scope="col">类型</th>
              <th scope="col" class="sft__num">
                <span class="sft__th-label">成交价</span>
                <span v-if="spotQuote" class="sft__th-unit">{{ spotQuote }}</span>
              </th>
              <th scope="col" class="sft__num">
                <span class="sft__th-label">成交量</span>
                <span v-if="spotBase" class="sft__th-unit">{{ spotBase }}</span>
              </th>
              <th scope="col" class="sft__num">
                <span class="sft__th-label">成交额</span>
                <span v-if="spotQuote" class="sft__th-unit">{{ spotQuote }}</span>
              </th>
              <th scope="col" class="sft__num">
                <span class="sft__th-label">手续费</span>
              </th>
              <th scope="col">角色</th>
            </tr>
          </thead>
          <tbody>
            <template v-if="fills.length">
              <tr v-for="f in fills" :key="f.tradeId" class="sft__row">
                <td class="sft__muted sft__time">{{ timeCell(f.time) }}</td>
                <td class="sft__sym">{{ pairLabel(f) }}</td>
                <td>
                  <span v-if="f.side === 'BUY'" class="sft__side sft__side--buy">买入</span>
                  <span v-else-if="f.side === 'SELL'" class="sft__side sft__side--sell">卖出</span>
                  <span v-else class="sft__muted">--</span>
                </td>
                <td>{{ fillTypeLabel(f) }}</td>
                <td class="sft__num ex-num">
                  <span class="sft__cell-val">{{ formatPrice(f.price) }}</span>
                  <span v-if="spotQuote" class="sft__cell-unit">&nbsp;{{ spotQuote }}</span>
                </td>
                <td class="sft__num ex-num">
                  <span class="sft__cell-val">{{ formatOrderQty(f.quantity) }}</span>
                  <span v-if="spotBase" class="sft__cell-unit">&nbsp;{{ spotBase }}</span>
                </td>
                <td class="sft__num ex-num">
                  <template v-if="fillTurnoverCell(f).empty">
                    <span class="sft__muted">--</span>
                  </template>
                  <template v-else>
                    <span class="sft__cell-val">{{ fillTurnoverCell(f).text }}</span>
                    <span v-if="spotQuote" class="sft__cell-unit">&nbsp;{{ spotQuote }}</span>
                  </template>
                </td>
                <td class="sft__num ex-num">
                  <span class="sft__cell-val">{{ formatPrice(f.fee) }}</span>
                  <span v-if="f.feeCoin" class="sft__cell-unit">&nbsp;{{ f.feeCoin }}</span>
                </td>
                <td class="sft__muted">{{ roleText(f.isMaker) }}</td>
              </tr>
            </template>
            <tr v-else>
              <td colspan="9" class="sft__empty">暂无成交记录</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="loading" class="sft__overlay" aria-live="polite" aria-label="加载中">
        <div class="sft__spinner" />
        <span class="sft__overlay-text">加载中</span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.sft {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  position: relative;
}

.sft--loading .sft__scroll {
  pointer-events: none;
  opacity: 0.45;
}

.sft__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-2;
  padding: $space-2 $space-3;
  background: var(--ex-panel-sunken);
  border-bottom: 1px solid var(--ex-border-subtle);
  min-height: 36px;
}

.sft__toolbar-left {
  display: inline-flex;
  align-items: center;
  gap: $space-2;
  min-width: 0;
}

.sft__title {
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  color: $color-text-secondary;
  letter-spacing: 0.02em;
}

.sft__count {
  font-size: 10px;
  font-weight: $font-weight-bold;
  padding: 0 6px;
  border-radius: 8px;
  background: rgba(48, 132, 252, 0.18);
  color: #8ab4ff;
}

.sft__body {
  position: relative;
  min-height: 120px;
}

.sft__scroll {
  overflow: auto;
  max-height: min(320px, 42vh);
  -webkit-overflow-scrolling: touch;
}

.sft__table {
  width: 100%;
  min-width: 880px;
  table-layout: fixed;
  border-collapse: collapse;
  font-size: $font-size-xs;
}

.sft__col--time {
  width: 11%;
}
.sft__col--sym {
  width: 8%;
}
.sft__col--side {
  width: 6%;
}
.sft__col--type {
  width: 6%;
}
.sft__col--price {
  width: 12%;
}
.sft__col--qty {
  width: 12%;
}
.sft__col--turnover {
  width: 13%;
}
.sft__col--fee {
  width: 16%;
}
.sft__col--role {
  width: 14%;
}

.sft__table th {
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

.sft__table td {
  padding: $space-2 $space-3;
  border-bottom: 1px solid var(--ex-border-subtle);
  vertical-align: middle;
}

.sft__row:hover td {
  background: var(--ex-fill-ghost);
}

.sft__num {
  text-align: left;
  font-variant-numeric: tabular-nums;
}

.sft__th-label {
  font-weight: inherit;
}

.sft__th-unit {
  margin-left: 4px;
  font-size: 10px;
  font-weight: $font-weight-regular;
  color: $color-text-tertiary;
  letter-spacing: 0.02em;
}

.sft__cell-val {
  font-weight: $font-weight-semibold;
}

.sft__cell-unit {
  font-size: 10px;
  font-weight: $font-weight-regular;
  color: $color-text-tertiary;
}

.sft__muted {
  color: $color-text-tertiary;
}

.sft__time {
  white-space: nowrap;
  font-size: 11px;
}

.sft__sym {
  font-family: $font-family-mono;
  font-size: 11px;
  color: $color-text-secondary;
}

.sft__side {
  font-weight: $font-weight-semibold;
}

.sft__side--buy {
  color: $color-rise;
}

.sft__side--sell {
  color: $color-fall;
}

.sft__empty {
  text-align: center;
  padding: $space-8 $space-4 !important;
  color: $color-text-tertiary;
}

.sft__overlay {
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

.sft__spinner {
  width: 22px;
  height: 22px;
  border: 2px solid var(--ex-border-strong);
  border-top-color: rgba(48, 132, 252, 0.85);
  border-radius: 50%;
  animation: sft-spin 0.7s linear infinite;
}

.sft__overlay-text {
  font-size: 11px;
  color: $color-text-tertiary;
}

@keyframes sft-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
