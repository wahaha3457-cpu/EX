<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { useMarketStore } from '@/stores/market'
import MarketPageHeader from '@/components/business/market/MarketPageHeader.vue'
import MarketCategoryTabs from '@/components/business/market/MarketCategoryTabs.vue'
import MarketFilterBar from '@/components/business/market/MarketFilterBar.vue'
import MarketTickerTable from '@/components/business/market/MarketTickerTable.vue'
import MarketTopCoinsStrip from '@/components/business/market/MarketTopCoinsStrip.vue'
import ExPageState from '@/components/common/ExPageState.vue'
import { startMockMarketTickerStream, stopMockMarketTickerStream } from '@/websocket/marketTicker'

const market = useMarketStore()
const route = useRoute()
const router = useRouter()
const {
  segment,
  contractSub,
  watchlistSub,
  searchQuery,
  changeFilter,
  displayRows,
  loading,
  loadError,
  tickers,
  marketSummary,
} = storeToRefs(market)

{
  const cs = typeof route.query.cs === 'string' ? route.query.cs : ''
  const ws = typeof route.query.ws === 'string' ? route.query.ws : ''
  if (cs === 'delivery' || cs === 'perpetual') {
    market.setSegment('CONTRACT')
    market.setContractSub(cs === 'delivery' ? 'DELIVERY' : 'PERPETUAL')
  } else if (ws === 'spot' || ws === 'perpetual' || ws === 'delivery') {
    market.setSegment('WATCHLIST')
    market.setWatchlistSub(
      ws === 'spot' ? 'SPOT' : ws === 'perpetual' ? 'PERPETUAL' : 'DELIVERY',
    )
  }
}

onMounted(async () => {
  await market.loadTickers()
  if (import.meta.env.DEV) {
    startMockMarketTickerStream(12000)
  }
})

function queryVal(v: unknown): string {
  if (Array.isArray(v)) return String(v[0] ?? '')
  return v == null ? '' : String(v)
}

watch([segment, contractSub, watchlistSub], () => {
  const next: Record<string, string | string[]> = { ...route.query } as Record<
    string,
    string | string[]
  >

  if (segment.value === 'CONTRACT') {
    next.cs = contractSub.value === 'DELIVERY' ? 'delivery' : 'perpetual'
  } else {
    delete next.cs
  }

  if (segment.value === 'WATCHLIST') {
    next.ws =
      watchlistSub.value === 'SPOT'
        ? 'spot'
        : watchlistSub.value === 'PERPETUAL'
          ? 'perpetual'
          : 'delivery'
  } else {
    delete next.ws
  }

  const same =
    queryVal(route.query.cs) === queryVal(next.cs) &&
    queryVal(route.query.ws) === queryVal(next.ws)
  if (same) return
  void router.replace({ path: route.path, query: next })
})

onUnmounted(() => {
  stopMockMarketTickerStream()
})
</script>

<template>
  <div class="mkt">
    <MarketPageHeader
      :pair-count="marketSummary.pairCount"
      :total-quote-volume="marketSummary.quoteVolume24h"
      :loading="loading"
    />

    <ExPageState
      class="mkt__body"
      :loading="loading && tickers.length === 0"
      use-skeleton
      skeleton-variant="table"
      :error="loadError"
      loading-text="加载行情列表…"
      @retry="market.loadTickers()"
    >
      <div class="mkt__workspace">
        <div class="mkt__primary">
          <MarketTopCoinsStrip v-if="tickers.length" :tickers="tickers" class="mkt__top-strip" />
          <div id="market-main-panel" class="mkt__stack">
            <div class="mkt__control-deck">
              <div class="mkt__deck-row">
                <MarketCategoryTabs
                  :model-value="segment"
                  :contract-sub="contractSub"
                  :watchlist-sub="watchlistSub"
                  @update:model-value="market.setSegment"
                  @update:contract-sub="market.setContractSub"
                  @update:watchlist-sub="market.setWatchlistSub"
                />
              </div>
              <div class="mkt__deck-row mkt__deck-row--filters">
                <MarketFilterBar
                  class="mkt__mf"
                  :search-query="searchQuery"
                  :change-filter="changeFilter"
                  @update:search-query="market.setSearch"
                  @update:change-filter="market.setChangeFilter"
                />
              </div>
              <p class="mkt__watch-hint">
                <span class="mkt__watch-hint-short">自选数据存于本地；登录后可与云端合并。</span>
                <span class="mkt__watch-hint-full">
                  自选使用浏览器本地存储；登录后可通过
                  <code class="mkt__code">POST /v1/user/watchlist</code>
                  等与云端合并（预留）。
                </span>
              </p>
            </div>

            <MarketTickerTable
              class="mkt__table-embed"
              :rows="displayRows"
              :loading="loading"
              :market-segment="segment"
            />
          </div>
        </div>
      </div>
    </ExPageState>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;
@use '@/styles/mixins' as mq;

/* 行情中心：略放宽上限，便于大屏主表格饱满 */
.mkt {
  display: flex;
  flex-direction: column;
  gap: $space-4;
  width: 100%;
  max-width: min(1560px, var(--ex-container-max));
  margin-inline: auto;
  min-width: 0;
}

.mkt__body {
  width: 100%;
  min-width: 0;
}

.mkt__workspace {
  display: flex;
  flex-direction: column;
  gap: 0;
  align-items: stretch;
  width: 100%;
  min-width: 0;
}

.mkt__top-strip {
  width: 100%;
  min-width: 0;
}

.mkt__primary {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

/* 主行情区：平面铺在页面背景上（参考币安行情列表，无外层卡片区隔） */
.mkt__stack {
  background: transparent;
  overflow: visible;
}

.mkt__control-deck {
  padding: $space-3 0;
  background: transparent;
  border-bottom: 1px solid var(--ex-border-subtle);
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.mkt__deck-row {
  min-width: 0;
}

.mkt__deck-row--filters :deep(.mfbar) {
  gap: $space-3;
}

.mkt__deck-row--filters :deep(.msrch) {
  max-width: none;
  flex: 1 1 260px;
}

@include mq.media-up(xl) {
  .mkt__deck-row--filters :deep(.mfbar) {
    flex-wrap: nowrap;
    align-items: center;
  }

  .mkt__deck-row--filters :deep(.mfbar__sort-hint) {
    flex: 0 1 220px;
    text-align: right;
  }
}

.mkt__watch-hint {
  margin: 0;
  font-size: $font-size-sm;
  color: $color-text-tertiary;
  line-height: 1.45;
}

.mkt__watch-hint-short {
  display: none;
}

.mkt__watch-hint-full {
  display: inline;
}

@include mq.media-down(md) {
  .mkt__watch-hint-short {
    display: inline;
  }

  .mkt__watch-hint-full {
    display: none;
  }
}

.mkt__code {
  font-family: $font-family-mono;
  font-size: 0.95em;
  color: $color-text-secondary;
}

/* 表格与主区同属平面层 */
.mkt__table-embed :deep(.mtable) {
  border: none;
  border-radius: 0;
  box-shadow: none;
  background: transparent;
}

</style>
