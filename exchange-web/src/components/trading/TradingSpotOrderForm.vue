<script setup lang="ts">
/**
 * 现货下单区（Binance 类）：买卖 Tab、限价/市价/条件单 Tab、价格·数量·成交额、比例快捷、止盈止损（与合约共用组件）、可用余额、主按钮。
 * 校验见 validateSpotOrderForm；提交由父级调 API。
 */
import { computed, ref, watch } from 'vue'
import type { SpotOrderSide, SpotOrderType } from '@/types/spotTrade'
import { useDemoTradeStore } from '@/stores/demoTrade'
import { intentTitleZh } from '@/composables/spot/spotConditionalIntent'
import { validateSpotOrderForm } from '@/composables/spot/validateSpotOrderForm'
import { formatPrice } from '@/utils/format/number'
import { formatOrderBookQuantity } from '@/utils/format/orderBook'
import { parseSpotPriceInput, resolveSpotBuyRefPrice } from '@/utils/spot/spotRefPrice'
import TradingOrderTpSlBlock from './TradingOrderTpSlBlock.vue'

const props = withDefaults(
  defineProps<{
    symbol: string
    side: SpotOrderSide
    orderType: SpotOrderType
    price: string
    quantity: string
    quoteQty: string
    baseAsset: string
    quoteAsset: string
    baseAvailable: number
    quoteAvailable: number
    lastPrice: number | null
    /** 限价止盈止损：触发价 */
    triggerPrice?: string
    /** 限价/市价：止盈止损勾选（与合约下单区一致） */
    tpSlAttachEnabled?: boolean
    takeProfitPrice?: string
    stopLossPrice?: string
    loading?: boolean
    submitting?: boolean
  }>(),
  {
    triggerPrice: '',
    tpSlAttachEnabled: false,
    takeProfitPrice: '',
    stopLossPrice: '',
    loading: false,
    submitting: false,
  },
)

const emit = defineEmits<{
  (e: 'update:side', v: SpotOrderSide): void
  (e: 'update:orderType', v: SpotOrderType): void
  (e: 'update:price', v: string): void
  (e: 'update:quantity', v: string): void
  (e: 'update:quoteQty', v: string): void
  (e: 'update:triggerPrice', v: string): void
  (e: 'update:tpSlAttachEnabled', v: boolean): void
  (e: 'update:takeProfitPrice', v: string): void
  (e: 'update:stopLossPrice', v: string): void
  (e: 'submit'): void
  (e: 'apply-percent', pct: number): void
}>()

const demo = useDemoTradeStore()

const pctLevels = [25, 50, 75, 100] as const

const totalFieldFocused = ref(false)
const totalInputLocal = ref('')

watch(
  () =>
    [props.orderType, props.price, props.quantity, totalFieldFocused.value, props.triggerPrice] as const,
  () => {
    if ((props.orderType !== 'LIMIT' && props.orderType !== 'STOP') || totalFieldFocused.value) return
    const p = parseFloat(props.price.replace(/,/g, ''))
    const q = parseFloat(props.quantity.replace(/,/g, ''))
    if (Number.isFinite(p) && Number.isFinite(q) && p > 0 && q > 0) {
      totalInputLocal.value = (p * q).toFixed(2)
    } else {
      totalInputLocal.value = ''
    }
  },
  { immediate: true },
)

const fields = computed(() => ({
  side: props.side,
  orderType: props.orderType,
  price: props.price,
  quantity: props.quantity,
  quoteQty: props.quoteQty,
  ...(props.orderType === 'STOP' ? { triggerPrice: props.triggerPrice } : {}),
  ...(props.orderType === 'LIMIT' || props.orderType === 'MARKET'
    ? {
        tpSlAttachEnabled: props.tpSlAttachEnabled,
        takeProfitPrice: props.takeProfitPrice,
        stopLossPrice: props.stopLossPrice,
      }
    : {}),
}))

const validation = computed(() =>
  validateSpotOrderForm(fields.value, {
    symbol: props.symbol,
    baseAvailable: props.baseAvailable,
    quoteAvailable: props.quoteAvailable,
    lastPrice: props.lastPrice,
  }),
)

