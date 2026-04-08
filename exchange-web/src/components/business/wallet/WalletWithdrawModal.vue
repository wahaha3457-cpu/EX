<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { RouteNames } from '@/constants/routeNames'
import { useWalletOpsStore } from '@/stores/walletOps'
import { useAssetsCenterStore } from '@/stores/assetsCenter'
import { useAppStore } from '@/stores/app'
import { useFundPasswordStore } from '@/stores/fundPassword'
import { useAuthStore } from '@/stores/auth'
import {
  WALLET_DEPOSIT_ASSETS,
  DEMO_WITHDRAW_DAILY_CAP_USDT,
  DEMO_WITHDRAW_DAILY_USED_USDT,
  networksForAsset,
  networkMeta,
} from '@/api/wallet/walletCatalog'
import { formatPrice } from '@/utils/format/number'
import ExSixDigitPinInput from '@/components/common/ExSixDigitPinInput.vue'

const wallet = useWalletOpsStore()
const assetsStore = useAssetsCenterStore()
const app = useAppStore()
const fundPwd = useFundPasswordStore()
const auth = useAuthStore()
const router = useRouter()
const { active, prefillAsset } = storeToRefs(wallet)
const { payload } = storeToRefs(assetsStore)

const asset = ref('USDT')
const networkId = ref('')
const addressStr = ref('')
const memoStr = ref('')
const amountStr = ref('')
const agreed = ref(false)
const fundPwdInput = ref('')
/** 主表单校验通过后，再弹出资金密码层 */
const fundPwdGateOpen = ref(false)

const dailyRemainUsdt = DEMO_WITHDRAW_DAILY_CAP_USDT - DEMO_WITHDRAW_DAILY_USED_USDT

watch(
  active,
  (v) => {
    if (v === 'withdraw') {
      asset.value = prefillAsset.value && WALLET_DEPOSIT_ASSETS.includes(prefillAsset.value) ? prefillAsset.value : 'USDT'
      const nets = networksForAsset(asset.value)
      networkId.value = nets[0]?.id ?? ''
      addressStr.value = ''
      memoStr.value = ''
      amountStr.value = ''
      agreed.value = false
      fundPwdInput.value = ''
      fundPwdGateOpen.value = false
    }
  },
)

watch(asset, (a) => {
  const nets = networksForAsset(a)
  networkId.value = nets[0]?.id ?? ''
})

const netMeta = computed(() => networkMeta(asset.value, networkId.value))

const spotAvail = computed(() => {
  const rows = payload.value?.balances.spot ?? []
  const r = rows.find((x) => x.asset === asset.value)
  return r?.available ?? 0
})

const amountNum = computed(() => {
  const n = parseFloat(amountStr.value.replace(/,/g, ''))
  return Number.isFinite(n) ? n : 0
})

const fee = computed(() => netMeta.value?.withdrawFee ?? 0)

const receiveEst = computed(() => Math.max(0, amountNum.value - fee.value))

const totalDeduct = computed(() => amountNum.value + fee.value)

function close() {
  fundPwdGateOpen.value = false
  fundPwdInput.value = ''
  wallet.close()
}

function onOverlayClick() {
  if (fundPwdGateOpen.value) {
    fundPwdGateOpen.value = false
    fundPwdInput.value = ''
    return
  }
  close()
}

function closePwdGate() {
  fundPwdGateOpen.value = false
  fundPwdInput.value = ''
}

function fillMax() {
  const maxSend = Math.max(0, spotAvail.value - fee.value)
  amountStr.value = String(roundDown(maxSend, 8))
}

function roundDown(n: number, dp: number) {
  const f = 10 ** dp
  return Math.floor(n * f) / f
}

function goSetFundPassword() {
  close()
  void router.push({ name: RouteNames.AccountSecurity })
}

