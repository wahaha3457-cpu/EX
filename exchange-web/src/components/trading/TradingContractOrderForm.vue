<script setup lang="ts">
/**
 * U 本位合约下单区：开多/开空、委托类型、杠杆、全逐仓、价格·数量（计价币）、比例快捷、止盈止损。
 * 提交时由父级将 USDT 名义折算为张数后调 API。
 */
import { computed } from 'vue'
import type { FuturesMarginMode, FuturesOrderType, FuturesPositionSide } from '@/types/futuresTrade'
import { validateFuturesOrderForm } from '@/composables/futures/validateFuturesOrderForm'
import { formatPrice } from '@/utils/format/number'
import TradingOrderTpSlBlock from './TradingOrderTpSlBlock.vue'

/** 与现货「可买/可卖」气泡同级的可开说明 */
const CONTRACT_MAX_OPEN_HINT =
  '可开名义 ≈ 可用余额 × 当前杠杆；为仓位价值上限参考。限价单的委托价不改变该行估算。实际可开还受风控、限仓等约束。'

const props = withDefaults(
  defineProps<{
    symbol: string
    positionSide: FuturesPositionSide
    formType: FuturesOrderType
    price: string
    quantity: string
    leverage: number
    maxLeverage: number
    marginMode: FuturesMarginMode
    baseAsset: string
    quoteAsset: string
    walletAsset: string
    /** 可用余额（计价） */
    availableQuote: number
    /** 合约保证金余额（计价） */
    marginBalance: number
    /** 可开名义上限（计价币，≈ 可用 × 杠杆） */
    maxOpenNotionalUsdt: number
    markPrice: number
    tpSlEnabled: boolean
    tpPriceInput: string
    slPriceInput: string
    loading?: boolean
    submitting?: boolean
    /** 主按钮文案后缀，默认「{base} 永续」；交割页可传「BTC 交割」 */
    orderActionSuffix?: string
    /** 覆盖全仓/逐仓下方说明；可含换行（交割页传多行文案） */
    marginHint?: string
    /**
     * 交割 / 永续：隐藏杠杆滑块、快捷档位与保证金分段说明，在委托类型下用插槽放紧凑「杠杆 + 模式」控件。
     */
    embedDeliveryLevMargin?: boolean
  }>(),
  {
    loading: false,
    submitting: false,
    orderActionSuffix: undefined,
    marginHint: undefined,
    embedDeliveryLevMargin: false,
  },
)

const defaultMarginHint =
  '全仓共享保证金；逐仓单笔仓位独立。强平价由维持保证金率与持仓共同决定。'

const marginHintDisplay = computed(() => props.marginHint ?? defaultMarginHint)

const emit = defineEmits<{
  (e: 'update:positionSide', v: FuturesPositionSide): void
  (e: 'update:formType', v: FuturesOrderType): void
  (e: 'update:price', v: string): void
  (e: 'update:quantity', v: string): void
  (e: 'update:leverage', v: number): void
  (e: 'update:marginMode', v: FuturesMarginMode): void
  (e: 'update:tpSlEnabled', v: boolean): void
  (e: 'update:tpPriceInput', v: string): void
  (e: 'update:slPriceInput', v: string): void
  (e: 'apply-percent', pct: number): void
  (e: 'submit'): void
  (e: 'request-leverage-panel'): void
}>()

const pctLevels = [25, 50, 75, 100] as const
const levPresets = [1, 2, 5, 10, 20, 50, 75, 100, 125] as const

const leverageOptions = computed(() => levPresets.filter((x) => x <= props.maxLeverage))

const fields = computed(() => ({
  formIntent: 'OPEN' as const,
  positionSide: props.positionSide,
  formType: props.formType,
  price: props.price,
  quantity: props.quantity,
  leverage: props.leverage,
}))

const validation = computed(() =>
  validateFuturesOrderForm(fields.value, {
    maxLeverage: props.maxLeverage,
  }),
)

const primaryHint = computed(() => validation.value.errors[0] ?? '')

/** 演示吃单费率，与 Mock 成交 fee 系数 0.04% 对齐 */
const DEMO_CONTRACT_TAKER_FEE = 0.0004

const contractOrderNotionalUsdt = computed(() => {
  const q = parseFloat(props.quantity.replace(/,/g, ''))
  if (!Number.isFinite(q) || q <= 0) return null
  return q
})

