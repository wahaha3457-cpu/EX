<script setup lang="ts">
withDefaults(
  defineProps<{
    rows?: number
    /** 更矮的行，用于首页小列表 */
    compact?: boolean
  }>(),
  { rows: 4, compact: false },
)
</script>

<template>
  <div class="sk" :class="{ 'sk--compact': compact }" aria-hidden="true">
    <div v-for="n in rows" :key="n" class="sk__row">
      <div class="sk__line sk__line--lg" />
      <div class="sk__line sk__line--sm" />
      <div class="sk__meta">
        <span class="sk__pill" />
        <span class="sk__pill sk__pill--short" />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@keyframes sk-shine {
  0% {
    opacity: 0.45;
  }
  50% {
    opacity: 0.9;
  }
  100% {
    opacity: 0.45;
  }
}

.sk {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 4px 0 8px;
}

.sk__row {
  border-radius: 20px;
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(22, 28, 38, 0.55);
}

.sk--compact .sk__row {
  padding: 14px;
}

.sk__line {
  height: 10px;
  border-radius: 6px;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.06) 0%,
    rgba(46, 230, 200, 0.12) 50%,
    rgba(255, 255, 255, 0.06) 100%
  );
  background-size: 200% 100%;
  animation: sk-shine 1.4s ease-in-out infinite;
  margin-bottom: 10px;

  &--lg {
    width: 72%;
  }

  &--sm {
    width: 48%;
    height: 8px;
    margin-bottom: 12px;
  }
}

.sk__meta {
  display: flex;
  gap: 8px;
}

.sk__pill {
  height: 8px;
  width: 56px;
  border-radius: 999px;
  background: rgba(77, 196, 255, 0.12);
  animation: sk-shine 1.4s ease-in-out infinite;
  animation-delay: 0.15s;

  &--short {
    width: 40px;
    opacity: 0.8;
  }
}
</style>
