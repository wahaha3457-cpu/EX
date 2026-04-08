<script setup lang="ts">
import type { MarketContractSub, MarketSegment, MarketWatchlistSub } from '@/types/market'

const props = defineProps<{
  modelValue: MarketSegment
  contractSub: MarketContractSub
  watchlistSub: MarketWatchlistSub
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: MarketSegment): void
  (e: 'update:contractSub', v: MarketContractSub): void
  (e: 'update:watchlistSub', v: MarketWatchlistSub): void
}>()

const primaryTabs: {
  key: MarketSegment
  label: string
  reserved?: boolean
}[] = [
  { key: 'WATCHLIST', label: '自选', reserved: true },
  { key: 'SPOT', label: '现货' },
  { key: 'CONTRACT', label: '合约' },
  { key: 'HOT', label: '热门' },
  { key: 'GAINERS', label: '涨幅' },
  { key: 'LOSERS', label: '跌幅' },
  { key: 'VOLUME_24H', label: '24h交易额' },
]

function select(k: MarketSegment) {
  if (k === props.modelValue) return
  emit('update:modelValue', k)
  if (k === 'CONTRACT') {
    emit('update:contractSub', 'PERPETUAL')
  }
}

function selectContractSub(sub: MarketContractSub) {
  if (props.modelValue !== 'CONTRACT') emit('update:modelValue', 'CONTRACT')
  emit('update:contractSub', sub)
}

function selectWatchlistSub(sub: MarketWatchlistSub) {
  if (props.modelValue !== 'WATCHLIST') emit('update:modelValue', 'WATCHLIST')
  emit('update:watchlistSub', sub)
}
</script>

<template>
  <div class="mseg-wrap">
    <div class="mseg" role="tablist" aria-label="行情分类">
      <button
        v-for="t in primaryTabs"
        :key="t.key"
        type="button"
        role="tab"
        class="mseg__tab"
        :class="{ 'mseg__tab--on': props.modelValue === t.key }"
        :aria-selected="props.modelValue === t.key"
        @click="select(t.key)"
      >
        <span class="mseg__label">{{ t.label }}</span>
        <span v-if="t.reserved" class="mseg__badge" title="能力与数据字段已预留，可对接运营配置">预留</span>
      </button>
    </div>

    <div
      v-if="modelValue === 'WATCHLIST'"
      class="mseg__sub"
      role="tablist"
      aria-label="自选类型"
    >
      <button
        type="button"
        role="tab"
        class="mseg__sub-tab"
        :class="{ 'mseg__sub-tab--on': watchlistSub === 'SPOT' }"
        :aria-selected="watchlistSub === 'SPOT'"
        @click="selectWatchlistSub('SPOT')"
      >
        现货
      </button>
      <button
        type="button"
        role="tab"
        class="mseg__sub-tab"
        :class="{ 'mseg__sub-tab--on': watchlistSub === 'PERPETUAL' }"
        :aria-selected="watchlistSub === 'PERPETUAL'"
        @click="selectWatchlistSub('PERPETUAL')"
      >
        永续合约
      </button>
      <button
        type="button"
        role="tab"
        class="mseg__sub-tab"
        :class="{ 'mseg__sub-tab--on': watchlistSub === 'DELIVERY' }"
        :aria-selected="watchlistSub === 'DELIVERY'"
        @click="selectWatchlistSub('DELIVERY')"
      >
        交割合约
      </button>
    </div>

    <div
      v-if="modelValue === 'CONTRACT'"
      class="mseg__sub"
      role="tablist"
      aria-label="合约类型"
    >
      <button
        type="button"
        role="tab"
        class="mseg__sub-tab"
        :class="{ 'mseg__sub-tab--on': contractSub === 'PERPETUAL' }"
        :aria-selected="contractSub === 'PERPETUAL'"
        @click="selectContractSub('PERPETUAL')"
      >
        永续合约
      </button>
      <button
        type="button"
        role="tab"
        class="mseg__sub-tab"
        :class="{ 'mseg__sub-tab--on': contractSub === 'DELIVERY' }"
        :aria-selected="contractSub === 'DELIVERY'"
        @click="selectContractSub('DELIVERY')"
      >
        交割合约
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;
@use '@/styles/mixins' as mq;

.mseg-wrap {
  display: flex;
  flex-direction: column;
  gap: $space-2;
  min-width: 0;
}

.mseg {
  display: flex;
  flex-wrap: nowrap;
  gap: $space-1;
  padding: 4px;
  border-radius: $radius-md;
  background: var(--ex-panel-sunken);
  border: 1px solid $color-border;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-x: contain;

  @include mq.media-up(lg) {
    flex-wrap: wrap;
    overflow: visible;
  }
}

:global([data-theme='monochrome']) .mseg {
  background: var(--ex-bg-elevated);
}

.mseg__tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex: 0 0 auto;
  min-height: $control-height-md;
  padding: $space-2 $space-3;
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  color: $color-text-tertiary;
  background: transparent;
  border: none;
  border-radius: $radius-sm;
  cursor: pointer;
  transition:
    background 0.15s ease,
    color 0.15s ease;
}

.mseg__tab:hover {
  color: $color-text-primary;
}

.mseg__tab--on {
  color: $color-text-primary;
  background: var(--ex-brand-muted);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--ex-brand) 30%, transparent);
}

.mseg__badge {
  font-size: 10px;
  font-weight: $font-weight-medium;
  padding: 1px 5px;
  border-radius: 999px;
  border: 1px solid var(--ex-border);
  color: $color-text-tertiary;
  line-height: 1;
}

.mseg__sub {
  display: flex;
  flex-wrap: wrap;
  gap: $space-1;
  padding: 2px;
}

.mseg__sub-tab {
  flex: 0 0 auto;
  min-height: 36px;
  padding: $space-2 $space-4;
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  color: $color-text-secondary;
  background: var(--ex-fill-ghost);
  border: 1px solid var(--ex-border-subtle);
  border-radius: $radius-sm;
  cursor: pointer;
  transition:
    color 0.15s ease,
    border-color 0.15s ease,
    background 0.15s ease;
}

.mseg__sub-tab:hover {
  color: $color-text-primary;
  border-color: color-mix(in srgb, var(--ex-brand) 22%, var(--ex-border));
}

.mseg__sub-tab--on {
  color: $color-text-primary;
  background: var(--ex-brand-muted);
  border-color: color-mix(in srgb, var(--ex-brand) 35%, transparent);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--ex-brand) 22%, transparent);
}
</style>
