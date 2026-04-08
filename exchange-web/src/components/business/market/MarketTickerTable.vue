<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { TopRight } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { RouteNames } from '@/constants/routeNames'
import type { MarketTickerRow, MarketSegment } from '@/types/market'
import { formatCompact, formatPct, formatPrice } from '@/utils/format/number'
import { resolveMarketTradeLinks } from '@/utils/market/tradeLinks'
import { useMarketStore } from '@/stores/market'
import { useMatchMedia } from '@/composables/useMatchMedia'

const props = defineProps<{
  rows: MarketTickerRow[]
  loading?: boolean
  /** 行情顶部分类：榜单类 Tab 时同步默认排序 */
  marketSegment?: MarketSegment
}>()

const router = useRouter()
const market = useMarketStore()

/** 与 breakpoints `md`(768px) 对齐：窄屏用卡片列表，避免横向微缩表格 */
const isNarrow = useMatchMedia('(max-width: 767px)')

type SortKey = 'pair' | 'last' | 'chg' | 'vol' | 'mcap'
const sortKey = ref<SortKey>('vol')
const sortDir = ref<'asc' | 'desc'>('desc')
/** 同一列连点：1→2 翻转升降序，第 3 次恢复当前 Tab 默认排序 */
const sortSameColStep = ref<1 | 2 | 3>(1)

function rowMarketCapUsdt(row: MarketTickerRow): number {
  return row.marketCapUsdt ?? Math.max(row.quoteVolume * 220, 1)
}

/** 与分类 Tab 联动的「默认」排序（第三次点击恢复至此） */
function baselineSort(): { key: SortKey; dir: 'asc' | 'desc' } {
  const seg = props.marketSegment
  if (seg === 'GAINERS') return { key: 'chg', dir: 'desc' }
  if (seg === 'LOSERS') return { key: 'chg', dir: 'asc' }
  if (seg === 'HOT') return { key: 'mcap', dir: 'desc' }
  if (seg === 'VOLUME_24H') return { key: 'vol', dir: 'desc' }
  return { key: 'vol', dir: 'desc' }
}

const sortedRows = computed(() => {
  const list = [...props.rows]
  const key = sortKey.value
  const asc = sortDir.value === 'asc'
  list.sort((a, b) => {
    if (key === 'pair') {
      const c = a.displayPair.localeCompare(b.displayPair)
      return asc ? c : -c
    }
    let va = 0
    let vb = 0
    switch (key) {
      case 'last':
        va = a.lastPrice
        vb = b.lastPrice
        break
      case 'chg':
        va = a.changePct
        vb = b.changePct
        break
      case 'vol':
        va = a.volumeBase
        vb = b.volumeBase
        break
      case 'mcap':
        va = rowMarketCapUsdt(a)
        vb = rowMarketCapUsdt(b)
        break
      default:
        return 0
    }
    if (va === vb) return a.displayPair.localeCompare(b.displayPair)
    const cmp = va - vb
    return asc ? cmp : -cmp
  })
  return list
})

/** 行情列表分页：先全量排序，再切片，保证排序语义正确 */
const PAGE_SIZE = 30
const currentPage = ref(1)

const pagedRows = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return sortedRows.value.slice(start, start + PAGE_SIZE)
})

watch(
  () => sortedRows.value.length,
  (len) => {
    const maxPage = Math.max(1, Math.ceil(len / PAGE_SIZE))
    if (currentPage.value > maxPage) currentPage.value = maxPage
  },
)

watch(
  () => props.marketSegment,
  (seg) => {
    currentPage.value = 1
    if (!seg) return
    if (seg === 'GAINERS') {
      sortKey.value = 'chg'
      sortDir.value = 'desc'
      sortSameColStep.value = 1
      return
    }
    if (seg === 'LOSERS') {
      sortKey.value = 'chg'
      sortDir.value = 'asc'
      sortSameColStep.value = 1
      return
    }
    if (seg === 'HOT') {
      sortKey.value = 'mcap'
      sortDir.value = 'desc'
      sortSameColStep.value = 1
      return
    }
    if (seg === 'VOLUME_24H') {
      sortKey.value = 'vol'
      sortDir.value = 'desc'
      sortSameColStep.value = 1
    }
  },
)

