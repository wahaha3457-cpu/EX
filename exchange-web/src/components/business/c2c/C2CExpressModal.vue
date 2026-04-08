<script setup lang="ts">
/**
 * C2C 快捷买卖（Express）：匹配当前法币下最优广告，流程独立于列表，复用 store.placeOrder。
 */
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useC2cMarketStore } from '@/stores/c2cMarket'
import { useAppStore } from '@/stores/app'
import { formatPrice } from '@/utils/format/number'
import type { C2cAd, C2cOrder, C2cPayMethod } from '@/types/c2c'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{
  'update:modelValue': [v: boolean]
  placed: [order: C2cOrder]
}>()

const store = useC2cMarketStore()
const app = useAppStore()
const { fiatFilter, cryptoOptions } = storeToRefs(store)

const step = ref<'form' | 'confirm'>('form')
const expressSide = ref<'buy' | 'sell'>('buy')
const expressCrypto = ref('')
const expressPay = ref<C2cPayMethod | ''>('')
const fiatStr = ref('')
const matchedAd = ref<C2cAd | null>(null)
const agreed = ref(false)

watch(
  () => props.modelValue,
  async (open) => {
    if (!open) return
    step.value = 'form'
    expressSide.value = store.mainTab
    expressPay.value = ''
    fiatStr.value = ''
    matchedAd.value = null
    agreed.value = false
    await store.bootstrapAds()
    const opts = cryptoOptions.value
    expressCrypto.value = opts.includes(expressCrypto.value) ? expressCrypto.value : opts[0] ?? 'USDT'
  },
)

watch(cryptoOptions, (opts) => {
  if (opts.length && !opts.includes(expressCrypto.value)) {
    expressCrypto.value = opts[0]!
  }
})

const fiatNum = computed(() => {
  const n = Number.parseFloat(fiatStr.value.replace(/,/g, ''))
  return Number.isFinite(n) ? n : 0
})

const cryptoPreview = computed(() => {
  const a = matchedAd.value
  if (!a || fiatNum.value <= 0) return 0
  return Math.round((fiatNum.value / a.price) * 1e8) / 1e8
})

const formError = computed(() => {
  if (fiatNum.value <= 0) return '请输入法币金额'
  const ad = store.pickBestExpressAd({
    userSide: expressSide.value,
    crypto: expressCrypto.value,
    pay: expressPay.value,
  })
  if (!ad) return '暂无匹配广告，请尝试其他币种、支付方式或回到市场浏览'
  if (fiatNum.value < ad.minFiat) return `单笔不能低于 ${formatPrice(ad.minFiat)} ${ad.fiat}`
  if (fiatNum.value > ad.maxFiat) return `单笔不能超过 ${formatPrice(ad.maxFiat)} ${ad.fiat}`
  const est = Math.round((fiatNum.value / ad.price) * 1e8) / 1e8
  if (est > ad.availableCrypto + 1e-8) {
    return '超过当前最优报价的可交易数量，请降低金额或更换条件'
  }
  return ''
})

const confirmError = computed(() => {
  const a = matchedAd.value
  if (!a || fiatNum.value <= 0) return '请返回上一步完善信息'
  if (fiatNum.value < a.minFiat) return `不能低于 ${formatPrice(a.minFiat)} ${a.fiat}`
  if (fiatNum.value > a.maxFiat) return `不能超过 ${formatPrice(a.maxFiat)} ${a.fiat}`
  const est = Math.round((fiatNum.value / a.price) * 1e8) / 1e8
  if (est > a.availableCrypto + 1e-8) return '超过对方可交易数量'
  return ''
})

const canGoConfirm = computed(() => !formError.value)
const canSubmit = computed(() => !confirmError.value && agreed.value && !!matchedAd.value)

function close() {
  emit('update:modelValue', false)
}

function payLabel(m: C2cPayMethod) {
  if (m === 'bank') return '银行卡'
  if (m === 'alipay') return '支付宝'
  if (m === 'wechat') return '微信'
  return m
}

function goConfirm() {
  const err = formError.value
  if (err) {
    app.pushToast('warning', err)
    return
  }
  const ad = store.pickBestExpressAd({
    userSide: expressSide.value,
    crypto: expressCrypto.value,
    pay: expressPay.value,
  })
  if (!ad) {
    app.pushToast('warning', '暂无匹配广告')
    return
  }
  matchedAd.value = ad
  step.value = 'confirm'
  agreed.value = false
}

function backToForm() {
  step.value = 'form'
  matchedAd.value = null
  agreed.value = false
}

function setMin() {
  const a = matchedAd.value
  if (a) fiatStr.value = String(a.minFiat)
}

