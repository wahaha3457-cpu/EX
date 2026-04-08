<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { storeToRefs } from 'pinia'
import { RouteNames } from '@/constants/routeNames'
import { useWalletOpsStore } from '@/stores/walletOps'
import { useAssetsCenterStore } from '@/stores/assetsCenter'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'
import { WALLET_DEPOSIT_ASSETS } from '@/api/wallet/walletCatalog'
import { formatPrice } from '@/utils/format/number'

type Acct = 'spot' | 'futures' | 'funding'

const wallet = useWalletOpsStore()
const assetsStore = useAssetsCenterStore()
const app = useAppStore()
const auth = useAuthStore()
const { active, prefillAsset } = storeToRefs(wallet)
const { payload, activeAccountTab } = storeToRefs(assetsStore)

const fromAcct = ref<Acct>('spot')
const toAcct = ref<Acct>('funding')
const asset = ref('USDT')
const amountStr = ref('')
const agreed = ref(false)

const acctOptions: { v: Acct; label: string }[] = [
  { v: 'spot', label: '现货账户' },
  { v: 'futures', label: '合约账户' },
  { v: 'funding', label: '资金账户' },
]

const toOptions = computed(() => acctOptions.filter((o) => o.v !== fromAcct.value))

watch(
  active,
  (v) => {
    if (v === 'transfer') {
      const tab = activeAccountTab.value
      const def: Acct =
        tab === 'futures' || tab === 'funding' ? tab : 'spot'
      fromAcct.value = def
      toAcct.value = def === 'spot' ? 'funding' : def === 'funding' ? 'spot' : 'spot'
      asset.value =
        prefillAsset.value && WALLET_DEPOSIT_ASSETS.includes(prefillAsset.value) ? prefillAsset.value : 'USDT'
      amountStr.value = ''
      agreed.value = false
    }
  },
)

watch(fromAcct, (f) => {
  if (toAcct.value === f) {
    toAcct.value = toOptions.value[0]?.v ?? 'spot'
  }
})

function balanceOn(account: Acct, sym: string) {
  const rows = payload.value?.balances[account] ?? []
  return rows.find((r) => r.asset === sym)?.available ?? 0
}

const fromAvail = computed(() => balanceOn(fromAcct.value, asset.value))

const amountNum = computed(() => {
  const n = parseFloat(amountStr.value.replace(/,/g, ''))
  return Number.isFinite(n) ? n : 0
})

function acctLabel(a: Acct) {
  return acctOptions.find((o) => o.v === a)?.label ?? a
}

const previewLine = computed(() => {
  if (amountNum.value <= 0) return '输入数量后显示预览'
  return `将 ${formatPrice(amountNum.value)} ${asset.value} 从「${acctLabel(fromAcct.value)}」划转至「${acctLabel(toAcct.value)}」`
})

function close() {
  wallet.close()
}

function roundDown(n: number, dp: number) {
  const f = 10 ** dp
  return Math.floor(n * f) / f
}

function fillMax() {
  amountStr.value = String(roundDown(fromAvail.value, 8))
}

function swapDir() {
  const a = fromAcct.value
  fromAcct.value = toAcct.value
  toAcct.value = a
}

function confirm() {
  if (!auth.isAuthenticated) {
    app.pushToast('warning', '请先登录后再划转')
    return
  }
  if (!agreed.value) return
  if (fromAcct.value === toAcct.value) {
    app.pushToast('error', '划出与划入账户不能相同')
    return
  }
  if (amountNum.value <= 0) {
    app.pushToast('error', '请输入划转数量')
    return
  }
  if (amountNum.value > fromAvail.value + 1e-10) {
    app.pushToast('error', '可用余额不足')
    return
  }
  try {
    assetsStore.applyDemoTransfer(fromAcct.value, toAcct.value, asset.value, amountNum.value)
    app.pushToast('success', '划转成功（演示）')
    assetsStore.setRecordTab('transfer')
    close()
  } catch {
    app.pushToast('error', '请先等待资产数据加载完成')
  }
}

