<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { storeToRefs } from 'pinia'
import { RouteNames } from '@/constants/routeNames'
import { useConvertFlashStore } from '@/stores/convertFlash'
import { useAuthStore } from '@/stores/auth'
import { CONVERT_FEE_PCT, MIN_CONVERT_USDT_EQ } from '@/api/convert/flashQuote'
import { formatPrice } from '@/utils/format/number'
import ConvertAssetPickerModal from '@/components/business/convert/ConvertAssetPickerModal.vue'
import ConvertConfirmModal from '@/components/business/convert/ConvertConfirmModal.vue'

const store = useConvertFlashStore()
const {
  fromAsset,
  toAsset,
  amountFromStr,
  assetsMeta,
  balances,
  quote,
  amountFromNum,
  availableFrom,
  validationError,
  canPreview,
  history,
  usdtEq,
} = storeToRefs(store)

const auth = useAuthStore()

const pickerOpen = ref(false)
const pickerTitle = ref('')
const pickerRole = ref<'from' | 'to'>('from')
const confirmOpen = ref(false)

const ttlSec = 10
const quoteCountdown = ref(ttlSec)
let countTimer: ReturnType<typeof setInterval> | null = null

function startTimers() {
  stopTimers()
  quoteCountdown.value = ttlSec
  countTimer = setInterval(() => {
    quoteCountdown.value -= 1
    if (quoteCountdown.value <= 0) {
      store.randomizeQuoteMultiplier()
      quoteCountdown.value = ttlSec
    }
  }, 1000)
}

function stopTimers() {
  if (countTimer) clearInterval(countTimer)
  countTimer = null
}

function manualRefreshQuote() {
  store.randomizeQuoteMultiplier()
  quoteCountdown.value = ttlSec
}

onMounted(() => {
  store.bootstrap()
  startTimers()
})

onUnmounted(() => {
  stopTimers()
})

watch([fromAsset, toAsset, amountFromStr], () => {
  quoteCountdown.value = ttlSec
})

function fmtQty(symbol: string, n: number) {
  if (!Number.isFinite(n)) return '—'
  const dp = store.metaOf(symbol)?.qtyDp ?? 6
  if (symbol === 'USDT') return formatPrice(n)
  const s = n.toFixed(dp)
  return s.replace(/\.?0+$/, '') || '0'
}

function openPicker(role: 'from' | 'to') {
  pickerRole.value = role
  pickerTitle.value = role === 'from' ? '选择支付币种' : '选择获得币种'
  pickerOpen.value = true
}

function onPickAsset(sym: string) {
  if (pickerRole.value === 'from') {
    fromAsset.value = sym
  } else {
    toAsset.value = sym
  }
}

const rateLine = computed(() => {
  const q = quote.value
  if (!q || amountFromNum.value <= 0) return '输入数量后显示参考汇率'
  return `1 ${fromAsset.value} ≈ ${fmtQty(toAsset.value, q.rateFromTo)} ${toAsset.value}`
})

const receiveLine = computed(() => {
  const q = quote.value
  if (!q || amountFromNum.value <= 0) return '0'
  return fmtQty(toAsset.value, q.amountTo)
})

function openConfirm() {
  if (!canPreview.value || !quote.value) return
  confirmOpen.value = true
}

const confirmAmountFromFmt = computed(() => fmtQty(fromAsset.value, amountFromNum.value))
const confirmAmountToFmt = computed(() => {
  const q = quote.value
  if (!q || amountFromNum.value <= 0) return '0'
  return fmtQty(toAsset.value, q.amountTo)
})
</script>

