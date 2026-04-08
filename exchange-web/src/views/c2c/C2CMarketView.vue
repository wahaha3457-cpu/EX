<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { RouteNames } from '@/constants/routeNames'
import { useAuthStore } from '@/stores/auth'
import { useC2cMarketStore } from '@/stores/c2cMarket'
import { formatPrice } from '@/utils/format/number'
import type { C2cAd, C2cPayMethod } from '@/types/c2c'
import ExPageState from '@/components/common/ExPageState.vue'
import C2CTradeModal from '@/components/business/c2c/C2CTradeModal.vue'

const store = useC2cMarketStore()
const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const {
  filteredAds,
  loadingAds,
  adsError,
  mainTab,
  fiatFilter,
  cryptoFilter,
  payFilter,
  cryptoOptions,
} = storeToRefs(store)

const tradeOpen = ref(false)
const tradeAd = ref<C2cAd | null>(null)

const userSideForTrade = computed(() => (mainTab.value === 'sell' ? 'sell' : 'buy'))

function syncMarketQuery() {
  const q = route.query.tab
  if (q === 'buy' || q === 'sell') {
    mainTab.value = q
  }
  const fiat = route.query.fiat
  if (typeof fiat === 'string' && (fiat === 'CNY' || fiat === 'USD')) {
    store.setFiat(fiat)
  }
  const crypto = route.query.crypto
  if (typeof crypto === 'string' && crypto) {
    cryptoFilter.value = crypto
  }
}

onMounted(() => {
  void store.bootstrapAds()
  syncMarketQuery()
})

watch(
  () => route.query,
  () => syncMarketQuery(),
)

watch(
  () => auth.isAuthenticated,
  (ok) => {
    if (ok) void store.refreshOrders()
  },
  { immediate: true },
)

function payLabel(m: C2cPayMethod) {
  if (m === 'bank') return '银行卡'
  if (m === 'alipay') return '支付宝'
  if (m === 'wechat') return '微信'
  return m
}

function openTrade(ad: C2cAd) {
  tradeAd.value = ad
  tradeOpen.value = true
}

function onTradeConfirm(fiatAmount: number) {
  const ad = tradeAd.value
  if (!ad) return
  void store.placeOrder(ad, userSideForTrade.value, fiatAmount).then((o) => {
    if (o) {
      void router.push({
        name: RouteNames.C2COrdersRunning,
        params: { filter: 'unpaid' },
        query: { open: o.id },
      })
    }
  })
}
</script>

