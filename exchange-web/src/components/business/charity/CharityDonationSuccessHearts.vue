<script setup lang="ts">
/**
 * 慈善捐赠成功态 · 飘落的爱心动画 + 文案（仅慈善域使用）。
 */
defineProps<{
  ribbon: string
  title: string
  description: string
}>()
</script>

<template>
  <div class="ch-sh" role="status">
    <div class="ch-sh__hearts" aria-hidden="true">
      <span
        v-for="i in 14"
        :key="i"
        class="ch-sh__heart"
        :style="{
          '--delay': `${((i * 13) % 10) * 0.12}s`,
          '--drift': `${-20 + (i * 17) % 40}px`,
          '--start-x': `${8 + (i * 41) % 84}%`,
        }"
      >
        ♥
      </span>
    </div>
    <div class="ch-sh__card">
      <div class="ch-sh__glow" aria-hidden="true" />
      <div class="ch-sh__icon-wrap" aria-hidden="true">
        <span class="ch-sh__icon">♥</span>
      </div>
      <p class="ch-sh__ribbon">{{ ribbon }}</p>
      <h3 class="ch-sh__title">{{ title }}</h3>
      <p class="ch-sh__desc">{{ description }}</p>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

@keyframes ch-heart-fall {
  0% {
    transform: translate3d(0, -12px, 0) scale(0.65) rotate(-8deg);
    opacity: 0;
  }
  12% {
    opacity: 0.95;
  }
  100% {
    transform: translate3d(var(--drift, 0), 220px, 0) scale(1.05) rotate(12deg);
    opacity: 0;
  }
}

@keyframes ch-heart-pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.06);
  }
}

.ch-sh {
  position: relative;
  width: 100%;
  padding: $space-3 0 $space-2;
}

.ch-sh__hearts {
  position: absolute;
  inset: 0 0 auto;
  height: 200px;
  pointer-events: none;
  overflow: hidden;
}

.ch-sh__heart {
  position: absolute;
  left: var(--start-x, 50%);
  top: 0;
  font-size: 14px;
  color: rgba(246, 70, 93, 0.55);
  text-shadow: 0 0 14px rgba(246, 70, 93, 0.35);
  animation: ch-heart-fall 2.8s ease-in forwards;
  animation-delay: var(--delay, 0s);
}

.ch-sh__card {
  position: relative;
  margin-top: $space-2;
  padding: $space-4 $space-4 $space-3;
  border-radius: $radius-md;
  text-align: center;
  border: 1px solid rgba(246, 70, 93, 0.32);
  background: linear-gradient(
    168deg,
    rgba(246, 70, 93, 0.11) 0%,
    rgba(240, 185, 11, 0.06) 38%,
    var(--ex-surface-inset, rgba(255, 255, 255, 0.02)) 100%
  );
  box-shadow:
    0 0 0 1px rgba(246, 70, 93, 0.06),
    0 16px 42px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.ch-sh__glow {
  position: absolute;
  inset: -35% -15% auto;
  height: 140px;
  background: radial-gradient(ellipse at 50% 0%, rgba(246, 70, 93, 0.25), transparent 70%);
  pointer-events: none;
}

.ch-sh__icon-wrap {
  position: relative;
  width: 72px;
  height: 72px;
  margin: 0 auto;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(145deg, #ff8fa8, #f6465d);
  box-shadow:
    0 0 0 4px rgba(246, 70, 93, 0.18),
    0 12px 28px rgba(246, 70, 93, 0.28);
  animation: ch-heart-pulse 2s ease-in-out infinite;
}

.ch-sh__icon {
  font-size: 34px;
  line-height: 1;
  color: #fff;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15));
}

.ch-sh__ribbon {
  position: relative;
  margin: $space-3 0 0;
  font-size: 11px;
  font-weight: $font-weight-bold;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #f6465d;
  text-shadow: 0 0 20px rgba(246, 70, 93, 0.35);
}

.ch-sh__title {
  position: relative;
  margin: $space-2 0 0;
  font-size: $font-size-lg;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
  line-height: 1.35;
}

.ch-sh__desc {
  position: relative;
  margin: $space-2 0 0;
  font-size: $font-size-sm;
  color: $color-text-secondary;
  line-height: 1.6;
}
</style>
