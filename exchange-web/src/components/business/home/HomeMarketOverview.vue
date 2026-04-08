<script setup lang="ts">
import type { HomeMarketStat } from '@/types/home'
import MarketOverviewIllustration from './MarketOverviewIllustration.vue'

defineProps<{
  stats: HomeMarketStat[]
  loading?: boolean
}>()

function cardClass(id: string) {
  return ['overview__card', `overview__card--${id}`]
}
</script>

<template>
  <section class="overview" aria-labelledby="ov-title">
    <div class="overview__intro">
      <h2 id="ov-title" class="overview__title">市场概览</h2>
      <p class="overview__lead">
        快速了解全站成交规模、可交易品种、行情同步与服务稳定性
      </p>
    </div>

    <div v-if="loading" class="overview__skeleton">
      <div v-for="i in 4" :key="i" class="overview__skel">
        <div class="overview__skel-text" />
        <div class="overview__skel-art" />
      </div>
    </div>

    <ul v-else class="overview__grid">
      <li v-for="s in stats" :key="s.id" :class="cardClass(s.id)">
        <div class="overview__body">
          <p class="overview__label">{{ s.label }}</p>
          <p class="overview__value ex-num">{{ s.value }}</p>
          <p v-if="s.sub" class="overview__sub">{{ s.sub }}</p>
        </div>
        <div class="overview__figure" aria-hidden="true">
          <MarketOverviewIllustration :stat-id="s.id" />
        </div>
      </li>
    </ul>
  </section>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;
@use '@/styles/mixins' as mq;

/* 无外层大卡片；四块为等间距、左右贴齐容器的圆角矩形 */
.overview {
  position: relative;
  margin-bottom: $space-8;
  padding: 0;
  border: none;
  border-radius: 0;
  background: transparent;
}

.overview__intro {
  margin-bottom: $space-4;
  padding: 0;
}

.overview__title {
  margin: 0 0 $space-2;
  font-size: $font-size-xl;
  font-weight: $font-weight-bold;
  letter-spacing: -0.02em;
  color: $color-text-primary;
}

.overview__lead {
  margin: 0;
  max-width: 42rem;
  font-size: $font-size-sm;
  line-height: 1.55;
  color: $color-text-tertiary;
}

.overview__grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: $space-3;
  width: 100%;
  list-style: none;
  margin: 0;
  padding: 0;
  box-sizing: border-box;

  @include mq.media-up(sm) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @include mq.media-up(xl) {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

.overview__card {
  --ov-art-accent: var(--ex-brand);
  --ov-art-accent-2: var(--ex-info);
  --ov-art-accent-3: var(--ex-rise);
  --ov-art-accent-4: var(--ex-success);
  --ov-art-line: rgba(255, 255, 255, 0.42);

  position: relative;
  display: flex;
  flex-direction: row;
  align-items: stretch;
  justify-content: space-between;
  gap: $space-3;
  min-height: 118px;
  padding: $space-4 $space-4 $space-4 $space-5;
  border-radius: $radius-lg;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--ex-border) 88%, transparent);
  background: color-mix(in srgb, var(--ex-card-surface) 92%, var(--ex-bg-muted));
  box-shadow: none;
  transition:
    background 0.2s ease,
    border-color 0.2s ease;

  @include mq.media-down(sm) {
    min-height: 0;
    padding: $space-4;
  }
}

.overview__card:hover {
  background: color-mix(in srgb, var(--ex-card-surface) 88%, var(--ex-brand-subtle));
  border-color: color-mix(in srgb, var(--ex-brand) 22%, var(--ex-border-subtle));
}

/* 各指标主题色：与插图变量对齐 */
.overview__card--vol {
  --ov-art-accent: var(--ex-brand);
  --ov-art-line: color-mix(in srgb, var(--ex-brand) 45%, transparent);
}

.overview__card--pairs {
  --ov-art-accent-2: #3084fc;
  --ov-art-line: rgba(130, 180, 255, 0.45);
}

.overview__card--latency {
  --ov-art-accent-3: #00c087;
  --ov-art-line: rgba(0, 224, 150, 0.42);
}

.overview__card--uptime {
  --ov-art-accent-4: #0ecb81;
  --ov-art-line: rgba(80, 220, 160, 0.45);
}

.overview__body {
  position: relative;
  z-index: 1;
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0;
}

.overview__figure {
  position: relative;
  z-index: 1;
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  align-self: center;
  width: 88px;
  padding: $space-1;

  @include mq.media-down(sm) {
    width: 76px;
  }
}

.overview__label {
  margin: 0 0 $space-2;
  font-size: $font-size-xs;
  color: $color-text-tertiary;
  font-weight: $font-weight-medium;
  line-height: 1.35;
}

.overview__value {
  margin: 0 0 $space-1;
  font-size: clamp(1.25rem, 2.8vw, $font-size-xxl);
  font-weight: $font-weight-bold;
  color: $color-text-primary;
  letter-spacing: -0.03em;
  line-height: 1.1;
}

.overview__sub {
  margin: 0;
  font-size: $font-size-xs;
  color: $color-text-tertiary;
  line-height: 1.4;
}

:global([data-theme='monochrome']) .overview__card {
  --ov-art-line: color-mix(in srgb, var(--ex-text-primary) 28%, transparent);
  background: var(--ex-card-surface);
  border-color: var(--ex-border-subtle);
}

:global([data-theme='monochrome']) .overview__card:hover {
  background: color-mix(in srgb, var(--ex-brand-muted) 35%, var(--ex-card-surface));
  border-color: color-mix(in srgb, var(--ex-brand) 28%, var(--ex-border-subtle));
}

:global([data-theme='monochrome']) .overview__skel {
  background: var(--ex-card-surface);
}

.overview__skeleton {
  display: grid;
  grid-template-columns: 1fr;
  gap: $space-3;
  width: 100%;
  margin: 0;
  padding: 0;
  box-sizing: border-box;

  @include mq.media-up(sm) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @include mq.media-up(xl) {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

.overview__skel {
  display: flex;
  flex-direction: row;
  align-items: stretch;
  gap: $space-3;
  min-height: 118px;
  padding: $space-4;
  border-radius: $radius-lg;
  border: 1px solid var(--ex-border-subtle);
  background: color-mix(in srgb, var(--ex-card-surface) 92%, var(--ex-bg-muted));
}

.overview__skel-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.overview__skel-text::before,
.overview__skel-text::after {
  content: '';
  display: block;
  border-radius: $radius-sm;
  background: linear-gradient(
    90deg,
    $color-bg-surface 0%,
    $color-bg-hover 50%,
    $color-bg-surface 100%
  );
  background-size: 200% 100%;
  animation: ov-shimmer 1.2s ease-in-out infinite;
}

.overview__skel-text::before {
  height: 12px;
  width: 55%;
}

.overview__skel-text::after {
  height: 28px;
  width: 72%;
  animation-delay: 0.08s;
}

.overview__skel-art {
  flex: 0 0 72px;
  width: 72px;
  border-radius: $radius-md;
  background: linear-gradient(
    90deg,
    $color-bg-surface 0%,
    $color-bg-hover 50%,
    $color-bg-surface 100%
  );
  background-size: 200% 100%;
  animation: ov-shimmer 1.2s ease-in-out infinite;
  animation-delay: 0.12s;
}

@keyframes ov-shimmer {
  0% {
    background-position: 100% 0;
  }
  100% {
    background-position: -100% 0;
  }
}
</style>