const canSubmit = computed(
  () =>
    auth.isAuthenticated &&
    agreed.value &&
    amountNum.value > 0 &&
    fromAcct.value !== toAcct.value &&
    amountNum.value <= fromAvail.value + 1e-10,
)
</script>

<template>
  <Teleport to="body">
    <div
      v-if="active === 'transfer'"
      class="walm-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="划转"
      @click.self="close"
    >
      <div class="walm walm--wide">
        <div class="walm__head">
          <div>
            <span class="walm__title">划转</span>
            <p class="walm__sub">现货 · 合约 · 资金账户即时调拨，站内 0 手续费（演示）</p>
          </div>
          <button type="button" class="walm__x" aria-label="关闭" @click="close">×</button>
        </div>
        <div class="walm__body">
          <p v-if="!auth.isAuthenticated" class="walm__auth">
            划转需登录账户。
            <RouterLink class="walm__auth-a" :to="{ name: RouteNames.Login, query: { redirect: '/assets' } }">去登录</RouterLink>
          </p>

          <div class="walm__tf-visual">
            <div class="walm__acct-card">
              <span class="walm__acct-lab">从</span>
              <select v-model="fromAcct" class="walm__select walm__select--lg" aria-label="划出账户">
                <option v-for="o in acctOptions" :key="o.v" :value="o.v">{{ o.label }}</option>
              </select>
            </div>
            <button type="button" class="walm__swap" aria-label="交换方向" @click="swapDir">⇅</button>
            <div class="walm__acct-card">
              <span class="walm__acct-lab">到</span>
              <select v-model="toAcct" class="walm__select walm__select--lg" aria-label="划入账户">
                <option v-for="o in toOptions" :key="o.v" :value="o.v">{{ o.label }}</option>
              </select>
            </div>
          </div>

          <label class="walm__field">
            <span class="walm__lab">币种</span>
            <select v-model="asset" class="walm__select">
              <option v-for="a in WALLET_DEPOSIT_ASSETS" :key="a" :value="a">{{ a }}</option>
            </select>
          </label>

          <p class="walm__avail">可划数量：<span class="ex-num">{{ formatPrice(fromAvail) }}</span> {{ asset }}</p>

          <label class="walm__field">
            <span class="walm__lab">数量</span>
            <div class="walm__amt-row">
              <input v-model="amountStr" type="text" inputmode="decimal" class="walm__input" placeholder="0" />
              <button type="button" class="walm__btn-sm" @click="fillMax">全部</button>
            </div>
          </label>

          <div class="walm__preview">
            <span class="walm__preview-lab">预览</span>
            <p class="walm__preview-txt">{{ previewLine }}</p>
          </div>

          <label class="walm__check">
            <input v-model="agreed" type="checkbox" class="walm__cb" />
            <span>我确认划出账户与币种无误，并了解合约账户资金用于保证金与盈亏结算（演示）。</span>
          </label>
        </div>
        <div class="walm__foot">
          <button type="button" class="walm__btn walm__btn--ghost" @click="close">取消</button>
          <button type="button" class="walm__btn walm__btn--primary" :disabled="!canSubmit" @click="confirm">确认划转</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;
@use '@/styles/mixins' as mq;

.walm-overlay {
  position: fixed;
  inset: 0;
  z-index: 560;
  background: var(--ex-overlay-backdrop);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $space-4;
}

.walm {
  width: 100%;
  max-width: 480px;
  max-height: min(90vh, 720px);
  overflow-y: auto;
  border-radius: $radius-md;
  border: 1px solid $color-border;
  background: var(--ex-modal-surface);
  box-shadow: var(--ex-modal-shadow-elevated);
}

.walm--wide {
  @include mq.media-up(md) {
    max-width: 520px;
  }
}

.walm__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: $space-3;
  padding: $space-3 $space-4;
  border-bottom: 1px solid $color-border;
}

.walm__title {
  display: block;
  font-weight: $font-weight-bold;
  font-size: $font-size-md;
  color: $color-text-primary;
}