function onPageChange(p: number) {
  currentPage.value = p
}

function toggleSort(k: SortKey) {
  if (sortKey.value !== k) {
    sortKey.value = k
    sortDir.value = k === 'pair' ? 'asc' : 'desc'
    sortSameColStep.value = 1
    return
  }
  if (sortSameColStep.value === 1) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
    sortSameColStep.value = 2
    return
  }
  if (sortSameColStep.value === 2) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
    sortSameColStep.value = 3
    return
  }
  const b = baselineSort()
  sortKey.value = b.key
  sortDir.value = b.dir
  sortSameColStep.value = 1
}

/** 窄屏排序 chips：简化为当前列的方向箭头 */
function sortGlyph(k: SortKey) {
  if (sortKey.value !== k) return '↕'
  return sortDir.value === 'asc' ? '↑' : '↓'
}

function goPrimary(row: MarketTickerRow) {
  if (row.kind === 'SPOT') {
    router.push({ name: RouteNames.SpotTrade, params: { symbol: row.routeSymbol } })
  } else if (row.kind === 'DELIVERY') {
    router.push({ name: RouteNames.DeliveryContract, params: { symbol: row.routeSymbol } })
  } else {
    router.push({ name: RouteNames.ContractTrade, params: { symbol: row.routeSymbol } })
  }
}

function goSpot(e: Event, row: MarketTickerRow) {
  e.stopPropagation()
  const { spotSymbol } = resolveMarketTradeLinks(row)
  router.push({ name: RouteNames.SpotTrade, params: { symbol: spotSymbol } })
}

function goContract(e: Event, row: MarketTickerRow) {
  e.stopPropagation()
  if (row.kind === 'DELIVERY') {
    router.push({ name: RouteNames.DeliveryContract, params: { symbol: row.routeSymbol } })
    return
  }
  const { contractSymbol } = resolveMarketTradeLinks(row)
  router.push({ name: RouteNames.ContractTrade, params: { symbol: contractSymbol } })
}

function onStarClick(e: Event, row: MarketTickerRow) {
  e.stopPropagation()
  market.toggleWatchlist(row)
}
</script>

