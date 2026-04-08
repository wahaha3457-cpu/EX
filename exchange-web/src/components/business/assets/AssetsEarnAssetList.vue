<script setup lang="ts">
/**
 * 资产中心 · 理财账户 — 资产明细列表（基金持仓、矿机钱包与订单、助力贷借据、质押仓位）。
 */
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { storeToRefs } from 'pinia'
import { RouteNames } from '@/constants/routeNames'
import { fundEstimatedDailyUsdt } from '@/utils/finance/earnYield'
import { useFinanceFundStore } from '@/stores/financeFund'
import { useSmartMinerStore } from '@/stores/smartMiner'
import { useLendingAssistStore } from '@/stores/lendingAssist'
import { useStakingBorrowStore } from '@/stores/stakingBorrow'
import { formatPrice } from '@/utils/format/number'

export type EarnAssetListRow = {
  channel: string
  channelRoute: (typeof RouteNames)[keyof typeof RouteNames]
  name: string
  detail: string
  /** 展示用折合；负债为负 */
  valueUsdt: number
  tone: 'asset' | 'liability' | 'neutral'
}

const fund = useFinanceFundStore()
const miner = useSmartMinerStore()
const lend = useLendingAssistStore()
const stake = useStakingBorrowStore()

const { positions: fundPositions, products } = storeToRefs(fund)
const { walletUsdt, activeOrders, productMap: minerProducts } = storeToRefs(miner)
const { loans, planMap } = storeToRefs(lend)
const { positions: stakePositions } = storeToRefs(stake)

function fundProductName(id: string) {
  return products.value.find((p) => p.id === id)?.name ?? id
}

function lendingStatusLabel(s: string) {
  if (s === 'PENDING_REVIEW') return '审核中'
  if (s === 'ACTIVE') return '还款中'
  if (s === 'OVERDUE') return '已逾期'
  if (s === 'SETTLED') return '已结清'
  return s
}

const tableRows = computed<EarnAssetListRow[]>(() => {
  const rows: EarnAssetListRow[] = []

  for (const pos of fundPositions.value) {
    const p = products.value.find((x) => x.id === pos.productId)
    const val = pos.amount + pos.accruedInterest
    const daily = p ? fundEstimatedDailyUsdt(pos.amount, p.apyPct) : 0
    rows.push({
      channel: '基金理财',
      channelRoute: RouteNames.FinanceFund,
      name: fundProductName(pos.productId),
      detail: `本金 ${formatPrice(pos.amount)} USDT · 累计收益 ${formatPrice(pos.accruedInterest)} · 日估 ${formatPrice(daily)} USDT`,
      valueUsdt: val,
      tone: 'asset',
    })
  }

  rows.push({
    channel: '智能矿机',
    channelRoute: RouteNames.SmartMiner,
    name: '矿机钱包',
    detail: '可用于购买算力的 USDT 余额（演示）',
    valueUsdt: walletUsdt.value,
    tone: 'neutral',
  })

  for (const o of activeOrders.value) {
    const p = minerProducts.value.get(o.productId)
    const daily = p ? p.estDailyUsdt * o.quantity : 0
    rows.push({
      channel: '智能矿机',
      channelRoute: RouteNames.SmartMiner,
      name: p?.name ? `${p.name} × ${o.quantity}` : `订单 ${o.productId}`,
      detail: `算力本金（实付）· 日估产出 ${formatPrice(daily)} USDT/天`,
      valueUsdt: o.paidUsdt,
      tone: 'asset',
    })
  }

  for (const loan of loans.value) {
    if (loan.status === 'SETTLED' || loan.status === 'PENDING_REVIEW') continue
    const plan = planMap.value.get(loan.planId)
    const due = loan.principal + loan.accruedInterest
    rows.push({
      channel: '助力贷',
      channelRoute: RouteNames.LendingAssist,
      name: plan?.name ? `${plan.name}` : loan.planId,
      detail: `本金 ${formatPrice(loan.principal)} · 应计息 ${formatPrice(loan.accruedInterest)} · ${lendingStatusLabel(loan.status)}`,
      valueUsdt: -due,
      tone: 'liability',
    })
  }

  for (const p of stakePositions.value) {
    const usd = p.collateralAmount * stake.px(p.collateralAsset)
    const debt = p.borrowedUsdt + p.accruedInterestUsdt
    const net = usd - debt
    rows.push({
      channel: '质押借币',
      channelRoute: RouteNames.StakingBorrow,
      name: `${p.collateralAsset} 仓位`,
      detail: `质押 ${formatPrice(p.collateralAmount)} ${p.collateralAsset}（≈ ${formatPrice(usd)} USDT）· 负债 ${formatPrice(debt)} USDT`,
      valueUsdt: net,
      tone: net >= 0 ? 'asset' : 'liability',
    })
  }

  return rows
})

