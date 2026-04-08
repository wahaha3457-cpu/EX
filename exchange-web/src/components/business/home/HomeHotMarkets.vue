<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { RouteNames } from '@/constants/routeNames'
import type { HomeTickerCard } from '@/types/home'
import { formatChangePct } from '@/utils/format/pct'
import HomeMiniSparkline from './HomeMiniSparkline.vue'

const HOT_CAP = 12

const props = defineProps<{
  items: HomeTickerCard[]
  loading?: boolean
}>()

const router = useRouter()

/** 固定最多 12 个；不足时用已有列表循环补齐，保证跑马灯内容饱满 */
const displayItems = computed(() => {
  const src = props.items ?? []
  if (src.length === 0) return []
  if (src.length >= HOT_CAP) return src.slice(0, HOT_CAP)
  const out: HomeTickerCard[] = []
  let i = 0
  while (out.length < HOT_CAP) {
    out.push(src[i % src.length]!)
    i += 1
  }
  return out
})

function goTrade(t: HomeTickerCard) {
  router.push({ name: RouteNames.SpotTrade, params: { symbol: t.routeSymbol } })
}

function cardKey(t: HomeTickerCard, i: number, dup: number) {
  return `${dup}-${t.pairCode}-${i}`
}
</script>

<template>
  <section class="hot" aria-labelledby="hot-title">
    <div class="hot__head">
      <div>
        <h2 id="hot-title" class="hot__title">热门交易对</h2>
        <p class="hot__sub">基于 24h 成交额与流动性筛选；展示 12 个热门对并自动向左轮播，悬停可暂停；点击卡片进入现货</p>
      </div>
    </div>

    <div v-if="loading" class="hot__skeleton" aria-hidden="true">
      <div v-for="i in HOT_CAP" :key="i" class="hot__skel-card" />
    </div>

    <div v-else-if="displayItems.length" class="hot__marquee" role="region" aria-label="热门交易对轮播">
      <div class="hot__marquee-track">
        <ul class="hot__list">
          <li
            v-for="(t, i) in displayItems"
            :key="cardKey(t, i, 0)"
            class="hot__card"
            role="button"
            tabindex="0"
            @click="goTrade(t)"
            @keydown.enter="goTrade(t)"
          >
            <div class="hot__row-top">
              <div class="hot__pair">
                <span class="hot__base">{{ t.baseAsset }}</span>
                <span class="hot__sep">/</span>
                <span class="hot__quote">{{ t.quoteAsset }}</span>
              </div>
              <HomeMiniSparkline class="hot__spark" :change-pct="t.changePct" />
            </div>
            <div class="hot__price ex-num">{{ t.lastPrice }}</div>
            <div
              class="hot__chg ex-num"
              :class="t.changePct >= 0 ? 'hot__chg--up' : 'hot__chg--down'"
            >
              {{ formatChangePct(t.changePct) }}
            </div>
            <div class="hot__vol">
              <span class="hot__vol-label">24h 额</span>
              <span class="hot__vol-value ex-num">{{ t.quoteVolume24h }} USDT</span>
            </div>
          </li>
        </ul>
        <ul class="hot__list hot__list--dup" aria-hidden="true">
          <li
            v-for="(t, i) in displayItems"
            :key="cardKey(t, i, 1)"
            class="hot__card"
            role="presentation"
            tabindex="-1"
            @click="goTrade(t)"
          >
            <div class="hot__row-top">
              <div class="hot__pair">
                <span class="hot__base">{{ t.baseAsset }}</span>
                <span class="hot__sep">/</span>
                <span class="hot__quote">{{ t.quoteAsset }}</span>
              </div>
              <HomeMiniSparkline class="hot__spark" :change-pct="t.changePct" />
            </div>
            <div class="hot__price ex-num">{{ t.lastPrice }}</div>
            <div
              class="hot__chg ex-num"
              :class="t.changePct >= 0 ? 'hot__chg--up' : 'hot__chg--down'"
            >
              {{ formatChangePct(t.changePct) }}
            </div>
            <div class="hot__vol">
              <span class="hot__vol-label">24h 额</span>
              <span class="hot__vol-value ex-num">{{ t.quoteVolume24h }} USDT</span>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;
