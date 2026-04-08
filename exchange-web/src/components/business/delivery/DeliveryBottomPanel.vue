<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useDeliveryTradeStore } from '@/stores/deliveryTrade'
import DeliveryPositionTable from './DeliveryPositionTable.vue'
import DeliveryTradeHistoryTable from './DeliveryTradeHistoryTable.vue'
import DeliveryFundingLedgerTable from './DeliveryFundingLedgerTable.vue'

type DeliveryDockTab = 'positions' | 'fills' | 'ledger'

const store = useDeliveryTradeStore()
const { positions } = storeToRefs(store)

const tab = ref<DeliveryDockTab>('positions')
</script>

<template>
  <section id="trade-delivery-positions" class="dbp" aria-label="交割持仓与成交">
    <p class="dbp__intro">
      交割设计下下单成功后直接进入持仓；到期按演示规则结算并从列表移除。成交与资金流水为独立记录。
    </p>
    <div class="dbp__tabs" role="tablist">
      <button
        type="button"
        role="tab"
        class="dbp__tab"
        :class="{ 'dbp__tab--on': tab === 'positions' }"
        @click="tab = 'positions'"
      >
        持仓
        <span class="dbp__badge">{{ positions.length }}</span>
      </button>
      <button
        type="button"
        role="tab"
        class="dbp__tab"
        :class="{ 'dbp__tab--on': tab === 'fills' }"
        @click="tab = 'fills'"
      >
        成交记录
      </button>
      <button
        type="button"
        role="tab"
        class="dbp__tab"
        :class="{ 'dbp__tab--on': tab === 'ledger' }"
        @click="tab = 'ledger'"
      >
        资金流水
        <span class="dbp__tag">预留</span>
      </button>
    </div>

    <div class="dbp__body">
      <DeliveryPositionTable v-show="tab === 'positions'" />
      <DeliveryTradeHistoryTable v-show="tab === 'fills'" />
      <DeliveryFundingLedgerTable v-show="tab === 'ledger'" />
    </div>
  </section>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;
@use '@/styles/mixins' as mq;

.dbp {
  border: 1px solid $color-border;
  border-radius: $radius-md;
  background: $color-bg-elevated;
  display: flex;
  flex-direction: column;
  min-height: 200px;
  overflow: hidden;
}

.dbp__intro {
  margin: 0;
  padding: $space-2 $space-4;
  font-size: 11px;
  line-height: 1.5;
  color: $color-text-tertiary;
  border-bottom: 1px solid var(--ex-border-subtle);
  background: var(--ex-panel-sunken);
}

.dbp__tabs {
  display: flex;
  flex-wrap: wrap;
  align-items: stretch;
  border-bottom: 1px solid $color-border;
  background: var(--ex-surface-inset);
}

.dbp__tab {
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

.dbp__tab:hover {
  color: $color-text-secondary;
}

.dbp__tab--on {
  color: $color-text-primary;
}

.dbp__tab--on::after {
  content: '';
  position: absolute;
  left: $space-3;
  right: $space-3;
  bottom: 0;
  height: 2px;
  background: linear-gradient(90deg, #3084fc, #6aa9ff);
  border-radius: 1px 1px 0 0;
}

.dbp__badge {
  padding: 0 5px;
  font-size: 10px;
  font-weight: $font-weight-bold;
  border-radius: 8px;
  background: rgba(48, 132, 252, 0.2);
  color: #8ab4ff;
}

.dbp__tag {
  font-size: 9px;
  padding: 0 4px;
  border-radius: 2px;
  background: rgba(240, 185, 11, 0.12);
  color: $color-brand;
}

.dbp__body {
  flex: 1;
  min-height: 0;
}

/** 窄屏：Tab 横滑 */
@include mq.media-down(md) {
  .dbp {
    min-height: 240px;
  }

  .dbp__tabs {
    flex-wrap: nowrap;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior-x: contain;
  }

  .dbp__tab {
    flex: 0 0 auto;
    padding: $space-2 $space-3;
    min-height: $control-height-lg;
  }
}
</style>