const primaryHint = computed(() => validation.value.errors[0] ?? '')

const estimatedTotal = computed(() => {
  if (props.orderType !== 'LIMIT' && props.orderType !== 'STOP') return null
  const p = parseFloat(props.price.replace(/,/g, ''))
  const q = parseFloat(props.quantity.replace(/,/g, ''))
  if (!Number.isFinite(p) || !Number.isFinite(q)) return null
  return p * q
})

const pendingConditionals = computed(() =>
  demo.terminalActive ? demo.pendingConditionalsForSymbol(props.symbol) : [],
)

/** 演示：吃单费率，用于「预估手续费」帮助用户建立成本预期 */
const DEMO_TAKER_FEE_RATE = 0.001

const notionalForSummary = computed(() => {
  if (props.orderType === 'LIMIT' || props.orderType === 'STOP') {
    const n = estimatedTotal.value
    return n != null && n > 0 ? n : null
  }
  if (props.orderType === 'MARKET' && props.side === 'BUY') {
    const q = parseFloat(props.quoteQty.replace(/,/g, ''))
    return Number.isFinite(q) && q > 0 ? q : null
  }
  if (props.orderType === 'MARKET' && props.side === 'SELL') {
    const q = parseFloat(props.quantity.replace(/,/g, ''))
    const p = props.lastPrice
    if (!Number.isFinite(q) || q <= 0 || p == null || !Number.isFinite(p) || p <= 0) return null
    return q * p
  }
  return null
})

const feeEstimate = computed(() => {
  const n = notionalForSummary.value
  if (n == null) return null
  return n * DEMO_TAKER_FEE_RATE
})

const submitAriaDescribedBy = computed(() => {
  const ids: string[] = []
  if (props.submitting) ids.push('sof-state-hint')
  else if (props.loading) ids.push('sof-state-hint')
  if (primaryHint.value) ids.push('sof-validate-hint')
  return ids.length ? ids.join(' ') : undefined
})

function onTotalInput(e: Event) {
  const v = (e.target as HTMLInputElement).value
  totalInputLocal.value = v
  const p = parseFloat(props.price.replace(/,/g, ''))
  const t = parseFloat(v.replace(/,/g, ''))
  if (Number.isFinite(p) && p > 0 && Number.isFinite(t) && t > 0) {
    emit('update:quantity', (t / p).toFixed(8))
  }
}

function setOrderType(t: SpotOrderType) {
  emit('update:orderType', t)
}

function onTriggerInput(e: Event) {
  emit('update:triggerPrice', (e.target as HTMLInputElement).value)
}

/** 市价买入：成交额 ↔ 数量（按最新价联动，接口仍只提交 quoteQty） */
function onMarketBuyQuoteInput(e: Event) {
  const raw = (e.target as HTMLInputElement).value
  emit('update:quoteQty', raw)
  const quote = parseFloat(raw.replace(/,/g, ''))
  const lp = props.lastPrice
  if (Number.isFinite(quote) && quote > 0 && lp != null && Number.isFinite(lp) && lp > 0) {
    emit('update:quantity', (quote / lp).toFixed(8))
  }
}

function onMarketBuyQtyInput(e: Event) {
  const raw = (e.target as HTMLInputElement).value
  emit('update:quantity', raw)
  const q = parseFloat(raw.replace(/,/g, ''))
  const lp = props.lastPrice
  if (Number.isFinite(q) && q > 0 && lp != null && Number.isFinite(lp) && lp > 0) {
    emit('update:quoteQty', (q * lp).toFixed(2))
  }
}

/** 市价卖出：数量 ↔ 成交额（按最新价联动，接口仍只提交 quantity） */
function onMarketSellQtyInput(e: Event) {
  const raw = (e.target as HTMLInputElement).value
  emit('update:quantity', raw)
  const q = parseFloat(raw.replace(/,/g, ''))
  const lp = props.lastPrice
  if (Number.isFinite(q) && q > 0 && lp != null && Number.isFinite(lp) && lp > 0) {
    emit('update:quoteQty', (q * lp).toFixed(2))
  }
}

