<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { storeToRefs } from 'pinia'
import { RouteNames } from '@/constants/routeNames'
import { useStakingBorrowStore } from '@/stores/stakingBorrow'
import { useAuthStore } from '@/stores/auth'
import ExPageState from '@/components/common/ExPageState.vue'
import StakingBorrowModal from '@/components/business/finance/StakingBorrowModal.vue'
import StakingRepayModal from '@/components/business/finance/StakingRepayModal.vue'
import StakingAddCollateralModal from '@/components/business/finance/StakingAddCollateralModal.vue'
import type { StakingCollateralAsset, StakingLedgerKind, StakingLoanPosition } from '@/types/financeCredit'
import { formatPrice } from '@/utils/format/number'

const store = useStakingBorrowStore()
const { loading, loadError, collaterals, positions, stakingLedger, totalBorrowed } = storeToRefs(store)
const auth = useAuthStore()

const tab = ref<'assets' | 'positions' | 'history'>('assets')
const borrowOpen = ref(false)
const repayOpen = ref(false)
const addColOpen = ref(false)
const selectedCol = ref<StakingCollateralAsset | null>(null)
const repayPos = ref<StakingLoanPosition | null>(null)
const addColPos = ref<StakingLoanPosition | null>(null)

let tick: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  void store.bootstrap().then(() => store.accrueDemoInterest())
  tick = setInterval(() => store.accrueDemoInterest(), 45_000)
})

onUnmounted(() => {
  if (tick) clearInterval(tick)
})

function openBorrow(c: StakingCollateralAsset) {
  selectedCol.value = c
  borrowOpen.value = true
}

function openRepay(p: StakingLoanPosition) {
  repayPos.value = p
  repayOpen.value = true
}

function openAddCol(p: StakingLoanPosition) {
  addColPos.value = p
  addColOpen.value = true
}

const addColRow = computed(() => {
  if (!addColPos.value) return null
  return collaterals.value.find((c) => c.symbol === addColPos.value!.collateralAsset) ?? null
})

function fmtDate(iso: string) {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('zh-CN', { dateStyle: 'short', timeStyle: 'short' })
}

const ltvBarPct = (p: StakingLoanPosition, liq: number) => Math.min(100, (p.currentLtvPct / liq) * 100)

function liqLtvForPosition(pos: StakingLoanPosition) {
  return collaterals.value.find((c) => c.symbol === pos.collateralAsset)?.liquidationLtvPct ?? 85
}

function ledgerKindLabel(k: StakingLedgerKind) {
  if (k === 'BORROW') return '借币'
  if (k === 'REPAY') return '还款'
  if (k === 'ADD_COLLATERAL') return '追加质押'
  return '结清'
}
</script>