const estimatedTradingFee = computed(() => {
  const n = contractOrderNotionalUsdt.value
  if (n == null) return null
  return n * DEMO_CONTRACT_TAKER_FEE
})

const submitAriaDescribedBy = computed(() => {
  const ids: string[] = []
  if (props.submitting) ids.push('tcf-state-hint')
  else if (props.loading) ids.push('tcf-state-hint')
  if (primaryHint.value) ids.push('tcf-validate-hint')
  return ids.length ? ids.join(' ') : undefined
})

const primaryLabel = computed(() => (props.positionSide === 'LONG' ? '开多' : '开空'))

const primaryClass = computed(() =>
  props.positionSide === 'LONG' ? 'tcf__submit--long' : 'tcf__submit--short',
)

const orderActionLine = computed(() => {
  if (props.orderActionSuffix) return `${primaryLabel.value} ${props.orderActionSuffix}`
  return `${primaryLabel.value} ${props.baseAsset} 永续`
})

const dirLongLabel = '开多'
const dirShortLabel = '开空'

function setOrderType(t: 'LIMIT' | 'MARKET') {
  emit('update:formType', t)
}

function onLevRange(ev: Event) {
  emit('update:leverage', Number((ev.target as HTMLInputElement).value))
}

</script>

<template>
  <section class="tcf" aria-label="合约下单">
    <div class="tcf__primary-actions">
      <div class="tcf__dir" role="tablist" aria-label="方向">
        <button
          type="button"
          role="tab"
          class="tcf__dir-btn tcf__dir-btn--long"
          :class="{ 'tcf__dir-btn--on': positionSide === 'LONG' }"
          :aria-selected="positionSide === 'LONG'"
          @click="emit('update:positionSide', 'LONG')"
        >
          {{ dirLongLabel }}
        </button>
        <button
          type="button"
          role="tab"
          class="tcf__dir-btn tcf__dir-btn--short"
          :class="{ 'tcf__dir-btn--on': positionSide === 'SHORT' }"
          :aria-selected="positionSide === 'SHORT'"
          @click="emit('update:positionSide', 'SHORT')"
        >
          {{ dirShortLabel }}
        </button>
      </div>

      <div class="tcf__otypes" role="tablist" aria-label="委托类型">
        <button
          type="button"
          class="tcf__ot-btn"
          :class="{ 'tcf__ot-btn--on': formType === 'LIMIT' }"
          @click="setOrderType('LIMIT')"
        >
          限价
        </button>
        <button
          type="button"
          class="tcf__ot-btn"
          :class="{ 'tcf__ot-btn--on': formType === 'MARKET' }"
          @click="setOrderType('MARKET')"
        >
          市价
        </button>
      </div>
    </div>

    <div v-if="embedDeliveryLevMargin" class="tcf__del-chrome">
      <slot name="delivery-lev-margin" />
    </div>
    <p v-if="embedDeliveryLevMargin" class="tcf__hint tcf__hint--embed">{{ marginHintDisplay }}</p>

    <template v-else>
      <div class="tcf__lev-block">
        <div class="tcf__lev-head">
          <span class="tcf__muted">杠杆</span>
          <div class="tcf__lev-head-right">
            <span class="tcf__lev-num ex-num">{{ leverage }}x</span>
            <button
              type="button"
              class="tcf__lev-link"
              @click="emit('request-leverage-panel')"
            >
              调整
            </button>
          </div>
        </div>
        <input
          class="tcf__lev-range"
          type="range"
          :min="1"
          :max="maxLeverage"
          :value="leverage"
          @input="onLevRange"
        />
        <div class="tcf__lev-chips">
          <button
            v-for="lv in leverageOptions"
            :key="lv"
            type="button"
            class="tcf__lev-chip"
            :class="{ 'tcf__lev-chip--on': leverage === lv }"
            @click="emit('update:leverage', lv)"
          >
            {{ lv }}x
          </button>
        </div>
      </div>

      <div class="tcf__margin-row">
        <span class="tcf__muted">保证金模式</span>
        <div class="tcf__seg" role="tablist">
          <button
            type="button"
            class="tcf__seg-btn"
            :class="{ 'tcf__seg-btn--on': marginMode === 'CROSS' }"
            @click="emit('update:marginMode', 'CROSS')"
          >
            全仓
          </button>
          <button
            type="button"
            class="tcf__seg-btn"
            :class="{ 'tcf__seg-btn--on': marginMode === 'ISOLATED' }"
            @click="emit('update:marginMode', 'ISOLATED')"
          >
            逐仓
          </button>
        </div>
      </div>

      <p class="tcf__hint">{{ marginHintDisplay }}</p>
    </template>

    <div v-if="formType === 'LIMIT'" class="tcf__field">
      <label class="tcf__lbl" for="tcf-price">价格</label>
      <div class="tcf__input-wrap">
        <input
          id="tcf-price"
          class="tcf__input"
          type="text"
          inputmode="decimal"
          autocomplete="off"
          :value="price"
          @input="emit('update:price', ($event.target as HTMLInputElement).value)"
        />
        <span class="tcf__suffix">{{ quoteAsset }}</span>
      </div>
    </div>

    <div v-else class="tcf__ref">
      <span class="tcf__muted">标记价格</span>
      <span class="tcf__ref-val ex-num">{{ formatPrice(markPrice) }} {{ quoteAsset }}</span>
    </div>

    <div class="tcf__field">
      <label class="tcf__lbl" for="tcf-qty">数量</label>
      <div class="tcf__input-wrap">
        <input
          id="tcf-qty"
          class="tcf__input"
          type="text"
          inputmode="decimal"
          autocomplete="off"
          placeholder="请输入数量"
          :value="quantity"
          @input="emit('update:quantity', ($event.target as HTMLInputElement).value)"
        />
        <span class="tcf__suffix">{{ quoteAsset }}</span>
      </div>
    </div>

    <div class="tcf__pct">
      <button
        v-for="p in pctLevels"
        :key="p"
        type="button"
        class="tcf__pct-btn"
        @click="emit('apply-percent', p)"
      >
        {{ p }}%
      </button>
    </div>

    <div class="tcf__bal" aria-label="可用、保证金、可开与手续费">
      <div class="tcf__bal-line">
        <span class="tcf__bal-label">可用</span>
        <span class="tcf__bal-val ex-num">{{ formatPrice(availableQuote) }} {{ quoteAsset }}</span>
      </div>
      <div class="tcf__bal-line">
        <span class="tcf__bal-label">保证金</span>
        <span class="tcf__bal-val ex-num">{{ formatPrice(marginBalance) }} {{ walletAsset }}</span>
      </div>
      <div class="tcf__bal-line">
        <span class="tcf__bal-label">
          <el-tooltip placement="top" effect="dark" :show-after="180" popper-class="tcf-bal-tooltip">
            <template #content>
              {{ CONTRACT_MAX_OPEN_HINT }}
            </template>
            <span class="tcf__bal-term" tabindex="0">可开</span>
          </el-tooltip>
        </span>
        <span class="tcf__bal-val ex-num">{{ formatPrice(maxOpenNotionalUsdt) }} {{ quoteAsset }}</span>
      </div>
      <div class="tcf__bal-line">
        <span class="tcf__bal-label">
          <el-tooltip placement="top" effect="dark" :show-after="180" popper-class="tcf-bal-tooltip">
            <template #content>
              按名义金额 × 0.04%（吃单）演示估算；Maker 减免、VIP 及活动以实际成交为准。
            </template>
            <span class="tcf__bal-term" tabindex="0">预估手续费</span>
          </el-tooltip>
        </span>
        <span class="tcf__bal-val ex-num">
          <template v-if="estimatedTradingFee != null">≈ {{ formatPrice(estimatedTradingFee) }} {{ walletAsset }}</template>
          <template v-else>—</template>
        </span>
      </div>
    </div>

    <TradingOrderTpSlBlock
      field-id-prefix="tcf-tpsl"
      :enabled="tpSlEnabled"
      :take-profit-price="tpPriceInput"
      :stop-loss-price="slPriceInput"
      @update:enabled="emit('update:tpSlEnabled', $event)"
      @update:take-profit-price="emit('update:tpPriceInput', $event)"
      @update:stop-loss-price="emit('update:slPriceInput', $event)"
    />

    <p v-if="submitting" id="tcf-state-hint" class="tcf__soft-hint" role="status">订单提交中，请稍候…</p>
    <p v-else-if="loading" id="tcf-state-hint" class="tcf__soft-hint" role="status">
      合约行情加载中，下单按钮暂时不可用。
    </p>

    <p v-if="primaryHint" id="tcf-validate-hint" class="tcf__err" role="alert">{{ primaryHint }}</p>

    <button
      type="button"
      class="tcf__submit"
      :class="primaryClass"
      :disabled="loading || submitting || !validation.valid"
      :aria-describedby="submitAriaDescribedBy"
      @click="emit('submit')"
    >
      <span v-if="submitting">提交中…</span>
      <span v-else>{{ orderActionLine }}</span>
    </button>

    <p class="tcf__foot">实际成交、杠杆与手续费以撮合及交易所规则为准。</p>
  </section>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.tcf {
  box-sizing: border-box;
  border: 1px solid color-mix(in srgb, var(--ex-info) 22%, transparent);
  border-radius: $radius-md;
  background: var(--ex-tcf-surface);
  padding: $space-3;
  box-shadow: var(--ex-tcf-shadow);
  flex-shrink: 0;
  min-height: min-content;
}

