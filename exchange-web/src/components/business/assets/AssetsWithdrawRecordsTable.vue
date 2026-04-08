<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useAssetsCenterStore } from '@/stores/assetsCenter'
import { formatPrice } from '@/utils/format/number'
import type { AssetsWithdrawRow } from '@/types/assetsCenter'

const store = useAssetsCenterStore()
const { records } = storeToRefs(store)

const rows = computed(() => records.value?.withdraws ?? [])

function timeCell(iso: string) {
  try {
    return new Date(iso).toLocaleString('zh-CN', { hour12: false })
  } catch {
    return iso
  }
}

function statusLabel(s: AssetsWithdrawRow['status']) {
  const m: Record<AssetsWithdrawRow['status'], string> = {
    PENDING: '处理中',
    AUDIT: '审核中',
    SUCCESS: '成功',
    FAILED: '失败',
  }
  return m[s]
}

function statusClass(s: AssetsWithdrawRow['status']) {
  if (s === 'SUCCESS') return 'asc-wd__st--ok'
  if (s === 'FAILED') return 'asc-wd__st--fail'
  return 'asc-wd__st--pend'
}
</script>

<template>
  <div class="asc-wd">
    <div class="asc-wd__scroll">
      <table class="asc-wd__table">
        <thead>
          <tr>
            <th>时间</th>
            <th>币种</th>
            <th class="asc-wd__num">数量</th>
            <th class="asc-wd__num">手续费</th>
            <th>网络</th>
            <th>Tag</th>
            <th>状态</th>
            <th>地址</th>
          </tr>
        </thead>
        <tbody>
          <template v-if="rows.length">
            <tr v-for="r in rows" :key="r.id">
              <td class="asc-wd__muted">{{ timeCell(r.time) }}</td>
              <td class="asc-wd__asset">{{ r.asset }}</td>
              <td class="asc-wd__num ex-num">{{ formatPrice(r.amount) }}</td>
              <td class="asc-wd__num ex-num">{{ formatPrice(r.fee) }}</td>
              <td>{{ r.network }}</td>
              <td class="asc-wd__tag">{{ r.memo ?? '—' }}</td>
              <td>
                <span class="asc-wd__st" :class="statusClass(r.status)">{{ statusLabel(r.status) }}</span>
              </td>
              <td class="asc-wd__addr">{{ r.address }}</td>
            </tr>
          </template>
          <tr v-else>
            <td colspan="8" class="asc-wd__empty">暂无提现记录</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.asc-wd {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.asc-wd__scroll {
  overflow: auto;
  overscroll-behavior: contain;
  max-height: min(400px, 48vh);
  -webkit-overflow-scrolling: touch;
}

.asc-wd__table {
  width: 100%;
  min-width: 600px;
  border-collapse: collapse;
  font-size: $font-size-xs;
}

.asc-wd__table th {
  position: sticky;
  top: 0;
  padding: $space-2 $space-3;
  text-align: left;
  font-weight: $font-weight-semibold;
  color: $color-text-tertiary;
  background: $color-bg-surface;
  border-bottom: 1px solid $color-border;
}

.asc-wd__table td {
  padding: $space-2 $space-3;
  border-bottom: 1px solid var(--ex-border-subtle);
  vertical-align: middle;
}

.asc-wd__num {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.asc-wd__muted {
  color: $color-text-tertiary;
  white-space: nowrap;
}

.asc-wd__asset {
  font-weight: $font-weight-semibold;
}

.asc-wd__addr {
  font-family: $font-family-mono;
  font-size: 10px;
  max-width: 160px;
  word-break: break-all;
}

.asc-wd__tag {
  font-size: 10px;
}

.asc-wd__st {
  font-size: 11px;
  font-weight: $font-weight-semibold;
}

.asc-wd__st--ok {
  color: $color-rise;
}

.asc-wd__st--fail {
  color: $color-fall;
}

.asc-wd__st--pend {
  color: $color-text-secondary;
}

.asc-wd__empty {
  text-align: center;
  padding: $space-6 !important;
  color: $color-text-tertiary;
}
</style>