<template>
  <div class="sbp">
    <header class="sbp__hero">
      <div>
        <h1 class="sbp__title">质押借币</h1>
        <p class="sbp__sub">数字资产质押借 USDT · 按日计息 · LTV 与清算线实时测算（演示）</p>
      </div>
      <div class="sbp__hero-actions">
        <button type="button" class="sbp__ghost" @click="tab = 'history'">历史记录</button>
        <RouterLink :to="{ name: RouteNames.LendingAssist }" class="sbp__link">助力贷 →</RouterLink>
      </div>
    </header>

    <div class="sbp__stats">
      <div class="sbp__stat">
        <span class="sbp__sl">总负债（本+息）</span>
        <span class="sbp__sv ex-num">{{ formatPrice(totalBorrowed) }}</span>
        <span class="sbp__su">USDT</span>
      </div>
      <div class="sbp__stat">
        <span class="sbp__sl">活跃仓位</span>
        <span class="sbp__sv ex-num">{{ positions.length }}</span>
        <span class="sbp__su">笔</span>
      </div>
      <div class="sbp__stat">
        <span class="sbp__sl">指数参考</span>
        <span class="sbp__sv sbp__sv--small">
          BTC {{ formatPrice(store.INDEX_PRICE.BTC) }} · ETH {{ formatPrice(store.INDEX_PRICE.ETH) }}
        </span>
      </div>
    </div>

    <div v-if="collaterals.length" class="sbp__rate-strip">
      <span class="sbp__rate-strip-label">借款日利率（按未偿本金）</span>
      <div class="sbp__rate-tags">
        <span v-for="c in collaterals" :key="c.id" class="sbp__rate-tag">
          <span class="sbp__rate-tag-sym">{{ c.symbol }}</span>
          <span class="sbp__rate-tag-pct ex-num">{{ c.dailyBorrowRatePct }}%</span>
          <span class="sbp__rate-tag-unit">/ 日</span>
        </span>
      </div>
      <p class="sbp__rate-strip-note">与弹窗、仓位「日利息」粗算一致；真实环境以产品页与账单为准。</p>
    </div>

    <p v-if="!auth.isAuthenticated" class="sbp__auth-hint">
      未登录仅可浏览；
      <RouterLink :to="{ name: RouteNames.Login }" class="sbp__a">去登录</RouterLink>
      后借币/还款/追加将更新演示仓位与钱包余额。
    </p>

    <ExPageState
      :loading="loading && collaterals.length === 0"
      use-skeleton
      skeleton-variant="panel"
      :error="loadError"
      loading-text="加载质押借币…"
      @retry="store.bootstrap(true)"
    >
      <div class="sbp__tabs" role="tablist">
        <button
          type="button"
          role="tab"
          class="sbp__tab"
          :class="{ 'sbp__tab--on': tab === 'assets' }"
          @click="tab = 'assets'"
        >
          抵押资产
        </button>
        <button
          type="button"
          role="tab"
          class="sbp__tab"
          :class="{ 'sbp__tab--on': tab === 'positions' }"
          @click="tab = 'positions'"
        >
          我的仓位
          <span class="sbp__badge">{{ positions.length }}</span>
        </button>
        <button
          type="button"
          role="tab"
          class="sbp__tab"
          :class="{ 'sbp__tab--on': tab === 'history' }"
          @click="tab = 'history'"
        >
          历史记录
          <span class="sbp__badge">{{ stakingLedger.length }}</span>
        </button>
      </div>

      <section v-show="tab === 'assets'" class="sbp__grid">
        <article v-for="c in collaterals" :key="c.id" class="sbp-card">
          <div class="sbp-card__top">
            <span class="sbp-card__sym">{{ c.symbol }}</span>
            <span class="sbp-card__px">≈ {{ formatPrice((store.INDEX_PRICE as Record<string, number>)[c.symbol] ?? 0) }} USDT</span>
          </div>
          <p class="sbp-card__row">
            钱包可用 <span class="ex-num">{{ c.walletBalance }}</span> · 已质押 <span class="ex-num">{{ c.lockedAmount }}</span>
          </p>
          <p class="sbp-card__rule">初始 LTV ≤ {{ c.maxInitialLtvPct }}% · 清算线 {{ c.liquidationLtvPct }}%</p>
          <button type="button" class="sbp-card__btn" @click="openBorrow(c)">借入</button>
        </article>
      </section>

      <section v-show="tab === 'history'" class="sbp__hist">
        <p class="sbp__hist-hint">借币、还款、追加质押与结清流水；结清后仓位从「我的仓位」移除，记录仍保留于此。</p>
        <p v-if="!stakingLedger.length" class="sbp__empty">暂无流水，发起借币或还款后将在此展示。</p>
        <div v-for="row in stakingLedger" :key="row.id" class="sbp-hist">
          <div class="sbp-hist__row">
            <span class="sbp-hist__kind">{{ ledgerKindLabel(row.kind) }}</span>
            <span class="sbp-hist__time">{{ fmtDate(row.time) }}</span>
          </div>
          <p class="sbp-hist__sum">{{ row.summary }}</p>
        </div>
      </section>

      <section v-show="tab === 'positions'" class="sbp__pos">
        <p v-if="!positions.length" class="sbp__empty">暂无仓位，可在「抵押资产」中发起借入。</p>
        <div v-for="p in positions" :key="p.id" class="sbp-pos">
          <div class="sbp-pos__head">
            <span class="sbp-pos__sym">{{ p.collateralAsset }} 质押</span>
            <span
              class="sbp-pos__ltv"
              :class="{
                'sbp-pos__ltv--hot': p.currentLtvPct >= liqLtvForPosition(p) - 8,
              }"
            >
              LTV {{ p.currentLtvPct }}%
            </span>
          </div>
          <div class="sbp-pos__bar-wrap">
            <div
              class="sbp-pos__bar"
              :style="{
                width: `${ltvBarPct(p, liqLtvForPosition(p))}%`,
              }"
            />
          </div>
          <p class="sbp-pos__amt ex-num">
            质押 {{ p.collateralAmount }} {{ p.collateralAsset }} · 借入 {{ formatPrice(p.borrowedUsdt) }} USDT · 利息
            {{ formatPrice(p.accruedInterestUsdt) }} USDT
          </p>
          <p class="sbp-pos__daily">
            日利息约 <span class="ex-num">{{ formatPrice(store.estimatedDailyInterestUsdt(p)) }}</span> USDT（本金 × 日利率）
          </p>
          <div class="sbp-pos__meta">
            <span>开仓 {{ fmtDate(p.openedAt) }}</span>
          </div>
          <div class="sbp-pos__act">
            <button type="button" class="sbp-pos__btn" @click="openRepay(p)">还款</button>
            <button type="button" class="sbp-pos__btn sbp-pos__btn--ghost" @click="openAddCol(p)">追加质押</button>
          </div>
        </div>
      </section>
    </ExPageState>

    <p class="sbp__foot">
      规则说明：指数价与 LTV 为演示逻辑；真实环境以标记价格与风控引擎为准。交互参考
      <a class="sbp__a" href="https://www.binance.com/zh-CN/loan" target="_blank" rel="noopener noreferrer">币安质押借币</a>
      类体验。
    </p>

    <RouterLink :to="{ name: RouteNames.SmartMiner }" class="sbp__back">← 智能矿机</RouterLink>

    <StakingBorrowModal v-model="borrowOpen" :collateral="selectedCol" />
    <StakingRepayModal v-model="repayOpen" :position="repayPos" />
    <StakingAddCollateralModal v-model="addColOpen" :position="addColPos" :collateral-row="addColRow" />
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;
@use '@/styles/mixins' as mq;

