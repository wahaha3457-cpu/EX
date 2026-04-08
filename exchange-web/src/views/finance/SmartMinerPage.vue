<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { storeToRefs } from 'pinia'
import { RouteNames } from '@/constants/routeNames'
import type { MinerProduct } from '@/types/financeEarn'
import { useSmartMinerStore } from '@/stores/smartMiner'
import { useAuthStore } from '@/stores/auth'
import ExPageState from '@/components/common/ExPageState.vue'
import MinerPurchaseModal from '@/components/business/finance/MinerPurchaseModal.vue'
import { minerDailyYieldPct } from '@/utils/finance/earnYield'
import { formatPrice } from '@/utils/format/number'

const store = useSmartMinerStore()
const {
  loading,
  loadError,
  products,
  orders,
  walletUsdt,
  totalHashrate,
  estDailyTotal,
  activeOrders,
  totalPaidActive,
  portfolioDailyYieldPct,
} = storeToRefs(store)

const auth = useAuthStore()
const isDev = import.meta.env.DEV
const tab = ref<'shop' | 'active' | 'history'>('shop')

const miningOrders = computed(() => orders.value.filter((o) => o.status === 'MINING'))
const settledOrders = computed(() => orders.value.filter((o) => o.status === 'SETTLED'))
const buyOpen = ref(false)
const selectedProduct = ref<MinerProduct | null>(null)

onMounted(() => {
  void store.bootstrap()
})

function openBuy(p: MinerProduct) {
  selectedProduct.value = p
  buyOpen.value = true
}

function productName(id: string) {
  return products.value.find((x) => x.id === id)?.name ?? id
}

function fmtDate(iso: string) {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('zh-CN', { dateStyle: 'short', timeStyle: 'short' })
}

function daysLeft(endIso: string) {
  const left = (new Date(endIso).getTime() - Date.now()) / 86400000
  return Math.max(0, Math.ceil(left))
}

function fmtDailyYieldPct(n: number) {
  if (n <= 0) return '—'
  return `${n >= 0.01 ? n.toFixed(3) : n.toFixed(4)}%`
}
</script>