/** 第一步：校验表单，通过则打开资金密码弹层 */
function openFundPwdGate() {
  if (!auth.isAuthenticated) {
    app.pushToast('warning', '请先登录后再提现')
    return
  }
  if (!fundPwd.isSet) {
    app.pushToast('warning', '请先前往安全中心设置 6 位资金密码后再提现')
    return
  }
  const meta = netMeta.value
  if (!meta) return
  if (!agreed.value) return
  const addr = addressStr.value.trim()
  if (addr.length < 8) {
    app.pushToast('error', '请填写有效提现地址')
    return
  }
  if (meta.memoRequired) {
    const tag = memoStr.value.trim()
    if (tag.length < 1) {
      app.pushToast('error', '该网络需要填写 Memo / Tag')
      return
    }
  }
  if (amountNum.value < meta.minWithdraw) {
    app.pushToast('error', `最低提现 ${meta.minWithdraw} ${asset.value}`)
    return
  }
  const need = amountNum.value + fee.value
  if (need > spotAvail.value + 1e-10) {
    app.pushToast('error', '现货可用不足（含手续费）')
    return
  }
  fundPwdInput.value = ''
  fundPwdGateOpen.value = true
}

/** 第二步：在独立弹层中校验资金密码并提交 */
function confirmWithdrawWithPwd() {
  const meta = netMeta.value
  if (!meta) return
  if (fundPwdInput.value.length !== 6) {
    app.pushToast('error', '请输入 6 位资金密码')
    return
  }
  if (!fundPwd.verifyForWithdraw(fundPwdInput.value)) {
    app.pushToast('error', '资金密码错误')
    return
  }
  const addr = addressStr.value.trim()
  try {
    assetsStore.applyDemoWithdraw(
      asset.value,
      networkId.value,
      amountNum.value,
      fee.value,
      addr,
      meta.memoRequired ? memoStr.value.trim() : undefined,
    )
    app.pushToast('success', '提现成功：申请已提交（演示），请在提现记录查看进度')
    assetsStore.setRecordTab('withdraw')
    closePwdGate()
    close()
  } catch {
    app.pushToast('error', '请先等待资产数据加载完成')
  }
}

const memoOk = computed(() => {
  if (!netMeta.value?.memoRequired) return true
  return memoStr.value.trim().length > 0
})

const canSubmit = computed(() => {
  if (!auth.isAuthenticated) return false
  if (!netMeta.value || !agreed.value || !memoOk.value) return false
  if (addressStr.value.trim().length < 8) return false
  if (amountNum.value < netMeta.value.minWithdraw) return false
  if (amountNum.value + fee.value > spotAvail.value + 1e-10) return false
  return true
})

const canSubmitPwd = computed(() => fundPwdInput.value.length === 6)
</script>

