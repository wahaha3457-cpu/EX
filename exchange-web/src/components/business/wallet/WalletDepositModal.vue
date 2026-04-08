<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { storeToRefs } from 'pinia'
import { RouteNames } from '@/constants/routeNames'
import { useWalletOpsStore } from '@/stores/walletOps'
import { useAssetsCenterStore } from '@/stores/assetsCenter'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'
import {
  WALLET_DEPOSIT_ASSETS,
  mockDepositAddress,
  mockDepositMemo,
  networksForAsset,
  networkMeta,
  walletAddressQrUrl,
} from '@/api/wallet/walletCatalog'
import { formatPrice } from '@/utils/format/number'

const wallet = useWalletOpsStore()
const assetsStore = useAssetsCenterStore()
const app = useAppStore()
const auth = useAuthStore()
const { active, prefillAsset } = storeToRefs(wallet)

const asset = ref('USDT')
const networkId = ref('')
const amountStr = ref('')
const agreed = ref(false)
const qrBroken = ref(false)

watch(
  active,
  (v) => {
    if (v === 'deposit') {
      asset.value = prefillAsset.value && WALLET_DEPOSIT_ASSETS.includes(prefillAsset.value) ? prefillAsset.value : 'USDT'
      const nets = networksForAsset(asset.value)
      networkId.value = nets[0]?.id ?? ''
      amountStr.value = ''
      agreed.value = false
      qrBroken.value = false
    }
  },
)

watch(asset, (a) => {
  const nets = networksForAsset(a)
  networkId.value = nets[0]?.id ?? ''
  qrBroken.value = false
})

watch(networkId, () => {
  qrBroken.value = false
})

const address = computed(() => mockDepositAddress(asset.value, networkId.value))
const netMeta = computed(() => networkMeta(asset.value, networkId.value))
const depositMemo = computed(() => mockDepositMemo(asset.value, networkId.value))
const qrSrc = computed(() => walletAddressQrUrl(address.value))

const amountNum = computed(() => {
  const n = parseFloat(amountStr.value.replace(/,/g, ''))
  return Number.isFinite(n) ? n : 0
})

function close() {
  wallet.close()
}

function copyAddr() {
  void navigator.clipboard.writeText(address.value).then(
    () => app.pushToast('success', '地址已复制'),
    () => app.pushToast('error', '复制失败'),
  )
}

function copyMemo() {
  const m = depositMemo.value
  if (!m) return
  void navigator.clipboard.writeText(m).then(
    () => app.pushToast('success', 'Memo 已复制'),
    () => app.pushToast('error', '复制失败'),
  )
}

function onQrError() {
  qrBroken.value = true
}

function confirmDemo() {
  if (!auth.isAuthenticated) {
    app.pushToast('warning', '请先登录后再确认入账')
    return
  }
  if (!netMeta.value) return
  if (!agreed.value) return
  if (amountNum.value < netMeta.value.minDeposit) {
    app.pushToast('error', `演示入账金额需 ≥ ${netMeta.value.minDeposit} ${asset.value}`)
    return
  }
  try {
    assetsStore.applyDemoDeposit(asset.value, networkId.value, amountNum.value)
    app.pushToast(
      'success',
      `充值成功：已模拟入账 ${formatPrice(amountNum.value)} ${asset.value} 至现货（演示）`,
    )
    assetsStore.setRecordTab('deposit')
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
    netMeta.value &&
    amountNum.value >= netMeta.value.minDeposit,
)
</script>

<template>
  <Teleport to="body">
    <div
      v-if="active === 'deposit'"
      class="walm-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="充值"
      @click.self="close"
    >
      <div class="walm walm--wide">
        <div class="walm__head">
          <div>
            <span class="walm__title">充值</span>
            <p class="walm__sub">向现货账户充入数字资产 · 请核对网络与合约（演示）</p>
          </div>
          <button type="button" class="walm__x" aria-label="关闭" @click="close">×</button>
        </div>
        <div class="walm__body">
          <ol class="walm__steps" aria-hidden="true">
            <li class="walm__step walm__step--on"><span>1</span> 选择币种</li>
            <li class="walm__step walm__step--on"><span>2</span> 选择网络</li>
            <li class="walm__step walm__step--on"><span>3</span> 复制信息</li>
          </ol>

          <p v-if="!auth.isAuthenticated" class="walm__auth">
            登录后可确认模拟入账并写入余额。
            <RouterLink class="walm__auth-a" :to="{ name: RouteNames.Login, query: { redirect: '/assets' } }">去登录</RouterLink>
          </p>

          <div class="walm__grid2">
            <label class="walm__field">
              <span class="walm__lab">币种</span>
              <select v-model="asset" class="walm__select">
                <option v-for="a in WALLET_DEPOSIT_ASSETS" :key="a" :value="a">{{ a }}</option>
              </select>
            </label>
            <label class="walm__field">
              <span class="walm__lab">转账网络</span>
              <select v-model="networkId" class="walm__select">
                <option v-for="n in networksForAsset(asset)" :key="n.id" :value="n.id">{{ n.label }}</option>
              </select>
            </label>
          </div>

          <div v-if="netMeta" class="walm__meta-strip">
            <span>{{ netMeta.confirmNote }}</span>
            <span v-if="netMeta.arrivalNote">· 到账 {{ netMeta.arrivalNote }}</span>
            <span>· 最小充值 {{ netMeta.minDeposit }} {{ asset }}</span>
          </div>
          <p v-if="netMeta?.tokenContract" class="walm__contract">
            合约地址 <code class="walm__code">{{ netMeta.tokenContract }}</code>
            （请确认与官方公示一致）
          </p>

          <div class="walm__deposit-core">
            <div class="walm__qr-wrap">
              <img
                v-if="!qrBroken"
                :src="qrSrc"
                alt=""
                class="walm__qr"
                width="180"
                height="180"
                loading="lazy"
                @error="onQrError"
              />
              <div v-else class="walm__qr-fallback">二维码加载失败<br />请使用下方复制</div>
            </div>
            <div class="walm__addr-block">
              <span class="walm__lab">充值地址（演示）</span>
              <div class="walm__addr-row">
                <code class="walm__addr">{{ address }}</code>
                <button type="button" class="walm__btn-sm" @click="copyAddr">复制</button>
              </div>
              <div v-if="depositMemo" class="walm__memo">
                <span class="walm__lab">Memo / Tag（必填）</span>
                <div class="walm__addr-row">
                  <code class="walm__addr">{{ depositMemo }}</code>
                  <button type="button" class="walm__btn-sm" @click="copyMemo">复制</button>
                </div>
                <p v-if="netMeta?.memoHint" class="walm__memo-hint">{{ netMeta.memoHint }}</p>
              </div>
              <p class="walm__warn">请勿向该地址转入非 {{ asset }}（{{ networkId }}）资产；充错网络或漏填 Memo 可能导致不可找回。</p>
            </div>
          </div>

          <label class="walm__field">
            <span class="walm__lab">演示入账金额</span>
            <input v-model="amountStr" type="text" inputmode="decimal" class="walm__input" placeholder="模拟链上已到账数量" />
          </label>
          <p class="walm__demo-note">演示环境：填写到账数量并确认后，将直接增加现货可用余额并生成充值记录。</p>

          <label class="walm__check">
            <input v-model="agreed" type="checkbox" class="walm__cb" />
            <span>我已核对币种、网络与合约（若有），了解错充风险，并同意按页面信息操作（演示）。</span>
          </label>
        </div>
        <div class="walm__foot">
          <button type="button" class="walm__btn walm__btn--ghost" @click="close">取消</button>
          <button type="button" class="walm__btn walm__btn--primary" :disabled="!canSubmit" @click="confirmDemo">确认入账</button>
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
    max-width: 560px;
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
  max-width: 420px;
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

.walm__steps {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: 10px;
  color: $color-text-tertiary;
}

.walm__step {
  display: inline-flex;
  align-items: center;
  gap: 6px;

  span {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--ex-fill-hover-subtle);
    font-weight: $font-weight-bold;
  }
}

