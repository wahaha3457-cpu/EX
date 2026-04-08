<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { RouteNames } from '@/constants/routeNames'
import { useAuthStore } from '@/stores/auth'
import { useC2cMarketStore } from '@/stores/c2cMarket'
import type { C2cOrder } from '@/types/c2c'
import C2COrdersListPanel from '@/components/business/c2c/C2COrdersListPanel.vue'

const RUNNING_FILTERS = ['all', 'unpaid', 'paid', 'appeal'] as const
type RunningFilter = (typeof RUNNING_FILTERS)[number]

const props = defineProps<{ filter: string }>()
const route = useRoute()
const router = useRouter()
const store = useC2cMarketStore()
const auth = useAuthStore()
const { orders } = storeToRefs(store)

const panelRef = ref<InstanceType<typeof C2COrdersListPanel> | null>(null)

function isRunningFilter(s: string): s is RunningFilter {
  return (RUNNING_FILTERS as readonly string[]).includes(s)
}

const activeFilter = computed<RunningFilter>(() =>
  isRunningFilter(props.filter) ? props.filter : 'all',
)

watch(
  () => props.filter,
  (f) => {
    if (!isRunningFilter(f)) {
      void router.replace({
        name: RouteNames.C2COrdersRunning,
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
  const running = (o: C2cOrder) =>
    o.status === 'pending_payment' || o.status === 'pending_release' || o.status === 'appeal'
  if (f === 'all') return list.filter(running)
  if (f === 'unpaid') return list.filter((o) => o.status === 'pending_payment')
  if (f === 'paid') return list.filter((o) => o.status === 'pending_release')
  if (f === 'appeal') return list.filter((o) => o.status === 'appeal')
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
  <div class="c2cor">
    <nav class="c2cor__sub" aria-label="进行中订单筛选">
      <RouterLink class="c2cor__sub-i" :to="{ name: RouteNames.C2COrdersRunning, params: { filter: 'all' } }">
        全部
      </RouterLink>
      <RouterLink class="c2cor__sub-i" :to="{ name: RouteNames.C2COrdersRunning, params: { filter: 'unpaid' } }">
        未付款
      </RouterLink>
      <RouterLink class="c2cor__sub-i" :to="{ name: RouteNames.C2COrdersRunning, params: { filter: 'paid' } }">
        已付款
      </RouterLink>
      <RouterLink class="c2cor__sub-i" :to="{ name: RouteNames.C2COrdersRunning, params: { filter: 'appeal' } }">
        申诉
      </RouterLink>
    </nav>

    <C2COrdersListPanel ref="panelRef" :order-rows="filteredOrders" />
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.c2cor__sub {
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

.c2cor__sub-i {
  padding: 8px 14px;
  border-radius: $radius-sm;
  font-size: $font-size-xs;
  font-weight: $font-weight-bold;
  color: $color-text-secondary;
  text-decoration: none;
  border: 1px solid transparent;
}

.c2cor__sub-i:hover {
  color: $color-text-primary;
  background: var(--ex-fill-hover-subtle);
}

.c2cor__sub-i.router-link-active {
  background: rgba(240, 185, 11, 0.14);
  color: $color-brand;
  border-color: rgba(240, 185, 11, 0.35);
}
</style>