<template>
  <Teleport to="body">
    <div
      v-if="active === 'withdraw'"
      class="walm-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="提现"
      @click.self="onOverlayClick"
    >
      <div class="walm walm--wide" @click.stop>
        <div class="walm__head">
          <div>
            <span class="walm__title">提现</span>
            <p class="walm__sub">提现至链上地址 · 请反复核对网络与 Memo（演示）</p>
          </div>
          <button type="button" class="walm__x" aria-label="关闭" @click="close">×</button>
        </div>
        <div class="walm__body">
          <p v-if="!auth.isAuthenticated" class="walm__auth">
            提现需登录账户。
            <RouterLink class="walm__auth-a" :to="{ name: RouteNames.Login, query: { redirect: '/assets' } }">去登录</RouterLink>
          </p>

          <div class="walm__limit-card">
            <span class="walm__limit-k">24H 提现额度（演示）</span>
            <span class="walm__limit-v"
              >剩余约 <em class="ex-num">{{ formatPrice(dailyRemainUsdt) }}</em> USDT 等值</span
            >
          </div>

          <p class="walm__avail">现货可用：<span class="ex-num">{{ formatPrice(spotAvail) }}</span> {{ asset }}</p>

          <div class="walm__grid2">
            <label class="walm__field">
              <span class="walm__lab">币种</span>
              <select v-model="asset" class="walm__select">
                <option v-for="a in WALLET_DEPOSIT_ASSETS" :key="a" :value="a">{{ a }}</option>
              </select>
            </label>
            <label class="walm__field">
              <span class="walm__lab">网络</span>
              <select v-model="networkId" class="walm__select">
                <option v-for="n in networksForAsset(asset)" :key="n.id" :value="n.id">{{ n.label }}</option>
              </select>
            </label>
          </div>

          <p v-if="netMeta" class="walm__hint">
            手续费 <span class="ex-num">{{ fee }}</span> {{ asset }} · 最低 <span class="ex-num">{{ netMeta.minWithdraw }}</span>
            {{ asset }}
            <template v-if="netMeta.arrivalNote"> · 预计到账 {{ netMeta.arrivalNote }}</template>
          </p>
          <p v-if="netMeta?.tokenContract" class="walm__contract">
            合约 <code class="walm__code">{{ netMeta.tokenContract }}</code>
          </p>

          <label class="walm__field">
            <span class="walm__lab">提现地址</span>
            <textarea v-model="addressStr" class="walm__textarea" rows="2" placeholder="粘贴与所选网络完全一致的地址" />
          </label>

          <label v-if="netMeta?.memoRequired" class="walm__field">
            <span class="walm__lab">Memo / Tag</span>
            <input v-model="memoStr" type="text" class="walm__input" placeholder="按收款方要求填写" autocomplete="off" />
            <span v-if="netMeta.memoHint" class="walm__memo-hint">{{ netMeta.memoHint }}</span>
          </label>

          <label class="walm__field">
            <span class="walm__lab">数量</span>
            <div class="walm__amt-row">
              <input v-model="amountStr" type="text" inputmode="decimal" class="walm__input" placeholder="0" />
              <button type="button" class="walm__btn-sm" @click="fillMax">最大</button>
            </div>
          </label>

          <div v-if="netMeta && amountNum > 0" class="walm__sum-card">
            <div class="walm__sum-row">
              <span>到账数量</span>
              <span class="ex-num">{{ formatPrice(receiveEst) }} {{ asset }}</span>
            </div>
            <div class="walm__sum-row">
              <span>网络手续费</span>
              <span class="ex-num">{{ formatPrice(fee) }} {{ asset }}</span>
            </div>
            <div class="walm__sum-row walm__sum-row--total">
              <span>合计从现货扣除</span>
              <span class="ex-num">{{ formatPrice(totalDeduct) }} {{ asset }}</span>
            </div>
          </div>

          <label class="walm__check">
            <input v-model="agreed" type="checkbox" class="walm__cb" />
            <span>我已核对地址、网络与 Memo（若有），知晓错误将导致资产丢失；并同意《提现服务协议》与风控校验（演示）。</span>
          </label>

          <div class="walm__fund-banner">
            <p class="walm__fund-banner-text">
              <template v-if="fundPwd.isSet">提交后将弹出窗口验证 6 位资金密码，请勿向他人透露。</template>
              <template v-else>提现前请先在安全中心设置 6 位资金密码。</template>
            </p>
            <button v-if="!fundPwd.isSet" type="button" class="walm__fund-link" @click="goSetFundPassword">去设置</button>
          </div>
        </div>
        <div class="walm__foot">
          <button type="button" class="walm__btn walm__btn--ghost" @click="close">取消</button>
          <button type="button" class="walm__btn walm__btn--primary" :disabled="!canSubmit" @click="openFundPwdGate">
            确认提现信息
          </button>
        </div>
      </div>

      <!-- 资金密码单独弹层 -->
      <div
        v-if="fundPwdGateOpen"
        class="walm-pwd-overlay"
        role="dialog"
        aria-modal="true"
        aria-label="验证资金密码"
        @click.self="closePwdGate"
      >
        <div class="walm-pwd" @click.stop>
          <div class="walm-pwd__head">
            <span class="walm-pwd__title">验证资金密码</span>
            <button type="button" class="walm-pwd__x" aria-label="关闭" @click="closePwdGate">×</button>
          </div>
          <p class="walm-pwd__lead">
            即将提交提现
            <strong class="ex-num">{{ formatPrice(amountNum) }}</strong>
            {{ asset }}（含手续费将从现货扣除），请验证资金密码以确认。
          </p>
          <label class="walm-pwd__field">
            <span class="walm-pwd__lab">资金密码</span>
            <ExSixDigitPinInput v-model="fundPwdInput" autocomplete="current-password" />
          </label>
          <div class="walm-pwd__foot">
            <button type="button" class="walm__btn walm__btn--ghost" @click="closePwdGate">返回修改</button>
            <button
              type="button"
              class="walm__btn walm__btn--primary"
              :disabled="!canSubmitPwd"
              @click="confirmWithdrawWithPwd"
            >
              确认提交提现
            </button>
          </div>
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

