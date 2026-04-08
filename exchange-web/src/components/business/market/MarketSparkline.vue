<script setup lang="ts">
import { computed } from 'vue'
import {
  buildSparkPoints,
  hashStringFnv1a,
  pointsToAreaPath,
  pointsToSmoothPath,
  sparkToneFromChangePct,
} from '@/utils/chart/sparkline'

const props = defineProps<{
  changePct: number
  /** 用于渐变 id 与轨迹种子，需表格行内唯一 */
  sparkId: string
}>()

const WB = 72
const HB = 28

const tone = computed(() => sparkToneFromChangePct(props.changePct))

const gradBase = computed(() =>
  props.sparkId.replace(/[^a-zA-Z0-9_-]/g, '_'),
)

const paths = computed(() => {
  const seed = hashStringFnv1a(props.sparkId)
  const pts = buildSparkPoints({
    width: WB,
    height: HB,
    changePct: props.changePct,
    seed,
    count: 28,
    padY: 5,
  })
  return {
    line: pointsToSmoothPath(pts),
    area: pointsToAreaPath(pts, HB + 0.5),
  }
})
</script>

<template>
  <svg
    class="mspark"
    :class="`mspark--${tone}`"
    :viewBox="`0 0 ${WB} ${HB}`"
    aria-hidden="true"
  >
    <defs>
      <linearGradient
        :id="`mspark-area-${gradBase}`"
        x1="0"
        y1="0"
        x2="0"
        y2="1"
        gradientUnits="objectBoundingBox"
      >
        <stop offset="0%" class="mspark__stop--area-hi" />
        <stop offset="55%" class="mspark__stop--area-mid" />
        <stop offset="100%" class="mspark__stop--area-lo" />
      </linearGradient>
      <linearGradient
        :id="`mspark-line-${gradBase}`"
        x1="0"
        y1="0"
        x2="1"
        y2="0.25"
        gradientUnits="objectBoundingBox"
      >
        <stop offset="0%" class="mspark__stop--line-a" />
        <stop offset="45%" class="mspark__stop--line-b" />
        <stop offset="100%" class="mspark__stop--line-c" />
      </linearGradient>
    </defs>
    <path :d="paths.area" class="mspark__area" :fill="`url(#mspark-area-${gradBase})`" />
    <path
      :d="paths.line"
      fill="none"
      class="mspark__line"
      :stroke="`url(#mspark-line-${gradBase})`"
      stroke-width="1.35"
      stroke-linecap="round"
      stroke-linejoin="round"
      vector-effect="non-scaling-stroke"
    />
  </svg>
</template>

<style scoped lang="scss">
.mspark {
  width: 56px;
  height: 22px;
  flex-shrink: 0;
  display: block;
  overflow: visible;
}

/* 涨跌平三色：面积与描边渐变引用主题色 */
.mspark--up {
  filter: drop-shadow(0 1px 5px color-mix(in srgb, var(--ex-rise) 18%, transparent));
}

.mspark--down {
  filter: drop-shadow(0 1px 5px color-mix(in srgb, var(--ex-fall) 18%, transparent));
}

.mspark--flat {
  filter: drop-shadow(0 1px 3px rgba(132, 142, 156, 0.12));
}

.mspark__stop--area-hi {
  stop-color: var(--ex-rise);
  stop-opacity: 0.32;
}

.mspark__stop--area-mid {
  stop-color: var(--ex-rise);
  stop-opacity: 0.08;
}

.mspark__stop--area-lo {
  stop-color: var(--ex-rise);
  stop-opacity: 0;
}

.mspark--down .mspark__stop--area-hi,
.mspark--down .mspark__stop--area-mid,
.mspark--down .mspark__stop--area-lo {
  stop-color: var(--ex-fall);
}

.mspark--flat .mspark__stop--area-hi {
  stop-color: var(--ex-text-tertiary);
  stop-opacity: 0.22;
}

.mspark--flat .mspark__stop--area-mid {
  stop-color: var(--ex-text-tertiary);
  stop-opacity: 0.06;
}

.mspark--flat .mspark__stop--area-lo {
  stop-color: var(--ex-text-tertiary);
  stop-opacity: 0;
}

.mspark__stop--line-a {
  stop-color: var(--ex-rise);
  stop-opacity: 0.45;
}

.mspark__stop--line-b {
  stop-color: var(--ex-rise);
  stop-opacity: 1;
}

.mspark__stop--line-c {
  stop-color: var(--ex-rise);
  stop-opacity: 0.78;
}

.mspark--down .mspark__stop--line-a,
.mspark--down .mspark__stop--line-b,
.mspark--down .mspark__stop--line-c {
  stop-color: var(--ex-fall);
}

.mspark--flat .mspark__stop--line-a,
.mspark--flat .mspark__stop--line-b,
.mspark--flat .mspark__stop--line-c {
  stop-color: var(--ex-text-tertiary);
}

.mspark__area {
  pointer-events: none;
}

.mspark__line {
  pointer-events: none;
}
</style>
