<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { RouteNames } from '@/constants/routeNames'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { useNftUserStore } from '@/stores/nftUser'
import { getNftImageUrl } from '@/api/nft/nftMock'
import ExPageState from '@/components/common/ExPageState.vue'
import { formatPrice } from '@/utils/format'
import NftListDialog from '@/views/nft/components/NftListDialog.vue'

const { t } = useI18n()
const router = useRouter()
const auth = useAuthStore()
const app = useAppStore()
const user = useNftUserStore()
const { loading, loadError, holdings, orders } = storeToRefs(user)

const tab = ref<'owned' | 'listed' | 'trades'>('owned')

const uid = computed(() => auth.user?.userCode ?? '')

onMounted(() => {
  if (!uid.value) return
  void user.bootstrap(uid.value)
})

const owned = computed(() => holdings.value.filter((h) => h.ownership.status === 'OWNED'))
const listed = computed(() => holdings.value.filter((h) => h.ownership.status === 'LISTED'))

const tradeRows = computed(() => orders.value.filter((o) => o.status === 'COMPLETED'))

const listDlg = ref<{ open: boolean; itemId: string; title: string; cover: string }>({
  open: false,
  itemId: '',
  title: '',
  cover: '',
})

function cover(seed: string) {
  return getNftImageUrl(seed)
}

function onSell(h: (typeof holdings.value)[number]) {
  if (!uid.value) {
    app.pushToast('warning', t('nft.toast.needLogin'))
    return
  }
  listDlg.value = {
    open: true,
    itemId: h.item.id,
    title: h.item.title,
    cover: cover(h.item.imageSeed),
  }
}

async function onListed() {
  if (!uid.value) return
  await user.refresh(uid.value)
}

async function onDelist(h: (typeof holdings.value)[number]) {
  if (!uid.value || !h.listing) return
  const r = await user.delist({ uid: uid.value, listingId: h.listing.id })
  if (!r.ok) {
    app.pushToast('warning', t('nft.toast.failed'))
    return
  }
  app.pushToast('success', t('nft.toast.completedDemo'))
  await user.refresh(uid.value)
}

/** 有上一路由记录则 history.back，否则进入 NFT 市场（直达本页时避免空白返回） */
function goBack() {
  const st = router.options.history.state as { back?: string | null } | undefined
  if (st?.back) {
    router.back()
    return
  }
  void router.push({ name: RouteNames.MoreNft })
}
</script>

<template>
  <div class="nmy">
    <header class="nmy__head">
      <div class="nmy__head-row">
        <button type="button" class="nmy__back" @click="goBack">← 返回</button>
        <RouterLink class="nmy__back nmy__back--link" :to="{ name: RouteNames.MoreNft }">NFT 市场</RouterLink>
      </div>
      <div>
        <h1 class="nmy__h">我的 NFT</h1>
        <p class="nmy__sub">持有、挂单与成交记录（固定价格 · USDT 结算）</p>
      </div>
    </header>

    <ExPageState
      :loading="loading && holdings.length === 0"
      use-skeleton
      skeleton-variant="panel"
      :error="loadError"
      loading-text="加载 NFT…"
      @retry="uid && user.refresh(uid)"
    >
      <div class="nmy__tabs" role="tablist" aria-label="NFT tabs">
        <button type="button" class="nmy__tab" :class="{ 'nmy__tab--on': tab === 'owned' }" @click="tab = 'owned'">
          持有中 <span class="nmy__badge">{{ owned.length }}</span>
        </button>
        <button
          type="button"
          class="nmy__tab"
          :class="{ 'nmy__tab--on': tab === 'listed' }"
          @click="tab = 'listed'"
        >
          出售中 <span class="nmy__badge">{{ listed.length }}</span>
        </button>
        <button
          type="button"
          class="nmy__tab"
          :class="{ 'nmy__tab--on': tab === 'trades' }"
          @click="tab = 'trades'"
        >
          已成交 <span class="nmy__badge">{{ tradeRows.length }}</span>
        </button>
      </div>

      <section v-show="tab !== 'trades'" class="nmy__grid">
        <p v-if="(tab === 'owned' ? owned : listed).length === 0" class="nmy__empty">暂无记录</p>
        <article
          v-for="h in tab === 'owned' ? owned : listed"
          :key="h.ownership.id"
          class="nmy__card"
        >
          <div class="nmy__media">
            <img :src="cover(h.item.imageSeed)" :alt="h.item.title" />
          </div>
          <div class="nmy__body">
            <p class="nmy__col">{{ h.item.collectionName }}</p>
            <h3 class="nmy__title">{{ h.item.title }}</h3>
            <p v-if="h.listing" class="nmy__price ex-num">挂单：{{ formatPrice(h.listing.priceUsdt) }} USDT</p>
            <p v-else class="nmy__price ex-num">成本：{{ formatPrice(h.ownership.costUsdt) }} USDT</p>

            <div class="nmy__actions">
              <button
                v-if="!h.listing"
                type="button"
                class="nmy__btn nmy__btn--pri"
                @click="onSell(h)"
              >
                出售
              </button>
              <button v-else type="button" class="nmy__btn" @click="onDelist(h)">下架</button>
            </div>
          </div>
        </article>
      </section>

      <section v-show="tab === 'trades'" class="nmy__panel">
        <p v-if="tradeRows.length === 0" class="nmy__empty">暂无成交</p>
        <el-table v-else :data="tradeRows" stripe class="nmy__table" empty-text="—">
          <el-table-column prop="time" label="时间" min-width="160" />
          <el-table-column prop="itemTitle" label="NFT" min-width="140" />
          <el-table-column prop="collectionName" label="合集" min-width="120" />
          <el-table-column prop="side" label="方向" width="90" />
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
      </section>
    </ExPageState>
  </div>

  <NftListDialog
    v-model="listDlg.open"
    :item-id="listDlg.itemId"
    :title="listDlg.title"
    :cover="listDlg.cover"
    @listed="onListed"
  />
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;
@use '@/styles/mixins' as mq;