.tcf__soft-hint {
  margin: 0 0 $space-2;
  font-size: $font-size-xs;
  line-height: 1.45;
  color: var(--ex-warning);
  padding: $space-2 $space-3;
  border-radius: $radius-sm;
  background: var(--ex-warning-bg);
  border: 1px solid color-mix(in srgb, var(--ex-warning) 22%, transparent);
}

/* 方向 + 委托类型：行距与列距统一为 $space-2 */
.tcf__primary-actions {
  display: flex;
  flex-direction: column;
  gap: $space-2;
  margin-bottom: $space-3;
}

.tcf__dir {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $space-2;
}

.tcf__dir-btn {
  padding: $space-2;
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  border: 1px solid $color-border;
  border-radius: $radius-sm;
  cursor: pointer;
  background: $color-bg-base;
  color: $color-text-tertiary;

  &--long.tcf__dir-btn--on {
    color: var(--ex-on-brand);
    border-color: rgba(14, 203, 129, 0.45);
    background: $color-rise;
  }

  &--short.tcf__dir-btn--on {
    color: #fff;
    border-color: rgba(246, 70, 93, 0.45);
    background: $color-fall;
  }
}

.tcf__otypes {
  display: flex;
  width: 100%;
  gap: $space-2;
}

.tcf__del-chrome {
  display: flex;
  width: 100%;
  justify-content: flex-start;
  align-items: center;
  gap: $space-2;
  flex-wrap: wrap;
  margin-bottom: $space-3;
  min-height: 28px;
}

