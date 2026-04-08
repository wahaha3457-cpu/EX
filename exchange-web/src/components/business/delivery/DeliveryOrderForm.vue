<script setup lang="ts">
/**
 * 交割下单容器：当前档摘要（期号精确到分钟）+ {@link TradingContractOrderForm}。
 */
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useDeliveryTradeStore } from '@/stores/deliveryTrade'
import { buildDeliveryDisplaySymbol, DELIVERY_DEMO_STAGGER_MS } from '@/api/delivery/deliverySymbols'
import { TradingContractOrderForm } from '@/components/trading'
import DeliveryLeverageControl from './DeliveryLeverageControl.vue'
import DeliveryMarginModeSwitcher from './DeliveryMarginModeSwitcher.vue'
import DeliveryOrderablePeriodsDialog, { type OrderablePeriodRow } from './DeliveryOrderablePeriodsDialog.vue'
import {
  currentUtcMinuteStartMs,
  formatDeliveryCountdownHms,
  nextUtcMinuteStartMs,
  secondsUntilUtcSlotEnd,
} from '@/composables/delivery/deliveryCycleUtils'

const store = useDeliveryTradeStore()
const {
  symbol,
  positionSide,
  formType,
  priceInput,
  qtyInput,
  leverage,
  marginMode,
  tpSlEnabled,
  tpPriceInput,
  slPriceInput,
  availableQuote,
  marginBalance,
  maxOpenNotionalUsdt,
  instrument,
  ticker,
  loading,
  deliveryClockMs,
  orderableSlotOffset,
} = storeToRefs(store)

const periodsModalOpen = ref(false)

const ORDERABLE_PERIOD_COUNT = 10

function formatUtcMinuteHint(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const p2 = (n: number) => String(n).padStart(2, '0')
  return `${p2(d.getUTCMonth() + 1)}/${p2(d.getUTCDate())} ${p2(d.getUTCHours())}:${p2(d.getUTCMinutes())} UTC`
}

const orderablePeriodRows = computed<OrderablePeriodRow[]>(() => {
  const now = deliveryClockMs.value
  const base = currentUtcMinuteStartMs(now)
  const off = orderableSlotOffset.value
  const rows: OrderablePeriodRow[] = []
  for (let i = 0; i < ORDERABLE_PERIOD_COUNT; i++) {
    const ms = base + i * DELIVERY_DEMO_STAGGER_MS
    const iso = new Date(ms).toISOString()
    const isSel = i === off
    rows.push({
      rank: i + 1,
      code: buildDeliveryDisplaySymbol(symbol.value, iso),
      utcHint: formatUtcMinuteHint(iso),
      isSelected: isSel,
      badge: isSel ? (i === 0 ? 'current' : 'selected') : null,
    })
  }
  return rows
})

const countdownHms = computed(() => {
  const now = deliveryClockMs.value
  const slotStart =
    currentUtcMinuteStartMs(now) + orderableSlotOffset.value * DELIVERY_DEMO_STAGGER_MS
  const sec = secondsUntilUtcSlotEnd(now, slotStart)
  return formatDeliveryCountdownHms(sec)
})

/** 选中档：相对当前 UTC 演示分钟 + 偏移（与弹窗列表一致） */
const displayDeliverySymbol = computed(() => {
  const now = deliveryClockMs.value
  const t = currentUtcMinuteStartMs(now) + orderableSlotOffset.value * DELIVERY_DEMO_STAGGER_MS
  return buildDeliveryDisplaySymbol(symbol.value, new Date(t).toISOString())
})

/** 选中档的下一分钟刻度 */
const nextPeriodDisplaySymbol = computed(() => {
  const now = deliveryClockMs.value
  const t =
    currentUtcMinuteStartMs(now) +
    orderableSlotOffset.value * DELIVERY_DEMO_STAGGER_MS +
    DELIVERY_DEMO_STAGGER_MS
  return buildDeliveryDisplaySymbol(symbol.value, new Date(t).toISOString())
})

function onPickOrderablePeriod(rank: number) {
  store.setOrderableSlotOffset(rank - 1)
}

const maxLev = computed(() => instrument.value?.maxLeverage ?? 75)

function onPrice(v: string) {
  priceInput.value = v
}
function onQty(v: string) {
  qtyInput.value = v
}
function onTp(v: string) {
  tpPriceInput.value = v
}
function onSl(v: string) {
  slPriceInput.value = v
}

function setTpSlEnabled(v: boolean) {
  tpSlEnabled.value = v
}
</script>

