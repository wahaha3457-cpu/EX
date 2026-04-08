<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { useNftMarketStore } from '@/stores/nftMarket'
import type { NftItem } from '@/types/nft'
import { formatPrice } from '@/utils/format'
import NftTradeConfirmDialog from './NftTradeConfirmDialog.vue'

const props = defineProps<{
  modelValue: boolean
  item: NftItem | null
  imageSrc: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
}>()

const { t } = useI18n()
const auth = useAuthStore()
const app = useAppStore()
const nftStore = useNftMarketStore()
const { orderSubmitting } = storeToRefs(nftStore)

const tradeDialogOpen = ref(false)

const visible = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v),
})

const endsMs = computed(() => {
  const it = props.item
  if (!it) return null
  const iso = it.saleType === 'AUCTION' ? it.auctionEndAt : it.dropEndAt
  if (!iso) return null
  const t0 = new Date(iso).getTime()
  return Number.isNaN(t0) ? null : t0
})

const endsLabel = computed(() => {
  const end = endsMs.value
  if (end == null) return ''
  const diff = end - Date.now()
  if (diff <= 0) return t('nft.time.ended')
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  return t('nft.time.left', { h, m })
})

/** 拍卖已结束则禁止下单 */
const auctionEnded = computed(() => {
  const it = props.item
  if (!it || it.saleType !== 'AUCTION' || !it.auctionEndAt) return false
  return new Date(it.auctionEndAt).getTime() <= Date.now()
})

function chainLabel(c: string) {
  return t(`nft.chain.${c}`)
}

function catLabel(c: string) {
  return t(`nft.cat.${c}`)
}

function onPrimary() {
  const it = props.item
  if (!it) return
  if (!auth.isAuthenticated) {
    app.pushToast('warning', t('nft.toast.needLogin'))
    return
  }
  if (auctionEnded.value) {
    app.pushToast('warning', t('nft.trade.errEnded'))
    return
  }
  tradeDialogOpen.value = true
}

function onTradeSuccess() {
  tradeDialogOpen.value = false
  nftStore.closeItem()
}
</script>

<template>
  <el-drawer
    v-model="visible"
    :title="item?.title ?? ''"
    direction="rtl"
    size="min(100%, 440px)"
    destroy-on-close
    append-to-body
    class="nft-drawer"
  >
    <template v-if="item">
      <div class="nft-d">
        <div class="nft-d__media">
          <img :src="imageSrc" :alt="item.title" class="nft-d__img" />
          <div class="nft-d__badges">
            <span class="nft-d__pill" :data-chain="item.chain">{{ chainLabel(item.chain) }}</span>
            <span v-if="item.verified" class="nft-d__pill nft-d__pill--ok">{{ t('nft.badge.verified') }}</span>
            <span class="nft-d__pill nft-d__pill--muted">{{ catLabel(item.category) }}</span>
          </div>
        </div>

        <p class="nft-d__col">{{ item.collectionName }}</p>
        <p v-if="endsLabel" class="nft-d__timer" :class="{ 'nft-d__timer--bad': auctionEnded }">
          {{ endsLabel }}
        </p>

        <div class="nft-d__price-block">
          <span class="nft-d__price-lab">{{ item.saleType === 'AUCTION' ? t('nft.price.currentBid') : t('nft.price.buyNow') }}</span>
          <div class="nft-d__price-row">
            <span class="nft-d__eth ex-num">{{ item.priceEth }} {{ item.currencyLabel }}</span>
            <span class="nft-d__usd ex-num">≈ {{ formatPrice(item.priceUsdt) }} USDT</span>
          </div>
        </div>

        <div class="nft-d__fee-hint">
          <span>{{ t('nft.detail.feeHint', { fee: (item.serviceFeeRate * 100).toFixed(1), roy: (item.royaltyRate * 100).toFixed(0) }) }}</span>
        </div>

        <p class="nft-d__desc">{{ item.description }}</p>

        <div class="nft-d__meta">
          <div class="nft-d__meta-row">
            <span>{{ t('nft.detail.creator') }}</span>
            <span class="nft-d__mono">{{ item.creator }}</span>
          </div>
          <div class="nft-d__meta-row">
            <span>{{ t('nft.detail.tokenStandard') }}</span>
            <span>ERC-721</span>
          </div>
          <div class="nft-d__meta-row">
            <span>{{ t('nft.detail.royalty') }}</span>
            <span>{{ (item.royaltyRate * 100).toFixed(0) }}%</span>
          </div>
        </div>

        <h4 class="nft-d__h">{{ t('nft.detail.traits') }}</h4>
        <ul class="nft-d__traits">
          <li v-for="(tr, i) in item.traits" :key="i" class="nft-d__trait">
            <span class="nft-d__trait-k">{{ tr.traitType }}</span>
            <span class="nft-d__trait-v">{{ tr.value }}</span>
          </li>
        </ul>

        <p class="nft-d__rules">{{ t('nft.rules.short') }}</p>
      </div>
    </template>

    <template #footer>
      <div v-if="item" class="nft-d__foot">
        <button type="button" class="nft-d__btn nft-d__btn--ghost" @click="visible = false">{{ t('nft.btn.close') }}</button>
        <button
          type="button"
          class="nft-d__btn nft-d__btn--pri"
          :disabled="orderSubmitting || auctionEnded"
          @click="onPrimary"
        >
          {{ item.saleType === 'AUCTION' ? t('nft.btn.bid') : t('nft.btn.buy') }}
        </button>
      </div>
    </template>
  </el-drawer>

  <NftTradeConfirmDialog
    v-model="tradeDialogOpen"
    :item="item"
    :image-src="imageSrc"
    @success="onTradeSuccess"
  />
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.nft-d__media {
  position: relative;
  border-radius: $radius-md;
  overflow: hidden;
  border: 1px solid $color-border;
  background: var(--ex-bg-muted);
}

