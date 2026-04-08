<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { storeToRefs } from 'pinia'
import { RouteNames } from '@/constants/routeNames'
import { useConvertFlashStore } from '@/stores/convertFlash'
import { formatPrice } from '@/utils/format/number'

const store = useConvertFlashStore()
const { history } = storeToRefs(store)

onMounted(() => {
  store.bootstrap()
})

function fmtTime(iso: string) {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('zh-CN', { dateStyle: 'short', timeStyle: 'short' })
}

function fmtAmt(sym: string, n: number) {
  const dp = store.metaOf(sym)?.qtyDp ?? 6
  if (sym === 'USDT') return formatPrice(n)
  const s = n.toFixed(dp)
  return s.replace(/\.?0+$/, '') || '0'
}
</script>

<template>
  <div class="ocv">
    <section class="ocv__intro" aria-label="说明">
      <p class="ocv__intro-p">
        闪兑订单记录零滑点演示成交（与闪兑页同一数据源）。正式环境应对接聚合报价、链上确认与风控状态。
      </p>
      <ul class="ocv__intro-ul">
        <li>列表按时间倒序；在闪兑页完成兑换后会立即出现在此。</li>
        <li>手续费与折合 USDT 为演示口径，以产品费率表为准。</li>
      </ul>
    </section>

    <div class="ocv__panel">
      <div class="ocv__panel-hd">
        <h2 class="ocv__h2">闪兑订单</h2>
        <RouterLink class="ocv__link" :to="{ name: RouteNames.Convert }">去闪兑</RouterLink>
      </div>

      <div class="ocv__table-wrap">
        <table class="ocv__table" aria-label="闪兑记录">
          <thead>
            <tr>
              <th>时间</th>
              <th>演示单号</th>
              <th>卖出</th>
              <th>买入</th>
              <th>折合 USDT</th>
            </tr>
          </thead>
          <tbody>
            <template v-if="history.length">
              <tr v-for="h in history" :key="h.id">
                <td class="ocv__mono">{{ fmtTime(h.time) }}</td>
                <td class="ocv__mono ocv__ref">{{ h.orderRef ?? '—' }}</td>
                <td class="ex-num">{{ fmtAmt(h.from, h.amountFrom) }} {{ h.from }}</td>
                <td class="ex-num">{{ fmtAmt(h.to, h.amountTo) }} {{ h.to }}</td>
                <td class="ex-num">{{ formatPrice(h.usdtEq) }}</td>
              </tr>
            </template>
            <tr v-else>
              <td colspan="5" class="ocv__empty">暂无闪兑记录，请前往闪兑页完成一笔兑换。</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;
@use '@/styles/mixins' as mq;

.ocv__intro {
  margin-bottom: $space-4;
  padding: $space-3 $space-4;
  border-radius: $radius-md;
  border: 1px solid $color-border;
  background: var(--ex-panel-sunken);
}

.ocv__intro-p {
  margin: 0 0 $space-2;
  font-size: $font-size-sm;
  color: $color-text-secondary;
  line-height: 1.55;
}

.ocv__intro-ul {
  margin: 0;
  padding-left: 1.2rem;
  font-size: $font-size-xs;
  color: $color-text-tertiary;
  line-height: 1.6;
}

.ocv__panel {
  border: 1px solid $color-border;
  border-radius: $radius-lg;
  background: var(--ex-card-surface);
  overflow: hidden;
}

.ocv__panel-hd {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: $space-2;
  padding: $space-3 $space-4;
  border-bottom: 1px solid $color-border;
  background: var(--ex-panel-sunken);
}

.ocv__h2 {
  margin: 0;
  font-size: $font-size-md;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.ocv__link {
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  color: var(--ex-brand);
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

.ocv__table-wrap {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.ocv__table {
  width: 100%;
  min-width: 520px;
  border-collapse: collapse;
  font-size: $font-size-xs;
}

.ocv__table th,
.ocv__table td {
  padding: $space-2 $space-3;
  text-align: left;
  border-bottom: 1px solid var(--ex-border-subtle);
}

.ocv__table th {
  font-weight: $font-weight-bold;
  color: $color-text-tertiary;
  background: var(--ex-surface-inset);
  white-space: nowrap;
}

.ocv__table td {
  color: $color-text-secondary;
}

.ocv__mono {
  font-family: $font-family-mono;
  white-space: nowrap;
}

.ocv__ref {
  font-size: 10px;
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ocv__empty {
  text-align: center;
  padding: $space-6 $space-3 !important;
  color: $color-text-tertiary;
}

@include mq.media-down(md) {
  .ocv__table {
    min-width: 100%;
  }
}
</style>