function onMarketSellQuoteInput(e: Event) {
  const raw = (e.target as HTMLInputElement).value
  emit('update:quoteQty', raw)
  const quote = parseFloat(raw.replace(/,/g, ''))
  const lp = props.lastPrice
  if (Number.isFinite(quote) && quote > 0 && lp != null && Number.isFinite(lp) && lp > 0) {
    emit('update:quantity', (quote / lp).toFixed(8))
  }
}

function fmtBalBase(n: number): string {
  return formatOrderBookQuantity(n, 6)
}

function fmtBalQuote(n: number): string {
  return formatPrice(n)
}

/** 与说明气泡一致的口径（第三张参考图） */
const SPOT_BUY_SELL_HINT =
  '可买/可卖取决于您买入/卖出时的可用余额，以及您想要交易的价格。当您输入想要交易的价格时，可买/可卖将自动计算得出。'

/**
 * 买入「可买」折合：与 store 快捷比例、市价/限价切换共用 {@link resolveSpotBuyRefPrice}。
 */
const priceForMaxBuyEstimate = computed(() => {
  const px = resolveSpotBuyRefPrice(props.orderType, props.price, props.lastPrice)
  if (px == null) return null
  const fromInput =
    (props.orderType === 'LIMIT' || props.orderType === 'STOP') &&
    parseSpotPriceInput(props.price) != null
  return { px, fromInput }
})

const maxBuyableBaseQty = computed(() => {
  const pack = priceForMaxBuyEstimate.value
  if (pack == null) return null
  if (props.quoteAvailable <= 0) return 0
  return props.quoteAvailable / pack.px
})

/** 限价未填有效价格、实际按最新价估算可买量时提示 */
const showBuyPriceEstimateHint = computed(() => {
  if (props.side !== 'BUY') return false
  const pack = priceForMaxBuyEstimate.value
  return pack != null && !pack.fromInput
})

const baseBalanceRowValueText = computed(() => {
  if (props.side === 'SELL') {
    return fmtBalBase(props.baseAvailable)
  }
  const m = maxBuyableBaseQty.value
  if (m == null) return '—'
  return fmtBalBase(m)
})
</script>

