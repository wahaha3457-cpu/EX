<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { storeToRefs } from 'pinia'
import { RouteNames } from '@/constants/routeNames'
import { useFinanceFundStore } from '@/stores/financeFund'
import { useAuthStore } from '@/stores/auth'
import ExPageState from '@/components/common/ExPageState.vue'
import FundSubscribeModal from '@/components/business/finance/FundSubscribeModal.vue'
import FundRedeemModal from '@/components/business/finance/FundRedeemModal.vue'
import type { FundProduct, FundPosition, FundHistoryKind } from '@/types/financeEarn'
import { fundDailyYieldPct, fundEstimatedDailyUsdt } from '@/utils/finance/earnYield'
import { formatPrice } from '@/utils/format/number'

const store = useFinanceFundStore()
const {
  loading,
  loadError,
  products,
  positions,
  fundHistory,
  availableUsdt,
  totalPrincipal,
  totalAccrued,
  totalEstimatedDailyUsdt,
  portfolioDailyYieldPct,
} = storeToRefs(store)

const auth = useAuthStore()

const tab = ref<'products' | 'positions' | 'history'>('products')
const subscribeOpen = ref(false)
const redeemOpen = ref(false)
const selectedProduct = ref<FundProduct | null>(null)
const redeemPosition = ref<FundPosition | null>(null)

onMounted(() => {
  void store.bootstrap()
})

function openSubscribe(p: FundProduct) {
  selectedProduct.value = p
  subscribeOpen.value = true
}

function openRedeem(pos: FundPosition) {
  redeemPosition.value = pos
  redeemOpen.value = true
}

function productName(id: string) {
  return products.value.find((x) => x.id === id)?.name ?? id
}

function productOf(id: string) {
  return products.value.find((x) => x.id === id)
}

const sortedProducts = computed(() => {
  const flex = products.value.filter((p) => p.kind === 'FLEXIBLE')
  const fix = products.value.filter((p) => p.kind === 'FIXED')
  return [...flex, ...fix]
})

function fmtDate(iso: string) {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('zh-CN', { dateStyle: 'short', timeStyle: 'short' })
}

function fundHistoryKindLabel(k: FundHistoryKind) {
  if (k === 'SUBSCRIBE') return '申购'
  if (k === 'REDEEM') return '赎回'
  return '续投'
}

/** 展示用：日收益率（%） */
function fmtDailyYieldPct(n: number) {
  if (n <= 0) return '—'
  return `${n >= 0.01 ? n.toFixed(3) : n.toFixed(4)}%`
}
</script>

