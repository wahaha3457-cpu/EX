<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { C2cAd } from '@/types/c2c'
import { formatPrice } from '@/utils/format/number'

const props = defineProps<{
  modelValue: boolean
  ad: C2cAd | null
  /** 用户要买币 / 卖币 */
  userSide: 'buy' | 'sell'
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'confirm', fiatAmount: number): void
}>()

const fiatStr = ref('')
const agreed = ref(false)

watch(
  () => props.modelValue,
  (v) => {
    if (v) {
      fiatStr.value = ''
      agreed.value = false
    }
  },
)

const ad = computed(() => props.ad)

const fiatNum = computed(() => {
  const n = Number.parseFloat(fiatStr.value.replace(/,/g, ''))
  return Number.isFinite(n) ? n : 0
})

const cryptoOut = computed(() => {
  const a = ad.value
  if (!a || fiatNum.value <= 0) return 0
  return Math.round((fiatNum.value / a.price) * 1e8) / 1e8
})

const limitHint = computed(() => {
  const a = ad.value
  if (!a) return ''
  return `限额 ${formatPrice(a.minFiat)} – ${formatPrice(a.maxFiat)} ${a.fiat}`
})

const validationError = computed(() => {
  const a = ad.value
  if (!a || fiatNum.value <= 0) return '请输入法币金额'
  if (fiatNum.value < a.minFiat) return `不能低于 ${formatPrice(a.minFiat)} ${a.fiat}`
  if (fiatNum.value > a.maxFiat) return `不能超过 ${formatPrice(a.maxFiat)} ${a.fiat}`
  if (cryptoOut.value > a.availableCrypto + 1e-8) return '超过对方可交易数量'
  return ''
})

const canSubmit = computed(() => !validationError.value && agreed.value)

function close() {
  emit('update:modelValue', false)
}

function setMin() {
  const a = ad.value
  if (a) fiatStr.value = String(a.minFiat)
}

function setMax() {
  const a = ad.value
  if (!a) return
  const capByAvail = a.availableCrypto * a.price
  const max = Math.min(a.maxFiat, capByAvail)
  fiatStr.value = String(Math.floor(max * 100) / 100)
}

function confirm() {
  if (!canSubmit.value || !ad.value) return
  emit('confirm', Math.round(fiatNum.value * 100) / 100)
  emit('update:modelValue', false)
}

function payLabel(m: string) {
  if (m === 'bank') return '银行卡'
  if (m === 'alipay') return '支付宝'
  if (m === 'wechat') return '微信'
  return m
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="modelValue && ad"
      class="c2c-tm-overlay"
      role="dialog"
      aria-modal="true"
      :aria-label="userSide === 'buy' ? '买入下单' : '卖出下单'"
      @click.self="close"
    >
      <div class="c2c-tm">
        <div class="c2c-tm__head">
          <span class="c2c-tm__title">{{ userSide === 'buy' ? '按金额购买' : '按金额出售' }}</span>
          <button type="button" class="c2c-tm__x" aria-label="关闭" @click="close">×</button>
        </div>
        <div class="c2c-tm__body">
          <div class="c2c-tm__merchant">
            <span class="c2c-tm__mn">{{ ad.merchant.displayName }}</span>
            <span class="c2c-tm__rate ex-num">{{ formatPrice(ad.merchant.completionRate * 100) }}%</span>
            <span class="c2c-tm__sub">成交率 · {{ ad.merchant.trades30d }} 单/30日</span>
          </div>
          <p class="c2c-tm__price">
            单价 <span class="ex-num">{{ formatPrice(ad.price) }}</span> {{ ad.fiat }} / {{ ad.crypto }}
          </p>
          <p class="c2c-tm__limit">{{ limitHint }}</p>

          <div class="c2c-tm__field">
            <div class="c2c-tm__row">
              <span class="c2c-tm__lab">{{ userSide === 'buy' ? '将支付' : '将收到（法币）' }}</span>
              <span class="c2c-tm__fiat">{{ ad.fiat }}</span>
            </div>
            <div class="c2c-tm__input-wrap">
              <input
                v-model="fiatStr"
                type="text"
                inputmode="decimal"
                class="c2c-tm__input"
                placeholder="0"
                aria-label="法币金额"
              />
              <div class="c2c-tm__quick">
                <button type="button" class="c2c-tm__qbtn" @click="setMin">最小</button>
                <button type="button" class="c2c-tm__qbtn" @click="setMax">最大</button>
              </div>
            </div>
          </div>

          <div class="c2c-tm__est">
            <span class="c2c-tm__est-k">{{ userSide === 'buy' ? '预计获得' : '预计出售' }}</span>
            <span class="c2c-tm__est-v ex-num"
              >{{ cryptoOut > 0 ? formatPrice(cryptoOut) : '—' }} {{ ad.crypto }}</span
            >
          </div>

          <div class="c2c-tm__methods">
            <span class="c2c-tm__mlab">{{ userSide === 'buy' ? '付款方式' : '买家将使用的付款方式' }}</span>
            <div class="c2c-tm__chips">
              <span v-for="m in ad.methods" :key="m" class="c2c-tm__chip">{{ payLabel(m) }}</span>
            </div>
          </div>

          <p v-if="userSide === 'sell'" class="c2c-tm__freeze">
            下单成功后，将在<strong>现货账户</strong>冻结约
            <span class="ex-num">{{ cryptoOut > 0 ? formatPrice(cryptoOut) : '—' }}</span>
            {{ ad.crypto }}，直至订单成交或您主动取消；请确保可用余额充足。
          </p>

          <p v-if="validationError" class="c2c-tm__err">{{ validationError }}</p>

          <label class="c2c-tm__check">
            <input v-model="agreed" type="checkbox" class="c2c-tm__cb" />
            <span
              >本人已了解 C2C 交易为线下法币划转，平台不代扣款；请在时限内完成付款并点击「我已付款」。异常可申诉（演示）。</span
            >
          </label>
        </div>
        <div class="c2c-tm__foot">
          <button type="button" class="c2c-tm__btn c2c-tm__btn--ghost" @click="close">取消</button>
          <button type="button" class="c2c-tm__btn c2c-tm__btn--primary" :disabled="!canSubmit" @click="confirm">
            下单
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.c2c-tm-overlay {
  position: fixed;
  inset: 0;
  z-index: 540;
  background: var(--ex-overlay-backdrop);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $space-4;
}

.c2c-tm {
  width: 100%;
  max-width: 420px;
  border-radius: $radius-md;
  border: 1px solid $color-border;
  background: var(--ex-card-surface);
  box-shadow: var(--ex-modal-shadow-elevated);
}

.c2c-tm__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $space-3 $space-4;
  border-bottom: 1px solid $color-border;
}

