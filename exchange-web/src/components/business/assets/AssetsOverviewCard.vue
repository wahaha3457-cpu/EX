<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { storeToRefs } from 'pinia'
import { RouteNames } from '@/constants/routeNames'
import { useAssetsCenterStore } from '@/stores/assetsCenter'
import { formatPrice, formatPct } from '@/utils/format/number'

/** 与 store 中隐藏小额逻辑阈值一致（展示用） */
const SMALL_ASSET_USDT = 10

const store = useAssetsCenterStore()
const { overview, hideSmallAssets, showDistributionChart, payload } = storeToRefs(store)

/** 总览：按各币种估值折算的可用/冻结 USDT（与列表列口径一致的可解释近似） */
const trustTotals = computed(() => {
  const rows = payload.value?.balances.overview ?? []
  let availableUsdt = 0
  let frozenUsdt = 0
  for (const r of rows) {
    const t = r.total
    if (t > 0 && r.valueUsdt >= 0) {
      availableUsdt += (r.available / t) * r.valueUsdt
      frozenUsdt += (r.frozen / t) * r.valueUsdt
    }
  }
  return { availableUsdt, frozenUsdt }
})

const totalDisplay = computed(() => {
  const t = overview.value?.totalUsdt
  if (t == null) return '—'
  return formatPrice(t)
})

const pnlDisplay = computed(() => {
  const u = overview.value?.todayPnlUsdt
  const p = overview.value?.todayPnlPct
  if (u == null && p == null) return { primary: '—', sub: '' as string }
  const primary =
    u != null ? `${u >= 0 ? '+' : ''}${formatPrice(u)} USDT` : '—'
  const sub = p != null ? `（${formatPct(p)}）` : ''
  return { primary, sub }
})

const pnlClass = computed(() => {
  const u = overview.value?.todayPnlUsdt
  if (u == null || u === 0) return 'asc-ov__pnl-val--neutral'
  return u > 0 ? 'asc-ov__pnl-val--up' : 'asc-ov__pnl-val--down'
})
</script>

<template>
  <section class="asc-ov" aria-label="资产总览">
    <div class="asc-ov__main">
      <div class="asc-ov__total-block">
        <p class="asc-ov__label">总资产估值</p>
        <p class="asc-ov__total ex-num">
          {{ totalDisplay }}
          <span class="asc-ov__unit">USDT</span>
        </p>
      </div>
      <div class="asc-ov__pnl-block">
        <p class="asc-ov__label">今日盈亏</p>
        <p class="asc-ov__pnl-val ex-num" :class="pnlClass">
          {{ pnlDisplay.primary }}
          <span class="asc-ov__pnl-sub">{{ pnlDisplay.sub }}</span>
        </p>
        <p class="asc-ov__tag">预留 · 以结算口径为准</p>
      </div>
      <div class="asc-ov__trust" aria-label="流动性与占用">
        <div class="asc-ov__trust-row">
          <span class="asc-ov__trust-k">可用合计（折合 USDT）</span>
          <span class="asc-ov__trust-v ex-num">{{ formatPrice(trustTotals.availableUsdt) }} USDT</span>
        </div>
        <div class="asc-ov__trust-row">
          <span class="asc-ov__trust-k">冻结合计（折合 USDT）</span>
          <span class="asc-ov__trust-v ex-num asc-ov__trust-v--muted">{{ formatPrice(trustTotals.frozenUsdt) }} USDT</span>
        </div>
        <p class="asc-ov__trust-note">
          与下方列表「可用 / 冻结」列口径一致；充值在途、风控冻结等以流水与状态为准。
        </p>
        <RouterLink class="asc-ov__trust-link" :to="{ name: RouteNames.AccountSecurity }">
          安全中心 · 保护账户与资产
        </RouterLink>
      </div>

      <div class="asc-ov__controls">
        <label class="asc-ov__switch">
          <input
            type="checkbox"
            :checked="hideSmallAssets"
            @change="store.toggleHideSmall()"
          />
          <span>隐藏小额资产</span>
        </label>
        <span class="asc-ov__hint">折合 &lt; {{ SMALL_ASSET_USDT }} USDT</span>
      </div>
    </div>

    <div v-if="showDistributionChart && overview?.distribution?.length" class="asc-ov__chart">
      <p class="asc-ov__chart-title">账户分布</p>
      <div class="asc-ov__bars" role="img" aria-label="账户分布条形图占位">
        <div
          v-for="(s, i) in overview.distribution"
          :key="s.account + i"
          class="asc-ov__bar-row"
        >
          <span class="asc-ov__bar-label">{{ s.label }}</span>
          <div class="asc-ov__bar-track">
            <div
              class="asc-ov__bar-fill"
              :style="{ width: `${Math.min(100, s.ratio * 100)}%` }"
            />
          </div>
          <span class="asc-ov__bar-val ex-num">{{ formatPrice(s.valueUsdt) }}</span>
        </div>
      </div>
      <p class="asc-ov__chart-note">预留 · 可替换为 ECharts / 设计稿饼图</p>
    </div>
  </section>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;
@use '@/styles/mixins' as mq;

