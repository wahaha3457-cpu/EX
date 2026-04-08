<script setup lang="ts">
/**
 * 交割页右侧：快速切换本品类合约（YYMMDD）。
 */
import { computed, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { RouteNames } from '@/constants/routeNames'
import { DELIVERY_QUICK_SYMBOLS } from '@/api/delivery/deliverySymbols'
import { deliveryDemoCycleLabel } from '@/composables/delivery/deliveryCycleUtils'
import { useDeliveryTradeStore } from '@/stores/deliveryTrade'
import { storeToRefs } from 'pinia'
import { formatPct, formatPrice } from '@/utils/format/tradingDisplay'
import TradeFlowInfoModal from '@/components/trading/TradeFlowInfoModal.vue'
import DeliveryFlowGuide from '@/components/business/delivery/DeliveryFlowGuide.vue'

const DELIVERY_FLOW_MODAL_TITLE = '交割合约流程（到期结算为 Mock 展示）'

const router = useRouter()
const deliveryFlowModalOpen = ref(false)
const store = useDeliveryTradeStore()
const { symbol: active, ticker } = storeToRefs(store)

const staticChg: Record<string, number> = {
  BTCUSDT_250627: 0.62,
  BTCUSDT_250926: -0.18,
  ETHUSDT_250627: 1.05,
  SOLUSDT_250627: -0.92,
}

const rows = computed(() =>
  DELIVERY_QUICK_SYMBOLS.map((sym) => {
    const isActive = sym === active.value
    const mid = sym.startsWith('ETH') ? 3508 : sym.startsWith('SOL') ? 178 : 68380
    const price = isActive && ticker.value ? ticker.value.lastPrice : mid
    const chg = isActive && ticker.value ? ticker.value.changePct24h : staticChg[sym] ?? 0
    return {
      sym,
      label: `${sym.replace(/USDT_/i, '/USDT_')}`,
      cycle: deliveryDemoCycleLabel(sym),
      price,
      chg,
      isActive,
    }
  }),
)

function changeClass(pct: number): string {
  if (!Number.isFinite(pct) || pct === 0) return 'dmq__chg--flat'
  return pct > 0 ? 'dmq__chg--up' : 'dmq__chg--down'
}

function go(sym: string) {
  router.push({ name: RouteNames.DeliveryContract, params: { symbol: sym } })
}
</script>

<template>
  <section class="dmq" aria-label="交割合约列表">
    <header class="dmq__head">
      <div class="dmq__title-left">
        <h3 class="dmq__title">交割合约</h3>
        <button
          type="button"
          class="dmq__info"
          aria-label="查看交割合约流程说明"
          @click="deliveryFlowModalOpen = true"
        >
          <span class="dmq__info-icon" aria-hidden="true">i</span>
        </button>
      </div>
      <span class="dmq__tag">USDT</span>
    </header>
    <div class="dmq__grid-head">
      <span>合约</span>
      <span class="dmq__r">最新价</span>
      <span class="dmq__r">24h</span>
    </div>
    <ul class="dmq__list" role="list">
      <li
        v-for="r in rows"
        :key="r.sym"
        role="listitem"
        class="dmq__row"
        :class="{ 'dmq__row--on': r.isActive }"
        tabindex="0"
        @click="go(r.sym)"
        @keydown.enter="go(r.sym)"
      >
        <div class="dmq__pair">
          <span class="dmq__sym">{{ r.label }}</span>
          <span class="dmq__cycle">{{ r.cycle }}</span>
        </div>
        <span class="dmq__px ex-num">{{ formatPrice(r.price) }}</span>
        <span class="dmq__chg ex-num" :class="changeClass(r.chg)">{{ formatPct(r.chg) }}</span>
      </li>
    </ul>
    <footer class="dmq__foot">
      <RouterLink :to="{ name: RouteNames.ContractTrade, params: { symbol: 'BTCUSDT' } }" class="dmq__more">
        U 本位永续
      </RouterLink>
    </footer>

    <TradeFlowInfoModal v-model="deliveryFlowModalOpen" :title="DELIVERY_FLOW_MODAL_TITLE">
      <DeliveryFlowGuide />
    </TradeFlowInfoModal>
  </section>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.dmq {
  display: flex;
  flex-direction: column;
  flex: 1 1 50%;
  min-height: 0;
  border: 1px solid $color-border;
  border-radius: $radius-md;
  background: var(--ex-elevated-panel-surface);
  box-shadow: var(--ex-elevated-panel-shadow);
  overflow: hidden;
}

.dmq__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-2;
  padding: $space-2 $space-3;
  border-bottom: 1px solid $color-border;
  background: var(--ex-surface-inset-strong);
}

.dmq__title-left {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.dmq__title {
  margin: 0;
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.dmq__info {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  padding: 0;
  border: 1px solid var(--ex-border);
  border-radius: 50%;
  background: transparent;
  color: $color-text-tertiary;
  font-size: 11px;
  font-weight: $font-weight-bold;
  font-style: italic;
  font-family: $font-family-base;
  line-height: 1;
  cursor: pointer;
  transition:
    color 0.15s ease,
    border-color 0.15s ease,
    background 0.15s ease;
}

.dmq__info:hover,
.dmq__info:focus-visible {
  color: $color-brand;
  border-color: rgba(240, 185, 11, 0.45);
  background: rgba(240, 185, 11, 0.08);
  outline: none;
}

.dmq__tag {
  font-size: 10px;
  font-weight: $font-weight-bold;
  padding: 2px 8px;
  border-radius: 4px;
  color: var(--ex-info);
  border: 1px solid color-mix(in srgb, var(--ex-info) 28%, transparent);
  background: var(--ex-info-bg);
}

.dmq__grid-head {
  display: grid;
  grid-template-columns: 1fr 72px 56px;
  padding: 6px $space-2;
  font-size: 10px;
  font-weight: $font-weight-semibold;
  color: $color-text-tertiary;
  text-transform: uppercase;
  border-bottom: 1px solid var(--ex-border-subtle);
}

.dmq__r {
  text-align: right;
}

.dmq__list {
  list-style: none;
  margin: 0;
  padding: 0;
  overflow-y: auto;
  flex: 1;
  min-height: 100px;
  scrollbar-width: thin;
}

.dmq__row {
  display: grid;
  grid-template-columns: 1fr 72px 56px;
  align-items: center;
  gap: 4px;
  padding: 8px $space-2;
  font-size: $font-size-xs;
  cursor: pointer;
  border-bottom: 1px solid transparent;
  font-family: $font-family-mono;

  &:hover {
    background: var(--ex-fill-ghost);
  }

  &--on {
    background: rgba(240, 185, 11, 0.08);
    box-shadow: inset 0 0 0 1px rgba(240, 185, 11, 0.2);
  }
}

.dmq__pair {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.dmq__sym {
  font-weight: $font-weight-bold;
  color: $color-text-secondary;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dmq__cycle {
  font-size: 10px;
  color: $color-text-tertiary;
}

.dmq__px {
  text-align: right;
  font-weight: $font-weight-semibold;
  color: $color-text-primary;
}

.dmq__chg {
  text-align: right;
}

.dmq__chg--up {
  color: $color-rise;
}
.dmq__chg--down {
  color: $color-fall;
}
.dmq__chg--flat {
  color: $color-text-tertiary;
}

.dmq__foot {
  padding: 8px;
  border-top: 1px solid var(--ex-border-subtle);
  text-align: center;
  background: var(--ex-panel-sunken);
}

.dmq__more {
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  color: #8ab4ff;
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
}

.ex-num {
  font-family: $font-family-mono;
}
</style>
