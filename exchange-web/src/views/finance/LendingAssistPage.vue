<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { storeToRefs } from 'pinia'
import { RouteNames } from '@/constants/routeNames'
import { useLendingAssistStore } from '@/stores/lendingAssist'
import { useAuthStore } from '@/stores/auth'
import ExPageState from '@/components/common/ExPageState.vue'
import LendingApplyModal from '@/components/business/finance/LendingApplyModal.vue'
import LendingRepayModal from '@/components/business/finance/LendingRepayModal.vue'
import type { LendingAssistPlan, LendingLoan } from '@/types/financeCredit'
import { formatPrice } from '@/utils/format/number'

const store = useLendingAssistStore()
const { loading, loadError, plans, loans, totalQuotaUsdt, usedPrincipal, availableQuota } = storeToRefs(store)
const auth = useAuthStore()

const tab = ref<'plans' | 'active' | 'history'>('plans')
const applyOpen = ref(false)
const repayOpen = ref(false)
const selectedPlan = ref<LendingAssistPlan | null>(null)
const repayLoan = ref<LendingLoan | null>(null)

let tick: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  void store.bootstrap().then(() => store.accrueDemoInterest())
  tick = setInterval(() => store.accrueDemoInterest(), 45_000)
})

onUnmounted(() => {
  if (tick) clearInterval(tick)
})

function openApply(p: LendingAssistPlan) {
  selectedPlan.value = p
  applyOpen.value = true
}

function openRepay(loan: LendingLoan) {
  repayLoan.value = loan
  repayOpen.value = true
}

function planName(id: string) {
  return plans.value.find((x) => x.id === id)?.name ?? id
}

function planForLoan(loan: { planId: string }) {
  return plans.value.find((x) => x.id === loan.planId) ?? null
}

function totalDue(loan: LendingLoan) {
  return loan.principal + loan.accruedInterest
}

function statusLabel(s: LendingLoan['status']) {
  if (s === 'PENDING_REVIEW') return '审核中'
  if (s === 'ACTIVE') return '还款中'
  if (s === 'OVERDUE') return '已逾期'
  return '已结清'
}

const pendingLoans = computed(() => loans.value.filter((l) => l.status === 'PENDING_REVIEW'))
const activeLoans = computed(() => loans.value.filter((l) => l.status === 'ACTIVE' || l.status === 'OVERDUE'))
const settledLoans = computed(() => loans.value.filter((l) => l.status === 'SETTLED'))
const myLoansTabCount = computed(() => pendingLoans.value.length + activeLoans.value.length)

function fmtDate(iso: string) {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('zh-CN', { dateStyle: 'short', timeStyle: 'short' })
}
</script>

