<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { RouteNames } from '@/constants/routeNames'
import { useThemeStore } from '@/stores/theme'

const { theme: themeMode } = storeToRefs(useThemeStore())

/**
 * 首屏与热门交易对之间的装饰型跑马灯（纯前端文案，后续可接公告 API）。
 */
const SEGMENTS = [
  '统一账户 · 现货与合约一站式',
  '撮合目标 P99 < 5ms · 区域相关',
  '深度聚合 · 低滑点路由',
  '7×24 风控监测与异常告警',
  '机构 API · 限频与审计可配',
  'USDT 本位永续 · 资金费率透明',
  '充提与链上确认可追踪',
  '新用户专享 · 交易赛与返佣',
] as const
</script>

<template>
  <section
    class="mqr"
    :class="{ 'mqr--mono': themeMode === 'monochrome' }"
    aria-label="平台亮点跑马灯"
  >
    <div class="mqr__edge mqr__edge--top" aria-hidden="true" />
    <div class="mqr__shell">
      <div class="mqr__border-glow" aria-hidden="true" />
      <div class="mqr__inner">
        <div class="mqr__shine" aria-hidden="true" />

        <div class="mqr__body">
          <div class="mqr__side mqr__side--start" role="img" aria-label="公告">
            <svg class="mqr__icon-svg" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77 0-4.28-2.99-7.86-7-8.77z"
              />
            </svg>
          </div>

          <div class="mqr__track-wrap">
            <div class="mqr__fade mqr__fade--l" aria-hidden="true" />
            <div class="mqr__fade mqr__fade--r" aria-hidden="true" />
            <div class="mqr__track">
            <ul class="mqr__chunk" role="list">
              <li v-for="(line, i) in SEGMENTS" :key="`a-${i}`" class="mqr__item">
                <span class="mqr__dot" aria-hidden="true" />
                <span class="mqr__text">{{ line }}</span>
              </li>
            </ul>
            <ul class="mqr__chunk" aria-hidden="true" role="presentation">
              <li v-for="(line, i) in SEGMENTS" :key="`b-${i}`" class="mqr__item">
                <span class="mqr__dot" aria-hidden="true" />
                <span class="mqr__text">{{ line }}</span>
              </li>
            </ul>
            </div>
          </div>

          <RouterLink
            class="mqr__side mqr__side--end"
            :to="{ name: RouteNames.AnnounceCenter }"
            aria-label="进入公告中心"
          >
            <span class="mqr__more-label">更多</span>
            <svg class="mqr__chev" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M13.172 12l-4.95-4.95 1.414-1.414L16 12l-6.364 6.364-1.414-1.414z"
              />
            </svg>
          </RouterLink>
        </div>
      </div>
    </div>
    <div class="mqr__edge mqr__edge--bottom" aria-hidden="true" />
  </section>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;
@use '@/styles/mixins' as mq;

.mqr {
  position: relative;
  z-index: 1;
  width: 100%;
  margin-top: -2px;
  padding: 0 var(--ex-gutter-x) $space-4;
  max-width: var(--ex-container-max);
  margin-left: auto;
  margin-right: auto;

  @include mq.media-down(sm) {
    padding-bottom: $space-3;
  }
}

.mqr__shell {
  position: relative;
  border-radius: $radius-lg;
  padding: 1px;
  background: linear-gradient(
    110deg,
    rgba(240, 185, 11, 0.55) 0%,
    rgba(48, 132, 252, 0.45) 35%,
    rgba(14, 203, 129, 0.4) 65%,
    rgba(240, 185, 11, 0.55) 100%
  );
  background-size: 220% 100%;
  animation: mqr-border-flow 10s linear infinite;
  box-shadow:
    0 0 24px color-mix(in srgb, var(--ex-brand) 14%, transparent),
    0 8px 28px rgba(0, 0, 0, 0.22);
}

@media (prefers-reduced-motion: reduce) {
  .mqr__shell {
    animation: none;
    background: linear-gradient(
      110deg,
      rgba(240, 185, 11, 0.35),
      rgba(48, 132, 252, 0.28),
      rgba(14, 203, 129, 0.28)
    );
  }

  .mqr__track {
    animation: none !important;
  }
}

@keyframes mqr-border-flow {
  0% {
    background-position: 0% 50%;
  }
  100% {
    background-position: 200% 50%;
  }
}

