<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { Loading } from '@element-plus/icons-vue'
import { RouteNames } from '@/constants/routeNames'
import { useAuthStore } from '@/stores/auth'
import { useAssetsCenterStore } from '@/stores/assetsCenter'
import { useNftMarketStore } from '@/stores/nftMarket'
import { getDemoLedgerUsdt } from '@/api/nft/nftLiteDb'
import { formatPrice } from '@/utils/format'
import type { NftMarketRow } from '@/types/nft'

type Phase = 'confirm' | 'submitting' | 'success' | 'error'

const props = defineProps<{
  modelValue: boolean
  /** 打开弹窗时快照的挂单行，避免抽屉关闭后丢失 */
  row: NftMarketRow | null
  coverUrl: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  /** 购买成功且用户结束流程时（继续逛逛 / 去我的 NFT） */
  (e: 'completed'): void
}>()

const auth = useAuthStore()
const assets = useAssetsCenterStore()
const market = useNftMarketStore()

const phase = ref<Phase>('confirm')
const errCode = ref<string | null>(null)

const visible = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v),
})

const uid = computed(() => auth.user?.userCode ?? '')

const fundingUsdt = computed(() => {
  const rows = assets.payload?.balances.funding
  if (!rows?.length) return 0
  return rows.find((r) => r.asset === 'USDT')?.available ?? 0
})

const demoLedger = computed(() => (uid.value ? getDemoLedgerUsdt(uid.value) : 0))

const priceUsdt = computed(() => props.row?.listing.priceUsdt ?? 0)

const totalAvailable = computed(() => demoLedger.value + fundingUsdt.value)

const sufficient = computed(() => totalAvailable.value + 1e-9 >= priceUsdt.value)

const headerTitle = computed(() => {
  switch (phase.value) {
    case 'submitting':
      return '提交订单'
    case 'success':
      return '购买成功'
    case 'error':
      return '购买失败'
    default:
      return '确认订单'
  }
})

const errorMsg = computed(() => {
  if (phase.value !== 'error') return ''
  if (errCode.value === 'funds') return '可用余额不足，请充值或划转至资金账户后再试。'
  if (errCode.value === 'self') return '不能购买自己的挂单。'
  if (errCode.value === 'not_listed') return '该商品已下架或已售出。'
  return '订单提交失败，请稍后重试。'
})

watch(
  () => props.modelValue,
  (v) => {
    if (v) {
      phase.value = 'confirm'
      errCode.value = null
      void refreshBalances()
    }
  },
)

async function refreshBalances() {
  try {
    await assets.bootstrap()
  } catch {
    /* 资产中心不可用时仍允许展示演示账本 */
  }
}

async function onConfirmPay() {
  if (!props.row || !uid.value || !sufficient.value) return
  phase.value = 'submitting'
  errCode.value = null
  try {
    await assets.bootstrap()
    const r = await market.buyListing({ buyerUid: uid.value, listingId: props.row.listing.id })
    if (!r.ok) {
      phase.value = 'error'
      errCode.value = r.code
      return
    }
    phase.value = 'success'
  } catch {
    phase.value = 'error'
    errCode.value = 'unknown'
  }
}

function retryFromError() {
  phase.value = 'confirm'
  errCode.value = null
  void refreshBalances()
}

function finishSuccess() {
  emit('completed')
  visible.value = false
}

function onClose() {
  visible.value = false
}
</script>

