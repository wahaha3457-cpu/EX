<script setup lang="ts">
/**
 * 交割「截单前」提示 — 嵌入 ElMessageBox 的正文区。
 * 剩余秒数与 store 的 deliveryClock 同步；归零后切换为「新一轮一开始！」再自动淡出关闭。
 */
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { ElMessageBox } from 'element-plus'
import { useDeliveryTradeStore } from '@/stores/deliveryTrade'
import { secondsRemainingInCurrentOrderableRound } from '@/composables/delivery/deliveryCycleUtils'

const MSGBOX_ROOT_CLASS = 'ex-delivery-round-closing-box'
const NEW_ROUND_VISIBLE_MS = 2000
const FADE_OUT_MS = 480

const store = useDeliveryTradeStore()
const { deliveryClockMs, orderableSlotOffset } = storeToRefs(store)

const phase = ref<'warning' | 'started' | 'leaving'>('warning')
let startedTimer: ReturnType<typeof setTimeout> | null = null
let leaveTimer: ReturnType<typeof setTimeout> | null = null

const secondsLeft = computed(() =>
  secondsRemainingInCurrentOrderableRound(deliveryClockMs.value, orderableSlotOffset.value),
)

function clearTimers() {
  if (startedTimer != null) {
    clearTimeout(startedTimer)
    startedTimer = null
  }
  if (leaveTimer != null) {
    clearTimeout(leaveTimer)
    leaveTimer = null
  }
}

function scheduleNewRoundThenFade() {
  if (phase.value !== 'warning') return
  clearTimers()
  phase.value = 'started'

  startedTimer = window.setTimeout(() => {
    phase.value = 'leaving'
    void nextTick(() => {
      document.querySelector(`.${MSGBOX_ROOT_CLASS}`)?.classList.add(`${MSGBOX_ROOT_CLASS}--leave`)
    })
    leaveTimer = window.setTimeout(() => {
      ElMessageBox.close()
    }, FADE_OUT_MS)
  }, NEW_ROUND_VISIBLE_MS)
}

async function syncMsgBoxChrome() {
  await nextTick()
  const root = document.querySelector(`.${MSGBOX_ROOT_CLASS}`) as HTMLElement | null
  if (!root) return
  const hideChrome = phase.value !== 'warning'
  const headerBtn = root.querySelector('.el-message-box__headerbtn') as HTMLElement | null
  const btns = root.querySelector('.el-message-box__btns') as HTMLElement | null
  if (headerBtn) headerBtn.style.display = hideChrome ? 'none' : ''
  if (btns) btns.style.display = hideChrome ? 'none' : ''
}

watch(secondsLeft, (v, prev) => {
  if (phase.value !== 'warning') return
  if (prev !== undefined && prev > 0 && v <= 0) {
    scheduleNewRoundThenFade()
  }
})

watch(phase, () => {
  void syncMsgBoxChrome()
})

onMounted(() => {
  void syncMsgBoxChrome()
  if (phase.value === 'warning' && secondsLeft.value <= 0) {
    scheduleNewRoundThenFade()
  }
})

onUnmounted(() => {
  clearTimers()
  document.querySelector(`.${MSGBOX_ROOT_CLASS}`)?.classList.remove(`${MSGBOX_ROOT_CLASS}--leave`)
})
</script>

<template>
  <div class="drc-host">
    <Transition name="drc-swap" mode="out-in">
      <div v-if="phase === 'warning'" key="warn" class="drc" role="alert">
        <div class="drc__hero" aria-hidden="true">
          <span class="drc__ring" />
          <svg class="drc__ico" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M12 8v5l3 2M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              stroke="currentColor"
              stroke-width="1.75"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>

        <h3 class="drc__title">本轮即将结束</h3>

        <p class="drc__tagline">抱歉，本轮即将结束，请等待下一轮！</p>

        <div class="drc__panel">
          <p class="drc__panel-text">
            当前交割窗口已进入<strong>最后 10 秒</strong>，系统暂停接受新委托，以避免临近结算时的不公平成交。
          </p>
          <div v-if="secondsLeft >= 0" class="drc__chip">
            <span class="drc__chip-lab">本轮剩余</span>
            <span class="drc__chip-val">{{ Math.max(0, secondsLeft) }}<small>s</small></span>
          </div>
        </div>

        <p class="drc__foot">倒计时归零后将自动进入下一轮，届时即可继续下单。</p>
      </div>

      <div v-else key="next" class="drc drc--newround" role="status">
        <div class="drc__burst" aria-hidden="true" />
        <div class="drc__check-wrap" aria-hidden="true">
          <svg class="drc__check" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M7 12.5l3 3 7-7"
              stroke="currentColor"
              stroke-width="2.25"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>
        <p class="drc__newround-title">新一轮一开始！</p>
      </div>
    </Transition>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.drc-host {
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.drc-swap-enter-active,
.drc-swap-leave-active {
  transition:
    opacity 0.32s ease,
    transform 0.32s ease;
}

.drc-swap-enter-from,
.drc-swap-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.98);
}

