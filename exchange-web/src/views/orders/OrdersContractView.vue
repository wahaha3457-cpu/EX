<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { RouteNames } from '@/constants/routeNames'
import { DELIVERY_DEFAULT_SYMBOL } from '@/api/delivery/deliverySymbols'
import { useFuturesTradeStore } from '@/stores/futuresTrade'
import { useDeliveryTradeStore } from '@/stores/deliveryTrade'
import ContractBottomPanel from '@/components/business/futures/ContractBottomPanel.vue'
import DeliveryBottomPanel from '@/components/business/delivery/DeliveryBottomPanel.vue'
import ExPageState from '@/components/common/ExPageState.vue'

const route = useRoute()
const router = useRouter()

const futures = useFuturesTradeStore()
const delivery = useDeliveryTradeStore()
const { loading, loadError, ticker, symbol } = storeToRefs(futures)
const { loading: dLoading, loadError: dLoadError, ticker: dTicker, symbol: dSymbol } = storeToRefs(delivery)

type ContractVenue = 'perp' | 'delivery'
const venue = ref<ContractVenue>('perp')

function readVenueFromQuery(): ContractVenue {
  return route.query.venue === 'delivery' ? 'delivery' : 'perp'
}

async function ensureDeliveryBootstrapped() {
  if (dSymbol.value !== DELIVERY_DEFAULT_SYMBOL) {
    delivery.setSymbol(DELIVERY_DEFAULT_SYMBOL)
  }
  await delivery.bootstrap()
}

onMounted(() => {
  venue.value = readVenueFromQuery()
  void futures.bootstrap()
  if (venue.value === 'delivery') {
    void ensureDeliveryBootstrapped()
  }
})

watch(
  () => route.query.venue,
  () => {
    venue.value = readVenueFromQuery()
  },
)

watch(venue, (v) => {
  void router.replace({ query: { ...route.query, venue: v } })
  if (v === 'delivery') {
    void ensureDeliveryBootstrapped()
  }
})

const perpIntro = computed(() => ({
  lead: `U 本位永续合约：持仓、委托与成交与交易台演示数据同步；当前`,
  sym: ticker.value ? symbol.value : 'BTCUSDT',
  tail: `。支持当前委托撤单与持仓保证金展示（演示）。`,
}))

const deliveryIntro = computed(() => ({
  lead: `币本位风格 USDT 交割合约：到期结算规则与交易台一致；当前展示代码`,
  sym: dTicker.value ? dSymbol.value : DELIVERY_DEFAULT_SYMBOL,
  tail: `。持仓与成交记录见下方 Tab。`,
}))
</script>

<template>
  <div class="ocv">
    <div class="ocv__venue" role="tablist" aria-label="合约类型">
      <button
        type="button"
        role="tab"
        class="ocv__venue-btn"
        :class="{ 'ocv__venue-btn--on': venue === 'perp' }"
        :aria-selected="venue === 'perp'"
        @click="venue = 'perp'"
      >
        永续合约
      </button>
      <button
        type="button"
        role="tab"
        class="ocv__venue-btn"
        :class="{ 'ocv__venue-btn--on': venue === 'delivery' }"
        :aria-selected="venue === 'delivery'"
        @click="venue = 'delivery'"
      >
        交割合约
      </button>
    </div>

    <section v-if="venue === 'perp'" class="ocv__intro" aria-label="永续说明">
      <p class="ocv__intro-p">
        {{ perpIntro.lead }}
        <span class="ocv__sym">{{ perpIntro.sym }}</span>
        {{ perpIntro.tail }}
      </p>
      <ul class="ocv__intro-ul">
        <li>历史委托、成交与资金流水与合约终端底部面板一致。</li>
        <li>正式环境需对接风控、强平与 ADL 状态。</li>
      </ul>
    </section>

    <section v-else class="ocv__intro ocv__intro--delivery" aria-label="交割说明">
      <p class="ocv__intro-p">
        {{ deliveryIntro.lead }}
        <span class="ocv__sym">{{ deliveryIntro.sym }}</span>
        {{ deliveryIntro.tail }}
      </p>
      <ul class="ocv__intro-ul">
        <li>交割侧当前委托在终端以撮合结果进入持仓；订单中心展示持仓、成交与资金流水。</li>
        <li>切换至「永续合约」可查看 U 本位永续全量 Tab。</li>
      </ul>
    </section>

    <ExPageState
      v-if="venue === 'perp'"
      :loading="loading && !ticker"
      use-skeleton
      skeleton-variant="panel"
      :error="loadError"
      loading-text="加载永续合约数据…"
      @retry="futures.bootstrap()"
    >
      <div class="ocv__panel ocv__panel--flush">
        <div class="ocv__panel-hd">
          <h2 class="ocv__h2">永续合约 · 订单</h2>
          <RouterLink class="ocv__link" :to="{ name: RouteNames.ContractTrade, params: { symbol: 'BTCUSDT' } }">
            去交易
          </RouterLink>
        </div>
        <ContractBottomPanel />
      </div>
    </ExPageState>

    <ExPageState
      v-else
      :loading="dLoading && !dTicker"
      use-skeleton
      skeleton-variant="panel"
      :error="dLoadError"
      loading-text="加载交割合约数据…"
      @retry="ensureDeliveryBootstrapped()"
    >
      <div class="ocv__panel ocv__panel--flush">
        <div class="ocv__panel-hd">
          <h2 class="ocv__h2">交割合约 · 订单</h2>
          <RouterLink
            class="ocv__link ocv__link--delivery"
            :to="{ name: RouteNames.DeliveryContract, params: { symbol: DELIVERY_DEFAULT_SYMBOL } }"
          >
            去交易
          </RouterLink>
        </div>
        <DeliveryBottomPanel />
      </div>
    </ExPageState>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;
@use '@/styles/mixins' as mq;

.ocv__venue {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  margin-bottom: $space-4;
  padding: 3px;
  border-radius: $radius-md;
  background: $color-bg-base;
  border: 1px solid $color-border;
}

.ocv__venue-btn {
  flex: 1;
  min-width: 120px;
  padding: $space-2 $space-4;
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  color: $color-text-tertiary;
  background: transparent;
  border: none;
  border-radius: $radius-sm;
  cursor: pointer;
  transition: color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;
}

.ocv__venue-btn:hover {
  color: $color-text-secondary;
}

.ocv__venue-btn--on {
  color: $color-text-primary;
  background: $color-bg-surface;
  box-shadow: 0 1px 0 rgba(48, 132, 252, 0.25);
}

.ocv__venue-btn--on::after {
  content: '';
  display: block;
  margin: 6px auto 0;
  width: 40px;
  height: 2px;
  border-radius: 1px;
  background: linear-gradient(90deg, #3084fc, #6aa9ff);
}

@include mq.media-down(sm) {
  .ocv__venue-btn {
    min-width: 0;
  }
}

.ocv__intro {
  margin-bottom: $space-4;
  padding: $space-3 $space-4;
  border-radius: $radius-md;
  border: 1px solid $color-border;
  background: var(--ex-panel-sunken);
}

.ocv__intro--delivery {
  border-color: color-mix(in srgb, var(--ex-info) 28%, $color-border);
  background: linear-gradient(
    135deg,
    rgba(48, 132, 252, 0.06) 0%,
    var(--ex-panel-sunken) 48%
  );
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

.ocv__panel--flush :deep(.cbp),
.ocv__panel--flush :deep(.dbp) {
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

.ocv__link--delivery {
  color: var(--ex-info);
}
</style>