<template>
  <div class="ffp">
    <header class="ffp__hero">
      <div>
        <h1 class="ffp__title">基金理财</h1>
        <p class="ffp__sub">活期 / 定期 USDT 理财 · 参考日收益率与日估收益（年化按单利均摊至日，演示）</p>
      </div>
      <div class="ffp__hero-actions">
        <button type="button" class="ffp__ghost" @click="tab = 'history'">历史记录</button>
        <RouterLink :to="{ name: RouteNames.SmartMiner }" class="ffp__link">智能矿机 →</RouterLink>
      </div>
    </header>

    <div class="ffp__stats">
      <div class="ffp__stat">
        <span class="ffp__sl">持仓本金</span>
        <span class="ffp__sv ex-num">{{ formatPrice(totalPrincipal) }}</span>
        <span class="ffp__su">USDT</span>
      </div>
      <div class="ffp__stat">
        <span class="ffp__sl">累计收益</span>
        <span class="ffp__sv ex-num ffp__sv--pnl">{{ formatPrice(totalAccrued) }}</span>
        <span class="ffp__su">USDT</span>
      </div>
      <div class="ffp__stat">
        <span class="ffp__sl">可申购余额</span>
        <span class="ffp__sv ex-num">{{ formatPrice(availableUsdt) }}</span>
        <span class="ffp__su">USDT</span>
      </div>
    </div>

    <div v-if="totalPrincipal > 0" class="ffp__yield-strip">
      <div class="ffp__yield-item">
        <span class="ffp__yield-label">参考日收益率（持仓加权）</span>
        <span class="ffp__yield-val ex-num">{{ fmtDailyYieldPct(portfolioDailyYieldPct) }}</span>
        <span class="ffp__yield-unit">/ 日</span>
      </div>
      <div class="ffp__yield-item">
        <span class="ffp__yield-label">日估收益（合计）</span>
        <span class="ffp__yield-val ex-num ffp__yield-val--pnl">{{ formatPrice(totalEstimatedDailyUsdt) }}</span>
        <span class="ffp__yield-unit">USDT / 天</span>
      </div>
    </div>
    <p v-else class="ffp__yield-hint">持有份额后将展示加权日收益率与每日预估收益。</p>

    <p v-if="!auth.isAuthenticated" class="ffp__auth-hint">
      未登录仅可浏览产品；
      <RouterLink :to="{ name: RouteNames.Login }" class="ffp__a">去登录</RouterLink>
      后申购/赎回将写入演示持仓。
    </p>

    <ExPageState
      :loading="loading && products.length === 0"
      use-skeleton
      skeleton-variant="panel"
      :error="loadError"
      loading-text="加载理财产品…"
      @retry="store.bootstrap(true)"
    >
      <div class="ffp__tabs" role="tablist">
        <button
          type="button"
          role="tab"
          class="ffp__tab"
          :class="{ 'ffp__tab--on': tab === 'products' }"
          @click="tab = 'products'"
        >
          理财产品
        </button>
        <button
          type="button"
          role="tab"
          class="ffp__tab"
          :class="{ 'ffp__tab--on': tab === 'positions' }"
          @click="tab = 'positions'"
        >
          我的持仓
          <span class="ffp__badge">{{ positions.length }}</span>
        </button>
        <button
          type="button"
          role="tab"
          class="ffp__tab"
          :class="{ 'ffp__tab--on': tab === 'history' }"
          @click="tab = 'history'"
        >
          历史记录
          <span class="ffp__badge">{{ fundHistory.length }}</span>
        </button>
      </div>

      <section v-show="tab === 'products'" class="ffp__grid">
        <article v-for="p in sortedProducts" :key="p.id" class="ffp-card">
          <div class="ffp-card__top">
            <span class="ffp-card__tag" :class="p.kind === 'FLEXIBLE' ? 'ffp-card__tag--f' : 'ffp-card__tag--fx'">
              {{ p.kind === 'FLEXIBLE' ? '活期' : `定期 ${p.durationDays}天` }}
            </span>
            <span class="ffp-card__risk">{{ p.riskTag === 'LOW' ? '低风险' : '中风险' }}</span>
          </div>
          <h2 class="ffp-card__name">{{ p.name }}</h2>
          <p class="ffp-card__apy">
            <span class="ffp-card__apy-num ex-num">{{ formatPrice(fundEstimatedDailyUsdt(p.minAmount, p.apyPct)) }}</span>
            <span class="ffp-card__apy-lab">日估产出</span>
          </p>
          <p class="ffp-card__apy-sub">USDT/天 · 按最低申购金额测算</p>
          <p class="ffp-card__daily">
            参考年化 {{ p.apyPct }}% · 日收益率
            <span class="ffp-card__daily-num ex-num">{{ fmtDailyYieldPct(fundDailyYieldPct(p.apyPct)) }}</span> / 日
          </p>
          <p class="ffp-card__rule">{{ p.redeemRule }}</p>
          <p class="ffp-card__range">单笔 {{ formatPrice(p.minAmount) }} 起{{ p.maxPerUser ? ` · 上限 ${formatPrice(p.maxPerUser)}` : '' }}</p>
          <button type="button" class="ffp-card__btn" @click="openSubscribe(p)">申购</button>
        </article>
      </section>

      <section v-show="tab === 'history'" class="ffp__hist">
        <p class="ffp__hist-hint">申购、赎回与续投设置流水；对接后端后可分页与导出。</p>
        <p v-if="!fundHistory.length" class="ffp__empty">暂无记录，完成申购或赎回后将在此展示。</p>
        <div v-for="row in fundHistory" :key="row.id" class="ffp-hist">
          <div class="ffp-hist__row">
            <span class="ffp-hist__kind">{{ fundHistoryKindLabel(row.kind) }}</span>
            <span class="ffp-hist__time">{{ fmtDate(row.time) }}</span>
          </div>
          <div class="ffp-hist__main">{{ productName(row.productId) }}</div>
          <div class="ffp-hist__meta">
            <span v-if="row.amountUsdt > 0" class="ex-num">{{ formatPrice(row.amountUsdt) }} USDT</span>
            <span v-if="row.note">{{ row.note }}</span>
          </div>
        </div>
      </section>

      <section v-show="tab === 'positions'" class="ffp__pos">
        <p v-if="!positions.length" class="ffp__empty">暂无持仓，可在「理财产品」中申购。</p>
        <div v-for="pos in positions" :key="pos.id" class="ffp-pos">
          <div class="ffp-pos__main">
            <span class="ffp-pos__name">{{ productName(pos.productId) }}</span>
            <span class="ffp-pos__amt ex-num">{{ formatPrice(pos.amount) }} USDT</span>
          </div>
          <div class="ffp-pos__meta">
            <span>收益 {{ formatPrice(pos.accruedInterest) }} USDT</span>
            <span>申购 {{ fmtDate(pos.subscribedAt) }}</span>
            <span v-if="pos.maturityAt">到期 {{ fmtDate(pos.maturityAt) }}</span>
            <span v-else>随时可赎</span>
          </div>
          <p v-if="productOf(pos)" class="ffp-pos__daily">
            日估产出约 <span class="ex-num">{{ formatPrice(fundEstimatedDailyUsdt(pos.amount, productOf(pos)!.apyPct)) }}</span> USDT/天 · 参考年化
            {{ productOf(pos)!.apyPct }}% · 日收益率
            {{ fmtDailyYieldPct(fundDailyYieldPct(productOf(pos)!.apyPct)) }} / 日
          </p>
          <div class="ffp-pos__act">
            <template v-if="productOf(pos.productId)?.kind === 'FLEXIBLE'">
              <button type="button" class="ffp-pos__btn" @click="openRedeem(pos)">赎回</button>
            </template>
            <template v-else>
              <button type="button" class="ffp-pos__renew" @click="store.toggleAutoRenew(pos.id)">
                {{ pos.autoRenew ? '✓ 已开启自动续投' : '开启到期自动续投' }}
              </button>
            </template>
          </div>
        </div>
      </section>
    </ExPageState>

    <p class="ffp__foot">
      规则说明：定期产品在锁定期内不支持提前赎回；收益率随市场与产品策略调整，以页面展示为准。设计交互参考
      <a class="ffp__a" href="https://www.binance.com/zh-CN/earn" target="_blank" rel="noopener noreferrer">币安 Earn</a>
      类体验。
    </p>

    <FundSubscribeModal v-model="subscribeOpen" :product="selectedProduct" :available-usdt="availableUsdt" />
    <FundRedeemModal v-model="redeemOpen" :position="redeemPosition" />
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;
@use '@/styles/mixins' as mq;