/* 装饰光晕：不用 filter:blur，避免扩大合成层、诱发整屏发朦 */
.mqr__border-glow {
  position: absolute;
  inset: -2px;
  border-radius: inherit;
  background: radial-gradient(
    60% 120% at 50% 0%,
    rgba(240, 185, 11, 0.14) 0%,
    transparent 55%
  );
  pointer-events: none;
}

.mqr__inner {
  position: relative;
  overflow: hidden;
  border-radius: calc(#{$radius-lg} - 1px);
  /* 实色底替代 backdrop-filter，避免 WebKit 对「玻璃」采样整屏发灰 */
  background: linear-gradient(
    180deg,
    #161a20 0%,
    #0e1114 100%
  );
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.mqr__body {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: row;
  align-items: stretch;
  min-height: 48px;
}

.mqr__side {
  position: relative;
  z-index: 4;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mqr__side--start {
  width: 44px;
  padding-left: $space-2;
  background: linear-gradient(90deg, rgba(10, 12, 16, 0.98) 55%, rgba(10, 12, 16, 0));
  border-right: 1px solid rgba(255, 255, 255, 0.06);
}

.mqr__icon-svg {
  width: 22px;
  height: 22px;
  color: var(--ex-brand);
}

.mqr__side--end {
  gap: 2px;
  min-width: 52px;
  padding: 0 $space-3 0 $space-2;
  text-decoration: none;
  background: linear-gradient(270deg, rgba(10, 12, 16, 0.98) 55%, rgba(10, 12, 16, 0));
  border-left: 1px solid rgba(255, 255, 255, 0.06);
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  color: var(--ex-brand);
  transition: color 0.15s ease;

  &:hover {
    color: var(--ex-brand-hover);
  }

  &:focus-visible {
    outline: 2px solid color-mix(in srgb, var(--ex-brand) 65%, transparent);
    outline-offset: 2px;
  }
}

.mqr__more-label {
  letter-spacing: 0.06em;
}

.mqr__chev {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  opacity: 0.95;
}

.mqr__shine {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    105deg,
    transparent 0%,
    rgba(255, 255, 255, 0.04) 45%,
    transparent 90%
  );
  animation: mqr-shine 6s ease-in-out infinite;
  pointer-events: none;
}

@keyframes mqr-shine {
  0%,
  100% {
    opacity: 0.35;
    transform: translateX(-8%);
  }
  50% {
    opacity: 0.85;
    transform: translateX(8%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .mqr__shine {
    animation: none;
    opacity: 0.4;
  }
}

.mqr__fade {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 48px;
  z-index: 2;
  pointer-events: none;
}

.mqr__fade--l {
  left: 0;
  background: linear-gradient(90deg, rgba(10, 12, 16, 0.95), transparent);
}

.mqr__fade--r {
  right: 0;
  background: linear-gradient(270deg, rgba(10, 12, 16, 0.95), transparent);
}

.mqr__track-wrap {
  position: relative;
  z-index: 1;
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  padding: $space-3 0;
  mask-image: linear-gradient(
    90deg,
    transparent 0,
    #000 12px,
    #000 calc(100% - 12px),
    transparent 100%
  );
}

.mqr__track {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  width: max-content;
  animation: mqr-scroll 42s linear infinite;
}

@keyframes mqr-scroll {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-50%);
  }
}

.mqr__chunk {
  display: flex;
  flex-direction: row;
  flex-shrink: 0;
  align-items: center;
  gap: $space-6;
  list-style: none;
  margin: 0;
  padding: 0 $space-5;
}

.mqr__item {
  display: inline-flex;
  flex-direction: row;
  align-items: center;
  gap: $space-2;
  flex-shrink: 0;
}

.mqr__dot {
  width: 6px;
  height: 6px;
  border-radius: $radius-full;
  background: var(--ex-brand);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--ex-brand) 35%, transparent);
  flex-shrink: 0;
}

.mqr__text {
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  letter-spacing: 0.04em;
  white-space: nowrap;
  color: $color-text-secondary;
}

@media (prefers-reduced-motion: reduce) {
  .mqr__text {
    color: $color-text-secondary;
  }
}

.mqr__edge {
  height: 1px;
  margin: 0 auto;
  max-width: min(720px, 88%);
  opacity: 0.45;
}

