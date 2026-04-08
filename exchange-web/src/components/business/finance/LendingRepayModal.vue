<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { LendingLoan } from '@/types/financeCredit'
import { formatPrice } from '@/utils/format/number'

const props = defineProps<{
  modelValue: boolean
  loan: LendingLoan | null
  planLabel: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'confirm', payload: { loanId: string; amount: number }): void
}>()

const amountStr = ref('')
const agreed = ref(false)

watch(
  () => props.modelValue,
  (v) => {
    if (v) {
      amountStr.value = ''
      agreed.value = false
      if (props.loan) {
        const t = props.loan.principal + props.loan.accruedInterest
        amountStr.value = t > 0 ? String(Math.round(t * 100) / 100) : ''
      }
    }
  },
)

const amountNum = computed(() => {
  const n = parseFloat(amountStr.value.replace(/,/g, ''))
  return Number.isFinite(n) ? n : 0
})

const totalDue = computed(() => {
  if (!props.loan) return 0
  return props.loan.principal + props.loan.accruedInterest
})

function close() {
  emit('update:modelValue', false)
}

function setFull() {
  if (!props.loan) return
  amountStr.value = String(Math.round(totalDue.value * 100) / 100)
}

function confirm() {
  if (!props.loan) return
  if (!agreed.value) return
  emit('confirm', { loanId: props.loan.id, amount: amountNum.value })
  emit('update:modelValue', false)
}

const canSubmit = computed(() => {
  if (!props.loan || !agreed.value) return false
  return amountNum.value > 0 && amountNum.value <= totalDue.value + 1e-6
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="modelValue && loan"
      class="fsm-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="助力贷还款"
      @click.self="close"
    >
      <div class="fsm">
        <div class="fsm__head">
          <span class="fsm__title">还款 · {{ planLabel }}</span>
          <button type="button" class="fsm__x" aria-label="关闭" @click="close">×</button>
        </div>
        <div class="fsm__body">
          <p class="fsm__meta">
            待还本金 <span class="ex-num">{{ formatPrice(loan.principal) }}</span> USDT · 应计利息
            <span class="ex-num">{{ formatPrice(loan.accruedInterest) }}</span> USDT
          </p>
          <p class="fsm__meta fsm__meta--bold">
            合计应还 <span class="ex-num">{{ formatPrice(totalDue) }}</span> USDT
          </p>
          <label class="fsm__field">
            <span class="fsm__lab">还款金额 (USDT)</span>
            <input v-model="amountStr" type="text" inputmode="decimal" class="fsm__input" placeholder="输入还款金额" />
          </label>
          <button type="button" class="fsm__linkbtn" @click="setFull">填入全部应还</button>
          <p class="fsm__hint">优先冲抵利息，剩余冲抵本金；全部结清后借据关闭（演示）。</p>
          <label class="fsm__check">
            <input v-model="agreed" type="checkbox" class="fsm__cb" />
            <span>我确认还款金额无误，并同意按《助力贷服务协议》从账户扣款（演示）。</span>
          </label>
        </div>
        <div class="fsm__foot">
          <button type="button" class="fsm__btn fsm__btn--ghost" @click="close">取消</button>
          <button type="button" class="fsm__btn fsm__btn--primary" :disabled="!canSubmit" @click="confirm">确认还款</button>
        </div>
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
  gap: $space-2;
  padding: $space-3 $space-4;
  border-top: 1px solid $color-border;
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

.ex-num {
  font-family: $font-family-mono;
}
</style>