<template>
  <section class="sof" aria-label="现货下单">
    <div class="sof__tabs-side" role="tablist" aria-label="买卖方向">
      <button
        type="button"
        role="tab"
        class="sof__side-btn sof__side-btn--buy"
        :class="{ 'sof__side-btn--on': side === 'BUY' }"
        :aria-selected="side === 'BUY'"
        @click="emit('update:side', 'BUY')"
      >
        买入
      </button>
      <button
        type="button"
        role="tab"
        class="sof__side-btn sof__side-btn--sell"
        :class="{ 'sof__side-btn--on': side === 'SELL' }"
        :aria-selected="side === 'SELL'"
        @click="emit('update:side', 'SELL')"
      >
        卖出
      </button>
    </div>

    <div class="sof__tabs-type" role="tablist" aria-label="订单类型">
      <button
        type="button"
        role="tab"
        class="sof__type-btn"
        :class="{ 'sof__type-btn--on': orderType === 'LIMIT' }"
        @click="setOrderType('LIMIT')"
      >
        限价
      </button>
      <button
        type="button"
        role="tab"
        class="sof__type-btn"
        :class="{ 'sof__type-btn--on': orderType === 'MARKET' }"
        @click="setOrderType('MARKET')"
      >
        市价
      </button>
      <button
        type="button"
        role="tab"
        class="sof__type-btn"
        :class="{ 'sof__type-btn--on': orderType === 'STOP' }"
        :aria-selected="orderType === 'STOP'"
        @click="setOrderType('STOP')"
      >
        限价止盈止损
      </button>
    </div>

    <template v-if="orderType === 'STOP'">
      <div class="sof__field sof__field--primary">
        <label class="sof__label" for="sof-trigger">触发价</label>
        <div class="sof__input-wrap sof__input-wrap--emph">
          <input
            id="sof-trigger"
            class="sof__input"
            type="text"
            inputmode="decimal"
            autocomplete="off"
            placeholder="价格触及此条件后提交限价单"
            :value="triggerPrice"
            @input="onTriggerInput"
          />
          <span class="sof__suffix">{{ quoteAsset }}</span>
        </div>
      </div>
      <div class="sof__field">
        <label class="sof__label" for="sof-stop-limit-price">委托价（限价）</label>
        <div class="sof__input-wrap">
          <input
            id="sof-stop-limit-price"
            class="sof__input"
            type="text"
            inputmode="decimal"
            autocomplete="off"
            :value="price"
            @input="emit('update:price', ($event.target as HTMLInputElement).value)"
          />
          <span class="sof__suffix">{{ quoteAsset }}</span>
        </div>
      </div>
      <div class="sof__field">
        <label class="sof__label" for="sof-stop-qty">数量</label>
        <div class="sof__input-wrap">
          <input
            id="sof-stop-qty"
            class="sof__input"
            type="text"
            inputmode="decimal"
            autocomplete="off"
            placeholder="请输入数量"
            :value="quantity"
            @input="emit('update:quantity', ($event.target as HTMLInputElement).value)"
          />
          <span class="sof__suffix">{{ baseAsset }}</span>
        </div>
      </div>
      <div class="sof__field">
        <label class="sof__label" for="sof-stop-total">成交额</label>
        <div class="sof__input-wrap">
          <input
            id="sof-stop-total"
            class="sof__input"
            type="text"
            inputmode="decimal"
            autocomplete="off"
            placeholder="请输入金额"
            :value="totalInputLocal"
            @focus="totalFieldFocused = true"
            @blur="totalFieldFocused = false"
            @input="onTotalInput"
          />
          <span class="sof__suffix">{{ quoteAsset }}</span>
        </div>
      </div>

      <div v-if="demo.terminalActive && pendingConditionals.length" class="sof__tpsl-queue" aria-label="待触发条件单">
        <div class="sof__tpsl-queue-head">
          <span>待触发（模拟）</span>
          <span class="sof__tpsl-queue-sub">{{ pendingConditionals.length }} 条</span>
        </div>
        <ul class="sof__tpsl-queue-list">
          <li v-for="co in pendingConditionals" :key="co.id" class="sof__tpsl-queue-item">
            <div class="sof__tpsl-queue-row1">
              <span
                class="sof__tpsl-queue-side"
                :class="co.side === 'BUY' ? 'sof__tpsl-queue-side--buy' : 'sof__tpsl-queue-side--sell'"
              >
                {{ co.side === 'BUY' ? '买' : '卖' }}
              </span>
              <span class="sof__tpsl-queue-intent">{{ intentTitleZh(co.intentKind) }}</span>
              <span class="sof__tpsl-queue-id ex-num" :title="co.id">{{ co.id.slice(-10) }}</span>
            </div>
            <div class="sof__tpsl-queue-row2 ex-num">
              触发 {{ formatPrice(co.triggerPrice) }} → 限价 {{ formatPrice(co.limitPrice) }} ×
              {{ formatOrderBookQuantity(co.quantity, 6) }}
            </div>
            <div class="sof__tpsl-queue-actions">
              <button type="button" class="sof__tpsl-queue-btn" @click="demo.manualTriggerConditional(co.id)">
                模拟触发
              </button>
              <button type="button" class="sof__tpsl-queue-btn sof__tpsl-queue-btn--ghost" @click="demo.cancelConditionalOrder(co.id)">
                撤销
              </button>
            </div>
          </li>
        </ul>
      </div>
    </template>

    <template v-else-if="orderType === 'LIMIT'">
      <div class="sof__field">
        <label class="sof__label" for="sof-price">价格</label>
        <div class="sof__input-wrap">
          <input
            id="sof-price"
            class="sof__input"
            type="text"
            inputmode="decimal"
            autocomplete="off"
            :value="price"
            @input="emit('update:price', ($event.target as HTMLInputElement).value)"
          />
          <span class="sof__suffix">{{ quoteAsset }}</span>
        </div>
      </div>
      <div class="sof__field">
        <label class="sof__label" for="sof-qty">数量</label>
        <div class="sof__input-wrap">
          <input
            id="sof-qty"
            class="sof__input"
            type="text"
            inputmode="decimal"
            autocomplete="off"
            placeholder="请输入数量"
            :value="quantity"
            @input="emit('update:quantity', ($event.target as HTMLInputElement).value)"
          />
          <span class="sof__suffix">{{ baseAsset }}</span>
        </div>
      </div>
      <div class="sof__field">
        <label class="sof__label" for="sof-total">成交额</label>
        <div class="sof__input-wrap">
          <input
            id="sof-total"
            class="sof__input"
            type="text"
            inputmode="decimal"
            autocomplete="off"
            placeholder="请输入金额"
            :value="totalInputLocal"
            @focus="totalFieldFocused = true"
            @blur="totalFieldFocused = false"
            @input="onTotalInput"
          />
          <span class="sof__suffix">{{ quoteAsset }}</span>
        </div>
      </div>
    </template>

    <template v-else-if="orderType === 'MARKET' && side === 'BUY'">
      <div class="sof__field">
        <label class="sof__label" for="sof-mkt-buy-qty">数量</label>
        <div class="sof__input-wrap">
          <input
            id="sof-mkt-buy-qty"
            class="sof__input"
            type="text"
            inputmode="decimal"
            autocomplete="off"
            placeholder="请输入数量"
            :value="quantity"
            @input="onMarketBuyQtyInput"
          />
          <span class="sof__suffix">{{ baseAsset }}</span>
        </div>
      </div>
      <div class="sof__field">
        <label class="sof__label" for="sof-quote">成交额</label>
        <div class="sof__input-wrap">
          <input
            id="sof-quote"
            class="sof__input"
            type="text"
            inputmode="decimal"
            autocomplete="off"
            placeholder="请输入金额"
            :value="quoteQty"
            @input="onMarketBuyQuoteInput"
          />
          <span class="sof__suffix">{{ quoteAsset }}</span>
        </div>
      </div>
    </template>

    <template v-else-if="orderType === 'MARKET' && side === 'SELL'">
      <div class="sof__field">
        <label class="sof__label" for="sof-mkt-qty">数量</label>
        <div class="sof__input-wrap">
          <input
            id="sof-mkt-qty"
            class="sof__input"
            type="text"
            inputmode="decimal"
            autocomplete="off"
            placeholder="请输入数量"
            :value="quantity"
            @input="onMarketSellQtyInput"
          />
          <span class="sof__suffix">{{ baseAsset }}</span>
        </div>
      </div>
      <div class="sof__field">
        <label class="sof__label" for="sof-mkt-sell-quote">成交额</label>
        <div class="sof__input-wrap">
          <input
            id="sof-mkt-sell-quote"
            class="sof__input"
            type="text"
            inputmode="decimal"
            autocomplete="off"
            placeholder="请输入金额"
            :value="quoteQty"
            @input="onMarketSellQuoteInput"
          />
          <span class="sof__suffix">{{ quoteAsset }}</span>
        </div>
      </div>
    </template>

    <TradingOrderTpSlBlock
      v-if="orderType === 'LIMIT' || orderType === 'MARKET'"
      field-id-prefix="sof-tpsl"
      :enabled="tpSlAttachEnabled"
      :take-profit-price="takeProfitPrice ?? ''"
      :stop-loss-price="stopLossPrice ?? ''"
      @update:enabled="emit('update:tpSlAttachEnabled', $event)"
      @update:take-profit-price="emit('update:takeProfitPrice', $event)"
      @update:stop-loss-price="emit('update:stopLossPrice', $event)"
    />

    <div
      class="sof__pct"
      :aria-label="
        side === 'BUY'
          ? '按比例使用可用计价币或可买基础币数量'
          : '按比例使用可用计价币或可卖基础币数量'
      "
    >
      <button
        v-for="p in pctLevels"
        :key="p"
        type="button"
        class="sof__pct-btn"
        @click="emit('apply-percent', p)"
      >
        {{ p }}%
      </button>
    </div>

    <div class="sof__bal" aria-label="可用、可买可卖与手续费">
      <div class="sof__bal-line">
        <span class="sof__bal-label">可用</span>
        <span class="sof__bal-val ex-num">{{ fmtBalQuote(quoteAvailable) }} {{ quoteAsset }}</span>
      </div>
      <div class="sof__bal-line">
        <span class="sof__bal-label">
          <el-tooltip placement="top" effect="dark" :show-after="180" popper-class="sof-bal-tooltip">
            <template #content>
              {{ SPOT_BUY_SELL_HINT }}
            </template>
            <span class="sof__bal-term" tabindex="0">{{ side === 'BUY' ? '可买' : '可卖' }}</span>
          </el-tooltip>
        </span>
        <div class="sof__bal-val-wrap">
          <span class="sof__bal-val ex-num">
            <template v-if="baseBalanceRowValueText === '—'">—</template>
            <template v-else>{{ baseBalanceRowValueText }} {{ baseAsset }}</template>
          </span>
          <span v-if="side === 'BUY' && showBuyPriceEstimateHint" class="sof__bal-hint">按参考价估算</span>
        </div>
      </div>
      <div class="sof__bal-line">
        <span class="sof__bal-label">
          <el-tooltip placement="top" effect="dark" :show-after="180" popper-class="sof-bal-tooltip">
            <template #content>
              按 0.1% 吃单费率估算；挂单减免、VIP 折扣以实际成交为准。
            </template>
            <span class="sof__bal-term" tabindex="0">预估手续费</span>
          </el-tooltip>
        </span>
        <span class="sof__bal-val ex-num">
          <template v-if="feeEstimate != null">≈ {{ formatPrice(feeEstimate) }} {{ quoteAsset }}</template>
          <template v-else>—</template>
        </span>
      </div>
    </div>

    <p v-if="submitting" id="sof-state-hint" class="sof__soft-hint" role="status">订单提交中，请稍候…</p>
    <p v-else-if="loading" id="sof-state-hint" class="sof__soft-hint" role="status">
      行情与余额加载中，下单按钮暂时不可用。
    </p>

    <p
      v-if="primaryHint"
      id="sof-validate-hint"
      class="sof__err"
      role="alert"
    >
      {{ primaryHint }}
    </p>

    <button
      type="button"
      class="sof__submit"
      :class="side === 'BUY' ? 'sof__submit--buy' : 'sof__submit--sell'"
      :disabled="loading || submitting || !validation.valid"
      :aria-describedby="submitAriaDescribedBy"
      @click="emit('submit')"
    >
      <span v-if="submitting" class="sof__submit-inner">提交中…</span>
      <span v-else class="sof__submit-inner">{{ side === 'BUY' ? '买入' : '卖出' }} {{ baseAsset }}</span>
    </button>

    <p class="sof__hint">
      参考价 {{ lastPrice != null ? formatPrice(lastPrice) : '—' }} {{ quoteAsset }}
      · 实际成交以撮合与风控为准
    </p>
  </section>
