<script setup lang="ts">
/**
 * ## 组件职责
 * 展示当前交易对核心行情与（合约）衍生品字段，纯展示 + 明确交互出口；
 * 不包含下单、路由跳转实现，由父级或插槽注入。
 *
 * ## 在页面中的位置
 * 位于现货 / 合约交易页主布局最上方，全宽信息条，承接 WS ticker 高频刷新。
 *
 * ## WebSocket / Pinia 接入建议
 * - 在 store 中维护一份 `TradingPairHeaderMarketSnapshot` 兼容对象，WS 推送时 mutate 字段或 `Object.assign`；
 * - 切换交易对时先 `loading=true`，REST bootstrap 后再关；
 * - 资金费倒计时建议在父组件用 `nextFundingTime` 与 `requestAnimationFrame`/`setInterval(1s)` 生成 `fundingCountdownDisplay` 传入，避免本组件内多实例定时器。
 *
 * ## 性能
 * - 指标区使用 `v-memo` 依赖关键数值字符串，减少父组件无关重绘时的子树更新；
 * - 高频场景优先复用同一 ticker 对象引用并 mutate 属性。
 */
import { computed } from 'vue'
import type {
  TradingPairHeaderMarginMode,
  TradingPairHeaderMarketSnapshot,
} from '@/types/tradingPairHeader'
import {
  formatCompact,
  formatFundingRatePercent,
  formatPct,
  formatPrice,
  formatSignedQuoteChange,
} from '@/utils/format/tradingDisplay'

const props = withDefaults(
  defineProps<{
    mode: 'spot' | 'futures' | 'delivery'
    /** 已格式化的交易对展示名，如 BTC/USDT */
    symbolDisplay: string
    baseAsset: string
    quoteAsset: string
    loading?: boolean
    ticker: TradingPairHeaderMarketSnapshot | null
    /** 合约：杠杆倍数 */
    leverage?: number
    /** 合约：保证金模式 */
    marginMode?: TradingPairHeaderMarginMode
    /** 合约：资金费倒计时展示文案（由父组件计算） */
    fundingCountdownDisplay?: string
    favoriteVisible?: boolean
    isFavorite?: boolean
    /** 自选为预留能力时可禁用 */
    favoriteDisabled?: boolean
    /** 左上角产品标签，如「现货」「U 本位永续」 */
    productTag?: string
  }>(),
  {
    loading: false,
    favoriteVisible: true,
    isFavorite: false,
    favoriteDisabled: false,
    fundingCountdownDisplay: undefined,
  },
)

const emit = defineEmits<{
  (e: 'toggle-favorite'): void
  (e: 'switch-pair'): void
  (e: 'open-market'): void
  (e: 'click-last-price', price: number): void
}>()

const tagText = computed(() => {
  if (props.productTag) return props.productTag
  if (props.mode === 'delivery') return 'USDT 交割'
  return props.mode === 'futures' ? 'U 本位永续' : '现货'
})

const marginLabel = computed(() => {
  if (props.marginMode === 'ISOLATED') return '逐仓'
  if (props.marginMode === 'CROSS') return '全仓'
  return '—'
})

const showFuturesExtras = computed(
  () =>
    (props.mode === 'futures' || props.mode === 'delivery') &&
    props.leverage != null &&
    props.marginMode != null,
)

const tickerMemoKey = computed(() => {
  if (!props.ticker) return '∅'
  const t = props.ticker
  return [
    t.lastPrice,
    t.changePct24h,
    t.changeQuote24h,
    t.high24h,
    t.low24h,
    t.volume24hBase,
    t.quoteVolume24h,
    t.markPrice ?? '',
    t.indexPrice ?? '',
    t.fundingRate ?? '',
    t.basisPct ?? '',
    t.deliveryTime ?? '',
    t.settlementFundingRate ?? '',
    props.fundingCountdownDisplay ?? '',
  ].join('|')
})

function formatDeliveryUtc(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  const h = String(d.getUTCHours()).padStart(2, '0')
  const min = String(d.getUTCMinutes()).padStart(2, '0')
  return `${y}-${m}-${day} ${h}:${min} UTC`
}

function onFavClick() {
  if (props.favoriteDisabled) return
  emit('toggle-favorite')
}

function onLastPriceClick() {
  if (!props.ticker) return
  emit('click-last-price', props.ticker.lastPrice)
}
</script>

