<script setup lang="ts">
/**
 * 交易对名称区：收藏 + 币种占位图标 + 插槽（内放交易对选择器/按钮）。
 * 现货与合约顶栏共用，保持多端视觉一致。
 */
import { computed } from 'vue'

const props = defineProps<{
  /** 基础资产，用于圆形图标内首字母 */
  baseAsset: string
  isFavorite?: boolean
  /** 自选按钮 aria */
  favoriteLabelOn?: string
  favoriteLabelOff?: string
}>()

const emit = defineEmits<{
  (e: 'toggle-favorite'): void
}>()

const initial = computed(() => (props.baseAsset || '?').slice(0, 1).toUpperCase())

function onFav() {
  emit('toggle-favorite')
}
</script>

<template>
  <div class="tpnc">
    <button
      type="button"
      class="tpnc__fav"
      :class="{ 'tpnc__fav--on': isFavorite }"
      :aria-pressed="isFavorite"
      :aria-label="isFavorite ? (favoriteLabelOn ?? '取消自选') : (favoriteLabelOff ?? '加入自选')"
      @click="onFav"
    >
      <span aria-hidden="true">{{ isFavorite ? '★' : '☆' }}</span>
    </button>

    <div class="tpnc__coin" aria-hidden="true">
      <span class="tpnc__coin-inner">{{ initial }}</span>
    </div>

    <div class="tpnc__pair">
      <slot />
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.tpnc {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.tpnc__fav {
  flex-shrink: 0;
  width: 30px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid color-mix(in srgb, var(--ex-text-primary) 12%, var(--ex-border));
  border-radius: 4px;
  background: color-mix(in srgb, var(--ex-bg-elevated) 92%, #000);
  color: var(--ex-text-tertiary);
  font-size: 15px;
  line-height: 1;
  cursor: pointer;
  transition:
    color 0.15s ease,
    border-color 0.15s ease;
}

.tpnc__fav:hover {
  border-color: color-mix(in srgb, var(--ex-brand) 45%, transparent);
  color: var(--ex-brand);
}

.tpnc__fav--on {
  color: var(--ex-brand);
}

.tpnc__coin {
  flex-shrink: 0;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--ex-brand);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 1px 0 color-mix(in srgb, #fff 22%, transparent);
}

.tpnc__coin-inner {
  font-size: 11px;
  font-weight: $font-weight-bold;
  color: #1e2329;
  letter-spacing: -0.02em;
}

.tpnc__pair {
  min-width: 0;
  display: flex;
  align-items: center;
}
</style>