</template>

<style scoped lang="scss">
@use 'sass:color';
@use '@/styles/abstracts/variables' as *;

.sof {
  box-sizing: border-box;
  border: 1px solid $color-border;
  border-radius: $radius-md;
  background: var(--ex-spot-order-surface);
  padding: $space-3;
  box-shadow: var(--ex-spot-order-shadow);
  /* 父级 flex 列内避免被错误拉伸；高度随内容，由 .spot__form 负责滚动 */
  flex-shrink: 0;
  min-height: min-content;
}

.sof__tabs-side {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2px;
  margin-bottom: $space-3;
  padding: 2px;
  border-radius: $radius-sm;
  background: $color-bg-base;
}

.sof__side-btn {
  padding: $space-2 $space-2;
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  border: none;
  border-radius: $radius-sm;
  cursor: pointer;
  color: $color-text-tertiary;
  background: transparent;
  transition: color 0.12s ease, box-shadow 0.12s ease;

  &--buy.sof__side-btn--on {
    color: var(--ex-on-brand);
    background: var(--ex-rise);
    box-shadow: 0 0 0 1px rgba(14, 203, 129, 0.35);
  }

  &--sell.sof__side-btn--on {
    color: #fff;
    background: var(--ex-fall);
    box-shadow: 0 0 0 1px rgba(246, 70, 93, 0.35);
  }
}