<template>
  <div class="mtable">
    <div v-if="loading" class="mtable__loading" aria-live="polite">
      <div class="mtable__skel" />
      <span>加载行情数据…</span>
    </div>

    <div v-else-if="isNarrow" class="mtable__narrow">
      <div
        v-if="sortedRows.length"
        class="mtable__mob-sort"
        role="group"
        aria-label="排序（与桌面表头一致）"
      >
        <span class="mtable__mob-sort-label">排序</span>
        <div class="mtable__mob-sort-btns">
          <button
            type="button"
            class="mtable__mob-sort-btn"
            :class="{ 'mtable__mob-sort-btn--on': sortKey === 'last' }"
            @click="toggleSort('last')"
          >
            价格 {{ sortGlyph('last') }}
          </button>
          <button
            type="button"
            class="mtable__mob-sort-btn"
            :class="{ 'mtable__mob-sort-btn--on': sortKey === 'chg' }"
            @click="toggleSort('chg')"
          >
            24h涨跌 {{ sortGlyph('chg') }}
          </button>
          <button
            type="button"
            class="mtable__mob-sort-btn"
            :class="{ 'mtable__mob-sort-btn--on': sortKey === 'vol' }"
            @click="toggleSort('vol')"
          >
            24h成交量 {{ sortGlyph('vol') }}
          </button>
        </div>
      </div>

      <ul class="mtable__cards" aria-label="市场行情列表">
        <li
          v-for="row in pagedRows"
          :key="row.id"
          class="mtable__card"
          tabindex="0"
          role="button"
          @click="goPrimary(row)"
          @keydown.enter="goPrimary(row)"
        >
          <div class="mtable__card-top">
            <button
              type="button"
              class="mtable__star-btn"
              :aria-pressed="market.isInWatchlist(row)"
              :title="market.isInWatchlist(row) ? '取消自选' : '加入自选'"
              @click="onStarClick($event, row)"
            >
              {{ market.isInWatchlist(row) ? '★' : '☆' }}
            </button>
            <div class="mtable__card-pair">
              <span class="mtable__pair-main">{{ row.baseAsset }}</span>
              <span class="mtable__pair-sep">/</span>
              <span class="mtable__pair-q">{{ row.quoteAsset }}</span>
              <span v-if="row.kind === 'CONTRACT'" class="mtable__badge">永续</span>
              <span v-else-if="row.kind === 'DELIVERY'" class="mtable__badge mtable__badge--del">交割</span>
            </div>
            <div class="mtable__card-jump">
              <button type="button" class="mtable__act-btn" @click="goSpot($event, row)">现货</button>
              <button type="button" class="mtable__act-btn mtable__act-btn--c" @click="goContract($event, row)">
                合约
              </button>
            </div>
          </div>
          <div class="mtable__card-mid">
            <div class="mtable__card-cell">
              <span class="mtable__card-k">价格</span>
              <span class="mtable__card-v ex-num">{{ formatPrice(row.lastPrice) }}</span>
            </div>
            <div class="mtable__card-cell mtable__card-cell--chg">
              <span class="mtable__card-k">24h</span>
              <span
                class="mtable__card-v ex-num"
                :class="row.changePct >= 0 ? 'mtable__pct--up' : 'mtable__pct--down'"
              >
                {{ formatPct(row.changePct) }}
              </span>
            </div>
            <div class="mtable__card-cell mtable__card-cell--qv">
              <span class="mtable__card-k">24h成交量</span>
              <span class="mtable__card-v ex-num">
                {{ formatCompact(row.volumeBase) }} {{ row.baseAsset }}
              </span>
            </div>
          </div>
        </li>
      </ul>

      <p v-if="!sortedRows.length" class="mtable__empty">
        暂无数据。可切换分类 Tab、调整24h涨跌筛选或清空搜索；自选请先点击星标添加。
      </p>
    </div>

    <div v-else class="mtable__wrap">
      <table class="mtable__grid" aria-label="市场行情表">
        <thead>
          <tr>
            <th class="mtable__th mtable__th--pair">
              <button
                type="button"
                class="mtable__sort"
                :class="{ 'mtable__sort--on': sortKey === 'pair' }"
                @click="toggleSort('pair')"
              >
                <span class="mtable__sort-txt">名称</span>
                <span class="mtable__sort-carets" aria-hidden="true">
                  <span
                    class="mtable__caret mtable__caret--up"
                    :class="{ 'mtable__caret--active': sortKey === 'pair' && sortDir === 'asc' }"
                  />
                  <span
                    class="mtable__caret mtable__caret--down"
                    :class="{ 'mtable__caret--active': sortKey === 'pair' && sortDir === 'desc' }"
                  />
                </span>
              </button>
            </th>
            <th class="mtable__th mtable__th--num">
              <button
                type="button"
                class="mtable__sort"
                :class="{ 'mtable__sort--on': sortKey === 'last' }"
                @click="toggleSort('last')"
              >
                <span class="mtable__sort-txt">价格</span>
                <span class="mtable__sort-carets" aria-hidden="true">
                  <span
                    class="mtable__caret mtable__caret--up"
                    :class="{ 'mtable__caret--active': sortKey === 'last' && sortDir === 'asc' }"
                  />
                  <span
                    class="mtable__caret mtable__caret--down"
                    :class="{ 'mtable__caret--active': sortKey === 'last' && sortDir === 'desc' }"
                  />
                </span>
              </button>
            </th>
            <th class="mtable__th mtable__th--num">
              <button
                type="button"
                class="mtable__sort"
                :class="{ 'mtable__sort--on': sortKey === 'chg' }"
                @click="toggleSort('chg')"
              >
                <span class="mtable__sort-txt">24h涨跌</span>
                <span class="mtable__sort-carets" aria-hidden="true">
                  <span
                    class="mtable__caret mtable__caret--up"
                    :class="{ 'mtable__caret--active': sortKey === 'chg' && sortDir === 'asc' }"
                  />
                  <span
                    class="mtable__caret mtable__caret--down"
                    :class="{ 'mtable__caret--active': sortKey === 'chg' && sortDir === 'desc' }"
                  />
                </span>
              </button>
            </th>
            <th class="mtable__th mtable__th--num">
              <button
                type="button"
                class="mtable__sort"
                :class="{ 'mtable__sort--on': sortKey === 'vol' }"
                @click="toggleSort('vol')"
              >
                <span class="mtable__sort-txt">24h成交量</span>
                <span class="mtable__sort-carets" aria-hidden="true">
                  <span
                    class="mtable__caret mtable__caret--up"
                    :class="{ 'mtable__caret--active': sortKey === 'vol' && sortDir === 'asc' }"
                  />
                  <span
                    class="mtable__caret mtable__caret--down"
                    :class="{ 'mtable__caret--active': sortKey === 'vol' && sortDir === 'desc' }"
                  />
                </span>
              </button>
            </th>
            <th class="mtable__th mtable__th--num">
              <button
                type="button"
                class="mtable__sort"
                :class="{ 'mtable__sort--on': sortKey === 'mcap' }"
                @click="toggleSort('mcap')"
              >
                <span class="mtable__sort-txt">市值</span>
                <span class="mtable__sort-carets" aria-hidden="true">
                  <span
                    class="mtable__caret mtable__caret--up"
                    :class="{ 'mtable__caret--active': sortKey === 'mcap' && sortDir === 'asc' }"
                  />
                  <span
                    class="mtable__caret mtable__caret--down"
                    :class="{ 'mtable__caret--active': sortKey === 'mcap' && sortDir === 'desc' }"
                  />
                </span>
              </button>
            </th>
            <th class="mtable__th mtable__th--act">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in pagedRows"
            :key="row.id"
            class="mtable__row"
            tabindex="0"
            @click="goPrimary(row)"
            @keydown.enter="goPrimary(row)"
          >
            <td class="mtable__pair">
              <button
                type="button"
                class="mtable__star-btn mtable__star-btn--lead"
                :aria-pressed="market.isInWatchlist(row)"
                :title="market.isInWatchlist(row) ? '取消自选' : '加入自选'"
                @click="onStarClick($event, row)"
              >
                {{ market.isInWatchlist(row) ? '★' : '☆' }}
              </button>
              <span class="mtable__pair-txt">
                <span class="mtable__pair-main">{{ row.baseAsset }}</span>
                <span class="mtable__pair-sep">/</span>
                <span class="mtable__pair-q">{{ row.quoteAsset }}</span>
                <span v-if="row.kind === 'CONTRACT'" class="mtable__badge">永续</span>
                <span v-else-if="row.kind === 'DELIVERY'" class="mtable__badge mtable__badge--del">交割</span>
              </span>
            </td>
            <td class="mtable__num">{{ formatPrice(row.lastPrice) }}</td>
            <td
              class="mtable__num mtable__pct"
              :class="row.changePct >= 0 ? 'mtable__pct--up' : 'mtable__pct--down'"
            >
              {{ formatPct(row.changePct) }}
            </td>
            <td class="mtable__num">
              {{ formatCompact(row.volumeBase) }} {{ row.baseAsset }}
            </td>
            <td class="mtable__num">{{ formatCompact(rowMarketCapUsdt(row)) }} USDT</td>
            <td class="mtable__act">
              <button
                type="button"
                class="mtable__trade-btn"
                title="去交易"
                aria-label="去交易"
                @click.stop="goPrimary(row)"
              >
                <el-icon class="mtable__trade-ic" :size="16"><TopRight /></el-icon>
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <p v-if="!sortedRows.length" class="mtable__empty">
        暂无数据。可切换分类 Tab、调整24h涨跌筛选或清空搜索；自选请先点击星标添加。
      </p>
    </div>

    <div
      v-if="!loading && sortedRows.length > 0"
      class="mtable__pager"
      aria-label="行情列表分页"
    >
      <el-pagination
        background
        layout="total, prev, pager, next, jumper"
        :total="sortedRows.length"
        :page-size="PAGE_SIZE"
        :current-page="currentPage"
        @current-change="onPageChange"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;