function setMax() {
  const a = matchedAd.value
  if (!a) return
  const capByAvail = a.availableCrypto * a.price
  const max = Math.min(a.maxFiat, capByAvail)
  fiatStr.value = String(Math.floor(max * 100) / 100)
}

async function submitOrder() {
  const ad = matchedAd.value
  if (!ad || !canSubmit.value) return
  const o = await store.placeOrder(ad, expressSide.value, Math.round(fiatNum.value * 100) / 100)
  if (o) {
    emit('placed', o)
    emit('update:modelValue', false)
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="exm-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="快捷买卖"
      @click.self="close"
    >
      <div class="exm">
        <header class="exm__head">
          <div>
            <h2 class="exm__title">快捷买卖</h2>
            <p class="exm__sub">智能匹配当前 <span class="exm__fiat">{{ fiatFilter }}</span> 市场最优报价（演示）</p>
          </div>
          <button type="button" class="exm__x" aria-label="关闭" @click="close">×</button>
        </header>

        <!-- 步骤指示 -->
        <div class="exm__steps" aria-hidden="true">
          <span class="exm__st" :class="{ 'exm__st--on': step === 'form' }">1 填写意向</span>
          <span class="exm__st-div" />
          <span class="exm__st" :class="{ 'exm__st--on': step === 'confirm' }">2 确认下单</span>
        </div>

        <div class="exm__body">
          <template v-if="step === 'form'">
            <div class="exm__seg" role="group" aria-label="方向">
              <button
                type="button"
                class="exm__seg-i"
                :class="{ 'exm__seg-i--on': expressSide === 'buy' }"
                @click="expressSide = 'buy'"
              >
                快捷买币
              </button>
              <button
                type="button"
                class="exm__seg-i"
                :class="{ 'exm__seg-i--on': expressSide === 'sell' }"
                @click="expressSide = 'sell'"
              >
                快捷卖币
              </button>
            </div>

            <label class="exm__lab">数字币</label>
            <div class="exm__chips">
              <button
                v-for="c in cryptoOptions"
                :key="c"
                type="button"
                class="exm__chip"
                :class="{ 'exm__chip--on': expressCrypto === c }"
                @click="expressCrypto = c"
              >
                {{ c }}
              </button>
            </div>

            <label class="exm__lab">支付方式（可选）</label>
            <div class="exm__chips">
              <button
                type="button"
                class="exm__chip"
                :class="{ 'exm__chip--on': expressPay === '' }"
                @click="expressPay = ''"
              >
                不限
              </button>
              <button
                type="button"
                class="exm__chip"
                :class="{ 'exm__chip--on': expressPay === 'bank' }"
                @click="expressPay = 'bank'"
              >
                银行卡
              </button>
              <button
                type="button"
                class="exm__chip"
                :class="{ 'exm__chip--on': expressPay === 'alipay' }"
                @click="expressPay = 'alipay'"
              >
                支付宝
              </button>
              <button
                type="button"
                class="exm__chip"
                :class="{ 'exm__chip--on': expressPay === 'wechat' }"
                @click="expressPay = 'wechat'"
              >
                微信
              </button>
            </div>

            <div class="exm__field">
              <div class="exm__row">
                <span class="exm__k">{{ expressSide === 'buy' ? '用' : '换得' }}法币金额</span>
                <span class="exm__unit">{{ fiatFilter }}</span>
              </div>
              <input
                v-model="fiatStr"
                type="text"
                inputmode="decimal"
                class="exm__input"
                placeholder="0.00"
                aria-label="法币金额"
              />
            </div>

            <p v-if="formError" class="exm__hint exm__hint--err">{{ formError }}</p>
            <p v-else class="exm__hint">将为您匹配{{ expressSide === 'buy' ? '单价最低、成交率优' : '单价最高' }}的可交易广告。</p>
          </template>

          <template v-else>
            <div v-if="matchedAd" class="exm__card">
              <p class="exm__match">已匹配商家</p>
              <p class="exm__mn">{{ matchedAd.merchant.displayName }}</p>
              <p class="exm__rate">
                单价 <span class="ex-num">{{ formatPrice(matchedAd.price) }}</span> {{ matchedAd.fiat }} /
                {{ matchedAd.crypto }} · 成交
                <span class="ex-num">{{ formatPrice(matchedAd.merchant.completionRate * 100) }}%</span>
              </p>
              <div class="exm__field">
                <div class="exm__row">
                  <span class="exm__k">法币金额</span>
                  <span class="exm__unit">{{ matchedAd.fiat }}</span>
                </div>
                <div class="exm__input-row">
                  <input
                    v-model="fiatStr"
                    type="text"
                    inputmode="decimal"
                    class="exm__input"
                    aria-label="法币金额"
                  />
                  <div class="exm__quick">
                    <button type="button" class="exm__qbtn" @click="setMin">最小</button>
                    <button type="button" class="exm__qbtn" @click="setMax">最大</button>
                  </div>
                </div>
              </div>
              <div class="exm__est">
                <span>{{ expressSide === 'buy' ? '预计获得' : '预计出售' }}</span>
                <span class="exm__est-v ex-num">{{ cryptoPreview > 0 ? formatPrice(cryptoPreview) : '—' }} {{ matchedAd.crypto }}</span>
              </div>
              <div class="exm__methods">
                <span class="exm__mlab">{{ expressSide === 'buy' ? '向对方付款方式' : '对方付款方式' }}</span>
                <div class="exm__pay-row">
                  <span v-for="m in matchedAd.methods" :key="m" class="exm__pay">{{ payLabel(m) }}</span>
                </div>
              </div>
              <p v-if="expressSide === 'sell'" class="exm__freeze">
                卖出将在现货账户冻结约
                <span class="ex-num">{{ cryptoPreview > 0 ? formatPrice(cryptoPreview) : '—' }}</span>
                {{ matchedAd.crypto }}（演示说明与列表下单一致）。
              </p>
            </div>
            <p v-if="confirmError" class="exm__hint exm__hint--err">{{ confirmError }}</p>
            <label class="exm__check">
              <input v-model="agreed" type="checkbox" class="exm__cb" />
              <span>本人已了解 C2C 为线下法币划转，平台不代扣款；请在时限内完成付款并点击「我已付款」。</span>
            </label>
          </template>
        </div>

        <footer class="exm__foot">
          <template v-if="step === 'form'">
            <button type="button" class="exm__btn exm__btn--ghost" @click="close">取消</button>
            <button type="button" class="exm__btn exm__btn--pri" :disabled="!canGoConfirm" @click="goConfirm">
              匹配并预览
            </button>
          </template>
          <template v-else>
            <button type="button" class="exm__btn exm__btn--ghost" @click="backToForm">上一步</button>
            <button type="button" class="exm__btn exm__btn--pri" :disabled="!canSubmit" @click="submitOrder">
              确认下单
            </button>
          </template>
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.exm-overlay {
  position: fixed;
  inset: 0;
  z-index: 560;
  background: rgba(5, 8, 14, 0.72);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $space-4;
}

.exm {
  width: 100%;
  max-width: 440px;
  border-radius: 14px;
  border: 1px solid rgba(240, 185, 11, 0.28);
  background: linear-gradient(165deg, var(--ex-card-surface) 0%, rgba(18, 22, 32, 0.98) 100%);
  box-shadow:
    0 24px 64px rgba(0, 0, 0, 0.55),
    0 0 0 1px rgba(255, 255, 255, 0.04) inset;
}

.exm__head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: $space-3;
  padding: $space-4 $space-4 $space-2;
  border-bottom: 1px solid $color-border;
}

.exm__title {
  margin: 0;
  font-size: $font-size-lg;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
  letter-spacing: -0.02em;
}

.exm__sub {
  margin: 6px 0 0;
  font-size: $font-size-xs;
  color: $color-text-tertiary;
  line-height: 1.45;
}

.exm__fiat {
  color: $color-brand;
  font-weight: $font-weight-bold;
}

.exm__x {
  border: none;
  background: transparent;
  color: $color-text-tertiary;
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
  padding: 4px;
}

.exm__steps {
  display: flex;
  align-items: center;
  gap: $space-2;
  padding: $space-3 $space-4 0;
}

.exm__st {
  font-size: 11px;
  font-weight: $font-weight-bold;
  color: $color-text-tertiary;
}

.exm__st--on {
  color: $color-brand;
}

.exm__st-div {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, $color-border, transparent);
  max-width: 48px;
}