.sof__tabs-type {
  display: flex;
  gap: $space-1;
  margin-bottom: $space-3;
}

.sof__type-btn {
  flex: 1;
  padding: $space-2 $space-1;
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  color: $color-text-secondary;
  background: $color-bg-base;
  border: 1px solid $color-border;
  border-radius: $radius-sm;
  cursor: pointer;
  transition: border-color 0.12s ease, color 0.12s ease;

  &--on {
    border-color: rgba(240, 185, 11, 0.5);
    color: $color-brand;
  }

  &--disabled {
    opacity: 0.42;
    cursor: not-allowed;
  }
}

.sof__field {
  margin-bottom: $space-3;
}

.sof__label {
  display: block;
  margin-bottom: 4px;
  font-size: $font-size-xs;
  font-weight: $font-weight-medium;
  color: $color-text-tertiary;
}

.sof__input-wrap {
  display: flex;
  align-items: center;
  border: 1px solid $color-border-strong;
  border-radius: $radius-sm;
  background: var(--ex-bg-surface);
  min-height: 42px;
  padding-right: $space-2;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;

  &:focus-within {
    border-color: rgba(240, 185, 11, 0.5);
    box-shadow: 0 0 0 1px rgba(240, 185, 11, 0.12);
  }
}

.sof__input {
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  padding: 0 $space-3;
  height: 40px;
  color: $color-text-primary;
  font-size: $font-size-sm;
  font-family: $font-family-mono;
  font-variant-numeric: tabular-nums;
  outline: none;

  &::placeholder {
    color: $color-text-tertiary;
    font-family: $font-family-base;
    font-variant-numeric: normal;
    font-weight: $font-weight-regular;
    opacity: 0.78;
  }
}

