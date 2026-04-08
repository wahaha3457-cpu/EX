<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { StakingLoanPosition } from '@/types/financeCredit'
import { formatPrice } from '@/utils/format/number'
import { useStakingBorrowStore } from '@/stores/stakingBorrow'
import { useAppStore } from '@/stores/app'
import StakingFlowResultBlock from '@/components/business/finance/StakingFlowResultBlock.vue'

const props = defineProps<{
  modelValue: boolean
  position: StakingLoanPosition | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
}>()

const app = useAppStore()
const store = useStakingBorrowStore()

const phase = ref<'form' | 'confirm' | 'success'>('form')
const repayOutcome = ref<'partial' | 'closed' | null>(null)
const orderRefDemo = ref('')

const amountStr = ref('')
const agreed = ref(false)

watch(
  () => props.modelValue,
  (v) => {
    if (v) {
      phase.value = 'form'
      repayOutcome.value = null
      orderRefDemo.value = ''
      agreed.value = false
      if (props.position) {
        const t = props.position.borrowedUsdt + props.position.accruedInterestUsdt
        amountStr.value = t > 0 ? String(Math.round(t * 100) / 100) : ''
      } else {
        amountStr.value = ''
      }
    }
  },
)

const amountNum = computed(() => {
  const n = parseFloat(amountStr.value.replace(/,/g, ''))
  return Number.isFinite(n) ? n : 0
})

const totalDue = computed(() => {
  if (!props.position) return 0
  return props.position.borrowedUsdt + props.position.accruedInterestUsdt
})

const willClosePosition = computed(() => amountNum.value >= totalDue.value - 1e-6 && totalDue.value > 0)

function close() {
  emit('update:modelValue', false)
}

function onOverlayClick() {
  if (phase.value === 'success') return
  close()
}

function setFull() {
  amountStr.value = String(Math.round(totalDue.value * 100) / 100)
}

const canSubmit = computed(() => {
  if (!props.position || !agreed.value) return false
  return amountNum.value > 0 && amountNum.value <= totalDue.value + 1e-6
})

function goToConfirm() {
  if (!canSubmit.value || !props.position) return
  phase.value = 'confirm'
}

function backToForm() {
  phase.value = 'form'
}

function submitRepay() {
  if (!props.position || phase.value !== 'confirm') return
  orderRefDemo.value = `STK-RP-${Date.now().toString(36).toUpperCase()}`
  const r = store.repay(props.position.id, amountNum.value)
  if (r === false) return
  repayOutcome.value = r
  if (r === 'closed') {
    app.pushToast('success', '仓位已结清，质押物已退回（演示）')
  } else {
    app.pushToast('success', `还款 ${formatPrice(amountNum.value)} USDT 已入账（演示）`)
  }
  phase.value = 'success'
}

