<script setup lang="ts">
import type { MarketChangeFilter } from '@/types/market'
import MarketSearchBar from './MarketSearchBar.vue'

defineProps<{
  searchQuery: string
  changeFilter: MarketChangeFilter
}>()

const emit = defineEmits<{
  (e: 'update:searchQuery', v: string): void
  (e: 'update:changeFilter', v: MarketChangeFilter): void
}>()

const chgTabs: { key: MarketChangeFilter; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'up', label: '上涨' },
  { key: 'down', label: '下跌' },
]
</script>

<template>
  <div class="mfbar">
    <MarketSearchBar
      :model-value="searchQuery"
      @update:model-value="emit('update:searchQuery', $event)"
    />

    <div class="mfbar__chg" role="group" aria-label="24h涨跌筛选">
      <span class="mfbar__chg-label">24h涨跌</span>
      <div class="mfbar__chg-tabs">
        <button
          v-for="c in chgTabs"
          :key="c.key"
          type="button"
          class="mfbar__chg-btn"
          :class="{ 'mfbar__chg-btn--on': changeFilter === c.key }"
          @click="emit('update:changeFilter', c.key)"
        >
          {{ c.label }}
        </button>
      </div>
    </div>

    <p class="mfbar__sort-hint">
      排序：点击表头「价格 / 24h涨跌 / 24h成交量」等列切换升降序。
    </p>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;
@use '@/styles/mixins' as mq;

.mfbar {
  display: flex;
  flex-wrap: wrap;
  align-items: stretch;
  gap: $space-3 $space-4;
  width: 100%;
  min-width: 0;

  :deep(.msrch) {
    min-width: 0;
    max-width: none;
    flex: 1 1 220px;
  }

  @include mq.media-down(md) {
    flex-direction: column;
    align-items: stretch;

    :deep(.msrch) {
      flex: 1 1 auto;
      max-width: none;
      width: 100%;
    }

    .mfbar__chg {
      width: 100%;
    }
  }
}

.mfbar__chg {
  display: flex;
  align-items: center;
  gap: $space-2;
  flex-wrap: wrap;
}

.mfbar__chg-label {
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  color: $color-text-secondary;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.mfbar__chg-tabs {
  display: inline-flex;
  flex: 1 1 auto;
  min-width: 0;
  border-radius: $radius-sm;
  border: 1px solid $color-border;
  overflow: hidden;
}

.mfbar__chg-btn {
  flex: 1 1 0;
  min-height: $control-height-md;
  padding: $space-1 $space-3;
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  color: $color-text-tertiary;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: background 0.12s ease, color 0.12s ease;
}

.mfbar__chg-btn:hover {
  color: $color-text-primary;
}

.mfbar__chg-btn--on {
  color: $color-brand;
  background: color-mix(in srgb, var(--ex-brand) 10%, transparent);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--ex-brand) 22%, transparent);
}

.mfbar__sort-hint {
  margin: 0;
  flex: 1;
  min-width: 200px;
  font-size: $font-size-sm;
  color: $color-text-tertiary;
  line-height: 1.4;
}

@include mq.media-down(md) {
  .mfbar__sort-hint {
    display: none;
  }
}
</style>