.sof__suffix {
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  color: $color-text-tertiary;
  flex-shrink: 0;
}

.sof__field--primary .sof__label {
  color: $color-text-secondary;
  font-weight: $font-weight-semibold;
}

.sof__input-wrap--emph {
  border-color: color-mix(in srgb, $color-brand 28%, $color-border-strong);
  background: color-mix(in srgb, var(--ex-bg-surface) 92%, $color-brand);

  &:focus-within {
    border-color: rgba(240, 185, 11, 0.55);
    box-shadow: 0 0 0 2px rgba(240, 185, 11, 0.1);
  }
}

.sof__tpsl-queue {
  margin-bottom: $space-3;
  padding: $space-2 $space-3;
  border-radius: $radius-sm;
  border: 1px dashed var(--ex-border);
  background: var(--ex-fill-ghost);
}

.sof__tpsl-queue-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: $font-size-xs;
  font-weight: $font-weight-bold;
  color: $color-text-secondary;
  margin-bottom: $space-2;
}

.sof__tpsl-queue-sub {
  font-size: 10px;
  font-weight: $font-weight-medium;
  color: $color-text-tertiary;
}

.sof__tpsl-queue-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.sof__tpsl-queue-item {
  padding: $space-2;
  border-radius: $radius-sm;
  border: 1px solid var(--ex-border);
  background: var(--ex-bg-base);
}

.sof__tpsl-queue-row1 {
  display: flex;
  align-items: center;
  gap: $space-2;
  margin-bottom: 4px;
  font-size: $font-size-xs;
}

.sof__tpsl-queue-side {
  font-weight: $font-weight-bold;
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 4px;

  &--buy {
    color: var(--ex-on-brand);
    background: color-mix(in srgb, var(--ex-rise) 18%, transparent);
  }

  &--sell {
    color: #fff;
    background: color-mix(in srgb, var(--ex-fall) 55%, transparent);
  }
}

.sof__tpsl-queue-intent {
  flex: 1;
  font-weight: $font-weight-semibold;
  color: $color-text-primary;
}