.nmy {
  width: 100%;
  max-width: min(1200px, var(--ex-container-max));
  margin: 0 auto;
  padding-bottom: $space-8;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.nmy__head {
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.nmy__head-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: $space-2 $space-4;
}

.nmy__back {
  border: none;
  background: none;
  padding: 0;
  font: inherit;
  font-size: $font-size-sm;
  color: $color-text-tertiary;
  cursor: pointer;
  text-decoration: none;
}

.nmy__back:hover {
  color: $color-brand;
}

.nmy__back--link {
  display: inline-block;
}

.nmy__h {
  margin: 0 0 $space-1;
  font-size: $font-size-xxl;
  font-weight: $font-weight-bold;
  letter-spacing: -0.02em;
}

.nmy__sub {
  margin: 0;
  font-size: $font-size-sm;
  color: $color-text-tertiary;
}

.nmy__tabs {
  display: inline-flex;
  gap: $space-1;
  padding: 2px;
  border-radius: $radius-md;
  border: 1px solid $color-border;
  background: var(--ex-bg-elevated);
  width: fit-content;
}

.nmy__tab {
  border: none;
  background: transparent;
  color: $color-text-secondary;
  font-weight: $font-weight-semibold;
  font-size: $font-size-sm;
  padding: $space-2 $space-3;
  border-radius: $radius-sm;
  cursor: pointer;
}

.nmy__tab--on {
  color: $color-text-primary;
  background: var(--ex-fill-ghost);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--ex-brand) 20%, transparent);
}

.nmy__badge {
  margin-left: 6px;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 999px;
  background: var(--ex-brand-muted);
  color: var(--ex-brand);
}

.nmy__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: $space-4;
}

@include mq.media-down(lg) {
  .nmy__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@include mq.media-down(md) {
  .nmy__grid {
    grid-template-columns: 1fr;
  }
}

.nmy__card {
  border: 1px solid $color-border;
  border-radius: $radius-lg;
  background: var(--ex-card-surface);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.nmy__media img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  display: block;
}

.nmy__body {
  padding: $space-3;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.nmy__col {
  margin: 0;
  font-size: 11px;
  color: $color-brand;
  font-weight: $font-weight-semibold;
}

.nmy__title {
  margin: 0;
  font-size: $font-size-md;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
  line-height: 1.3;
}

.nmy__price {
  margin: 0;
  font-size: $font-size-sm;
  color: $color-text-secondary;
}

.nmy__actions {
  display: flex;
  gap: $space-2;
  margin-top: $space-2;
}

.nmy__btn {
  border: 1px solid $color-border;
  background: transparent;
  color: $color-text-primary;
  border-radius: $radius-sm;
  padding: 8px 12px;
  font-weight: $font-weight-semibold;
  cursor: pointer;
}

.nmy__btn--pri {
  background: var(--ex-brand);
  color: var(--ex-on-brand);
  border-color: color-mix(in srgb, var(--ex-brand) 45%, transparent);
}

.nmy__btn--pri:hover {
  background: var(--ex-brand-hover);
}

.nmy__panel {
  border: 1px solid $color-border;
  border-radius: $radius-lg;
  background: var(--ex-bg-elevated);
  padding: $space-3;
}

.nmy__empty {
  margin: 0;
  padding: $space-4;
  text-align: center;
  color: $color-text-tertiary;
}
</style>

