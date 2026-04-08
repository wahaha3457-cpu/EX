<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { RouteNames } from '@/constants/routeNames'
import { DEFAULT_FUTURES_SYMBOL, DEFAULT_SPOT_SYMBOL } from '@/constants/trade'
</script>

<template>
  <section class="mqs" aria-label="快捷交易与账户入口">
    <h3 class="mqs__title">快捷入口</h3>
    <div class="mqs__grid">
      <RouterLink
        class="mqs__cell"
        :to="{ name: RouteNames.SpotTrade, params: { symbol: DEFAULT_SPOT_SYMBOL } }"
      >
        <span class="mqs__cell-k">现货</span>
        <span class="mqs__cell-v">{{ DEFAULT_SPOT_SYMBOL.replace('_', '/') }}</span>
      </RouterLink>
      <RouterLink
        class="mqs__cell"
        :to="{ name: RouteNames.ContractTrade, params: { symbol: DEFAULT_FUTURES_SYMBOL } }"
      >
        <span class="mqs__cell-k">合约</span>
        <span class="mqs__cell-v">{{ DEFAULT_FUTURES_SYMBOL }}</span>
      </RouterLink>
      <RouterLink class="mqs__cell" :to="{ name: RouteNames.Assets }">
        <span class="mqs__cell-k">资产</span>
        <span class="mqs__cell-v">总览</span>
      </RouterLink>
      <RouterLink class="mqs__cell" :to="{ name: RouteNames.OrdersCenter }">
        <span class="mqs__cell-k">订单</span>
        <span class="mqs__cell-v">中心</span>
      </RouterLink>
    </div>
  </section>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.mqs {
  padding: $space-3;
  border: 1px solid $color-border;
  border-radius: $radius-md;
  background: $color-bg-elevated;
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.03);
}

.mqs__title {
  margin: 0 0 $space-2;
  font-size: 11px;
  font-weight: $font-weight-bold;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: $color-text-tertiary;
}

.mqs__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: $space-2;
}

.mqs__cell {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  min-height: 52px;
  padding: $space-2 $space-3;
  border-radius: $radius-sm;
  border: 1px solid var(--ex-border-subtle);
  background: var(--ex-panel-sunken);
  text-decoration: none;
  color: inherit;
  transition:
    border-color 0.12s ease,
    background 0.12s ease;
}

.mqs__cell:hover {
  border-color: color-mix(in srgb, var(--ex-brand) 35%, var(--ex-border));
  background: var(--ex-fill-ghost);
}

.mqs__cell-k {
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  color: $color-text-secondary;
}

.mqs__cell-v {
  font-size: 11px;
  font-weight: $font-weight-bold;
  font-variant-numeric: tabular-nums;
  color: $color-text-primary;
  font-family: $font-family-mono;
}

:global([data-theme='monochrome']) .mqs__cell {
  background: var(--ex-fill-ghost);
}
</style>