.sof__tpsl-queue-id {
  font-size: 10px;
  color: $color-text-tertiary;
  max-width: 7em;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sof__tpsl-queue-row2 {
  font-size: 10px;
  color: $color-text-secondary;
  margin-bottom: $space-2;
  line-height: 1.45;
}

.sof__tpsl-queue-actions {
  display: flex;
  gap: $space-1;
}

.sof__tpsl-queue-btn {
  flex: 1;
  padding: 6px $space-2;
  font-size: 10px;
  font-weight: $font-weight-semibold;
  border-radius: $radius-sm;
  border: 1px solid $color-border;
  background: var(--ex-fill-ghost);
  color: $color-text-primary;
  cursor: pointer;
  transition: border-color 0.12s ease, color 0.12s ease;

  &:hover {
    border-color: rgba(240, 185, 11, 0.45);
    color: $color-brand;
  }

  &--ghost {
    flex: 0 0 auto;
    background: transparent;
    color: $color-text-tertiary;
  }
}

.sof__soft-hint {
  margin: 0 0 $space-2;
  font-size: $font-size-xs;
  line-height: 1.45;
  color: var(--ex-warning);
  padding: $space-2 $space-3;
  border-radius: $radius-sm;
  background: var(--ex-warning-bg);
  border: 1px solid color-mix(in srgb, var(--ex-warning) 22%, transparent);
}

.sof__pct {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: $space-1;
  margin-bottom: $space-3;
}

.sof__pct-btn {
  padding: $space-2 0;
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  color: $color-text-secondary;
  background: var(--ex-fill-ghost);
  border: 1px solid $color-border;
  border-radius: $radius-sm;
  cursor: pointer;
  transition: border-color 0.12s ease, color 0.12s ease;

  &:hover {
    border-color: rgba(240, 185, 11, 0.4);
    color: $color-brand;
  }
}

.sof__bal {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: $space-2;
  padding: $space-2 0;
  border-top: 1px solid var(--ex-border-subtle);
  font-size: $font-size-xs;
}

.sof__bal-line {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: $space-2;
}

.sof__bal-label {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4px;
  color: $color-text-tertiary;
}

.sof__bal-term {
  cursor: help;
  border-bottom: 1px dotted color-mix(in srgb, $color-text-tertiary 55%, transparent);
}

.sof__bal-val-wrap {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  min-width: 0;
  text-align: right;
}

.sof__bal-val {
  color: $color-text-primary;
  font-weight: $font-weight-medium;
}

.sof__bal-hint {
  font-size: 9px;
  color: $color-text-tertiary;
  line-height: 1.2;
}

.sof__err {
  margin: 0 0 $space-2;
  font-size: $font-size-xs;
  color: $color-fall;
  line-height: 1.4;
}

.sof__submit {
  width: 100%;
  min-height: 48px;
  border: none;
  border-radius: $radius-sm;
  font-size: $font-size-md;
  font-weight: $font-weight-bold;
  cursor: pointer;
  margin-bottom: $space-2;
  box-shadow: 0 1px 0 color-mix(in srgb, var(--ex-text-primary) 12%, transparent);
  transition: opacity 0.12s ease, transform 0.08s ease;

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
    box-shadow: none;
  }

  &:not(:disabled):active {
    transform: translateY(1px);
  }

  &--buy {
    color: var(--ex-on-brand);
    background: var(--ex-rise);
  }

  &--sell {
    color: #fff;
    background: var(--ex-fall);
  }
}

.sof__submit-inner {
  letter-spacing: 0.03em;
}

.sof__hint {
  margin: 0;
  font-size: 10px;
  line-height: 1.55;
  color: $color-text-tertiary;
}

.ex-num {
  font-family: $font-family-mono;
  font-variant-numeric: tabular-nums;
}
</style>

<style lang="scss">
/* el-tooltip 挂载在 body */
.sof-bal-tooltip.el-popper.is-dark,
.sof-bal-tooltip.el-popper[data-popper-placement] {
  max-width: min(288px, calc(100vw - 24px));
  padding: 10px 12px !important;
  font-size: 12px;
  line-height: 1.5;
  border-radius: 8px;
  box-shadow:
    0 4px 14px rgba(0, 0, 0, 0.45),
    0 0 0 1px rgba(255, 255, 255, 0.06);
}
</style>
