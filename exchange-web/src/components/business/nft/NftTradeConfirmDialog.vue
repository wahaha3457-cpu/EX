<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useNftMarketStore } from '@/stores/nftMarket'
import { useAppStore } from '@/stores/app'
import type { NftItem } from '@/types/nft'
import { formatPrice } from '@/utils/format'
import { auctionStepEth, gasEstimateNative, minNextBidEth } from '@/utils/nft/tradeMath'

const props = defineProps<{
  modelValue: boolean
  item: NftItem | null
  imageSrc: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'success'): void
}>()

const { t } = useI18n()
const nftStore = useNftMarketStore()
const app = useAppStore()

const phase = ref<'form' | 'success'>('form')
const agree = ref(false)
const bidEth = ref(0)

function setOpen(v: boolean) {
  emit('update:modelValue', v)
}

const it = computed(() => props.item)

const minBid = computed(() => (it.value ? minNextBidEth(it.value) : 0))
const bidStep = computed(() => (it.value ? auctionStepEth(it.value) : 0.01))

watch(
  () => [props.modelValue, props.item] as const,
  ([open, item]) => {
    if (open && item) {
      phase.value = 'form'
      agree.value = false
      if (item.saleType === 'AUCTION') {
        bidEth.value = minNextBidEth(item)
      }
    }
    if (!open) {
      phase.value = 'form'
      agree.value = false
    }
  },
)

const orderValueEth = computed(() => {
  if (!it.value) return 0
  return it.value.saleType === 'AUCTION' ? bidEth.value : it.value.priceEth
})

const platformFeeEth = computed(() => (it.value ? orderValueEth.value * it.value.serviceFeeRate : 0))
const royaltyEth = computed(() => (it.value ? orderValueEth.value * it.value.royaltyRate : 0))
const gasEth = computed(() => (it.value ? gasEstimateNative(it.value.chain) : 0))
const totalEth = computed(() => orderValueEth.value + platformFeeEth.value + royaltyEth.value + gasEth.value)

const usdtRate = computed(() =>
  it.value && it.value.priceEth > 0 ? it.value.priceUsdt / it.value.priceEth : 0,
)
const totalUsdtApprox = computed(() => totalEth.value * usdtRate.value)

function fmtEth(n: number) {
  const s = n.toFixed(8).replace(/\.?0+$/, '')
  return s || '0'
}

async function onConfirm() {
  if (!it.value) return
  if (!agree.value) {
    app.pushToast('warning', t('nft.trade.errTerms'))
    return
  }
  const r = await nftStore.submitNftOrder({
    item: it.value,
    agreeTerms: agree.value,
    bidEth: it.value.saleType === 'AUCTION' ? bidEth.value : undefined,
  })
  if (!r.ok) {
    if (r.code === 'bid') app.pushToast('warning', t('nft.trade.errBid'))
    else if (r.code === 'ended') app.pushToast('warning', t('nft.trade.errEnded'))
    else if (r.code === 'terms') app.pushToast('warning', t('nft.trade.errTerms'))
    return
  }
  phase.value = 'success'
}

function onFinish() {
  app.pushToast('success', t('nft.toast.completedDemo'))
  emit('success')
  setOpen(false)
}

function onClose() {
  setOpen(false)
}

function onDialogClosed() {
  phase.value = 'form'
}
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    @update:model-value="setOpen"
    :title="phase === 'form' ? t('nft.trade.title') : t('nft.trade.successTitle')"
    width="min(100%, 440px)"
    append-to-body
    destroy-on-close
    class="nft-trade-dlg"
    :close-on-click-modal="false"
    @closed="onDialogClosed"
  >
    <template v-if="it && phase === 'form'">
      <div class="ntd-sum">
        <img class="ntd-sum__img" :src="imageSrc" :alt="it.title" />
        <div class="ntd-sum__txt">
          <p class="ntd-sum__col">{{ it.collectionName }}</p>
          <p class="ntd-sum__name">{{ it.title }}</p>
          <p class="ntd-sum__chain">{{ t(`nft.chain.${it.chain}`) }} · {{ it.currencyLabel }}</p>
        </div>
      </div>

      <div v-if="it.saleType === 'AUCTION'" class="ntd-bid">
        <label class="ntd-bid__lab">{{ t('nft.trade.bidLabel') }}</label>
        <el-input-number
          v-model="bidEth"
          class="ntd-bid__input"
          :min="minBid"
          :step="bidStep"
          :precision="8"
          :controls="true"
        />
        <p class="ntd-bid__hint">{{ t('nft.trade.bidHint', { min: fmtEth(minBid), step: fmtEth(bidStep) }) }}</p>
      </div>

      <div class="ntd-lines">
        <div class="ntd-line">
          <span>{{ it.saleType === 'AUCTION' ? t('nft.trade.lineBid') : t('nft.trade.linePrice') }}</span>
          <span class="ex-num">{{ fmtEth(orderValueEth) }} {{ it.currencyLabel }}</span>
        </div>
        <div class="ntd-line">
          <span>{{ t('nft.trade.lineFee', { pct: (it.serviceFeeRate * 100).toFixed(1) }) }}</span>
          <span class="ex-num">{{ fmtEth(platformFeeEth) }} {{ it.currencyLabel }}</span>
        </div>
        <div class="ntd-line">
          <span>{{ t('nft.trade.lineRoyalty', { pct: (it.royaltyRate * 100).toFixed(0) }) }}</span>
          <span class="ex-num">{{ fmtEth(royaltyEth) }} {{ it.currencyLabel }}</span>
        </div>
        <div class="ntd-line">
          <span>{{ t('nft.trade.lineGas') }}</span>
          <span class="ex-num">≈ {{ fmtEth(gasEth) }} {{ it.currencyLabel }}</span>
        </div>
        <div class="ntd-line ntd-line--total">
          <span>{{ t('nft.trade.lineTotal') }}</span>
          <span class="ex-num">{{ fmtEth(totalEth) }} {{ it.currencyLabel }}</span>
        </div>
        <p class="ntd-usd ex-num">≈ {{ formatPrice(totalUsdtApprox) }} USDT</p>
      </div>

      <p class="ntd-note">{{ t('nft.trade.note') }}</p>

      <label class="ntd-check">
        <input v-model="agree" type="checkbox" />
        <span>{{ t('nft.trade.agree') }}</span>
      </label>
    </template>

    <template v-else-if="phase === 'success'">
      <div class="ntd-ok">
        <div class="ntd-ok__icon" aria-hidden="true">✓</div>
        <p class="ntd-ok__t">{{ t('nft.trade.successDesc') }}</p>
        <p class="ntd-ok__sub">{{ t('nft.trade.successSub') }}</p>
      </div>
    </template>

    <template #footer>
      <div v-if="it && phase === 'form'" class="ntd-foot">
        <button type="button" class="ntd-btn ntd-btn--ghost" @click="onClose">{{ t('nft.trade.btnCancel') }}</button>
        <button
          type="button"
          class="ntd-btn ntd-btn--pri"
          :disabled="nftStore.orderSubmitting"
          @click="onConfirm"
        >
          {{ nftStore.orderSubmitting ? t('nft.trade.processing') : t('nft.trade.btnConfirm') }}
        </button>
      </div>
      <div v-else-if="phase === 'success'" class="ntd-foot">
        <button type="button" class="ntd-btn ntd-btn--pri ntd-btn--block" @click="onFinish">
          {{ t('nft.trade.btnDone') }}
        </button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.ntd-sum {
  display: flex;
  gap: $space-3;
  margin-bottom: $space-4;
  padding-bottom: $space-4;
  border-bottom: 1px solid $color-border;
}

