<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { RouteNames } from '@/constants/routeNames'
import { useAuthStore } from '@/stores/auth'
import { useC2cMarketStore } from '@/stores/c2cMarket'
import C2CQuickEntryCard from '@/components/business/c2c/C2CQuickEntryCard.vue'
import C2CExpressModal from '@/components/business/c2c/C2CExpressModal.vue'
import type { C2cOrder } from '@/types/c2c'

const auth = useAuthStore()
const store = useC2cMarketStore()
const route = useRoute()
const router = useRouter()
const { fiatFilter } = storeToRefs(store)

const expressOpen = ref(false)

onMounted(() => {
  void store.bootstrapAds()
})

const isMarket = computed(() => route.name === RouteNames.C2CMarket)
const isRunning = computed(() => route.name === RouteNames.C2COrdersRunning)
const isEnded = computed(() => route.name === RouteNames.C2COrdersEnded)

function onExpressPlaced(o: C2cOrder) {
  void router.push({
    name: RouteNames.C2COrdersRunning,
    params: { filter: 'unpaid' },
    query: { open: o.id },
  })
}
</script>

<template>
  <div class="c2c">
    <header class="c2c__hero">
      <div>
        <h1 class="c2c__title">C2C / P2P</h1>
        <p class="c2c__sub">
          法币与数字币的场外撮合：支持人民币（CNY）、美元（USD）；自选商家、线下转账后确认放币。演示数据与交互闭环。
        </p>
      </div>
      <div class="c2c__hero-actions">
        <div class="c2c__fiat-switch" role="group" aria-label="C2C 法币（全局）">
          <button
            type="button"
            class="c2c__fiat-i"
            :class="{ 'c2c__fiat-i--on': fiatFilter === 'CNY' }"
            @click="store.setFiat('CNY')"
          >
            CNY
          </button>
          <button
            type="button"
            class="c2c__fiat-i"
            :class="{ 'c2c__fiat-i--on': fiatFilter === 'USD' }"
            @click="store.setFiat('USD')"
          >
            USD
          </button>
        </div>
        <div class="c2c__hero-links">
          <RouterLink :to="{ name: RouteNames.Convert }" class="c2c__link">闪兑</RouterLink>
          <RouterLink :to="{ name: RouteNames.Assets }" class="c2c__link">资产中心</RouterLink>
        </div>
      </div>
    </header>

    <p v-if="!auth.isAuthenticated" class="c2c__auth-hint">
      未登录可浏览广告与筛选；
      <RouterLink :to="{ name: RouteNames.Login }" class="c2c__a">登录</RouterLink>
      后下单与订单将保存在本机演示存储中。
    </p>

    <!-- 一级导航保持原有「只占左侧内容宽」；快捷区占用右侧列，不挤压导航尺寸 -->
    <div class="c2c__nav-band">
      <nav class="c2c__nav1" aria-label="C2C 一级导航">
        <RouterLink
          class="c2c__nav1-i"
          :class="{ 'c2c__nav1-i--on': isMarket }"
          :to="{ name: RouteNames.C2CMarket }"
        >
          市场
        </RouterLink>
        <RouterLink
          class="c2c__nav1-i"
          :class="{ 'c2c__nav1-i--on': isRunning }"
          :to="{ name: RouteNames.C2COrdersRunning, params: { filter: 'all' } }"
        >
          进行中订单
        </RouterLink>
        <RouterLink
          class="c2c__nav1-i"
          :class="{ 'c2c__nav1-i--on': isEnded }"
          :to="{ name: RouteNames.C2COrdersEnded, params: { filter: 'all' } }"
        >
          已结束订单
        </RouterLink>
      </nav>
      <div class="c2c__nav-quick">
        <C2CQuickEntryCard @open="expressOpen = true" />
      </div>
    </div>

    <C2CExpressModal v-model="expressOpen" @placed="onExpressPlaced" />

    <RouterView />

    <section class="c2c__rules" aria-label="规则说明">
      <h2 class="c2c__rules-title">交易规则（演示）</h2>
      <ol class="c2c__rules-list">
        <li>下单后请在倒计时内完成线下法币划转，并点击「我已付款」；卖方确认收款后放币。</li>
        <li>单笔金额需落在广告限额内，且不超过对方展示的可交易数量折算。</li>
        <li>切勿在转账备注中填写 BTC、USDT、币安等敏感词，以免风控拦截。</li>
        <li>若对方超时未放币，可发起申诉；订单中心可按状态筛选进行中与已结束订单。</li>
      </ol>
    </section>

    <p class="c2c__foot">
      交互与信息架构参考
      <a class="c2c__a" href="https://www.binance.com/zh-CN/trade/c2c" target="_blank" rel="noopener noreferrer"
        >币安 C2C</a
      >
      ；本页为前端演示，法币支付与 KYC 以实际上线合规为准。
    </p>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.c2c {
  max-width: min(1180px, var(--ex-container-max));
  margin: 0 auto;
  padding: 0 $space-4 $space-8;
  box-sizing: border-box;
}

