<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { RouteNames } from '@/constants/routeNames'
import type { MarketTickerRow } from '@/types/market'
import { formatCompact, formatPct, formatPrice } from '@/utils/format/number'
import {
  buildSparkPoints,
  hashStringFnv1a,
  pointsToAreaPath,
  pointsToSmoothPath,
  sparkToneFromChangePct,
} from '@/utils/chart/sparkline'

const props = defineProps<{
  tickers: MarketTickerRow[]
}>()

const WB = 120
const HB = 36

/** 现货 USDT 按 24h 成交额取前 6，与榜单同源逻辑 */
const topSix = computed(() => {
  const spot = props.tickers.filter((r) => r.kind === 'SPOT' && r.quoteAsset === 'USDT')
  return [...spot].sort((a, b) => b.quoteVolume - a.quoteVolume).slice(0, 6)
})

function sparkGradBase(row: MarketTickerRow) {
  return row.id.replace(/[^a-zA-Z0-9_-]/g, '_')
}

function sparkLinePath(row: MarketTickerRow) {
  const seed = hashStringFnv1a(row.routeSymbol)
  const pts = buildSparkPoints({
    width: WB,
    height: HB,
    changePct: row.changePct,
    seed,
    count: 36,
    padY: 5,
  })
  return pointsToSmoothPath(pts)
}

function sparkAreaPath(row: MarketTickerRow) {
  const seed = hashStringFnv1a(row.routeSymbol)
  const pts = buildSparkPoints({
    width: WB,
    height: HB,
    changePct: row.changePct,
    seed,
    count: 36,
    padY: 5,
  })
  return pointsToAreaPath(pts, HB + 0.5)
}

function chgClass(pct: number) {
  if (pct > 0.02) return 'mts__chg--up'
  if (pct < -0.02) return 'mts__chg--down'
  return 'mts__chg--flat'
}

function sparkToneClass(row: MarketTickerRow) {
  return `mts__spark--${sparkToneFromChangePct(row.changePct)}`
}
</script>

<template>
  <section v-if="topSix.length" class="mts" aria-label="主流币成交额 Top 6">
    <div v-for="row in topSix" :key="row.id" class="mts__slot">
      <RouterLink
        :to="{ name: RouteNames.SpotTrade, params: { symbol: row.routeSymbol } }"
        class="mts__item"
      >
        <div class="mts__head">
          <span class="mts__pair">{{ row.baseAsset }}/{{ row.quoteAsset }}</span>
          <span class="mts__chg ex-num" :class="chgClass(row.changePct)">
            {{ formatPct(row.changePct) }}
          </span>
        </div>
        <div class="mts__price-row">
          <span class="mts__price ex-num">{{ formatPrice(row.lastPrice) }}</span>
        </div>
        <p class="mts__vol">
          24h 额
          <span class="mts__vol-num ex-num">{{ formatCompact(row.quoteVolume) }}</span>
          {{ row.quoteAsset }}
        </p>
        <div class="mts__spark-wrap">
          <svg
            class="mts__spark"
            :class="sparkToneClass(row)"
            :viewBox="`0 0 ${WB} ${HB}`"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              <linearGradient
                :id="`mts-area-${sparkGradBase(row)}`"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
                gradientUnits="objectBoundingBox"
              >
                <stop offset="0%" class="mts__sg mts__sg--area-hi" />
                <stop offset="50%" class="mts__sg mts__sg--area-mid" />
                <stop offset="100%" class="mts__sg mts__sg--area-lo" />
              </linearGradient>
              <linearGradient
                :id="`mts-line-${sparkGradBase(row)}`"
                x1="0"
                y1="0"
                x2="1"
                y2="0.2"
                gradientUnits="objectBoundingBox"
              >
                <stop offset="0%" class="mts__sg mts__sg--line-a" />
                <stop offset="40%" class="mts__sg mts__sg--line-b" />
                <stop offset="100%" class="mts__sg mts__sg--line-c" />
              </linearGradient>
            </defs>
            <path
              :d="sparkAreaPath(row)"
              class="mts__spark-area"
              :fill="`url(#mts-area-${sparkGradBase(row)})`"
            />
            <path
              :d="sparkLinePath(row)"
              fill="none"
              class="mts__spark-line"
              :stroke="`url(#mts-line-${sparkGradBase(row)})`"
              stroke-width="1.22"
              stroke-linecap="round"
              stroke-linejoin="round"
              vector-effect="non-scaling-stroke"
            />
          </svg>
        </div>
      </RouterLink>
      <!-- 渐变光带：仅一段描边可见，沿圆角矩形路径顺时针移动（整框不旋转） -->
      <svg
        class="mts__orbit"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient
            :id="`mts-orbit-grad-${sparkGradBase(row)}`"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
            gradientUnits="objectBoundingBox"
          >
            <stop offset="0%" stop-color="#3d2e12" stop-opacity="0.15" />
            <stop offset="30%" stop-color="#fff8e4" stop-opacity="1" />
            <stop offset="50%" stop-color="#ffe28a" stop-opacity="1" />
            <stop offset="72%" stop-color="#d4af37" stop-opacity="1" />
            <stop offset="100%" stop-color="#5c4514" stop-opacity="0.2" />
          </linearGradient>
          <filter
            :id="`mts-orbit-glow-${sparkGradBase(row)}`"
            x="-40%"
            y="-40%"
            width="180%"
            height="180%"
            color-interpolation-filters="sRGB"
          >
            <feGaussianBlur in="SourceGraphic" stdDeviation="0.85" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <rect
          class="mts__orbit-rect"
          x="1.15"
          y="1.15"
          width="97.7"
          height="97.7"
          rx="8.75"
          ry="8.75"
          fill="none"
          :stroke="`url(#mts-orbit-grad-${sparkGradBase(row)})`"
          stroke-width="2.35"
          stroke-linecap="round"
          stroke-linejoin="round"
          pathLength="100"
          vector-effect="non-scaling-stroke"
          :filter="`url(#mts-orbit-glow-${sparkGradBase(row)})`"
        />
      </svg>
    </div>
  </section>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;
