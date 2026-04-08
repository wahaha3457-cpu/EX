<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import type { StakingCollateralAsset } from '@/types/financeCredit'
import { formatPrice } from '@/utils/format/number'
import { useStakingBorrowStore } from '@/stores/stakingBorrow'
import { useAppStore } from '@/stores/app'
import { storeToRefs } from 'pinia'
import StakingFlowResultBlock from '@/components/business/finance/StakingFlowResultBlock.vue'

const props = defineProps<{
  modelValue: boolean
  collateral: StakingCollateralAsset | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
}>()

const app = useAppStore()
const store = useStakingBorrowStore()
const { positions } = storeToRefs(store)

const phase = ref<'form' | 'confirm' | 'success'>('form')
const hadPositionBeforeConfirm = ref(false)
const orderRefDemo = ref('')

const colStr = ref('')
const borrowStr = ref('')
const agreed = ref(false)

/** 打开弹窗时填入一组可通过校验的演示数量，避免主按钮长期置灰（仍须勾选协议）。 */
function fillSmartDefaults() {
  const c = props.collateral
  if (!c || c.walletBalance <= 0) {
    colStr.value = ''
    borrowStr.value = ''
    return
  }
  let col = Math.min(0.05, c.walletBalance)
  let mb = store.maxBorrowFor(c.symbol, col)
  let guard = 0
  while (mb < 1 && col < c.walletBalance - 1e-12 && guard < 24) {
    col = Math.min(c.walletBalance, col * 1.6 + 0.001)
    mb = store.maxBorrowFor(c.symbol, col)
    guard++
  }
  if (mb < 0.01) {
    col = c.walletBalance
    mb = store.maxBorrowFor(c.symbol, col)
  }
  if (mb < 0.01) {
    colStr.value = ''
    borrowStr.value = ''
    return
  }
  const roundedCol = Math.round(col * 1e6) / 1e6
  colStr.value = String(roundedCol)
  const borrow = Math.min(2000, Math.max(1, Math.floor(mb * 0.35 * 100) / 100))
  borrowStr.value = String(borrow)
}

watch(
  () => props.modelValue,
  (v) => {
    if (v) {
      phase.value = 'form'
      agreed.value = false
      orderRefDemo.value = ''
      void nextTick(() => {
        fillSmartDefaults()
      })
    }
  },
)

function parseNum(s: string) {
  const n = parseFloat(s.replace(/,/g, ''))
  return Number.isFinite(n) ? n : 0
}

const colNum = computed(() => parseNum(colStr.value))
const borrowNum = computed(() => parseNum(borrowStr.value))

const pos = computed(() => {
  const c = props.collateral
  if (!c) return undefined
  return positions.value.find((p) => p.collateralAsset === c.symbol)
})

const px = computed(() => (props.collateral ? store.px(props.collateral.symbol) : 0))

const newCollateralTotal = computed(() => (pos.value?.collateralAmount ?? 0) + colNum.value)

const newDebtTotal = computed(
  () => (pos.value?.borrowedUsdt ?? 0) + borrowNum.value + (pos.value?.accruedInterestUsdt ?? 0),
)

const ltvAfter = computed(() => {
  if (!props.collateral) return 0
  const usd = newCollateralTotal.value * px.value
  return usd > 0 ? Number(((newDebtTotal.value / usd) * 100).toFixed(2)) : 0
})

const maxMoreBorrow = computed(() => {
  if (!props.collateral) return 0
  return Math.max(0, store.maxBorrowFor(props.collateral.symbol, colNum.value))
})

/** 与助力贷同口径：0.002 表示 0.002%/日 */
const dailyBorrowRatePct = computed(() => props.collateral?.dailyBorrowRatePct ?? 0.002)

/** 本次新增借入本金对应的预计日利息（USDT） */
const borrowDailyInterestPreview = computed(() => borrowNum.value * (dailyBorrowRatePct.value / 100))

const addCollateralUsd = computed(() => colNum.value * px.value)

