<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { RouteNames } from '@/constants/routeNames'
import type { MarketTickerRow } from '@/types/market'
import { formatPct, formatPrice } from '@/utils/format/number'
import { resolveMarketTradeLinks } from '@/utils/market/tradeLinks'

const props = defineProps<{
  hot: MarketTickerRow[]
  gainers: MarketTickerRow[]
  losers: MarketTickerRow[]
  volume: MarketTickerRow[]
}>()

type TabKey = 'hot' | 'gainers' | 'losers' | 'volume'

const tab = ref<TabKey>('hot')
const router = useRouter()

const rows = computed(() => {
  switch (tab.value) {
    case 'hot':
      return props.hot
    case 'gainers':
      return props.gainers
    case 'losers':
      return props.losers
    case 'volume':
      return props.volume
    default:
      return []
  }
})

function shortName(row: MarketTickerRow) {
  if (row.kind === 'CONTRACT') return `${row.baseAsset}/${row.quoteAsset}`
  if (row.kind === 'DELIVERY') return row.displayPair
  return row.displayPair
}

function goPrimary(row: MarketTickerRow) {
  if (row.kind === 'SPOT') {
    router.push({ name: RouteNames.SpotTrade, params: { symbol: row.routeSymbol } })
  } else if (row.kind === 'DELIVERY') {
    router.push({ name: RouteNames.DeliveryContract, params: { symbol: row.routeSymbol } })
  } else {
    router.push({ name: RouteNames.ContractTrade, params: { symbol: row.routeSymbol } })
  }
}

function goSpot(e: Event, row: MarketTickerRow) {
  e.stopPropagation()
  const { spotSymbol } = resolveMarketTradeLinks(row)
  router.push({ name: RouteNames.SpotTrade, params: { symbol: spotSymbol } })
}

function goContract(e: Event, row: MarketTickerRow) {
  e.stopPropagation()
  if (row.kind === 'DELIVERY') {
    router.push({ name: RouteNames.DeliveryContract, params: { symbol: row.routeSymbol } })
    return
  }
  const { contractSymbol } = resolveMarketTradeLinks(row)
  router.push({ name: RouteNames.ContractTrade, params: { symbol: contractSymbol } })
}
</script>

<template>
  <aside class="mrb" aria-label="市场榜单">
    <div class="mrb__head">
      <h2 class="mrb__title">市场榜单</h2>
      <p class="mrb__sub">点击行进入主交易路由；侧按钮直达现货 / 合约</p>
    </div>

    <div class="mrb__tabs" role="tablist">
      <button
        type="button"
        role="tab"
        class="mrb__tab"
        :class="{ 'mrb__tab--on': tab === 'hot' }"
        @click="tab = 'hot'"
      >
        热门
      </button>
      <button
        type="button"
        role="tab"
        class="mrb__tab"
        :class="{ 'mrb__tab--on': tab === 'gainers' }"
        @click="tab = 'gainers'"
      >
        涨幅
      </button>
      <button
        type="button"
        role="tab"
        class="mrb__tab"
        :class="{ 'mrb__tab--on': tab === 'losers' }"
        @click="tab = 'losers'"
      >
        跌幅
      </button>
      <button
        type="button"
        role="tab"
        class="mrb__tab"
        :class="{ 'mrb__tab--on': tab === 'volume' }"
        @click="tab = 'volume'"
      >
        成交额
      </button>
    </div>

    <ol class="mrb__list">
      <li v-for="(row, i) in rows" :key="`${tab}-${row.id}`" class="mrb__row">
        <button type="button" class="mrb__main" @click="goPrimary(row)">
          <span class="mrb__idx">{{ i + 1 }}</span>
          <span class="mrb__pair">{{ shortName(row) }}</span>
          <span class="mrb__price ex-num">{{ formatPrice(row.lastPrice) }}</span>
          <span
            class="mrb__chg ex-num"
            :class="row.changePct >= 0 ? 'mrb__chg--up' : 'mrb__chg--down'"
          >
            {{ formatPct(row.changePct) }}
          </span>
        </button>
        <div class="mrb__acts">
          <button type="button" class="mrb__mini" @click="goSpot($event, row)">现货</button>
          <button type="button" class="mrb__mini mrb__mini--c" @click="goContract($event, row)">
            合约
          </button>
        </div>
      </li>
    </ol>

    <p class="mrb__foot">榜单与主表同源数据源；接入全量 ticker 推送后实时重排。</p>
  </aside>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.mrb {
  display: flex;
  flex-direction: column;
  border: 1px solid $color-border;
  border-radius: $radius-md;
  background: $color-bg-elevated;
  overflow: hidden;
  min-height: 0;
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.03);
}