@use '@/styles/mixins' as mq;

/* 行情中心平面表：无卡片区隔，与页面背景一体（仅用于本页） */
.mtable {
  border: none;
  border-radius: 0;
  background: transparent;
  /* 与页面同卷：不在表格外壳内出现纵向滚动条；表头 sticky 跟随视口 */
  overflow: visible;
}

/* 分页约为默认尺寸的 ~2/3（再小三分之一），与深色行情页比例协调 */
.mtable__pager {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  flex-wrap: wrap;
  gap: $space-2;
  padding: $space-2 0 0;
  margin-top: 0;
  border-top: 1px solid var(--ex-border-subtle);
}

.mtable__pager :deep(.el-pagination) {
  font-weight: $font-weight-medium;
  --el-pagination-font-size: 12px;
  --el-pagination-button-width: 24px;
  --el-pagination-button-height: 24px;
  --el-pagination-item-gap: 12px;
  --el-pagination-border-radius: 3px;
  /* 与全站主题色一致（当前页方块等依赖 --el-color-primary） */
  --el-color-primary: var(--ex-brand);
}

.mtable__pager :deep(.el-pagination.is-background .el-pager li.is-active) {
  background-color: var(--ex-brand);
  color: var(--ex-text-inverse);
  font-weight: $font-weight-semibold;
}