<template>
  <div class="smp">
    <header class="smp__hero">
      <div>
        <h1 class="smp__title">智能矿机</h1>
        <p class="smp__sub">算力租赁 · 参考日收益率与日估产出（日估÷实付，演示）</p>
      </div>
      <div class="smp__hero-actions">
        <button type="button" class="smp__ghost" @click="tab = 'history'">历史记录</button>
        <RouterLink :to="{ name: RouteNames.FinanceFund }" class="smp__link">基金理财 →</RouterLink>
      </div>
    </header>

    <div class="smp__stats">
      <div class="smp__stat">
        <span class="smp__sl">运行中订单</span>
        <span class="smp__sv ex-num">{{ activeOrders.length }}</span>
      </div>
      <div class="smp__stat">
        <span class="smp__sl">合计算力</span>
        <span class="smp__sv ex-num">{{ formatPrice(totalHashrate) }}</span>
        <span class="smp__su">TH/s</span>
      </div>
      <div class="smp__stat">
        <span class="smp__sl">日估产出（进行中）</span>
        <span class="smp__sv ex-num smp__sv--pnl">{{ formatPrice(estDailyTotal) }}</span>
        <span class="smp__su">USDT/天</span>
      </div>
      <div class="smp__stat">
        <span class="smp__sl">矿机钱包</span>
        <span class="smp__sv ex-num">{{ formatPrice(walletUsdt) }}</span>
        <span class="smp__su">USDT</span>
      </div>
    </div>

    <div v-if="totalPaidActive > 0" class="smp__yield-strip">
      <div class="smp__yield-item">
        <span class="smp__yield-label">参考日收益率（组合）</span>
        <span class="smp__yield-val ex-num">{{ fmtDailyYieldPct(portfolioDailyYieldPct) }}</span>
        <span class="smp__yield-unit">/ 日</span>
      </div>
      <p class="smp__yield-note">按「日估产出 ÷ 实付本金」粗算；多订单加权等价于产出合计 ÷ 实付合计。</p>
    </div>
    <p v-else class="smp__yield-hint">购买算力并支付成功后将展示组合日收益率与日估产出。</p>

    <p v-if="!auth.isAuthenticated" class="smp__auth-hint">
      未登录可浏览套餐；
      <RouterLink :to="{ name: RouteNames.Login }" class="smp__a">登录</RouterLink>
      后购买将扣减演示钱包并生成订单。
    </p>

    <ExPageState
      :loading="loading && products.length === 0"
      use-skeleton
      skeleton-variant="panel"
      :error="loadError"
      loading-text="加载矿机产品…"
      @retry="store.bootstrap(true)"
    >
      <div class="smp__tabs" role="tablist">
        <button
          type="button"
          role="tab"
          class="smp__tab"
          :class="{ 'smp__tab--on': tab === 'shop' }"
          @click="tab = 'shop'"
        >
          矿机商城
        </button>
        <button
          type="button"
          role="tab"
          class="smp__tab"
          :class="{ 'smp__tab--on': tab === 'active' }"
          @click="tab = 'active'"
        >
          进行中
          <span class="smp__badge">{{ miningOrders.length }}</span>
        </button>
        <button
          type="button"
          role="tab"
          class="smp__tab"
          :class="{ 'smp__tab--on': tab === 'history' }"
          @click="tab = 'history'"
        >
          历史记录
          <span class="smp__badge">{{ settledOrders.length }}</span>
        </button>
      </div>

      <section v-show="tab === 'shop'" class="smp__grid">
        <article v-for="p in products" :key="p.id" class="smp-card">
          <div class="smp-card__head">
            <span class="smp-card__coin">{{ p.coin }}</span>
            <span class="smp-card__sold">已售 {{ p.soldPct }}%</span>
          </div>
          <h2 class="smp-card__name">{{ p.name }}</h2>
          <div class="smp-card__specs">
            <div>
              <span class="smp-card__lab">算力</span>
              <span class="smp-card__val ex-num">{{ p.hashrateTh }} TH/s</span>
            </div>
            <div>
              <span class="smp-card__lab">周期</span>
              <span class="smp-card__val ex-num">{{ p.durationDays }} 天</span>
            </div>
            <div>
              <span class="smp-card__lab">日估产出</span>
              <span class="smp-card__val ex-num smp-card__val--pnl">≈ {{ formatPrice(p.estDailyUsdt) }} USDT/天</span>
            </div>
            <div>
              <span class="smp-card__lab">参考日收益率</span>
              <span class="smp-card__val ex-num smp-card__val--rate">{{ fmtDailyYieldPct(minerDailyYieldPct(p)) }} / 日</span>
            </div>
          </div>
          <div class="smp-card__bar" aria-hidden="true">
            <span class="smp-card__fill" :style="{ width: `${p.soldPct}%` }" />
          </div>
          <div class="smp-card__foot">
            <span class="smp-card__price ex-num">{{ formatPrice(p.priceUsdt) }} USDT</span>
            <button type="button" class="smp-card__btn" @click="openBuy(p)">购买算力</button>
          </div>
        </article>
      </section>

      <section v-show="tab === 'active'" class="smp__orders">
        <p v-if="!miningOrders.length" class="smp__empty">暂无进行中的算力订单，请在商城购买套餐。</p>
        <div v-for="o in miningOrders" :key="o.id" class="smp-order">
          <div class="smp-order__row">
            <span class="smp-order__name">{{ productName(o.productId) }} × {{ o.quantity }}</span>
            <span class="smp-order__st smp-order__st--on">挖矿中</span>
          </div>
          <div class="smp-order__meta">
            <span>支付 {{ formatPrice(o.paidUsdt) }} USDT</span>
            <span>开始 {{ fmtDate(o.purchasedAt) }}</span>
            <span>结束 {{ fmtDate(o.endAt) }}</span>
            <span>剩余约 {{ daysLeft(o.endAt) }} 天</span>
            <span class="smp-order__yield"
              >日估 {{ formatPrice(store.orderEstimatedDailyUsdt(o)) }} USDT/天 · 日收益率
              {{ fmtDailyYieldPct(store.orderDailyYieldPct(o)) }} / 日</span
            >
          </div>
          <button v-if="isDev" type="button" class="smp-order__demo" @click="store.settleDemo(o.id)">
            演示结算
          </button>
        </div>
      </section>

      <section v-show="tab === 'history'" class="smp__orders">
        <p class="smp__hist-hint">已到期结算的算力订单；真实环境可对齐订单导出与收益明细。</p>
        <p v-if="!settledOrders.length" class="smp__empty">暂无历史订单，订单结束后将自动归入此处。</p>
        <div v-for="o in settledOrders" :key="o.id" class="smp-order">
          <div class="smp-order__row">
            <span class="smp-order__name">{{ productName(o.productId) }} × {{ o.quantity }}</span>
            <span class="smp-order__st smp-order__st--done">已结算</span>
          </div>
          <div class="smp-order__meta">
            <span>支付 {{ formatPrice(o.paidUsdt) }} USDT</span>
            <span>开始 {{ fmtDate(o.purchasedAt) }}</span>
            <span>结束 {{ fmtDate(o.endAt) }}</span>
          </div>
        </div>
      </section>
    </ExPageState>

    <p class="smp__foot">
      算力产品存在币价波动、网络难度、矿池策略与不可抗力等风险；页面展示为产品化演示，非
      <a class="smp__a" href="https://www.poexpro.com/wap/#/home" target="_blank" rel="noopener noreferrer">POEX</a>
      官方数据。弹窗与信息层级可对齐
      <a class="smp__a" href="https://www.binance.com/zh-CN/cloud-mining" target="_blank" rel="noopener noreferrer">币安云算力</a>
      类体验。
    </p>

    <MinerPurchaseModal v-model="buyOpen" :product="selectedProduct" :wallet-usdt="walletUsdt" />
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;
@use '@/styles/mixins' as mq;

