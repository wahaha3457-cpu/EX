<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { RouteNames } from '@/constants/routeNames'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { useNftMarketStore } from '@/stores/nftMarket'
import { useNftUserStore } from '@/stores/nftUser'
import ExPageState from '@/components/common/ExPageState.vue'
import NftBuyConfirmDialog from '@/views/nft/components/NftBuyConfirmDialog.vue'
import { formatPrice } from '@/utils/format'
import type { NftMarketRow } from '@/types/nft'

const { t } = useI18n()
const auth = useAuthStore()
const app = useAppStore()
const market = useNftMarketStore()
const user = useNftUserStore()

const { chainFilter, categoryFilter, sort, searchQuery, loading, loadError, filteredRows, selected } =
  storeToRefs(market)

const uid = computed(() => auth.user?.userCode ?? '')

const buyDlgOpen = ref(false)
const buyRow = ref<NftMarketRow | null>(null)
const buyCover = ref('')

const myNftDest = computed(() =>
  auth.isAuthenticated ? { name: RouteNames.NftMy } : { name: RouteNames.Login, query: { redirect: '/more/nft/my' } },
)

const nftOrdersDest = computed(() =>
  auth.isAuthenticated ? { name: RouteNames.OrdersNft } : { name: RouteNames.Login, query: { redirect: '/orders/nft' } },
)

const drawerOpen = computed({
  get: () => selected.value != null,
  set: (v: boolean) => {
    if (!v) market.closeItem()
  },
})

const selectedImage = computed(() => (selected.value ? market.imageUrl(selected.value.item.imageSeed) : ''))

const chains = computed(() =>
  (['ALL', 'BSC', 'ETH', 'POLYGON'] as const).map((k) => ({ value: k, label: t(`nft.chain.${k}`) })),
)

const cats = computed(() =>
  (['ALL', 'PFP', 'ART', 'GAME', 'SPORT', 'METAVERSE'] as const).map((k) => ({ value: k, label: t(`nft.cat.${k}`) })),
)

const sorts = computed(() =>
  (['latest', 'price_asc', 'price_desc', 'popular'] as const).map((k) => ({ value: k, label: t(`nft.sort.${k}`) })),
)

onMounted(() => {
  void market.bootstrap()
})

function openRow(r: (typeof filteredRows.value)[number]) {
  market.openRow(r)
}

function openBuyConfirm() {
  const row = selected.value
  if (!row) return
  if (!uid.value) {
    app.pushToast('warning', t('nft.toast.needLogin'))
    return
  }
  buyRow.value = row
  buyCover.value = market.imageUrl(row.item.imageSeed)
  buyDlgOpen.value = true
}

function onBuyFlowCompleted() {
  market.closeItem()
  void market.refresh()
  if (uid.value) void user.refresh(uid.value)
}
</script>

