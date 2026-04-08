<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useAssetsCenterStore } from '@/stores/assetsCenter'
import type { AssetsAccountTab } from '@/types/assetsCenter'

const store = useAssetsCenterStore()
const { activeAccountTab } = storeToRefs(store)

const items: { key: AssetsAccountTab; label: string; tag?: string }[] = [
  { key: 'overview', label: '总览' },
  { key: 'spot', label: '现货账户' },
  { key: 'futures', label: '合约账户' },
  { key: 'funding', label: '资金账户' },
  { key: 'earn', label: '理财账户' },
  { key: 'nft', label: 'NFT 账户' },
]
</script>

<template>
  <div class="asc-tabs" role="tablist" aria-label="账户分类">
    <button
      v-for="item in items"
      :key="item.key"
      type="button"
      role="tab"
      class="asc-tabs__btn"
      :class="{ 'asc-tabs__btn--on': activeAccountTab === item.key }"
      :aria-selected="activeAccountTab === item.key"
      @click="store.setAccountTab(item.key)"
    >
      {{ item.label }}
      <span v-if="item.tag" class="asc-tabs__tag">{{ item.tag }}</span>
    </button>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;
@use '@/styles/mixins' as mq;

.asc-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  padding: 3px;
  border-radius: $radius-md;
  background: $color-bg-base;
  border: 1px solid $color-border;
}

@include mq.media-down(md) {
  .asc-tabs {
    flex-wrap: nowrap;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior-x: contain;
  }

  .asc-tabs__btn {
    flex: 0 0 auto;
    white-space: nowrap;
  }
}

.asc-tabs__btn {
  position: relative;
  padding: $space-2 $space-4;
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  color: $color-text-tertiary;
  background: transparent;
  border: none;
  border-radius: $radius-sm;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: $space-1;
  transition: color 0.15s ease, background 0.15s ease;
}

.asc-tabs__btn:hover {
  color: $color-text-secondary;
}

.asc-tabs__btn--on {
  color: $color-text-primary;
  background: $color-bg-surface;
  box-shadow: 0 1px 0 rgba(240, 185, 11, 0.2);
}

.asc-tabs__btn--on::after {
  content: '';
  position: absolute;
  left: $space-3;
  right: $space-3;
  bottom: 2px;
  height: 2px;
  border-radius: 1px;
  background: var(--ex-brand);
  opacity: 0.9;
}

.asc-tabs__tag {
  font-size: 9px;
  padding: 1px 4px;
  border-radius: 2px;
  background: rgba(240, 185, 11, 0.12);
  color: $color-brand;
  font-weight: $font-weight-bold;
}
</style>