<template>
  <div class="dof">
    <div v-if="instrument && ticker" class="dof__panel">
      <div class="dof__head">
        <div class="dof__head-row">
          <span class="dof__badge dof__badge--on">{{ orderableSlotOffset === 0 ? '当前' : `第${orderableSlotOffset + 1}档` }}</span>
          <div class="dof__sym-with-more">
            <span class="dof__sym ex-num">{{ displayDeliverySymbol }}</span>
            <button
              type="button"
              class="dof__more"
              :aria-expanded="periodsModalOpen"
              aria-label="查看最近可下单10期"
              @click="periodsModalOpen = true"
            >
              <svg class="dof__more-icon" width="12" height="8" viewBox="0 0 12 8" aria-hidden="true">
                <path
                  d="M1 1.4 L6 6.6 L11 1.4"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
        <div class="dof__head-count">
          本期倒计时：<span class="dof__cd ex-num">{{ countdownHms }}</span>
        </div>
        <div class="dof__head-next">
          下一期：<span class="dof__sym ex-num">{{ nextPeriodDisplaySymbol }}</span>
        </div>
      </div>
    </div>

    <DeliveryOrderablePeriodsDialog
      v-model="periodsModalOpen"
      :periods="orderablePeriodRows"
      @select="onPickOrderablePeriod"
    />

    <TradingContractOrderForm
      :order-action-suffix="`${store.baseAsset} 交割`"
      embed-delivery-lev-margin
      margin-hint="全仓/逐仓决定保证金是否共用；临近交割请留意保证金与仓位（演示）。"
      :symbol="symbol"
      :position-side="positionSide"
      :form-type="formType"
      :price="priceInput"
      :quantity="qtyInput"
      :leverage="leverage"
      :max-leverage="maxLev"
      :margin-mode="marginMode"
      :base-asset="store.baseAsset"
      :quote-asset="store.quoteAsset"
      :wallet-asset="store.walletAsset"
      :available-quote="availableQuote"
      :margin-balance="marginBalance"
      :max-open-notional-usdt="maxOpenNotionalUsdt"
      :mark-price="store.markPrice"
      :tp-sl-enabled="tpSlEnabled"
      :tp-price-input="tpPriceInput"
      :sl-price-input="slPriceInput"
      :loading="loading"
      @update:position-side="store.setPositionSide"
      @update:form-type="store.setFormType"
      @update:price="onPrice"
      @update:quantity="onQty"
      @update:leverage="store.setLeverage"
      @update:margin-mode="store.setMarginMode"
      @update:tp-sl-enabled="setTpSlEnabled"
      @update:tp-price-input="onTp"
      @update:sl-price-input="onSl"
      @apply-percent="store.applyQtyPercent"
      @submit="store.placeOrder"
    >
      <template #delivery-lev-margin>
        <div class="dof__tcf-chrome">
          <DeliveryLeverageControl />
          <DeliveryMarginModeSwitcher />
        </div>
      </template>
    </TradingContractOrderForm>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.dof {
  display: flex;
  flex-direction: column;
  gap: $space-2;
  min-width: 0;
}

.dof__panel {
  padding: $space-2 $space-3;
  border-radius: $radius-md;
  border: 1px solid $color-border;
  background: var(--ex-surface-inset);
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.dof__head {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: $font-size-xs;
  color: $color-text-secondary;
  padding-top: 0;
}

.dof__head-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.dof__head-count {
  font-size: $font-size-xs;
  line-height: 1.5;
  color: $color-text-secondary;
}

.dof__head-next {
  font-size: $font-size-xs;
  line-height: 1.5;
  color: $color-text-secondary;
  margin-top: $space-2;
  padding-top: $space-2;
  border-top: 1px dashed var(--ex-border-subtle);
}

.dof__badge {
  font-size: 9px;
  font-weight: $font-weight-bold;
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--ex-fill-ghost);
  color: $color-text-tertiary;
}

.dof__badge--on {
  background: rgba(240, 185, 11, 0.15);
  color: $color-brand;
}

.dof__sym {
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.dof__sym-with-more {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
}

.dof__more {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 6px;
  margin: 0;
  border: none;
  border-radius: $radius-sm;
  background: transparent;
  color: $color-text-tertiary;
  cursor: pointer;

  &:hover {
    color: $color-brand;
    background: rgba(240, 185, 11, 0.08);
  }
}

.dof__more-icon {
  display: block;
}

.dof__cd {
  font-weight: $font-weight-semibold;
  color: $color-brand;
}

/* 插槽落在 tcf 内，由子组件 .tcf__del-chrome 左对齐排列杠杆与模式 */
.dof__tcf-chrome {
  display: contents;
}
</style>
