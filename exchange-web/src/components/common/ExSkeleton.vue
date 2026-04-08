<template>
  <div class="ex-skeleton" :class="`ex-skeleton--${resolvedVariant}`">
    <template v-if="resolvedVariant === 'stats'">
      <div class="ex-skeleton__row ex-skeleton__row--4">
        <div v-for="n in 4" :key="n" class="ex-skeleton__card">
          <div class="ex-skeleton__line ex-skeleton__line--sm" />
          <div class="ex-skeleton__line ex-skeleton__line--lg" />
          <div class="ex-skeleton__line ex-skeleton__line--md" />
        </div>
      </div>
    </template>

    <template v-else-if="resolvedVariant === 'list'">
      <div v-for="n in 6" :key="n" class="ex-skeleton__list-item">
        <div class="ex-skeleton__avatar" />
        <div class="ex-skeleton__stack">
          <div class="ex-skeleton__line ex-skeleton__line--md" />
          <div class="ex-skeleton__line ex-skeleton__line--sm" />
        </div>
      </div>
    </template>

    <template v-else-if="resolvedVariant === 'table'">
      <div class="ex-skeleton__table">
        <div class="ex-skeleton__table-head">
          <div v-for="n in 5" :key="`head-${n}`" class="ex-skeleton__cell ex-skeleton__cell--head" />
        </div>
        <div v-for="row in 6" :key="`row-${row}`" class="ex-skeleton__table-row">
          <div v-for="col in 5" :key="`cell-${row}-${col}`" class="ex-skeleton__cell" />
        </div>
      </div>
    </template>

    <template v-else-if="resolvedVariant === 'chart'">
      <div class="ex-skeleton__chart" />
    </template>

    <template v-else>
      <div class="ex-skeleton__row ex-skeleton__row--3">
        <div v-for="n in 3" :key="n" class="ex-skeleton__card">
          <div class="ex-skeleton__line ex-skeleton__line--lg" />
          <div class="ex-skeleton__line ex-skeleton__line--md" />
          <div class="ex-skeleton__line ex-skeleton__line--sm" />
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    /** 兼容旧：panel / chart 仍可用 */
    variant?: 'card' | 'table' | 'list' | 'stats' | 'panel' | 'chart'
  }>(),
  {
    variant: 'card',
  },
)

const resolvedVariant = computed(() => {
  if (props.variant === 'panel') return 'card'
  return props.variant
})
</script>

<style scoped lang="scss">
.ex-skeleton {
  position: relative;
  width: 100%;
  min-width: 0;
  background: transparent;
  opacity: 1;
  filter: none;
  backdrop-filter: none;
  pointer-events: none;
}

.ex-skeleton *,
.ex-skeleton *::before,
.ex-skeleton *::after {
  box-sizing: border-box;
}

.ex-skeleton__row {
  display: grid;
  gap: 16px;
}

.ex-skeleton__row--3 {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.ex-skeleton__row--4 {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.ex-skeleton__card,
.ex-skeleton__list-item,
.ex-skeleton__table,
.ex-skeleton__table-head,
.ex-skeleton__table-row,
.ex-skeleton__cell,
.ex-skeleton__avatar,
.ex-skeleton__stack,
.ex-skeleton__chart {
  position: relative;
}

.ex-skeleton__card,
.ex-skeleton__list-item,
.ex-skeleton__table {
  border: 1px solid var(--ex-border-subtle);
  border-radius: 16px;
  background: var(--ex-bg-elevated);
}

.ex-skeleton__card {
  padding: 20px;
}

.ex-skeleton__list-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 18px;
  margin-bottom: 12px;
}

.ex-skeleton__avatar {
  width: 44px;
  height: 44px;
  border-radius: 999px;
  flex-shrink: 0;
}

.ex-skeleton__stack {
  flex: 1;
  min-width: 0;
}

.ex-skeleton__table {
  overflow: hidden;
}

.ex-skeleton__table-head,
.ex-skeleton__table-row {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
  padding: 14px 18px;
}

.ex-skeleton__table-head {
  border-bottom: 1px solid var(--ex-border-subtle);
  background: var(--ex-bg-muted);
}

.ex-skeleton__table-row + .ex-skeleton__table-row {
  border-top: 1px solid var(--ex-border-subtle);
}

.ex-skeleton__cell,
.ex-skeleton__line,
.ex-skeleton__avatar,
.ex-skeleton__chart {
  background: linear-gradient(
    90deg,
    var(--ex-bg-muted) 0%,
    var(--ex-bg-surface) 50%,
    var(--ex-bg-muted) 100%
  );
  background-size: 200% 100%;
  animation: ex-skeleton-shimmer 1.4s ease-in-out infinite;
}

.ex-skeleton__chart {
  min-height: 280px;
  max-height: 360px;
  border-radius: 12px;
  border: 1px solid var(--ex-border-subtle);
}

.ex-skeleton__cell {
  height: 18px;
}

.ex-skeleton__cell--head {
  height: 14px;
}

.ex-skeleton__line {
  height: 14px;
  margin-bottom: 12px;
}

.ex-skeleton__line:last-child {
  margin-bottom: 0;
}

.ex-skeleton__line--sm {
  width: 34%;
}

.ex-skeleton__line--md {
  width: 58%;
}

.ex-skeleton__line--lg {
  width: 82%;
}

@keyframes ex-skeleton-shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

@media (max-width: 1024px) {
  .ex-skeleton__row--3,
  .ex-skeleton__row--4 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .ex-skeleton__table-head,
  .ex-skeleton__table-row {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .ex-skeleton__row--3,
  .ex-skeleton__row--4 {
    grid-template-columns: 1fr;
  }

  .ex-skeleton__table-head,
  .ex-skeleton__table-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
