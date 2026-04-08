<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useFuturesTradeStore } from '@/stores/futuresTrade'
import { formatPrice } from '@/utils/format/number'

const store = useFuturesTradeStore()
const { fundingLedger } = storeToRefs(store)

const rows = computed(() =>
  [...fundingLedger.value].sort(
    (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime(),
  ),
)

function timeCell(iso: string) {
  try {
    return new Date(iso).toLocaleString('zh-CN', { hour12: false })
  } catch {
    return iso
  }
}

function typeLabel(t: string) {
  if (t === 'FUNDING') return '资金费'
  if (t === 'REALIZED_PNL') return '已实现盈亏'
  if (t === 'FEE') return '手续费'
  return '划转'
}
</script>

<template>
  <div class="cflt-root">
    <div class="cflt-wrap">
      <table class="cflt" aria-label="资金流水">
        <thead>
          <tr>
            <th>时间</th>
            <th>类型</th>
            <th class="cflt__num">金额</th>
            <th>资产</th>
            <th>备注</th>
          </tr>
        </thead>
        <tbody>
          <template v-if="rows.length">
            <tr v-for="row in rows" :key="row.id">
              <td class="cflt__muted">{{ timeCell(row.time) }}</td>
              <td>{{ typeLabel(row.type) }}</td>
              <td class="cflt__num ex-num" :class="row.amount >= 0 ? 'cflt__pnl--gain' : 'cflt__pnl--loss'">
                {{ formatPrice(row.amount) }}
              </td>
              <td>{{ row.asset }}</td>
              <td>{{ row.remark }}</td>
            </tr>
          </template>
          <tr v-else>
            <td colspan="5" class="cflt__empty">暂无资金流水记录</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.cflt-root {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.cflt-wrap {
  overflow: auto;
  max-height: min(360px, 42vh);
}

.cflt {
  width: 100%;
  border-collapse: collapse;
  font-size: $font-size-xs;
}

.cflt th {
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

.cflt td {
  padding: $space-2 $space-3;
  border-bottom: 1px solid var(--ex-border-subtle);
  vertical-align: middle;
}

.cflt tbody tr:hover td {
  background: var(--ex-fill-ghost);
}

.cflt__num {
  text-align: left;
  font-variant-numeric: tabular-nums;
}

.cflt__muted {
  color: $color-text-tertiary;
  white-space: nowrap;
}

.cflt__pnl--gain {
  color: $color-rise;
}

.cflt__pnl--loss {
  color: $color-fall;
}

.cflt__empty {
  text-align: center;
  padding: $space-6 !important;
  color: $color-text-tertiary;
}
</style>