.sbp {
  max-width: min(1120px, var(--ex-container-max));
  margin: 0 auto;
  padding: 0 $space-4 $space-8;
  box-sizing: border-box;
}

.sbp__hero {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: $space-3;
  margin-bottom: $space-4;
}

.sbp__title {
  margin: 0 0 $space-1;
  font-size: $font-size-xl;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.sbp__sub {
  margin: 0;
  font-size: $font-size-sm;
  color: $color-text-tertiary;
}

.sbp__hero-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: $space-2;
}

.sbp__ghost {
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  color: $color-text-secondary;
  padding: $space-2 $space-3;
  border-radius: $radius-sm;
  border: 1px solid $color-border-strong;
  background: var(--ex-surface-inset);
  cursor: pointer;
}

.sbp__ghost:hover {
  color: $color-text-primary;
  border-color: rgba(240, 185, 11, 0.35);
}

.sbp__hist {
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.sbp__hist-hint {
  margin: 0 0 $space-1;
  font-size: $font-size-xs;
  color: $color-text-tertiary;
  line-height: 1.5;
}

.sbp-hist {
  padding: $space-3 $space-4;
  border-radius: $radius-md;
  border: 1px solid $color-border;
  background: var(--ex-panel-sunken);
}

.sbp-hist__row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.sbp-hist__kind {
  font-size: 10px;
  font-weight: $font-weight-bold;
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(14, 203, 129, 0.12);
  color: $color-rise;
}

.sbp-hist__time {
  font-size: $font-size-xs;
  color: $color-text-tertiary;
}

.sbp-hist__sum {
  margin: 0;
  font-size: $font-size-sm;
  color: $color-text-secondary;
  line-height: 1.45;
}

.sbp__link {
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  color: $color-brand;
  text-decoration: none;
  padding: $space-2 $space-3;
  border-radius: $radius-sm;
  border: 1px solid rgba(240, 185, 11, 0.35);
  background: rgba(240, 185, 11, 0.08);
}

.sbp__link:hover {
  background: rgba(240, 185, 11, 0.14);
}

.sbp__stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $space-2;
  margin-bottom: $space-4;
}

@include mq.media-down(md) {
  .sbp__stats {
    grid-template-columns: 1fr;
  }
}

.sbp__stat {
  padding: $space-3;
  border-radius: $radius-md;
  border: 1px solid $color-border;
  background: var(--ex-card-surface);
}

.sbp__sl {
  display: block;
  font-size: 11px;
  color: $color-text-tertiary;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 4px;
}

