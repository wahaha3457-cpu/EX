<script setup lang="ts">
/**
 * 基金理财 · 申购/赎回成功态（粒子动效 + 文案），仅本业务域使用。
 */
defineProps<{
  ribbon: string
  title: string
  description: string
  /** subscribe：金色粒子；redeem：偏冷静到账态 */
  variant: 'subscribe' | 'redeem'
}>()
</script>

<template>
  <div class="ffsp" :data-variant="variant" role="status">
    <div v-if="variant === 'subscribe'" class="ffsp__particles" aria-hidden="true">
      <span
        v-for="i in 16"
        :key="i"
        class="ffsp__dot"
        :style="{
          '--d': `${((i * 7) % 12) * 0.1}s`,
          '--x': `${(i * 23) % 100}%`,
        }"
      />
    </div>
    <div class="ffsp__card">
      <div class="ffsp__glow" aria-hidden="true" />
      <div class="ffsp__badge" aria-hidden="true">
        <span v-if="variant === 'subscribe'" class="ffsp__ico">✦</span>
        <span v-else class="ffsp__ico">✓</span>
      </div>
      <p class="ffsp__ribbon">{{ ribbon }}</p>
      <h3 class="ffsp__title">{{ title }}</h3>
      <p class="ffsp__desc">{{ description }}</p>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

@keyframes ffsp-rise {
  0% {
    transform: translate3d(0, 40px, 0) scale(0.4);
    opacity: 0;
  }
  20% {
    opacity: 0.9;
  }
  100% {
    transform: translate3d(0, -120px, 0) scale(1);
    opacity: 0;
  }
}

@keyframes ffsp-pop {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.04);
  }
}

.ffsp {
  position: relative;
  width: 100%;
  padding: $space-3 0 $space-1;
}

.ffsp__particles {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 40px;
  height: 160px;
  pointer-events: none;
  overflow: hidden;
}

.ffsp__dot {
  position: absolute;
  left: var(--x, 50%);
  bottom: 0;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: linear-gradient(180deg, #ffe082, #f0b90b);
  box-shadow: 0 0 10px rgba(240, 185, 11, 0.45);
  animation: ffsp-rise 2.2s ease-out infinite;
  animation-delay: var(--d, 0s);
}

.ffsp__card {
  position: relative;
  padding: $space-4 $space-4 $space-3;
  border-radius: $radius-md;
  text-align: center;
  overflow: hidden;
}

.ffsp[data-variant='subscribe'] .ffsp__card {
  border: 1px solid rgba(240, 185, 11, 0.35);
  background: linear-gradient(
    168deg,
    rgba(240, 185, 11, 0.14) 0%,
    rgba(14, 203, 129, 0.06) 42%,
    var(--ex-surface-inset, rgba(255, 255, 255, 0.02)) 100%
  );
  box-shadow:
    0 0 0 1px rgba(240, 185, 11, 0.08),
    0 14px 40px rgba(0, 0, 0, 0.18);
}

.ffsp[data-variant='redeem'] .ffsp__card {
  border: 1px solid rgba(14, 203, 129, 0.32);
  background: linear-gradient(
    168deg,
    rgba(14, 203, 129, 0.1) 0%,
    rgba(14, 203, 129, 0.03) 45%,
    var(--ex-surface-inset, rgba(255, 255, 255, 0.02)) 100%
  );
  box-shadow:
    0 0 0 1px rgba(14, 203, 129, 0.08),
    0 14px 40px rgba(0, 0, 0, 0.18);
}

.ffsp__glow {
  position: absolute;
  inset: -40% -20% auto;
  height: 120px;
  pointer-events: none;
}

.ffsp[data-variant='subscribe'] .ffsp__glow {
  background: radial-gradient(ellipse at 50% 0%, rgba(240, 185, 11, 0.28), transparent 72%);
}

.ffsp[data-variant='redeem'] .ffsp__glow {
  background: radial-gradient(ellipse at 50% 0%, rgba(14, 203, 129, 0.28), transparent 72%);
}

.ffsp__badge {
  position: relative;
  width: 68px;
  height: 68px;
  margin: 0 auto;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: ffsp-pop 2.4s ease-in-out infinite;
}

.ffsp[data-variant='subscribe'] .ffsp__badge {
  background: linear-gradient(145deg, #fde047, #f0b90b);
  color: #3d2b00;
  box-shadow:
    0 0 0 4px rgba(240, 185, 11, 0.2),
    0 12px 28px rgba(240, 185, 11, 0.28);
}

.ffsp[data-variant='redeem'] .ffsp__badge {
  background: linear-gradient(145deg, #3ee4a8, #0ecb81);
  color: #0b1530;
  box-shadow:
    0 0 0 4px rgba(14, 203, 129, 0.18),
    0 12px 28px rgba(14, 203, 129, 0.3);
}

.ffsp__ico {
  font-size: 30px;
  font-weight: $font-weight-bold;
  line-height: 1;
}

.ffsp__ribbon {
  position: relative;
  margin: $space-3 0 0;
  font-size: 11px;
  font-weight: $font-weight-bold;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.ffsp[data-variant='subscribe'] .ffsp__ribbon {
  color: $color-brand;
  text-shadow: 0 0 20px rgba(240, 185, 11, 0.35);
}

.ffsp[data-variant='redeem'] .ffsp__ribbon {
  color: $color-rise;
  text-shadow: 0 0 20px rgba(14, 203, 129, 0.3);
}

.ffsp__title {
  position: relative;
  margin: $space-2 0 0;
  font-size: $font-size-lg;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
  line-height: 1.35;
}

.ffsp__desc {
  position: relative;
  margin: $space-2 0 0;
  font-size: $font-size-sm;
  color: $color-text-secondary;
  line-height: 1.6;
}
</style>