.walm__step--on {
  color: $color-text-secondary;

  span {
    background: rgba(240, 185, 11, 0.2);
    color: $color-brand;
  }
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

.walm__grid2 {
  display: grid;
  grid-template-columns: 1fr;
  gap: $space-3;

  @include mq.media-up(sm) {
    grid-template-columns: 1fr 1fr;
  }
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

.walm__meta-strip {
  margin: 0;
  font-size: 11px;
  color: $color-text-secondary;
  line-height: 1.5;
  padding: $space-2 $space-3;
  border-radius: $radius-sm;
  background: var(--ex-panel-sunken);
  border: 1px solid var(--ex-border-subtle);
}

.walm__contract {
  margin: 0;
  font-size: 10px;
  color: $color-text-tertiary;
  line-height: 1.5;
}

.walm__code {
  display: inline-block;
  margin: 0 4px;
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--ex-surface-inset-strong);
  font-family: $font-family-mono;
  font-size: 9px;
  color: $color-brand;
  word-break: break-all;
}

.walm__deposit-core {
  display: grid;
  grid-template-columns: 1fr;
  gap: $space-3;
  padding: $space-3;
  border-radius: $radius-md;
  background: var(--ex-surface-inset);
  border: 1px solid var(--ex-border-subtle);

  @include mq.media-up(sm) {
    grid-template-columns: auto 1fr;
    align-items: start;
  }
}

.walm__qr-wrap {
  display: flex;
  justify-content: center;
}

.walm__qr {
  display: block;
  border-radius: $radius-sm;
  border: 1px solid $color-border;
  background: #fff;
}

.walm__qr-fallback {
  width: 180px;
  height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-size: 11px;
  color: $color-text-tertiary;
  border-radius: $radius-sm;
  border: 1px dashed $color-border;
}

.walm__addr-block {
  min-width: 0;
}

.walm__addr-row {
  display: flex;
  gap: $space-2;
  align-items: flex-start;
  margin-top: 8px;
}

.walm__addr {
  flex: 1;
  min-width: 0;
  word-break: break-all;
  font-size: 11px;
  line-height: 1.5;
  color: $color-brand;
  font-family: $font-family-mono;
}

.walm__memo {
  margin-top: $space-3;
  padding-top: $space-3;
  border-top: 1px solid var(--ex-border-subtle);
}

.walm__memo-hint {
  margin: 8px 0 0;
  font-size: 10px;
  color: $color-fall;
  line-height: 1.45;
}

.walm__btn-sm {
  flex-shrink: 0;
  padding: 6px 12px;
  font-size: 11px;
  font-weight: $font-weight-bold;
  border-radius: $radius-sm;
  border: 1px solid rgba(240, 185, 11, 0.4);
  background: rgba(240, 185, 11, 0.12);
  color: $color-brand;
  cursor: pointer;
}

.walm__warn {
  margin: $space-2 0 0;
  font-size: 10px;
  color: $color-fall;
  line-height: 1.45;
}

.walm__demo-note {
  margin: 0;
  font-size: 10px;
  color: $color-text-tertiary;
  line-height: 1.45;
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
</style>