<template>
  <header class="tphb" aria-label="交易对行情信息">
    <div class="tphb__top">
      <div class="tphb__left">
        <template v-if="$slots['pair-toolbar']">
          <div class="tphb__pair-toolbar">
            <slot name="pair-toolbar" />
          </div>
        </template>
        <template v-else>
          <div class="tphb__pair-row">
            <slot name="pair-selector">
              <button type="button" class="tphb__pair-fallback" @click="emit('switch-pair')">
                {{ symbolDisplay }}
              </button>
            </slot>
            <span class="tphb__tag">{{ tagText }}</span>
            <button
              v-if="favoriteVisible"
              type="button"
              class="tphb__fav"
              :class="{ 'tphb__fav--on': isFavorite }"
              :disabled="favoriteDisabled"
              :aria-pressed="isFavorite"
              :aria-label="favoriteDisabled ? '自选（预留）' : isFavorite ? '取消自选' : '加入自选'"
              @click="onFavClick"
            >
              {{ isFavorite ? '★' : '☆' }}
            </button>
            <button type="button" class="tphb__link" @click="emit('open-market')">行情中心</button>
          </div>
        </template>
        <p v-if="loading" class="tphb__loading" aria-live="polite">加载行情…</p>
      </div>

      <div v-if="$slots['futures-controls']" class="tphb__futures-ctrl">
        <slot name="futures-controls" />
      </div>
      <div v-else-if="showFuturesExtras" class="tphb__futures-badges">
        <span class="tphb__lev ex-num">{{ leverage }}x</span>
        <span class="tphb__sep" aria-hidden="true">·</span>
        <span class="tphb__mm">{{ marginLabel }}</span>
      </div>
    </div>

    <dl v-if="ticker" v-memo="[tickerMemoKey]" class="tphb__metrics">
      <div class="tphb__price-head">
        <div class="tphb__metric tphb__metric--hero">
          <dt class="tphb__dt">最新价</dt>
          <dd class="tphb__dd">
            <button
              type="button"
              class="tphb__last ex-num"
              :class="ticker.changePct24h >= 0 ? 'tphb__last--up' : 'tphb__last--down'"
              @click="onLastPriceClick"
            >
              {{ formatPrice(ticker.lastPrice) }}
            </button>
            <span class="tphb__quote">{{ quoteAsset }}</span>
          </dd>
        </div>

        <div class="tphb__chg-col">
          <div class="tphb__metric tphb__metric--chg-compact">
            <dt class="tphb__dt">24h 涨跌额</dt>
            <dd
              class="tphb__dd ex-num"
              :class="ticker.changeQuote24h >= 0 ? 'tphb__chg--up' : 'tphb__chg--down'"
            >
              {{ formatSignedQuoteChange(ticker.changeQuote24h) }}
            </dd>
          </div>
          <div class="tphb__metric tphb__metric--chg-compact">
            <dt class="tphb__dt">24h 涨跌幅</dt>
            <dd
              class="tphb__dd ex-num"
              :class="ticker.changePct24h >= 0 ? 'tphb__chg--up' : 'tphb__chg--down'"
            >
              {{ formatPct(ticker.changePct24h) }}
            </dd>
          </div>
        </div>
      </div>

      <div
        v-if="(mode === 'futures' || mode === 'delivery') && ticker.markPrice != null"
        class="tphb__metric tphb__hide-narrow"
      >
        <dt class="tphb__dt">标记价格</dt>
        <dd class="tphb__dd ex-num">{{ formatPrice(ticker.markPrice) }}</dd>
      </div>
      <div
        v-if="(mode === 'futures' || mode === 'delivery') && ticker.indexPrice != null"
        class="tphb__metric tphb__hide-narrow"
      >
        <dt class="tphb__dt">指数价格</dt>
        <dd class="tphb__dd tphb__dd--muted ex-num">{{ formatPrice(ticker.indexPrice) }}</dd>
      </div>

      <div
        v-if="mode === 'delivery' && ticker.basisPct != null"
        class="tphb__metric tphb__hide-narrow"
      >
        <dt class="tphb__dt">基差</dt>
        <dd
          class="tphb__dd ex-num"
          :class="ticker.basisPct >= 0 ? 'tphb__chg--up' : 'tphb__chg--down'"
        >
          {{ formatPct(ticker.basisPct) }}
        </dd>
      </div>

      <div class="tphb__metric tphb__hide-xs">
        <dt class="tphb__dt">24h 高</dt>
        <dd class="tphb__dd ex-num">{{ formatPrice(ticker.high24h) }}</dd>
      </div>
      <div class="tphb__metric tphb__hide-xs">
        <dt class="tphb__dt">24h 低</dt>
        <dd class="tphb__dd ex-num">{{ formatPrice(ticker.low24h) }}</dd>
      </div>

      <div class="tphb__metric tphb__hide-sm">
        <dt class="tphb__dt">24h 量({{ baseAsset }})</dt>
        <dd class="tphb__dd ex-num">{{ formatCompact(ticker.volume24hBase) }}</dd>
      </div>

      <div class="tphb__metric">
        <dt class="tphb__dt">24h 额({{ quoteAsset }})</dt>
        <dd class="tphb__dd ex-num">{{ formatCompact(ticker.quoteVolume24h) }}</dd>
      </div>

      <div
        v-if="mode === 'futures' && ticker.fundingRate != null"
        class="tphb__metric tphb__metric--wide"
      >
        <dt class="tphb__dt">资金费率 / 倒计时</dt>
        <dd class="tphb__dd tphb__fund">
          <span class="ex-num">{{ formatFundingRatePercent(ticker.fundingRate) }}</span>
          <span v-if="fundingCountdownDisplay" class="tphb__fund-sep" aria-hidden="true">·</span>
          <span v-if="fundingCountdownDisplay" class="tphb__cd ex-num">{{ fundingCountdownDisplay }}</span>
        </dd>
      </div>

      <div
        v-if="mode === 'delivery' && ticker.deliveryTime"
        class="tphb__metric tphb__metric--wide"
      >
        <dt class="tphb__dt">交割时间 / 倒计时</dt>
        <dd class="tphb__dd tphb__fund">
          <span class="ex-num tphb__del-time">{{ formatDeliveryUtc(ticker.deliveryTime) }}</span>
          <span v-if="fundingCountdownDisplay" class="tphb__fund-sep" aria-hidden="true">·</span>
          <span v-if="fundingCountdownDisplay" class="tphb__cd ex-num">{{ fundingCountdownDisplay }}</span>
        </dd>
      </div>

      <div
        v-if="mode === 'delivery' && ticker.settlementFundingRate != null"
        class="tphb__metric tphb__hide-narrow"
      >
        <dt class="tphb__dt">资金费率（交割）</dt>
        <dd class="tphb__dd ex-num">{{ formatFundingRatePercent(ticker.settlementFundingRate) }}</dd>
      </div>
    </dl>

    <div v-else-if="!loading" class="tphb__empty" aria-hidden="true">—</div>
  </header>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.tphb {
  display: flex;
  flex-direction: column;
  gap: $space-2;
  padding: $space-2 $space-4;
  margin-bottom: $space-2;
  border: 1px solid $color-border;
  border-radius: $radius-md;
  background: var(--ex-card-surface);
  box-shadow: var(--ex-shadow-inset-well), var(--ex-shadow-dropdown);
}