.tcf__ot-btn {
  flex: 1 1 0;
  min-width: 0;
  padding: $space-2 $space-1;
  font-size: 11px;
  font-weight: $font-weight-semibold;
  color: $color-text-secondary;
  background: var(--ex-surface-inset);
  border: 1px solid $color-border;
  border-radius: $radius-sm;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;

  &--on {
    border-color: rgba(48, 132, 252, 0.5);
    color: #9ec0ff;
  }
}

.tcf__lev-block {
  margin-bottom: $space-3;
}

.tcf__lev-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $space-1;
}

.tcf__lev-head-right {
  display: flex;
  align-items: center;
  gap: $space-2;
}

.tcf__lev-num {
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  color: #9ec0ff;
}

.tcf__lev-link {
  padding: 2px $space-2;
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  color: #7aa7ff;
  background: rgba(48, 132, 252, 0.12);
  border: 1px solid rgba(48, 132, 252, 0.28);
  border-radius: $radius-sm;
  cursor: pointer;

  &:hover {
    border-color: rgba(48, 132, 252, 0.45);
    color: #b6d0ff;
  }
}

.tcf__lev-range {
  width: 100%;
  accent-color: #3084fc;
  margin-bottom: $space-2;
}

.tcf__lev-chips {
  display: flex;
  flex-wrap: wrap;
  gap: $space-1;
}

.tcf__lev-chip {
  padding: 4px $space-2;
  font-size: 10px;
  font-weight: $font-weight-semibold;
  color: $color-text-tertiary;
  background: var(--ex-surface-inset);
  border: 1px solid $color-border;
  border-radius: $radius-sm;
  cursor: pointer;

  &--on {
    border-color: rgba(48, 132, 252, 0.5);
    color: #9ec0ff;
  }
}

.tcf__margin-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-3;
  margin-bottom: $space-2;
}

.tcf__seg {
  display: flex;
  border: 1px solid $color-border;
  border-radius: $radius-sm;
  overflow: hidden;
}

