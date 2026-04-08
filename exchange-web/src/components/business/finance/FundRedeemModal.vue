<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { FundPosition } from '@/types/financeEarn'
import { formatPrice } from '@/utils/format/number'
import { useFinanceFundStore } from '@/stores/financeFund'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'
import FundFlowSuccessPanel from '@/components/business/finance/FundFlowSuccessPanel.vue'

const props = defineProps<{
  modelValue: boolean
  position: FundPosition | null
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
/** 提交前快照，用于成功页文案（赎回后持仓对象可能已变） */
const snapshotInterestPart = ref(0)

watch(
  () => props.modelValue,
  (v) => {
    if (v) {
      phase.value = 'form'
      amountStr.value = props.position ? String(props.position.amount) : ''
      agreed.value = false
      orderRefDemo.value = ''
      snapshotInterestPart.value = 0
    }
  },
)

const position = computed(() => props.position)

const product = computed(() => {
  if (!props.position) return null
  return store.productMap.get(props.position.productId) ?? null
})

const amountNum = computed(() => {
  const n = parseFloat(amountStr.value.replace(/,/g, ''))
  return Number.isFinite(n) ? n : 0
})

const estInterestPart = computed(() => {
  if (!props.position || props.position.amount <= 0) return 0
  return (amountNum.value / props.position.amount) * props.position.accruedInterest
})

const drawerTitle = computed(() => {
  if (phase.value === 'success') return '赎回结果'
  if (phase.value === 'confirm') return '核对赎回订单'
  return product.value ? `赎回 · ${product.value.name}` : '赎回 · 活期'
})

function close() {
  emit('update:modelValue', false)
}

function onOverlayClick() {
  if (phase.value === 'success') return
  close()
}

const canGoConfirm = computed(
  () =>
    !!props.position &&
    agreed.value &&
    amountNum.value > 0 &&
    amountNum.value <= props.position.amount + 1e-9,
)

function goToConfirm() {
  if (!props.position) return
  if (!auth.isAuthenticated) {
    app.pushToast('warning', '请先登录后再操作')
    return
  }
  if (!canGoConfirm.value) {
    app.pushToast('warning', '请确认赎回金额并勾选协议')
    return
  }
  orderRefDemo.value = `FRD-${Date.now().toString(36).toUpperCase()}`
  phase.value = 'confirm'
}

function backToForm() {
  phase.value = 'form'
}

function submitRedeem() {
  if (!props.position || phase.value !== 'confirm') return
  if (!auth.isAuthenticated) {
    app.pushToast('warning', '请先登录后再操作')
    return
  }
  snapshotInterestPart.value = estInterestPart.value
  const ok = store.redeemFlexible(props.position.id, amountNum.value)
  if (!ok) return
  successAnimKey.value += 1
  app.pushToast(
    'success',
    `赎回已受理 · 本金 ${formatPrice(amountNum.value)} + 预估收益 ${formatPrice(snapshotInterestPart.value)} USDT（演示）`,
  )
  phase.value = 'success'
}

const successDesc = computed(() => {
  const p = product.value
  if (!p || !position.value) return ''
  return `演示单号 ${orderRefDemo.value || '—'}。已将 ${formatPrice(amountNum.value)} USDT 本金与约 ${formatPrice(snapshotInterestPart.value)} USDT 预估收益计入可申购余额（演示）。产品：${p.name}。`
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="modelValue && position"
      class="frm-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="赎回"
      @click.self="onOverlayClick"
    >
      <div class="frm">
        <div class="frm__head">
          <span class="frm__title">{{ drawerTitle }}</span>
          <button type="button" class="frm__x" aria-label="关闭" @click="close">×</button>
        </div>

        <template v-if="phase === 'form'">
          <div class="frm__body">
            <p v-if="product" class="frm__product">{{ product.name }} · 活期</p>
            <p class="frm__row">
              当前持仓：<span class="ex-num">{{ formatPrice(position.amount) }}</span> USDT
            </p>
            <p class="frm__row">
              累计收益：<span class="ex-num frm__pnl">{{ formatPrice(position.accruedInterest) }}</span> USDT
            </p>
            <label class="frm__field">
              <span class="frm__lab">赎回数量 (USDT)</span>
              <input v-model="amountStr" type="text" inputmode="decimal" class="frm__input" />
            </label>
            <p v-if="amountNum > 0" class="frm__est">
              本次预估收益份额：<span class="ex-num">{{ formatPrice(estInterestPart) }}</span> USDT（按赎回比例拆分演示）
            </p>
            <label class="frm__check">
              <input v-model="agreed" type="checkbox" class="frm__cb" />
              <span>确认赎回至资金账户，实际到账时间与手续费以系统规则为准。</span>
            </label>
          </div>
          <div class="frm__foot">
            <button type="button" class="frm__btn frm__btn--ghost" @click="close">取消</button>
            <button
              type="button"
              class="frm__btn frm__btn--primary"
              :disabled="!canGoConfirm"
              @click="goToConfirm"
            >
              核对订单
            </button>
          </div>
        </template>

        <template v-else-if="phase === 'confirm'">
          <div class="frm__body frm__body--tight">
            <p class="frm__lead">请核对赎回信息；提交后演示持仓与余额将立即更新。</p>
            <dl class="frm__dl">
              <div class="frm__dl-row">
                <dt>订单类型</dt>
                <dd>活期赎回（演示）</dd>
              </div>
              <div class="frm__dl-row">
                <dt>产品名称</dt>
                <dd>{{ product?.name ?? position.productId }}</dd>
              </div>
              <div class="frm__dl-row">
                <dt>持仓本金</dt>
                <dd><span class="ex-num">{{ formatPrice(position.amount) }}</span> USDT</dd>
              </div>
              <div class="frm__dl-row">
                <dt>累计收益</dt>
                <dd><span class="ex-num">{{ formatPrice(position.accruedInterest) }}</span> USDT</dd>
              </div>
              <div class="frm__dl-row frm__dl-row--emph">
                <dt>本次赎回本金</dt>
                <dd><span class="ex-num">{{ formatPrice(amountNum) }}</span> USDT</dd>
              </div>
              <div class="frm__dl-row">
                <dt>预估收益份额</dt>
                <dd><span class="ex-num">{{ formatPrice(estInterestPart) }}</span> USDT</dd>
              </div>
              <div class="frm__dl-row">
                <dt>预计到账合计（演示）</dt>
                <dd>
                  <span class="ex-num">{{ formatPrice(amountNum + estInterestPart) }}</span> USDT
                </dd>
              </div>
              <div class="frm__dl-row">
                <dt>演示单号</dt>
                <dd class="frm__mono">{{ orderRefDemo }}</dd>
              </div>
            </dl>
            <p class="frm__warn">正式环境以账务确认时间为准；此处仅为交互演示。</p>
          </div>
          <div class="frm__foot">
            <button type="button" class="frm__btn frm__btn--ghost" @click="backToForm">返回修改</button>
            <button type="button" class="frm__btn frm__btn--primary" @click="submitRedeem">确认赎回</button>
          </div>
        </template>

        <template v-else>
          <div class="frm__body frm__body--success">
            <FundFlowSuccessPanel
              :key="successAnimKey"
              variant="redeem"
              ribbon="赎回受理"
              title="赎回订单已提交"
              :description="successDesc"
            />
          </div>
          <div class="frm__foot frm__foot--stack">
            <button type="button" class="frm__btn frm__btn--primary frm__btn--block" @click="close">完成</button>
          </div>
        </template>
      </div>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.frm-overlay {
  position: fixed;
  inset: 0;
  z-index: 520;
  background: var(--ex-overlay-backdrop);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $space-4;
}

.frm {
  width: 100%;
  max-width: 420px;
  border-radius: $radius-md;
  border: 1px solid $color-border;
  background: var(--ex-modal-surface);
  box-shadow: var(--ex-modal-shadow-elevated);
}

.frm__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $space-3 $space-4;
  border-bottom: 1px solid $color-border;
}

.frm__title {
  font-weight: $font-weight-bold;
  font-size: $font-size-md;
  color: $color-text-primary;
}

.frm__x {
  border: none;
  background: transparent;
  color: $color-text-tertiary;
  font-size: 22px;
  cursor: pointer;
  line-height: 1;
}

.frm__body {
  padding: $space-4;
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.frm__body--tight {
  padding-top: $space-3;
  gap: $space-2;
}

.frm__body--success {
  padding-bottom: $space-3;
}

.frm__product {
  margin: 0;
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.frm__lead {
  margin: 0 0 $space-1;
  font-size: $font-size-xs;
  color: $color-text-secondary;
  line-height: 1.55;
}

.frm__dl {
  margin: 0;
  padding: $space-2 $space-3;
  border-radius: $radius-sm;
  border: 1px solid var(--ex-border-subtle);
  background: var(--ex-surface-inset);
}

.frm__dl-row {
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

.frm__dl-row--emph dd {
  color: $color-brand;
  font-size: $font-size-sm;
}

.frm__mono {
  font-family: $font-family-mono;
  font-size: 10px;
  word-break: break-all;
}

.frm__warn {
  margin: 0;
  font-size: 10px;
  line-height: 1.5;
  color: $color-text-tertiary;
}

.frm__row {
  margin: 0;
  font-size: $font-size-sm;
  color: $color-text-secondary;
}

.frm__pnl {
  color: $color-rise;
}

.frm__est {
  margin: 0;
  font-size: $font-size-xs;
  color: $color-text-tertiary;
}

.frm__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.frm__lab {
  font-size: $font-size-xs;
  color: $color-text-tertiary;
}

.frm__input {
  padding: 10px $space-3;
  border-radius: $radius-sm;
  border: 1px solid $color-border;
  background: var(--ex-surface-inset-strong);
  color: $color-text-primary;
  font-family: $font-family-mono;
  &:focus {
    outline: none;
    border-color: rgba(240, 185, 11, 0.5);
  }
}

.frm__check {
  display: flex;
  gap: $space-2;
  font-size: 11px;
  line-height: 1.45;
  color: $color-text-tertiary;
  cursor: pointer;
  align-items: flex-start;
}

.frm__cb {
  margin-top: 2px;
  accent-color: $color-brand;
  flex-shrink: 0;
}

.frm__foot {
  display: flex;
  justify-content: flex-end;
  gap: $space-2;
  padding: $space-3 $space-4;
  border-top: 1px solid $color-border;
}

.frm__foot--stack {
  flex-direction: column;
}

.frm__btn {
  padding: $space-2 $space-4;
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  border-radius: $radius-sm;
  cursor: pointer;
  border: 1px solid transparent;
}

.frm__btn--ghost {
  background: transparent;
  border-color: $color-border;
  color: $color-text-secondary;
}

.frm__btn--primary {
  background: var(--ex-brand);
  color: var(--ex-on-brand);
}

.frm__btn--primary:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.frm__btn--block {
  width: 100%;
}

.ex-num {
  font-family: $font-family-mono;
}
</style>
