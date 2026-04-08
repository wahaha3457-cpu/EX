<script setup lang="ts">
import { useRouter } from 'vue-router'
import { RouteNames } from '@/constants/routeNames'

const router = useRouter()

function goSpot() {
  router.push({ name: RouteNames.SpotTrade, params: { symbol: 'BTC_USDT' } })
}

function goContract() {
  router.push({ name: RouteNames.ContractTrade, params: { symbol: 'BTCUSDT' } })
}

function goAssets() {
  router.push({ name: RouteNames.Assets })
}

function goMarket() {
  router.push({ name: RouteNames.Market })
}
</script>

<template>
  <section class="products" aria-labelledby="prod-title">
    <h2 id="prod-title" class="products__title">产品入口</h2>
    <div class="products__grid">
      <article class="products__card products__card--spot">
        <div class="products__badge">现货</div>
        <h3 class="products__name">现货交易</h3>
        <p class="products__desc">深度聚合、低滑点下单；限价 / 市价与高级委托可扩展。</p>
        <ul class="products__bullets">
          <li>统一交易对规则与精度</li>
          <li>实时订单与成交流水</li>
        </ul>
        <button type="button" class="ex-btn ex-btn--primary ex-btn--logo-grad products__cta" @click="goSpot">
          进入现货
        </button>
      </article>

      <article class="products__card products__card--contract">
        <div class="products__badge products__badge--contract">合约</div>
        <h3 class="products__name">U 本位永续</h3>
        <p class="products__desc">保证金与持仓一体化；风险限额与强平保护可配置。</p>
        <ul class="products__bullets">
          <li>杠杆与保证金模式</li>
          <li>资金费率与标记价格</li>
        </ul>
        <button type="button" class="ex-btn ex-btn--secondary products__cta" @click="goContract">
          进入合约
        </button>
      </article>

      <article class="products__card products__card--assets">
        <div class="products__badge products__badge--assets">资产</div>
        <h3 class="products__name">资产管理</h3>
        <p class="products__desc">账户余额、充提与流水对账；为多账户与机构预留扩展。</p>
        <ul class="products__bullets">
          <li>现货 / 合约资金视图</li>
          <li>审计与导出接口预留</li>
        </ul>
        <button type="button" class="ex-btn ex-btn--secondary products__cta" @click="goAssets">
          资产中心
        </button>
      </article>

      <article class="products__card products__card--market">
        <div class="products__badge products__badge--market">行情</div>
        <h3 class="products__name">行情中心</h3>
        <p class="products__desc">全市场 ticker、涨跌幅与成交额排序；与交易页路由参数对齐。</p>
        <ul class="products__bullets">
          <li>自选与榜单（可接 WS）</li>
          <li>跳转交易对一键下单</li>
        </ul>
        <button type="button" class="ex-btn ex-btn--secondary products__cta" @click="goMarket">
          查看行情
        </button>
      </article>
    </div>
  </section>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;
@use '@/styles/mixins' as mq;

.products {
  margin-bottom: $space-8;
}

.products__title {
  margin: 0 0 $space-4;
  font-size: $font-size-xl;
  font-weight: $font-weight-bold;
}

.products__grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: $space-4;

  @include mq.media-up(sm) {
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  }

  @include mq.media-up(lg) {
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  }
}

.products__card {
  position: relative;
  padding: $space-6 $space-5;
  border-radius: $radius-lg;
  border: 1px solid $color-border;
  overflow: hidden;
  transition: transform 0.2s ease, border-color 0.2s ease;
}

.products__card::before {
  content: '';
  position: absolute;
  inset: 0;
  opacity: 0.55;
  pointer-events: none;
}

.products__card--spot::before {
  background: radial-gradient(circle at 0% 0%, rgba(240, 185, 11, 0.18) 0%, transparent 55%);
}

.products__card--contract::before {
  background: radial-gradient(circle at 100% 0%, rgba(48, 132, 252, 0.16) 0%, transparent 55%);
}

.products__card--assets::before {
  background: radial-gradient(circle at 0% 100%, rgba(14, 203, 129, 0.12) 0%, transparent 55%);
}

.products__card--market::before {
  background: radial-gradient(circle at 100% 100%, rgba(234, 236, 239, 0.08) 0%, transparent 55%);
}

.products__card:hover {
  transform: translateY(-2px);
  border-color: var(--ex-border-strong);
}

.products__badge {
  display: inline-block;
  margin-bottom: $space-3;
  padding: 2px $space-2;
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  color: $color-brand;
  background: $color-brand-muted;
  border-radius: $radius-sm;
}

.products__badge--contract {
  color: #6aa9ff;
  background: rgba(48, 132, 252, 0.15);
}

.products__badge--assets {
  color: #3ee6a5;
  background: rgba(14, 203, 129, 0.12);
}

.products__badge--market {
  color: #c8cdd4;
  background: rgba(234, 236, 239, 0.08);
}

.products__name {
  margin: 0 0 $space-2;
  font-size: $font-size-xl;
  font-weight: $font-weight-bold;
  position: relative;
}

.products__desc {
  margin: 0 0 $space-4;
  font-size: $font-size-sm;
  line-height: 1.6;
  color: $color-text-secondary;
  position: relative;
}

.products__bullets {
  margin: 0 0 $space-5;
  padding-left: $space-4;
  font-size: $font-size-sm;
  color: $color-text-tertiary;
  line-height: 1.6;
  position: relative;
}

.products__cta {
  position: relative;
  width: 100%;
  min-height: $control-height-lg;
}
</style>