.tcf__seg-btn {
  padding: $space-1 $space-3;
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  border: none;
  background: var(--ex-panel-sunken);
  color: $color-text-tertiary;
  cursor: pointer;

  &--on {
    background: rgba(48, 132, 252, 0.2);
    color: #b6d0ff;
  }
}

.tcf__muted {
  font-size: $font-size-xs;
  color: $color-text-tertiary;
}

.tcf__hint {
  margin: 0 0 $space-3;
  font-size: 10px;
  line-height: 1.45;
  color: $color-text-tertiary;
  white-space: pre-line;
}

.tcf__hint--embed {
  margin-top: -2px;
}

.tcf__field {
  margin-bottom: $space-3;
}

.tcf__field--inline {
  flex: 1;
  margin-bottom: 0;
}

.tcf__lbl {
  display: block;
  margin-bottom: $space-1;
  font-size: $font-size-xs;
  font-weight: $font-weight-medium;
  color: $color-text-tertiary;
}

.tcf__input-wrap {
  display: flex;
  align-items: center;
  border: 1px solid $color-border-strong;
  border-radius: $radius-sm;
  /* 较页面底台略抬升，避免比卡片底还黑的「深井」感 */
  background: var(--ex-bg-surface);
  min-height: 40px;
  padding-right: $space-2;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;

  &:focus-within {
    border-color: rgba(48, 132, 252, 0.45);
    box-shadow: 0 0 0 1px rgba(48, 132, 252, 0.12);
  }
}

.tcf__input {
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  padding: 0 $space-3;
  height: 38px;
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

.tcf__input--sm {
  border: 1px solid $color-border;
  border-radius: $radius-sm;
  padding: $space-1 $space-2;
  height: auto;
  width: 100%;
}

.tcf__suffix {
  font-size: $font-size-xs;
  color: $color-text-tertiary;
}

.tcf__ref {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $space-3;
  padding: $space-2 $space-3;
  border-radius: $radius-sm;
  background: var(--ex-surface-inset);
  border: 1px solid var(--ex-border-subtle);
}

.tcf__ref-val {
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  color: #9ec0ff;
}

.tcf__pct {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: $space-1;
  margin-bottom: $space-2;
}

.tcf__bal {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: $space-3;
  padding: $space-2 0;
  border-top: 1px solid var(--ex-border-subtle);
  font-size: $font-size-xs;
}

.tcf__bal-line {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: $space-2;
}

.tcf__bal-label {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4px;
  color: $color-text-tertiary;
}

.tcf__bal-term {
  cursor: help;
  border-bottom: 1px dotted color-mix(in srgb, $color-text-tertiary 55%, transparent);
}

.tcf__bal-val {
  color: $color-text-primary;
  font-weight: $font-weight-medium;
  text-align: right;
}

.tcf__pct-btn {
  padding: $space-2 0;
  font-size: 10px;
  font-weight: $font-weight-semibold;
  color: $color-text-secondary;
  background: var(--ex-fill-ghost);
  border: 1px solid $color-border;
  border-radius: $radius-sm;
  cursor: pointer;

  &:hover {
    border-color: rgba(48, 132, 252, 0.35);
    color: #9ec0ff;
  }
}

.tcf__err {
  margin: 0 0 $space-2;
  font-size: $font-size-xs;
  color: $color-fall;
  line-height: 1.4;
}

.tcf__submit {
  width: 100%;
  min-height: 48px;
  border: none;
  border-radius: $radius-sm;
  font-size: $font-size-md;
  font-weight: $font-weight-bold;
  cursor: pointer;
  margin-bottom: $space-2;
  letter-spacing: 0.02em;
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

  &--long {
    color: var(--ex-on-brand);
    background: $color-rise;
  }

  &--short {
    color: #fff;
    background: $color-fall;
  }
}

.tcf__foot {
  margin: 0;
  font-size: 10px;
  line-height: 1.45;
  color: $color-text-tertiary;
}

.ex-num {
  font-family: $font-family-mono;
  font-variant-numeric: tabular-nums;
}
</style>

<style lang="scss">
/* el-tooltip 挂载在 body，与现货 sof-bal-tooltip 一致 */
.tcf-bal-tooltip.el-popper.is-dark,
.tcf-bal-tooltip.el-popper[data-popper-placement] {
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