<template>
  <div class="lap">
    <header class="lap__hero">
      <div>
        <h1 class="lap__title">助力贷</h1>
        <p class="lap__sub">信用类助力额度 · 多期限方案 · 支持提前还款（演示数据）</p>
      </div>
      <div class="lap__hero-actions">
        <button type="button" class="lap__ghost" @click="tab = 'history'">历史记录</button>
        <RouterLink :to="{ name: RouteNames.StakingBorrow }" class="lap__link">质押借币 →</RouterLink>
      </div>
    </header>

    <div class="lap__stats">
      <div class="lap__stat">
        <span class="lap__sl">总额度</span>
        <span class="lap__sv ex-num">{{ formatPrice(totalQuotaUsdt) }}</span>
        <span class="lap__su">USDT</span>
      </div>
      <div class="lap__stat">
        <span class="lap__sl">已用本金</span>
        <span class="lap__sv ex-num">{{ formatPrice(usedPrincipal) }}</span>
        <span class="lap__su">USDT</span>
      </div>
      <div class="lap__stat">
        <span class="lap__sl">剩余可借</span>
        <span class="lap__sv ex-num lap__sv--accent">{{ formatPrice(availableQuota) }}</span>
        <span class="lap__su">USDT</span>
      </div>
    </div>

    <p v-if="!auth.isAuthenticated" class="lap__auth-hint">
      未登录仅可浏览方案；
      <RouterLink :to="{ name: RouteNames.Login }" class="lap__a">去登录</RouterLink>
      后申请/还款将写入演示借据。
    </p>

    <ExPageState
      :loading="loading && plans.length === 0"
      use-skeleton
      skeleton-variant="panel"
      :error="loadError"
      loading-text="加载助力贷方案…"
      @retry="store.bootstrap(true)"
    >
      <div class="lap__tabs" role="tablist">
        <button
          type="button"
          role="tab"
          class="lap__tab"
          :class="{ 'lap__tab--on': tab === 'plans' }"
          @click="tab = 'plans'"
        >
          借款方案
        </button>
        <button
          type="button"
          role="tab"
          class="lap__tab"
          :class="{ 'lap__tab--on': tab === 'active' }"
          @click="tab = 'active'"
        >
          我的借款
          <span class="lap__badge">{{ myLoansTabCount }}</span>
        </button>
        <button
          type="button"
          role="tab"
          class="lap__tab"
          :class="{ 'lap__tab--on': tab === 'history' }"
          @click="tab = 'history'"
        >
          历史记录
          <span class="lap__badge">{{ settledLoans.length }}</span>
        </button>
      </div>

      <section v-show="tab === 'plans'" class="lap__grid">
        <article v-for="p in plans" :key="p.id" class="lap-card">
          <div class="lap-card__top">
            <span class="lap-card__tag">{{ p.termDays }} 天期</span>
            <span class="lap-card__risk">信用助力</span>
          </div>
          <h2 class="lap-card__name">{{ p.name }}</h2>
          <p class="lap-card__rate">
            <span class="lap-card__rate-num">{{ p.dailyRatePct }}%</span>
            <span class="lap-card__rate-lab">日利率（展示）</span>
          </p>
          <p class="lap-card__rule">{{ p.purposeHint }}</p>
          <p class="lap-card__range">单笔 {{ formatPrice(p.minAmount) }} ~ {{ formatPrice(p.maxAmount) }} USDT</p>
          <button type="button" class="lap-card__btn" @click="openApply(p)">申请借款</button>
        </article>
      </section>

      <section v-show="tab === 'active'" class="lap__pos">
        <p v-if="pendingLoans.length" class="lap__pending-hint">
          以下申请正在等待<strong class="lap__hl">平台后台审批</strong>。通过后您将收到<strong class="lap__hl">公告</strong>通知，并进入「还款中」状态。演示可点击<strong
            class="lap__hl"
            >模拟审核通过</strong
          >完成闭环。
        </p>
        <div v-for="loan in pendingLoans" :key="loan.id" class="lap-pos lap-pos--pending">
          <div class="lap-pos__main">
            <span class="lap-pos__name">{{ planName(loan.planId) }}</span>
            <span class="lap-pos__st lap-pos__st--pending">{{ statusLabel(loan.status) }}</span>
          </div>
          <div class="lap-pos__amt ex-num">申请本金 {{ formatPrice(loan.principal) }} USDT · 尚未放款</div>
          <dl class="lap-pos__detail" aria-label="申请详情">
            <div class="lap-pos__kv">
              <dt class="lap-pos__k">日利率（展示）</dt>
              <dd class="lap-pos__v ex-num">{{ planForLoan(loan)?.dailyRatePct ?? '—' }}%</dd>
            </div>
            <div class="lap-pos__kv">
              <dt class="lap-pos__k">借款期限</dt>
              <dd class="lap-pos__v">{{ planForLoan(loan)?.termDays ?? '—' }} 天</dd>
            </div>
            <div class="lap-pos__kv lap-pos__kv--wide">
              <dt class="lap-pos__k">申请编号</dt>
              <dd class="lap-pos__v lap-pos__mono">{{ loan.id }}</dd>
            </div>
          </dl>
          <div class="lap-pos__meta">
            <span>提交 {{ fmtDate(loan.borrowedAt) }}</span>
            <span>到期日 · 待审核通过后确定</span>
          </div>
          <div class="lap-pos__act lap-pos__act--stack">
            <button type="button" class="lap-pos__btn lap-pos__btn--demo" @click="store.approveDemoApplication(loan.id)">
              模拟后台审核通过（演示）
            </button>
          </div>
        </div>

        <p v-if="!pendingLoans.length && !activeLoans.length" class="lap__empty">暂无在贷或待审核申请，可在「借款方案」中提交。</p>
        <div v-for="loan in activeLoans" :key="loan.id" class="lap-pos">
          <div class="lap-pos__main">
            <span class="lap-pos__name">{{ planName(loan.planId) }}</span>
            <span
              class="lap-pos__st"
              :class="{
                'lap-pos__st--ok': loan.status === 'ACTIVE',
                'lap-pos__st--bad': loan.status === 'OVERDUE',
              }"
            >
              {{ statusLabel(loan.status) }}
            </span>
          </div>
          <div class="lap-pos__amt ex-num">
            本金 {{ formatPrice(loan.principal) }} USDT · 应计利息 {{ formatPrice(loan.accruedInterest) }} USDT
          </div>
          <dl class="lap-pos__detail" aria-label="借据详情">
            <div class="lap-pos__kv">
              <dt class="lap-pos__k">日利率（展示）</dt>
              <dd class="lap-pos__v ex-num">{{ planForLoan(loan)?.dailyRatePct ?? '—' }}%</dd>
            </div>
            <div class="lap-pos__kv">
              <dt class="lap-pos__k">借款期限</dt>
              <dd class="lap-pos__v">{{ planForLoan(loan)?.termDays ?? '—' }} 天</dd>
            </div>
            <div class="lap-pos__kv">
              <dt class="lap-pos__k">应还合计</dt>
              <dd class="lap-pos__v ex-num">{{ formatPrice(totalDue(loan)) }} USDT</dd>
            </div>
            <div class="lap-pos__kv">
              <dt class="lap-pos__k">计息方式</dt>
              <dd class="lap-pos__v">按未偿本金 × 日利率（演示）</dd>
            </div>
            <div class="lap-pos__kv lap-pos__kv--wide">
              <dt class="lap-pos__k">借据编号</dt>
              <dd class="lap-pos__v lap-pos__mono">{{ loan.id }}</dd>
            </div>
          </dl>
          <div class="lap-pos__meta">
            <span>放款 {{ fmtDate(loan.borrowedAt) }}</span>
            <span>到期 {{ fmtDate(loan.dueAt) }}</span>
          </div>
          <div class="lap-pos__act">
            <button type="button" class="lap-pos__btn" @click="openRepay(loan)">还款</button>
          </div>
        </div>
      </section>

      <section v-show="tab === 'history'" class="lap__pos">
        <p class="lap__hist-hint">已结清借据归档；对接信贷核心后可展示结清时间与还款流水。</p>
        <p v-if="!settledLoans.length" class="lap__empty">暂无历史借据，还清后将自动移入此处。</p>
        <div v-for="loan in settledLoans" :key="loan.id" class="lap-pos lap-pos--done">
          <div class="lap-pos__main">
            <span class="lap-pos__name">{{ planName(loan.planId) }}</span>
            <span class="lap-pos__st lap-pos__st--done">{{ statusLabel(loan.status) }}</span>
          </div>
          <div class="lap-pos__amt ex-num">
            结清本金 {{ formatPrice(loan.principal) }} USDT · 结清利息 {{ formatPrice(loan.accruedInterest) }} USDT
          </div>
          <dl class="lap-pos__detail lap-pos__detail--muted" aria-label="历史借据信息">
            <div class="lap-pos__kv">
              <dt class="lap-pos__k">日利率（展示）</dt>
              <dd class="lap-pos__v ex-num">{{ planForLoan(loan)?.dailyRatePct ?? '—' }}%</dd>
            </div>
            <div class="lap-pos__kv">
              <dt class="lap-pos__k">借款期限</dt>
              <dd class="lap-pos__v">{{ planForLoan(loan)?.termDays ?? '—' }} 天</dd>
            </div>
            <div class="lap-pos__kv lap-pos__kv--wide">
              <dt class="lap-pos__k">借据编号</dt>
              <dd class="lap-pos__v lap-pos__mono">{{ loan.id }}</dd>
            </div>
          </dl>
          <div class="lap-pos__meta">
            <span>原放款 {{ fmtDate(loan.borrowedAt) }}</span>
            <span>原到期 {{ fmtDate(loan.dueAt) }}</span>
          </div>
        </div>
      </section>
    </ExPageState>

    <p class="lap__foot">
      规则说明：利率、额度与风控以实际对接为准；本页为前端演示闭环。交互参考
      <a class="lap__a" href="https://www.binance.com/zh-CN/loan" target="_blank" rel="noopener noreferrer">币安借贷</a>
      类体验。
    </p>

    <RouterLink :to="{ name: RouteNames.FinanceFund }" class="lap__back">← 基金理财</RouterLink>

    <LendingApplyModal v-model="applyOpen" :plan="selectedPlan" @completed="tab = 'active'" />
    <LendingRepayModal
      v-model="repayOpen"
      :loan="repayLoan"
      :plan-label="repayLoan ? planName(repayLoan.planId) : ''"
      @confirm="({ loanId, amount }) => store.repay(loanId, amount)"
    />
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;
@use '@/styles/mixins' as mq;