.mtable__pager :deep(.el-pagination .btn-next .el-icon),
.mtable__pager :deep(.el-pagination .btn-prev .el-icon) {
  font-size: 12px;
}

.mtable__pager :deep(.el-pagination__editor.el-input) {
  width: 44px;
}

.mtable__pager :deep(.el-pagination__editor .el-input__wrapper) {
  min-height: 26px;
  padding: 0 7px;
}

.mtable__pager :deep(.el-pagination__goto) {
  margin-right: 5px;
}

.mtable__pager :deep(.el-pagination__classifier) {
  margin-left: 5px;
}

.mtable__pager :deep(.el-pagination.is-background .btn-next),
.mtable__pager :deep(.el-pagination.is-background .btn-prev),
.mtable__pager :deep(.el-pagination.is-background .el-pager li) {
  margin: 0 2px;
  border-radius: 3px;
}

.mtable__pager :deep(.el-pager li) {
  padding: 0 2px;
}

.mtable__loading {
  padding: $space-8;
  text-align: center;
  font-size: $font-size-sm;
  color: $color-text-tertiary;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-3;
}

.mtable__skel {
  width: 100%;
  max-width: 360px;
  height: 8px;
  border-radius: 4px;
  background: linear-gradient(
    90deg,
    $color-bg-surface 0%,
    $color-bg-hover 50%,
    $color-bg-surface 100%
  );
  background-size: 200% 100%;
  animation: mtable-shimmer 1s ease-in-out infinite;
}

@keyframes mtable-shimmer {
  0% {
    background-position: 100% 0;
  }
  100% {
    background-position: -100% 0;
  }
}

.mtable__narrow {
  padding: 0;
}

.mtable__mob-sort {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: $space-2;
  padding: $space-3 0;
  border-bottom: 1px solid var(--ex-border-subtle);
  background: transparent;
}

.mtable__mob-sort-label {
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  color: $color-text-tertiary;
  letter-spacing: 0.04em;
}

.mtable__mob-sort-btns {
  display: flex;
  flex-wrap: wrap;
  gap: $space-1;
  flex: 1;
  min-width: 0;
}

.mtable__mob-sort-btn {
  min-height: $control-height-md;
  padding: 0 $space-3;
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  color: $color-text-tertiary;
  background: var(--ex-fill-ghost);
  border: 1px solid $color-border;
  border-radius: $radius-sm;
  cursor: pointer;
}

.mtable__mob-sort-btn--on {
  color: $color-brand;
  border-color: rgba(240, 185, 11, 0.35);
  background: rgba(240, 185, 11, 0.08);
}