.smp {
  max-width: min(1120px, var(--ex-container-max));
  margin: 0 auto;
  padding: 0 $space-4 $space-8;
  box-sizing: border-box;
}

.smp__hero {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: $space-3;
  margin-bottom: $space-4;
}

.smp__title {
  margin: 0 0 $space-1;
  font-size: $font-size-xl;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.smp__sub {
  margin: 0;
  font-size: $font-size-sm;
  color: $color-text-tertiary;
}

.smp__hero-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: $space-2;
  align-self: flex-start;
}

.smp__ghost {
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  color: $color-text-secondary;
  padding: $space-2 $space-3;
  border-radius: $radius-sm;
  border: 1px solid $color-border-strong;
  background: var(--ex-surface-inset);
  cursor: pointer;
}

.smp__ghost:hover {
  color: $color-text-primary;
  border-color: color-mix(in srgb, var(--ex-info) 45%, transparent);
}

.smp__link {
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  color: var(--ex-info);
  text-decoration: none;
  padding: $space-2 $space-3;
  border-radius: $radius-sm;
  border: 1px solid color-mix(in srgb, var(--ex-info) 35%, transparent);
  background: var(--ex-info-bg);
}

.smp__hist-hint {
  margin: 0 0 $space-2;
  font-size: $font-size-xs;
  color: $color-text-tertiary;
  line-height: 1.5;
}

.smp__stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: $space-2;
  margin-bottom: $space-4;
}

@include mq.media-down(md) {
  .smp__stats {
    grid-template-columns: repeat(2, 1fr);
  }
}

@include mq.media-down(sm) {
  .smp__stats {
    grid-template-columns: 1fr;
  }
}

.smp__stat {
  padding: $space-3;
  border-radius: $radius-md;
  border: 1px solid $color-border;
  background: var(--ex-elevated-panel-surface);
  box-shadow: var(--ex-elevated-panel-shadow);
}

.smp__sl {
  display: block;
  font-size: 10px;
  color: $color-text-tertiary;
  letter-spacing: 0.04em;
  margin-bottom: 4px;
}