.ffp {
  max-width: min(1120px, var(--ex-container-max));
  margin: 0 auto;
  padding: 0 $space-4 $space-8;
  box-sizing: border-box;
}

.ffp__hero {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: $space-3;
  margin-bottom: $space-4;
}

.ffp__title {
  margin: 0 0 $space-1;
  font-size: $font-size-xl;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.ffp__sub {
  margin: 0;
  font-size: $font-size-sm;
  color: $color-text-tertiary;
}

.ffp__hero-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: $space-2;
}

.ffp__ghost {
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  color: $color-text-secondary;
  padding: $space-2 $space-3;
  border-radius: $radius-sm;
  border: 1px solid $color-border-strong;
  background: var(--ex-surface-inset);
  cursor: pointer;
}

.ffp__ghost:hover {
  color: $color-text-primary;
  border-color: rgba(240, 185, 11, 0.35);
}

.ffp__link {
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  color: $color-brand;
  text-decoration: none;
  padding: $space-2 $space-3;
  border-radius: $radius-sm;
  border: 1px solid rgba(240, 185, 11, 0.35);
  background: rgba(240, 185, 11, 0.08);
}

.ffp__link:hover {
  background: rgba(240, 185, 11, 0.14);
}

.ffp__stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $space-2;
  margin-bottom: $space-4;
}