.drc {
  text-align: center;
  padding: 4px 2px 2px;
  max-width: 340px;
  margin: 0 auto;
  width: 100%;
}

.drc__hero {
  position: relative;
  width: 56px;
  height: 56px;
  margin: 0 auto 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.drc__ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: conic-gradient(
    from 210deg,
    color-mix(in srgb, var(--ex-warning, #f0b90b) 55%, transparent),
    color-mix(in srgb, var(--ex-brand, #f0b90b) 28%, transparent),
    color-mix(in srgb, var(--ex-warning, #f0b90b) 55%, transparent)
  );
  opacity: 0.85;
  animation: drc-spin 8s linear infinite;
}

.drc__ring::after {
  content: '';
  position: absolute;
  inset: 3px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--ex-bg-elevated, #1e2329) 92%, transparent);
  box-shadow: inset 0 0 20px color-mix(in srgb, var(--ex-warning, #f0b90b) 12%, transparent);
}

@keyframes drc-spin {
  to {
    transform: rotate(360deg);
  }
}

.drc__ico {
  position: relative;
  z-index: 1;
  width: 26px;
  height: 26px;
  color: var(--ex-warning, #f0b90b);
  filter: drop-shadow(0 0 10px color-mix(in srgb, var(--ex-warning, #f0b90b) 35%, transparent));
}

.drc__title {
  margin: 0 0 $space-2;
  font-size: 17px;
  font-weight: 800;
  letter-spacing: 0.04em;
  background: linear-gradient(
    110deg,
    var(--ex-text-primary, #eaecef) 0%,
    color-mix(in srgb, var(--ex-warning, #f0b90b) 75%, var(--ex-text-primary, #eaecef)) 52%,
    var(--ex-text-primary, #eaecef) 100%
  );
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.drc__tagline {
  margin: 0 0 $space-3;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.55;
  color: var(--ex-text-secondary, #b7bdc6);
}

.drc__panel {
  text-align: left;
  padding: $space-3;
  border-radius: $radius-md;
  background: linear-gradient(
    145deg,
    color-mix(in srgb, var(--ex-warning, #f0b90b) 9%, transparent) 0%,
    color-mix(in srgb, var(--ex-bg-base, #0b0e11) 88%, transparent) 100%
  );
  border: 1px solid color-mix(in srgb, var(--ex-warning, #f0b90b) 28%, var(--ex-border, #2b3139));
  box-shadow:
    0 0 0 1px color-mix(in srgb, #fff 4%, transparent),
    0 12px 28px color-mix(in srgb, #000 35%, transparent);
}

.drc__panel-text {
  margin: 0;
  font-size: 12px;
  line-height: 1.65;
  color: var(--ex-text-secondary, #b7bdc6);

  strong {
    color: var(--ex-warning, #f0b90b);
    font-weight: 700;
  }
}

.drc__chip {
  margin-top: $space-3;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-2;
  padding: 8px 12px;
  border-radius: $radius-sm;
  background: color-mix(in srgb, var(--ex-bg-base, #0b0e11) 65%, transparent);
  border: 1px dashed color-mix(in srgb, var(--ex-warning, #f0b90b) 35%, transparent);
}

.drc__chip-lab {
  font-size: 11px;
  font-weight: 600;
  color: var(--ex-text-tertiary, #848e9c);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.drc__chip-val {
  font-family: $font-family-mono;
  font-size: 18px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  color: var(--ex-warning, #f0b90b);

  small {
    margin-left: 2px;
    font-size: 11px;
    font-weight: 700;
    opacity: 0.85;
  }
}

.drc__foot {
  margin: $space-3 0 0;
  font-size: 11px;
  line-height: 1.55;
  color: var(--ex-text-tertiary, #848e9c);
}

/* ----- 新一轮 ----- */
.drc--newround {
  position: relative;
  padding: $space-4 12px 28px;
}

.drc__burst {
  position: absolute;
  inset: -30% -20% auto;
  height: 140px;
  border-radius: 50%;
  background: radial-gradient(
    closest-side,
    color-mix(in srgb, var(--ex-success, #0ecb81) 22%, transparent),
    transparent 72%
  );
  pointer-events: none;
  animation: drc-burst-pulse 1.8s ease-in-out infinite;
}

@keyframes drc-burst-pulse {
  0%,
  100% {
    opacity: 0.55;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.04);
  }
}

.drc__check-wrap {
  position: relative;
  z-index: 1;
  width: 56px;
  height: 56px;
  margin: 0 auto 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--ex-success, #0ecb81) 14%, transparent);
  border: 2px solid color-mix(in srgb, var(--ex-success, #0ecb81) 45%, transparent);
  box-shadow: 0 0 28px color-mix(in srgb, var(--ex-success, #0ecb81) 25%, transparent);
}

.drc__check {
  width: 28px;
  height: 28px;
  color: var(--ex-success, #0ecb81);
}

.drc__newround-title {
  position: relative;
  z-index: 1;
  margin: 0;
  font-size: 20px;
  font-weight: 900;
  letter-spacing: 0.12em;
  color: var(--ex-text-primary, #eaecef);
}

</style>

<style lang="scss">
/* MessageBox 挂 body：与交割截单提示成对出现 */
.ex-delivery-round-closing-box {
  width: 400px !important;
  max-width: calc(100vw - 36px) !important;
  padding: 0 6px 14px !important;
  border-radius: 14px !important;
  overflow: hidden;
  background: color-mix(in srgb, var(--ex-bg-elevated, #1e2329) 96%, #000) !important;
  border: 1px solid color-mix(in srgb, var(--ex-warning, #f0b90b) 22%, var(--el-border-color-lighter)) !important;
  box-shadow:
    0 20px 48px color-mix(in srgb, #000 55%, transparent),
    0 0 80px color-mix(in srgb, var(--ex-warning, #f0b90b) 8%, transparent);
  transition:
    opacity 0.48s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.48s cubic-bezier(0.4, 0, 0.2, 1),
    filter 0.48s ease,
    box-shadow 0.48s ease;
  will-change: opacity, transform;
}

.ex-delivery-round-closing-box--leave {
  opacity: 0 !important;
  transform: translateY(14px) scale(0.96) !important;
  filter: blur(3px) !important;
  box-shadow: none !important;
  pointer-events: none !important;
}

.ex-delivery-round-closing-box .el-message-box__header {
  padding: 10px 8px 0;
}

.ex-delivery-round-closing-box .el-message-box__title {
  display: none;
}

.ex-delivery-round-closing-box .el-message-box__headerbtn {
  top: 12px;
  right: 10px;
}

.ex-delivery-round-closing-box .el-message-box__status {
  display: none !important;
}

.ex-delivery-round-closing-box .el-message-box__content {
  padding: 6px 18px 10px;
}

.ex-delivery-round-closing-box .el-message-box__message {
  margin: 0 !important;
  padding: 0 !important;
}

.ex-delivery-round-closing-box .el-message-box__btns {
  padding: 4px 18px 10px;
}

.ex-delivery-round-closing-box .el-button--primary {
  min-width: 120px;
  border-radius: 8px;
  font-weight: 700;
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--ex-warning, #f0b90b) 92%, #fff) 0%,
    color-mix(in srgb, var(--ex-warning, #f0b90b) 75%, #c9a227) 100%
  ) !important;
  border: none !important;
  color: #1a1a1a !important;
}

.ex-delivery-round-closing-box .el-button--primary:hover {
  filter: brightness(1.06);
}
</style>