const resultTone = computed(() => (repayOutcome.value === 'closed' ? 'neutral' : 'rise'))
const resultRibbon = computed(() => (repayOutcome.value === 'closed' ? '仓位结清' : '还款成功'))
const resultTitle = computed(() => (repayOutcome.value === 'closed' ? '负债已清零' : '还款已提交'))
const resultDesc = computed(() => {
  const p = props.position
  const refId = orderRefDemo.value || '—'
  if (!p) return ''
  if (repayOutcome.value === 'closed') {
    return `演示订单号 ${refId}。您已还清 ${p.collateralAsset} 质押仓位的全部负债，质押物已按演示逻辑退回资金账户。可在「历史记录」中查看结清流水。`
  }
  if (repayOutcome.value === 'partial') {
    return `演示订单号 ${refId}。本次还款 ${formatPrice(amountNum.value)} USDT 已入账，仓位仍保留；请留意剩余负债与 LTV 变化，可在「我的仓位」继续管理。`
  }
  return ''
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="modelValue && position"
      class="fsm-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="质押借币还款"
      @click.self="onOverlayClick"
    >
      <div class="fsm">
        <div class="fsm__head">
          <span class="fsm__title">{{
            phase === 'success' ? '还款结果' : `还款 · ${position.collateralAsset} 质押仓位`
          }}</span>
          <button type="button" class="fsm__x" aria-label="关闭" @click="close">×</button>
        </div>

        <template v-if="phase === 'form'">
          <div class="fsm__body">
            <p class="fsm__meta">
              借入本金 <span class="ex-num">{{ formatPrice(position.borrowedUsdt) }}</span> USDT · 应计利息
              <span class="ex-num">{{ formatPrice(position.accruedInterestUsdt) }}</span> USDT
            </p>
            <p class="fsm__meta fsm__meta--bold">
              合计应还 <span class="ex-num">{{ formatPrice(totalDue) }}</span> USDT
            </p>
            <label class="fsm__field">
              <span class="fsm__lab">还款金额 (USDT)</span>
              <input v-model="amountStr" type="text" inputmode="decimal" class="fsm__input" />
            </label>
            <button type="button" class="fsm__linkbtn" @click="setFull">填入全部应还</button>
            <p class="fsm__hint">还清全部负债后，质押物将解锁退回钱包（演示）。</p>
            <label class="fsm__check">
              <input v-model="agreed" type="checkbox" class="fsm__cb" />
              <span>我确认从账户扣款还款，并同意《质押借币服务协议》相关条款（演示）。</span>
            </label>
          </div>
          <div class="fsm__foot">
            <div class="fsm__foot-row">
              <button type="button" class="fsm__btn fsm__btn--ghost" @click="close">取消</button>
              <button type="button" class="fsm__btn fsm__btn--primary" :disabled="!canSubmit" @click="goToConfirm">
                核对订单
              </button>
            </div>
          </div>
        </template>

        <template v-else-if="phase === 'confirm'">
          <div class="fsm__body fsm__body--tight">
            <p class="fsm__confirm-lead">请确认还款金额与扣款方向；提交后演示余额与仓位将立即更新。</p>
            <dl class="fsm__dl">
              <div class="fsm__dl-row">
                <dt>质押资产</dt>
                <dd>{{ position.collateralAsset }}</dd>
              </div>
              <div class="fsm__dl-row">
                <dt>当前质押数量</dt>
                <dd>
                  <span class="ex-num">{{ formatPrice(position.collateralAmount) }}</span> {{ position.collateralAsset }}
                </dd>
              </div>
              <div class="fsm__dl-row">
                <dt>当前 LTV</dt>
                <dd>
                  <span class="ex-num">{{ position.currentLtvPct }}</span> %
                </dd>
              </div>
              <div class="fsm__dl-row">
                <dt>待还本金</dt>
                <dd>
                  <span class="ex-num">{{ formatPrice(position.borrowedUsdt) }}</span> USDT
                </dd>
              </div>
              <div class="fsm__dl-row">
                <dt>待还利息</dt>
                <dd>
                  <span class="ex-num">{{ formatPrice(position.accruedInterestUsdt) }}</span> USDT
                </dd>
              </div>
              <div class="fsm__dl-row fsm__dl-row--emph">
                <dt>本次还款</dt>
                <dd>
                  <span class="ex-num">{{ formatPrice(amountNum) }}</span> USDT
                </dd>
              </div>
              <div class="fsm__dl-row">
                <dt>预计结果</dt>
                <dd>{{ willClosePosition ? '结清仓位并退回质押' : '部分还款，仓位保留' }}</dd>
              </div>
            </dl>
            <p class="fsm__confirm-warn">演示环境即时扣减负债；正式环境以链上/账务确认时间为准。</p>
          </div>
          <div class="fsm__foot">
            <div class="fsm__foot-row">
              <button type="button" class="fsm__btn fsm__btn--ghost" @click="backToForm">返回修改</button>
              <button type="button" class="fsm__btn fsm__btn--primary" @click="submitRepay">确认还款</button>
            </div>
          </div>
        </template>

        <template v-else>
          <div class="fsm__body fsm__body--success">
            <StakingFlowResultBlock
              :ribbon="resultRibbon"
              :title="resultTitle"
              :description="resultDesc"
              :tone="resultTone"
            />
          </div>
          <div class="fsm__foot">
            <div class="fsm__foot-row fsm__foot-row--single">
              <button type="button" class="fsm__btn fsm__btn--primary fsm__btn--block" @click="close">完成</button>
            </div>
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
  gap: $space-2;
}

.fsm__body--tight {
  padding-top: $space-3;
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

.fsm__confirm-warn {
  margin: 0;
  font-size: 10px;
  line-height: 1.5;
  color: $color-text-tertiary;
}

.fsm__meta {
  margin: 0;
  font-size: $font-size-xs;
  color: $color-text-tertiary;
}

.fsm__meta--bold {
  color: $color-text-primary;
  font-weight: $font-weight-semibold;
}

.fsm__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: $space-2;
}

.fsm__lab {
  font-size: $font-size-xs;
  color: $color-text-tertiary;
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

.fsm__linkbtn {
  align-self: flex-start;
  margin: 0;
  padding: 0;
  border: none;
  background: none;
  font-size: $font-size-xs;
  color: $color-brand;
  cursor: pointer;
  text-decoration: underline;
}

.fsm__hint {
  margin: 0;
  font-size: 11px;
  color: $color-text-secondary;
  line-height: 1.45;
}

.fsm__check {
  display: flex;
  gap: $space-2;
  font-size: 11px;
  line-height: 1.45;
  color: $color-text-secondary;
  cursor: pointer;
  align-items: flex-start;
  margin-top: $space-2;
}

.fsm__cb {
  margin-top: 2px;
  accent-color: $color-brand;
  flex-shrink: 0;
}

.fsm__foot {
  display: flex;
  justify-content: flex-end;
  padding: $space-3 $space-4;
  border-top: 1px solid $color-border;
}

.fsm__foot-row {
  display: flex;
  justify-content: flex-end;
  gap: $space-2;
  width: 100%;
}

.fsm__foot-row--single {
  justify-content: stretch;
}

.fsm__btn {
  padding: $space-2 $space-4;
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  border-radius: $radius-sm;
  cursor: pointer;
  border: 1px solid transparent;
}

.fsm__btn--block {
  width: 100%;
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

.ex-num {
  font-family: $font-family-mono;
}
</style>