@include mq.media-down(md) {
  .ffp__stats {
    grid-template-columns: 1fr;
  }
}

.ffp__stat {
  padding: $space-3;
  border-radius: $radius-md;
  border: 1px solid $color-border;
  background: var(--ex-card-surface);
}

.ffp__sl {
  display: block;
  font-size: 11px;
  color: $color-text-tertiary;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 4px;
}

.ffp__sv {
  font-size: $font-size-lg;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.ffp__sv--pnl {
  color: $color-rise;
}

.ffp__su {
  font-size: $font-size-xs;
  color: $color-text-tertiary;
  margin-left: 4px;
}

.ffp__yield-strip {
  display: flex;
  flex-wrap: wrap;
  gap: $space-3 $space-6;
  margin-bottom: $space-4;
  padding: $space-3 $space-4;
  border-radius: $radius-md;
  border: 1px solid rgba(14, 203, 129, 0.28);
  background: rgba(14, 203, 129, 0.06);
}

.ffp__yield-item {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 6px;
}

.ffp__yield-label {
  font-size: 11px;
  font-weight: $font-weight-semibold;
  color: $color-text-secondary;
}

.ffp__yield-val {
  font-size: $font-size-md;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.ffp__yield-val--pnl {
  color: $color-rise;
}

.ffp__yield-unit {
  font-size: $font-size-xs;
  color: $color-text-tertiary;
}

.ffp__yield-hint {
  margin: 0 0 $space-4;
  font-size: $font-size-xs;
  color: $color-text-tertiary;
}

.ffp__auth-hint {
  font-size: $font-size-xs;
  color: $color-text-secondary;
  margin: 0 0 $space-3;
  padding: $space-2 $space-3;
  border-radius: $radius-sm;
  background: rgba(48, 132, 252, 0.08);
  border: 1px solid rgba(48, 132, 252, 0.2);
}

.ffp__a {
  color: $color-brand;
  text-decoration: none;
  font-weight: $font-weight-semibold;
}

.ffp__a:hover {
  text-decoration: underline;
}

.ffp__tabs {
  display: flex;
  gap: $space-1;
  margin-bottom: $space-3;
  padding: 4px;
  border-radius: $radius-md;
  background: var(--ex-surface-inset);
  border: 1px solid $color-border;
}

.ffp__tab {
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

.ffp__tab--on {
  color: $color-text-primary;
  background: rgba(240, 185, 11, 0.14);
  box-shadow: 0 0 0 1px rgba(240, 185, 11, 0.25);
}

.ffp__badge {
  font-size: 10px;
  padding: 0 6px;
  border-radius: 8px;
  background: rgba(240, 185, 11, 0.2);
  color: $color-brand;
}

.ffp__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: $space-3;
}

.ffp-card {
  padding: $space-4;
  border-radius: $radius-md;
  border: 1px solid $color-border;
  background: var(--ex-card-surface);
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.ffp-card__top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.ffp-card__tag {
  font-size: 10px;
  font-weight: $font-weight-bold;
  padding: 2px 8px;
  border-radius: 4px;
}

.ffp-card__tag--f {
  background: rgba(14, 203, 129, 0.15);
  color: $color-rise;
}

.ffp-card__tag--fx {
  background: rgba(240, 185, 11, 0.12);
  color: $color-brand;
}

.ffp-card__risk {
  font-size: 10px;
  color: $color-text-tertiary;
}

.ffp-card__name {
  margin: 0;
  font-size: $font-size-md;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.ffp-card__apy {
  margin: 0;
  display: flex;
  align-items: baseline;
  gap: $space-2;
}

.ffp-card__apy-num {
  font-size: 28px;
  font-weight: $font-weight-bold;
  font-family: $font-family-mono;
  color: $color-rise;
}

.ffp-card__apy-lab {
  font-size: $font-size-xs;
  color: $color-text-tertiary;
}

.ffp-card__apy-sub {
  margin: 0;
  font-size: $font-size-xs;
  color: $color-text-tertiary;
}

.ffp-card__daily {
  margin: 0;
  font-size: $font-size-xs;
  color: $color-text-secondary;
  line-height: 1.5;
}

.ffp-card__daily-num {
  font-weight: $font-weight-bold;
  color: $color-rise;
}

.ffp-card__rule,
.ffp-card__range {
  margin: 0;
  font-size: $font-size-xs;
  color: $color-text-tertiary;
  line-height: 1.45;
}

.ffp-card__btn {
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

.ffp-card__btn:hover {
  filter: brightness(1.05);
}

.ffp__hist {
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.ffp__hist-hint {
  margin: 0 0 $space-1;
  font-size: $font-size-xs;
  color: $color-text-tertiary;
  line-height: 1.5;
}

.ffp-hist {
  padding: $space-3 $space-4;
  border-radius: $radius-md;
  border: 1px solid $color-border;
  background: var(--ex-panel-sunken);
}

.ffp-hist__row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.ffp-hist__kind {
  font-size: 10px;
  font-weight: $font-weight-bold;
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(240, 185, 11, 0.12);
  color: $color-brand;
}

.ffp-hist__time {
  font-size: $font-size-xs;
  color: $color-text-tertiary;
}

.ffp-hist__main {
  font-weight: $font-weight-semibold;
  color: $color-text-primary;
  margin-bottom: 4px;
}

.ffp-hist__meta {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
  font-size: $font-size-xs;
  color: $color-text-secondary;
}

.ffp__pos {
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.ffp__empty {
  text-align: center;
  padding: $space-8;
  color: $color-text-tertiary;
  font-size: $font-size-sm;
}

.ffp-pos {
  padding: $space-3 $space-4;
  border-radius: $radius-md;
  border: 1px solid $color-border;
  background: var(--ex-panel-sunken);
}

.ffp-pos__main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $space-2;
}

.ffp-pos__name {
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.ffp-pos__amt {
  font-weight: $font-weight-bold;
  color: $color-text-secondary;
}

.ffp-pos__meta {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2 $space-4;
  font-size: $font-size-xs;
  color: $color-text-tertiary;
  margin-bottom: 6px;
}

.ffp-pos__daily {
  margin: 0 0 $space-2;
  font-size: $font-size-xs;
  color: $color-text-secondary;
  line-height: 1.45;
}

.ffp-pos__act {
  display: flex;
  align-items: center;
  gap: $space-3;
}

.ffp-pos__btn {
  padding: 6px $space-3;
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  border-radius: $radius-sm;
  border: 1px solid rgba(240, 185, 11, 0.4);
  background: rgba(240, 185, 11, 0.1);
  color: $color-brand;
  cursor: pointer;
}

.ffp-pos__renew {
  font-size: $font-size-xs;
  color: $color-text-secondary;
  padding: 6px $space-2;
  border-radius: $radius-sm;
  border: 1px solid $color-border;
  background: var(--ex-panel-sunken);
  cursor: pointer;
}

.ffp-pos__renew:hover {
  border-color: rgba(240, 185, 11, 0.35);
  color: $color-brand;
}

.ffp__foot {
  margin-top: $space-6;
  font-size: 11px;
  color: $color-text-tertiary;
  line-height: 1.6;
}

.ex-num {
  font-family: $font-family-mono;
}
</style>
