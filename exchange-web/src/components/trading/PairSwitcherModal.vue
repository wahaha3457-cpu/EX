<script setup lang="ts">
/**
 * 交易对搜索/切换弹窗（Binance/OKX 类终端）：搜索、分类 Tab、热门横条、主表格。
 * 数据由父级或 Pinia 注入；本组件只做展示、过滤与交互，不内嵌 WebSocket。
 */
import { computed, ref, shallowRef, watch } from 'vue'
import type { MarketTickerRow } from '@/types/market'
import type {
  PairSwitcherModalTab,
  PairSwitcherPageContext,
  PairSwitcherSelectPayload,
  PairSwitcherToggleFavoritePayload,
} from '@/types/pairSwitcherModal'
import { filterPairSwitcherModalRows } from '@/composables/pairSwitcher/filterPairSwitcherModalRows'
import { pairWatchKey } from '@/composables/pairSwitcher/pairWatchKey'
import { formatCompact, formatPct, formatPrice } from '@/utils/format/tradingDisplay'

const EMPTY_WL = new Set<string>()

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    /** 路由口径：现货 `BTC_USDT`，永续 `BTCUSDT` */
    currentRouteSymbol: string
    pageContext: PairSwitcherPageContext
    /** 全量或当前订阅池（WS 推送时建议原地 mutate 行字段，避免整表换引用） */
    rows: readonly MarketTickerRow[]
    /** 热门横条数据源（通常按成交额 Top N） */
    hotRows: readonly MarketTickerRow[]
    loading?: boolean
    watchlistKeys?: ReadonlySet<string> | undefined
    defaultTab?: PairSwitcherModalTab
    showHotStrip?: boolean
    /** 自选星标是否可点（未登录可 false，仅展示） */
    favoriteEnabled?: boolean
  }>(),
  {
    loading: false,
    defaultTab: undefined,
    showHotStrip: true,
    favoriteEnabled: true,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'select', payload: PairSwitcherSelectPayload): void
  (e: 'toggle-favorite', payload: PairSwitcherToggleFavoritePayload): void
}>()

const TAB_DEF: { id: PairSwitcherModalTab; label: string }[] = [
  { id: 'WATCHLIST', label: '自选' },
  { id: 'SPOT', label: '现货' },
  { id: 'CONTRACT_USDT', label: 'U 本位' },
  { id: 'HOT', label: '热门' },
]

function defaultTabForContext(ctx: PairSwitcherPageContext): PairSwitcherModalTab {
  return ctx === 'futures' ? 'CONTRACT_USDT' : 'SPOT'
}

const activeTab = ref<PairSwitcherModalTab>(defaultTabForContext(props.pageContext))
const searchInput = ref('')
const debouncedQuery = shallowRef('')

let debounceTimer: ReturnType<typeof setTimeout> | null = null
watch(searchInput, (q) => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    debouncedQuery.value = q
    debounceTimer = null
  }, 150)
})

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      searchInput.value = ''
      debouncedQuery.value = ''
      activeTab.value = props.defaultTab ?? defaultTabForContext(props.pageContext)
    }
  },
)

watch(
  () => props.pageContext,
  (ctx) => {
    if (!props.modelValue) activeTab.value = props.defaultTab ?? defaultTabForContext(ctx)
  },
)

const wl = computed(() => props.watchlistKeys ?? EMPTY_WL)

const filteredRows = computed(() =>
  filterPairSwitcherModalRows(props.rows, activeTab.value, debouncedQuery.value, wl.value),
)

function close() {
  emit('update:modelValue', false)
}

function onSelectRow(row: MarketTickerRow) {
  const payload: PairSwitcherSelectPayload = { row, pageContext: props.pageContext }
  emit('select', payload)
}

function onToggleFavorite(row: MarketTickerRow, ev: MouseEvent) {
  ev.stopPropagation()
  if (!props.favoriteEnabled) return
  const payload: PairSwitcherToggleFavoritePayload = { row }
  emit('toggle-favorite', payload)
}