@use '@/styles/mixins' as mq;

/* Top6：独立圆角线框 + 等间距栅格；悬停微放大 + 渐变光沿矩形描边顺时针行进 */
.mts {
  --mts-gap: 12px;
  --mts-radius: 10px;
  /* pathLength=100 下的占比：亮段 + 空隙，亮段即「渐变光」长度 */
  --mts-orbit-dash: 26;
  --mts-orbit-gap: 74;

  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: var(--mts-gap);
  width: 100%;
  min-width: 0;
  margin: 0;
  padding: 6px 0 $space-2;
  border-bottom: 1px solid var(--ex-border-subtle);
  background: transparent;
  overflow: visible;
}

@include mq.media-down(xl) {
  .mts {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@include mq.media-down(sm) {
  .mts {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    --mts-gap: 10px;
  }
}

.mts__slot {
  position: relative;
  min-width: 0;
  border-radius: var(--mts-radius);
  isolation: isolate;
  transition:
    transform 0.32s cubic-bezier(0.34, 1.35, 0.64, 1),
    z-index 0s linear 0s;
}

.mts__slot:hover,
.mts__slot:focus-within {
  z-index: 2;
  transform: scale(1.045);
  transition:
    transform 0.32s cubic-bezier(0.34, 1.35, 0.64, 1),
    z-index 0s linear 0s;
}

.mts__orbit {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
  pointer-events: none;
  overflow: visible;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.mts__slot:hover .mts__orbit,
.mts__slot:focus-within .mts__orbit {
  opacity: 1;
}

/* pathLength=100：负向 stroke-dashoffset 让可见亮段沿圆角矩形轨迹顺时针爬行 */
.mts__orbit-rect {
  stroke-dasharray: var(--mts-orbit-dash) var(--mts-orbit-gap);
  stroke-dashoffset: 0;
}

.mts__slot:hover .mts__orbit-rect,
.mts__slot:focus-within .mts__orbit-rect {
  animation: mts-orbit-crawl 2.35s linear infinite;
}

@keyframes mts-orbit-crawl {
  to {
    stroke-dashoffset: -100;
  }
}

.mts__item {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  min-height: 100%;
  padding: $space-3 $space-3 $space-2;
  border-radius: calc(var(--mts-radius) - 0.5px);
  border: 1px solid var(--ex-border-subtle);
  background: var(--ex-bg-base);
  text-decoration: none;
  color: inherit;
  transition:
    background 0.15s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.mts__slot:hover .mts__item,
.mts__slot:focus-within .mts__item {
  background: color-mix(in srgb, var(--ex-text-primary) 5%, var(--ex-bg-base));
  /* 悬停时仅保留 SVG 周长光带动画，避免与卡片 border 形成双线框 */
  border-color: transparent;
  box-shadow: 0 8px 28px color-mix(in srgb, #000 32%, transparent);
}

@media (prefers-reduced-motion: reduce) {
  .mts__slot:hover,
  .mts__slot:focus-within {
    transform: none;
  }

  .mts__slot:hover .mts__orbit-rect,
  .mts__slot:focus-within .mts__orbit-rect {
    animation: none;
    stroke-dashoffset: -32;
  }
}

.mts__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: $space-2;
  min-width: 0;
}

.mts__pair {
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
  letter-spacing: 0.02em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mts__chg {
  flex-shrink: 0;
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
}

.mts__chg--up {
  color: $color-rise;
}

.mts__chg--down {
  color: $color-fall;
}

.mts__chg--flat {
  color: $color-text-tertiary;
}

.mts__price-row {
  min-width: 0;
}

.mts__price {
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
  letter-spacing: -0.02em;
}

.mts__vol {
  margin: 0;
  font-size: $font-size-xs;
  color: $color-text-tertiary;
  line-height: 1.35;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mts__vol-num {
  margin: 0 2px;
  font-weight: $font-weight-semibold;
  color: $color-text-secondary;
}

.mts__spark-wrap {
  margin-top: 4px;
  margin-inline: -2px;
  border-radius: 3px;
  overflow: hidden;
  mask-image: linear-gradient(
    90deg,
    transparent 0%,
    #000 5%,
    #000 95%,
    transparent 100%
  );
}

.mts__spark {
  width: 100%;
  height: 38px;
  display: block;
  overflow: visible;
}

.mts__spark--up {
  filter: drop-shadow(0 2px 10px color-mix(in srgb, var(--ex-rise) 16%, transparent));
}

.mts__spark--down {
  filter: drop-shadow(0 2px 10px color-mix(in srgb, var(--ex-fall) 16%, transparent));
}

.mts__spark--flat {
  filter: drop-shadow(0 1px 4px rgba(132, 142, 156, 0.1));
}

.mts__sg--area-hi {
  stop-color: var(--ex-rise);
  stop-opacity: 0.34;
}

.mts__sg--area-mid {
  stop-color: var(--ex-rise);
  stop-opacity: 0.09;
}

.mts__sg--area-lo {
  stop-color: var(--ex-rise);
  stop-opacity: 0;
}

.mts__spark--down .mts__sg--area-hi,
.mts__spark--down .mts__sg--area-mid,
.mts__spark--down .mts__sg--area-lo {
  stop-color: var(--ex-fall);
}

.mts__spark--flat .mts__sg--area-hi {
  stop-color: var(--ex-text-tertiary);
  stop-opacity: 0.24;
}

.mts__spark--flat .mts__sg--area-mid {
  stop-color: var(--ex-text-tertiary);
  stop-opacity: 0.07;
}

.mts__spark--flat .mts__sg--area-lo {
  stop-color: var(--ex-text-tertiary);
  stop-opacity: 0;
}

.mts__sg--line-a {
  stop-color: var(--ex-rise);
  stop-opacity: 0.42;
}

.mts__sg--line-b {
  stop-color: var(--ex-rise);
  stop-opacity: 1;
}

.mts__sg--line-c {
  stop-color: var(--ex-rise);
  stop-opacity: 0.82;
}

.mts__spark--down .mts__sg--line-a,
.mts__spark--down .mts__sg--line-b,
.mts__spark--down .mts__sg--line-c {
  stop-color: var(--ex-fall);
}

.mts__spark--flat .mts__sg--line-a,
.mts__spark--flat .mts__sg--line-b,
.mts__spark--flat .mts__sg--line-c {
  stop-color: var(--ex-text-tertiary);
}

.mts__spark-area {
  pointer-events: none;
}

.mts__spark-line {
  pointer-events: none;
}
</style>
