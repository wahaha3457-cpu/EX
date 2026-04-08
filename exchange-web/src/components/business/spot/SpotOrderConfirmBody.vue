<script setup lang="ts">
/**
 * 嵌入 ElMessageBox 的下单确认正文（现货 / 永续 / 交割共用：交易对、方向、类型、明细行）。
 * 标题右侧可选环形确认倒计时（confirmCountdownSec&gt;0 时）；交割下单确认传 0 关闭该动画。
 * 交割合约：`deliveryConfirmLive` 时明细行「本期倒计时 / 交易对展示码」与 deliveryTrade store 实时同步下单区。
 */
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { ElMessageBox } from 'element-plus'
import type { SpotOrderConfirmRow, SpotOrderConfirmSummary } from '@/composables/spot/spotOrderConfirmSummary'
import { useDeliveryTradeStore } from '@/stores/deliveryTrade'
import {
  currentUtcMinuteStartMs,
  formatDeliveryCountdownHms,
  secondsUntilUtcSlotEnd,
} from '@/composables/delivery/deliveryCycleUtils'
import { DELIVERY_DEMO_STAGGER_MS, buildDeliveryDisplaySymbol } from '@/api/delivery/deliverySymbols'

const props = withDefaults(
  defineProps<{
    summary: SpotOrderConfirmSummary
    /** ≤0：不展示倒计时、不自动关闭 */
    confirmCountdownSec?: number
  }>(),
  { confirmCountdownSec: 5 },
)

const CD_R = 17
const cdLen = 2 * Math.PI * CD_R

const leftSec = ref(Math.max(0, props.confirmCountdownSec))
let tick: ReturnType<typeof setInterval> | null = null

const cdOffset = computed(() => {
  const total = props.confirmCountdownSec
  if (total <= 0) return cdLen
  const ratio = Math.max(0, Math.min(1, leftSec.value / total))
  return cdLen * (1 - ratio)
})

const deliveryLiveOn = computed(() => props.summary.deliveryConfirmLive === true)

/** 交割确认用明细行「本期倒计时」，禁止标题右侧环形倒计时（避免 MessageBox 渲染时丢失 confirmCountdownSec=0 仍落回默认 5 秒） */
const showCountdown = computed(
  () => props.confirmCountdownSec > 0 && !deliveryLiveOn.value,
)
const deliveryStore = useDeliveryTradeStore()
const { symbol, orderableSlotOffset, deliveryClockMs } = storeToRefs(deliveryStore)

const deliveryPairCode = computed(() => {
  if (!deliveryLiveOn.value) return ''
  const now = deliveryClockMs.value
  const t = currentUtcMinuteStartMs(now) + orderableSlotOffset.value * DELIVERY_DEMO_STAGGER_MS
  return buildDeliveryDisplaySymbol(symbol.value, new Date(t).toISOString())
})

const deliverySlotCountdownHms = computed(() => {
  if (!deliveryLiveOn.value) return '—'
  const now = deliveryClockMs.value
  const slotStart =
    currentUtcMinuteStartMs(now) + orderableSlotOffset.value * DELIVERY_DEMO_STAGGER_MS
  return formatDeliveryCountdownHms(secondsUntilUtcSlotEnd(now, slotStart))
})

const headerPairDisplay = computed(() =>
  deliveryLiveOn.value ? deliveryPairCode.value : props.summary.pairDisplay,
)

function rowDisplayValue(row: SpotOrderConfirmRow): string {
  if (row.deliveryLive === 'slot_countdown') return deliverySlotCountdownHms.value
  if (row.deliveryLive === 'pair_code') return deliveryPairCode.value
  return row.value
}

onMounted(() => {
  if (props.confirmCountdownSec <= 0 || deliveryLiveOn.value) return
  leftSec.value = props.confirmCountdownSec
  tick = window.setInterval(() => {
    leftSec.value -= 1
    if (leftSec.value <= 0) {
      if (tick != null) {
        window.clearInterval(tick)
        tick = null
      }
      ElMessageBox.close()
    }
  }, 1000)
})

onUnmounted(() => {
  if (tick != null) {
    window.clearInterval(tick)
    tick = null
  }
})
</script>

