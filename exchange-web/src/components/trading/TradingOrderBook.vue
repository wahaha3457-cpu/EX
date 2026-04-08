<script setup lang="ts">
/**
 * 专业盘口：卖盘 ↑ / 中间价 / 买盘 ↓，价格·数量·累计 + 深度条。
 * 数据为只读快照；累计与深度条由 {@link buildAskViewRows} / {@link buildBidViewRows} 纯函数计算。
 */
import { computed } from 'vue'
import type { DepthLevel } from '@/types/spotTrade'
import { buildAskViewRows, buildBidViewRows } from '@/composables/orderBook/buildOrderBookView'
import { formatPrice } from '@/utils/format/number'
import { formatOrderBookQuantity } from '@/utils/format/orderBook'

const props = withDefaults(
  defineProps<{
    asks: readonly DepthLevel[]
    bids: readonly DepthLevel[]
    /** 展示档位数 */
    maxLevels?: number
    /** 最新价（涨跌颜色、中间区兜底） */
    lastPrice: number
    /** 24h 涨跌幅 %，用于方向指示；缺省不显示箭头 */
    changePct?: number | null
    baseAsset: string
    quoteAsset: string
    /** 合并价：合约标记价等；缺省用 lastPrice */
    midPrice?: number | null
    /** 中间区左侧文案 */
    midPriceLabel?: string
    /** 盘口序号（WS 对齐） */
    seq?: number | null
    loading?: boolean
    /** 基础币数量小数位 */
    quantityDecimals?: number
    /** 展示法币折算占位 */
    fiatPlaceholder?: boolean
    /** 面板标题 */
    title?: string
  }>(),
  {
    maxLevels: 14,
    changePct: null,
    midPrice: null,
    midPriceLabel: '最新',
    midPriceKind: 'last',
    seq: null,
    loading: false,
    quantityDecimals: 4,
    fiatPlaceholder: true,
    title: '盘口',
  },
)

const emit = defineEmits<{
  (e: 'select-ask', price: number): void
  (e: 'select-bid', price: number): void
}>()

const askRows = computed(() => buildAskViewRows(props.asks, props.maxLevels))
const bidRows = computed(() => buildBidViewRows(props.bids, props.maxLevels))

const displayMid = computed(() => {
  const m = props.midPrice
  if (m != null && Number.isFinite(m)) return m
  return props.lastPrice
})

const trend = computed<'up' | 'down' | 'flat'>(() => {
  const p = props.changePct
  if (p == null || !Number.isFinite(p)) return 'flat'
  if (p > 0) return 'up'
  if (p < 0) return 'down'
  return 'flat'
})

function fmtQty(n: number): string {
  return formatOrderBookQuantity(n, props.quantityDecimals)
}
</script>

<template>
  <section
    class="tob"
    :class="{ 'tob--loading': loading }"
    aria-label="订单簿深度"
  >
    <header class="tob__head">
      <h3 class="tob__title">{{ title }}</h3>
      <span v-if="seq != null" class="tob__seq">#{{ seq }}</span>
    </header>

    <div class="tob__body">
      <div class="tob__hdr" aria-hidden="true">
        <span class="tob__h-price">价格({{ quoteAsset }})</span>
        <span class="tob__h-qty">数量({{ baseAsset }})</span>
        <span class="tob__h-sum">累计({{ baseAsset }})</span>
      </div>

      <!-- 卖盘：高价 → 低价（近中间价一侧在最下） -->
      <div class="tob__asks" role="list" aria-label="卖盘">
        <button
          v-for="(row, i) in askRows"
          :key="`ask-${row.price}-${i}`"
          v-memo="[row.price, row.quantity, row.cumulative, row.depthRatio]"
          type="button"
          class="tob__row tob__row--ask"
          role="listitem"
          @click="emit('select-ask', row.price)"
        >
          <span
            class="tob__depth tob__depth--ask"
            :style="{ transform: `scaleX(${row.depthRatio})` }"
          />
          <span class="tob__price tob__price--ask ex-num">{{ formatPrice(row.price) }}</span>
          <span class="tob__qty ex-num">{{ fmtQty(row.quantity) }}</span>
          <span class="tob__cum ex-num">{{ fmtQty(row.cumulative) }}</span>
        </button>
        <div v-if="!askRows.length" class="tob__empty">—</div>
      </div>

      <div class="tob__mid" :class="`tob__mid--${trend}`">
        <div class="tob__mid-row">
          <span class="tob__mid-label">{{ midPriceLabel }}</span>
          <span v-if="trend !== 'flat'" class="tob__mid-arrow" aria-hidden="true">
            <span v-if="trend === 'up'" class="tob__tri tob__tri--up">▲</span>
            <span v-else class="tob__tri tob__tri--down">▼</span>
          </span>
          <span class="tob__mid-price ex-num">{{ formatPrice(displayMid) }}</span>
        </div>
        <div v-if="fiatPlaceholder" class="tob__mid-fiat">≈ — USD</div>
      </div>

      <!-- 买盘：高价 → 低价（近中间价在最上） -->
      <div class="tob__bids" role="list" aria-label="买盘">
        <button
          v-for="(row, i) in bidRows"
          :key="`bid-${row.price}-${i}`"
          v-memo="[row.price, row.quantity, row.cumulative, row.depthRatio]"
          type="button"
          class="tob__row tob__row--bid"
          role="listitem"
          @click="emit('select-bid', row.price)"
        >
          <span
            class="tob__depth tob__depth--bid"
            :style="{ transform: `scaleX(${row.depthRatio})` }"
          />
          <span class="tob__price tob__price--bid ex-num">{{ formatPrice(row.price) }}</span>
          <span class="tob__qty ex-num">{{ fmtQty(row.quantity) }}</span>
          <span class="tob__cum ex-num">{{ fmtQty(row.cumulative) }}</span>
        </button>
        <div v-if="!bidRows.length" class="tob__empty">—</div>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.tob {
  border: 1px solid $color-border;
  border-radius: $radius-md;
  background: var(--ex-modal-surface);
  overflow: hidden;
  position: relative;
}