.lap {
  max-width: min(1120px, var(--ex-container-max));
  margin: 0 auto;
  padding: 0 $space-4 $space-8;
  box-sizing: border-box;
}

.lap__hero {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: $space-3;
  margin-bottom: $space-4;
}

.lap__title {
  margin: 0 0 $space-1;
  font-size: $font-size-xl;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.lap__sub {
  margin: 0;
  font-size: $font-size-sm;
  color: $color-text-tertiary;
}

.lap__hero-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: $space-2;
}

.lap__ghost {
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  color: $color-text-secondary;
  padding: $space-2 $space-3;
  border-radius: $radius-sm;
  border: 1px solid $color-border-strong;
  background: var(--ex-surface-inset);
  cursor: pointer;
}

.lap__ghost:hover {
  color: $color-text-primary;
  border-color: rgba(240, 185, 11, 0.35);
}

.lap__hist-hint {
  margin: 0 0 $space-2;
  font-size: $font-size-xs;
  color: $color-text-tertiary;
  line-height: 1.5;
}

.lap__pending-hint {
  margin: 0 0 $space-2;
  padding: $space-2 $space-3;
  font-size: $font-size-xs;
  color: $color-text-secondary;
  line-height: 1.55;
  border-radius: $radius-sm;
  border: 1px solid rgba(240, 185, 11, 0.28);
  background: rgba(240, 185, 11, 0.06);
}