<template>
  <el-dialog
    v-model="visible"
    align-center
    width="min(100%, 440px)"
    append-to-body
    destroy-on-close
    class="nftbc-dialog"
    :close-on-click-modal="phase !== 'submitting'"
    :show-close="phase !== 'submitting'"
    @closed="phase = 'confirm'"
  >
    <template #header>
      <span class="nftbc__title">{{ headerTitle }}</span>
    </template>

    <div v-if="row && phase === 'confirm'" class="nftbc">
      <div class="nftbc__sum">
        <img class="nftbc__img" :src="coverUrl" :alt="row.item.title" />
        <div class="nftbc__txt">
          <p class="nftbc__name">{{ row.item.title }}</p>
          <p class="nftbc__col">{{ row.item.collectionName }}</p>
        </div>
      </div>

      <p class="nftbc__desc">{{ row.item.description }}</p>

      <div class="nftbc__lines">
        <div class="nftbc__line">
          <span>应付金额</span>
          <span class="ex-num">{{ formatPrice(priceUsdt) }} USDT</span>
        </div>
        <div class="nftbc__line">
          <span>资金账户 USDT 可用</span>
          <span class="ex-num">{{ formatPrice(fundingUsdt) }}</span>
        </div>
        <div class="nftbc__line">
          <span>站内演示余额（USDT）</span>
          <span class="ex-num">{{ formatPrice(demoLedger) }}</span>
        </div>
        <div class="nftbc__line nftbc__line--total">
          <span>可支付合计</span>
          <span class="ex-num">{{ formatPrice(totalAvailable) }} USDT</span>
        </div>
      </div>

      <p v-if="!sufficient" class="nftbc__warn">可支付合计不足，无法下单。请充值或从其他账户划转至资金账户。</p>

      <p class="nftbc__hint">一口价购买，卖方手续费由卖家承担（演示）。</p>
    </div>

    <div v-else-if="phase === 'submitting'" class="nftbc nftbc--center">
      <el-icon class="nftbc__spin" :size="40"><Loading /></el-icon>
      <p class="nftbc__status">正在提交订单…</p>
      <p class="nftbc__status-sub">请稍候，请勿关闭页面</p>
    </div>

    <div v-else-if="phase === 'success'" class="nftbc nftbc--center">
      <div class="nftbc__ok" aria-hidden="true">✓</div>
      <p class="nftbc__status">订单已成交</p>
      <p class="nftbc__status-sub">
        NFT 已划入「我的 NFT」。
        <RouterLink class="nftbc__inline-link" :to="{ name: RouteNames.OrdersNft }" @click="finishSuccess">
          NFT 订单
        </RouterLink>
        中可查看记录。
      </p>
    </div>

    <div v-else-if="phase === 'error'" class="nftbc">
      <p class="nftbc__err">{{ errorMsg }}</p>
      <div v-if="errCode === 'funds'" class="nftbc__links">
        <RouterLink class="nftbc__link" :to="{ name: RouteNames.Assets }" @click="onClose">资产中心</RouterLink>
        <RouterLink class="nftbc__link" :to="{ name: RouteNames.Convert }" @click="onClose">闪兑</RouterLink>
      </div>
    </div>

    <template #footer>
      <div v-if="row && phase === 'confirm'" class="nftbc__foot">
        <button type="button" class="nftbc__btn" @click="onClose">取消</button>
        <button type="button" class="nftbc__btn nftbc__btn--pri" :disabled="!sufficient" @click="onConfirmPay">
          确认支付
        </button>
      </div>
      <div v-else-if="phase === 'success'" class="nftbc__foot nftbc__foot--split">
        <RouterLink class="nftbc__btn nftbc__btn--ghost" :to="{ name: RouteNames.NftMy }" @click="finishSuccess">
          查看我的 NFT
        </RouterLink>
        <button type="button" class="nftbc__btn nftbc__btn--pri" @click="finishSuccess">继续逛逛</button>
      </div>
      <div v-else-if="phase === 'error'" class="nftbc__foot nftbc__foot--split">
        <button type="button" class="nftbc__btn" @click="onClose">关闭</button>
        <button type="button" class="nftbc__btn nftbc__btn--pri" @click="retryFromError">重新尝试</button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.nftbc__title {
  font-size: $font-size-lg;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.nftbc {
  min-height: 120px;
}

.nftbc--center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: $space-4 0;
  gap: $space-2;
}

.nftbc__sum {
  display: flex;
  gap: $space-3;
  padding-bottom: $space-3;
  margin-bottom: $space-3;
  border-bottom: 1px solid $color-border;
}

