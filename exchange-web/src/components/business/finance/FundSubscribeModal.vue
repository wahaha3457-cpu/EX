<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { FundProduct } from '@/types/financeEarn'
import { fundDailyYieldPct, fundEstimatedDailyUsdt } from '@/utils/finance/earnYield'
import { formatPrice } from '@/utils/format/number'
import { useFinanceFundStore } from '@/stores/financeFund'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'
import FundFlowSuccessPanel from '@/components/business/finance/FundFlowSuccessPanel.vue'

const props = defineProps<{
  modelValue: boolean
  product: FundProduct | null
  availableUsdt: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
}>()

const app = useAppStore()
const auth = useAuthStore()
const store = useFinanceFundStore()

const phase = ref<'form' | 'confirm' | 'success'>('form')
const amountStr = ref('')
const agreed = ref(false)
const orderRefDemo = ref('')
const successAnimKey = ref(0)

watch(
  () => props.modelValue,
  (v) => {
    if (v) {
      phase.value = 'form'
      amountStr.value = ''
      agreed.value = false
      orderRefDemo.value = ''
    }
  },
)

const amountNum = computed(() => {
  const n = parseFloat(amountStr.value.replace(/,/g, ''))
  return Number.isFinite(n) ? n : 0
})

const product = computed(() => props.product)

const estYearReward = computed(() => {
  if (!product.value || amountNum.value <= 0) return 0
  return (amountNum.value * product.value.apyPct) / 100
})

const dailyYieldPct = computed(() => (product.value ? fundDailyYieldPct(product.value.apyPct) : 0))

const heroDailyEst = computed(() => {
  if (!product.value) return 0
  if (amountNum.value > 0) return fundEstimatedDailyUsdt(amountNum.value, product.value.apyPct)
  return fundEstimatedDailyUsdt(product.value.minAmount, product.value.apyPct)
})

const balanceAfter = computed(() => Math.max(0, props.availableUsdt - amountNum.value))

const productKindLabel = computed(() => {
  if (!product.value) return ''
  if (product.value.kind === 'FLEXIBLE') return '活期'
  return `定期 · ${product.value.durationDays ?? '—'} 天`
})

const drawerTitle = computed(() => {
  if (!product.value) return ''
  if (phase.value === 'success') return '申购结果'
  if (phase.value === 'confirm') return '核对申购订单'
  return `申购 · ${product.value.name}`
})

function close() {
  emit('update:modelValue', false)
}

function onOverlayClick() {
  if (phase.value === 'success') return
  close()
}

const canGoConfirm = computed(() => {
  if (!product.value || !agreed.value) return false
  const p = product.value
  return amountNum.value >= p.minAmount && amountNum.value <= props.availableUsdt + 1e-9
})

const formHint = computed(() => {
  if (!product.value) return ''
  if (!agreed.value) return '请勾选协议后继续'
  if (amountNum.value <= 0) return '请输入申购金额'
  if (amountNum.value < product.value.minAmount) return `最低申购 ${product.value.minAmount} ${product.value.asset}`
  if (amountNum.value > props.availableUsdt + 1e-9) return '可用余额不足'
  return ''
})

function setAmountMin() {
  if (!product.value) return
  amountStr.value = String(product.value.minAmount)
}

function setAmountAll() {
  amountStr.value = String(Math.floor(props.availableUsdt * 100) / 100)
}

function goToConfirm() {
  if (!product.value) return
  if (!auth.isAuthenticated) {
    app.pushToast('warning', '请先登录后再进行申购')
    return
  }
  if (!canGoConfirm.value) {
    if (formHint.value) app.pushToast('warning', formHint.value)
    return
  }
  orderRefDemo.value = `FND-${Date.now().toString(36).toUpperCase()}`
  phase.value = 'confirm'
}

function backToForm() {
  phase.value = 'form'
}

function submitSubscribe() {
  if (!product.value || phase.value !== 'confirm') return
  if (!auth.isAuthenticated) {
    app.pushToast('warning', '请先登录后再进行申购')
    return
  }
  const ok = store.subscribe(product.value.id, amountNum.value)
  if (!ok) return
  successAnimKey.value += 1
  app.pushToast('success', `申购已提交 · ${formatPrice(amountNum.value)} USDT（演示）`)
  phase.value = 'success'
}

