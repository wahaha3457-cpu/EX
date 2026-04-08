<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useDeliveryTradeStore } from '@/stores/deliveryTrade'
import type { FuturesFillRow } from '@/types/futuresTrade'
import { formatPrice } from '@/utils/format/number'
import {
  formatPairSymbol,
  futuresOrderTypeLabel,
  orderSideText,
  positionSideText,
} from '@/utils/order/orderDisplay'

const store = useDeliveryTradeStore()
const { fills, instrument } = storeToRefs(store)

/** 线性 USDT 合约：成交名义价值 = 价 × 张数 × 合约面值，列表统一按 USDT 展示 */
const contractSizeBase = computed(() => instrument.value?.contractSizeBase ?? 0)

function fillNotionalUsdt(f: FuturesFillRow): string {
  const cs = contractSizeBase.value
  if (!(cs > 0) || !Number.isFinite(f.price) || !Number.isFinite(f.quantity)) return '—'
  return formatPrice(f.price * f.quantity * cs)
}

function timeCell(iso: string) {
  try {
    return new Date(iso).toLocaleString('zh-CN', { hour12: false })
  } catch {
    return iso
  }
}

function fillKindLabel(f: FuturesFillRow): string {
  if (f.fillKind === 'OPEN') return '开仓'
  if (f.fillKind === 'CLOSE') return '平仓'
  return '—'
}

function pairCell(f: FuturesFillRow): string {
  if (!f.symbol?.trim()) return '—'
  return formatPairSymbol(f.symbol)
}

function directionCell(f: FuturesFillRow): string {
  if (f.orderSide && f.positionSide) {
    return `${orderSideText(f.orderSide)} · ${positionSideText(f.positionSide)}`
  }
  return '—'
}

function leverageCell(f: FuturesFillRow): string {
  if (f.leverage != null && Number.isFinite(f.leverage) && f.leverage > 0) {
    return `${Math.round(f.leverage)}x`
  }
  return '—'
}

function orderTypeCell(f: FuturesFillRow): string {
  if (!f.orderType) return '—'
  return futuresOrderTypeLabel(f.orderType)
}

const COL_COUNT = 12
</script>

<template>
  <div class="ctht-wrap">
    <table class="ctht" aria-label="成交记录">
      <thead>
        <tr>
          <th>成交时间</th>
          <th>类型</th>
          <th>交易对</th>
          <th>方向</th>
          <th>杠杆</th>
          <th>委托类型</th>
          <th>订单号</th>
          <th class="ctht__cell-left">成交价 <span class="ctht__u">(USDT)</span></th>
          <th class="ctht__cell-left">成交数量 <span class="ctht__u">(USDT)</span></th>
          <th class="ctht__cell-left">手续费 <span class="ctht__u">(USDT)</span></th>
          <th class="ctht__cell-left">已实现盈亏 <span class="ctht__u">(USDT)</span></th>
          <th class="ctht__cell-left">角色</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="f in fills" :key="f.tradeId">
          <td class="ctht__muted">{{ timeCell(f.time) }}</td>
          <td>{{ fillKindLabel(f) }}</td>
          <td class="ctht__sym">{{ pairCell(f) }}</td>
          <td>
            <span
              v-if="f.orderSide && f.positionSide"
              class="ctht__dir"
              :class="
                f.positionSide === 'LONG' ? 'ctht__dir--long' : 'ctht__dir--short'
              "
            >
              {{ directionCell(f) }}
            </span>
            <span v-else class="ctht__muted">—</span>
          </td>
          <td>{{ leverageCell(f) }}</td>
          <td>{{ orderTypeCell(f) }}</td>
          <td class="ctht__mono">{{ f.orderNo }}</td>
          <td class="ctht__cell-left ex-num">{{ formatPrice(f.price) }}</td>
          <td class="ctht__cell-left ex-num">{{ fillNotionalUsdt(f) }}</td>
          <td class="ctht__cell-left ex-num">{{ formatPrice(f.fee) }}</td>
          <td
            class="ctht__cell-left ex-num"
            :class="f.realizedPnl >= 0 ? 'ctht__pnl--gain' : 'ctht__pnl--loss'"
          >
            {{ formatPrice(f.realizedPnl) }}
          </td>
          <td class="ctht__cell-left">{{ f.isMaker ? 'Maker' : 'Taker' }}</td>
        </tr>
        <tr v-if="!fills.length">
          <td :colspan="COL_COUNT" class="ctht__empty">暂无成交记录</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.ctht-wrap {
  overflow: auto;
  max-height: min(360px, 42vh);
}

.ctht {
  width: 100%;
  min-width: 920px;
  border-collapse: collapse;
  font-size: $font-size-xs;
}

.ctht th {
  position: sticky;
  top: 0;
  padding: $space-2 $space-3;
  text-align: left;
  font-weight: $font-weight-semibold;
  color: $color-text-tertiary;
  background: $color-bg-surface;
  border-bottom: 1px solid $color-border;
  white-space: nowrap;
}

.ctht td {
  padding: $space-2 $space-3;
  border-bottom: 1px solid var(--ex-border-subtle);
  vertical-align: middle;
}

.ctht tbody tr:hover td {
  background: var(--ex-fill-ghost);
}

/** 交割成交记录：数值与角色与左侧文案一致左对齐（对齐现货表） */
.ctht__cell-left {
  text-align: left;
  font-variant-numeric: tabular-nums;
}

.ctht__u {
  font-weight: $font-weight-regular;
  color: $color-text-tertiary;
  opacity: 0.88;
}

.ctht__muted {
  color: $color-text-tertiary;
  white-space: nowrap;
}

.ctht__sym {
  font-family: $font-family-mono;
  font-size: 11px;
  font-weight: $font-weight-semibold;
  color: $color-text-secondary;
}

.ctht__mono {
  font-family: $font-family-mono;
  font-size: 10px;
}

.ctht__dir {
  font-size: 11px;
  font-weight: $font-weight-semibold;
}

.ctht__dir--long {
  color: $color-rise;
}

.ctht__dir--short {
  color: $color-fall;
}

.ctht__pnl--gain {
  color: $color-rise;
}

.ctht__pnl--loss {
  color: $color-fall;
}

.ctht__empty {
  text-align: center;
  padding: $space-6 !important;
  color: $color-text-tertiary;
}
</style>
