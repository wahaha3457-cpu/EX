<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import type { LendingAssistPlan, LendingLoan } from '@/types/financeCredit'
import { useLendingAssistStore } from '@/stores/lendingAssist'
import { formatPrice } from '@/utils/format/number'
import { RouteNames } from '@/constants/routeNames'

const props = defineProps<{
  modelValue: boolean
  plan: LendingAssistPlan | null
}>()

const emit = defineEmits<{
  'update:modelValue': [v: boolean]
  /** 用户从成功页选择查看在贷列表 */
  completed: []
}>()

const store = useLendingAssistStore()

type FlowStep = 'form' | 'confirm' | 'success'

const flowStep = ref<FlowStep>('form')
const amountStr = ref('')
const agreed = ref(false)
const createdLoan = ref<LendingLoan | null>(null)

watch(
  () => props.modelValue,
  (v) => {
    if (v) {
      flowStep.value = 'form'
      amountStr.value = ''
      agreed.value = false
      createdLoan.value = null
    }
  },
)

const amountNum = computed(() => {
  const n = parseFloat(amountStr.value.replace(/,/g, ''))
  return Number.isFinite(n) ? n : 0
})

const capPerOrder = computed(() => {
  if (!props.plan) return 0
  return Math.min(props.plan.maxAmount, store.availableQuota)
})

const estInterest = computed(() => {
  if (!props.plan || amountNum.value <= 0) return 0
  return amountNum.value * (props.plan.dailyRatePct / 100) * props.plan.termDays
})

/** 与 store.apply 一致的到期预览（确认页展示） */
const previewDueAtIso = computed(() => {
  if (!props.plan) return ''
  const due = new Date(Date.now() + props.plan.termDays * 86400000).toISOString()
  return due
})

function fmtDate(iso: string) {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('zh-CN', { dateStyle: 'short', timeStyle: 'short' })
}

function close() {
  emit('update:modelValue', false)
}

function goConfirm() {
  if (!canSubmit.value) return
  flowStep.value = 'confirm'
}

function backToForm() {
  flowStep.value = 'form'
}

function submitBorrow() {
  if (!props.plan) return
  const loan = store.apply(props.plan.id, amountNum.value)
  if (loan) {
    createdLoan.value = loan
    flowStep.value = 'success'
  }
}

function goMyLoans() {
  emit('completed')
  close()
}

function finishOnly() {
  close()
}

