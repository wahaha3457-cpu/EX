<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useAssetsCenterStore } from '@/stores/assetsCenter'
import { formatPrice } from '@/utils/format/number'
import type { AssetsLedgerRow } from '@/types/assetsCenter'

const store = useAssetsCenterStore()
const { records } = storeToRefs(store)

const rows = computed(() => records.value?.ledger ?? [])

function timeCell(iso: string) {
  try {
    return new Date(iso).toLocaleString('zh-CN', { hour12: false })
  } catch {
    return iso
  }
}

function typeLabel(t: AssetsLedgerRow['type']) {
  const m: Record<AssetsLedgerRow['type'], string> = {
    TRADE: '交易',
    TRANSFER: '划转',
    FUNDING: '资金费',
    FEE: '手续费',
    OTHER: '其他',
  }
  return m[t] ?? t
}
</script>

<template>
  <div class="asc-ledger">
    <div class="asc-ledger__scroll">
      <table class="asc-ledger__table">
        <thead>
          <tr>
            <th>时间</th>
            <th>类型</th>
            <th>币种</th>
            <th class="asc-ledger__num">变动</th>
            <th class="asc-ledger__num">余额</th>
            <th>备注</th>
          </tr>
        </thead>
        <tbody>
          <template v-if="rows.length">
            <tr v-for="r in rows" :key="r.id">
              <td class="asc-ledger__muted">{{ timeCell(r.time) }}</td>
              <td>{{ typeLabel(r.type) }}</td>
              <td class="asc-ledger__asset">{{ r.asset }}</td>
              <td
                class="asc-ledger__num ex-num"
                :class="r.amount >= 0 ? 'asc-ledger__amt--pos' : 'asc-ledger__amt--neg'"
              >
                {{ r.amount >= 0 ? '+' : '' }}{{ formatPrice(r.amount) }}
              </td>
              <td class="asc-ledger__num ex-num">
                {{ r.balanceAfter != null ? formatPrice(r.balanceAfter) : '—' }}
              </td>
              <td class="asc-ledger__remark">{{ r.remark }}</td>
            </tr>
          </template>
          <tr v-else>
            <td colspan="6" class="asc-ledger__empty">暂无资金流水 · 订阅 user.wallet.ledger</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.asc-ledger {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.asc-ledger__scroll {
  overflow: auto;
  overscroll-behavior: contain;
  max-height: min(400px, 48vh);
  -webkit-overflow-scrolling: touch;
}

.asc-ledger__table {
  width: 100%;
  min-width: 560px;
  border-collapse: collapse;
  font-size: $font-size-xs;
}

.asc-ledger__table th {
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

.asc-ledger__table td {
  padding: $space-2 $space-3;
  border-bottom: 1px solid var(--ex-border-subtle);
  vertical-align: middle;
}

.asc-ledger__table tbody tr:hover td {
  background: var(--ex-fill-ghost);
}

.asc-ledger__num {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.asc-ledger__muted {
  color: $color-text-tertiary;
  white-space: nowrap;
}

.asc-ledger__asset {
  font-weight: $font-weight-semibold;
  font-family: $font-family-mono;
}

.asc-ledger__amt--pos {
  color: $color-rise;
}

.asc-ledger__amt--neg {
  color: $color-fall;
}

.asc-ledger__remark {
  color: $color-text-secondary;
  max-width: 220px;
}

.asc-ledger__empty {
  text-align: center;
  padding: $space-6 !important;
  color: $color-text-tertiary;
}
</style>
