<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useAssetsCenterStore } from '@/stores/assetsCenter'
import { formatPrice } from '@/utils/format/number'
import type { AssetsTransferRow } from '@/types/assetsCenter'

const store = useAssetsCenterStore()
const { records } = storeToRefs(store)

const rows = computed(() => records.value?.transfers ?? [])

function walletLabel(w: AssetsTransferRow['from'] | AssetsTransferRow['to']) {
  const m = {
    spot: '现货',
    futures: '合约',
    funding: '资金',
  }
  return m[w]
}

function statusLabel(s: AssetsTransferRow['status']) {
  const m: Record<AssetsTransferRow['status'], string> = {
    SUCCESS: '成功',
    PENDING: '处理中',
    FAILED: '失败',
  }
  return m[s]
}

function timeCell(iso: string) {
  try {
    return new Date(iso).toLocaleString('zh-CN', { hour12: false })
  } catch {
    return iso
  }
}
</script>

<template>
  <div class="asc-tr">
    <div class="asc-tr__scroll">
      <table class="asc-tr__table">
        <thead>
          <tr>
            <th>时间</th>
            <th>划出</th>
            <th>划入</th>
            <th>币种</th>
            <th class="asc-tr__num">数量</th>
            <th>状态</th>
          </tr>
        </thead>
        <tbody>
          <template v-if="rows.length">
            <tr v-for="r in rows" :key="r.id">
              <td class="asc-tr__muted">{{ timeCell(r.time) }}</td>
              <td>{{ walletLabel(r.from) }}</td>
              <td>{{ walletLabel(r.to) }}</td>
              <td class="asc-tr__asset">{{ r.asset }}</td>
              <td class="asc-tr__num ex-num">{{ formatPrice(r.amount) }}</td>
              <td>{{ statusLabel(r.status) }}</td>
            </tr>
          </template>
          <tr v-else>
            <td colspan="6" class="asc-tr__empty">暂无划转记录</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.asc-tr {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.asc-tr__scroll {
  overflow: auto;
  overscroll-behavior: contain;
  max-height: min(400px, 48vh);
  -webkit-overflow-scrolling: touch;
}

.asc-tr__table {
  width: 100%;
  min-width: 520px;
  border-collapse: collapse;
  font-size: $font-size-xs;
}

.asc-tr__table th {
  position: sticky;
  top: 0;
  padding: $space-2 $space-3;
  text-align: left;
  font-weight: $font-weight-semibold;
  color: $color-text-tertiary;
  background: $color-bg-surface;
  border-bottom: 1px solid $color-border;
}

.asc-tr__table td {
  padding: $space-2 $space-3;
  border-bottom: 1px solid var(--ex-border-subtle);
  vertical-align: middle;
}

.asc-tr__num {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.asc-tr__muted {
  color: $color-text-tertiary;
  white-space: nowrap;
}

.asc-tr__asset {
  font-weight: $font-weight-semibold;
}

.asc-tr__empty {
  text-align: center;
  padding: $space-6 !important;
  color: $color-text-tertiary;
}
</style>