<template>
  <div class="nftm">
    <header class="nftm__hero">
      <div class="nftm__hero-txt">
        <p class="nftm__eyebrow">{{ t('nft.heroEyebrow') }}</p>
        <h1 class="nftm__title">{{ t('nft.heroTitle') }}</h1>
        <p class="nftm__lead">固定价格 · USDT 结算 · 站内托管</p>
      </div>
      <div class="nftm__hero-actions">
        <RouterLink class="nftm__btn nftm__btn--pri" :to="myNftDest">
          {{ auth.isAuthenticated ? '我的 NFT' : t('nft.portal.ctaLogin') }}
        </RouterLink>
        <RouterLink class="nftm__btn" :to="nftOrdersDest">NFT 订单</RouterLink>
      </div>
    </header>

    <div class="nftm__toolbar">
      <el-input v-model="searchQuery" class="nftm__search" clearable :placeholder="t('nft.searchPh')" />
      <el-select
        :model-value="chainFilter"
        class="nftm__sel"
        :teleported="true"
        @update:model-value="market.setChain($event as typeof chainFilter)"
      >
        <el-option v-for="c in chains" :key="c.value" :label="c.label" :value="c.value" />
      </el-select>
      <el-select
        :model-value="categoryFilter"
        class="nftm__sel"
        :teleported="true"
        @update:model-value="market.setCategory($event as typeof categoryFilter)"
      >
        <el-option v-for="c in cats" :key="c.value" :label="c.label" :value="c.value" />
      </el-select>
      <el-select
        :model-value="sort"
        class="nftm__sel"
        :teleported="true"
        @update:model-value="market.setSort($event as typeof sort)"
      >
        <el-option v-for="s in sorts" :key="s.value" :label="s.label" :value="s.value" />
      </el-select>
      <button type="button" class="nftm__refresh" @click="market.refresh()">刷新</button>
    </div>

    <ExPageState
      :loading="loading"
      use-skeleton
      skeleton-variant="grid"
      :error="loadError"
      loading-text="加载 NFT…"
      @retry="market.refresh()"
    >
      <p v-if="filteredRows.length === 0" class="nftm__empty">{{ t('nft.empty') }}</p>
      <div v-else class="nftm__grid">
        <article v-for="r in filteredRows" :key="r.listing.id" class="nftm__card" @click="openRow(r)">
          <div class="nftm__media">
            <img :src="market.imageUrl(r.item.imageSeed)" :alt="r.item.title" />
            <span class="nftm__pill">一口价</span>
          </div>
          <div class="nftm__body">
            <p class="nftm__col">{{ r.item.collectionName }}</p>
            <h3 class="nftm__name">{{ r.item.title }}</h3>
            <p class="nftm__price ex-num">{{ formatPrice(r.listing.priceUsdt) }} USDT</p>
            <div class="nftm__foot">
              <span class="nftm__muted">卖家 {{ r.listing.sellerUid }}</span>
              <span class="nftm__chain">{{ t(`nft.chain.${r.item.chain}`) }}</span>
            </div>
          </div>
        </article>
      </div>
    </ExPageState>
  </div>

  <el-drawer
    v-model="drawerOpen"
    :title="selected?.item.title ?? ''"
    direction="rtl"
    size="min(100%, 440px)"
    destroy-on-close
    append-to-body
  >
    <template v-if="selected">
      <div class="nftd">
        <div class="nftd__media">
          <img :src="selectedImage" :alt="selected.item.title" />
        </div>
        <p class="nftd__col">{{ selected.item.collectionName }}</p>
        <div class="nftd__line">
          <span>售价</span>
          <span class="ex-num">{{ formatPrice(selected.listing.priceUsdt) }} USDT</span>
        </div>
        <p class="nftd__desc">{{ selected.item.description }}</p>
      </div>
    </template>

    <template #footer>
      <div v-if="selected" class="nftd__foot">
        <button type="button" class="nftd__btn" @click="drawerOpen = false">关闭</button>
        <button type="button" class="nftd__btn nftd__btn--pri" :disabled="buyDlgOpen" @click="openBuyConfirm">
          立即购买
        </button>
      </div>
    </template>
  </el-drawer>

  <NftBuyConfirmDialog
    v-model="buyDlgOpen"
    :row="buyRow"
    :cover-url="buyCover"
    @completed="onBuyFlowCompleted"
  />
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;
@use '@/styles/mixins' as mq;

.nftm {
  width: 100%;
  max-width: min(1200px, var(--ex-container-max));
  margin: 0 auto;
  padding-bottom: $space-8;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.nftm__hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: $space-4;
  padding: $space-4;
  border-radius: $radius-lg;
  border: 1px solid $color-border;
  background: var(--ex-bg-elevated);
}

.nftm__eyebrow {
  margin: 0 0 $space-1;
  font-size: 11px;
  font-weight: $font-weight-bold;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: $color-brand;
}

.nftm__title {
  margin: 0 0 $space-1;
  font-size: $font-size-xxl;
  font-weight: $font-weight-bold;
  letter-spacing: -0.02em;
  color: $color-text-primary;
}

.nftm__lead {
  margin: 0;
  font-size: $font-size-sm;
  color: $color-text-tertiary;
}

.nftm__hero-actions {
  display: flex;
  gap: $space-2;
  flex-wrap: wrap;
}

