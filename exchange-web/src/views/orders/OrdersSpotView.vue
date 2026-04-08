<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { storeToRefs } from 'pinia'
import { RouteNames } from '@/constants/routeNames'
import { useSpotTradeStore } from '@/stores/spotTrade'
import SpotOrdersPanel from '@/components/business/spot/SpotOrdersPanel.vue'
import ExPageState from '@/components/common/ExPageState.vue'

const store = useSpotTradeStore()
const { loading, loadError, ticker, symbol } = storeToRefs(store)

onMounted(() => {
  void store.bootstrap()
})
</script>

<template>
  <div class="ocv">
    <section class="ocv__intro" aria-label="说明">
      <p class="ocv__intro-p">
        现货委托与成交与交易台共用同一套演示数据；当前展示交易对
        <span v-if="ticker" class="ocv__sym">{{ symbol.replace('_', '/') }}</span>
        <span v-else>BTC/USDT</span>
        。生产环境支持全市场筛选、批量撤单与导出。
      </p>
      <ul class="ocv__intro-ul">
        <li>当前委托可撤单；历史委托与成交记录按订单号关联。</li>
        <li>若需切换交易对下单，请前往现货交易页。</li>
      </ul>
    </section>

    <ExPageState
      :loading="loading && !ticker"
      use-skeleton
      skeleton-variant="panel"
      :error="loadError"
      loading-text="加载现货订单…"
      @retry="store.bootstrap()"
    >
      <div class="ocv__panel ocv__panel--flush">
        <div class="ocv__panel-hd">
          <h2 class="ocv__h2">现货订单</h2>
          <RouterLink class="ocv__link" :to="{ name: RouteNames.SpotTrade, params: { symbol: 'BTC_USDT' } }">
            去交易
          </RouterLink>
        </div>
        <SpotOrdersPanel />
      </div>
    </ExPageState>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

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

.ocv__sym {
  font-weight: $font-weight-bold;
  color: $color-text-primary;
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

.ocv__panel--flush .ocv__panel-hd {
  border-bottom: 1px solid $color-border;
}

.ocv__panel--flush :deep(.sop) {
  border: none;
  border-radius: 0;
}

.ocv__panel-hd {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: $space-2;
  padding: $space-3 $space-4;
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
</style>