.lap__hl {
  color: $color-brand;
  font-weight: $font-weight-bold;
}

.lap-pos--pending {
  border-style: dashed;
}

.lap-pos__st--pending {
  background: rgba(240, 185, 11, 0.18);
  color: $color-brand;
}

.lap-pos__act--stack {
  flex-direction: column;
  align-items: stretch;
}

.lap-pos__btn--demo {
  border-style: dashed;
  color: $color-text-secondary;
  background: var(--ex-fill-hover-subtle);
}

.lap-pos--done {
  opacity: 0.92;
}

.lap__link {
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  color: $color-brand;
  text-decoration: none;
  padding: $space-2 $space-3;
  border-radius: $radius-sm;
  border: 1px solid rgba(240, 185, 11, 0.35);
  background: rgba(240, 185, 11, 0.08);
}

.lap__link:hover {
  background: rgba(240, 185, 11, 0.14);
}

.lap__stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $space-2;
  margin-bottom: $space-4;
}

@include mq.media-down(md) {
  .lap__stats {
    grid-template-columns: 1fr;
  }
}

.lap__stat {
  padding: $space-3;
  border-radius: $radius-md;
  border: 1px solid $color-border;
  background: var(--ex-card-surface);
}

.lap__sl {
  display: block;
  font-size: 11px;
  color: $color-text-tertiary;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 4px;
}

