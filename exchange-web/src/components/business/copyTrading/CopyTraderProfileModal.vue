<script setup lang="ts">
import type { CopyMarket, LeadTrader } from '@/types/copyTrading'
import { formatPrice } from '@/utils/format/number'
import { formatCompact } from '@/utils/format'

defineProps<{
  modelValue: boolean
  trader: LeadTrader | null
  following: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'follow'): void
  (e: 'adjust'): void
}>()

function close() {
  emit('update:modelValue', false)
}

function marketLabel(m: CopyMarket) {
  return m === 'SPOT' ? '现货' : '合约'
}

function riskLabel(level: number) {
  if (level <= 2) return '偏低'
  if (level === 3) return '中等'
  return '偏高'
}

function riskClass(level: number) {
  if (level <= 2) return 'ctp-prof__risk--low'
  if (level === 3) return 'ctp-prof__risk--mid'
  return 'ctp-prof__risk--high'
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="modelValue && trader"
      class="ctp-prof-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="交易员详情"
      @click.self="close"
    >
      <div class="ctp-prof">
        <div class="ctp-prof__head">
          <div class="ctp-prof__who">
            <div
              class="ctp-prof__avatar"
              :style="{ background: `hsl(${trader.avatarHue} 55% 38%)` }"
              aria-hidden="true"
            >
              {{ trader.displayName.slice(0, 1) }}
            </div>
            <div>
              <h2 class="ctp-prof__name">{{ trader.displayName }}</h2>
              <p class="ctp-prof__risk" :class="riskClass(trader.riskLevel)">
                风险 {{ riskLabel(trader.riskLevel) }} · 近 30 日 {{ trader.trades30d }} 笔带单
              </p>
            </div>
          </div>
          <button type="button" class="ctp-prof__x" aria-label="关闭" @click="close">×</button>
        </div>

        <div class="ctp-prof__body">
          <div class="ctp-prof__tags">
            <span v-for="tag in trader.tags" :key="tag" class="ctp-prof__tag">{{ tag }}</span>
            <span v-for="m in trader.markets" :key="m" class="ctp-prof__tag ctp-prof__tag--m">{{
              marketLabel(m)
            }}</span>
          </div>

          <div class="ctp-prof__grid">
            <div class="ctp-prof__cell">
              <span class="ctp-prof__k">30 日收益率</span>
              <span
                class="ctp-prof__v ex-num"
                :class="trader.roi30dPct >= 0 ? 'ctp-prof__v--up' : 'ctp-prof__v--dn'"
                >{{ trader.roi30dPct >= 0 ? '+' : '' }}{{ formatPrice(trader.roi30dPct) }}%</span
              >
            </div>
            <div class="ctp-prof__cell">
              <span class="ctp-prof__k">90 日收益率</span>
              <span
                class="ctp-prof__v ex-num"
                :class="trader.roi90dPct >= 0 ? 'ctp-prof__v--up' : 'ctp-prof__v--dn'"
                >{{ trader.roi90dPct >= 0 ? '+' : '' }}{{ formatPrice(trader.roi90dPct) }}%</span
              >
            </div>
            <div class="ctp-prof__cell">
              <span class="ctp-prof__k">胜率</span>
              <span class="ctp-prof__v ex-num">{{ formatPrice(trader.winRatePct) }}%</span>
            </div>
            <div class="ctp-prof__cell">
              <span class="ctp-prof__k">最大回撤</span>
              <span class="ctp-prof__v ex-num">{{ formatPrice(trader.maxDrawdownPct) }}%</span>
            </div>
            <div class="ctp-prof__cell">
              <span class="ctp-prof__k">跟随人数</span>
              <span class="ctp-prof__v ex-num">{{ formatCompact(trader.followers) }}</span>
            </div>
            <div class="ctp-prof__cell">
              <span class="ctp-prof__k">带单规模 (AUM)</span>
              <span class="ctp-prof__v ex-num">≈ {{ formatCompact(trader.aumUsdt) }} USDT</span>
            </div>
          </div>

          <section class="ctp-prof__bio-sec" aria-label="策略说明">
            <h3 class="ctp-prof__bio-title">策略与说明</h3>
            <p class="ctp-prof__bio">{{ trader.bio }}</p>
          </section>
        </div>

        <div class="ctp-prof__foot">
          <button type="button" class="ctp-prof__btn ctp-prof__btn--ghost" @click="close">关闭</button>
          <template v-if="following">
            <button type="button" class="ctp-prof__btn ctp-prof__btn--primary" @click="emit('adjust')">
              调整跟单
            </button>
          </template>
          <button v-else type="button" class="ctp-prof__btn ctp-prof__btn--primary" @click="emit('follow')">
            跟单
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.ctp-prof-overlay {
  position: fixed;
  inset: 0;
  z-index: 545;
  background: var(--ex-overlay-backdrop);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $space-4;
}

.ctp-prof {
  width: 100%;
  max-width: 480px;
  max-height: min(88vh, 640px);
  display: flex;
  flex-direction: column;
  border-radius: $radius-md;
  border: 1px solid $color-border;
  background: var(--ex-card-surface);
  box-shadow: var(--ex-modal-shadow-elevated);
}

.ctp-prof__head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: $space-3;
  padding: $space-4;
  border-bottom: 1px solid $color-border;
  flex-shrink: 0;
}

