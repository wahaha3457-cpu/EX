<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { RouteNames } from '@/constants/routeNames'
import { useAuthStore } from '@/stores/auth'
import { useC2cMarketStore } from '@/stores/c2cMarket'
import type { C2cOrder } from '@/types/c2c'
import C2COrdersListPanel from '@/components/business/c2c/C2COrdersListPanel.vue'

const ENDED_FILTERS = ['all', 'completed', 'cancelled'] as const
type EndedFilter = (typeof ENDED_FILTERS)[number]

const props = defineProps<{ filter: string }>()
const route = useRoute()
const router = useRouter()
const store = useC2cMarketStore()
const auth = useAuthStore()
const { orders } = storeToRefs(store)

const panelRef = ref<InstanceType<typeof C2COrdersListPanel> | null>(null)

function isEndedFilter(s: string): s is EndedFilter {
  return (ENDED_FILTERS as readonly string[]).includes(s)
}

const activeFilter = computed<EndedFilter>(() =>
  isEndedFilter(props.filter) ? props.filter : 'all',
)

watch(
  () => props.filter,
  (f) => {
    if (!isEndedFilter(f)) {
      void router.replace({
        name: RouteNames.C2COrdersEnded,
        params: { filter: 'all' },
        query: route.query,
      })
    }
  },
  { immediate: true },
)

const filteredOrders = computed(() => {
  const list = orders.value
  const f = activeFilter.value
  const ended = (o: C2cOrder) => o.status === 'completed' || o.status === 'cancelled'
  if (f === 'all') return list.filter(ended)
  if (f === 'completed') return list.filter((o) => o.status === 'completed')
  if (f === 'cancelled') return list.filter((o) => o.status === 'cancelled')
  return []
})

watch(
  () => auth.isAuthenticated,
  (ok) => {
    if (ok) void store.refreshOrders()
  },
)

function tryOpenFromQuery() {
  const q = route.query.open
  if (typeof q !== 'string' || !q) return
  nextTick(() => panelRef.value?.openById(q))
}

watch(
  () => [route.query.open, orders.value],
  () => tryOpenFromQuery(),
  { deep: true },
)

onMounted(() => {
  if (auth.isAuthenticated) void store.refreshOrders()
  tryOpenFromQuery()
})
</script>

<template>
  <div class="c2coe">
    <nav class="c2coe__sub" aria-label="已结束订单筛选">
      <RouterLink class="c2coe__sub-i" :to="{ name: RouteNames.C2COrdersEnded, params: { filter: 'all' } }">
        全部
      </RouterLink>
      <RouterLink class="c2coe__sub-i" :to="{ name: RouteNames.C2COrdersEnded, params: { filter: 'completed' } }">
        已完成
      </RouterLink>
      <RouterLink class="c2coe__sub-i" :to="{ name: RouteNames.C2COrdersEnded, params: { filter: 'cancelled' } }">
        已取消
      </RouterLink>
    </nav>

    <C2COrdersListPanel ref="panelRef" :order-rows="filteredOrders" />
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.c2coe__sub {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
  margin-bottom: $space-3;
  padding: 4px;
  border-radius: $radius-md;
  border: 1px solid $color-border;
  background: var(--ex-surface-inset);
  width: fit-content;
  max-width: 100%;
}

.c2coe__sub-i {
  padding: 8px 14px;
  border-radius: $radius-sm;
  font-size: $font-size-xs;
  font-weight: $font-weight-bold;
  color: $color-text-secondary;
  text-decoration: none;
  border: 1px solid transparent;
}

.c2coe__sub-i:hover {
  color: $color-text-primary;
  background: var(--ex-fill-hover-subtle);
}

.c2coe__sub-i.router-link-active {
  background: rgba(240, 185, 11, 0.14);
  color: $color-brand;
  border-color: rgba(240, 185, 11, 0.35);
}
</style>