<template>
  <div class="cvp">
    <header class="cvp__hero">
      <div>
        <h1 class="cvp__title">闪兑</h1>
        <p class="cvp__sub">0 挂单 · 一键将一种资产换成另一种，参考价随行情波动（演示）</p>
      </div>
      <div class="cvp__hero-links">
        <RouterLink :to="{ name: RouteNames.SpotTrade, params: { symbol: 'BTC_USDT' } }" class="cvp__link">现货交易</RouterLink>
        <RouterLink :to="{ name: RouteNames.Assets }" class="cvp__link">资产中心</RouterLink>
      </div>
    </header>

    <p v-if="!auth.isAuthenticated" class="cvp__auth-hint">
      未登录可浏览汇率与试算；
      <RouterLink :to="{ name: RouteNames.Login }" class="cvp__a">登录</RouterLink>
      后闪兑将写入演示现货余额与记录。
    </p>

    <div class="cvp__layout">
      <section class="cvp-card" aria-label="闪兑表单">
        <div class="cvp-card__inner">
          <!-- 支付 -->
          <div class="cvp-io">
            <div class="cvp-io__row">
              <span class="cvp-io__lab">支付</span>
              <span class="cvp-io__avail">可用 <span class="ex-num">{{ fmtQty(fromAsset, availableFrom) }}</span> {{ fromAsset }}</span>
            </div>
            <div class="cvp-io__box">
              <input
                v-model="amountFromStr"
                type="text"
                inputmode="decimal"
                class="cvp-io__input"
                placeholder="0"
                aria-label="支付数量"
              />
              <button type="button" class="cvp-io__max" @click="store.setMaxFrom()">最大</button>
              <button type="button" class="cvp-io__asset" @click="openPicker('from')">
                <span class="cvp-io__sym">{{ fromAsset }}</span>
                <span class="cvp-io__chev" aria-hidden="true">▾</span>
              </button>
            </div>
          </div>

          <div class="cvp-swap-wrap">
            <button type="button" class="cvp-swap" aria-label="交换支付与获得币种" @click="store.swapAssets()">
              <svg class="cvp-swap__svg" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M7 10l-3 3 3 3v-2h8v-2H7v-2zm10-2l3-3-3-3v2H9v2h8v2z"
                />
              </svg>
            </button>
          </div>

          <!-- 获得 -->
          <div class="cvp-io">
            <div class="cvp-io__row">
              <span class="cvp-io__lab">获得（预估）</span>
            </div>
            <div class="cvp-io__box cvp-io__box--ro">
              <span class="cvp-io__out ex-num">{{ receiveLine }}</span>
              <button type="button" class="cvp-io__asset" @click="openPicker('to')">
                <span class="cvp-io__sym">{{ toAsset }}</span>
                <span class="cvp-io__chev" aria-hidden="true">▾</span>
              </button>
            </div>
          </div>

          <div class="cvp-meta">
            <div class="cvp-meta__row">
              <span class="cvp-meta__k">参考汇率</span>
              <span class="cvp-meta__v">{{ rateLine }}</span>
            </div>
            <div class="cvp-meta__row">
              <span class="cvp-meta__k">手续费</span>
              <span class="cvp-meta__v">{{ (CONVERT_FEE_PCT * 100).toFixed(2) }}%（已从获得中扣除）</span>
            </div>
            <div class="cvp-meta__row">
              <span class="cvp-meta__k">折合</span>
              <span class="cvp-meta__v ex-num">≈ {{ formatPrice(usdtEq) }} USDT</span>
            </div>
            <div class="cvp-meta__row cvp-meta__row--quote">
              <span class="cvp-meta__k">报价刷新</span>
              <span class="cvp-meta__v">
                <span class="cvp-meta__cd">{{ quoteCountdown }}s</span>
                <button type="button" class="cvp-meta__rf" @click="manualRefreshQuote">刷新</button>
              </span>
            </div>
          </div>

          <p v-if="validationError" class="cvp__err">{{ validationError }}</p>

          <button type="button" class="cvp__cta" :disabled="!canPreview" @click="openConfirm">闪兑</button>

          <p class="cvp__hint">
            最低 {{ MIN_CONVERT_USDT_EQ }} USDT 等值 · 演示余额独立于资产中心接口；生产环境请对接统一账户与聚合报价。
          </p>
        </div>
      </section>

      <section class="cvp-side" aria-label="最近闪兑">
        <h2 class="cvp-side__title">最近记录</h2>
        <p v-if="!history.length" class="cvp-side__empty">暂无成交，完成一笔后将显示在此。</p>
        <ul v-else class="cvp-hist">
          <li v-for="h in history" :key="h.id" class="cvp-hist__item">
            <div class="cvp-hist__main">
              <span class="cvp-hist__pair">{{ h.from }} → {{ h.to }}</span>
              <span class="cvp-hist__amt ex-num">{{ fmtQty(h.from, h.amountFrom) }} → {{ fmtQty(h.to, h.amountTo) }}</span>
            </div>
            <time class="cvp-hist__time" :datetime="h.time">{{ new Date(h.time).toLocaleString('zh-CN') }}</time>
          </li>
        </ul>
      </section>
    </div>

    <p class="cvp__foot">
      风险提示：数字资产价格波动大，闪兑结果以实际执行为准。产品逻辑与排版参考
      <a class="cvp__a" href="https://www.binance.com/zh-CN/convert" target="_blank" rel="noopener noreferrer">币安 Convert</a>
      体验设计。
    </p>

    <ConvertAssetPickerModal
      v-model="pickerOpen"
      :title="pickerTitle"
      :assets="assetsMeta"
      :balances="balances"
      :other-symbol="pickerRole === 'from' ? toAsset : fromAsset"
      @select="onPickAsset"
    />

    <ConvertConfirmModal
      v-model="confirmOpen"
      :from="fromAsset"
      :to="toAsset"
      :amount-to="quote?.amountTo ?? 0"
      :amount-from-fmt="confirmAmountFromFmt"
      :amount-to-fmt="confirmAmountToFmt"
      :fee-pct="CONVERT_FEE_PCT"
      :rate-line="rateLine"
      :usdt-eq="usdtEq"
    />
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;
@use '@/styles/mixins' as mq;

