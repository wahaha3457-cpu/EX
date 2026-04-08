<script setup lang="ts">
/**
 * 现货页：交易对快捷选择与专业切换弹窗入口；行情列表来自 {@link useMarketStore}。
 */
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { RouteNames } from '@/constants/routeNames'
import { useMarketStore } from '@/stores/market'
import { PairSwitcherModal, TradePairNameCluster } from '@/components/trading'
import type { PairSwitcherSelectPayload } from '@/types/pairSwitcherModal'

const props = withDefaults(
  defineProps<{
    symbol: string
    baseAsset: string
    isFavorite?: boolean
  }>(),
  { isFavorite: false },
)

const emit = defineEmits<{
  (e: 'toggle-favorite'): void
}>()

const route = useRoute()
const router = useRouter()
const market = useMarketStore()
const { tickers, loading, watchlistKeys, hotRows } = storeToRefs(market)

const spotRouteName = computed(() =>
  route.meta.demoMode ? RouteNames.DemoSpotTrade : RouteNames.SpotTrade,
)

const dialogOpen = ref(false)

watch(dialogOpen, (open) => {
  if (open) void market.loadTickers()
})

function displayPair(s: string) {
  return s.replace('_', '/')
}

function onModalSelect(p: PairSwitcherSelectPayload) {
  if (p.row.kind === 'SPOT') {
    router.push({ name: spotRouteName.value, params: { symbol: p.row.routeSymbol } })
  } else {
    router.push({ name: RouteNames.ContractTrade, params: { symbol: p.row.routeSymbol } })
  }
  dialogOpen.value = false
}

function openPairModal() {
  dialogOpen.value = true
}
</script>

<template>
  <div class="psw">
    <div class="psw__row">
      <TradePairNameCluster
        :base-asset="props.baseAsset"
        :is-favorite="props.isFavorite"
        @toggle-favorite="emit('toggle-favorite')"
      >
        <button
          type="button"
          class="psw__pair-trigger"
          aria-haspopup="dialog"
          :aria-expanded="dialogOpen"
          aria-label="选择交易对"
          @click="openPairModal"
        >
          <span class="psw__pair-trigger__sym">{{ displayPair(props.symbol) }}</span>
          <svg class="psw__chev" width="10" height="6" viewBox="0 0 10 6" aria-hidden="true">
            <path
              d="M1 1.2 L5 4.8 L9 1.2"
              fill="none"
              stroke="currentColor"
              stroke-width="1.35"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
      </TradePairNameCluster>
    </div>

    <PairSwitcherModal
      v-model="dialogOpen"
      :current-route-symbol="props.symbol"
      page-context="spot"
      :rows="tickers"
      :hot-rows="hotRows"
      :loading="loading"
      :watchlist-keys="watchlistKeys"
      @select="onModalSelect"
      @toggle-favorite="market.toggleWatchlist($event.row)"
    />
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.psw__row {
  display: flex;
  align-items: center;
  gap: $space-2;
  flex-wrap: wrap;
}

.psw__pair-trigger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  max-width: min(240px, 58vw);
  min-height: 34px;
  padding: 0 10px;
  font-size: $font-size-md;
  font-weight: $font-weight-bold;
  font-family: $font-family-mono;
  color: var(--ex-text-primary);
  background-color: color-mix(in srgb, #1e2329 88%, var(--ex-bg-elevated));
  border: 1px solid color-mix(in srgb, var(--ex-text-primary) 10%, var(--ex-border));
  border-radius: 4px;
  cursor: pointer;
}

.psw__pair-trigger:hover {
  border-color: color-mix(in srgb, var(--ex-brand) 35%, var(--ex-border));
}

.psw__pair-trigger__sym {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

.psw__chev {
  flex-shrink: 0;
  color: var(--ex-text-tertiary);
  opacity: 0.9;
}
</style>
