<script setup lang="ts">
/**
 * C2C 用户订单列表 + 详情弹窗（订单中心 / C2C 页「我的订单」复用）
 */
import { computed, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { useC2cMarketStore } from '@/stores/c2cMarket'
import { formatPrice } from '@/utils/format/number'
import type { C2cOrder } from '@/types/c2c'
import ExPageState from '@/components/common/ExPageState.vue'
import C2COrderDetailModal from './C2COrderDetailModal.vue'

const props = withDefaults(
  defineProps<{
    /** 传入则只展示该子集（如 C2C 订单页按 Tab 筛选）；默认用 store 全量 */
    orderRows?: C2cOrder[] | null
  }>(),
  { orderRows: null },
)

const store = useC2cMarketStore()
const auth = useAuthStore()
const { loadingOrders, ordersError, orders } = storeToRefs(store)

const displayOrders = computed(() => props.orderRows ?? orders.value)

const detailOpen = ref(false)
const detailOrder = ref<C2cOrder | null>(null)

onMounted(() => {
  void store.bootstrapAds()
  if (auth.isAuthenticated) void store.refreshOrders()
})

watch(
  () => auth.isAuthenticated,
  (ok) => {
    if (ok) void store.refreshOrders()
    else {
      orders.value = []
    }
  },
)

function statusLabel(st: string) {
  const map: Record<string, string> = {
    pending_payment: '待付款',
    pending_release: '待放币',
    completed: '已完成',
    cancelled: '已取消',
    appeal: '申诉中',
  }
  return map[st] ?? st
}

function fmtTime(iso: string) {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString('zh-CN', { dateStyle: 'short', timeStyle: 'short' })
}

function openDetail(o: C2cOrder) {
  detailOrder.value = o
  detailOpen.value = true
}

/** 按 id 打开详情（全量在 store.orders 中解析，不受 orderRows 筛选影响） */
function openById(id: string) {
  const o = orders.value.find((x) => x.id === id)
  if (o) openDetail(o)
}

defineExpose({ openById })

async function syncDetailAfterAction() {
  await store.refreshOrders()
  const id = detailOrder.value?.id
  if (!id) return
  const next = orders.value.find((x) => x.id === id)
  detailOrder.value = next ?? detailOrder.value
  if (next?.status === 'cancelled' || next?.status === 'completed') {
    detailOpen.value = false
  }
}

function onMarkPaid() {
  const id = detailOrder.value?.id
  if (!id) return
  void store.setOrderStatus(id, 'pending_release').then(() => syncDetailAfterAction())
}

function onRelease() {
  const id = detailOrder.value?.id
  if (!id) return
  void store.setOrderStatus(id, 'completed').then(() => syncDetailAfterAction())
}

function onCancelOrder() {
  const id = detailOrder.value?.id
  if (!id) return
  void store.setOrderStatus(id, 'cancelled').then(() => syncDetailAfterAction())
}

function onAppealSubmitted() {
  void syncDetailAfterAction()
}
</script>

<template>
  <div class="oc2c">
    <ExPageState
      :loading="loadingOrders && !orders.length"
      use-skeleton
      skeleton-variant="list"
      :error="ordersError"
      :empty="!loadingOrders && !displayOrders.length"
      empty-title="暂无 C2C 订单"
      empty-description="在 C2C 市场选择商家下单后，订单将显示在此列表。"
      loading-text="加载订单…"
      @retry="store.refreshOrders()"
    >
      <div class="oc2c__list">
        <div v-for="o in displayOrders" :key="o.id" class="oc2c__row" @click="openDetail(o)">
          <div class="oc2c__row-main">
            <span class="oc2c__status" :data-st="o.status">{{ statusLabel(o.status) }}</span>
            <span class="oc2c__pair">{{ o.userSide === 'buy' ? '买入' : '卖出' }} {{ o.crypto }}/{{ o.fiat }}</span>
            <span class="oc2c__amt ex-num">{{ formatPrice(o.fiatAmount) }} {{ o.fiat }}</span>
          </div>
          <div class="oc2c__row-sub">
            <span>{{ o.merchantDisplayName }}</span>
            <time :datetime="o.createdAt">{{ fmtTime(o.createdAt) }}</time>
          </div>
        </div>
      </div>
    </ExPageState>

    <C2COrderDetailModal
      v-model="detailOpen"
      :order="detailOrder"
      @mark-paid="onMarkPaid"
      @release="onRelease"
      @cancel="onCancelOrder"
      @appeal-submitted="onAppealSubmitted"
    />
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.oc2c__list {
  border-radius: $radius-md;
  border: 1px solid $color-border;
  overflow: hidden;
  background: var(--ex-card-surface);
}

.oc2c__row {
  padding: $space-3 $space-4;
  border-bottom: 1px solid $color-border;
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: var(--ex-fill-ghost);
  }

  &:last-child {
    border-bottom: none;
  }
}

.oc2c__row-main {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: $space-2;
  margin-bottom: 6px;
}

.oc2c__status {
  font-size: 11px;
  font-weight: $font-weight-bold;
  padding: 2px 10px;
  border-radius: 4px;
  background: var(--ex-fill-hover-subtle);
  color: $color-text-secondary;

  &[data-st='pending_payment'] {
    background: rgba(240, 185, 11, 0.15);
    color: $color-brand;
  }

  &[data-st='pending_release'] {
    background: var(--ex-info-bg);
    color: var(--ex-info);
  }

  &[data-st='completed'] {
    background: rgba(14, 203, 129, 0.12);
    color: $color-rise;
  }

  &[data-st='cancelled'] {
    background: var(--ex-fill-hover-subtle);
    color: $color-text-tertiary;
  }

  &[data-st='appeal'] {
    background: rgba(240, 65, 65, 0.12);
    color: var(--ex-danger, #f6465d);
  }
}

.oc2c__pair {
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  color: $color-text-primary;
}

.oc2c__amt {
  margin-left: auto;
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.oc2c__row-sub {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: $color-text-tertiary;
}
</style>