.cvp {
  max-width: min(960px, var(--ex-container-max));
  margin: 0 auto;
  padding: 0 $space-4 $space-8;
  box-sizing: border-box;
}

.cvp__hero {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: $space-3;
  margin-bottom: $space-4;
}

.cvp__title {
  margin: 0 0 $space-1;
  font-size: $font-size-xl;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.cvp__sub {
  margin: 0;
  font-size: $font-size-sm;
  color: $color-text-tertiary;
  max-width: 520px;
  line-height: 1.5;
}

.cvp__hero-links {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
}

.cvp__link {
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  color: $color-brand;
  text-decoration: none;
  padding: $space-2 $space-3;
  border-radius: $radius-sm;
  border: 1px solid rgba(240, 185, 11, 0.35);
  background: rgba(240, 185, 11, 0.08);
}

.cvp__link:hover {
  background: rgba(240, 185, 11, 0.14);
}

.cvp__auth-hint {
  font-size: $font-size-xs;
  color: $color-text-secondary;
  margin: 0 0 $space-4;
  padding: $space-2 $space-3;
  border-radius: $radius-sm;
  background: rgba(48, 132, 252, 0.08);
  border: 1px solid rgba(48, 132, 252, 0.2);
}

.cvp__a {
  color: $color-brand;
  text-decoration: none;
  font-weight: $font-weight-semibold;
}

.cvp__a:hover {
  text-decoration: underline;
}

.cvp__layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: $space-4;

  @include mq.media-up(md) {
    grid-template-columns: 1fr 300px;
    align-items: start;
  }
}

.cvp-card {
  border-radius: $radius-md;
  border: 1px solid $color-border;
  background: var(--ex-card-surface);
  overflow: hidden;
}

.cvp-card__inner {
  padding: $space-4 $space-4 $space-5;
  max-width: 440px;
  margin: 0 auto;
}

.cvp-io {
  margin-bottom: $space-2;
}

.cvp-io__row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.cvp-io__lab {
  font-size: $font-size-xs;
  color: $color-text-tertiary;
  font-weight: $font-weight-semibold;
}

.cvp-io__avail {
  font-size: 11px;
  color: $color-text-secondary;
}

.cvp-io__box {
  display: flex;
  align-items: center;
  gap: $space-2;
  padding: $space-3 $space-3;
  border-radius: $radius-md;
  background: var(--ex-surface-inset-strong);
  border: 1px solid var(--ex-border-subtle);
}

.cvp-io__box--ro {
  min-height: 52px;
}

.cvp-io__input {
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  color: $color-text-primary;
  font-size: 22px;
  font-weight: $font-weight-bold;
  font-family: $font-family-mono;

  &:focus {
    outline: none;
  }

  &::placeholder {
    color: $color-text-tertiary;
  }
}

.cvp-io__out {
  flex: 1;
  min-width: 0;
  font-size: 22px;
  font-weight: $font-weight-bold;
  color: $color-rise;
}