.mtable__cards {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.mtable__card {
  padding: $space-3 0;
  border-radius: 0;
  border: none;
  border-bottom: 1px solid var(--ex-border-subtle);
  background: transparent;
  cursor: pointer;
  transition: background 0.12s ease;
}

.mtable__card:hover {
  background: var(--ex-fill-ghost);
}

.mtable__card:focus-visible {
  outline: 2px solid rgba(240, 185, 11, 0.45);
  outline-offset: 2px;
}

.mtable__card-top {
  display: flex;
  align-items: flex-start;
  gap: $space-2;
  margin-bottom: $space-3;
}

.mtable__card-pair {
  flex: 1;
  min-width: 0;
  font-weight: $font-weight-semibold;
}

.mtable__card-jump {
  display: flex;
  flex-shrink: 0;
  gap: 4px;
}

.mtable__card-mid {
  display: grid;
  grid-template-columns: 1fr 1fr 1.2fr;
  gap: $space-2;
  align-items: end;
}

.mtable__card-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.mtable__card-cell--chg {
  text-align: center;
}

.mtable__card-cell--qv {
  text-align: right;
}

.mtable__card-k {
  font-size: $font-size-xs;
  font-weight: $font-weight-medium;
  color: $color-text-tertiary;
  letter-spacing: 0.02em;
}

.mtable__card-v {
  font-size: $font-size-sm;
  font-family: $font-family-mono;
  font-variant-numeric: tabular-nums;
  color: $color-text-primary;
}

@include mq.media-down(sm) {
  .mtable__card-mid {
    grid-template-columns: 1fr;
  }

  .mtable__card-cell--chg,
  .mtable__card-cell--qv {
    text-align: left;
  }
}

/* 币安式：列表纵向随页面延伸，不限制在视口高度框内 */
.mtable__wrap {
  overflow-x: auto;
  overflow-y: visible;
  max-height: none;
}

.mtable__grid {
  width: 100%;
  border-collapse: collapse;
  font-size: $font-size-sm;
  min-width: 844px;
}

.mtable__th {
  position: sticky;
  top: 0;
  z-index: 2;
  padding: 10px $space-2;
  text-align: left;
  font-weight: $font-weight-semibold;
  background: var(--ex-bg-base);
  border-bottom: 1px solid var(--ex-border-subtle);
  white-space: nowrap;
  font-size: $font-size-sm;
  color: $color-text-secondary;
  letter-spacing: 0.02em;
  box-shadow: none;
}

.mtable__th--num {
  text-align: right;
}

.mtable__th--act {
  width: 72px;
  text-align: right;
  padding-right: $space-3;
}

.mtable__sort {
  background: none;
  border: none;
  padding: 0;
  font: inherit;
  color: inherit;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.mtable__sort:hover {
  color: $color-text-primary;
}

.mtable__sort:hover .mtable__caret:not(.mtable__caret--active) {
  opacity: 0.48;
}

.mtable__sort--on .mtable__sort-txt {
  color: $color-text-primary;
}

.mtable__sort-txt {
  letter-spacing: 0.02em;
}

/* 币安式：上下三角叠放，当前排序方向高亮 */
.mtable__sort-carets {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  margin-left: 1px;
  flex-shrink: 0;
  line-height: 0;
}

.mtable__caret {
  display: block;
  width: 0;
  height: 0;
  border-left: 3.5px solid transparent;
  border-right: 3.5px solid transparent;
  opacity: 0.34;
  transition:
    opacity 0.12s ease,
    border-color 0.12s ease;
}

.mtable__caret--up {
  border-bottom: 4px solid currentColor;
  border-top: none;
}

.mtable__caret--down {
  border-top: 4px solid currentColor;
  border-bottom: none;
}

.mtable__caret--active {
  opacity: 1;
  border-bottom-color: var(--ex-brand);
  border-top-color: var(--ex-brand);
}

.mtable__row {
  cursor: pointer;
  transition: background 0.12s ease;
}

.mtable__row:hover td {
  background: color-mix(in srgb, var(--ex-text-primary) 4%, var(--ex-bg-base));
}

.mtable__row:focus-visible {
  outline: 2px solid rgba(240, 185, 11, 0.45);
  outline-offset: -2px;
}

.mtable__row td {
  padding: 11px $space-2;
  border-bottom: 1px solid var(--ex-border-subtle);
  vertical-align: middle;
}

.mtable__pair {
  display: flex;
  align-items: center;
  gap: 2px;
  min-width: 0;
  font-weight: $font-weight-semibold;
  white-space: nowrap;
}

.mtable__pair-txt {
  min-width: 0;
}

.mtable__pair-main {
  color: $color-text-primary;
}

.mtable__pair-sep {
  color: $color-text-tertiary;
  margin: 0 2px;
}

.mtable__pair-q {
  color: $color-text-tertiary;
  font-weight: $font-weight-medium;
}

.mtable__badge {
  margin-left: $space-2;
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  padding: 1px 6px;
  border-radius: 4px;
  color: #6aa9ff;
  background: rgba(48, 132, 252, 0.12);
  vertical-align: middle;
}

.mtable__badge--del {
  color: #c9a227;
  background: rgba(240, 185, 11, 0.14);
}

.mtable__num {
  text-align: right;
  font-family: $font-family-mono;
  font-variant-numeric: tabular-nums;
  color: $color-text-primary;
  font-size: $font-size-sm;
}

.mtable__pct--up {
  color: $color-rise;
}

.mtable__pct--down {
  color: $color-fall;
}

.mtable__star-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: $radius-sm;
  background: transparent;
  color: $color-brand;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
}

.mtable__star-btn:hover {
  background: rgba(240, 185, 11, 0.08);
}

/** 桌面表：星标贴在名称左侧（对齐早期布局） */
.mtable__star-btn--lead {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  font-size: 15px;
  margin-right: 2px;
}

.mtable__act {
  text-align: right;
  white-space: nowrap;
  vertical-align: middle;
}

/* 去交易：圆角方框 + 外链角标感，hover 品牌强调 */
.mtable__trade-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 28px;
  padding: 0;
  border-radius: $radius-sm;
  border: 1px solid var(--ex-border-subtle);
  background: var(--ex-fill-ghost);
  color: $color-text-secondary;
  cursor: pointer;
  transition:
    color 0.12s ease,
    border-color 0.12s ease,
    background 0.12s ease;
}

