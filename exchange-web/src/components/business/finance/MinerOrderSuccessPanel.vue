<script setup lang="ts">
/**
 * 智能矿机 · 算力订单成功态（区块/算力风格动效），仅本业务域使用。
 */
defineProps<{
  ribbon: string
  title: string
  description: string
}>()
</script>

<template>
  <div class="mosp" role="status">
    <div class="mosp__blocks" aria-hidden="true">
      <span
        v-for="i in 12"
        :key="i"
        class="mosp__blk"
        :style="{
          '--d': `${((i * 11) % 10) * 0.1}s`,
          '--x': `${(i * 31) % 100}%`,
        }"
      />
    </div>
    <div class="mosp__card">
      <div class="mosp__glow" aria-hidden="true" />
      <div class="mosp__badge" aria-hidden="true">
        <span class="mosp__ico">⛏</span>
      </div>
      <p class="mosp__ribbon">{{ ribbon }}</p>
      <h3 class="mosp__title">{{ title }}</h3>
      <p class="mosp__desc">{{ description }}</p>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

@keyframes mosp-float {
  0% {
    transform: translate3d(0, 24px, 0) scale(0.5) rotate(0deg);
    opacity: 0;
  }
  15% {
    opacity: 0.85;
  }
  100% {
    transform: translate3d(0, -100px, 0) scale(1) rotate(180deg);
    opacity: 0;
  }
}

@keyframes mosp-badge {
  0%,
  100% {
    transform: scale(1) rotate(0deg);
  }
  50% {
    transform: scale(1.05) rotate(-6deg);
  }
}

.mosp {
  position: relative;
  width: 100%;
  padding: $space-3 0 $space-1;
}

.mosp__blocks {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 36px;
  height: 140px;
  pointer-events: none;
  overflow: hidden;
}

.mosp__blk {
  position: absolute;
  left: var(--x, 40%);
  bottom: 0;
  width: 10px;
  height: 10px;
  border-radius: 3px;
  background: linear-gradient(145deg, #6aa9ff, #3084fc);
  box-shadow: 0 0 12px rgba(48, 132, 252, 0.45);
  animation: mosp-float 2.4s ease-out infinite;
  animation-delay: var(--d, 0s);
}

.mosp__card {
  position: relative;
  margin-top: $space-2;
  padding: $space-4 $space-4 $space-3;
  border-radius: $radius-md;
  text-align: center;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--ex-info, #3084fc) 40%, transparent);
  background: linear-gradient(
    168deg,
    rgba(48, 132, 252, 0.12) 0%,
    rgba(48, 132, 252, 0.04) 42%,
    var(--ex-surface-inset, rgba(255, 255, 255, 0.02)) 100%
  );
  box-shadow:
    0 0 0 1px rgba(48, 132, 252, 0.08),
    0 14px 40px rgba(0, 0, 0, 0.2);
}

.mosp__glow {
  position: absolute;
  inset: -35% -20% auto;
  height: 120px;
  background: radial-gradient(ellipse at 50% 0%, rgba(48, 132, 252, 0.3), transparent 72%);
  pointer-events: none;
}

.mosp__badge {
  position: relative;
  width: 68px;
  height: 68px;
  margin: 0 auto;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(145deg, #6aa9ff, #3084fc);
  box-shadow:
    0 0 0 4px rgba(48, 132, 252, 0.2),
    0 12px 28px rgba(48, 132, 252, 0.32);
  animation: mosp-badge 2.6s ease-in-out infinite;
}

.mosp__ico {
  font-size: 30px;
  line-height: 1;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
}

.mosp__ribbon {
  position: relative;
  margin: $space-3 0 0;
  font-size: 11px;
  font-weight: $font-weight-bold;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ex-info, #3084fc);
  text-shadow: 0 0 18px rgba(48, 132, 252, 0.35);
}

.mosp__title {
  position: relative;
  margin: $space-2 0 0;
  font-size: $font-size-lg;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
  line-height: 1.35;
}

.mosp__desc {
  position: relative;
  margin: $space-2 0 0;
  font-size: $font-size-sm;
  color: $color-text-secondary;
  line-height: 1.6;
}
</style>
