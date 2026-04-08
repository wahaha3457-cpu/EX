<script setup lang="ts">
/**
 * 资产中心 · NFT 账户：展示持仓参考估值与藏品卡片，跳转 NFT 市场 / 订单中心。
 */
import { onMounted, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { RouteNames } from '@/constants/routeNames'
import { useNftUserStore } from '@/stores/nftUser'
import { useAuthStore } from '@/stores/auth'
import { useAssetsCenterStore } from '@/stores/assetsCenter'
import { getNftImageUrl } from '@/api/nft/nftMock'
import { formatPrice } from '@/utils/format'
import type { NftUserHolding } from '@/types/nft'

const { t } = useI18n()
const nftUser = useNftUserStore()
const auth = useAuthStore()
const assets = useAssetsCenterStore()
const { holdings, loading: nftLoading } = storeToRefs(nftUser)
const { overview, payload: assetsPayload } = storeToRefs(assets)

onMounted(() => {
  const uid = auth.user?.userCode
  if (!uid) return
  void nftUser.bootstrap(uid)
})

const estUsdt = computed(() => overview.value?.nftEstimatedUsdt ?? 0)
const countLabel = computed(() => overview.value?.nftHoldingsCount ?? holdings.value.length)

/** 资产中心 · 资金账户 USDT 可用（与总览同源，仅展示） */
const fundingUsdtAvailable = computed(() => {
  const rows = assetsPayload.value?.balances.funding
  if (!rows?.length) return null
  return rows.find((r) => r.asset === 'USDT')?.available ?? null
})

/** 按集合汇总（演示） */
const byCollection = computed(() => {
  const m = new Map<string, { count: number; cost: number }>()
  for (const h of holdings.value) {
    const name = h.item.collectionName || '—'
    const cur = m.get(name) ?? { count: 0, cost: 0 }
    cur.count += 1
    cur.cost += h.ownership.costUsdt
    m.set(name, cur)
  }
  return [...m.entries()]
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.cost - a.cost)
})

function cover(h: NftUserHolding) {
  return getNftImageUrl(h.item.imageSeed)
}

function timeStr(iso: string) {
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}
</script>

<template>
  <section class="anft" aria-label="NFT 账户">
    <header class="anft__head">
      <div>
        <h2 class="anft__title">NFT 账户</h2>
        <p class="anft__sub">
          对应站内 NFT 市场（MoreNft）与「我的 NFT」最小闭环；订单与上架状态与
          <RouterLink class="anft__inline" :to="{ name: RouteNames.OrdersNft }">NFT 订单</RouterLink>
          联动（演示）。
        </p>
      </div>
      <div class="anft__stats">
        <div class="anft__stat">
          <span class="anft__sk">参考估值</span>
          <span class="anft__sv ex-num">≈ {{ formatPrice(estUsdt) }} USDT</span>
        </div>
        <div class="anft__stat">
          <span class="anft__sk">持有件数</span>
          <span class="anft__sv ex-num">{{ countLabel }}</span>
        </div>
      </div>
      <div class="anft__actions">
        <RouterLink class="anft__btn anft__btn--primary" :to="{ name: RouteNames.MoreNft }">
          {{ t('nft.ordersPage.goMarket') }}
        </RouterLink>
        <RouterLink class="anft__btn" :to="{ name: RouteNames.NftMy }">我的 NFT</RouterLink>
        <RouterLink class="anft__btn" :to="{ name: RouteNames.OrdersNft }">
          {{ t('nft.portal.bannerLink') }}
        </RouterLink>
      </div>
    </header>

    <div class="anft__cash" role="note">
      <div class="anft__cash-main">
        <span class="anft__cash-label">资金账户 USDT 可用</span>
        <span v-if="fundingUsdtAvailable != null" class="anft__cash-val ex-num">{{ formatPrice(fundingUsdtAvailable) }}</span>
        <span v-else class="anft__cash-val anft__cash-val--muted">—</span>
        <RouterLink class="anft__cash-link" :to="{ name: RouteNames.Assets, query: { account: 'funding' } }">
          查看资金账户
        </RouterLink>
      </div>
      <p class="anft__cash-hint">
        购买 NFT 可直接使用资金账户 USDT，无需划转至现货账户（演示口径）。
      </p>
    </div>

    <div v-if="byCollection.length" class="anft__collections" aria-label="按集合">
      <span class="anft__collections-label">持仓分布</span>
      <div class="anft__chips">
        <span v-for="c in byCollection" :key="c.name" class="anft__chip">
          <span class="anft__chip-name">{{ c.name }}</span>
          <span class="anft__chip-meta ex-num">{{ c.count }} 件 · ≈ {{ formatPrice(c.cost) }} USDT</span>
        </span>
      </div>
    </div>

    <div v-if="nftLoading && !holdings.length" class="anft__hint">加载 NFT 持仓…</div>
    <p v-else-if="!holdings.length" class="anft__empty">暂无 NFT 持仓，前往市场浏览或查看订单记录。</p>
    <div v-else class="anft__grid">
      <article v-for="h in holdings" :key="h.ownership.id" class="anft__card">
        <div class="anft__media">
          <img :src="cover(h)" :alt="h.item.title" />
        </div>
        <div class="anft__body">
          <p class="anft__col">{{ h.item.collectionName }}</p>
          <h3 class="anft__name">{{ h.item.title }}</h3>
          <dl class="anft__dl">
            <div>
              <dt>链</dt>
              <dd>{{ t(`nft.chain.${h.item.chain}`) }}</dd>
            </div>
            <div>
              <dt>获得时间</dt>
              <dd>{{ timeStr(h.ownership.acquiredAt) }}</dd>
            </div>
            <div>
              <dt>购入参考</dt>
              <dd class="ex-num">≈ {{ formatPrice(h.ownership.costUsdt) }} USDT</dd>
            </div>
          </dl>
        </div>
      </article>
    </div>

    <p class="anft__foot">
      上架、转赠与链上状态以正式接口为准；当前为演示数据。
    </p>
  </section>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;