.sbp__sv {
  font-size: $font-size-lg;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.sbp__sv--small {
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  line-height: 1.4;
}

.sbp__su {
  font-size: $font-size-xs;
  color: $color-text-tertiary;
  margin-left: 4px;
}

.sbp__rate-strip {
  margin-bottom: $space-4;
  padding: $space-3 $space-4;
  border-radius: $radius-md;
  border: 1px solid rgba(240, 185, 11, 0.28);
  background: rgba(240, 185, 11, 0.06);
}

.sbp__rate-strip-label {
  display: block;
  font-size: 11px;
  font-weight: $font-weight-bold;
  color: $color-text-secondary;
  letter-spacing: 0.02em;
  margin-bottom: $space-2;
}

.sbp__rate-tags {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
}

.sbp__rate-tag {
  display: inline-flex;
  align-items: baseline;
  gap: 4px;
  padding: 6px 10px;
  border-radius: $radius-sm;
  background: var(--ex-card-surface);
  border: 1px solid $color-border;
  font-size: $font-size-sm;
}

.sbp__rate-tag-sym {
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.sbp__rate-tag-pct {
  font-weight: $font-weight-bold;
  color: $color-brand;
}

.sbp__rate-tag-unit {
  font-size: $font-size-xs;
  color: $color-text-tertiary;
}

.sbp__rate-strip-note {
  margin: $space-2 0 0;
  font-size: 10px;
  line-height: 1.45;
  color: $color-text-tertiary;
}

.sbp__auth-hint {
  font-size: $font-size-xs;
  color: $color-text-secondary;
  margin: 0 0 $space-3;
  padding: $space-2 $space-3;
  border-radius: $radius-sm;
  background: rgba(48, 132, 252, 0.08);
  border: 1px solid rgba(48, 132, 252, 0.2);
}

.sbp__a {
  color: $color-brand;
  text-decoration: none;
  font-weight: $font-weight-semibold;
}

.sbp__a:hover {
  text-decoration: underline;
}

.sbp__tabs {
  display: flex;
  gap: $space-1;
  margin-bottom: $space-3;
  padding: 4px;
  border-radius: $radius-md;
  background: var(--ex-surface-inset);
  border: 1px solid $color-border;
}

.sbp__tab {
  flex: 1;
  padding: $space-2 $space-3;
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  color: $color-text-tertiary;
  background: transparent;
  border: none;
  border-radius: $radius-sm;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.sbp__tab--on {
  color: $color-text-primary;
  background: rgba(240, 185, 11, 0.14);
  box-shadow: 0 0 0 1px rgba(240, 185, 11, 0.25);
}

.sbp__badge {
  font-size: 10px;
  padding: 0 6px;
  border-radius: 8px;
  background: rgba(240, 185, 11, 0.2);
  color: $color-brand;
}

.sbp__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: $space-3;
}

.sbp-card {
  padding: $space-4;
  border-radius: $radius-md;
  border: 1px solid $color-border;
  background: var(--ex-card-surface);
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.sbp-card__top {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.sbp-card__sym {
  font-size: $font-size-lg;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.sbp-card__px {
  font-size: $font-size-xs;
  color: $color-text-tertiary;
}

.sbp-card__row {
  margin: 0;
  font-size: $font-size-sm;
  color: $color-text-secondary;
}

.sbp-card__rule {
  margin: 0;
  font-size: $font-size-xs;
  color: $color-text-tertiary;
  line-height: 1.45;
}

.sbp-card__rate {
  margin: 0;
  font-size: $font-size-xs;
  color: $color-text-secondary;
}

.sbp-card__rate-num {
  font-weight: $font-weight-bold;
  color: $color-brand;
}

.sbp-card__btn {
  margin-top: auto;
  padding: $space-2 $space-4;
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  border: none;
  border-radius: $radius-sm;
  cursor: pointer;
  background: var(--ex-brand);
  color: var(--ex-on-brand);
}

.sbp-card__btn:hover {
  filter: brightness(1.05);
}

.sbp__pos {
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.sbp__empty {
  text-align: center;
  padding: $space-8;
  color: $color-text-tertiary;
  font-size: $font-size-sm;
}

.sbp-pos {
  padding: $space-3 $space-4;
  border-radius: $radius-md;
  border: 1px solid $color-border;
  background: var(--ex-panel-sunken);
}

.sbp-pos__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.sbp-pos__sym {
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.sbp-pos__ltv {
  font-size: $font-size-xs;
  font-weight: $font-weight-bold;
  color: $color-rise;
}

.sbp-pos__ltv--hot {
  color: $color-fall;
}

.sbp-pos__bar-wrap {
  height: 4px;
  border-radius: 2px;
  background: var(--ex-fill-hover-subtle);
  margin-bottom: $space-2;
  overflow: hidden;
}

.sbp-pos__bar {
  height: 100%;
  border-radius: 2px;
  background: var(--ex-brand);
  max-width: 100%;
}

.sbp-pos__amt {
  margin: 0 0 6px;
  font-size: $font-size-sm;
  color: $color-text-secondary;
}

.sbp-pos__daily {
  margin: 0 0 $space-2;
  font-size: $font-size-xs;
  color: $color-text-tertiary;
}

.sbp-pos__meta {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
  font-size: $font-size-xs;
  color: $color-text-tertiary;
  margin-bottom: $space-2;
}

.sbp-pos__act {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
}

.sbp-pos__btn {
  padding: 6px $space-3;
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  border-radius: $radius-sm;
  border: 1px solid rgba(240, 185, 11, 0.4);
  background: rgba(240, 185, 11, 0.1);
  color: $color-brand;
  cursor: pointer;
}

.sbp-pos__btn--ghost {
  border-color: $color-border;
  background: var(--ex-panel-sunken);
  color: $color-text-secondary;
}

.sbp__foot {
  margin-top: $space-6;
  font-size: 11px;
  color: $color-text-tertiary;
  line-height: 1.6;
}

.sbp__back {
  display: inline-block;
  margin-top: $space-3;
  font-size: $font-size-sm;
  color: $color-text-tertiary;
  text-decoration: none;
}

.sbp__back:hover {
  color: $color-brand;
}

.ex-num {
  font-family: $font-family-mono;
}
</style>