const orderTypeLabel = computed(() =>
  hadPositionBeforeConfirm.value ? '追加借入（已有同币种仓位）' : '新开仓',
)

const canSubmit = computed(() => {
  if (!props.collateral || !agreed.value) return false
  const c = props.collateral
  if (colNum.value <= 0 || borrowNum.value <= 0) return false
  if (colNum.value > c.walletBalance + 1e-12) return false
  if (borrowNum.value > maxMoreBorrow.value + 0.01) return false
  if (ltvAfter.value > c.maxInitialLtvPct + 0.06) return false
  return true
})

const submitHint = computed(() => {
  const c = props.collateral
  if (!c) return ''
  if (!agreed.value) return '请勾选下方协议后继续'
  if (colNum.value <= 0 || borrowNum.value <= 0) return '请填写追加质押数量与借入金额（均须大于 0）'
  if (colNum.value > c.walletBalance + 1e-12) return '追加质押超过钱包可用'
  if (maxMoreBorrow.value < 0.01) return '当前可再借约 0：请增加「追加质押」数量或等待负债下降后再试'
  if (borrowNum.value > maxMoreBorrow.value + 0.01) return '借入超过可借上限，可调低借入或提高追加质押'
  if (ltvAfter.value > c.maxInitialLtvPct + 0.06) return '借后 LTV 超过初始上限，请减少借入或增加质押'
  return ''
})

function close() {
  emit('update:modelValue', false)
}

function onOverlayClick() {
  if (phase.value === 'success') return
  close()
}

function goToConfirm() {
  if (!props.collateral || !canSubmit.value) return
  hadPositionBeforeConfirm.value = !!pos.value
  phase.value = 'confirm'
}

function backToForm() {
  phase.value = 'form'
}

function submitOrder() {
  if (!props.collateral || phase.value !== 'confirm') return
  const sym = props.collateral.symbol
  orderRefDemo.value = `STK-${Date.now().toString(36).toUpperCase()}`
  const ok = store.borrow(sym, colNum.value, borrowNum.value)
  if (!ok) return
  app.pushToast(
    'success',
    hadPositionBeforeConfirm.value
      ? `追加借入已提交 · +${borrowNum.value} USDT（演示）`
      : `开仓借入已提交 · ${borrowNum.value} USDT（演示）`,
  )
  phase.value = 'success'
}

function fillMaxBorrow() {
  borrowStr.value = String(Math.floor(maxMoreBorrow.value * 100) / 100)
}