@use '@/styles/mixins' as mq;

.anft {
  border: 1px solid $color-border;
  border-radius: $radius-lg;
  background: var(--ex-card-surface);
  padding: $space-4;
  min-width: 0;
}

.anft__head {
  display: grid;
  gap: $space-3;
  margin-bottom: $space-4;

  @include mq.media-up(md) {
    grid-template-columns: 1fr auto;
    grid-template-rows: auto auto;
    align-items: start;
  }
}

.anft__head > div:first-child {
  grid-column: 1;
}

.anft__stats {
  @include mq.media-up(md) {
    grid-column: 2;
    grid-row: 1 / span 2;
    justify-self: end;
    text-align: right;
  }
}

.anft__actions {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;

  @include mq.media-up(md) {
    grid-column: 1;
  }
}

.anft__cash {
  margin-bottom: $space-4;
  padding: $space-3 $space-4;
  border-radius: $radius-md;
  border: 1px solid rgba(130, 71, 229, 0.28);
  background: linear-gradient(
    135deg,
    rgba(130, 71, 229, 0.08) 0%,
    rgba(240, 185, 11, 0.05) 100%
  );
}

.anft__cash-main {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 8px 14px;
}

.anft__cash-label {
  font-size: 11px;
  font-weight: $font-weight-bold;
  color: $color-text-secondary;
}

.anft__cash-val {
  font-size: $font-size-md;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.anft__cash-val--muted {
  color: $color-text-tertiary;
}

.anft__cash-link {
  margin-left: auto;
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  color: $color-brand;
  text-decoration: none;
}

.anft__cash-link:hover {
  text-decoration: underline;
}

.anft__cash-hint {
  margin: $space-2 0 0;
  font-size: 10px;
  line-height: 1.5;
  color: $color-text-tertiary;
}

.anft__collections {
  margin-bottom: $space-4;
  padding: $space-3;
  border-radius: $radius-md;
  border: 1px solid $color-border;
  background: var(--ex-surface-inset);
}

.anft__collections-label {
  display: block;
  font-size: 10px;
  font-weight: $font-weight-bold;
  color: $color-text-tertiary;
  letter-spacing: 0.04em;
  margin-bottom: $space-2;
}

.anft__chips {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
}

.anft__chip {
  display: inline-flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 10px;
  border-radius: $radius-sm;
  border: 1px solid $color-border;
  background: var(--ex-card-surface);
  font-size: 11px;
}

.anft__chip-name {
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.anft__chip-meta {
  font-size: 10px;
  color: $color-text-tertiary;
}

.anft__title {
  margin: 0 0 $space-1;
  font-size: $font-size-md;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.anft__sub {
  margin: 0;
  font-size: $font-size-xs;
  color: $color-text-tertiary;
  line-height: 1.5;
}

.anft__inline {
  color: $color-brand;
  font-weight: $font-weight-semibold;
  text-decoration: none;
}

.anft__inline:hover {
  text-decoration: underline;
}

.anft__stats {
  display: flex;
  flex-wrap: wrap;
  gap: $space-4;
}

.anft__stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.anft__sk {
  font-size: 10px;
  font-weight: $font-weight-semibold;
  color: $color-text-tertiary;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.anft__sv {
  font-size: $font-size-md;
  font-weight: $font-weight-bold;
  color: $color-brand;
}

.anft__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 36px;
  padding: 0 $space-4;
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  border-radius: $radius-md;
  text-decoration: none;
  border: 1px solid $color-border;
  color: $color-text-primary;
  background: var(--ex-fill-ghost);
}

.anft__btn:hover {
  border-color: rgba(240, 185, 11, 0.4);
  color: $color-brand;
}

.anft__btn--primary {
  color: #0b0e11;
  background: var(--ex-brand);
  border-color: rgba(240, 185, 11, 0.65);
}

.anft__hint,
.anft__empty {
  margin: 0;
  padding: $space-6;
  text-align: center;
  font-size: $font-size-sm;
  color: $color-text-tertiary;
}

.anft__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: $space-4;
}

.anft__card {
  border-radius: $radius-md;
  border: 1px solid $color-border;
  overflow: hidden;
  background: var(--ex-panel-sunken);
}

.anft__media {
  aspect-ratio: 1;
  background: var(--ex-bg-muted);
}

.anft__media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.anft__body {
  padding: $space-3;
}

.anft__col {
  margin: 0 0 4px;
  font-size: 11px;
  font-weight: $font-weight-semibold;
  color: $color-brand;
}

.anft__name {
  margin: 0 0 $space-2;
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
  line-height: 1.35;
}

.anft__dl {
  margin: 0;
  display: grid;
  gap: $space-1;
  font-size: 11px;
}

.anft__dl dt {
  margin: 0;
  color: $color-text-tertiary;
}

.anft__dl dd {
  margin: 0;
  color: $color-text-secondary;
}

.anft__foot {
  margin: $space-4 0 0;
  font-size: $font-size-xs;
  color: $color-text-tertiary;
  line-height: 1.5;
}
</style>
