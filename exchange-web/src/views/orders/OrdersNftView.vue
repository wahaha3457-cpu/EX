<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { RouteNames } from '@/constants/routeNames'
import { useNftUserStore } from '@/stores/nftUser'
import { useAuthStore } from '@/stores/auth'
import { getNftImageUrl } from '@/api/nft/nftMock'
import ExPageState from '@/components/common/ExPageState.vue'
import { formatPrice } from '@/utils/format'

const { t } = useI18n()
const auth = useAuthStore()
const user = useNftUserStore()
const { loading, loadError, holdings, orders } = storeToRefs(user)

const tab = ref<'listings' | 'buy' | 'sell' | 'history'>('listings')

onMounted(() => {
  const uid = auth.user?.userCode
  if (!uid) return
  void user.bootstrap(uid)
})

const uid = computed(() => auth.user?.userCode ?? '')

function timeStr(iso: string) {
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

const cover = (seed: string) => getNftImageUrl(seed)

const activeListings = computed(() => holdings.value.filter((h) => h.ownership.status === 'LISTED' && h.listing))
const buyOrders = computed(() => orders.value.filter((o) => o.buyerUid === uid.value))
const sellOrders = computed(() => orders.value.filter((o) => o.sellerUid === uid.value))
const historyOrders = computed(() => orders.value.filter((o) => o.status === 'COMPLETED'))
</script>

<template>
  <div class="onv">
    <section class="onv__intro" aria-label="说明">
      <p class="onv__intro-p">{{ t('nft.ordersPage.intro') }}</p>
      <ul class="onv__intro-ul">
        <li>{{ t('nft.ordersPage.bullet1') }}</li>
        <li>{{ t('nft.ordersPage.bullet2') }}</li>
      </ul>
    </section>

    <ExPageState
      :loading="loading && holdings.length === 0 && orders.length === 0"
      use-skeleton
      skeleton-variant="panel"
      :error="loadError"
      :loading-text="t('nft.ordersPage.loading')"
      @retry="uid && user.refresh(uid)"
    >
      <div class="onv__panel">
        <div class="onv__panel-hd">
          <h2 class="onv__h2">{{ t('nft.ordersPage.heading') }}</h2>
          <RouterLink class="onv__link" :to="{ name: RouteNames.MoreNft }">
            {{ t('nft.ordersPage.goMarket') }}
          </RouterLink>
        </div>

        <div class="onv__tabs" role="tablist" :aria-label="t('nft.ordersPage.tabsAria')">
          <button
            type="button"
            role="tab"
            class="onv__tab"
            :class="{ 'onv__tab--on': tab === 'listings' }"
            :aria-selected="tab === 'listings'"
            @click="tab = 'listings'"
          >
            当前挂单
            <span class="onv__tab-badge">{{ activeListings.length }}</span>
          </button>
          <button
            type="button"
            role="tab"
            class="onv__tab"
            :class="{ 'onv__tab--on': tab === 'buy' }"
            :aria-selected="tab === 'buy'"
            @click="tab = 'buy'"
          >
            买入记录
            <span class="onv__tab-badge">{{ buyOrders.length }}</span>
          </button>
          <button
            type="button"
            role="tab"
            class="onv__tab"
            :class="{ 'onv__tab--on': tab === 'sell' }"
            :aria-selected="tab === 'sell'"
            @click="tab = 'sell'"
          >
            卖出记录
            <span class="onv__tab-badge">{{ sellOrders.length }}</span>
          </button>
          <button
            type="button"
            role="tab"
            class="onv__tab"
            :class="{ 'onv__tab--on': tab === 'history' }"
            :aria-selected="tab === 'history'"
            @click="tab = 'history'"
          >
            历史成交
            <span class="onv__tab-badge">{{ historyOrders.length }}</span>
          </button>
        </div>

        <div v-show="tab === 'listings'" class="onv__body" role="tabpanel">
          <p v-if="activeListings.length === 0" class="onv__empty">暂无挂单</p>
          <div v-else class="onv__grid">
            <article v-for="h in activeListings" :key="h.ownership.id" class="onv__card">
              <div class="onv__card-media">
                <img :src="cover(h.item.imageSeed)" :alt="h.item.title" />
              </div>
              <div class="onv__card-body">
                <p class="onv__col">{{ h.item.collectionName }}</p>
                <h3 class="onv__title">{{ h.item.title }}</h3>
                <dl class="onv__dl">
                  <div>
                    <dt>售价</dt>
                    <dd class="ex-num">≈ {{ formatPrice(h.listing?.priceUsdt ?? 0) }} USDT</dd>
                  </div>
                  <div>
                    <dt>上架时间</dt>
                    <dd>{{ timeStr(h.listing?.createdAt ?? h.ownership.acquiredAt) }}</dd>
                  </div>
                  <div>
                    <dt>状态</dt>
                    <dd>LISTED</dd>
                  </div>
                </dl>
              </div>
            </article>
          </div>
        </div>

        <div v-show="tab !== 'listings'" class="onv__body" role="tabpanel">
          <el-table
            :data="tab === 'buy' ? buyOrders : tab === 'sell' ? sellOrders : historyOrders"
            stripe
            class="onv__table"
            empty-text="—"
          >
            <el-table-column prop="time" label="时间" min-width="168">
              <template #default="{ row }">
                {{ timeStr(row.time) }}
              </template>
            </el-table-column>
            <el-table-column prop="itemTitle" label="NFT" min-width="140" />
            <el-table-column prop="collectionName" label="合集" min-width="120" />
            <el-table-column prop="side" label="方向" width="88" />
            <el-table-column label="成交价" min-width="120">
              <template #default="{ row }">
                <span class="ex-num">{{ formatPrice(row.priceUsdt) }} USDT</span>
              </template>
            </el-table-column>
            <el-table-column label="手续费" width="110">
              <template #default="{ row }">
                <span class="ex-num">{{ formatPrice(row.feeUsdt) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="110" />
          </el-table>
        </div>
      </div>
    </ExPageState>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.onv__intro {
  margin-bottom: $space-4;
  padding: $space-3 $space-4;
  border-radius: $radius-md;
  border: 1px solid $color-border;
  background: var(--ex-panel-sunken);
}

.onv__intro-p {
  margin: 0 0 $space-2;
  font-size: $font-size-sm;
  color: $color-text-secondary;
  line-height: 1.55;
}

.onv__intro-ul {
  margin: 0;
  padding-left: 1.2rem;
  font-size: $font-size-xs;
  color: $color-text-tertiary;
  line-height: 1.6;
}

.onv__panel {
  border: 1px solid $color-border;
  border-radius: $radius-lg;
  background: var(--ex-card-surface);
  overflow: hidden;
}

.onv__panel-hd {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: $space-2;
  padding: $space-3 $space-4;
  border-bottom: 1px solid $color-border;
}

.onv__h2 {
  margin: 0;
  font-size: $font-size-md;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.onv__link {
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  color: $color-brand;
  text-decoration: none;
}

.onv__link:hover {
  text-decoration: underline;
}

.onv__tabs {
  display: flex;
  gap: $space-1;
  padding: $space-2 $space-4 0;
  border-bottom: 1px solid $color-border;
  background: var(--ex-bg-muted);
}

.onv__tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 14px;
  margin-bottom: -1px;
  border: 1px solid transparent;
  border-radius: $radius-sm $radius-sm 0 0;
  background: transparent;
  color: $color-text-secondary;
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  cursor: pointer;
}

.onv__tab:hover {
  color: $color-text-primary;
}

.onv__tab--on {
  color: $color-brand;
  background: var(--ex-card-surface);
  border-color: $color-border;
  border-bottom-color: var(--ex-card-surface);
}

.onv__tab-badge {
  font-size: 10px;
  font-weight: $font-weight-bold;
  padding: 1px 6px;
  border-radius: 999px;
  background: var(--ex-surface-inset);
  color: $color-text-tertiary;
}

.onv__tab--on .onv__tab-badge {
  background: rgba(240, 185, 11, 0.15);
  color: $color-brand;
}

.onv__body {
  padding: $space-4;
  min-height: 120px;
}

.onv__empty {
  margin: 0;
  text-align: center;
  padding: $space-6;
  font-size: $font-size-sm;
  color: $color-text-tertiary;
}

.onv__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: $space-4;
}

.onv__card {
  border-radius: $radius-md;
  border: 1px solid $color-border;
  overflow: hidden;
  background: var(--ex-panel-sunken);
}

.onv__card-media {
  aspect-ratio: 1;
  background: var(--ex-bg-muted);
}

.onv__card-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.onv__card-body {
  padding: $space-3;
}

.onv__col {
  margin: 0 0 4px;
  font-size: 11px;
  font-weight: $font-weight-semibold;
  color: $color-brand;
}

.onv__title {
  margin: 0 0 $space-2;
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
  line-height: 1.35;
}

.onv__dl {
  margin: 0;
  display: grid;
  gap: $space-1;
  font-size: 11px;
}

.onv__dl dt {
  margin: 0;
  color: $color-text-tertiary;
  font-weight: $font-weight-regular;
}

.onv__dl dd {
  margin: 0;
  color: $color-text-secondary;
}

.onv__table {
  width: 100%;
}

.onv__st {
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
}

.onv__st--filled {
  color: $color-rise;
}

.onv__st--pending {
  color: $color-brand;
}

.onv__st--outbid {
  color: $color-text-tertiary;
}

.onv__st--cancelled {
  color: $color-text-tertiary;
}
</style>