/* 区块垂直节奏统一：header / 提示 / 导航 / 子路由之间等距 */
$c2c-stack: $space-3;

.c2c__hero {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: $space-3;
  margin-bottom: $c2c-stack;
}

.c2c__hero-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: $space-3;
}

.c2c__fiat-switch {
  display: inline-flex;
  padding: 3px;
  border-radius: $radius-md;
  background: var(--ex-surface-inset);
  border: 1px solid rgba(240, 185, 11, 0.28);
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.04) inset;
}

.c2c__fiat-i {
  position: relative;
  border: none;
  background: transparent;
  color: $color-text-tertiary;
  font-size: $font-size-xs;
  font-weight: $font-weight-bold;
  letter-spacing: 0.04em;
  padding: 8px 16px;
  border-radius: $radius-sm;
  cursor: pointer;
  min-width: 52px;
  transition:
    color 0.15s ease,
    background 0.15s ease,
    box-shadow 0.15s ease;
}

.c2c__fiat-i:hover {
  color: $color-text-primary;
  background: var(--ex-fill-hover-subtle);
}

.c2c__fiat-i--on {
  color: #0a0e17;
  background: linear-gradient(135deg, #ffe078 0%, #f0b90b 45%, #d19a0b 100%);
  box-shadow:
    0 2px 12px rgba(240, 185, 11, 0.35),
    0 0 0 1px rgba(255, 255, 255, 0.25) inset;
}

.c2c__nav-band {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  column-gap: $space-4;
  row-gap: $space-3;
  margin-bottom: $c2c-stack;
}

.c2c__nav-quick {
  justify-self: end;
  width: 100%;
  max-width: 304px;
  min-width: 0;
}

.c2c__title {
  margin: 0 0 6px;
  font-size: $font-size-xl;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.c2c__sub {
  margin: 0;
  font-size: $font-size-sm;
  color: $color-text-tertiary;
  max-width: 640px;
  line-height: 1.55;
}

.c2c__hero-links {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
}

.c2c__link {
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  color: $color-brand;
  text-decoration: none;
  padding: $space-2 $space-3;
  border-radius: $radius-sm;
  border: 1px solid rgba(240, 185, 11, 0.35);
  background: rgba(240, 185, 11, 0.08);
}

.c2c__link:hover {
  background: rgba(240, 185, 11, 0.14);
}

.c2c__auth-hint {
  font-size: $font-size-xs;
  color: $color-text-secondary;
  margin: 0 0 $c2c-stack;
  padding: $space-2 $space-3;
  border-radius: $radius-sm;
  background: rgba(48, 132, 252, 0.08);
  border: 1px solid rgba(48, 132, 252, 0.2);
}

.c2c__a {
  color: $color-brand;
  text-decoration: none;
  font-weight: $font-weight-semibold;
}

.c2c__a:hover {
  text-decoration: underline;
}

.c2c__nav1 {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
  margin: 0;
  padding: 4px;
  border-radius: $radius-md;
  border: 1px solid $color-border;
  background: var(--ex-surface-inset);
  width: fit-content;
  max-width: 100%;
  justify-self: start;
}

@media (max-width: 768px) {
  .c2c__nav-band {
    grid-template-columns: 1fr;
  }

  .c2c__nav-quick {
    justify-self: stretch;
    max-width: none;
  }
}

.c2c__nav1-i {
  padding: 10px 18px;
  border-radius: $radius-sm;
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  color: $color-text-secondary;
  text-decoration: none;
  border: 1px solid transparent;
}

.c2c__nav1-i:hover {
  color: $color-text-primary;
  background: var(--ex-fill-hover-subtle);
}

.c2c__nav1-i--on {
  background: rgba(240, 185, 11, 0.16);
  color: $color-brand;
  border-color: rgba(240, 185, 11, 0.35);
}

.c2c__rules {
  margin-top: $space-6;
  padding: $space-4;
  border-radius: $radius-md;
  border: 1px solid $color-border;
  background: var(--ex-panel-sunken);
}

.c2c__rules-title {
  margin: 0 0 $space-3;
  font-size: $font-size-md;
  color: $color-text-primary;
}

.c2c__rules-list {
  margin: 0;
  padding-left: 1.25rem;
  color: $color-text-secondary;
  font-size: $font-size-sm;
  line-height: 1.65;
}

.c2c__foot {
  margin-top: $space-4;
  font-size: $font-size-xs;
  color: $color-text-tertiary;
  line-height: 1.5;
}
</style>
