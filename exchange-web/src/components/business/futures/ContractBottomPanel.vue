<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useFuturesTradeStore } from '@/stores/futuresTrade'
import type { FuturesBottomDockTab } from '@/types/futuresTrade'
import ContractPositionTable from './ContractPositionTable.vue'
import ContractCurrentOrdersTable from './ContractCurrentOrdersTable.vue'
import ContractOrderHistoryTable from './ContractOrderHistoryTable.vue'
import ContractTradeHistoryTable from './ContractTradeHistoryTable.vue'
import ContractFundingLedgerTable from './ContractFundingLedgerTable.vue'
import ContractConditionalPlaceholder from './ContractConditionalPlaceholder.vue'

const store = useFuturesTradeStore()
const { positions, openOrders } = storeToRefs(store)

const tab = ref<FuturesBottomDockTab>('positions')
</script>

<template>
  <section id="trade-positions" class="cbp" aria-label="持仓与委托">
    <div class="cbp__tabs" role="tablist">
      <button
        type="button"
        role="tab"
        class="cbp__tab"
        :class="{ 'cbp__tab--on': tab === 'positions' }"
        @click="tab = 'positions'"
      >
        当前持仓
        <span class="cbp__badge">{{ positions.length }}</span>
      </button>
      <button
        type="button"
        role="tab"
        class="cbp__tab"
        :class="{ 'cbp__tab--on': tab === 'orders' }"
        @click="tab = 'orders'"
      >
        当前委托
        <span class="cbp__badge">{{ openOrders.length }}</span>
      </button>
      <button
        type="button"
        role="tab"
        class="cbp__tab"
        :class="{ 'cbp__tab--on': tab === 'history' }"
        @click="tab = 'history'"
      >
        历史委托
      </button>
      <button
        type="button"
        role="tab"
        class="cbp__tab"
        :class="{ 'cbp__tab--on': tab === 'fills' }"
        @click="tab = 'fills'"
      >
        成交记录
      </button>
      <button
        type="button"
        role="tab"
        class="cbp__tab"
        :class="{ 'cbp__tab--on': tab === 'ledger' }"
        @click="tab = 'ledger'"
      >
        资金流水
        <span class="cbp__tag">预留</span>
      </button>
      <button
        type="button"
        role="tab"
        class="cbp__tab"
        :class="{ 'cbp__tab--on': tab === 'conditional' }"
        @click="tab = 'conditional'"
      >
        条件单
        <span class="cbp__tag">预留</span>
      </button>
    </div>

    <div class="cbp__body">
      <ContractPositionTable v-show="tab === 'positions'" />
      <ContractCurrentOrdersTable v-show="tab === 'orders'" />
      <ContractOrderHistoryTable v-show="tab === 'history'" />
      <ContractTradeHistoryTable v-show="tab === 'fills'" />
      <ContractFundingLedgerTable v-show="tab === 'ledger'" />
      <ContractConditionalPlaceholder v-show="tab === 'conditional'" />
    </div>
  </section>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;
@use '@/styles/mixins' as mq;

.cbp {
  border: 1px solid $color-border;
  border-radius: $radius-md;
  background: $color-bg-elevated;
  display: flex;
  flex-direction: column;
  min-height: 200px;
}

.cbp__tabs {
  display: flex;
  flex-wrap: wrap;
  align-items: stretch;
  border-bottom: 1px solid $color-border;
  background: var(--ex-surface-inset);
}

.cbp__tab {
  position: relative;
  padding: $space-2 $space-4;
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  color: $color-text-tertiary;
  background: transparent;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: $space-1;
}

.cbp__tab:hover {
  color: $color-text-secondary;
}

.cbp__tab--on {
  color: $color-text-primary;
}

.cbp__tab--on::after {
  content: '';
  position: absolute;
  left: $space-3;
  right: $space-3;
  bottom: 0;
  height: 2px;
  background: linear-gradient(90deg, #3084fc, #6aa9ff);
  border-radius: 1px 1px 0 0;
}

.cbp__badge {
  padding: 0 5px;
  font-size: 10px;
  font-weight: $font-weight-bold;
  border-radius: 8px;
  background: rgba(48, 132, 252, 0.2);
  color: #8ab4ff;
}

.cbp__tag {
  font-size: 9px;
  padding: 0 4px;
  border-radius: 2px;
  background: rgba(240, 185, 11, 0.12);
  color: $color-brand;
}

.cbp__body {
  flex: 1;
  min-height: 0;
}

/** 窄屏：持仓/委托 Tab 横滑，避免多 Tab 换行挤压不可点 */
@include mq.media-down(md) {
  .cbp {
    min-height: 240px;
  }

  .cbp__tabs {
    flex-wrap: nowrap;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior-x: contain;
  }

  .cbp__tab {
    flex: 0 0 auto;
    padding: $space-2 $space-3;
    min-height: $control-height-lg;
  }
}
</style>