function isFavorite(row: MarketTickerRow): boolean {
  return wl.value.has(pairWatchKey(row))
}

function isActiveRow(row: MarketTickerRow): boolean {
  return row.routeSymbol === props.currentRouteSymbol
}

function changeClass(pct: number): string {
  if (!Number.isFinite(pct) || pct === 0) return 'psm__chg--flat'
  return pct > 0 ? 'psm__chg--up' : 'psm__chg--down'
}

function onKeydown(ev: KeyboardEvent) {
  if (ev.key === 'Escape') close()
}

watch(
  () => props.modelValue,
  (v) => {
    if (v) document.addEventListener('keydown', onKeydown)
    else document.removeEventListener('keydown', onKeydown)
  },
)

const hotStripItems = computed(() => props.hotRows.slice(0, 12))
const showHotSection = computed(() => props.showHotStrip && hotStripItems.value.length > 0)
</script>

<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="psm-overlay"
      role="presentation"
      aria-hidden="false"
      @click.self="close"
    >
      <div
        class="psm"
        :class="{ 'psm--no-favorite': !favoriteEnabled }"
        role="dialog"
        aria-modal="true"
        aria-label="搜索并切换交易对"
        @click.stop
      >
        <header class="psm__head">
          <h2 class="psm__title">交易对</h2>
          <button type="button" class="psm__close" aria-label="关闭" @click="close">×</button>
        </header>

        <div class="psm__search">
          <span class="psm__search-icon" aria-hidden="true">⌕</span>
          <input
            v-model="searchInput"
            class="psm__search-input"
            type="search"
            autocomplete="off"
            spellcheck="false"
            placeholder="搜索币种 / 交易对（如 BTC、ETH、SOL）"
            aria-label="搜索交易对"
          />
        </div>

        <nav class="psm__tabs" aria-label="交易对分类">
          <button
            v-for="t in TAB_DEF"
            :key="t.id"
            type="button"
            class="psm__tab"
            :class="{ 'psm__tab--on': activeTab === t.id }"
            :aria-pressed="activeTab === t.id"
            @click="activeTab = t.id"
          >
            {{ t.label }}
          </button>
        </nav>

        <section v-if="showHotSection" class="psm__hot" aria-label="热门交易对">
          <div class="psm__hot-head">
            <span class="psm__hot-title">热门</span>
            <span class="psm__hot-sub">按成交额与活跃度</span>
          </div>
          <div class="psm__hot-scroll">
            <button
              v-for="h in hotStripItems"
              :key="`hot-${h.id}`"
              type="button"
              class="psm__hot-card"
              :class="{ 'psm__hot-card--on': isActiveRow(h) }"
              @click="onSelectRow(h)"
            >
              <span class="psm__hot-pair">{{ h.baseAsset }}</span>
              <span class="psm__hot-price ex-num">{{ formatPrice(h.lastPrice) }}</span>
              <span class="ex-num" :class="changeClass(h.changePct)">{{ formatPct(h.changePct) }}</span>
            </button>
          </div>
        </section>

        <div class="psm__grid-head">
          <span v-if="favoriteEnabled" class="psm__col psm__col--star" aria-hidden="true" />
          <span class="psm__col psm__col--pair">交易对</span>
          <span class="psm__col psm__col--price">最新价</span>
          <span class="psm__col psm__col--chg">24h 涨跌</span>
          <span class="psm__col psm__col--vol">24h 额 (USDT)</span>
        </div>

        <div class="psm__grid-body" role="listbox" aria-label="交易对列表">
          <div v-if="loading" class="psm__state">加载中…</div>
          <div v-else-if="filteredRows.length === 0" class="psm__state">暂无数据</div>
          <template v-else>
            <div
              v-for="row in filteredRows"
              :key="row.id"
              v-memo="[
                row.id,
                row.lastPrice,
                row.changePct,
                row.quoteVolume,
                row.volumeBase,
                currentRouteSymbol,
                isFavorite(row),
              ]"
              class="psm__row"
              :class="{ 'psm__row--on': isActiveRow(row) }"
              role="option"
              tabindex="0"
              :aria-selected="isActiveRow(row)"
              @click="onSelectRow(row)"
              @keydown.enter.prevent="onSelectRow(row)"
            >
              <span v-if="favoriteEnabled" class="psm__col psm__col--star">
                <button
                  type="button"
                  class="psm__fav"
                  :class="{ 'psm__fav--on': isFavorite(row) }"
                  :aria-label="isFavorite(row) ? '取消自选' : '加入自选'"
                  @click="onToggleFavorite(row, $event)"
                >
                  ★
                </button>
              </span>
              <span class="psm__col psm__col--pair">
                <span class="psm__pair-main">{{ row.displayPair }}</span>
              </span>
              <span class="psm__col psm__col--price ex-num">{{ formatPrice(row.lastPrice) }}</span>
              <span class="psm__col psm__col--chg ex-num" :class="changeClass(row.changePct)">
                {{ formatPct(row.changePct) }}
              </span>
              <span class="psm__col psm__col--vol ex-num">{{ formatCompact(row.quoteVolume) }}</span>
            </div>
          </template>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.psm-overlay {
  position: fixed;
  inset: 0;
  z-index: 500;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: $space-8 $space-4;
  background: var(--ex-overlay-backdrop);
}