.tob--loading::after {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--ex-panel-sunken);
  pointer-events: none;
}

.tob__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $space-2 $space-3;
  border-bottom: 1px solid $color-border;
  background: var(--ex-surface-inset-strong);
}

.tob__title {
  margin: 0;
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
  letter-spacing: 0.02em;
}

.tob__seq {
  font-size: $font-size-xs;
  color: $color-text-tertiary;
  font-family: $font-family-mono;
}

.tob__body {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.tob__hdr {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  padding: 6px $space-2;
  font-size: 10px;
  font-weight: $font-weight-semibold;
  color: $color-text-tertiary;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  border-bottom: 1px solid var(--ex-border-subtle);
}

.tob__h-qty,
.tob__h-sum {
  text-align: right;
}

.tob__asks {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.tob__bids {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.tob__row {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  align-items: center;
  gap: 0;
  width: 100%;
  margin: 0;
  padding: 2px $space-2;
  min-height: 22px;
  border: none;
  background: transparent;
  font-size: $font-size-xs;
  font-family: $font-family-mono;
  cursor: pointer;
  text-align: left;
  color: inherit;
  transition: background 0.1s ease;

  &:hover {
    background: var(--ex-fill-ghost);
  }
}

.tob__depth {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 100%;
  transform-origin: right center;
  pointer-events: none;
  opacity: 1;
  z-index: 0;
}

.tob__depth--ask {
  background: linear-gradient(
    90deg,
    rgba(246, 70, 93, 0.06) 0%,
    rgba(246, 70, 93, 0.22) 100%
  );
}

.tob__depth--bid {
  background: linear-gradient(
    90deg,
    rgba(14, 203, 129, 0.06) 0%,
    rgba(14, 203, 129, 0.2) 100%
  );
}

.tob__price,
.tob__qty,
.tob__cum {
  position: relative;
  z-index: 1;
  font-variant-numeric: tabular-nums;
}

.tob__qty,
.tob__cum {
  text-align: right;
  color: $color-text-secondary;
}

.tob__price--ask {
  color: $color-fall;
  font-weight: $font-weight-semibold;
}

.tob__price--bid {
  color: $color-rise;
  font-weight: $font-weight-semibold;
}

.tob__mid {
  flex-shrink: 0;
  padding: $space-2 $space-3;
  border-top: 1px solid var(--ex-border-subtle);
  border-bottom: 1px solid var(--ex-border-subtle);
  background: rgba(0, 0, 0, 0.38);
}

.tob__mid--up {
  box-shadow: inset 0 0 0 1px rgba(14, 203, 129, 0.12);
}

.tob__mid--down {
  box-shadow: inset 0 0 0 1px rgba(246, 70, 93, 0.12);
}

.tob__mid-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $space-2;
  flex-wrap: wrap;
}

.tob__mid-label {
  font-size: $font-size-xs;
  color: $color-text-tertiary;
}

.tob__mid-arrow {
  display: inline-flex;
  font-size: 10px;
  line-height: 1;
}

.tob__tri--up {
  color: $color-rise;
}

.tob__tri--down {
  color: $color-fall;
}

.tob__mid-price {
  font-size: $font-size-lg;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
  letter-spacing: 0.02em;
}

.tob__mid-fiat {
  margin-top: 4px;
  text-align: center;
  font-size: 10px;
  color: $color-text-tertiary;
  font-family: $font-family-mono;
}

.tob__empty {
  padding: $space-2;
  text-align: center;
  font-size: $font-size-xs;
  color: $color-text-tertiary;
}

.ex-num {
  font-family: $font-family-mono;
}
</style>