<template>
  <div class="c2cm">
    <nav class="c2cm__tabs" aria-label="买卖方向">
      <button
        type="button"
        class="c2cm__tab"
        :class="{ 'c2cm__tab--on': mainTab === 'buy' }"
        @click="mainTab = 'buy'"
      >
        我要买
      </button>
      <button
        type="button"
        class="c2cm__tab"
        :class="{ 'c2cm__tab--on': mainTab === 'sell' }"
        @click="mainTab = 'sell'"
      >
        我要卖
      </button>
    </nav>

    <div class="c2cm__filters" aria-label="筛选">
      <p class="c2cm__fiat-hint">
        当前法币：<strong class="c2cm__fiat-tag">{{ fiatFilter }}</strong>（在页面右上角切换，适用于整个 C2C 模块）
      </p>
      <div class="c2cm__filter-row">
        <label class="c2cm__flab">数字币</label>
        <div class="c2cm__chips">
          <button
            v-for="c in cryptoOptions"
            :key="c"
            type="button"
            class="c2cm__chip"
            :class="{ 'c2cm__chip--on': cryptoFilter === c }"
            @click="cryptoFilter = c"
          >
            {{ c }}
          </button>
        </div>
      </div>
      <div class="c2cm__filter-row">
        <label class="c2cm__flab">支付方式</label>
        <div class="c2cm__chips">
          <button
            type="button"
            class="c2cm__chip"
            :class="{ 'c2cm__chip--on': payFilter === '' }"
            @click="payFilter = ''"
          >
            全部
          </button>
          <button
            type="button"
            class="c2cm__chip"
            :class="{ 'c2cm__chip--on': payFilter === 'bank' }"
            @click="payFilter = 'bank'"
          >
            银行卡
          </button>
          <button
            type="button"
            class="c2cm__chip"
            :class="{ 'c2cm__chip--on': payFilter === 'alipay' }"
            @click="payFilter = 'alipay'"
          >
            支付宝
          </button>
          <button
            type="button"
            class="c2cm__chip"
            :class="{ 'c2cm__chip--on': payFilter === 'wechat' }"
            @click="payFilter = 'wechat'"
          >
            微信
          </button>
        </div>
      </div>
      <p class="c2cm__sort-hint">
        {{ mainTab === 'buy' ? '已按单价从低到高排序（更优价在上）' : '已按单价从高到低排序（卖出更优价在上）' }}
      </p>
    </div>

    <ExPageState
      :loading="loadingAds"
      use-skeleton
      skeleton-variant="table"
      :error="adsError"
      :empty="!loadingAds && !filteredAds.length"
      empty-title="暂无符合条件的广告"
      empty-description="可尝试在右上角切换法币，或更换币种与支付方式。"
      loading-text="加载广告…"
      @retry="store.bootstrapAds(true)"
    >
      <div class="c2cm__table-wrap">
        <table class="c2cm__table" aria-label="C2C 广告">
          <thead>
            <tr>
              <th>商家</th>
              <th>单价</th>
              <th>限额 / 数量</th>
              <th>支付方式</th>
              <th />
            </tr>
          </thead>
          <tbody>
            <tr v-for="ad in filteredAds" :key="ad.id">
              <td>
                <div class="c2cm__merch">
                  <span class="c2cm__mname">{{ ad.merchant.displayName }}</span>
                  <div class="c2cm__badges">
                    <span v-for="b in ad.merchant.badges" :key="b.key" class="c2cm__badge">{{ b.label }}</span>
                    <span v-if="ad.tag" class="c2cm__badge c2cm__badge--tag">{{ ad.tag }}</span>
                  </div>
                  <p class="c2cm__mstat">
                    {{ ad.merchant.trades30d }} 单 · 成交
                    <span class="ex-num">{{ formatPrice(ad.merchant.completionRate * 100) }}%</span>
                    · 平均放币 {{ ad.merchant.avgReleaseMin }} 分钟
                  </p>
                </div>
              </td>
              <td>
                <span class="c2cm__price ex-num">{{ formatPrice(ad.price) }}</span>
                <span class="c2cm__unit">{{ ad.fiat }}</span>
              </td>
              <td>
                <div class="c2cm__limit">
                  {{ formatPrice(ad.minFiat) }} – {{ formatPrice(ad.maxFiat) }} {{ ad.fiat }}
                </div>
                <div class="c2cm__avail">可交易 <span class="ex-num">{{ formatPrice(ad.availableCrypto) }}</span> {{ ad.crypto }}</div>
              </td>
              <td>
                <div class="c2cm__pays">
                  <span v-for="m in ad.methods" :key="m" class="c2cm__pay">{{ payLabel(m) }}</span>
                </div>
              </td>
              <td class="c2cm__act">
                <button type="button" class="c2cm__btn" @click="openTrade(ad)">
                  {{ mainTab === 'buy' ? '购买' : '出售' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <ul class="c2cm__cards">
        <li v-for="ad in filteredAds" :key="ad.id" class="c2cm__card">
          <div class="c2cm__card-top">
            <div>
              <span class="c2cm__mname">{{ ad.merchant.displayName }}</span>
              <div class="c2cm__badges">
                <span v-for="b in ad.merchant.badges" :key="b.key" class="c2cm__badge">{{ b.label }}</span>
              </div>
            </div>
            <button type="button" class="c2cm__btn c2cm__btn--sm" @click="openTrade(ad)">
              {{ mainTab === 'buy' ? '购买' : '出售' }}
            </button>
          </div>
          <p class="c2cm__card-price">
            <span class="ex-num">{{ formatPrice(ad.price) }}</span> {{ ad.fiat }} / {{ ad.crypto }}
          </p>
          <p class="c2cm__card-limit">
            限额 {{ formatPrice(ad.minFiat) }} – {{ formatPrice(ad.maxFiat) }} {{ ad.fiat }} · 可交易
            {{ formatPrice(ad.availableCrypto) }} {{ ad.crypto }}
          </p>
          <div class="c2cm__pays">
            <span v-for="m in ad.methods" :key="m" class="c2cm__pay">{{ payLabel(m) }}</span>
          </div>
        </li>
      </ul>
    </ExPageState>

    <C2CTradeModal v-model="tradeOpen" :ad="tradeAd" :user-side="userSideForTrade" @confirm="onTradeConfirm" />
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;
@use '@/styles/mixins' as mq;

$c2cm-gap: $space-3;

.c2cm {
  display: flex;
  flex-direction: column;
  gap: $c2cm-gap;
}

.c2cm__tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 0;
  padding: 6px;
  border-radius: $radius-md;
  background: var(--ex-surface-inset);
  border: 1px solid $color-border;
  width: fit-content;
  max-width: 100%;
  flex-wrap: wrap;
}

.c2cm__tab {
  border: none;
  background: transparent;
  color: $color-text-secondary;
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  padding: 10px 20px;
  border-radius: $radius-sm;
  cursor: pointer;
}

.c2cm__tab--on {
  background: rgba(240, 185, 11, 0.18);
  color: $color-brand;
}

.c2cm__filters {
  margin-bottom: 0;
  padding: $space-3 $space-4;
  border-radius: $radius-md;
  border: 1px solid $color-border;
  background: var(--ex-card-surface);
}

.c2cm__fiat-hint {
  margin: 0 0 $space-2;
  font-size: 11px;
  color: $color-text-secondary;
  line-height: 1.5;
}

.c2cm__fiat-tag {
  color: $color-brand;
  font-weight: $font-weight-bold;
}

.c2cm__filter-row {
  margin-bottom: $space-3;

  &:last-of-type {
    margin-bottom: $space-2;
  }
}

.c2cm__flab {
  display: block;
  font-size: 11px;
  color: $color-text-tertiary;
  font-weight: $font-weight-semibold;
  margin-bottom: 8px;
}

.c2cm__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.c2cm__chip {
  border: 1px solid $color-border;
  background: var(--ex-fill-ghost);
  color: $color-text-secondary;
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  padding: 6px 14px;
  border-radius: $radius-sm;
  cursor: pointer;
}

.c2cm__chip--on {
  border-color: rgba(240, 185, 11, 0.45);
  background: rgba(240, 185, 11, 0.12);
  color: $color-brand;
}

.c2cm__sort-hint {
  margin: $space-2 0 0;
  font-size: 11px;
  color: $color-text-tertiary;
  line-height: 1.45;
}

.c2cm__table-wrap {
  display: none;
  border-radius: $radius-md;
  border: 1px solid $color-border;
  overflow: hidden;
  background: var(--ex-card-surface);

  @include mq.media-up(md) {
    display: block;
  }
}

.c2cm__table {
  width: 100%;
  border-collapse: collapse;
  font-size: $font-size-sm;

  th,
  td {
    padding: $space-3 $space-4;
    text-align: left;
    border-bottom: 1px solid $color-border;
  }

  th {
    font-size: 11px;
    color: $color-text-tertiary;
    font-weight: $font-weight-semibold;
    background: var(--ex-panel-sunken);
  }

  tr:last-child td {
    border-bottom: none;
  }
}

.c2cm__merch {
  min-width: 200px;
}

.c2cm__mname {
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.c2cm__badges {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 6px;
}

.c2cm__badge {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(48, 132, 252, 0.12);
  color: #7ab8ff;
}

.c2cm__badge--tag {
  background: rgba(240, 185, 11, 0.12);
  color: $color-brand;
}

.c2cm__mstat {
  margin: 8px 0 0;
  font-size: 11px;
  color: $color-text-tertiary;
}

.c2cm__price {
  font-size: $font-size-md;
  font-weight: $font-weight-bold;
  color: $color-rise;
}

.c2cm__unit {
  font-size: $font-size-xs;
  color: $color-text-tertiary;
  margin-left: 4px;
}

.c2cm__limit {
  color: $color-text-primary;
  font-weight: $font-weight-semibold;
}

.c2cm__avail {
  margin-top: 4px;
  font-size: 11px;
  color: $color-text-tertiary;
}

.c2cm__pays {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.c2cm__pay {
  font-size: 11px;
  padding: 4px 8px;
  border-radius: 4px;
  background: var(--ex-fill-hover-subtle);
  color: $color-text-secondary;
}

.c2cm__act {
  vertical-align: middle;
}

.c2cm__btn {
  padding: 10px 22px;
  border: none;
  border-radius: $radius-sm;
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  cursor: pointer;
  background: $color-brand;
  color: var(--ex-on-brand);
}

.c2cm__btn--sm {
  padding: 8px 16px;
  font-size: $font-size-xs;
}

.c2cm__cards {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: $space-3;

  @include mq.media-up(md) {
    display: none;
  }
}

.c2cm__card {
  padding: $space-4;
  border-radius: $radius-md;
  border: 1px solid $color-border;
  background: var(--ex-card-surface);
}

.c2cm__card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: $space-2;
  margin-bottom: $space-2;
}

.c2cm__card-price {
  margin: 0 0 6px;
  font-size: $font-size-md;
  font-weight: $font-weight-bold;
  color: $color-rise;
}

.c2cm__card-limit {
  margin: 0 0 $space-2;
  font-size: 11px;
  color: $color-text-tertiary;
  line-height: 1.45;
}
</style>