.cvp-io__max {
  flex-shrink: 0;
  padding: 4px 10px;
  font-size: 11px;
  font-weight: $font-weight-bold;
  border: none;
  border-radius: $radius-sm;
  background: rgba(240, 185, 11, 0.15);
  color: $color-brand;
  cursor: pointer;
}

.cvp-io__asset {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: $radius-sm;
  border: 1px solid $color-border;
  background: var(--ex-fill-ghost);
  color: $color-text-primary;
  cursor: pointer;
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
}

.cvp-io__asset:hover {
  border-color: rgba(240, 185, 11, 0.4);
}

.cvp-io__sym {
  font-family: $font-family-mono;
}

.cvp-io__chev {
  font-size: 10px;
  color: $color-text-tertiary;
}

.cvp-swap-wrap {
  display: flex;
  justify-content: center;
  margin: -6px 0 10px;
  position: relative;
  z-index: 1;
}

.cvp-swap {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid var(--ex-bg-base);
  background: linear-gradient(180deg, var(--ex-bg-surface) 0%, var(--ex-bg-elevated) 100%);
  color: $color-brand;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--ex-shadow-card);
}

.cvp-swap:hover {
  filter: brightness(1.08);
}

.cvp-meta {
  margin-top: $space-4;
  padding-top: $space-3;
  border-top: 1px solid var(--ex-border-subtle);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.cvp-meta__row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: $space-3;
  font-size: $font-size-xs;
}

.cvp-meta__row--quote {
  align-items: center;
}

.cvp-meta__k {
  color: $color-text-tertiary;
  flex-shrink: 0;
}

.cvp-meta__v {
  color: $color-text-secondary;
  text-align: right;
  line-height: 1.45;
}

.cvp-meta__cd {
  font-family: $font-family-mono;
  font-weight: $font-weight-semibold;
  color: $color-brand;
  margin-right: $space-2;
}

.cvp-meta__rf {
  padding: 2px 8px;
  font-size: 11px;
  font-weight: $font-weight-semibold;
  border-radius: $radius-sm;
  border: 1px solid rgba(240, 185, 11, 0.35);
  background: transparent;
  color: $color-brand;
  cursor: pointer;
}

.cvp-meta__rf:hover {
  background: rgba(240, 185, 11, 0.1);
}

.cvp__err {
  margin: $space-3 0 0;
  font-size: $font-size-xs;
  color: $color-fall;
  line-height: 1.4;
}

.cvp__cta {
  width: 100%;
  margin-top: $space-4;
  padding: $space-3 $space-4;
  font-size: $font-size-md;
  font-weight: $font-weight-bold;
  border: none;
  border-radius: $radius-sm;
  cursor: pointer;
  background: var(--ex-brand);
  color: var(--ex-on-brand);
}

.cvp__cta:hover:not(:disabled) {
  filter: brightness(1.05);
}

.cvp__cta:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.cvp__hint {
  margin: $space-3 0 0;
  font-size: 11px;
  color: $color-text-tertiary;
  line-height: 1.5;
}

.cvp-side {
  border-radius: $radius-md;
  border: 1px solid $color-border;
  background: var(--ex-panel-sunken);
  padding: $space-4;
}

.cvp-side__title {
  margin: 0 0 $space-3;
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.cvp-side__empty {
  margin: 0;
  font-size: $font-size-xs;
  color: $color-text-tertiary;
  line-height: 1.5;
}

.cvp-hist {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.cvp-hist__item {
  padding: $space-2 $space-3;
  border-radius: $radius-sm;
  background: var(--ex-panel-sunken);
  border: 1px solid var(--ex-border-subtle);
}

.cvp-hist__main {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.cvp-hist__pair {
  font-size: 11px;
  font-weight: $font-weight-bold;
  color: $color-brand;
}

.cvp-hist__amt {
  font-size: $font-size-xs;
  color: $color-text-secondary;
}

.cvp-hist__ref {
  display: block;
  margin-top: 4px;
  font-size: 10px;
  color: $color-text-tertiary;
}

.cvp-hist__time {
  display: block;
  margin-top: 6px;
  font-size: 10px;
  color: $color-text-tertiary;
}

.cvp__foot {
  margin-top: $space-6;
  font-size: 11px;
  color: $color-text-tertiary;
  line-height: 1.6;
}

.ex-num {
  font-family: $font-family-mono;
}
</style>
