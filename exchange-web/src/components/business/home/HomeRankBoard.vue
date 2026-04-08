<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { RouteNames } from '@/constants/routeNames'
import type { HomeMoverRow } from '@/types/home'
import { formatChangePct } from '@/utils/format/pct'

const props = defineProps<{
  rankHot: HomeMoverRow[]
  gainers: HomeMoverRow[]
  losers: HomeMoverRow[]
  rankVolume: HomeMoverRow[]
  loading?: boolean
}>()

type TabKey = 'hot' | 'gainers' | 'losers' | 'volume'

const tab = ref<TabKey>('hot')
const router = useRouter()

const rows = computed(() => {
  switch (tab.value) {
    case 'hot':
      return props.rankHot
    case 'gainers':
      return props.gainers
    case 'losers':
      return props.losers
    case 'volume':
      return props.rankVolume
    default:
      return []
  }
})

function goTrade(row: HomeMoverRow) {
  router.push({ name: RouteNames.SpotTrade, params: { symbol: row.routeSymbol } })
}
</script>

<template>
  <section class="rank" aria-labelledby="rank-title">
    <div class="rank__head">
      <div>
        <h2 id="rank-title" class="rank__title">市场榜单</h2>
        <p class="rank__sub">多维度榜单；数据与行情中心同源对接时可合并请求</p>
      </div>
    </div>

    <div class="rank__tabs" role="tablist" aria-label="榜单切换">
      <button
        type="button"
        role="tab"
        class="rank__tab"
        :class="{ 'rank__tab--on': tab === 'hot' }"
        :aria-selected="tab === 'hot'"
        @click="tab = 'hot'"
      >
        热门榜
      </button>
      <button
        type="button"
        role="tab"
        class="rank__tab"
        :class="{ 'rank__tab--on': tab === 'gainers' }"
        :aria-selected="tab === 'gainers'"
        @click="tab = 'gainers'"
      >
        涨幅榜
      </button>
      <button
        type="button"
        role="tab"
        class="rank__tab"
        :class="{ 'rank__tab--on': tab === 'losers' }"
        :aria-selected="tab === 'losers'"
        @click="tab = 'losers'"
      >
        跌幅榜
      </button>
      <button
        type="button"
        role="tab"
        class="rank__tab"
        :class="{ 'rank__tab--on': tab === 'volume' }"
        :aria-selected="tab === 'volume'"
        @click="tab = 'volume'"
      >
        成交额榜
      </button>
    </div>

    <div v-if="loading" class="rank__skel" aria-hidden="true">
      <div v-for="i in 5" :key="i" class="rank__skel-row" />
    </div>

    <div v-else class="rank__table-wrap">
      <table class="rank__table">
        <thead>
          <tr>
            <th>交易对</th>
            <th>最新价</th>
            <th>24h 涨跌</th>
            <th class="rank__th-vol">24h 成交额 (USDT)</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="r in rows"
            :key="r.pairCode + tab"
            class="rank__row"
            tabindex="0"
            @click="goTrade(r)"
            @keydown.enter="goTrade(r)"
          >
            <td class="rank__pair">{{ r.pairCode }}</td>
            <td class="ex-num">{{ r.lastPrice }}</td>
            <td
              class="ex-num rank__pct"
              :class="r.changePct >= 0 ? 'rank__pct--up' : 'rank__pct--down'"
            >
              {{ formatChangePct(r.changePct) }}
            </td>
            <td class="ex-num rank__vol">{{ r.quoteVolume24h }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;
@use '@/styles/mixins' as mq;

.rank {
  margin-bottom: $space-8;
}

.rank__head {
  margin-bottom: $space-3;
}

.rank__title {
  margin: 0 0 $space-1;
  font-size: $font-size-xl;
  font-weight: $font-weight-bold;
  letter-spacing: -0.02em;
}

.rank__sub {
  margin: 0;
  font-size: $font-size-sm;
  color: $color-text-tertiary;
}

/* 平面 Tab：与页面同底，底边线 + 选中项品牌下划线（币安式） */
.rank__tabs {
  display: flex;
  flex-wrap: nowrap;
  gap: $space-4;
  padding: 0;
  margin: 0 0 $space-1;
  border: none;
  border-bottom: 1px solid var(--ex-border-subtle);
  background: transparent;
  border-radius: 0;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-x: contain;

  @include mq.media-up(md) {
    flex-wrap: wrap;
    gap: $space-5;
    overflow: visible;
  }
}

.rank__tab {
  flex: 0 0 auto;
  min-width: 0;
  margin-bottom: -1px;
  padding: $space-3 2px $space-3;
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  color: $color-text-tertiary;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  border-radius: 0;
  cursor: pointer;
  white-space: nowrap;
  transition:
    color 0.15s ease,
    border-color 0.15s ease;
}

.rank__tab:hover:not(.rank__tab--on) {
  color: $color-text-secondary;
}

.rank__tab--on {
  color: $color-text-primary;
  border-bottom-color: var(--ex-brand);
}

.rank__table-wrap {
  margin-top: $space-2;
  border: none;
  border-radius: 0;
  overflow: visible;
  background: transparent;

  @include mq.media-down(lg) {
    @include mq.overflow-x-scroll-stable;
  }
}

.rank__table {
  width: 100%;
  min-width: 360px;
  border-collapse: collapse;
  font-size: $font-size-sm;
}

.rank__table th,
.rank__table td {
  padding: $space-3 $space-4;
  text-align: right;
  border-bottom: 1px solid var(--ex-border-subtle);
}

.rank__table th:first-child,
.rank__table td:first-child {
  text-align: left;
}

.rank__table thead th {
  font-weight: $font-weight-semibold;
  color: $color-text-tertiary;
  background: transparent;
  font-size: $font-size-xs;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-bottom-color: var(--ex-border-subtle);
}

.rank__row {
  cursor: pointer;
  transition: background 0.12s ease;
}

.rank__row:hover td {
  background: color-mix(in srgb, var(--ex-text-primary) 4%, transparent);
}

.rank__pair {
  font-weight: $font-weight-medium;
  color: $color-text-primary;
}

.rank__pct--up {
  color: $color-rise;
}

.rank__pct--down {
  color: $color-fall;
}

.rank__vol {
  color: $color-text-secondary;
}

.rank__skel {
  margin-top: $space-2;
  border: none;
  border-radius: 0;
  overflow: hidden;
  background: transparent;
}

.rank__skel-row {
  height: 44px;
  border-bottom: 1px solid var(--ex-border-subtle);
  background: linear-gradient(
    90deg,
    $color-bg-surface 0%,
    $color-bg-hover 50%,
    $color-bg-surface 100%
  );
  background-size: 200% 100%;
  animation: rank-shimmer 1.1s ease-in-out infinite;
}

.rank__skel-row:last-child {
  border-bottom: none;
}

@keyframes rank-shimmer {
  0% {
    background-position: 100% 0;
  }
  100% {
    background-position: -100% 0;
  }
}

@include mq.media-down(md) {
  .rank__th-vol {
    display: none;
  }

  .rank__vol {
    display: none;
  }

  .rank__table th,
  .rank__table td {
    padding: $space-2 $space-3;
    font-size: $font-size-xs;
  }
}
</style>