const hasRows = computed(() => tableRows.value.length > 0)

function displayValue(n: number) {
  const abs = formatPrice(Math.abs(n))
  return n < 0 ? `-${abs}` : abs
}
</script>

<template>
  <section class="aeal" aria-label="理财资产列表">
    <div class="aeal__hd">
      <h3 class="aeal__title">资产列表</h3>
      <p class="aeal__sub">按持仓/订单拆行；负值表示应偿负债。点击「产品线」进入对应功能页。</p>
    </div>

    <div v-if="!hasRows" class="aeal__empty">暂无理财类资产明细，请在各产品中申购/下单或登录后查看演示持仓。</div>

    <div v-else class="aeal__wrap">
      <table class="aeal__table">
        <thead>
          <tr>
            <th scope="col">产品线</th>
            <th scope="col">名称</th>
            <th scope="col">明细</th>
            <th scope="col" class="aeal__th-num">折合 USDT</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, idx) in tableRows" :key="`${row.channel}-${idx}-${row.name}`">
            <td>
              <RouterLink class="aeal__link" :to="{ name: row.channelRoute }">{{ row.channel }}</RouterLink>
            </td>
            <td class="aeal__name">{{ row.name }}</td>
            <td class="aeal__detail">{{ row.detail }}</td>
            <td
              class="aeal__num ex-num"
              :class="{
                'aeal__num--fall': row.valueUsdt < 0,
                'aeal__num--rise': row.valueUsdt > 0 && row.tone === 'asset',
              }"
            >
              {{ displayValue(row.valueUsdt) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;
@use '@/styles/mixins' as mq;

.aeal {
  margin-top: $space-4;
  border-radius: $radius-md;
  border: 1px solid $color-border;
  background: var(--ex-panel-sunken);
  overflow: hidden;
}

.aeal__hd {
  padding: $space-3 $space-4;
  border-bottom: 1px solid var(--ex-border-subtle);
}

.aeal__title {
  margin: 0 0 4px;
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.aeal__sub {
  margin: 0;
  font-size: 10px;
  color: $color-text-tertiary;
  line-height: 1.45;
}

.aeal__empty {
  margin: 0;
  padding: $space-6 $space-4;
  text-align: center;
  font-size: $font-size-xs;
  color: $color-text-tertiary;
}

.aeal__wrap {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.aeal__table {
  width: 100%;
  min-width: 560px;
  border-collapse: collapse;
  font-size: $font-size-xs;
}

.aeal__table th,
.aeal__table td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid var(--ex-border-subtle);
  vertical-align: top;
}

.aeal__table th {
  font-size: 10px;
  font-weight: $font-weight-bold;
  color: $color-text-tertiary;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  background: var(--ex-surface-inset);
}

.aeal__th-num {
  text-align: right;
}

.aeal__table tbody tr:hover {
  background: rgba(240, 185, 11, 0.04);
}

.aeal__link {
  color: $color-brand;
  font-weight: $font-weight-semibold;
  text-decoration: none;
  white-space: nowrap;

  &:hover {
    text-decoration: underline;
  }
}

.aeal__name {
  font-weight: $font-weight-semibold;
  color: $color-text-primary;
  white-space: nowrap;
}

.aeal__detail {
  color: $color-text-tertiary;
  line-height: 1.45;
  max-width: 360px;
}

.aeal__num {
  text-align: right;
  font-weight: $font-weight-bold;
  white-space: nowrap;
  color: $color-text-primary;
}

.aeal__num--rise {
  color: $color-rise;
}

.aeal__num--fall {
  color: $color-fall;
}

.ex-num {
  font-family: $font-family-mono;
}

@include mq.media-down(md) {
  .aeal__detail {
    max-width: 220px;
  }
}
</style>
