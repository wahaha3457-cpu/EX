<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { storeToRefs } from 'pinia'
import { RouteNames } from '@/constants/routeNames'
import { useFinanceFundStore } from '@/stores/financeFund'
import { useSmartMinerStore } from '@/stores/smartMiner'
import { useLendingAssistStore } from '@/stores/lendingAssist'
import { useStakingBorrowStore } from '@/stores/stakingBorrow'
import type { FundHistoryKind } from '@/types/financeEarn'
import type { LendingLoan } from '@/types/financeCredit'
import type { StakingLedgerKind } from '@/types/financeCredit'
import { formatPrice } from '@/utils/format/number'

const fund = useFinanceFundStore()
const miner = useSmartMinerStore()
const lend = useLendingAssistStore()
const stake = useStakingBorrowStore()

const { fundHistory, products: fundProducts } = storeToRefs(fund)
const { orders: minerOrders, products: minerProducts } = storeToRefs(miner)
const { loans, plans } = storeToRefs(lend)
const { stakingLedger } = storeToRefs(stake)

onMounted(() => {
  void Promise.all([
    fund.bootstrap(),
    miner.bootstrap(),
    lend.bootstrap(),
    stake.bootstrap(),
  ])
})

function fundKindLabel(k: FundHistoryKind) {
  if (k === 'SUBSCRIBE') return '申购'
  if (k === 'REDEEM') return '赎回'
  return '续投'
}

function fundProductName(id: string) {
  return fundProducts.value.find((x) => x.id === id)?.name ?? id
}

function minerProductName(id: string) {
  return minerProducts.value.find((x) => x.id === id)?.name ?? id
}

function planName(id: string) {
  return plans.value.find((x) => x.id === id)?.name ?? id
}

function loanStatus(l: LendingLoan) {
  if (l.status === 'PENDING_REVIEW') return '审核中'
  if (l.status === 'ACTIVE') return '还款中'
  if (l.status === 'OVERDUE') return '已逾期'
  return '已结清'
}

function stakeKindLabel(k: StakingLedgerKind) {
  if (k === 'BORROW') return '借币'
  if (k === 'REPAY') return '还款'
  if (k === 'ADD_COLLATERAL') return '追加质押'
  return '结清'
}

type MergedRow = {
  id: string
  time: string
  channel: string
  summary: string
  status: string
}

const mergedRows = computed(() => {
  const rows: MergedRow[] = []

  for (const h of fundHistory.value) {
    const bits = [fundKindLabel(h.kind), fundProductName(h.productId)]
    if (h.amountUsdt > 0) bits.push(`${formatPrice(h.amountUsdt)} USDT`)
    if (h.note) bits.push(h.note)
    rows.push({
      id: `fh-${h.id}`,
      time: h.time,
      channel: '基金理财',
      summary: bits.join(' · '),
      status: '已完成',
    })
  }

  for (const o of minerOrders.value) {
    rows.push({
      id: `mo-${o.id}`,
      time: o.purchasedAt,
      channel: '智能矿机',
      summary: `${minerProductName(o.productId)} × ${o.quantity} · 支付 ${formatPrice(o.paidUsdt)} USDT`,
      status: o.status === 'MINING' ? '进行中' : '已结算',
    })
  }

  for (const l of loans.value) {
    const sumTail =
      l.status === 'PENDING_REVIEW'
        ? `申请本金 ${formatPrice(l.principal)} USDT · 待放款`
        : `本金 ${formatPrice(l.principal)} USDT · 利息 ${formatPrice(l.accruedInterest)} USDT`
    rows.push({
      id: `ll-${l.id}`,
      time: l.borrowedAt,
      channel: '助力贷',
      summary: `${planName(l.planId)} · ${sumTail}`,
      status: loanStatus(l),
    })
  }

  for (const s of stakingLedger.value) {
    rows.push({
      id: `sl-${s.id}`,
      time: s.time,
      channel: '质押借币',
      summary: `${stakeKindLabel(s.kind)} · ${s.summary}`,
      status: '记录',
    })
  }

  return rows.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
})

const hasMerged = computed(() => mergedRows.value.length > 0)

function fmtTime(iso: string) {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('zh-CN', { dateStyle: 'short', timeStyle: 'short' })
}

const quickLinks = [
  { name: RouteNames.FinanceFund, label: '基金理财' },
  { name: RouteNames.SmartMiner, label: '智能矿机' },
  { name: RouteNames.LendingAssist, label: '助力贷' },
  { name: RouteNames.StakingBorrow, label: '质押借币' },
] as const
</script>

