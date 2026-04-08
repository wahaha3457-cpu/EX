<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { RouteNames } from '@/constants/routeNames'
import { useDemoTradeStore } from '@/stores/demoTrade'
import { storeToRefs } from 'pinia'
import { formatPrice } from '@/utils/format/number'

const demo = useDemoTradeStore()
const { assets } = storeToRefs(demo)

onMounted(() => {
  demo.peekPersistForHub()
})

const usdt = computed(() => assets.value.USDT ?? 0)
const btc = computed(() => assets.value.BTC ?? 0)

function onReset() {
  demo.resetAll()
  demo.peekPersistForHub()
}
</script>

<template>
  <div class="dhub">
    <header class="dhub__hero">
      <div class="dhub__badge" aria-hidden="true">DEMO</div>
      <h1 class="dhub__title">模拟交易</h1>
      <p class="dhub__lead">
        使用虚拟资金体验现货下单、限价撮合与资产变动，不涉及真实充值与划转；数据仅存于本机浏览器，刷新后委托与成交记录仍保留（可一键重置）。
      </p>
      <div class="dhub__cta">
        <RouterLink
          class="dhub__btn dhub__btn--primary"
          :to="{ name: RouteNames.DemoSpotTrade, params: { symbol: 'BTC_USDT' } }"
        >
          进入模拟现货
        </RouterLink>
        <RouterLink class="dhub__btn dhub__btn--ghost" :to="{ name: RouteNames.SpotTrade, params: { symbol: 'BTC_USDT' } }">
          前往实盘现货
        </RouterLink>
      </div>
    </header>

    <section class="dhub__stats" aria-label="模拟资产预览">
      <div class="dhub__stat">
        <span class="dhub__stat-k">虚拟 USDT</span>
        <span class="dhub__stat-v ex-num">{{ formatPrice(usdt) }}</span>
      </div>
      <div class="dhub__stat">
        <span class="dhub__stat-k">虚拟 BTC</span>
        <span class="dhub__stat-v ex-num">{{ formatPrice(btc) }}</span>
      </div>
      <button type="button" class="dhub__reset" @click="onReset">重置模拟资产与委托</button>
    </section>

    <section class="dhub__rules" aria-labelledby="dhub-rules-h">
      <h2 id="dhub-rules-h" class="dhub__h2">规则说明</h2>
      <ol class="dhub__ol">
        <li>模拟与实盘行情、盘口共用演示数据源，仅您的下单与余额为本地模拟，不会影响真实账户。</li>
        <li>市价单按当前最新价即时成交；限价单在盘口外挂单，当最新价触及委托价时自动撮合（演示逻辑）。</li>
        <li>手续费按 0.1% 吃单费率从计价币（如 USDT）侧估算，用于培养成本意识，正式环境以费率表为准。</li>
        <li>请勿将模拟盈亏视为投资建议；若清除站点数据或更换浏览器，本地记录将丢失。</li>
      </ol>
    </section>

    <section class="dhub__flow" aria-labelledby="dhub-flow-h">
      <h2 id="dhub-flow-h" class="dhub__h2">使用流程</h2>
      <ol class="dhub__steps">
        <li><span class="dhub__step-i">1</span> 进入模拟现货，选择交易对</li>
        <li><span class="dhub__step-i">2</span> 使用限价 / 市价练习下单与撤单</li>
        <li><span class="dhub__step-i">3</span> 在下方「当前委托 / 成交记录」核对模拟结果</li>
        <li><span class="dhub__step-i">4</span> 熟悉后可切换实盘，注意风险控制</li>
      </ol>
    </section>

    <p class="dhub__foot">
      产品交互参考
      <a
        class="dhub__a"
        href="https://www.binance.com/zh-CN/support/faq/detail/360042299231"
        target="_blank"
        rel="noopener noreferrer"
        >交易所模拟盘常见说明</a
      >
      ；本模块为前端演示工程，合规与风控以正式后端为准。
    </p>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;
@use '@/styles/mixins' as mq;

.dhub {
  max-width: min(880px, var(--ex-container-max));
  margin: 0 auto;
  padding: $space-6 $space-4 $space-10;
  box-sizing: border-box;
}