.nftm__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 36px;
  padding: 0 $space-4;
  border-radius: $radius-md;
  border: 1px solid $color-border;
  background: transparent;
  color: $color-text-primary;
  text-decoration: none;
  font-weight: $font-weight-semibold;
}

.nftm__btn:hover {
  background: var(--ex-fill-hover-subtle);
}

.nftm__btn--pri {
  background: var(--ex-brand);
  color: var(--ex-on-brand);
  border-color: color-mix(in srgb, var(--ex-brand) 45%, transparent);
}

.nftm__btn--pri:hover {
  background: var(--ex-brand-hover);
}

.nftm__toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
  align-items: center;
}

.nftm__search {
  min-width: min(440px, 100%);
  flex: 1 1 260px;
}

.nftm__sel {
  width: 160px;
}

.nftm__refresh {
  border: 1px solid $color-border;
  background: transparent;
  color: $color-text-primary;
  border-radius: $radius-md;
  padding: 8px 12px;
  font-weight: $font-weight-semibold;
  cursor: pointer;
}

.nftm__refresh:hover {
  background: var(--ex-fill-hover-subtle);
}

.nftm__grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: $space-4;
}

@include mq.media-down(lg) {
  .nftm__grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@include mq.media-down(md) {
  .nftm__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .nftm__hero {
    flex-direction: column;
    align-items: stretch;
  }
}

@include mq.media-down(sm) {
  .nftm__grid {
    grid-template-columns: 1fr;
  }
}

.nftm__card {
  border: 1px solid $color-border;
  border-radius: $radius-lg;
  background: var(--ex-card-surface);
  overflow: hidden;
  cursor: pointer;
}

.nftm__media {
  position: relative;
}

.nftm__media img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  display: block;
}

.nftm__pill {
  position: absolute;
  left: $space-2;
  bottom: $space-2;
  font-size: 10px;
  font-weight: $font-weight-bold;
  padding: 4px 8px;
  border-radius: $radius-sm;
  background: var(--ex-bg-elevated);
  border: 1px solid $color-border;
  color: $color-text-secondary;
}

.nftm__body {
  padding: $space-3;
}

.nftm__col {
  margin: 0 0 4px;
  font-size: 11px;
  color: $color-brand;
  font-weight: $font-weight-semibold;
}

.nftm__name {
  margin: 0 0 $space-2;
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.nftm__price {
  margin: 0;
  font-size: $font-size-sm;
  color: $color-text-secondary;
  font-variant-numeric: tabular-nums;
}

.nftm__foot {
  margin-top: $space-2;
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: $color-text-tertiary;
}

.nftm__empty {
  text-align: center;
  padding: $space-8 $space-4;
  color: $color-text-tertiary;
}

.nftd__media img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: $radius-md;
  border: 1px solid $color-border;
  display: block;
}

.nftd__col {
  margin: $space-3 0 $space-2;
  font-size: $font-size-sm;
  color: $color-brand;
  font-weight: $font-weight-semibold;
}

.nftd__line {
  display: flex;
  justify-content: space-between;
  font-size: $font-size-sm;
  color: $color-text-secondary;
  padding: $space-2 0;
  border-top: 1px solid $color-border;
  border-bottom: 1px solid $color-border;
}

.nftd__desc {
  margin: $space-3 0 0;
  font-size: $font-size-sm;
  color: $color-text-secondary;
  line-height: 1.6;
}

.nftd__foot {
  display: flex;
  gap: $space-2;
  justify-content: flex-end;
}

.nftd__btn {
  border: 1px solid $color-border;
  background: transparent;
  color: $color-text-primary;
  border-radius: $radius-sm;
  padding: 8px 12px;
  font-weight: $font-weight-semibold;
  cursor: pointer;
}

.nftd__btn--pri {
  background: var(--ex-brand);
  color: var(--ex-on-brand);
  border-color: color-mix(in srgb, var(--ex-brand) 45%, transparent);
}

.nftd__btn--pri:hover {
  background: var(--ex-brand-hover);
}
</style>

