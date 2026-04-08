<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useAssetsCenterStore } from '@/stores/assetsCenter'
import { formatPrice } from '@/utils/format/number'
import type { AssetsDepositRow } from '@/types/assetsCenter'

const store = useAssetsCenterStore()
const { records } = storeToRefs(store)

const rows = computed(() => records.value?.deposits ?? [])

function timeCell(iso: string) {
  try {
    return new Date(iso).toLocaleString('zh-CN', { hour12: false })
  } catch {
    return iso
  }
}

function statusLabel(s: AssetsDepositRow['status']) {
  const m: Record<AssetsDepositRow['status'], string> = {
    PENDING: '待处理',
    CONFIRMING: '确认中',
    SUCCESS: '成功',
    FAILED: '失败',
  }
  return m[s]
}

function statusClass(s: AssetsDepositRow['status']) {
  if (s === 'SUCCESS') return 'asc-dep__st--ok'
  if (s === 'FAILED') return 'asc-dep__st--fail'
  return 'asc-dep__st--pend'
}
</script>

<template>
  <div class="asc-dep">
    <div class="asc-dep__scroll">
      <table class="asc-dep__table">
        <thead>
          <tr>
            <th>时间</th>
            <th>币种</th>
            <th class="asc-dep__num">数量</th>
            <th>网络</th>
            <th>状态</th>
            <th>TxID</th>
          </tr>
        </thead>
        <tbody>
          <template v-if="rows.length">
            <tr v-for="r in rows" :key="r.id">
              <td class="asc-dep__muted">{{ timeCell(r.time) }}</td>
              <td class="asc-dep__asset">{{ r.asset }}</td>
              <td class="asc-dep__num ex-num">{{ formatPrice(r.amount) }}</td>
              <td>{{ r.network }}</td>
              <td>
                <span class="asc-dep__st" :class="statusClass(r.status)">{{ statusLabel(r.status) }}</span>
              </td>
              <td class="asc-dep__tx">{{ r.txId }}</td>
            </tr>
          </template>
          <tr v-else>
            <td colspan="6" class="asc-dep__empty">暂无充值记录</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.asc-dep {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.asc-dep__scroll {
  overflow: auto;
  overscroll-behavior: contain;
  max-height: min(400px, 48vh);
  -webkit-overflow-scrolling: touch;
}

.asc-dep__table {
  width: 100%;
  min-width: 520px;
  border-collapse: collapse;
  font-size: $font-size-xs;
}

.asc-dep__table th {
  position: sticky;
  top: 0;
  padding: $space-2 $space-3;
  text-align: left;
  font-weight: $font-weight-semibold;
  color: $color-text-tertiary;
  background: $color-bg-surface;
  border-bottom: 1px solid $color-border;
}

.asc-dep__table td {
  padding: $space-2 $space-3;
  border-bottom: 1px solid var(--ex-border-subtle);
  vertical-align: middle;
}

.asc-dep__num {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.asc-dep__muted {
  color: $color-text-tertiary;
  white-space: nowrap;
}

.asc-dep__asset {
  font-weight: $font-weight-semibold;
}

.asc-dep__tx {
  font-family: $font-family-mono;
  font-size: 10px;
  max-width: 180px;
  word-break: break-all;
}

.asc-dep__st {
  font-size: 11px;
  font-weight: $font-weight-semibold;
}

.asc-dep__st--ok {
  color: $color-rise;
}

.asc-dep__st--fail {
  color: $color-fall;
}

.asc-dep__st--pend {
  color: $color-text-secondary;
}

.asc-dep__empty {
  text-align: center;
  padding: $space-6 !important;
  color: $color-text-tertiary;
}
</style>