.asc-ov {
  display: grid;
  grid-template-columns: 1fr minmax(260px, 360px);
  gap: $space-5;
  padding: $space-5 $space-6;
  border: 1px solid $color-border;
  border-radius: $radius-lg;
  background: color-mix(in srgb, var(--ex-info) 6%, $color-bg-elevated);
  box-shadow: $shadow-card;
}

@media (max-width: 960px) {
  .asc-ov {
    grid-template-columns: 1fr;
  }
}

.asc-ov__main {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: $space-6 $space-8;
}

.asc-ov__total-block {
  min-width: 200px;
}

.asc-ov__label {
  margin: 0 0 $space-2;
  font-size: $font-size-sm;
  font-weight: $font-weight-medium;
  color: $color-text-tertiary;
  letter-spacing: 0.02em;
}

.asc-ov__total {
  margin: 0;
  font-size: 28px;
  font-weight: $font-weight-bold;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
  color: $color-text-primary;
  line-height: 1.15;
}

.asc-ov__unit {
  margin-left: $space-2;
  font-size: $font-size-md;
  font-weight: $font-weight-semibold;
  color: $color-text-secondary;
}

.asc-ov__pnl-block {
  min-width: 160px;
}

.asc-ov__pnl-val {
  margin: 0;
  font-size: $font-size-lg;
  font-weight: $font-weight-semibold;
}

.asc-ov__pnl-val--up {
  color: $color-rise;
}

.asc-ov__pnl-val--down {
  color: $color-fall;
}

.asc-ov__pnl-val--neutral {
  color: $color-text-secondary;
}

.asc-ov__pnl-sub {
  font-size: $font-size-sm;
  font-weight: $font-weight-medium;
  opacity: 0.9;
}

.asc-ov__tag {
  margin: $space-1 0 0;
  font-size: $font-size-xs;
  color: $color-text-tertiary;
}

.asc-ov__trust {
  flex: 1 1 240px;
  min-width: min(100%, 260px);
  padding: $space-3 $space-4;
  border-radius: $radius-md;
  border: 1px solid var(--ex-border);
  background: var(--ex-card-surface);
  box-shadow: 0 1px 0 color-mix(in srgb, var(--ex-text-primary) 4%, transparent);
}

.asc-ov__trust-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: $space-3;
  margin-bottom: $space-2;
  font-size: $font-size-sm;
}

.asc-ov__trust-k {
  color: $color-text-tertiary;
}

.asc-ov__trust-v {
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.asc-ov__trust-v--muted {
  font-weight: $font-weight-semibold;
  color: $color-text-secondary;
}

.asc-ov__trust-note {
  margin: 0 0 $space-2;
  font-size: 10px;
  line-height: 1.5;
  color: $color-text-tertiary;
}

.asc-ov__trust-link {
  display: inline-flex;
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  color: var(--ex-brand);
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

.asc-ov__controls {
  display: flex;
  flex-direction: column;
  gap: $space-1;
  margin-left: auto;
  align-items: flex-end;
  text-align: right;
}

.asc-ov__switch {
  display: inline-flex;
  align-items: center;
  gap: $space-2;
  font-size: $font-size-xs;
  color: $color-text-secondary;
  cursor: pointer;
  user-select: none;
}

.asc-ov__switch input {
  accent-color: $color-brand;
}

.asc-ov__hint {
  font-size: 10px;
  color: $color-text-tertiary;
}

.asc-ov__chart {
  padding-left: $space-4;
  border-left: 1px solid var(--ex-border-subtle);
}

@include mq.media-down(lg) {
  .asc-ov__chart {
    padding-left: 0;
    border-left: none;
    padding-top: $space-4;
    border-top: 1px solid var(--ex-border-subtle);
  }
}

@include mq.media-down(md) {
  .asc-ov__main {
    flex-direction: column;
    align-items: stretch;
    gap: $space-4;
  }

  .asc-ov__controls {
    margin-left: 0;
    align-items: flex-start;
    text-align: left;
    width: 100%;
    padding-top: $space-2;
    border-top: 1px solid var(--ex-border-subtle);
  }

  .asc-ov__total {
    font-size: $font-size-xl;
  }
}

.asc-ov__chart-title {
  margin: 0 0 $space-3;
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  color: $color-text-tertiary;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.asc-ov__bars {
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.asc-ov__bar-row {
  display: grid;
  grid-template-columns: 52px 1fr minmax(72px, auto);
  align-items: center;
  gap: $space-2;
  font-size: $font-size-xs;
}

.asc-ov__bar-label {
  color: $color-text-secondary;
}

.asc-ov__bar-track {
  height: 6px;
  border-radius: 3px;
  background: var(--ex-fill-hover-subtle);
  overflow: hidden;
}

.asc-ov__bar-fill {
  height: 100%;
  border-radius: 3px;
  background: var(--ex-info);
  transition: width 0.35s ease;
}

.asc-ov__bar-val {
  text-align: right;
  color: $color-text-secondary;
  font-size: 11px;
}

.asc-ov__chart-note {
  margin: $space-3 0 0;
  font-size: 10px;
  color: $color-text-tertiary;
}

</style>
