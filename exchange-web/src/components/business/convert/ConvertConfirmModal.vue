<script setup lang="ts">
import { ref, watch } from 'vue'
import { formatPrice } from '@/utils/format/number'
import { useConvertFlashStore } from '@/stores/convertFlash'

const props = defineProps<{
  modelValue: boolean
  from: string
  to: string
  /** 当前报价获得的数量（与核对单冻结数量一致） */
  amountTo: number
  /** 已按币种精度格式化的支付数量文案 */
  amountFromFmt: string
  /** 已按币种精度格式化的获得数量文案 */
  amountToFmt: string
  feePct: number
  rateLine: string
  usdtEq: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
}>()

type Phase = 'review' | 'confirm' | 'success'

const store = useConvertFlashStore()
const phase = ref<Phase>('review')
const agreed = ref(false)
const submitting = ref(false)

const snapFromFmt = ref('')
const snapToFmt = ref('')
const snapRateLine = ref('')
const snapUsdtEq = ref(0)
const snapAmountTo = ref(0)
const orderRef = ref('')

function genOrderRef() {
  const t = Date.now().toString(36).toUpperCase()
  const r = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `CF-${t}-${r}`
}

function resetFlow() {
  phase.value = 'review'
  agreed.value = false
  submitting.value = false
}

watch(
  () => props.modelValue,
  (v) => {
    if (v) resetFlow()
  },
)

function close() {
  if (phase.value === 'success') return
  emit('update:modelValue', false)
}

function finish() {
  emit('update:modelValue', false)
}

function goConfirm() {
  if (!agreed.value) return
  snapFromFmt.value = props.amountFromFmt
  snapToFmt.value = props.amountToFmt
  snapRateLine.value = props.rateLine
  snapUsdtEq.value = props.usdtEq
  snapAmountTo.value = props.amountTo
  orderRef.value = genOrderRef()
  phase.value = 'confirm'
}

function backToReview() {
  phase.value = 'review'
}

async function submitConvert() {
  if (submitting.value) return
  submitting.value = true
  try {
    const ok = store.executeConvert({
      confirmedAmountTo: snapAmountTo.value,
      orderRef: orderRef.value,
      snapshotUsdtEq: snapUsdtEq.value,
    })
    if (ok) phase.value = 'success'
  } finally {
    submitting.value = false
  }
}