.walm__limit-card {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: $space-2;
  padding: $space-2 $space-3;
  border-radius: $radius-sm;
  border: 1px solid rgba(240, 185, 11, 0.2);
  background: rgba(240, 185, 11, 0.06);
}

.walm__limit-k {
  font-size: 10px;
  color: $color-text-tertiary;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.walm__limit-v {
  font-size: $font-size-xs;
  color: $color-text-secondary;
}

.walm__limit-v em {
  font-style: normal;
  color: $color-brand;
  font-weight: $font-weight-bold;
}

.walm__avail {
  margin: 0;
  font-size: $font-size-xs;
  color: $color-text-secondary;
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

.walm__memo-hint {
  font-size: 10px;
  color: $color-fall;
  line-height: 1.45;
}

.walm__fund-banner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: $space-2;
  padding: $space-3;
  border-radius: $radius-sm;
  border: 1px solid rgba(240, 185, 11, 0.22);
  background: rgba(240, 185, 11, 0.06);
}

.walm__fund-banner-text {
  margin: 0;
  flex: 1;
  min-width: 200px;
  font-size: 11px;
  line-height: 1.45;
  color: $color-text-secondary;
}

.walm__fund-link {
  flex-shrink: 0;
  padding: 6px 12px;
  font-size: 11px;
  font-weight: $font-weight-bold;
  border-radius: $radius-sm;
  border: 1px solid rgba(240, 185, 11, 0.45);
  background: rgba(240, 185, 11, 0.12);
  color: $color-brand;
  cursor: pointer;
}

.walm__fund-link:hover {
  border-color: $color-brand;
}

.walm__textarea {
  padding: 10px $space-3;
  border-radius: $radius-sm;
  border: 1px solid $color-border;
  background: var(--ex-surface-inset-strong);
  color: $color-text-primary;
  font-size: $font-size-xs;
  font-family: $font-family-mono;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: rgba(240, 185, 11, 0.45);
  }
}

.walm__amt-row {
  display: flex;
  gap: $space-2;
  align-items: center;
}

.walm__amt-row .walm__input {
  flex: 1;
}

.walm__hint {
  margin: 0;
  font-size: 11px;
  color: $color-text-secondary;
  line-height: 1.45;
}

.walm__contract {
  margin: 0;
  font-size: 10px;
  color: $color-text-tertiary;
}

.walm__code {
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--ex-surface-inset-strong);
  font-family: $font-family-mono;
  font-size: 9px;
  color: $color-brand;
}

.walm__sum-card {
  padding: $space-3;
  border-radius: $radius-sm;
  background: var(--ex-surface-inset);
  border: 1px solid var(--ex-border-subtle);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.walm__sum-row {
  display: flex;
  justify-content: space-between;
  font-size: $font-size-xs;
  color: $color-text-secondary;
}

.walm__sum-row--total {
  padding-top: 8px;
  margin-top: 4px;
  border-top: 1px solid var(--ex-border);
  font-weight: $font-weight-bold;
  color: $color-text-primary;
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

.walm-pwd-overlay {
  position: fixed;
  inset: 0;
  z-index: 570;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $space-4;
}

.walm-pwd {
  width: 100%;
  max-width: 400px;
  border-radius: 12px;
  border: 1px solid rgba(240, 185, 11, 0.28);
  background: var(--ex-card-surface);
  box-shadow: var(--ex-modal-shadow-elevated);
}

.walm-pwd__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $space-3 $space-4;
  border-bottom: 1px solid $color-border;
}

.walm-pwd__title {
  font-size: $font-size-md;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.walm-pwd__x {
  border: none;
  background: transparent;
  color: $color-text-tertiary;
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
}

.walm-pwd__lead {
  margin: 0;
  padding: $space-3 $space-4 0;
  font-size: $font-size-xs;
  color: $color-text-secondary;
  line-height: 1.55;
}

.walm-pwd__field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: $space-3 $space-4;
}

.walm-pwd__lab {
  font-size: $font-size-xs;
  color: $color-text-tertiary;
  font-weight: $font-weight-semibold;
}

.walm-pwd__foot {
  display: flex;
  justify-content: flex-end;
  gap: $space-2;
  padding: $space-3 $space-4;
  border-top: 1px solid $color-border;
}
</style>