@use '@/styles/mixins' as mq;

.hot {
  margin-bottom: $space-8;
}

.hot__head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: $space-4;
  padding: 0 $space-1;
}

.hot__title {
  margin: 0 0 $space-1;
  font-size: $font-size-xl;
  font-weight: $font-weight-bold;
  letter-spacing: -0.02em;
}

.hot__sub {
  margin: 0;
  font-size: $font-size-sm;
  color: $color-text-tertiary;
}

.hot__marquee {
  overflow: hidden;
  width: 100%;
  margin: 0 (-$space-1);
  padding: 0 $space-1;
  mask-image: linear-gradient(
    90deg,
    transparent 0,
    #000 16px,
    #000 calc(100% - 16px),
    transparent 100%
  );
}

.hot__marquee-track {
  display: flex;
  flex-direction: row;
  width: max-content;
  animation: hot-marquee 48s linear infinite;
}

@media (prefers-reduced-motion: reduce) {
  .hot__marquee-track {
    animation: none;
  }
}

.hot__marquee:hover .hot__marquee-track {
  animation-play-state: paused;
}

@keyframes hot-marquee {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-50%);
  }
}

.hot__list {
  display: flex;
  flex-direction: row;
  flex-shrink: 0;
  align-items: stretch;
  gap: $space-3;
  width: max-content;
  list-style: none;
  margin: 0;
  padding: 0;
}

.hot__list--dup {
  padding-left: $space-3;
}

.hot__card {
  flex: 0 0 auto;
  width: 156px;
  padding: $space-4;
  border-radius: $radius-md;
  border: 1px solid $color-border;
  background: var(--ex-home-markets-bg);
  box-shadow: var(--ex-shadow-inset-well);
  transition: border-color 0.2s ease, transform 0.2s ease;
  cursor: pointer;

  @include mq.media-up(md) {
    width: 200px;
  }
}

.hot__card:hover {
  border-color: rgba(240, 185, 11, 0.35);
  transform: translateY(-2px);
}

.hot__row-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-2;
  margin-bottom: $space-2;
}

.hot__pair {
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  color: $color-text-primary;
}

.hot__sep {
  color: $color-text-tertiary;
  margin: 0 2px;
}

.hot__quote {
  color: $color-text-tertiary;
  font-weight: $font-weight-medium;
}

.hot__spark {
  opacity: 0.95;
}

.hot__price {
  font-size: $font-size-lg;
  font-weight: $font-weight-semibold;
  margin-bottom: $space-2;
  color: $color-text-primary;
}

.hot__chg {
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  margin-bottom: $space-3;
}

.hot__chg--up {
  color: $color-rise;
}

.hot__chg--down {
  color: $color-fall;
}

.hot__vol {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-top: $space-2;
  border-top: 1px solid var(--ex-border-subtle);
}

.hot__vol-label {
  font-size: $font-size-xs;
  color: $color-text-tertiary;
}

.hot__vol-value {
  font-size: $font-size-xs;
  color: $color-text-secondary;
}

.hot__skeleton {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  gap: $space-3;
  overflow: hidden;
}

.hot__skeleton .hot__skel-card {
  flex: 0 0 auto;
  width: 156px;

  @include mq.media-up(md) {
    width: 200px;
  }
}

.hot__skel-card {
  height: 168px;
  border-radius: $radius-md;
  background: linear-gradient(
    90deg,
    $color-bg-surface 0%,
    $color-bg-hover 50%,
    $color-bg-surface 100%
  );
  background-size: 200% 100%;
  animation: hot-shimmer 1.2s ease-in-out infinite;
}

@keyframes hot-shimmer {
  0% {
    background-position: 100% 0;
  }
  100% {
    background-position: -100% 0;
  }
}
</style>