<template>
  <div class="ocv">
    <section class="ocv__intro" aria-label="说明">
      <p class="ocv__intro-p">
        理财订单汇总基金、矿机、助力贷与质押借币的演示流水（与各产品页「历史记录」同源）。正式环境建议按业务线拆分接口或统一理财中台订单号。
      </p>
      <ul class="ocv__intro-ul">
        <li>表格按时间倒序合并展示；各频道仍可在下方入口进入完整功能与筛选。</li>
        <li>未登录时部分 store 无演示写入，列表可能仅含种子数据。</li>
      </ul>
    </section>

    <div class="ocv__links" aria-label="理财入口">
      <RouterLink v-for="q in quickLinks" :key="q.name" :to="{ name: q.name }" class="ocv__pill">
        {{ q.label }}
      </RouterLink>
    </div>

    <div class="ocv__panel">
      <div class="ocv__panel-hd">
        <h2 class="ocv__h2">理财订单</h2>
        <span class="ocv__count">{{ mergedRows.length }} 条</span>
      </div>

      <div class="ocv__table-wrap">
        <table class="ocv__table" aria-label="理财订单合并列表">
          <thead>
            <tr>
              <th>时间</th>
              <th>类型</th>
              <th>摘要</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            <template v-if="hasMerged">
              <tr v-for="r in mergedRows" :key="r.id">
                <td class="ocv__mono">{{ fmtTime(r.time) }}</td>
                <td>{{ r.channel }}</td>
                <td class="ocv__sum">{{ r.summary }}</td>
                <td>
                  <span class="ocv__st">{{ r.status }}</span>
                </td>
              </tr>
            </template>
            <tr v-else>
              <td colspan="4" class="ocv__empty">暂无理财类记录，请先在各理财产品中操作或等待演示数据加载。</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;
@use '@/styles/mixins' as mq;

.ocv__intro {
  margin-bottom: $space-4;
  padding: $space-3 $space-4;
  border-radius: $radius-md;
  border: 1px solid $color-border;
  background: var(--ex-panel-sunken);
}

.ocv__intro-p {
  margin: 0 0 $space-2;
  font-size: $font-size-sm;
  color: $color-text-secondary;
  line-height: 1.55;
}

.ocv__intro-ul {
  margin: 0;
  padding-left: 1.2rem;
  font-size: $font-size-xs;
  color: $color-text-tertiary;
  line-height: 1.6;
}

.ocv__links {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
  margin-bottom: $space-4;
}

.ocv__pill {
  padding: $space-2 $space-3;
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  color: $color-brand;
  text-decoration: none;
  border-radius: $radius-md;
  border: 1px solid rgba(240, 185, 11, 0.35);
  background: rgba(240, 185, 11, 0.08);

  &:hover {
    background: rgba(240, 185, 11, 0.14);
  }
}

.ocv__panel {
  border: 1px solid $color-border;
  border-radius: $radius-lg;
  background: var(--ex-card-surface);
  overflow: hidden;
}

.ocv__panel-hd {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: $space-2;
  padding: $space-3 $space-4;
  border-bottom: 1px solid $color-border;
  background: var(--ex-panel-sunken);
}

.ocv__h2 {
  margin: 0;
  font-size: $font-size-md;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.ocv__count {
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  color: $color-text-tertiary;
}

.ocv__table-wrap {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.ocv__table {
  width: 100%;
  min-width: 640px;
  border-collapse: collapse;
  font-size: $font-size-xs;
}

.ocv__table th,
.ocv__table td {
  padding: $space-2 $space-3;
  text-align: left;
  border-bottom: 1px solid var(--ex-border-subtle);
  vertical-align: top;
}

.ocv__table th {
  font-weight: $font-weight-bold;
  color: $color-text-tertiary;
  background: var(--ex-surface-inset);
  white-space: nowrap;
}

.ocv__table td {
  color: $color-text-secondary;
}

.ocv__mono {
  font-family: $font-family-mono;
  white-space: nowrap;
}

.ocv__sum {
  max-width: 360px;
  line-height: 1.45;
  word-break: break-word;
}

.ocv__st {
  font-weight: $font-weight-semibold;
  color: $color-text-primary;
}

.ocv__empty {
  text-align: center;
  padding: $space-6 $space-3 !important;
  color: $color-text-tertiary;
}

@include mq.media-down(md) {
  .ocv__table {
    min-width: 100%;
  }
}
</style>