.ntd-sum__img {
  width: 72px;
  height: 72px;
  border-radius: $radius-md;
  object-fit: cover;
  border: 1px solid $color-border;
  flex-shrink: 0;
}

.ntd-sum__txt {
  min-width: 0;
}

.ntd-sum__col {
  margin: 0 0 4px;
  font-size: 11px;
  color: $color-brand;
  font-weight: $font-weight-semibold;
}

.ntd-sum__name {
  margin: 0 0 4px;
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
  line-height: 1.35;
}

.ntd-sum__chain {
  margin: 0;
  font-size: 10px;
  color: $color-text-tertiary;
}

.ntd-bid {
  margin-bottom: $space-4;
}

.ntd-bid__lab {
  display: block;
  margin-bottom: $space-2;
  font-size: $font-size-xs;
  color: $color-text-secondary;
}

.ntd-bid__input {
  width: 100%;
}

.ntd-bid__hint {
  margin: $space-2 0 0;
  font-size: 10px;
  color: $color-text-tertiary;
  line-height: 1.4;
}

.ntd-lines {
  margin-bottom: $space-3;
}

.ntd-line {
  display: flex;
  justify-content: space-between;
  gap: $space-2;
  font-size: 11px;
  color: $color-text-tertiary;
  margin-bottom: 8px;

  &--total {
    margin-top: $space-2;
    padding-top: $space-2;
    border-top: 1px dashed $color-border;
    font-weight: $font-weight-semibold;
    color: $color-text-primary;
  }
}

.ntd-usd {
  margin: 0 0 $space-3;
  font-size: $font-size-xs;
  color: $color-text-tertiary;
  text-align: right;
}

.ntd-note {
  margin: 0 0 $space-3;
  font-size: 10px;
  line-height: 1.5;
  color: $color-text-tertiary;
}

.ntd-check {
  display: flex;
  align-items: flex-start;
  gap: $space-2;
  font-size: 11px;
  line-height: 1.45;
  color: $color-text-secondary;
  cursor: pointer;

  input {
    margin-top: 2px;
    flex-shrink: 0;
  }
}

.ntd-ok {
  text-align: center;
  padding: $space-4 0;
}

.ntd-ok__icon {
  width: 48px;
  height: 48px;
  margin: 0 auto $space-3;
  border-radius: $radius-full;
  background: var(--ex-rise-bg);
  color: $color-rise;
  font-size: 24px;
  font-weight: $font-weight-bold;
  line-height: 48px;
}

.ntd-ok__t {
  margin: 0 0 $space-2;
  font-size: $font-size-md;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.ntd-ok__sub {
  margin: 0;
  font-size: $font-size-xs;
  color: $color-text-tertiary;
  line-height: 1.5;
}

.ntd-foot {
  display: flex;
  justify-content: flex-end;
  gap: $space-2;
  flex-wrap: wrap;
}

.ntd-btn {
  padding: 10px 18px;
  border-radius: $radius-sm;
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  cursor: pointer;
  border: 1px solid $color-border;
  background: var(--ex-bg-elevated);
  color: $color-text-primary;

  &--ghost:hover {
    border-color: color-mix(in srgb, var(--ex-brand) 35%, transparent);
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
    opacity: 0.65;
    cursor: not-allowed;
  }

  &--block {
    width: 100%;
    justify-content: center;
  }
}
</style>

<style lang="scss">
.nft-trade-dlg.el-dialog .el-dialog__body {
  padding-top: 8px;
}
</style>