.exm__body {
  padding: $space-4;
  max-height: min(68vh, 520px);
  overflow-y: auto;
}

.exm__seg {
  display: flex;
  gap: 8px;
  padding: 4px;
  margin-bottom: $space-4;
  border-radius: $radius-md;
  background: var(--ex-surface-inset);
  border: 1px solid $color-border;
}

.exm__seg-i {
  flex: 1;
  border: none;
  border-radius: $radius-sm;
  padding: 10px 12px;
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  color: $color-text-secondary;
  background: transparent;
  cursor: pointer;
}

.exm__seg-i--on {
  background: linear-gradient(135deg, rgba(240, 185, 11, 0.22), rgba(0, 200, 150, 0.12));
  color: $color-brand;
  box-shadow: 0 0 20px rgba(240, 185, 11, 0.08);
}

.exm__lab {
  display: block;
  font-size: 11px;
  font-weight: $font-weight-semibold;
  color: $color-text-tertiary;
  margin-bottom: 8px;
}

.exm__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: $space-3;
}

.exm__chip {
  border: 1px solid $color-border;
  background: var(--ex-fill-ghost);
  color: $color-text-secondary;
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  padding: 6px 14px;
  border-radius: $radius-sm;
  cursor: pointer;
}

.exm__chip--on {
  border-color: rgba(240, 185, 11, 0.5);
  background: rgba(240, 185, 11, 0.12);
  color: $color-brand;
}

