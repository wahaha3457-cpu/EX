<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    /** 0–1 归一化序列 */
    points: number[]
    /** 与卡片左侧色条语义一致，用于描边/填充渐变 */
    tone: 'balance' | 'deposit' | 'withdraw' | 'earn' | 'users'
  }>(),
  {},
)

const W = 100
const H = 32
const padY = 5

const linePath = computed(() => {
  const pts = props.points
  if (!pts.length) return ''
  const n = pts.length
  const step = W / Math.max(1, n - 1)
  const seg: string[] = []
  for (let i = 0; i < n; i++) {
    const x = i * step
    const yn = padY + (1 - pts[i]) * (H - padY * 2)
    seg.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${yn.toFixed(2)}`)
  }
  return seg.join(' ')
})

const areaPath = computed(() => {
  const line = linePath.value
  if (!line) return ''
  return `${line} L ${W} ${H} L 0 ${H} Z`
})

const gradId = computed(() => `adm-spark-grad-${props.tone}`)
const lineGradId = computed(() => `adm-spark-line-${props.tone}`)
</script>

<template>
  <svg
    class="adm-today-spark"
    :class="`adm-today-spark--${tone}`"
    :viewBox="`0 0 ${W} ${H}`"
    preserveAspectRatio="none"
    aria-hidden="true"
  >
    <defs>
      <linearGradient :id="gradId" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="var(--adm-spark-fill-hi)" stop-opacity="0.22" />
        <stop offset="100%" stop-color="var(--adm-spark-fill-lo)" stop-opacity="0" />
      </linearGradient>
      <linearGradient :id="lineGradId" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="var(--adm-spark-line-a)" stop-opacity="0.25" />
        <stop offset="50%" stop-color="var(--adm-spark-line-b)" stop-opacity="0.45" />
        <stop offset="100%" stop-color="var(--adm-spark-line-c)" stop-opacity="0.28" />
      </linearGradient>
    </defs>
    <path v-if="areaPath" :d="areaPath" class="adm-today-spark__area" :fill="`url(#${gradId})`" />
    <path
      v-if="linePath"
      :d="linePath"
      class="adm-today-spark__line"
      fill="none"
      :stroke="`url(#${lineGradId})`"
      vector-effect="non-scaling-stroke"
    />
  </svg>
</template>

<style scoped lang="scss">
.adm-today-spark {
  display: block;
  width: 100%;
  height: 44px;
  opacity: 0.48;
  transition: opacity 0.25s ease;
  pointer-events: none;
}

.adm-today-spark__area {
  stroke: none;
}

.adm-today-spark__line {
  stroke-width: 1.25px;
  stroke-dasharray: 3 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  filter: drop-shadow(0 0 4px color-mix(in srgb, var(--adm-spark-line-b) 35%, transparent));
}

.adm-today-spark--balance {
  --adm-spark-fill-hi: #f472b6;
  --adm-spark-fill-lo: #f472b6;
  --adm-spark-line-a: #fbcfe8;
  --adm-spark-line-b: #e879a9;
  --adm-spark-line-c: #a78bfa;
}

.adm-today-spark--deposit {
  --adm-spark-fill-hi: #60a5fa;
  --adm-spark-fill-lo: #3b82f6;
  --adm-spark-line-a: #93c5fd;
  --adm-spark-line-b: #38bdf8;
  --adm-spark-line-c: #818cf8;
}

.adm-today-spark--withdraw {
  --adm-spark-fill-hi: #a78bfa;
  --adm-spark-fill-lo: #7c3aed;
  --adm-spark-line-a: #c4b5fd;
  --adm-spark-line-b: #8b5cf6;
  --adm-spark-line-c: #6366f1;
}

.adm-today-spark--earn {
  --adm-spark-fill-hi: #2dd4bf;
  --adm-spark-fill-lo: #14b8a6;
  --adm-spark-line-a: #5eead4;
  --adm-spark-line-b: #2dd4bf;
  --adm-spark-line-c: #22d3ee;
}

.adm-today-spark--users {
  --adm-spark-fill-hi: #fbbf24;
  --adm-spark-fill-lo: #f59e0b;
  --adm-spark-line-a: #fde68a;
  --adm-spark-line-b: #fbbf24;
  --adm-spark-line-c: #fb923c;
}
</style>
