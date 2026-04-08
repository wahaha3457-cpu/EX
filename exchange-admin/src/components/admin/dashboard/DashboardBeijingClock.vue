<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'

/** 同步显示北京时间（Asia/Shanghai） */
const now = ref(new Date())
let timer: number | undefined
const tick = ref(0)

const formatterDate = new Intl.DateTimeFormat('zh-CN', {
  timeZone: 'Asia/Shanghai',
  weekday: 'short',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

const timeInShanghai = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Shanghai',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
})

const dateStr = computed(() => formatterDate.format(now.value))

const timeParts = computed(() => {
  const parts = timeInShanghai.formatToParts(now.value)
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '00'
  return {
    h: get('hour').padStart(2, '0'),
    m: get('minute').padStart(2, '0'),
    s: get('second').padStart(2, '0'),
  }
})

const colonBright = computed(() => tick.value % 2 === 0)

function pulse() {
  now.value = new Date()
  tick.value += 1
}

onMounted(() => {
  pulse()
  timer = window.setInterval(pulse, 1000)
})

onUnmounted(() => {
  if (timer != null) window.clearInterval(timer)
})
</script>

<template>
  <div class="adm-bj-clock" aria-live="polite">
    <div class="adm-bj-clock__bg" aria-hidden="true">
      <div class="adm-bj-clock__glow" />
      <div class="adm-bj-clock__mesh" />
    </div>
    <div class="adm-bj-clock__inner">
      <div class="adm-bj-clock__label-row">
        <span class="adm-bj-clock__dot" />
        <span class="adm-bj-clock__label">北京时间</span>
        <span class="adm-bj-clock__tz">UTC+8 · Asia/Shanghai</span>
      </div>
      <div class="adm-bj-clock__date">{{ dateStr }}</div>
      <div class="adm-bj-clock__time">
        <span class="adm-bj-clock__seg">{{ timeParts.h }}</span>
        <span class="adm-bj-clock__colon" :class="{ 'adm-bj-clock__colon--dim': !colonBright }">:</span>
        <span class="adm-bj-clock__seg">{{ timeParts.m }}</span>
        <span class="adm-bj-clock__colon" :class="{ 'adm-bj-clock__colon--dim': !colonBright }">:</span>
        <span class="adm-bj-clock__seg adm-bj-clock__seg--sec">{{ timeParts.s }}</span>
      </div>
      <div class="adm-bj-clock__wave" aria-hidden="true">
        <span v-for="i in 12" :key="i" class="adm-bj-clock__bar" :style="{ animationDelay: `${i * 0.06}s` }" />
      </div>
      <p class="adm-bj-clock__hint">NTP 同步接入后可显示校时状态</p>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/admin/tokens' as *;

.adm-bj-clock {
  position: relative;
  width: 100%;
  min-height: 118px;
  padding: 12px 14px 10px;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, #22d3ee 32%, rgba(255, 255, 255, 0.1));
  background: linear-gradient(
    155deg,
    rgba(15, 23, 42, 0.75) 0%,
    rgba(22, 28, 42, 0.85) 50%,
    rgba(12, 20, 36, 0.9) 100%
  );
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.06) inset,
    0 12px 36px rgba(0, 0, 0, 0.35),
    0 0 40px color-mix(in srgb, #06b6d4 14%, transparent);
  backdrop-filter: blur(12px);
}

.adm-bj-clock__bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.adm-bj-clock__glow {
  position: absolute;
  inset: -20% -10% auto 40%;
  height: 90%;
  background: radial-gradient(
    ellipse 70% 60% at 80% 20%,
    color-mix(in srgb, #22d3ee 28%, transparent),
    transparent 62%
  );
  opacity: 0.85;
}

.adm-bj-clock__mesh {
  position: absolute;
  inset: 0;
  opacity: 0.07;
  background-image:
    linear-gradient(90deg, rgba(34, 211, 238, 0.35) 1px, transparent 1px),
    linear-gradient(rgba(34, 211, 238, 0.2) 1px, transparent 1px);
  background-size: 14px 14px;
}

.adm-bj-clock__inner {
  position: relative;
  z-index: 1;
}

.adm-bj-clock__label-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  flex-wrap: wrap;
}

.adm-bj-clock__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #22d3ee;
  box-shadow: 0 0 12px #22d3ee;
  animation: adm-bj-dot 2s ease-in-out infinite;
}

@keyframes adm-bj-dot {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.75;
    transform: scale(1.15);
  }
}

.adm-bj-clock__label {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: color-mix(in srgb, #a5f3fc 90%, #fff);
}

.adm-bj-clock__tz {
  margin-left: auto;
  font-size: 10px;
  font-weight: 600;
  color: $adm-text-muted;
  font-family: ui-monospace, monospace;
}

.adm-bj-clock__date {
  font-size: 12px;
  font-weight: 600;
  color: color-mix(in srgb, $adm-text-muted 95%, #a5f3fc);
  margin-bottom: 4px;
}

.adm-bj-clock__time {
  display: flex;
  align-items: baseline;
  gap: 2px;
  font-family: 'SF Mono', ui-monospace, Menlo, Monaco, Consolas, monospace;
  font-weight: 700;
  font-size: clamp(26px, 4vw, 32px);
  letter-spacing: 0.04em;
  line-height: 1.1;
  color: #f8fafc;
  text-shadow:
    0 0 24px color-mix(in srgb, #22d3ee 35%, transparent),
    0 0 48px color-mix(in srgb, #7c3aed 15%, transparent);
}

.adm-bj-clock__seg {
  font-variant-numeric: tabular-nums;
}

.adm-bj-clock__seg--sec {
  color: color-mix(in srgb, #a5f3fc 85%, #fff);
}

.adm-bj-clock__colon {
  opacity: 1;
  transition: opacity 0.15s ease;
  padding: 0 1px;
  color: color-mix(in srgb, #22d3ee 75%, #fff);
}

.adm-bj-clock__colon--dim {
  opacity: 0.35;
}

.adm-bj-clock__wave {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 3px;
  height: 22px;
  margin-top: 10px;
  padding-top: 4px;
  border-top: 1px solid color-mix(in srgb, #22d3ee 18%, transparent);
}

.adm-bj-clock__bar {
  flex: 1;
  min-width: 3px;
  border-radius: 999px;
  background: linear-gradient(180deg, #22d3ee, #7c3aed);
  opacity: 0.45;
  animation: adm-bj-bar 1.2s ease-in-out infinite;
}

@keyframes adm-bj-bar {
  0%,
  100% {
    height: 22%;
    opacity: 0.35;
  }
  50% {
    height: 100%;
    opacity: 0.95;
  }
}

.adm-bj-clock__hint {
  margin: 8px 0 0;
  font-size: 10px;
  color: $adm-text-muted;
  opacity: 0.85;
}
</style>