.mtable__trade-btn:hover {
  color: $color-brand;
  border-color: color-mix(in srgb, var(--ex-brand) 35%, var(--ex-border));
  background: color-mix(in srgb, var(--ex-brand) 8%, var(--ex-bg-base));
}

.mtable__trade-btn:focus-visible {
  outline: 2px solid rgba(240, 185, 11, 0.45);
  outline-offset: 2px;
}

.mtable__trade-ic {
  flex-shrink: 0;
}

.mtable__act-btn {
  display: inline-block;
  margin-left: 4px;
  padding: 4px 8px;
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  color: $color-text-secondary;
  background: var(--ex-fill-ghost);
  border: 1px solid $color-border;
  border-radius: 4px;
  cursor: pointer;
}

.mtable__act-btn:hover {
  color: $color-brand;
  border-color: rgba(240, 185, 11, 0.35);
}

.mtable__act-btn--c {
  color: #6aa9ff;
}

.mtable__act-btn--c:hover {
  color: #8bb8ff;
  border-color: rgba(48, 132, 252, 0.35);
}

.mtable__empty {
  margin: 0;
  padding: $space-8;
  text-align: center;
  color: $color-text-tertiary;
  font-size: $font-size-sm;
  line-height: 1.55;
}

@include mq.media-down(xl) {
  .mtable__hide-lg {
    display: none;
  }
}

@include mq.media-down(lg) {
  .mtable__hide-md {
    display: none;
  }
}

@include mq.media-down(md) {
  .mtable__hide-sm {
    display: none;
  }
}

:global([data-theme='monochrome']) .mtable__th {
  background: var(--ex-bg-base);
}
</style>
