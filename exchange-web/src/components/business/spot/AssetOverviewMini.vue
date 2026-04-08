<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useSpotTradeStore } from '@/stores/spotTrade'
import { formatPrice } from '@/utils/format/number'

const store = useSpotTradeStore()
const { baseAvailable, quoteAvailable } = storeToRefs(store)
</script>

<template>
  <div class="aom">
    <div class="aom__grid">
      <div class="aom__card">
        <span class="aom__k">可卖 {{ store.baseAsset }}</span>
        <span class="aom__v ex-num">{{ baseAvailable.toFixed(8) }}</span>
      </div>
      <div class="aom__card">
        <span class="aom__k">可用 {{ store.quoteAsset }}</span>
        <span class="aom__v ex-num">{{ formatPrice(quoteAvailable) }}</span>
      </div>
    </div>
    <p class="aom__note">
      数据来自 REST 快照；划转 / 冻结以账户服务为准。资产变动可订阅
      <code class="aom__code">user.balance</code> WebSocket。
    </p>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.aom {
  padding: $space-4;
}

.aom__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: $space-3;
}

.aom__card {
  display: flex;
  flex-direction: column;
  gap: $space-1;
  padding: $space-3;
  border: 1px solid $color-border;
  border-radius: $radius-sm;
  background: $color-bg-base;
}

.aom__k {
  font-size: $font-size-xs;
  color: $color-text-tertiary;
}

.aom__v {
  font-size: $font-size-md;
  font-weight: $font-weight-semibold;
  color: $color-text-primary;
}

.aom__note {
  margin: $space-3 0 0;
  font-size: 10px;
  line-height: 1.5;
  color: $color-text-tertiary;
}

.aom__code {
  font-family: $font-family-mono;
  font-size: 1em;
  color: $color-text-secondary;
}
</style>