.nft-d__img {
  display: block;
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
}

.nft-d__badges {
  position: absolute;
  left: $space-2;
  bottom: $space-2;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.nft-d__pill {
  font-size: 10px;
  font-weight: $font-weight-bold;
  padding: 4px 8px;
  border-radius: $radius-sm;
  background: color-mix(in srgb, var(--ex-bg-elevated) 92%, transparent);
  color: $color-text-secondary;
  border: 1px solid $color-border;

  &--ok {
    color: $color-rise;
    border-color: color-mix(in srgb, var(--ex-rise) 35%, transparent);
    background: var(--ex-rise-bg);
  }

  &--muted {
    opacity: 0.9;
  }

  &[data-chain='BSC'] {
    color: #f0b90b;
    border-color: color-mix(in srgb, #f0b90b 40%, transparent);
  }

  &[data-chain='ETH'] {
    color: #627eea;
    border-color: color-mix(in srgb, #627eea 40%, transparent);
  }

  &[data-chain='POLYGON'] {
    color: #8247e5;
    border-color: color-mix(in srgb, #8247e5 40%, transparent);
  }
}

.nft-d__col {
  margin: $space-3 0 0;
  font-size: $font-size-sm;
  color: $color-brand;
  font-weight: $font-weight-semibold;
}

.nft-d__timer {
  margin: $space-2 0 0;
  font-size: 11px;
  color: $color-text-tertiary;

  &--bad {
    color: $color-fall;
    font-weight: $font-weight-semibold;
  }
}

.nft-d__price-block {
  margin-top: $space-4;
  padding: $space-3;
  border-radius: $radius-sm;
  background: var(--ex-bg-muted);
  border: 1px solid $color-border;
}

.nft-d__fee-hint {
  margin-top: $space-2;
  font-size: 10px;
  line-height: 1.45;
  color: $color-text-tertiary;
}

.nft-d__price-lab {
  font-size: 11px;
  color: $color-text-tertiary;
}

.nft-d__price-row {
  margin-top: 6px;
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: $space-2;
}

.nft-d__eth {
  font-size: $font-size-lg;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.nft-d__usd {
  font-size: $font-size-xs;
  color: $color-text-tertiary;
}

.nft-d__desc {
  margin: $space-4 0 0;
  font-size: $font-size-xs;
  line-height: 1.55;
  color: $color-text-secondary;
}

.nft-d__meta {
  margin-top: $space-4;
  padding-top: $space-3;
  border-top: 1px solid $color-border;
  font-size: 11px;
  color: $color-text-tertiary;
}

.nft-d__meta-row {
  display: flex;
  justify-content: space-between;
  gap: $space-2;
  margin-bottom: 8px;
}

.nft-d__mono {
  font-family: $font-family-mono;
  color: $color-text-secondary;
}

.nft-d__h {
  margin: $space-4 0 $space-2;
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.nft-d__traits {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $space-2;
}

.nft-d__trait {
  padding: $space-2;
  border-radius: $radius-sm;
  border: 1px solid $color-border;
  background: var(--ex-card-surface);
  font-size: 11px;
}

.nft-d__trait-k {
  display: block;
  color: $color-text-tertiary;
  margin-bottom: 4px;
}

.nft-d__trait-v {
  font-weight: $font-weight-semibold;
  color: $color-text-primary;
}

.nft-d__rules {
  margin: $space-4 0 0;
  font-size: 10px;
  line-height: 1.5;
  color: $color-text-tertiary;
}

.nft-d__foot {
  display: flex;
  gap: $space-2;
  justify-content: flex-end;
  flex-wrap: wrap;
}

.nft-d__btn {
  padding: 10px 18px;
  border-radius: $radius-sm;
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  cursor: pointer;
  border: 1px solid $color-border;
  background: var(--ex-bg-elevated);
  color: $color-text-primary;

  &--ghost:hover {
    border-color: color-mix(in srgb, var(--ex-brand) 40%, transparent);
  }

  &--pri {
    background: $color-brand;
    color: var(--ex-on-brand);
    border-color: transparent;
  }

  &--pri:hover:not(:disabled) {
    filter: brightness(1.06);
  }

  &--pri:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
}
</style>

<style lang="scss">
.nft-drawer.el-drawer {
  --el-drawer-bg-color: var(--ex-card-surface);
}
</style>
