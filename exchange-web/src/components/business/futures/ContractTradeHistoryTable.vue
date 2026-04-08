<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useFuturesTradeStore } from '@/stores/futuresTrade'
import { buildFuturesFillTradeHistoryView } from '@/composables/futures/futuresFillTradeHistoryView'

const store = useFuturesTradeStore()
const { fills, positions, instrument, symbol } = storeToRefs(store)

const rows = computed(() =>
  fills.value.map((f) =>
    buildFuturesFillTradeHistoryView(f, {
      positions: positions.value,
      instrument: instrument.value,
      defaultSymbol: symbol.value,
    }),
  ),
)
</script>

<template>
  <div class="ctht-root">
    <div class="ctht-wrap">
      <table class="ctht" aria-label="成交记录">
        <thead>
          <tr>
            <th>成交时间</th>
            <th>订单号</th>
            <th>合约</th>
            <th>杠杆</th>
            <th>方向</th>
            <th>类型</th>
            <th>收益率</th>
            <th>保证金模式</th>
            <th>强平价</th>
            <th class="ctht__num">
              <span class="ctht__th-label">开仓均价</span>
              <span class="ctht__th-unit">USDT</span>
            </th>
            <th class="ctht__num">
              <span class="ctht__th-label">成交量</span>
              <span class="ctht__th-unit">USDT</span>
            </th>
            <th class="ctht__num">
              <span class="ctht__th-label">手续费</span>
              <span class="ctht__th-unit">USDT</span>
            </th>
            <th class="ctht__num">
              <span class="ctht__th-label">已实现盈亏</span>
              <span class="ctht__th-unit">USDT</span>
            </th>
            <th>角色</th>
          </tr>
        </thead>
        <tbody>
          <template v-if="rows.length">
            <tr v-for="r in rows" :key="r.tradeId">
              <td class="ctht__muted">{{ r.timeLabel }}</td>
              <td class="ctht__mono">{{ r.orderNo }}</td>
              <td class="ctht__sym">{{ r.symbolDisplay }}</td>
              <td class="ctht__meta">{{ r.leverageDisplay }}</td>
              <td>
                <span v-if="r.sideLabel === '买入'" class="ctht__side ctht__side--buy">买入</span>
                <span v-else-if="r.sideLabel === '卖出'" class="ctht__side ctht__side--sell">卖出</span>
                <span v-else class="ctht__muted">{{ r.sideLabel }}</span>
              </td>
              <td>{{ r.typeLabel }}</td>
              <td class="ctht__meta ex-num">{{ r.roiDisplay }}</td>
              <td class="ctht__meta">{{ r.marginModeLabel }}</td>
              <td class="ctht__num ex-num">{{ r.liquidationDisplay }}</td>
              <td class="ctht__num ex-num">{{ r.entryPriceDisplay }}</td>
              <td class="ctht__num ex-num">{{ r.volumeUsdtDisplay }}</td>
              <td class="ctht__num ex-num">{{ r.feeUsdtDisplay }}</td>
              <td
                class="ctht__num ex-num"
                :class="r.pnlNonNeg ? 'ctht__pnl--gain' : 'ctht__pnl--loss'"
              >
                {{ r.realizedPnlDisplay }}
              </td>
              <td>{{ r.isMaker ? 'Maker' : 'Taker' }}</td>
            </tr>
          </template>
          <tr v-else>
            <td colspan="14" class="ctht__empty">暂无成交记录</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.ctht-root {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.ctht-wrap {
  overflow: auto;
  max-height: min(360px, 42vh);
}

.ctht {
  width: 100%;
  min-width: 1280px;
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

.ctht-th-label,
.ctht__th-label {
  font-weight: inherit;
}

.ctht__th-unit {
  margin-left: 4px;
  font-size: 10px;
  font-weight: $font-weight-regular;
  color: $color-text-tertiary;
  letter-spacing: 0.02em;
}

.ctht td {
  padding: $space-2 $space-3;
  border-bottom: 1px solid var(--ex-border-subtle);
  vertical-align: middle;
}

.ctht tbody tr:hover td {
  background: var(--ex-fill-ghost);
}

.ctht__num {
  text-align: left;
  font-variant-numeric: tabular-nums;
}

.ctht__muted {
  color: $color-text-tertiary;
  white-space: nowrap;
}

.ctht__mono {
  font-family: $font-family-mono;
  font-size: 10px;
}

.ctht__sym {
  font-family: $font-family-mono;
  font-size: 11px;
  font-weight: $font-weight-semibold;
  color: $color-text-secondary;
}

.ctht__meta {
  font-size: 11px;
  color: $color-text-secondary;
}

.ctht__side {
  font-weight: $font-weight-semibold;
}

.ctht__side--buy {
  color: $color-rise;
}

.ctht__side--sell {
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