.smp__sv {
  font-size: $font-size-lg;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.smp__sv--pnl {
  color: $color-rise;
}

.smp__su {
  font-size: $font-size-xs;
  color: $color-text-tertiary;
  margin-left: 4px;
}

.smp__yield-strip {
  margin-bottom: $space-4;
  padding: $space-3 $space-4;
  border-radius: $radius-md;
  border: 1px solid color-mix(in srgb, var(--ex-info) 35%, transparent);
  background: var(--ex-info-bg);
}

.smp__yield-item {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 6px;
}

.smp__yield-label {
  font-size: 11px;
  font-weight: $font-weight-bold;
  color: $color-text-secondary;
}

.smp__yield-val {
  font-size: $font-size-md;
  font-weight: $font-weight-bold;
  color: var(--ex-info);
}

.smp__yield-unit {
  font-size: $font-size-xs;
  color: $color-text-tertiary;
}

.smp__yield-note {
  margin: $space-2 0 0;
  font-size: 10px;
  line-height: 1.45;
  color: $color-text-tertiary;
}

.smp__yield-hint {
  margin: 0 0 $space-4;
  font-size: $font-size-xs;
  color: $color-text-tertiary;
}

.smp__auth-hint {
  font-size: $font-size-xs;
  color: $color-text-secondary;
  margin: 0 0 $space-3;
  padding: $space-2 $space-3;
  border-radius: $radius-sm;
  background: rgba(48, 132, 252, 0.08);
  border: 1px solid rgba(48, 132, 252, 0.2);
}

.smp__a {
  color: var(--ex-info);
  text-decoration: none;
}

.smp__a:hover {
  text-decoration: underline;
}

.smp__tabs {
  display: flex;
  gap: $space-1;
  margin-bottom: $space-3;
  padding: 4px;
  border-radius: $radius-md;
  background: var(--ex-surface-inset);
  border: 1px solid $color-border;
}

.smp__tab {
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

.smp__tab--on {
  color: $color-text-primary;
  background: rgba(48, 132, 252, 0.16);
  box-shadow: 0 0 0 1px rgba(48, 132, 252, 0.35);
}

.smp__badge {
  font-size: 10px;
  padding: 0 6px;
  border-radius: 8px;
  background: var(--ex-info-bg);
  color: var(--ex-info);
}

.smp__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: $space-3;
}

.smp-card {
  padding: $space-4;
  border-radius: $radius-md;
  border: 1px solid $color-border;
  background: var(--ex-elevated-panel-surface);
  box-shadow: var(--ex-elevated-panel-shadow);
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.smp-card__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.smp-card__coin {
  font-size: 10px;
  font-weight: $font-weight-bold;
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(240, 185, 11, 0.12);
  color: $color-brand;
}

.smp-card__sold {
  font-size: 10px;
  color: $color-text-tertiary;
}

.smp-card__name {
  margin: 0;
  font-size: $font-size-md;
  font-weight: $font-weight-bold;
}

.smp-card__specs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $space-2;
  font-size: $font-size-xs;
}

.smp-card__lab {
  display: block;
  color: $color-text-tertiary;
  margin-bottom: 2px;
}

.smp-card__val {
  color: $color-text-primary;
  font-weight: $font-weight-semibold;
}

.smp-card__val--pnl {
  color: $color-rise;
}

.smp-card__val--rate {
  color: $color-rise;
  font-weight: $font-weight-bold;
}

.smp-card__bar {
  height: 4px;
  border-radius: 2px;
  background: var(--ex-fill-hover-subtle);
  overflow: hidden;
}

.smp-card__fill {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, #3084fc, #6aa9ff);
  border-radius: 2px;
}

.smp-card__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
  padding-top: $space-2;
  border-top: 1px solid var(--ex-border-subtle);
}

.smp-card__price {
  font-size: $font-size-md;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.smp-card__btn {
  padding: $space-2 $space-4;
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  border: none;
  border-radius: $radius-sm;
  cursor: pointer;
  background: linear-gradient(180deg, #4a8efc 0%, #3084fc 100%);
  color: #fff;
}

.smp__orders {
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.smp__empty {
  text-align: center;
  padding: $space-8;
  color: $color-text-tertiary;
  font-size: $font-size-sm;
}

.smp-order {
  padding: $space-3 $space-4;
  border-radius: $radius-md;
  border: 1px solid $color-border;
  background: var(--ex-panel-sunken);
}

.smp-order__row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $space-2;
}

.smp-order__name {
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.smp-order__st {
  font-size: 10px;
  font-weight: $font-weight-bold;
  padding: 2px 8px;
  border-radius: 4px;
}

.smp-order__st--on {
  background: rgba(14, 203, 129, 0.15);
  color: $color-rise;
}

.smp-order__st--done {
  background: var(--ex-fill-hover-subtle);
  color: $color-text-tertiary;
}

.smp-order__meta {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2 $space-4;
  font-size: $font-size-xs;
  color: $color-text-tertiary;
}

.smp-order__yield {
  flex-basis: 100%;
  color: $color-text-secondary;
  font-weight: $font-weight-semibold;
}

.smp-order__demo {
  margin-top: $space-2;
  font-size: 10px;
  padding: 4px $space-2;
  border-radius: $radius-sm;
  border: 1px dashed $color-border;
  background: transparent;
  color: $color-text-tertiary;
  cursor: pointer;
}

.smp__foot {
  margin-top: $space-6;
  font-size: 11px;
  color: $color-text-tertiary;
  line-height: 1.6;
}

.ex-num {
  font-family: $font-family-mono;
}
</style>