/* 与下方指标行 tphb__metrics 的列间距一致（gap 横向 $space-5），避免 space-between + flex:1 拉出巨大空白 */
.tphb__top {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: $space-5;
  min-height: 36px;
}

.tphb__left {
  min-width: 0;
}

.tphb__pair-toolbar {
  min-width: 0;
  width: 100%;
}

.tphb__pair-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: $space-2;
}

.tphb__pair-fallback {
  padding: 4px 10px;
  font-size: $font-size-md;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
  background: var(--ex-fill-ghost);
  border: 1px solid $color-border;
  border-radius: $radius-sm;
  cursor: pointer;
  font-family: $font-family-mono;
}

.tphb__pair-fallback:hover {
  border-color: rgba(240, 185, 11, 0.45);
  color: $color-brand;
}

.tphb__tag {
  font-size: $font-size-xs;
  padding: 2px $space-2;
  border-radius: $radius-sm;
  background: $color-brand-muted;
  color: $color-brand;
  font-weight: $font-weight-bold;
  letter-spacing: 0.02em;
}

.tphb__fav {
  width: 32px;
  height: 32px;
  border: 1px solid $color-border;
  border-radius: $radius-sm;
  background: $color-bg-base;
  color: $color-text-tertiary;
  font-size: 15px;
  line-height: 1;
  cursor: pointer;
  transition:
    color 0.15s ease,
    border-color 0.15s ease;
}

.tphb__fav:hover:not(:disabled) {
  border-color: rgba(240, 185, 11, 0.45);
  color: $color-brand;
}