const successDesc = computed(() => {
  const p = product.value
  if (!p) return ''
  return `演示单号 ${orderRefDemo.value || '—'}。${formatPrice(amountNum.value)} ${p.asset} 已申购「${p.name}」，持仓与历史记录已更新（演示扣减可申购余额）。`
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="modelValue && product"
      class="fsm-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="申购理财"
      @click.self="onOverlayClick"
    >
      <div class="fsm">
        <div class="fsm__head">
          <span class="fsm__title">{{ drawerTitle }}</span>
          <button type="button" class="fsm__x" aria-label="关闭" @click="close">×</button>
        </div>

        <template v-if="phase === 'form'">
          <div class="fsm__body">
            <p class="fsm__apy">
              <span class="fsm__apy-label">日估产出</span>
              <span class="fsm__apy-right">
                <span class="fsm__apy-val ex-num">{{ formatPrice(heroDailyEst) }}</span>
                <span class="fsm__apy-unit">USDT/天</span>
              </span>
            </p>
            <p class="fsm__apy-hint">{{ amountNum > 0 ? '按当前填写金额测算' : `按最低申购 ${product.minAmount} ${product.asset} 测算` }}</p>
            <p class="fsm__daily fsm__daily--compact">
              <span>参考年化 {{ product.apyPct }}%</span>
              <span class="fsm__daily-sep">·</span>
              <span
                >日收益率 {{ dailyYieldPct >= 0.01 ? dailyYieldPct.toFixed(3) : dailyYieldPct.toFixed(4) }}% / 日</span
              >
              <span class="fsm__daily-hint">（年化÷365，单利均摊）</span>
            </p>
            <p class="fsm__rule">{{ product.redeemRule }}</p>
            <label class="fsm__field">
              <span class="fsm__lab">申购金额 ({{ product.asset }})</span>
              <input
                v-model="amountStr"
                type="text"
                inputmode="decimal"
                class="fsm__input"
                :placeholder="`最低 ${product.minAmount}`"
              />
            </label>
            <div class="fsm__quick">
              <button type="button" class="fsm__quick-btn" @click="setAmountMin">最低额</button>
              <button type="button" class="fsm__quick-btn" @click="setAmountAll">全部可用</button>
            </div>
            <p class="fsm__avail">可用余额：<span class="ex-num">{{ formatPrice(availableUsdt) }}</span> USDT</p>
            <p v-if="amountNum > 0" class="fsm__est">
              预估年收益：<span class="ex-num">{{ formatPrice(estYearReward) }}</span> {{ product.asset }}（与上方日估产出一致）
            </p>
            <label class="fsm__check">
              <input v-model="agreed" type="checkbox" class="fsm__cb" />
              <span>我已阅读并同意《理财产品服务协议》及风险提示，知晓理财产品不保本、收益随市场波动。</span>
            </label>
            <p v-if="formHint" class="fsm__form-hint">{{ formHint }}</p>
          </div>
          <div class="fsm__foot">
            <button type="button" class="fsm__btn fsm__btn--ghost" @click="close">取消</button>
            <button
              type="button"
              class="fsm__btn fsm__btn--primary"
              :disabled="!canGoConfirm"
              :title="formHint || undefined"
              @click="goToConfirm"
            >
              核对订单
            </button>
          </div>
        </template>

        <template v-else-if="phase === 'confirm'">
          <div class="fsm__body fsm__body--tight">
            <p class="fsm__confirm-lead">请核对下列订单信息，确认无误后提交。提交后演示持仓与可申购余额将立即更新。</p>
            <dl class="fsm__dl">
              <div class="fsm__dl-row">
                <dt>订单类型</dt>
                <dd>理财产品申购（演示）</dd>
              </div>
              <div class="fsm__dl-row">
                <dt>产品名称</dt>
                <dd>{{ product.name }}</dd>
              </div>
              <div class="fsm__dl-row">
                <dt>产品期限</dt>
                <dd>{{ productKindLabel }}</dd>
              </div>
              <div class="fsm__dl-row">
                <dt>参考年化</dt>
                <dd>{{ product.apyPct }}%</dd>
              </div>
              <div class="fsm__dl-row">
                <dt>日收益率（参考）</dt>
                <dd>{{ dailyYieldPct >= 0.01 ? dailyYieldPct.toFixed(3) : dailyYieldPct.toFixed(4) }}% / 日</dd>
              </div>
              <div class="fsm__dl-row fsm__dl-row--emph">
                <dt>申购金额</dt>
                <dd><span class="ex-num">{{ formatPrice(amountNum) }}</span> {{ product.asset }}</dd>
              </div>
              <div class="fsm__dl-row">
                <dt>日估产出（参考）</dt>
                <dd><span class="ex-num">{{ formatPrice(fundEstimatedDailyUsdt(amountNum, product.apyPct)) }}</span> USDT/天</dd>
              </div>
              <div class="fsm__dl-row">
                <dt>预估年收益（参考）</dt>
                <dd><span class="ex-num">{{ formatPrice(estYearReward) }}</span> {{ product.asset }}</dd>
              </div>
              <div class="fsm__dl-row">
                <dt>演示单号</dt>
                <dd class="fsm__mono">{{ orderRefDemo }}</dd>
              </div>
              <div class="fsm__dl-row">
                <dt>扣款后可申购余额（演示）</dt>
                <dd><span class="ex-num">{{ formatPrice(balanceAfter) }}</span> USDT</dd>
              </div>
            </dl>
            <p class="fsm__confirm-warn">正式环境以支付结果、持仓确认与产品合同为准；本页仅为前端演示。</p>
          </div>
          <div class="fsm__foot">
            <button type="button" class="fsm__btn fsm__btn--ghost" @click="backToForm">返回修改</button>
            <button type="button" class="fsm__btn fsm__btn--primary" @click="submitSubscribe">确认提交</button>
          </div>
        </template>

        <template v-else>
          <div class="fsm__body fsm__body--success">
            <FundFlowSuccessPanel
              :key="successAnimKey"
              variant="subscribe"
              ribbon="申购成功"
              title="订单已受理"
              :description="successDesc"
            />
          </div>
          <div class="fsm__foot fsm__foot--stack">
            <button type="button" class="fsm__btn fsm__btn--primary fsm__btn--block" @click="close">完成</button>
          </div>
        </template>
      </div>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.fsm-overlay {
  position: fixed;
  inset: 0;
  z-index: 520;
  background: var(--ex-overlay-backdrop);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $space-4;
}

.fsm {
  width: 100%;
  max-width: 440px;
  border-radius: $radius-md;
  border: 1px solid $color-border;
  background: var(--ex-modal-surface);
  box-shadow: var(--ex-modal-shadow-elevated);
}

.fsm__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $space-3 $space-4;
  border-bottom: 1px solid $color-border;
}

.fsm__title {
  font-weight: $font-weight-bold;
  font-size: $font-size-md;
  color: $color-text-primary;
}

.fsm__x {
  border: none;
  background: transparent;
  color: $color-text-tertiary;
  font-size: 22px;
  cursor: pointer;
  line-height: 1;
}

.fsm__body {
  padding: $space-4;
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.fsm__body--tight {
  padding-top: $space-3;
  gap: $space-2;
}

.fsm__body--success {
  padding-bottom: $space-3;
}

.fsm__confirm-lead {
  margin: 0 0 $space-1;
  font-size: $font-size-xs;
  color: $color-text-secondary;
  line-height: 1.55;
}

.fsm__dl {
  margin: 0;
  padding: $space-2 $space-3;
  border-radius: $radius-sm;
  border: 1px solid var(--ex-border-subtle);
  background: var(--ex-surface-inset);
}

.fsm__dl-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: $space-3;
  padding: 8px 0;
  border-bottom: 1px solid var(--ex-border-subtle);
  font-size: $font-size-xs;

  &:last-child {
    border-bottom: none;
  }

  dt {
    margin: 0;
    color: $color-text-tertiary;
    flex-shrink: 0;
  }

  dd {
    margin: 0;
    text-align: right;
    color: $color-text-primary;
    font-weight: $font-weight-semibold;
  }
}

.fsm__dl-row--emph dd {
  color: $color-brand;
  font-size: $font-size-sm;
}

.fsm__mono {
  font-family: $font-family-mono;
  font-size: 10px;
  word-break: break-all;
}

.fsm__confirm-warn {
  margin: 0;
  font-size: 10px;
  line-height: 1.5;
  color: $color-text-tertiary;
}

.fsm__apy {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 6px 12px;
  margin: 0;
}

.fsm__apy-label {
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  color: $color-text-secondary;
}

.fsm__apy-right {
  display: inline-flex;
  align-items: baseline;
  gap: 4px;
}

.fsm__apy-val {
  font-size: $font-size-xl;
  font-weight: $font-weight-bold;
  font-family: $font-family-mono;
  color: $color-rise;
}

.fsm__apy-unit {
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  color: $color-text-tertiary;
  margin-left: 4px;
}

.fsm__apy-hint {
  margin: 0 0 $space-2;
  font-size: 10px;
  color: $color-text-tertiary;
  line-height: 1.4;
}

.fsm__daily {
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4px 8px;
  font-size: $font-size-xs;
  color: $color-text-secondary;
}

.fsm__daily-hint {
  width: 100%;
  font-size: 10px;
  color: $color-text-tertiary;
}

.fsm__daily--compact {
  flex-wrap: wrap;
  gap: 4px 6px;
  font-size: $font-size-xs;
  color: $color-text-secondary;
}

.fsm__daily-sep {
  color: $color-text-tertiary;
}

.fsm__rule {
  margin: 0;
  font-size: $font-size-xs;
  color: $color-text-secondary;
  line-height: 1.5;
  padding: $space-2;
  border-radius: $radius-sm;
  background: var(--ex-surface-inset);
  border: 1px solid var(--ex-border-subtle);
}

.fsm__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.fsm__lab {
  font-size: $font-size-xs;
  color: $color-text-tertiary;
}

.fsm__quick {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: -4px;
}

.fsm__quick-btn {
  padding: 6px 12px;
  font-size: 11px;
  font-weight: $font-weight-semibold;
  border-radius: $radius-sm;
  border: 1px solid rgba(240, 185, 11, 0.35);
  background: rgba(240, 185, 11, 0.08);
  color: $color-brand;
  cursor: pointer;
}

.fsm__quick-btn:hover {
  background: rgba(240, 185, 11, 0.14);
}

.fsm__input {
  padding: 10px $space-3;
  border-radius: $radius-sm;
  border: 1px solid $color-border;
  background: var(--ex-surface-inset-strong);
  color: $color-text-primary;
  font-size: $font-size-md;
  font-family: $font-family-mono;

  &:focus {
    outline: none;
    border-color: rgba(240, 185, 11, 0.5);
    box-shadow: 0 0 0 1px rgba(240, 185, 11, 0.15);
  }
}

.fsm__avail,
.fsm__est {
  margin: 0;
  font-size: $font-size-xs;
  color: $color-text-tertiary;
}

.fsm__check {
  display: flex;
  gap: $space-2;
  font-size: 11px;
  line-height: 1.45;
  color: $color-text-secondary;
  cursor: pointer;
  align-items: flex-start;
}

.fsm__cb {
  margin-top: 2px;
  accent-color: $color-brand;
  flex-shrink: 0;
}

.fsm__form-hint {
  margin: 0;
  font-size: 11px;
  color: $color-text-tertiary;
}

.fsm__foot {
  display: flex;
  justify-content: flex-end;
  gap: $space-2;
  padding: $space-3 $space-4;
  border-top: 1px solid $color-border;
}

.fsm__foot--stack {
  flex-direction: column;
}

.fsm__btn {
  padding: $space-2 $space-4;
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  border-radius: $radius-sm;
  cursor: pointer;
  border: 1px solid transparent;
}

.fsm__btn--ghost {
  background: transparent;
  border-color: $color-border;
  color: $color-text-secondary;
}

.fsm__btn--primary {
  background: var(--ex-brand);
  color: var(--ex-on-brand);
}

.fsm__btn--primary:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.fsm__btn--block {
  width: 100%;
  max-width: none;
}

.ex-num {
  font-family: $font-family-mono;
}
</style>