function onOverlayClick() {
  if (phase.value === 'success') return
  close()
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="ccm-overlay"
      role="dialog"
      aria-modal="true"
      :aria-label="phase === 'success' ? '兑换成功' : phase === 'confirm' ? '核对订单' : '确认闪兑'"
      @click.self="onOverlayClick"
    >
      <div class="ccm" :class="{ 'ccm--success': phase === 'success' }">
        <div class="ccm__head">
          <span class="ccm__title">{{
            phase === 'success' ? '兑换成功' : phase === 'confirm' ? '核对订单' : '确认闪兑'
          }}</span>
          <button type="button" class="ccm__x" aria-label="关闭" @click="phase === 'success' ? finish() : close()">
            ×
          </button>
        </div>

        <!-- 初审 -->
        <div v-if="phase === 'review'" class="ccm__body">
          <div class="ccm__pair">
            <div class="ccm__side">
              <span class="ccm__lab">支付</span>
              <span class="ccm__val ex-num">{{ amountFromFmt }}</span>
              <span class="ccm__unit">{{ from }}</span>
            </div>
            <span class="ccm__arrow" aria-hidden="true">→</span>
            <div class="ccm__side">
              <span class="ccm__lab">获得（预估）</span>
              <span class="ccm__val ex-num ccm__val--gain">{{ amountToFmt }}</span>
              <span class="ccm__unit">{{ to }}</span>
            </div>
          </div>
          <p class="ccm__rate">{{ rateLine }}</p>
          <p class="ccm__fee">手续费 {{ (feePct * 100).toFixed(2) }}%（已从输出中扣除，演示）</p>
          <p class="ccm__hint">下一步将展示订单明细与演示单号，请仔细核对后再确认兑换。</p>
          <label class="ccm__check">
            <input v-model="agreed" type="checkbox" class="ccm__cb" />
            <span>我已阅读并同意《闪兑服务协议》，知晓参考汇率随市场波动，实际成交以确认结果为准（演示）。</span>
          </label>
        </div>

        <!-- 核对单 -->
        <div v-else-if="phase === 'confirm'" class="ccm__body ccm__body--detail">
          <dl class="ccm__dl">
            <div class="ccm__dl-row">
              <dt>订单类型</dt>
              <dd>闪兑（演示）</dd>
            </div>
            <div class="ccm__dl-row">
              <dt>演示单号</dt>
              <dd class="ex-num ccm__ref">{{ orderRef }}</dd>
            </div>
            <div class="ccm__dl-row">
              <dt>支付</dt>
              <dd>
                <span class="ex-num">{{ snapFromFmt }}</span> {{ from }}
              </dd>
            </div>
            <div class="ccm__dl-row">
              <dt>获得</dt>
              <dd>
                <span class="ex-num ccm__gain">{{ snapToFmt }}</span> {{ to }}
              </dd>
            </div>
            <div class="ccm__dl-row">
              <dt>参考汇率</dt>
              <dd>{{ snapRateLine }}</dd>
            </div>
            <div class="ccm__dl-row">
              <dt>手续费</dt>
              <dd>{{ (feePct * 100).toFixed(2) }}%（已从获得中扣除）</dd>
            </div>
            <div class="ccm__dl-row">
              <dt>折合</dt>
              <dd class="ex-num">≈ {{ formatPrice(snapUsdtEq) }} USDT</dd>
            </div>
            <div class="ccm__dl-row ccm__dl-row--note">
              <dt>说明</dt>
              <dd>将扣减 {{ from }} 现货可用余额，并将 {{ to }} 即时入账（演示数据）。</dd>
            </div>
          </dl>
        </div>

        <!-- 成功 -->
        <div v-else class="ccm__body ccm__body--done">
          <div class="ccm__ok" aria-hidden="true">
            <svg class="ccm__ok-ring" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="28" class="ccm__ok-circle" />
            </svg>
            <span class="ccm__ok-check">✓</span>
          </div>
          <p class="ccm__done-lead">兑换已完成</p>
          <div class="ccm__swap-anim" aria-hidden="true">
            <span class="ccm__chip ccm__chip--from">{{ from }}</span>
            <span class="ccm__flow">
              <span class="ccm__dot" />
              <span class="ccm__dot" />
              <span class="ccm__dot" />
            </span>
            <span class="ccm__chip ccm__chip--to">{{ to }}</span>
          </div>
          <div class="ccm__done-amt">
            <span class="ex-num">{{ snapFromFmt }}</span> {{ from }}
            <span class="ccm__done-arrow">→</span>
            <span class="ex-num ccm__gain">{{ snapToFmt }}</span> {{ to }}
          </div>
          <p class="ccm__done-ref">
            演示单号 <span class="ex-num">{{ orderRef }}</span>
          </p>
          <p class="ccm__done-foot">{{ to }} 已计入现货余额（演示）。可在「最近记录」或订单中心查看。</p>
        </div>

        <div v-if="phase === 'review'" class="ccm__foot">
          <button type="button" class="ccm__btn ccm__btn--ghost" @click="close">取消</button>
          <button type="button" class="ccm__btn ccm__btn--primary" :disabled="!agreed" @click="goConfirm">核对订单</button>
        </div>
        <div v-else-if="phase === 'confirm'" class="ccm__foot">
          <button type="button" class="ccm__btn ccm__btn--ghost" :disabled="submitting" @click="backToReview">上一步</button>
          <button type="button" class="ccm__btn ccm__btn--primary" :disabled="submitting" @click="submitConvert">
            {{ submitting ? '兑换中…' : '确认兑换' }}
          </button>
        </div>
        <div v-else class="ccm__foot ccm__foot--single">
          <button type="button" class="ccm__btn ccm__btn--primary ccm__btn--block" @click="finish">完成</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.ccm-overlay {
  position: fixed;
  inset: 0;
  z-index: 540;
  background: var(--ex-overlay-backdrop);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $space-4;
}

.ccm {
  width: 100%;
  max-width: 400px;
  border-radius: $radius-md;
  border: 1px solid $color-border;
  background: var(--ex-modal-surface);
  box-shadow: var(--ex-modal-shadow-elevated);
}

.ccm--success {
  border-color: rgba(14, 203, 129, 0.35);
}

.ccm__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $space-3 $space-4;
  border-bottom: 1px solid $color-border;
}

.ccm__title {
  font-weight: $font-weight-bold;
  font-size: $font-size-md;
  color: $color-text-primary;
}

.ccm__x {
  border: none;
  background: transparent;
  color: $color-text-tertiary;
  font-size: 22px;
  cursor: pointer;
  line-height: 1;
}