.psm {
  width: min(920px, 100%);
  max-height: min(720px, calc(100vh - 48px));
  display: flex;
  flex-direction: column;
  border-radius: $radius-lg;
  border: 1px solid $color-border-strong;
  background: var(--ex-pair-modal-surface);
  box-shadow: var(--ex-modal-shadow-elevated), 0 0 0 1px var(--ex-divider-on-white) inset;
}

.psm__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $space-4 $space-5;
  border-bottom: 1px solid $color-border;
}

.psm__title {
  margin: 0;
  font-size: $font-size-lg;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
  letter-spacing: 0.02em;
}

.psm__close {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: $radius-sm;
  background: transparent;
  color: $color-text-tertiary;
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;

  &:hover {
    color: $color-text-primary;
    background: var(--ex-fill-hover-subtle);
  }
}

.psm__search {
  display: flex;
  align-items: center;
  gap: $space-2;
  margin: $space-4 $space-5 0;
  padding: 0 $space-3;
  border-radius: $radius-md;
  border: 1px solid $color-border;
  background: $color-bg-base;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;

  &:focus-within {
    border-color: rgba(240, 185, 11, 0.45);
    box-shadow: 0 0 0 1px rgba(240, 185, 11, 0.12);
  }
}

.psm__search-icon {
  font-size: $font-size-lg;
  color: $color-text-tertiary;
  user-select: none;
}

.psm__search-input {
  flex: 1;
  min-width: 0;
  height: 40px;
  border: none;
  background: transparent;
  font-size: $font-size-md;
  color: $color-text-primary;
  outline: none;

  &::placeholder {
    color: $color-text-tertiary;
  }
}

.psm__tabs {
  display: flex;
  align-items: center;
  gap: $space-1;
  margin: $space-3 $space-5 0;
  padding-bottom: $space-2;
  border-bottom: 1px solid var(--ex-border-subtle);
}

.psm__tab {
  position: relative;
  padding: $space-2 $space-3;
  border: none;
  border-radius: $radius-sm;
  background: transparent;
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  color: $color-text-tertiary;
  cursor: pointer;
  transition: color 0.15s ease, background 0.15s ease;

  &:hover {
    color: $color-text-secondary;
    background: var(--ex-fill-ghost);
  }

  &--on {
    color: $color-text-primary;

    &::after {
      content: '';
      position: absolute;
      left: $space-3;
      right: $space-3;
      bottom: -$space-2 - 1px;
      height: 2px;
      border-radius: 2px;
      background: $color-brand;
    }
  }
}

.psm__hot {
  margin: $space-4 $space-5 0;
  padding: $space-3;
  border-radius: $radius-md;
  border: 1px solid var(--ex-border-subtle);
  background: var(--ex-panel-sunken);
}