.exm__field {
  margin-bottom: $space-2;
}

.exm__row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.exm__k {
  font-size: $font-size-xs;
  color: $color-text-tertiary;
}

.exm__unit {
  font-size: $font-size-xs;
  color: $color-brand;
  font-weight: $font-weight-bold;
}

.exm__input {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid var(--ex-border-subtle);
  border-radius: $radius-md;
  padding: $space-3;
  background: var(--ex-surface-inset-strong);
  color: $color-text-primary;
  font-size: 22px;
  font-weight: $font-weight-bold;
  font-family: $font-family-mono;

  &:focus {
    outline: none;
    border-color: rgba(240, 185, 11, 0.45);
  }
}

.exm__input-row {
  display: flex;
  align-items: center;
  gap: $space-2;
}

.exm__input-row .exm__input {
  flex: 1;
  min-width: 0;
}

.exm__quick {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.exm__qbtn {
  padding: 8px 12px;
  font-size: 11px;
  font-weight: $font-weight-bold;
  border: none;
  border-radius: $radius-sm;
  background: rgba(240, 185, 11, 0.15);
  color: $color-brand;
  cursor: pointer;
}

.exm__hint {
  margin: $space-2 0 0;
  font-size: 11px;
  color: $color-text-tertiary;
  line-height: 1.45;
}

.exm__hint--err {
  color: $color-fall;
}

.exm__card {
  padding: $space-3;
  border-radius: $radius-md;
  border: 1px solid rgba(240, 185, 11, 0.2);
  background: rgba(240, 185, 11, 0.06);
  margin-bottom: $space-3;
}

.exm__match {
  margin: 0 0 4px;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: $color-text-tertiary;
}

.exm__mn {
  margin: 0 0 6px;
  font-size: $font-size-md;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.exm__rate {
  margin: 0 0 $space-3;
  font-size: $font-size-xs;
  color: $color-text-secondary;
}

.exm__est {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $space-2 $space-3;
  border-radius: $radius-sm;
  background: rgba(14, 203, 129, 0.08);
  border: 1px solid rgba(14, 203, 129, 0.22);
  margin: $space-3 0;
  font-size: $font-size-xs;
  color: $color-text-secondary;
}

.exm__est-v {
  font-size: $font-size-md;
  font-weight: $font-weight-bold;
  color: $color-rise;
}

.exm__methods {
  margin-bottom: $space-2;
}

.exm__mlab {
  display: block;
  font-size: 11px;
  color: $color-text-tertiary;
  margin-bottom: 6px;
}

.exm__pay-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.exm__pay {
  font-size: 11px;
  padding: 4px 10px;
  border-radius: $radius-sm;
  background: var(--ex-fill-hover-subtle);
  color: $color-text-secondary;
}

.exm__freeze {
  margin: 0;
  font-size: 11px;
  line-height: 1.5;
  color: $color-text-secondary;
  padding: $space-2;
  border-radius: $radius-sm;
  border: 1px solid rgba(48, 132, 252, 0.25);
  background: rgba(48, 132, 252, 0.06);
}

.exm__check {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  font-size: 11px;
  color: $color-text-secondary;
  line-height: 1.45;
  cursor: pointer;
  margin-top: $space-2;
}

.exm__cb {
  margin-top: 2px;
  flex-shrink: 0;
}

.exm__foot {
  display: flex;
  justify-content: flex-end;
  gap: $space-2;
  padding: $space-3 $space-4 $space-4;
  border-top: 1px solid $color-border;
}

.exm__btn {
  padding: 10px 22px;
  border-radius: $radius-sm;
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  cursor: pointer;
  border: none;
}

.exm__btn--ghost {
  background: transparent;
  color: $color-text-secondary;
  border: 1px solid $color-border;
}

.exm__btn--pri {
  background: linear-gradient(135deg, #f0d12a 0%, #f0b90b 50%, #c99400 100%);
  color: #0a0e17;
  box-shadow: 0 8px 24px rgba(240, 185, 11, 0.25);
}

.exm__btn--pri:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  box-shadow: none;
}
</style>