[data-theme='monochrome'] .mrb {
  box-shadow:
    0 1px 0 var(--ex-border-subtle),
    0 2px 12px rgba(15, 23, 42, 0.03);
}

.mrb__head {
  flex-shrink: 0;
  padding: $space-3 $space-3;
  border-bottom: 1px solid var(--ex-border-subtle);
  background: var(--ex-panel-sunken);
}

.mrb__title {
  margin: 0 0 $space-1;
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  letter-spacing: 0.04em;
  color: $color-text-primary;
}

.mrb__sub {
  margin: 0;
  font-size: 10px;
  line-height: 1.4;
  color: $color-text-tertiary;
}

.mrb__tabs {
  flex-shrink: 0;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 2px;
  padding: $space-2;
  background: var(--ex-panel-sunken);
  border-bottom: 1px solid $color-border;
}

:global([data-theme='monochrome']) .mrb__head,
:global([data-theme='monochrome']) .mrb__tabs {
  background: var(--ex-bg-elevated);
}

.mrb__tab {
  min-height: 36px;
  padding: $space-1 $space-1;
  font-size: 11px;
  font-weight: $font-weight-semibold;
  color: $color-text-tertiary;
  background: transparent;
  border: none;
  border-radius: $radius-sm;
  cursor: pointer;
}

.mrb__tab--on {
  color: $color-text-primary;
  background: var(--ex-brand-muted);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--ex-brand) 28%, transparent);
}

.mrb__list {
  list-style: none;
  margin: 0;
  padding: $space-2 0;
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
}

.mrb__row {
  display: flex;
  flex-direction: column;
  gap: 2px;
  border-bottom: 1px solid var(--ex-border-subtle);
}

.mrb__row:last-child {
  border-bottom: none;
}

.mrb__main {
  display: grid;
  grid-template-columns: 24px 1fr auto auto;
  gap: $space-1;
  align-items: center;
  width: 100%;
  padding: 10px $space-2;
  margin: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  color: inherit;
  font: inherit;
  text-align: left;
}

.mrb__main:hover {
  background: var(--ex-fill-ghost);
}

.mrb__idx {
  font-size: 10px;
  font-weight: $font-weight-bold;
  color: $color-text-tertiary;
  font-family: $font-family-mono;
}

.mrb__pair {
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  color: $color-text-primary;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mrb__price {
  font-size: 11px;
  color: $color-text-secondary;
}

.mrb__chg {
  font-size: 11px;
  font-weight: $font-weight-semibold;
}

.mrb__chg--up {
  color: $color-rise;
}

.mrb__chg--down {
  color: $color-fall;
}

.mrb__acts {
  display: flex;
  gap: 4px;
  padding: 0 $space-2 $space-2;
}

.mrb__mini {
  flex: 1;
  padding: 3px 0;
  font-size: 10px;
  font-weight: $font-weight-semibold;
  color: $color-text-secondary;
  background: var(--ex-fill-ghost);
  border: 1px solid $color-border;
  border-radius: 4px;
  cursor: pointer;
}

.mrb__mini:hover {
  color: $color-brand;
  border-color: color-mix(in srgb, var(--ex-brand) 38%, var(--ex-border));
}

.mrb__mini--c {
  color: var(--ex-info);
}

.mrb__mini--c:hover {
  color: color-mix(in srgb, var(--ex-info) 85%, #ffffff);
}

.mrb__foot {
  flex-shrink: 0;
  margin: 0;
  padding: $space-2 $space-3 $space-3;
  font-size: 10px;
  line-height: 1.45;
  color: $color-text-tertiary;
}
</style>
