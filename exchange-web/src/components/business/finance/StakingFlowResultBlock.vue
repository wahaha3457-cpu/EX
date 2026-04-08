<script setup lang="ts">
/**
 * 质押借币流程 · 订单提交成功 / 结清 等收尾态展示（仅本业务域使用）。
 */
defineProps<{
  ribbon: string
  title: string
  description: string
  /** borrow | add | repay 绿色；closed 偏蓝紫，用于结清 */
  tone?: 'rise' | 'neutral'
}>()
</script>

<template>
  <div class="sfrb" :data-tone="tone === 'neutral' ? 'neutral' : 'rise'" role="status">
    <div class="sfrb__glow" aria-hidden="true" />
    <div class="sfrb__badge" aria-hidden="true">
      <span class="sfrb__check">✓</span>
    </div>
    <p class="sfrb__ribbon">{{ ribbon }}</p>
    <h3 class="sfrb__title">{{ title }}</h3>
    <p class="sfrb__desc">{{ description }}</p>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.sfrb {
  position: relative;
  width: 100%;
  padding: $space-4 $space-4 $space-3;
  border-radius: $radius-md;
  text-align: center;
  overflow: hidden;
}

.sfrb[data-tone='rise'] {
  border: 1px solid rgba(14, 203, 129, 0.35);
  background: linear-gradient(
    165deg,
    rgba(14, 203, 129, 0.12) 0%,
    rgba(14, 203, 129, 0.04) 45%,
    var(--ex-surface-inset, rgba(255, 255, 255, 0.02)) 100%
  );
  box-shadow:
    0 0 0 1px rgba(14, 203, 129, 0.08),
    0 14px 36px rgba(0, 0, 0, 0.2);
}

.sfrb[data-tone='neutral'] {
  border: 1px solid rgba(91, 140, 255, 0.35);
  background: linear-gradient(
    165deg,
    rgba(91, 140, 255, 0.12) 0%,
    rgba(91, 140, 255, 0.04) 45%,
    var(--ex-surface-inset, rgba(255, 255, 255, 0.02)) 100%
  );
  box-shadow:
    0 0 0 1px rgba(91, 140, 255, 0.1),
    0 14px 36px rgba(0, 0, 0, 0.2);
}

.sfrb__glow {
  position: absolute;
  inset: -45% -25% auto;
  height: 130px;
  pointer-events: none;
}

.sfrb[data-tone='rise'] .sfrb__glow {
  background: radial-gradient(ellipse at 50% 0%, rgba(14, 203, 129, 0.35), transparent 72%);
}

.sfrb[data-tone='neutral'] .sfrb__glow {
  background: radial-gradient(ellipse at 50% 0%, rgba(91, 140, 255, 0.32), transparent 72%);
}

.sfrb__badge {
  position: relative;
  width: 64px;
  height: 64px;
  margin: 0 auto;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 0 4px rgba(14, 203, 129, 0.15);
}

.sfrb[data-tone='rise'] .sfrb__badge {
  background: linear-gradient(145deg, #3ee4a8, #0ecb81);
  color: #0b1530;
  box-shadow:
    0 0 0 4px rgba(14, 203, 129, 0.2),
    0 10px 26px rgba(14, 203, 129, 0.32);
}

.sfrb[data-tone='neutral'] .sfrb__badge {
  background: linear-gradient(145deg, #7ba3ff, #3084fc);
  color: #fff;
  box-shadow:
    0 0 0 4px rgba(48, 132, 252, 0.2),
    0 10px 26px rgba(48, 132, 252, 0.28);
}

.sfrb__check {
  font-size: 30px;
  font-weight: $font-weight-bold;
  line-height: 1;
}

.sfrb__ribbon {
  position: relative;
  margin: $space-3 0 0;
  font-size: 11px;
  font-weight: $font-weight-bold;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.sfrb[data-tone='rise'] .sfrb__ribbon {
  color: $color-rise;
  text-shadow: 0 0 22px rgba(14, 203, 129, 0.35);
}

.sfrb[data-tone='neutral'] .sfrb__ribbon {
  color: #7ba3ff;
  text-shadow: 0 0 22px rgba(91, 140, 255, 0.35);
}

.sfrb__title {
  position: relative;
  margin: $space-2 0 0;
  font-size: $font-size-lg;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
  line-height: 1.35;
}

.sfrb__desc {
  position: relative;
  margin: $space-2 0 0;
  font-size: $font-size-sm;
  color: $color-text-secondary;
  line-height: 1.6;
}
</style>