.nftbc__img {
  width: 72px;
  height: 72px;
  border-radius: $radius-md;
  object-fit: cover;
  border: 1px solid $color-border;
  flex-shrink: 0;
}

.nftbc__name {
  margin: 0 0 4px;
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.nftbc__col {
  margin: 0;
  font-size: 11px;
  color: $color-brand;
  font-weight: $font-weight-semibold;
}

.nftbc__desc {
  margin: 0 0 $space-3;
  font-size: $font-size-xs;
  color: $color-text-secondary;
  line-height: 1.55;
}

.nftbc__lines {
  display: flex;
  flex-direction: column;
  gap: $space-2;
  padding: $space-3 0;
  border-top: 1px solid $color-border;
  border-bottom: 1px solid $color-border;
}

.nftbc__line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: $font-size-xs;
  color: $color-text-secondary;
}

.nftbc__line--total {
  color: $color-text-primary;
  font-weight: $font-weight-bold;
  margin-top: 2px;
}

.nftbc__warn {
  margin: $space-3 0 0;
  padding: $space-2 $space-3;
  border-radius: $radius-sm;
  font-size: $font-size-xs;
  color: $color-danger;
  background: color-mix(in srgb, $color-danger 12%, transparent);
  border: 1px solid color-mix(in srgb, $color-danger 35%, transparent);
}

.nftbc__hint {
  margin: $space-3 0 0;
  font-size: 11px;
  color: $color-text-tertiary;
  line-height: 1.5;
}

.nftbc__spin {
  animation: nftbc-spin 0.9s linear infinite;
  color: var(--ex-brand);
}

@keyframes nftbc-spin {
  to {
    transform: rotate(360deg);
  }
}

.nftbc__status {
  margin: 0;
  font-size: $font-size-md;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.nftbc__status-sub {
  margin: 0;
  font-size: $font-size-xs;
  color: $color-text-tertiary;
}

.nftbc__ok {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: $font-weight-bold;
  color: var(--ex-on-brand);
  background: var(--ex-brand);
}

.nftbc__err {
  margin: 0;
  font-size: $font-size-sm;
  color: $color-text-secondary;
  line-height: 1.55;
}

.nftbc__links {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
  margin-top: $space-3;
}

.nftbc__link {
  font-size: $font-size-xs;
  color: var(--ex-brand);
  text-decoration: none;
  font-weight: $font-weight-semibold;
}

.nftbc__link:hover {
  text-decoration: underline;
}

.nftbc__inline-link {
  color: var(--ex-brand);
  font-weight: $font-weight-semibold;
  text-decoration: none;
}

.nftbc__inline-link:hover {
  text-decoration: underline;
}

.nftbc__foot {
  display: flex;
  gap: $space-2;
  justify-content: flex-end;
  flex-wrap: wrap;
}

.nftbc__foot--split {
  justify-content: space-between;
  align-items: center;
}

.nftbc__btn {
  border: 1px solid $color-border;
  background: transparent;
  color: $color-text-primary;
  border-radius: $radius-sm;
  padding: 8px 14px;
  font-weight: $font-weight-semibold;
  cursor: pointer;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 36px;
}

.nftbc__btn--pri {
  background: var(--ex-brand);
  color: var(--ex-on-brand);
  border-color: color-mix(in srgb, var(--ex-brand) 45%, transparent);
}

.nftbc__btn--pri:hover:not(:disabled) {
  background: var(--ex-brand-hover);
}

.nftbc__btn--pri:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.nftbc__btn--ghost {
  border-color: color-mix(in srgb, var(--ex-brand) 45%, transparent);
  color: var(--ex-brand);
}

.nftbc__btn--ghost:hover {
  background: var(--ex-brand-muted);
}
</style>

<style lang="scss">
@use '@/styles/abstracts/variables' as *;

/* 弹窗层级与暗色顶栏，不 scoped 以便覆盖 Element Plus */
.nftbc-dialog.el-dialog {
  border-radius: $radius-lg;
  border: 1px solid var(--el-border-color);
  background: var(--ex-bg-elevated);
  padding-bottom: 0;
}
</style>