.psm__hot-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: $space-2;
}

.psm__hot-title {
  font-size: $font-size-xs;
  font-weight: $font-weight-bold;
  color: $color-text-secondary;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.psm__hot-sub {
  font-size: $font-size-xs;
  color: $color-text-tertiary;
}

.psm__hot-scroll {
  display: flex;
  gap: $space-2;
  overflow-x: auto;
  padding-bottom: 2px;
  scrollbar-width: thin;

  &::-webkit-scrollbar {
    height: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: $color-border-strong;
    border-radius: 4px;
  }
}

.psm__hot-card {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  min-width: 112px;
  padding: $space-2 $space-3;
  border-radius: $radius-sm;
  border: 1px solid $color-border;
  background: $color-bg-elevated;
  cursor: pointer;
  text-align: left;
  transition: border-color 0.15s ease, background 0.15s ease, transform 0.12s ease;

  &:hover {
    border-color: rgba(240, 185, 11, 0.35);
    background: rgba(240, 185, 11, 0.06);
  }

  &--on {
    border-color: rgba(240, 185, 11, 0.55);
    background: rgba(240, 185, 11, 0.1);
  }
}

.psm__hot-pair {
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  font-family: $font-family-mono;
  color: $color-text-primary;
}

.psm__hot-price {
  font-size: $font-size-xs;
  color: $color-text-secondary;
}

.psm__grid-head,
.psm__row {
  display: grid;
  grid-template-columns: 28px minmax(140px, 1.4fr) minmax(100px, 1fr) minmax(88px, 0.9fr) minmax(
      100px,
      1fr
    );
  align-items: center;
  column-gap: $space-2;
  padding-left: $space-5;
  padding-right: $space-5;
}

.psm--no-favorite .psm__grid-head,
.psm--no-favorite .psm__row {
  grid-template-columns: minmax(140px, 1.4fr) minmax(100px, 1fr) minmax(88px, 0.9fr) minmax(100px, 1fr);
}

.psm__grid-head {
  padding-top: $space-4;
  padding-bottom: $space-2;
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  color: $color-text-tertiary;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  border-bottom: 1px solid $color-border;
}

.psm__grid-body {
  flex: 1;
  min-height: 200px;
  overflow: auto;
  padding: $space-1 0 $space-4;
}

.psm__row {
  width: 100%;
  margin: 0;
  border: none;
  background: transparent;
  font: inherit;
  color: inherit;
  cursor: pointer;
  text-align: left;
  padding-top: $space-2;
  padding-bottom: $space-2;
  border-bottom: 1px solid var(--ex-border-subtle);
  transition: background 0.12s ease;
  outline: none;

  &:hover {
    background: var(--ex-fill-ghost);
  }

  &:focus-visible {
    box-shadow: inset 0 0 0 1px rgba(240, 185, 11, 0.45);
  }

  &--on {
    background: rgba(240, 185, 11, 0.07);
  }
}

.psm__col--star {
  display: flex;
  justify-content: center;
}

.psm__pair-main {
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  font-family: $font-family-mono;
  color: $color-text-primary;
}

.psm__col--price,
.psm__col--chg,
.psm__col--vol {
  font-size: $font-size-sm;
  font-variant-numeric: tabular-nums;
}

.psm__fav {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  border-radius: $radius-sm;
  font-size: 14px;
  line-height: 1;
  color: $color-text-tertiary;
  background: transparent;
  cursor: pointer;
  user-select: none;

  &--on {
    color: $color-brand;
  }

  &:hover {
    color: $color-brand-hover;
    background: var(--ex-fill-hover-subtle);
  }
}

.psm__chg--up {
  color: $color-rise;
}

.psm__chg--down {
  color: $color-fall;
}

.psm__chg--flat {
  color: $color-text-tertiary;
}

.psm__state {
  padding: $space-8 $space-5;
  text-align: center;
  font-size: $font-size-sm;
  color: $color-text-tertiary;
}

.ex-num {
  font-family: $font-family-mono;
  font-variant-numeric: tabular-nums;
}
</style>