.ccm__body {
  padding: $space-4;
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.ccm__body--detail {
  gap: 0;
}

.ccm__pair {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-2;
}

.ccm__side {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: $space-3;
  border-radius: $radius-sm;
  background: var(--ex-surface-inset);
  border: 1px solid var(--ex-border-subtle);
}

.ccm__lab {
  font-size: 10px;
  color: $color-text-tertiary;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.ccm__val {
  font-size: $font-size-lg;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.ccm__val--gain {
  color: $color-rise;
}

.ccm__unit {
  font-size: $font-size-xs;
  color: $color-brand;
  font-weight: $font-weight-semibold;
}

.ccm__arrow {
  color: $color-text-tertiary;
  font-size: 18px;
  flex-shrink: 0;
}

.ccm__rate,
.ccm__fee,
.ccm__hint {
  margin: 0;
  font-size: $font-size-xs;
  color: $color-text-secondary;
  line-height: 1.5;
}

.ccm__hint {
  color: $color-text-tertiary;
}

.ccm__check {
  display: flex;
  gap: $space-2;
  font-size: 11px;
  line-height: 1.45;
  color: $color-text-secondary;
  cursor: pointer;
  align-items: flex-start;
}

.ccm__cb {
  margin-top: 2px;
  accent-color: $color-brand;
  flex-shrink: 0;
}

.ccm__dl {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.ccm__dl-row {
  display: grid;
  grid-template-columns: 88px 1fr;
  gap: $space-2;
  padding: 10px 0;
  border-bottom: 1px solid var(--ex-border-subtle);
  font-size: $font-size-xs;
  align-items: start;

  &:last-child {
    border-bottom: none;
  }

  dt {
    margin: 0;
    color: $color-text-tertiary;
    font-weight: $font-weight-semibold;
  }

  dd {
    margin: 0;
    color: $color-text-secondary;
    text-align: right;
    line-height: 1.5;
  }
}

.ccm__dl-row--note dd {
  text-align: right;
  font-size: 11px;
  color: $color-text-tertiary;
}

.ccm__ref {
  font-size: 11px;
  word-break: break-all;
}

.ccm__gain {
  color: $color-rise;
  font-weight: $font-weight-bold;
}

.ccm__body--done {
  align-items: center;
  text-align: center;
  padding-top: $space-2;
}

.ccm__ok {
  position: relative;
  width: 64px;
  height: 64px;
  margin-bottom: $space-2;
}

.ccm__ok-ring {
  width: 64px;
  height: 64px;
  transform: rotate(-90deg);
  animation: ccm-ring-in 0.55s ease-out both;
}

.ccm__ok-circle {
  fill: none;
  stroke: #0ecb81;
  stroke-width: 3;
  stroke-dasharray: 176;
  stroke-dashoffset: 176;
  animation: ccm-ring-draw 0.7s ease-out 0.1s forwards;
}

.ccm__ok-check {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: $font-weight-bold;
  color: #0ecb81;
  animation: ccm-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 0.35s both;
}

.ccm__done-lead {
  margin: 0 0 $space-3;
  font-size: $font-size-md;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.ccm__swap-anim {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $space-2;
  margin-bottom: $space-3;
}

.ccm__chip {
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: $font-weight-bold;
  font-family: $font-family-mono;
  border: 1px solid var(--ex-border-subtle);
}

.ccm__chip--from {
  background: rgba(246, 70, 93, 0.12);
  color: $color-fall;
}

.ccm__chip--to {
  background: rgba(14, 203, 129, 0.12);
  color: $color-rise;
}

.ccm__flow {
  display: flex;
  gap: 4px;
  align-items: center;
}

.ccm__dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: $color-brand;
  opacity: 0.35;
  animation: ccm-flow 1s ease-in-out infinite;

  &:nth-child(2) {
    animation-delay: 0.15s;
  }

  &:nth-child(3) {
    animation-delay: 0.3s;
  }
}

.ccm__done-amt {
  font-size: $font-size-sm;
  color: $color-text-secondary;
  margin: 0 0 $space-2;
  line-height: 1.6;
}

.ccm__done-arrow {
  margin: 0 6px;
  color: $color-text-tertiary;
}

.ccm__done-ref {
  margin: 0 0 $space-2;
  font-size: $font-size-xs;
  color: $color-text-secondary;
}

.ccm__done-foot {
  margin: 0;
  font-size: 11px;
  color: $color-text-tertiary;
  line-height: 1.55;
  max-width: 320px;
}

.ccm__foot {
  display: flex;
  justify-content: flex-end;
  gap: $space-2;
  padding: $space-3 $space-4;
  border-top: 1px solid $color-border;
}

.ccm__foot--single {
  justify-content: stretch;
}

.ccm__btn {
  padding: $space-2 $space-4;
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  border-radius: $radius-sm;
  cursor: pointer;
  border: 1px solid transparent;
}

.ccm__btn--ghost {
  background: transparent;
  border-color: $color-border;
  color: $color-text-secondary;
}

.ccm__btn--primary {
  background: var(--ex-brand);
  color: var(--ex-on-brand);
}

.ccm__btn--primary:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.ccm__btn--block {
  width: 100%;
}

.ex-num {
  font-family: $font-family-mono;
}

@keyframes ccm-ring-in {
  from {
    opacity: 0;
    transform: rotate(-90deg) scale(0.85);
  }
  to {
    opacity: 1;
    transform: rotate(-90deg) scale(1);
  }
}

@keyframes ccm-ring-draw {
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes ccm-pop {
  from {
    opacity: 0;
    transform: scale(0.5);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes ccm-flow {
  0%,
  100% {
    opacity: 0.25;
    transform: scale(0.85);
  }
  50% {
    opacity: 1;
    transform: scale(1.1);
  }
}
</style>