.c2c-tm__title {
  font-size: $font-size-md;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.c2c-tm__x {
  border: none;
  background: transparent;
  color: $color-text-tertiary;
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
  padding: 4px;
}

.c2c-tm__body {
  padding: $space-4;
  max-height: min(72vh, 560px);
  overflow-y: auto;
}

.c2c-tm__merchant {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: $space-2;
  margin-bottom: $space-2;
}

.c2c-tm__mn {
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.c2c-tm__rate {
  font-size: $font-size-xs;
  color: $color-rise;
}

.c2c-tm__sub {
  width: 100%;
  font-size: 11px;
  color: $color-text-tertiary;
}

.c2c-tm__price {
  margin: 0 0 4px;
  font-size: $font-size-sm;
  color: $color-text-secondary;
}

.c2c-tm__limit {
  margin: 0 0 $space-3;
  font-size: 11px;
  color: $color-text-tertiary;
}

.c2c-tm__field {
  margin-bottom: $space-3;
}

.c2c-tm__row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.c2c-tm__lab {
  font-size: $font-size-xs;
  color: $color-text-tertiary;
  font-weight: $font-weight-semibold;
}

.c2c-tm__fiat {
  font-size: $font-size-xs;
  color: $color-brand;
  font-weight: $font-weight-bold;
}

.c2c-tm__input-wrap {
  display: flex;
  align-items: center;
  gap: $space-2;
  padding: $space-3;
  border-radius: $radius-md;
  background: var(--ex-surface-inset-strong);
  border: 1px solid var(--ex-border-subtle);
}

.c2c-tm__input {
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  color: $color-text-primary;
  font-size: 20px;
  font-weight: $font-weight-bold;
  font-family: $font-family-mono;

  &:focus {
    outline: none;
  }

  &::placeholder {
    color: $color-text-tertiary;
  }
}

.c2c-tm__quick {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.c2c-tm__qbtn {
  padding: 4px 10px;
  font-size: 11px;
  font-weight: $font-weight-bold;
  border: none;
  border-radius: $radius-sm;
  background: rgba(240, 185, 11, 0.15);
  color: $color-brand;
  cursor: pointer;
}

.c2c-tm__est {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $space-3;
  border-radius: $radius-sm;
  background: rgba(14, 203, 129, 0.08);
  border: 1px solid rgba(14, 203, 129, 0.2);
  margin-bottom: $space-3;
}

.c2c-tm__est-k {
  font-size: $font-size-xs;
  color: $color-text-secondary;
}

.c2c-tm__est-v {
  font-size: $font-size-md;
  font-weight: $font-weight-bold;
  color: $color-rise;
}

.c2c-tm__freeze {
  margin: 0 0 $space-2;
  padding: $space-2 $space-3;
  font-size: 11px;
  line-height: 1.5;
  color: $color-text-secondary;
  border-radius: $radius-sm;
  border: 1px solid rgba(48, 132, 252, 0.25);
  background: rgba(48, 132, 252, 0.08);
}

.c2c-tm__methods {
  margin-bottom: $space-2;
}

.c2c-tm__mlab {
  display: block;
  font-size: $font-size-xs;
  color: $color-text-tertiary;
  margin-bottom: 8px;
}

.c2c-tm__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.c2c-tm__chip {
  font-size: 11px;
  padding: 4px 10px;
  border-radius: $radius-sm;
  background: var(--ex-fill-hover-subtle);
  border: 1px solid $color-border;
  color: $color-text-secondary;
}

.c2c-tm__err {
  margin: 0 0 $space-2;
  font-size: $font-size-xs;
  color: $color-fall;
}

.c2c-tm__check {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  font-size: 11px;
  color: $color-text-secondary;
  line-height: 1.45;
  cursor: pointer;
}

.c2c-tm__cb {
  margin-top: 2px;
  flex-shrink: 0;
}

.c2c-tm__foot {
  display: flex;
  justify-content: flex-end;
  gap: $space-2;
  padding: $space-3 $space-4;
  border-top: 1px solid $color-border;
}

.c2c-tm__btn {
  padding: 10px 20px;
  border-radius: $radius-sm;
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  cursor: pointer;
  border: none;
}

.c2c-tm__btn--ghost {
  background: transparent;
  color: $color-text-secondary;
  border: 1px solid $color-border;
}

.c2c-tm__btn--primary {
  background: $color-brand;
  color: var(--ex-on-brand);
}

.c2c-tm__btn--primary:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
</style>