.ctp-prof__who {
  display: flex;
  align-items: center;
  gap: $space-3;
  min-width: 0;
}

.ctp-prof__avatar {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: $font-size-lg;
  font-weight: $font-weight-bold;
  color: #fff;
  flex-shrink: 0;
}

.ctp-prof__name {
  margin: 0;
  font-size: $font-size-md;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.ctp-prof__risk {
  margin: 6px 0 0;
  font-size: 11px;
  font-weight: $font-weight-semibold;

  &--low {
    color: $color-rise;
  }

  &--mid {
    color: $color-brand;
  }

  &--high {
    color: $color-fall;
  }
}

.ctp-prof__x {
  border: none;
  background: transparent;
  color: $color-text-tertiary;
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
  flex-shrink: 0;
}

.ctp-prof__body {
  padding: $space-4;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
}

.ctp-prof__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: $space-4;
}

.ctp-prof__tag {
  font-size: 10px;
  padding: 4px 10px;
  border-radius: 4px;
  background: rgba(48, 132, 252, 0.12);
  color: #7ab8ff;

  &--m {
    background: rgba(240, 185, 11, 0.12);
    color: $color-brand;
  }
}

.ctp-prof__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $space-2;
  margin-bottom: $space-4;
}

.ctp-prof__cell {
  padding: $space-2 $space-3;
  border-radius: $radius-sm;
  background: var(--ex-panel-sunken);
  border: 1px solid var(--ex-border-subtle);
}

.ctp-prof__k {
  display: block;
  font-size: 10px;
  color: $color-text-tertiary;
  margin-bottom: 4px;
}

.ctp-prof__v {
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  color: $color-text-primary;

  &--up {
    color: $color-rise;
  }

  &--dn {
    color: $color-fall;
  }
}

.ctp-prof__bio-sec {
  padding: $space-3;
  border-radius: $radius-sm;
  border: 1px solid var(--ex-border-subtle);
  background: var(--ex-fill-ghost);
}

.ctp-prof__bio-title {
  margin: 0 0 $space-2;
  font-size: $font-size-xs;
  font-weight: $font-weight-bold;
  color: $color-text-secondary;
}

.ctp-prof__bio {
  margin: 0;
  font-size: $font-size-sm;
  color: $color-text-secondary;
  line-height: 1.6;
}

.ctp-prof__foot {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: $space-2;
  padding: $space-3 $space-4;
  border-top: 1px solid $color-border;
  flex-shrink: 0;
}

.ctp-prof__btn {
  padding: 10px 18px;
  border-radius: $radius-sm;
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  cursor: pointer;
  border: none;
}

.ctp-prof__btn--ghost {
  background: transparent;
  color: $color-text-secondary;
  border: 1px solid $color-border;
}

.ctp-prof__btn--primary {
  background: $color-brand;
  color: var(--ex-on-brand);
}
</style>