const canSubmit = computed(() => {
  if (!props.plan || !agreed.value) return false
  const p = props.plan
  return amountNum.value >= p.minAmount && amountNum.value <= capPerOrder.value + 1e-9
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="modelValue && plan"
      class="lam-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="申请助力贷"
      @click.self="close"
    >
      <div class="lam">
        <div class="lam__head">
          <div class="lam__head-txt">
            <span class="lam__title">助力贷 · 申请借款</span>
            <span class="lam__plan-name">{{ plan.name }}</span>
          </div>
          <button type="button" class="lam__x" aria-label="关闭" @click="close">×</button>
        </div>

        <div class="lam__steps" aria-hidden="true">
          <span class="lam__st" :class="{ 'lam__st--on': flowStep === 'form', 'lam__st--done': flowStep !== 'form' }"
            >1 填写</span
          >
          <span class="lam__st-line" />
          <span
            class="lam__st"
            :class="{ 'lam__st--on': flowStep === 'confirm', 'lam__st--done': flowStep === 'success' }"
            >2 确认</span
          >
          <span class="lam__st-line" />
          <span class="lam__st" :class="{ 'lam__st--on': flowStep === 'success' }">3 提交</span>
        </div>

        <!-- 1 填写 -->
        <div v-show="flowStep === 'form'" class="lam__body">
          <p class="lam__apy">
            <span class="lam__apy-label">日利率（展示）</span>
            <span class="lam__apy-val ex-num">{{ plan.dailyRatePct }}%</span>
          </p>
          <p class="lam__rule">
            {{ plan.purposeHint }} · 期限 {{ plan.termDays }} 天；到期时间以放款成功时刻为准（演示）。
          </p>
          <label class="lam__field">
            <span class="lam__lab">借款金额 (USDT)</span>
            <input
              v-model="amountStr"
              type="text"
              inputmode="decimal"
              class="lam__input"
              :placeholder="`单笔 ${plan.minAmount} ~ ${formatPrice(capPerOrder)}`"
            />
          </label>
          <p class="lam__hint">
            剩余助力额度：<span class="ex-num">{{ formatPrice(store.availableQuota) }}</span> USDT · 本单上限
            <span class="ex-num">{{ formatPrice(capPerOrder) }}</span> USDT
          </p>
          <p v-if="amountNum > 0" class="lam__est">
            按展示日利率粗算周期利息约：<span class="ex-num">{{ formatPrice(estInterest) }}</span> USDT（演示，非最终账单）
          </p>
          <label class="lam__check">
            <input v-model="agreed" type="checkbox" class="lam__cb" />
            <span
              >我已阅读并同意《助力贷服务协议》及《个人征信授权书》，知晓借款需按时还款，逾期将产生罚息并影响信用评估（演示）。</span
            >
          </label>
        </div>

        <!-- 2 订单确认 -->
        <div v-show="flowStep === 'confirm'" class="lam__body lam__body--confirm">
          <p class="lam__confirm-lead">
            请核对以下信息。确认后将<strong class="lam__strong">提交平台后台审核</strong>；审批通过后才会放款并生成有效借据（正式环境以合同为准）。
          </p>
          <div class="lam__summary" role="group" aria-label="借贷确认">
            <div class="lam__sum-row">
              <span class="lam__sum-k">产品方案</span>
              <span class="lam__sum-v">{{ plan.name }}</span>
            </div>
            <div class="lam__sum-row">
              <span class="lam__sum-k">借款本金</span>
              <span class="lam__sum-v lam__sum-v--strong ex-num">{{ formatPrice(amountNum) }} USDT</span>
            </div>
            <div class="lam__sum-row">
              <span class="lam__sum-k">借款期限</span>
              <span class="lam__sum-v">{{ plan.termDays }} 天</span>
            </div>
            <div class="lam__sum-row">
              <span class="lam__sum-k">日利率</span>
              <span class="lam__sum-v ex-num">{{ plan.dailyRatePct }}%</span>
            </div>
            <div class="lam__sum-row">
              <span class="lam__sum-k">预计周期利息</span>
              <span class="lam__sum-v ex-num">≈ {{ formatPrice(estInterest) }} USDT</span>
            </div>
            <div class="lam__sum-row lam__sum-row--full">
              <span class="lam__sum-k">预计到期日</span>
              <span class="lam__sum-v">{{ fmtDate(previewDueAtIso) }}</span>
            </div>
            <div class="lam__sum-row lam__sum-row--full">
              <span class="lam__sum-k">放款币种</span>
              <span class="lam__sum-v">USDT（演示）</span>
            </div>
          </div>
          <p class="lam__confirm-note">
            审核结果将通过站内<strong class="lam__strong">公告</strong>等形式通知；演示环境可在「我的借款」中模拟审核通过。
          </p>
        </div>

        <!-- 3 已提交审核 -->
        <div v-if="flowStep === 'success' && createdLoan" class="lam__body lam__body--success">
          <div class="lam__ok-icon lam__ok-icon--submit" aria-hidden="true">✓</div>
          <h3 class="lam__ok-title">申请已提交审核</h3>
          <p class="lam__ok-sub">
            平台将在后台完成风控审批。通过后我们会向<strong class="lam__strong">公告中心</strong>推送通知（演示）；您也可在「我的借款」中查看进度，并使用「模拟后台审核通过」体验完整放款闭环。
          </p>
          <div class="lam__ok-card">
            <div class="lam__ok-row">
              <span class="lam__ok-k">申请编号</span>
              <span class="lam__ok-v lam__mono">{{ createdLoan.id }}</span>
            </div>
            <div class="lam__ok-row">
              <span class="lam__ok-k">申请金额</span>
              <span class="lam__ok-v ex-num">{{ formatPrice(createdLoan.principal) }} USDT</span>
            </div>
            <div class="lam__ok-row">
              <span class="lam__ok-k">提交时间</span>
              <span class="lam__ok-v">{{ fmtDate(createdLoan.borrowedAt) }}</span>
            </div>
            <div class="lam__ok-row">
              <span class="lam__ok-k">当前状态</span>
              <span class="lam__ok-v lam__ok-v--pending">待平台审核</span>
            </div>
          </div>
          <p class="lam__ok-ann">
            <RouterLink class="lam__ann-link" :to="{ name: RouteNames.AnnounceCenter }">前往公告中心</RouterLink>
            <span class="lam__ann-hint">· 审批通过后此处将展示通知摘要</span>
          </p>
        </div>

        <div class="lam__foot">
          <template v-if="flowStep === 'form'">
            <button type="button" class="lam__btn lam__btn--ghost" @click="close">取消</button>
            <button type="button" class="lam__btn lam__btn--primary" :disabled="!canSubmit" @click="goConfirm">
              下一步 · 确认订单
            </button>
          </template>
          <template v-else-if="flowStep === 'confirm'">
            <button type="button" class="lam__btn lam__btn--ghost" @click="backToForm">返回修改</button>
            <button type="button" class="lam__btn lam__btn--primary" @click="submitBorrow">提交审核</button>
          </template>
          <template v-else>
            <button type="button" class="lam__btn lam__btn--ghost" @click="finishOnly">完成</button>
            <button type="button" class="lam__btn lam__btn--primary" @click="goMyLoans">查看我的借款</button>
          </template>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.lam-overlay {
  position: fixed;
  inset: 0;
  z-index: $z-modal;
  background: var(--ex-overlay-backdrop);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: calc(var(--ex-header-height, #{$header-height}) + 16px) $space-4 max(16px, env(safe-area-inset-bottom, 0px));
  overflow-y: auto;
  box-sizing: border-box;
}

.lam {
  width: 100%;
  max-width: min(440px, calc(100vw - 32px));
  max-height: min(88vh, 720px);
  border-radius: 12px;
  border: 1px solid rgba(240, 185, 11, 0.22);
  background: var(--ex-card-surface);
  box-shadow: var(--ex-modal-shadow-elevated);
  display: flex;
  flex-direction: column;
  min-height: 0;
  margin: auto;
}

.lam__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: $space-3;
  padding: $space-3 $space-4;
  border-bottom: 1px solid $color-border;
  flex-shrink: 0;
}

.lam__head-txt {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.lam__title {
  font-weight: $font-weight-bold;
  font-size: $font-size-sm;
  color: $color-text-tertiary;
  letter-spacing: 0.02em;
}

.lam__plan-name {
  font-size: $font-size-md;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.lam__x {
  flex-shrink: 0;
  border: none;
  background: transparent;
  color: $color-text-tertiary;
  font-size: 22px;
  cursor: pointer;
  line-height: 1;
  padding: 4px;
  border-radius: $radius-sm;
}

.lam__x:hover {
  color: $color-text-primary;
  background: var(--ex-fill-hover-subtle);
}

.lam__steps {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: $space-2 $space-4;
  background: var(--ex-panel-sunken);
  border-bottom: 1px solid $color-border;
  flex-shrink: 0;
  flex-wrap: wrap;
}

.lam__st {
  font-size: 10px;
  font-weight: $font-weight-bold;
  color: $color-text-tertiary;
  white-space: nowrap;
}

.lam__st--on {
  color: $color-brand;
}

.lam__st--done {
  color: $color-rise;
}

.lam__st-line {
  width: 12px;
  height: 1px;
  background: linear-gradient(90deg, transparent, $color-border, transparent);
  flex-shrink: 0;
}

.lam__body {
  padding: $space-4;
  display: flex;
  flex-direction: column;
  gap: $space-3;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
}

.lam__apy {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin: 0;
}

.lam__apy-label {
  font-size: $font-size-sm;
  color: $color-text-tertiary;
}

.lam__apy-val {
  font-size: $font-size-xl;
  font-weight: $font-weight-bold;
  font-family: $font-family-mono;
  color: $color-rise;
}

.lam__rule {
  margin: 0;
  font-size: $font-size-xs;
  color: $color-text-secondary;
  line-height: 1.5;
  padding: $space-2;
  border-radius: $radius-sm;
  background: var(--ex-surface-inset);
  border: 1px solid var(--ex-border-subtle);
}

.lam__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.lam__lab {
  font-size: $font-size-xs;
  color: $color-text-tertiary;
}

.lam__input {
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

.lam__hint,
.lam__est {
  margin: 0;
  font-size: $font-size-xs;
  color: $color-text-tertiary;
  line-height: 1.45;
}

.lam__check {
  display: flex;
  gap: $space-2;
  font-size: 11px;
  line-height: 1.45;
  color: $color-text-secondary;
  cursor: pointer;
  align-items: flex-start;
}

.lam__cb {
  margin-top: 2px;
  accent-color: $color-brand;
  flex-shrink: 0;
}

.lam__confirm-lead {
  margin: 0;
  font-size: $font-size-xs;
  color: $color-text-secondary;
  line-height: 1.5;
}

.lam__summary {
  display: flex;
  flex-direction: column;
  gap: 0;
  border-radius: $radius-md;
  border: 1px solid rgba(240, 185, 11, 0.2);
  background: rgba(240, 185, 11, 0.05);
  overflow: hidden;
}

.lam__sum-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: $space-3;
  padding: 10px $space-3;
  border-bottom: 1px solid var(--ex-border-subtle);
  font-size: $font-size-xs;

  &:last-child {
    border-bottom: none;
  }
}

.lam__sum-row--full {
  flex-wrap: wrap;
}

.lam__sum-k {
  color: $color-text-tertiary;
  flex-shrink: 0;
}

.lam__sum-v {
  color: $color-text-primary;
  text-align: right;
}

.lam__sum-v--strong {
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  color: $color-rise;
}

.lam__confirm-note {
  margin: 0;
  font-size: 10px;
  color: $color-text-tertiary;
  line-height: 1.45;
}

.lam__strong {
  color: $color-text-primary;
  font-weight: $font-weight-bold;
}

.lam__body--success {
  align-items: center;
  text-align: center;
}

.lam__ok-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: $font-weight-bold;
  color: var(--ex-on-brand);
  background: linear-gradient(135deg, #32d296, #0ecb81);
  box-shadow: 0 8px 24px rgba(14, 203, 129, 0.25);
}

.lam__ok-icon--submit {
  background: linear-gradient(135deg, #5b8cff, #3084fc);
  box-shadow: 0 8px 24px rgba(48, 132, 252, 0.28);
}

.lam__ok-title {
  margin: $space-2 0 0;
  font-size: $font-size-md;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.lam__ok-sub {
  margin: 0;
  font-size: $font-size-xs;
  color: $color-text-secondary;
  line-height: 1.55;
  max-width: 320px;
}

.lam__ok-card {
  width: 100%;
  margin-top: $space-2;
  padding: $space-3;
  border-radius: $radius-md;
  border: 1px solid $color-border;
  background: var(--ex-surface-inset);
  text-align: left;
}

.lam__ok-row {
  display: flex;
  justify-content: space-between;
  gap: $space-2;
  font-size: $font-size-xs;
  padding: 6px 0;
  border-bottom: 1px solid var(--ex-border-subtle);

  &:last-child {
    border-bottom: none;
  }
}

.lam__ok-k {
  color: $color-text-tertiary;
}

.lam__ok-v {
  color: $color-text-primary;
  word-break: break-all;
}

.lam__mono {
  font-family: $font-family-mono;
  font-size: 10px;
}

.lam__ok-v--pending {
  color: $color-brand;
  font-weight: $font-weight-bold;
}

.lam__ok-ann {
  margin: $space-2 0 0;
  font-size: $font-size-xs;
  line-height: 1.5;
  text-align: center;
  max-width: 320px;
}

.lam__ann-link {
  color: $color-brand;
  font-weight: $font-weight-semibold;
  text-decoration: none;
}

.lam__ann-link:hover {
  text-decoration: underline;
}

.lam__ann-hint {
  color: $color-text-tertiary;
}

.lam__foot {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: $space-2;
  padding: $space-3 $space-4;
  border-top: 1px solid $color-border;
  flex-shrink: 0;
  background: var(--ex-card-surface);
}

.lam__btn {
  padding: 10px 18px;
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  border-radius: $radius-sm;
  cursor: pointer;
  border: 1px solid transparent;
}

.lam__btn--ghost {
  background: transparent;
  border-color: $color-border;
  color: $color-text-secondary;
}

.lam__btn--primary {
  background: linear-gradient(135deg, #f0d12a 0%, #f0b90b 50%, #c99400 100%);
  color: #0a0e17;
  border: none;
  box-shadow: 0 6px 20px rgba(240, 185, 11, 0.22);
}

.lam__btn--primary:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  box-shadow: none;
}

.ex-num {
  font-family: $font-family-mono;
}
</style>