.walm__sub {
  margin: 4px 0 0;
  font-size: $font-size-xs;
  color: $color-text-tertiary;
  line-height: 1.45;
}

.walm__x {
  border: none;
  background: transparent;
  color: $color-text-tertiary;
  font-size: 22px;
  cursor: pointer;
  line-height: 1;
  flex-shrink: 0;
}

.walm__body {
  padding: $space-4;
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.walm__auth {
  margin: 0;
  padding: $space-2 $space-3;
  border-radius: $radius-sm;
  font-size: $font-size-xs;
  color: $color-text-secondary;
  background: rgba(48, 132, 252, 0.08);
  border: 1px solid rgba(48, 132, 252, 0.2);
}

.walm__auth-a {
  color: $color-brand;
  font-weight: $font-weight-semibold;
  margin-left: 4px;
}

.walm__tf-visual {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: $space-2;
  align-items: center;
}

.walm__acct-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: $space-3;
  border-radius: $radius-sm;
  background: var(--ex-surface-inset);
  border: 1px solid var(--ex-border-subtle);
}

.walm__acct-lab {
  font-size: 10px;
  font-weight: $font-weight-bold;
  color: $color-text-tertiary;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.walm__swap {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid $color-border;
  background: var(--ex-surface-inset-strong);
  color: $color-brand;
  font-size: 18px;
  cursor: pointer;
}

.walm__swap:hover {
  border-color: rgba(240, 185, 11, 0.4);
}

.walm__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.walm__lab {
  font-size: $font-size-xs;
  color: $color-text-tertiary;
  font-weight: $font-weight-semibold;
}

.walm__select,
.walm__input {
  padding: 10px $space-3;
  border-radius: $radius-sm;
  border: 1px solid $color-border;
  background: var(--ex-surface-inset-strong);
  color: $color-text-primary;
  font-size: $font-size-sm;

  &:focus {
    outline: none;
    border-color: rgba(240, 185, 11, 0.45);
  }
}

.walm__select--lg {
  font-weight: $font-weight-semibold;
}

.walm__amt-row {
  display: flex;
  gap: $space-2;
  align-items: center;
}

.walm__amt-row .walm__input {
  flex: 1;
}

.walm__avail {
  margin: 0;
  font-size: $font-size-xs;
  color: $color-text-secondary;
}

.walm__preview {
  padding: $space-3;
  border-radius: $radius-sm;
  border: 1px solid rgba(240, 185, 11, 0.15);
  background: rgba(240, 185, 11, 0.05);
}

.walm__preview-lab {
  display: block;
  font-size: 10px;
  color: $color-brand;
  font-weight: $font-weight-bold;
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.walm__preview-txt {
  margin: 0;
  font-size: $font-size-xs;
  color: $color-text-secondary;
  line-height: 1.55;
}

.walm__btn-sm {
  flex-shrink: 0;
  padding: 10px 14px;
  font-size: 11px;
  font-weight: $font-weight-bold;
  border-radius: $radius-sm;
  border: 1px solid rgba(240, 185, 11, 0.4);
  background: rgba(240, 185, 11, 0.12);
  color: $color-brand;
  cursor: pointer;
}

.walm__check {
  display: flex;
  gap: $space-2;
  font-size: 11px;
  line-height: 1.45;
  color: $color-text-secondary;
  cursor: pointer;
  align-items: flex-start;
}

.walm__cb {
  margin-top: 2px;
  accent-color: $color-brand;
  flex-shrink: 0;
}

.walm__foot {
  display: flex;
  justify-content: flex-end;
  gap: $space-2;
  padding: $space-3 $space-4;
  border-top: 1px solid $color-border;
}

.walm__btn {
  padding: $space-2 $space-4;
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  border-radius: $radius-sm;
  cursor: pointer;
  border: 1px solid transparent;
}

.walm__btn--ghost {
  background: transparent;
  border-color: $color-border;
  color: $color-text-secondary;
}

.walm__btn--primary {
  background: var(--ex-brand);
  color: var(--ex-on-brand);
}

.walm__btn--primary:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.ex-num {
  font-family: $font-family-mono;
}
</style>