.tphb__fav--on {
  color: $color-brand;
}

.tphb__fav:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.tphb__link {
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  color: $color-text-tertiary;
  background: none;
  border: none;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.tphb__link:hover {
  color: #8ab4ff;
}

.tphb__loading {
  margin: $space-1 0 0;
  font-size: $font-size-xs;
  color: $color-text-tertiary;
}

.tphb__futures-ctrl {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: $space-2;
}

.tphb__futures-badges {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: $font-size-xs;
  font-weight: $font-weight-bold;
  color: $color-text-secondary;
  padding: 4px 10px;
  border-radius: $radius-sm;
  border: 1px solid rgba(48, 132, 252, 0.28);
  background: rgba(48, 132, 252, 0.08);
}

.tphb__lev {
  color: #8ab4ff;
}

.tphb__sep {
  opacity: 0.5;
}

.tphb__metrics {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: $space-3 $space-5;
  margin: 0;
  padding-top: $space-2;
  border-top: 1px solid var(--ex-border-subtle);
}

.tphb__price-head {
  display: flex;
  width: 100%;
  flex: 1 1 100%;
  justify-content: space-between;
  align-items: flex-end;
  gap: $space-3 $space-4;
  padding-bottom: $space-2;
  margin-bottom: $space-1;
  border-bottom: 1px solid var(--ex-border-subtle);
}

.tphb__chg-col {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  flex-shrink: 0;
}

.tphb__chg-col .tphb__metric--chg-compact {
  min-width: 0;
  text-align: right;
}

.tphb__chg-col .tphb__dt {
  text-align: right;
}

.tphb__chg-col .tphb__dd {
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
}

@media (min-width: 768px) {
  .tphb__price-head {
    display: contents;
    padding: 0;
    margin: 0;
    border: none;
  }

  .tphb__chg-col {
    display: contents;
  }

  .tphb__chg-col .tphb__metric--chg-compact {
    text-align: left;
  }

  .tphb__chg-col .tphb__dt {
    text-align: left;
  }
}

.tphb__metric {
  margin: 0;
  min-width: 72px;
}

.tphb__metric--hero {
  min-width: 140px;
}

.tphb__metric--wide {
  min-width: 200px;
}

.tphb__dt {
  margin: 0 0 2px;
  font-size: 10px;
  font-weight: $font-weight-semibold;
  color: $color-text-tertiary;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.tphb__dd {
  margin: 0;
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  font-family: $font-family-mono;
  font-variant-numeric: tabular-nums;
}

.tphb__dd--muted {
  color: $color-text-secondary;
}

.tphb__last {
  padding: 0;
  margin: 0;
  font-size: 20px;
  font-weight: $font-weight-bold;
  line-height: 1.15;
  letter-spacing: -0.02em;
  font-family: $font-family-mono;
  font-variant-numeric: tabular-nums;
  background: none;
  border: none;
  cursor: pointer;
  border-bottom: 1px dashed transparent;
  transition: border-color 0.12s ease;
}

@media (max-width: 767px) {
  .tphb__metric--hero .tphb__last {
    font-size: clamp(22px, 6.2vw, 28px);
  }

  .tphb__metric--hero .tphb__quote {
    font-size: $font-size-sm;
    vertical-align: baseline;
  }
}

.tphb__last:hover {
  border-bottom-color: var(--ex-border-strong);
}

.tphb__last--up {
  color: $color-rise;
}

.tphb__last--down {
  color: $color-fall;
}

.tphb__quote {
  margin-left: 4px;
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  color: $color-text-tertiary;
}

.tphb__chg--up {
  color: $color-rise;
}

.tphb__chg--down {
  color: $color-fall;
}

.tphb__fund {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4px;
  font-size: $font-size-xs;
}

.tphb__fund-sep {
  opacity: 0.45;
}

.tphb__cd {
  font-family: $font-family-mono;
  color: $color-text-secondary;
}

.tphb__empty {
  padding: $space-3 0;
  text-align: center;
  color: $color-text-tertiary;
  font-size: $font-size-sm;
}

@media (max-width: 640px) {
  .tphb__top {
    grid-template-columns: 1fr;
    gap: $space-3;
  }
}

@media (max-width: 1100px) {
  .tphb__hide-narrow {
    display: none;
  }
}

@media (max-width: 900px) {
  .tphb__hide-sm {
    display: none;
  }
}

@media (max-width: 520px) {
  .tphb__hide-xs {
    display: none;
  }
}
</style>