.dhub__hero {
  margin-bottom: $space-6;
}

.dhub__badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  margin-bottom: $space-3;
  font-size: 10px;
  font-weight: $font-weight-bold;
  letter-spacing: 0.12em;
  color: var(--ex-on-brand);
  background: var(--ex-brand);
  border-radius: 999px;
}

.dhub__title {
  margin: 0 0 $space-2;
  font-size: $font-size-xxl;
  font-weight: $font-weight-bold;
  letter-spacing: -0.02em;
  color: $color-text-primary;
}

.dhub__lead {
  margin: 0 0 $space-5;
  font-size: $font-size-sm;
  line-height: 1.65;
  color: $color-text-secondary;
  max-width: 640px;
}

.dhub__cta {
  display: flex;
  flex-wrap: wrap;
  gap: $space-3;
}

.dhub__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 0 $space-5;
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  text-decoration: none;
  border-radius: $radius-md;
  border: 1px solid transparent;
  cursor: pointer;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease;
}

.dhub__btn--primary {
  color: var(--ex-on-brand);
  background: var(--ex-brand);
  border-color: color-mix(in srgb, var(--ex-brand) 40%, transparent);
  box-shadow: 0 1px 0 color-mix(in srgb, var(--ex-text-primary) 10%, transparent);

  &:hover {
    background: var(--ex-brand-hover);
  }
}

.dhub__btn--ghost {
  color: $color-text-secondary;
  background: var(--ex-card-surface);
  border-color: $color-border;

  &:hover {
    color: $color-text-primary;
    border-color: color-mix(in srgb, var(--ex-brand) 35%, var(--ex-border));
  }
}

.dhub__stats {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: $space-4 $space-6;
  padding: $space-4 $space-5;
  margin-bottom: $space-6;
  border-radius: $radius-lg;
  border: 1px solid $color-border;
  background: var(--ex-card-surface);
  box-shadow: 0 1px 0 color-mix(in srgb, var(--ex-text-primary) 4%, transparent);
}

.dhub__stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.dhub__stat-k {
  font-size: $font-size-xs;
  color: $color-text-tertiary;
}

.dhub__stat-v {
  font-size: $font-size-lg;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.dhub__reset {
  margin-left: auto;
  padding: $space-2 $space-3;
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  color: var(--ex-fall);
  background: var(--ex-fall-bg);
  border: 1px solid color-mix(in srgb, var(--ex-fall) 28%, transparent);
  border-radius: $radius-sm;
  cursor: pointer;
  font-family: inherit;

  &:hover {
    filter: brightness(1.05);
  }
}

@include mq.media-down(md) {
  .dhub__reset {
    margin-left: 0;
    width: 100%;
  }
}

.dhub__rules,
.dhub__flow {
  margin-bottom: $space-5;
  padding: $space-4 $space-5;
  border-radius: $radius-lg;
  border: 1px solid $color-border;
  background: var(--ex-panel-sunken);
}

.dhub__h2 {
  margin: 0 0 $space-3;
  font-size: $font-size-md;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.dhub__ol {
  margin: 0;
  padding-left: 1.25rem;
  font-size: $font-size-sm;
  line-height: 1.65;
  color: $color-text-secondary;
}

.dhub__ol li {
  margin-bottom: $space-2;
}

.dhub__steps {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.dhub__steps li {
  display: flex;
  align-items: center;
  gap: $space-3;
  font-size: $font-size-sm;
  color: $color-text-secondary;
}

.dhub__step-i {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: $font-size-xs;
  font-weight: $font-weight-bold;
  color: var(--ex-brand);
  background: var(--ex-brand-muted);
  border-radius: 50%;
  border: 1px solid color-mix(in srgb, var(--ex-brand) 35%, transparent);
}

.dhub__foot {
  margin: 0;
  font-size: $font-size-xs;
  line-height: 1.6;
  color: $color-text-tertiary;
}

.dhub__a {
  color: var(--ex-info);
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

.ex-num {
  font-variant-numeric: tabular-nums;
}
</style>