.mqr__edge--top {
  margin-bottom: $space-3;
  background: linear-gradient(
    90deg,
    transparent,
    color-mix(in srgb, var(--ex-brand) 28%, transparent),
    transparent
  );
}

.mqr__edge--bottom {
  margin-top: $space-3;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(48, 132, 252, 0.2),
    rgba(240, 185, 11, 0.3),
    transparent
  );
}

/**
 * 浅色（monochrome）：用组件 class 驱动，避免 scoped + :global([data-theme]) 在部分构建下覆盖顺序异常，
 * 导致仍显示深色条底。
 */
.mqr.mqr--mono {
  .mqr__shell {
    background: linear-gradient(
      110deg,
      color-mix(in srgb, var(--ex-brand) 42%, transparent) 0%,
      color-mix(in srgb, #3084fc 32%, transparent) 38%,
      color-mix(in srgb, #0ecb81 28%, transparent) 68%,
      color-mix(in srgb, var(--ex-brand) 40%, transparent) 100%
    );
    background-size: 220% 100%;
    box-shadow:
      0 0 0 1px var(--ex-divider-on-white, rgba(15, 23, 42, 0.06)),
      0 4px 20px rgba(15, 23, 42, 0.06),
      0 12px 40px rgba(15, 23, 42, 0.04);
  }

  .mqr__border-glow {
    background: radial-gradient(
      60% 120% at 50% 0%,
      color-mix(in srgb, var(--ex-brand) 22%, transparent) 0%,
      transparent 58%
    );
  }

  .mqr__inner {
    background: linear-gradient(
      180deg,
      var(--ex-card-surface, #ffffff) 0%,
      var(--ex-surface-inset, #fafbfc) 55%,
      var(--ex-bg-muted, #f5f6f8) 100%
    );
    border-color: var(--ex-border-subtle, #eaecef);
  }

  .mqr__shine {
    background: linear-gradient(
      105deg,
      transparent 0%,
      rgba(255, 255, 255, 0.55) 42%,
      transparent 88%
    );
    opacity: 0.85;
  }

  .mqr__fade--l {
    background: linear-gradient(
      90deg,
      color-mix(in srgb, var(--ex-card-surface, #fff) 96%, transparent),
      transparent
    );
  }

  .mqr__fade--r {
    background: linear-gradient(
      270deg,
      color-mix(in srgb, var(--ex-card-surface, #fff) 96%, transparent),
      transparent
    );
  }

  .mqr__side--start {
    background: linear-gradient(
      90deg,
      color-mix(in srgb, var(--ex-card-surface, #fff) 98%, transparent) 50%,
      transparent
    );
    border-right-color: var(--ex-border-subtle, #eaecef);
  }

  .mqr__side--end {
    background: linear-gradient(
      270deg,
      color-mix(in srgb, var(--ex-card-surface, #fff) 98%, transparent) 50%,
      transparent
    );
    border-left-color: var(--ex-border-subtle, #eaecef);
    color: var(--ex-brand-active, #c99400);

    &:hover {
      color: var(--ex-brand-hover, #f8d12f);
    }

    &:focus-visible {
      outline-color: color-mix(in srgb, var(--ex-brand) 55%, var(--ex-border-strong, #cdd3db));
    }
  }

  .mqr__icon-svg {
    color: var(--ex-brand);
  }

  .mqr__dot {
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--ex-brand) 45%, var(--ex-border-subtle, #eaecef));
  }

  .mqr__text {
    color: var(--ex-text-secondary, #3d3d3d);
    text-shadow: none;
  }

  .mqr__edge--top {
    background: linear-gradient(
      90deg,
      transparent,
      color-mix(in srgb, var(--ex-brand) 22%, transparent),
      transparent
    );
    opacity: 0.65;
  }

  .mqr__edge--bottom {
    background: linear-gradient(
      90deg,
      transparent,
      color-mix(in srgb, #3084fc 18%, transparent),
      color-mix(in srgb, var(--ex-brand) 24%, transparent),
      transparent
    );
    opacity: 0.55;
  }
}

@media (prefers-reduced-motion: reduce) {
  .mqr.mqr--mono .mqr__shell {
    animation: none;
    background: linear-gradient(
      110deg,
      color-mix(in srgb, var(--ex-brand) 28%, transparent),
      color-mix(in srgb, #3084fc 22%, transparent),
      color-mix(in srgb, #0ecb81 20%, transparent)
    );
  }
}
</style>
