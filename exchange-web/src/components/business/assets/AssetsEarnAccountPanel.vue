<script setup lang="ts">
/**
 * 资产中心 · 理财账户：截图式纵向列表 — 基金理财 / 智能矿机 / 助力贷 / 质押借币；
 * 指标与各产品页、store 口径一致（日估产出、日收益率、日利率等）。
 */
import { computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { storeToRefs } from 'pinia'
import { RouteNames } from '@/constants/routeNames'
import { useFinanceFundStore } from '@/stores/financeFund'
import { useSmartMinerStore } from '@/stores/smartMiner'
import { useLendingAssistStore } from '@/stores/lendingAssist'
import { useStakingBorrowStore } from '@/stores/stakingBorrow'
import { useAssetsCenterStore } from '@/stores/assetsCenter'
import { formatPrice } from '@/utils/format/number'
import AssetsEarnAssetList from './AssetsEarnAssetList.vue'

const assetsCenter = useAssetsCenterStore()
const { payload: assetsPayload } = storeToRefs(assetsCenter)

const fund = useFinanceFundStore()
const miner = useSmartMinerStore()
const lend = useLendingAssistStore()
const stake = useStakingBorrowStore()

const {
  totalPrincipal,
  totalAccrued,
  totalEstimatedDailyUsdt: fundDailyEst,
  portfolioDailyYieldPct: fundPortfolioDailyPct,
} = storeToRefs(fund)
const {
  walletUsdt,
  estDailyTotal: minerDailyOut,
  portfolioDailyYieldPct: minerPortfolioDailyPct,
  totalPaidActive,
  activeOrders,
} = storeToRefs(miner)
const { loans, planMap } = storeToRefs(lend)
const { positions: stakePositions, totalBorrowed, collaterals } = storeToRefs(stake)

onMounted(() => {
  void Promise.all([fund.bootstrap(), miner.bootstrap(), lend.bootstrap(), stake.bootstrap()])
})

const fundAssetsUsdt = computed(() => totalPrincipal.value + totalAccrued.value)

const minerAssetsUsdt = computed(() => walletUsdt.value + totalPaidActive.value)

const lendingDueUsdt = computed(() =>
  loans.value
    .filter((l) => l.status === 'ACTIVE' || l.status === 'OVERDUE')
    .reduce((s, l) => s + l.principal + l.accruedInterest, 0),
)

const lendingPendingCount = computed(() => loans.value.filter((l) => l.status === 'PENDING_REVIEW').length)

/** 助力贷：按在贷本金加权的参考日利率（%） */
const lendingWeightedDailyPct = computed(() => {
  let pSum = 0
  let w = 0
  for (const loan of loans.value) {
    if (loan.status !== 'ACTIVE' && loan.status !== 'OVERDUE') continue
    const plan = planMap.value.get(loan.planId)
    if (!plan) continue
    pSum += loan.principal
    w += loan.principal * plan.dailyRatePct
  }
  return pSum > 0 ? w / pSum : 0
})

const stakingCollateralUsdt = computed(() =>
  stakePositions.value.reduce((s, p) => s + p.collateralAmount * stake.px(p.collateralAsset), 0),
)

/** 质押借币：按未偿本金加权的借款日利率（%） */
const stakingWeightedBorrowDailyPct = computed(() => {
  let prin = 0
  let w = 0
  for (const p of stakePositions.value) {
    const col = collaterals.value.find((c) => c.symbol === p.collateralAsset)
    const pct = col?.dailyBorrowRatePct ?? 0.002
    const b = p.borrowedUsdt
    prin += b
    w += b * pct
  }
  return prin > 0 ? w / prin : 0
})

/** 日利息约（按加权日利率 × 负债本金粗算） */
const stakingDailyInterestEst = computed(() =>
  stakePositions.value.reduce((s, p) => {
    const col = collaterals.value.find((c) => c.symbol === p.collateralAsset)
    const pct = col?.dailyBorrowRatePct ?? 0.002
    return s + p.borrowedUsdt * (pct / 100)
  }, 0),
)

const earnNetUsdt = computed(() => {
  const gross = fundAssetsUsdt.value + minerAssetsUsdt.value + stakingCollateralUsdt.value
  return gross - totalBorrowed.value - lendingDueUsdt.value
})

/** 资产中心 · 资金账户 USDT 可用（与总览同源，仅展示） */
const fundingUsdtAvailable = computed(() => {
  const rows = assetsPayload.value?.balances.funding
  if (!rows?.length) return null
  return rows.find((r) => r.asset === 'USDT')?.available ?? null
})

function fmtYieldPct(n: number) {
  if (n <= 0) return '—'
  return `${n >= 0.01 ? n.toFixed(3) : n.toFixed(4)}%`
}
</script>

<template>
  <section class="aearn" aria-label="理财账户">
    <header class="aearn__head">
      <div>
        <h2 class="aearn__title">理财账户</h2>
        <p class="aearn__sub">
          与
          <RouterLink class="aearn__inline" :to="{ name: RouteNames.OrdersEarn }">理财订单</RouterLink>
          同源；以下为各产品线汇总（演示）。
        </p>
      </div>
      <div class="aearn__sum">
        <span class="aearn__sk">理财净资产（估算）</span>
        <span class="aearn__sv ex-num" :class="{ 'aearn__sv--neg': earnNetUsdt < 0 }">
          {{ formatPrice(earnNetUsdt) }} USDT
        </span>
      </div>
    </header>

    <div class="aearn__cash" role="note">
      <div class="aearn__cash-main">
        <span class="aearn__cash-label">资金账户 USDT 可用</span>
        <span v-if="fundingUsdtAvailable != null" class="aearn__cash-val ex-num">{{ formatPrice(fundingUsdtAvailable) }}</span>
        <span v-else class="aearn__cash-val aearn__cash-val--muted">—</span>
        <RouterLink class="aearn__cash-link" :to="{ name: RouteNames.Assets, query: { account: 'funding' } }">
          查看资金账户
        </RouterLink>
      </div>
      <p class="aearn__cash-hint">
        基金申购、矿机算力、助力贷与质押借币等可直接使用资金账户 USDT 支付，无需划转至其它账户（演示口径）。
      </p>
    </div>

    <ul class="aearn-list" role="list">
      <!-- 基金理财 -->
      <li class="aearn-list__li">
        <RouterLink :to="{ name: RouteNames.FinanceFund }" class="aearn-row">
          <span class="aearn-row__icon" aria-hidden="true">
            <svg class="aearn-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4">
              <rect x="3" y="6" width="18" height="14" rx="2" />
              <path d="M3 10h18" />
              <circle cx="17" cy="14" r="1.2" fill="currentColor" stroke="none" class="aearn-ico__dot" />
            </svg>
          </span>
          <div class="aearn-row__body">
            <div class="aearn-row__title">基金理财</div>
            <div class="aearn-row__metrics">
              <span class="aearn-row__pill">持仓 {{ formatPrice(fundAssetsUsdt) }} USDT</span>
              <span class="aearn-row__pill aearn-row__pill--em"
                >日估收益 {{ formatPrice(fundDailyEst) }} USDT/天</span
              >
              <span class="aearn-row__pill">日收益率 {{ fmtYieldPct(fundPortfolioDailyPct) }} / 日</span>
            </div>
          </div>
          <span class="aearn-row__chev" aria-hidden="true">›</span>
        </RouterLink>
      </li>

      <!-- 智能矿机 -->
      <li class="aearn-list__li">
        <RouterLink :to="{ name: RouteNames.SmartMiner }" class="aearn-row">
          <span class="aearn-row__icon" aria-hidden="true">
            <svg class="aearn-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4">
              <circle cx="12" cy="12" r="8" />
              <path d="M12 4v16M4 12h16" />
              <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" class="aearn-ico__dot" />
            </svg>
          </span>
          <div class="aearn-row__body">
            <div class="aearn-row__title">智能矿机</div>
            <div class="aearn-row__metrics">
              <span class="aearn-row__pill">资产 {{ formatPrice(minerAssetsUsdt) }} USDT</span>
              <span class="aearn-row__pill aearn-row__pill--em"
                >日估产出 {{ formatPrice(minerDailyOut) }} USDT/天</span
              >
              <span class="aearn-row__pill">日收益率 {{ fmtYieldPct(minerPortfolioDailyPct) }} / 日</span>
              <span v-if="activeOrders.length" class="aearn-row__pill">运行中 {{ activeOrders.length }} 笔</span>
            </div>
          </div>
          <span class="aearn-row__chev" aria-hidden="true">›</span>
        </RouterLink>
      </li>

      <!-- 助力贷 -->
      <li class="aearn-list__li">
        <RouterLink :to="{ name: RouteNames.LendingAssist }" class="aearn-row aearn-row--debt">
          <span class="aearn-row__icon" aria-hidden="true">
            <svg class="aearn-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4">
              <rect x="4" y="5" width="16" height="14" rx="2" />
              <path d="M4 8h16" />
              <circle cx="12" cy="14" r="1.2" fill="currentColor" stroke="none" class="aearn-ico__dot" />
            </svg>
          </span>
          <div class="aearn-row__body">
            <div class="aearn-row__title">助力贷</div>
            <div class="aearn-row__metrics">
              <span class="aearn-row__pill aearn-row__pill--risk">应还 {{ formatPrice(lendingDueUsdt) }} USDT</span>
              <span v-if="lendingWeightedDailyPct > 0" class="aearn-row__pill"
                >参考日利率 {{ fmtYieldPct(lendingWeightedDailyPct) }} / 日</span
              >
              <span v-else class="aearn-row__pill">暂无在贷</span>
              <span v-if="lendingPendingCount" class="aearn-row__pill">审核中 {{ lendingPendingCount }} 笔</span>
            </div>
          </div>
          <span class="aearn-row__chev" aria-hidden="true">›</span>
        </RouterLink>
      </li>

      <!-- 质押借币 -->
      <li class="aearn-list__li">
        <RouterLink :to="{ name: RouteNames.StakingBorrow }" class="aearn-row">
          <span class="aearn-row__icon" aria-hidden="true">
            <svg class="aearn-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4">
              <rect x="7" y="10" width="10" height="10" rx="1.5" />
              <path d="M9 10V6a3 3 0 0 1 6 0v4" />
              <circle cx="12" cy="14" r="1" fill="currentColor" stroke="none" class="aearn-ico__dot" />
            </svg>
          </span>
          <div class="aearn-row__body">
            <div class="aearn-row__title">质押借币</div>
            <div class="aearn-row__metrics">
              <span class="aearn-row__pill">质押估值 {{ formatPrice(stakingCollateralUsdt) }} USDT</span>
              <span class="aearn-row__pill aearn-row__pill--risk">负债 {{ formatPrice(totalBorrowed) }} USDT</span>
              <span v-if="stakePositions.length" class="aearn-row__pill"
                >借款日利率 {{ fmtYieldPct(stakingWeightedBorrowDailyPct) }} / 日</span
              >
              <span v-if="stakePositions.length" class="aearn-row__pill aearn-row__pill--em"
                >日利息约 {{ formatPrice(stakingDailyInterestEst) }} USDT</span
              >
            </div>
          </div>
          <span class="aearn-row__chev" aria-hidden="true">›</span>
        </RouterLink>
      </li>
    </ul>

    <AssetsEarnAssetList />

    <p class="aearn__foot">
      总览「理财」分布图为接口演示值，可能与上表汇总略有差异；操作与清算以各产品页为准。
    </p>
  </section>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;
@use '@/styles/mixins' as mq;

.aearn {
  border: 1px solid $color-border;
  border-radius: $radius-lg;
  background: var(--ex-card-surface);
  padding: $space-4;
  min-width: 0;
}

.aearn__head {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: flex-start;
  gap: $space-3;
  margin-bottom: $space-3;
}

.aearn__cash {
  margin-bottom: $space-3;
  padding: $space-3 $space-4;
  border-radius: $radius-md;
  border: 1px solid rgba(240, 185, 11, 0.28);
  background: rgba(240, 185, 11, 0.06);
}

.aearn__cash-main {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 8px 14px;
}

.aearn__cash-label {
  font-size: 11px;
  font-weight: $font-weight-bold;
  color: $color-text-secondary;
}

.aearn__cash-val {
  font-size: $font-size-md;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.aearn__cash-val--muted {
  color: $color-text-tertiary;
}

.aearn__cash-link {
  margin-left: auto;
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  color: $color-brand;
  text-decoration: none;
}

.aearn__cash-link:hover {
  text-decoration: underline;
}

.aearn__cash-hint {
  margin: $space-2 0 0;
  font-size: 10px;
  line-height: 1.5;
  color: $color-text-tertiary;
}

.aearn__title {
  margin: 0 0 $space-1;
  font-size: $font-size-md;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.aearn__sub {
  margin: 0;
  font-size: $font-size-xs;
  color: $color-text-tertiary;
  line-height: 1.5;
  max-width: 520px;
}

.aearn__inline {
  color: $color-brand;
  font-weight: $font-weight-semibold;
  text-decoration: none;
}

.aearn__inline:hover {
  text-decoration: underline;
}

.aearn__sum {
  text-align: right;
}

.aearn__sk {
  display: block;
  font-size: 10px;
  font-weight: $font-weight-bold;
  color: $color-text-tertiary;
  letter-spacing: 0.04em;
  margin-bottom: 4px;
}

.aearn__sv {
  font-size: $font-size-lg;
  font-weight: $font-weight-bold;
  color: $color-rise;
}

.aearn__sv--neg {
  color: $color-fall;
}

.aearn-list {
  list-style: none;
  margin: 0;
  padding: 0;
  border-radius: $radius-md;
  border: 1px solid $color-border;
  background: var(--ex-panel-sunken);
  overflow: hidden;
}

.aearn-list__li {
  margin: 0;
  border-bottom: 1px solid var(--ex-border-subtle);

  &:last-child {
    border-bottom: none;
  }
}

.aearn-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 12px;
  text-decoration: none;
  color: inherit;
  transition: background 0.15s ease;

  &:hover {
    background: rgba(240, 185, 11, 0.05);
  }

  &:focus-visible {
    outline: 2px solid rgba(240, 185, 11, 0.45);
    outline-offset: -2px;
  }
}

.aearn-row--debt:hover {
  background: rgba(246, 70, 93, 0.04);
}

.aearn-row__icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: rgba(240, 185, 11, 0.08);
  border: 1px solid rgba(240, 185, 11, 0.22);
  color: rgba(255, 255, 255, 0.55);
}

.aearn-ico {
  width: 22px;
  height: 22px;
}

.aearn-row__icon .aearn-ico__dot {
  color: $color-brand;
}

.aearn-row__body {
  flex: 1;
  min-width: 0;
}

.aearn-row__title {
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
  margin-bottom: 8px;
}

.aearn-row__metrics {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 8px;
}

.aearn-row__pill {
  font-size: 10px;
  line-height: 1.35;
  padding: 3px 8px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--ex-border-subtle);
  color: $color-text-tertiary;
}

.aearn-row__pill--em {
  color: $color-rise;
  border-color: rgba(14, 203, 129, 0.25);
  background: rgba(14, 203, 129, 0.08);
}

.aearn-row__pill--risk {
  color: $color-fall;
  border-color: rgba(246, 70, 93, 0.2);
  background: rgba(246, 70, 93, 0.06);
}

.aearn-row__chev {
  flex-shrink: 0;
  font-size: 18px;
  font-weight: $font-weight-bold;
  color: $color-text-tertiary;
  line-height: 40px;
  opacity: 0.45;
}

.aearn__foot {
  margin: $space-3 0 0;
  font-size: $font-size-xs;
  color: $color-text-tertiary;
  line-height: 1.5;
}

.ex-num {
  font-family: $font-family-mono;
}

@include mq.media-down(sm) {
  .aearn-row {
    padding: 12px 10px;
  }

  .aearn-row__chev {
    display: none;
  }
}
</style>