.lap__sv {
  font-size: $font-size-lg;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.lap__sv--accent {
  color: $color-rise;
}

.lap__su {
  font-size: $font-size-xs;
  color: $color-text-tertiary;
  margin-left: 4px;
}

.lap__auth-hint {
  font-size: $font-size-xs;
  color: $color-text-secondary;
  margin: 0 0 $space-3;
  padding: $space-2 $space-3;
  border-radius: $radius-sm;
  background: rgba(48, 132, 252, 0.08);
  border: 1px solid rgba(48, 132, 252, 0.2);
}

.lap__a {
  color: $color-brand;
  text-decoration: none;
  font-weight: $font-weight-semibold;
}

.lap__a:hover {
  text-decoration: underline;
}

.lap__tabs {
  display: flex;
  gap: $space-1;
  margin-bottom: $space-3;
  padding: 4px;
  border-radius: $radius-md;
  background: var(--ex-surface-inset);
  border: 1px solid $color-border;
}

.lap__tab {
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

.lap__tab--on {
  color: $color-text-primary;
  background: rgba(240, 185, 11, 0.14);
  box-shadow: 0 0 0 1px rgba(240, 185, 11, 0.25);
}

.lap__badge {
  font-size: 10px;
  padding: 0 6px;
  border-radius: 8px;
  background: rgba(240, 185, 11, 0.2);
  color: $color-brand;
}

.lap__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: $space-3;
}

.lap-card {
  padding: $space-4;
  border-radius: $radius-md;
  border: 1px solid $color-border;
  background: var(--ex-card-surface);
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.lap-card__top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.lap-card__tag {
  font-size: 10px;
  font-weight: $font-weight-bold;
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(240, 185, 11, 0.12);
  color: $color-brand;
}

.lap-card__risk {
  font-size: 10px;
  color: $color-text-tertiary;
}

.lap-card__name {
  margin: 0;
  font-size: $font-size-md;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.lap-card__rate {
  margin: 0;
  display: flex;
  align-items: baseline;
  gap: $space-2;
}

.lap-card__rate-num {
  font-size: 28px;
  font-weight: $font-weight-bold;
  font-family: $font-family-mono;
  color: $color-rise;
}

.lap-card__rate-lab {
  font-size: $font-size-xs;
  color: $color-text-tertiary;
}

.lap-card__rule,
.lap-card__range {
  margin: 0;
  font-size: $font-size-xs;
  color: $color-text-tertiary;
  line-height: 1.45;
}

.lap-card__btn {
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

.lap-card__btn:hover {
  filter: brightness(1.05);
}

.lap__pos {
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.lap__empty {
  text-align: center;
  padding: $space-8;
  color: $color-text-tertiary;
  font-size: $font-size-sm;
}

.lap-pos {
  padding: $space-3 $space-4;
  border-radius: $radius-md;
  border: 1px solid $color-border;
  background: var(--ex-panel-sunken);
}

.lap-pos__main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $space-2;
}

.lap-pos__name {
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.lap-pos__st {
  font-size: 10px;
  font-weight: $font-weight-bold;
  padding: 2px 8px;
  border-radius: 4px;
}

.lap-pos__st--ok {
  background: rgba(14, 203, 129, 0.15);
  color: $color-rise;
}

.lap-pos__st--bad {
  background: $color-fall-bg;
  color: $color-fall;
}

.lap-pos__st--done {
  background: var(--ex-fill-hover-subtle);
  color: $color-text-tertiary;
}

.lap-pos__amt {
  font-size: $font-size-sm;
  color: $color-text-secondary;
  margin-bottom: $space-2;
}

.lap-pos__detail {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: $space-2 $space-4;
  margin: 0 0 $space-3;
  padding: $space-3 0;
  border-top: 1px solid var(--ex-border-subtle);
  border-bottom: 1px solid var(--ex-border-subtle);
}

.lap-pos__detail--muted {
  opacity: 0.92;
}

.lap-pos__kv {
  margin: 0;
  min-width: 0;
}

.lap-pos__kv--wide {
  grid-column: 1 / -1;
}

.lap-pos__k {
  margin: 0 0 4px;
  font-size: 10px;
  font-weight: $font-weight-semibold;
  color: $color-text-tertiary;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.lap-pos__v {
  margin: 0;
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  color: $color-text-primary;
  line-height: 1.35;
}

.lap-pos__mono {
  font-family: $font-family-mono;
  font-size: 10px;
  font-weight: $font-weight-semibold;
  word-break: break-all;
}

.lap-pos__meta {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2 $space-4;
  font-size: $font-size-xs;
  color: $color-text-tertiary;
  margin-bottom: $space-2;
}

.lap-pos__act {
  display: flex;
  gap: $space-2;
}

.lap-pos__btn {
  padding: 6px $space-3;
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  border-radius: $radius-sm;
  border: 1px solid rgba(240, 185, 11, 0.4);
  background: rgba(240, 185, 11, 0.1);
  color: $color-brand;
  cursor: pointer;
}

.lap__foot {
  margin-top: $space-6;
  font-size: 11px;
  color: $color-text-tertiary;
  line-height: 1.6;
}

.lap__back {
  display: inline-block;
  margin-top: $space-3;
  font-size: $font-size-sm;
  color: $color-text-tertiary;
  text-decoration: none;
}

.lap__back:hover {
  color: $color-brand;
}

.ex-num {
  font-family: $font-family-mono;
}
</style>