<template>
  <div class="socc">
    <header class="socc__head">
      <div class="socc__head-row">
        <div class="socc__head-main">
          <span class="socc__pair ex-num">{{ headerPairDisplay }}</span>
          <p class="socc__lead">请核对以下委托参数，确认无误后提交。</p>
        </div>
        <div
          v-if="showCountdown"
          class="socc__cd"
          role="timer"
          :aria-label="`确认剩余 ${Math.max(0, leftSec)} 秒，超时将关闭`"
        >
          <div class="socc__cd-visual">
            <svg class="socc__cd-svg" viewBox="0 0 40 40" aria-hidden="true">
              <circle class="socc__cd-track" cx="20" cy="20" :r="CD_R" />
              <circle
                class="socc__cd-arc"
                cx="20"
                cy="20"
                :r="CD_R"
                :stroke-dasharray="cdLen"
                :stroke-dashoffset="cdOffset"
                transform="rotate(-90 20 20)"
              />
            </svg>
            <span class="socc__cd-num ex-num" aria-live="polite">{{ Math.max(0, leftSec) }}</span>
          </div>
          <span class="socc__cd-hint">秒</span>
        </div>
      </div>
    </header>

    <ul class="socc__rows" aria-label="委托明细">
      <li v-for="(row, i) in summary.rows" :key="i" class="socc__row">
        <span class="socc__k">{{ row.label }}</span>
        <div class="socc__v-block">
          <span class="socc__v ex-num">{{ rowDisplayValue(row) }}</span>
          <span v-if="row.sub" class="socc__sub">{{ row.sub }}</span>
        </div>
      </li>
    </ul>

    <p class="socc__warn">
      网络与流动性可能导致实际成交价、成交量及手续费与预估不一致；极端行情下委托可能部分成交或暂不成交。
    </p>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.socc {
  width: 100%;
  box-sizing: border-box;
  text-align: left;
  color: var(--ex-text-primary, #{$color-text-primary});
}

.socc__head {
  margin-bottom: $space-3;
  padding-bottom: $space-3;
  border-bottom: 1px solid var(--ex-border-subtle, #{$color-border});
}

.socc__head-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: $space-3;
}

.socc__head-main {
  flex: 1;
  min-width: 0;
}

.socc__pair {
  display: block;
  font-size: $font-size-md;
  font-weight: $font-weight-bold;
  letter-spacing: 0.02em;
}

.socc__lead {
  margin: $space-2 0 0;
  font-size: $font-size-xs;
  line-height: 1.45;
  color: var(--ex-text-tertiary, #{$color-text-tertiary});
}

.socc__cd {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding-top: 2px;
}

.socc__cd-visual {
  position: relative;
  width: 44px;
  height: 44px;
}

.socc__cd-svg {
  display: block;
  width: 100%;
  height: 100%;
}

.socc__cd-track {
  fill: none;
  stroke: color-mix(in srgb, var(--ex-warning, #f0b90b) 16%, transparent);
  stroke-width: 2.75;
}

.socc__cd-arc {
  fill: none;
  stroke: var(--ex-warning, #f0b90b);
  stroke-width: 2.75;
  stroke-linecap: round;
  transition: stroke-dashoffset 0.45s cubic-bezier(0.33, 1, 0.68, 1);
}

.socc__cd-num {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: $font-weight-bold;
  color: var(--ex-warning, #f0b90b);
  animation: socc-cd-pulse 1s ease-in-out infinite;
}

.socc__cd-hint {
  font-size: 9px;
  font-weight: $font-weight-semibold;
  color: var(--ex-text-tertiary, #{$color-text-tertiary});
  letter-spacing: 0.06em;
}

@keyframes socc-cd-pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.06);
    opacity: 0.92;
  }
}

@media (prefers-reduced-motion: reduce) {
  .socc__cd-arc {
    transition: none;
  }

  .socc__cd-num {
    animation: none;
  }
}

.socc__rows {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.socc__row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: $space-3;
  font-size: $font-size-xs;
}

.socc__k {
  flex-shrink: 0;
  color: var(--ex-text-tertiary, #{$color-text-tertiary});
  min-width: 5.5em;
}

.socc__v-block {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 3px;
  min-width: 0;
  text-align: right;
}

.socc__v {
  font-weight: $font-weight-semibold;
  color: var(--ex-text-primary, #{$color-text-primary});
  word-break: break-all;
}

.socc__sub {
  font-size: 10px;
  line-height: 1.4;
  color: var(--ex-text-tertiary, #{$color-text-tertiary});
  max-width: 260px;
}

.socc__warn {
  margin: $space-3 0 0;
  padding: $space-2 $space-3;
  border-radius: $radius-sm;
  font-size: 10px;
  line-height: 1.5;
  color: var(--ex-warning, #f0b90b);
  background: var(--ex-warning-bg, rgba(240, 185, 11, 0.08));
  border: 1px solid color-mix(in srgb, var(--ex-warning, #f0b90b) 22%, transparent);
}

.ex-num {
  font-family: $font-family-mono;
  font-variant-numeric: tabular-nums;
}
</style>

<style lang="scss">
/* MessageBox 挂到 body：现货 / 永续 / 交割下单确认共用 */
.ex-trade-order-confirm-msgbox,
.ex-spot-order-confirm-msgbox {
  width: 440px !important;
  max-width: calc(100vw - 28px) !important;
  padding: 0 4px 12px !important;
  border-radius: 12px !important;
  background: var(--ex-spot-order-surface, var(--el-bg-color)) !important;
  border: 1px solid var(--el-border-color-lighter);
  box-shadow:
    0 12px 40px rgba(0, 0, 0, 0.45),
    0 0 0 1px rgba(255, 255, 255, 0.04);
}

.ex-trade-order-confirm-msgbox .el-message-box__header,
.ex-spot-order-confirm-msgbox .el-message-box__header {
  padding: 18px 20px 8px;
}

.ex-trade-order-confirm-msgbox .el-message-box__title,
.ex-spot-order-confirm-msgbox .el-message-box__title {
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.ex-trade-order-confirm-msgbox .el-message-box__headerbtn,
.ex-spot-order-confirm-msgbox .el-message-box__headerbtn {
  top: 14px;
  right: 12px;
}

.ex-trade-order-confirm-msgbox .el-message-box__container,
.ex-spot-order-confirm-msgbox .el-message-box__container {
  position: relative;
}

/* 避免 status 图标在内容区垂直居中后与首行交易对重叠 */
.ex-trade-order-confirm-msgbox .el-message-box__status,
.ex-spot-order-confirm-msgbox .el-message-box__status {
  top: 6px;
  transform: none !important;
  font-size: 22px !important;
}

.ex-trade-order-confirm-msgbox .el-message-box__content,
.ex-spot-order-confirm-msgbox .el-message-box__content {
  padding: 4px 20px 8px;
}

.ex-trade-order-confirm-msgbox .el-message-box__message,
.ex-spot-order-confirm-msgbox .el-message-box__message {
  margin: 0 !important;
  padding-left: 36px !important;
  padding-top: 2px !important;
}

.ex-trade-order-confirm-msgbox .el-message-box__btns,
.ex-spot-order-confirm-msgbox .el-message-box__btns {
  padding: 12px 20px 4px;
  gap: 10px;
}

.ex-trade-order-confirm-msgbox .el-message-box__btns .el-button,
.ex-spot-order-confirm-msgbox .el-message-box__btns .el-button {
  min-width: 108px;
  border-radius: 8px;
  font-weight: 600;
}

/* 与全站主按钮主题一致（--ex-brand / tokens），买卖确认均用主题色，不再用涨跌绿 */
.ex-trade-order-confirm-msgbox .el-button--primary,
.ex-spot-order-confirm-msgbox .el-button--primary {
  --el-button-bg-color: var(--ex-btn-primary-bg, var(--el-color-primary));
  --el-button-border-color: var(--ex-btn-primary-bg, var(--el-color-primary));
  --el-button-hover-bg-color: var(--ex-btn-primary-hover-bg, var(--el-color-primary-dark-2));
  --el-button-hover-border-color: var(--ex-btn-primary-hover-bg, var(--el-color-primary-dark-2));
  --el-button-active-bg-color: var(--ex-btn-primary-active-bg, var(--el-color-primary-dark-2));
  --el-button-active-border-color: var(--ex-btn-primary-active-bg, var(--el-color-primary-dark-2));
  color: var(--ex-btn-primary-text, var(--el-color-white)) !important;
}

.ex-trade-order-confirm-msgbox .el-button--primary:focus-visible,
.ex-spot-order-confirm-msgbox .el-button--primary:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--ex-btn-primary-bg, var(--el-color-primary)) 55%, transparent);
  outline-offset: 1px;
}
</style>
