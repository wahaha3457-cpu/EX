<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { StakingLoanPosition, StakingCollateralAsset } from '@/types/financeCredit'
import { formatPrice } from '@/utils/format/number'
import { useStakingBorrowStore } from '@/stores/stakingBorrow'
import { useAppStore } from '@/stores/app'
import StakingFlowResultBlock from '@/components/business/finance/StakingFlowResultBlock.vue'

const props = defineProps<{
  modelValue: boolean
  position: StakingLoanPosition | null
  collateralRow: StakingCollateralAsset | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
}>()

const app = useAppStore()
const store = useStakingBorrowStore()

const phase = ref<'form' | 'confirm' | 'success'>('form')
const orderRefDemo = ref('')
/** 成功页展示用，避免提交后依赖响应式重算导致口径错乱 */
const resultLtvBefore = ref(0)
const resultLtvAfter = ref(0)

const amountStr = ref('')
const agreed = ref(false)

watch(
  () => props.modelValue,
  (v) => {
    if (v) {
      phase.value = 'form'
      orderRefDemo.value = ''
      resultLtvBefore.value = 0
      resultLtvAfter.value = 0
      amountStr.value = ''
      agreed.value = false
    }
  },
)

const amountNum = computed(() => {
  const n = parseFloat(amountStr.value.replace(/,/g, ''))
  return Number.isFinite(n) ? n : 0
})

const maxAdd = computed(() => props.collateralRow?.walletBalance ?? 0)

const px = computed(() => {
  if (!props.position) return 0
  return store.px(props.position.collateralAsset)
})

const debtUsdt = computed(() => {
  if (!props.position) return 0
  return props.position.borrowedUsdt + props.position.accruedInterestUsdt
})

const collateralAfter = computed(() => (props.position?.collateralAmount ?? 0) + amountNum.value)

const ltvAfter = computed(() => {
  const usd = collateralAfter.value * px.value
  if (usd <= 0 || !props.position) return 0
  return Number(((debtUsdt.value / usd) * 100).toFixed(2))
})

function close() {
  emit('update:modelValue', false)
}

function onOverlayClick() {
  if (phase.value === 'success') return
  close()
}

function fillMax() {
  amountStr.value = String(maxAdd.value)
}

const canSubmit = computed(() => {
  if (!props.position || !props.collateralRow || !agreed.value) return false
  return amountNum.value > 0 && amountNum.value <= maxAdd.value + 1e-12
})

function goToConfirm() {
  if (!canSubmit.value) return
  phase.value = 'confirm'
}

function backToForm() {
  phase.value = 'form'
}

function submitAdd() {
  if (!props.position || phase.value !== 'confirm') return
  orderRefDemo.value = `STK-AC-${Date.now().toString(36).toUpperCase()}`
  resultLtvBefore.value = props.position.currentLtvPct
  resultLtvAfter.value = ltvAfter.value
  const ok = store.addCollateral(props.position.id, amountNum.value)
  if (!ok) return
  app.pushToast('success', `已追加 ${formatPrice(amountNum.value)} ${props.position.collateralAsset} 质押（演示）`)
  phase.value = 'success'
}

const resultDesc = computed(() => {
  const p = props.position
  const refId = orderRefDemo.value || '—'
  if (!p) return ''
  return `演示订单号 ${refId}。已向 ${p.collateralAsset} 仓位追加质押 ${formatPrice(amountNum.value)} ${p.collateralAsset}，测算 LTV 约由 ${resultLtvBefore.value}% 降至 ${resultLtvAfter.value}%（演示口径）。可在「我的仓位」查看更新。`
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="modelValue && position && collateralRow"
      class="fsm-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="追加质押"
      @click.self="onOverlayClick"
    >
      <div class="fsm">
        <div class="fsm__head">
          <span class="fsm__title">{{ phase === 'success' ? '追加结果' : `追加质押 · ${position.collateralAsset}` }}</span>
          <button type="button" class="fsm__x" aria-label="关闭" @click="close">×</button>
        </div>

        <template v-if="phase === 'form'">
          <div class="fsm__body">
            <p class="fsm__meta">
              当前质押 <span class="ex-num">{{ position.collateralAmount }}</span> {{ position.collateralAsset }} · LTV
              {{ position.currentLtvPct }}%
            </p>
            <p class="fsm__avail">钱包可用 <span class="ex-num">{{ collateralRow.walletBalance }}</span> {{ position.collateralAsset }}</p>
            <label class="fsm__field">
              <span class="fsm__lab">追加数量 ({{ position.collateralAsset }})</span>
              <input v-model="amountStr" type="text" inputmode="decimal" class="fsm__input" placeholder="从钱包划入" />
            </label>
            <button type="button" class="fsm__linkbtn" @click="fillMax">全部可用</button>
            <label class="fsm__check">
              <input v-model="agreed" type="checkbox" class="fsm__cb" />
              <span>我确认将资产划入质押账户以降低 LTV，并知悉解押规则以页面展示为准（演示）。</span>
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
            <p class="fsm__confirm-lead">请确认追加数量；提交后质押与 LTV 将按演示逻辑立即重算。</p>
            <dl class="fsm__dl">
              <div class="fsm__dl-row">
                <dt>质押资产</dt>
                <dd>{{ position.collateralAsset }}</dd>
              </div>
              <div class="fsm__dl-row">
                <dt>当前质押</dt>
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
                <dt>当前负债（本+息）</dt>
                <dd>
                  <span class="ex-num">{{ formatPrice(debtUsdt) }}</span> USDT
                </dd>
              </div>
              <div class="fsm__dl-row fsm__dl-row--emph">
                <dt>本次追加</dt>
                <dd>
                  <span class="ex-num">{{ formatPrice(amountNum) }}</span> {{ position.collateralAsset }}
                </dd>
              </div>
              <div class="fsm__dl-row">
                <dt>追加后总质押</dt>
                <dd>
                  <span class="ex-num">{{ formatPrice(collateralAfter) }}</span> {{ position.collateralAsset }}
                </dd>
              </div>
              <div class="fsm__dl-row fsm__dl-row--emph">
                <dt>测算 LTV（追加后）</dt>
                <dd>
                  <span class="ex-num">{{ ltvAfter }}</span> %
                </dd>
              </div>
            </dl>
            <p class="fsm__confirm-warn">参考指数价 {{ position.collateralAsset }} ≈ {{ formatPrice(px) }} USDT（演示）。</p>
          </div>
          <div class="fsm__foot">
            <div class="fsm__foot-row">
              <button type="button" class="fsm__btn fsm__btn--ghost" @click="backToForm">返回修改</button>
              <button type="button" class="fsm__btn fsm__btn--primary" @click="submitAdd">确认追加</button>
            </div>
          </div>
        </template>

        <template v-else>
          <div class="fsm__body fsm__body--success">
            <StakingFlowResultBlock
              ribbon="追加质押"
              title="追加订单已生效"
              :description="resultDesc"
              tone="rise"
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

.fsm__meta,
.fsm__avail {
  margin: 0;
  font-size: $font-size-xs;
  color: $color-text-tertiary;
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