const resultRibbon = computed(() => (hadPositionBeforeConfirm.value ? '追加借入' : '新开仓'))
const resultTitle = computed(() =>
  hadPositionBeforeConfirm.value ? '借入订单已生效' : '开仓订单已生效',
)
const resultDesc = computed(() => {
  const c = props.collateral
  if (!c) return ''
  const refId = orderRefDemo.value || '—'
  return hadPositionBeforeConfirm.value
    ? `演示订单号 ${refId}。当前 ${c.symbol} 仓位已增加质押 ${formatPrice(colNum.value)} ${c.symbol}，并新增负债 ${formatPrice(borrowNum.value)} USDT。可在「我的仓位」与「历史记录」中查看。`
    : `演示订单号 ${refId}。已质押 ${formatPrice(colNum.value)} ${c.symbol} 并借入 ${formatPrice(borrowNum.value)} USDT。请在借款期内关注 LTV 与补仓线。`
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="modelValue && collateral"
      class="fsm-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="质押借币"
      @click.self="onOverlayClick"
    >
      <div class="fsm">
        <div class="fsm__head">
          <span class="fsm__title">{{
            phase === 'success' ? '借币结果' : `借入 USDT · 质押 ${collateral.symbol}`
          }}</span>
          <button type="button" class="fsm__x" aria-label="关闭" @click="close">×</button>
        </div>

        <template v-if="phase === 'form'">
          <div class="fsm__body">
            <p class="fsm__rule">
              参考指数价 {{ collateral.symbol }} ≈ <span class="ex-num">{{ formatPrice(px) }}</span> USDT（演示）· 初始
              LTV 上限
              {{ collateral.maxInitialLtvPct }}% · 补仓/清算线 {{ collateral.liquidationLtvPct }}%
            </p>
            <div class="fsm__rate" role="status">
              <span class="fsm__rate-k">借款日利率</span>
              <span class="fsm__rate-v">{{ dailyBorrowRatePct }}% / 日</span>
              <span class="fsm__rate-hint">按未偿本金计息（演示）</span>
            </div>
            <p v-if="pos" class="fsm__meta">
              当前仓位：质押 <span class="ex-num">{{ pos.collateralAmount }}</span> {{ collateral.symbol }} · 负债
              <span class="ex-num">{{ formatPrice(pos.borrowedUsdt + pos.accruedInterestUsdt) }}</span> USDT · LTV
              {{ pos.currentLtvPct }}%
            </p>
            <label class="fsm__field">
              <span class="fsm__lab">追加质押数量 ({{ collateral.symbol }})</span>
              <input v-model="colStr" type="text" inputmode="decimal" class="fsm__input" placeholder="从钱包划入质押" />
            </label>
            <p class="fsm__avail">钱包可用 <span class="ex-num">{{ collateral.walletBalance }}</span> {{ collateral.symbol }}</p>
            <label class="fsm__field">
              <span class="fsm__lab">借入 (USDT)</span>
              <input v-model="borrowStr" type="text" inputmode="decimal" class="fsm__input" placeholder="借入金额" />
            </label>
            <p class="fsm__row">
              <button type="button" class="fsm__linkbtn" @click="fillMaxBorrow">使用可借上限（粗算）</button>
            </p>
            <p class="fsm__meta">
              可再借约 <span class="ex-num">{{ formatPrice(maxMoreBorrow) }}</span> USDT（随质押数量变化）
            </p>
            <p v-if="borrowNum > 0" class="fsm__meta fsm__meta--interest">
              本次借入预计日利息 ≈ <span class="ex-num">{{ formatPrice(borrowDailyInterestPreview) }}</span> USDT
            </p>
            <p class="fsm__meta fsm__meta--ltv" :class="{ 'fsm__meta--warn': ltvAfter >= collateral.liquidationLtvPct - 5 }">
              测算 LTV（借后） {{ ltvAfter }}%
            </p>
            <label class="fsm__check">
              <input v-model="agreed" type="checkbox" class="fsm__cb" />
              <span>我已阅读并同意《质押借币服务协议》与风险提示，知晓价格波动可能导致补仓或清算（演示）。</span>
            </label>
          </div>
          <div class="fsm__foot">
            <p v-if="submitHint" class="fsm__hint">{{ submitHint }}</p>
            <div class="fsm__foot-row">
              <button type="button" class="fsm__btn fsm__btn--ghost" @click="close">取消</button>
              <button
                type="button"
                class="fsm__btn fsm__btn--primary"
                :disabled="!canSubmit"
                :title="submitHint || undefined"
                @click="goToConfirm"
              >
                核对订单
              </button>
            </div>
          </div>
        </template>

        <template v-else-if="phase === 'confirm'">
          <div class="fsm__body fsm__body--narrow-top">
            <p class="fsm__confirm-lead">请核对订单信息，确认无误后提交。提交后演示仓位与流水将立即更新。</p>
            <dl class="fsm__dl">
              <div class="fsm__dl-row">
                <dt>订单类型</dt>
                <dd>{{ orderTypeLabel }}</dd>
              </div>
              <div class="fsm__dl-row">
                <dt>质押资产</dt>
                <dd>{{ collateral.symbol }}</dd>
              </div>
              <div class="fsm__dl-row">
                <dt>本次质押数量</dt>
                <dd>
                  <span class="ex-num">{{ formatPrice(colNum) }}</span> {{ collateral.symbol }}
                </dd>
              </div>
              <div class="fsm__dl-row">
                <dt>质押物估值（本次）</dt>
                <dd>≈ <span class="ex-num">{{ formatPrice(addCollateralUsd) }}</span> USDT</dd>
              </div>
              <div class="fsm__dl-row">
                <dt>借入</dt>
                <dd>
                  <span class="ex-num">{{ formatPrice(borrowNum) }}</span> USDT
                </dd>
              </div>
              <div class="fsm__dl-row">
                <dt>借后总质押</dt>
                <dd>
                  <span class="ex-num">{{ formatPrice(newCollateralTotal) }}</span> {{ collateral.symbol }}
                </dd>
              </div>
              <div class="fsm__dl-row">
                <dt>借后总负债（本+息）</dt>
                <dd>
                  <span class="ex-num">{{ formatPrice(newDebtTotal) }}</span> USDT
                </dd>
              </div>
              <div class="fsm__dl-row fsm__dl-row--emph">
                <dt>借后 LTV（测算）</dt>
                <dd>
                  <span class="ex-num">{{ ltvAfter }}</span> %
                </dd>
              </div>
              <div class="fsm__dl-row">
                <dt>借款日利率</dt>
                <dd>{{ dailyBorrowRatePct }}% / 日</dd>
              </div>
              <div class="fsm__dl-row">
                <dt>新增本金日息（预计）</dt>
                <dd>≈ <span class="ex-num">{{ formatPrice(borrowDailyInterestPreview) }}</span> USDT / 日</dd>
              </div>
            </dl>
            <p class="fsm__confirm-warn">
              指数价与 LTV 为演示测算；正式环境以标记价格、风控与对账结果为准。
            </p>
          </div>
          <div class="fsm__foot">
            <div class="fsm__foot-row">
              <button type="button" class="fsm__btn fsm__btn--ghost" @click="backToForm">返回修改</button>
              <button type="button" class="fsm__btn fsm__btn--primary" @click="submitOrder">确认提交</button>
            </div>
          </div>
        </template>

        <template v-else>
          <div class="fsm__body fsm__body--success">
            <StakingFlowResultBlock
              :ribbon="resultRibbon"
              :title="resultTitle"
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

.fsm__body--narrow-top {
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

.fsm__rate {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 6px 10px;
  margin: 0;
  padding: $space-2 $space-3;
  border-radius: $radius-sm;
  border: 1px solid rgba(240, 185, 11, 0.28);
  background: rgba(240, 185, 11, 0.06);
}

.fsm__rate-k {
  font-size: 11px;
  font-weight: $font-weight-semibold;
  color: $color-text-secondary;
}

.fsm__rate-v {
  font-size: $font-size-md;
  font-weight: $font-weight-bold;
  font-family: $font-family-mono;
  color: $color-brand;
}

.fsm__rate-hint {
  font-size: 10px;
  color: $color-text-tertiary;
  width: 100%;
}

.fsm__meta--interest {
  color: $color-text-secondary;
  font-weight: $font-weight-semibold;
}

.fsm__meta {
  margin: 0;
  font-size: $font-size-xs;
  color: $color-text-tertiary;
}

.fsm__meta--ltv {
  font-weight: $font-weight-semibold;
  color: $color-text-primary;
}

.fsm__meta--warn {
  color: $color-fall;
}

.fsm__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 4px;
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

.fsm__avail {
  margin: 0;
  font-size: $font-size-xs;
  color: $color-text-tertiary;
}

.fsm__row {
  margin: 0;
}

.fsm__linkbtn {
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
  flex-direction: column;
  align-items: stretch;
  gap: $space-2;
  padding: $space-3 $space-4;
  border-top: 1px solid $color-border;
}

.fsm__foot-row {
  display: flex;
  justify-content: flex-end;
  gap: $space-2;
}

.fsm__foot-row--single {
  justify-content: stretch;
}

.fsm__hint {
  margin: 0;
  font-size: 11px;
  line-height: 1.4;
  color: $color-text-tertiary;
  text-align: right;
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
  justify-content: center;
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
