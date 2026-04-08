<script setup lang="ts">
import { RouterLink } from 'vue-router'
import type { RouteLocationRaw } from 'vue-router'

defineProps<{
  items: { label: string; to: RouteLocationRaw }[]
}>()
</script>

<template>
  <div class="ex-subnav">
    <div class="ex-subnav__inner">
      <RouterLink v-for="(it, i) in items" :key="i" :to="it.to" class="ex-subnav__item" active-class="ex-subnav__item--active">
        {{ it.label }}
      </RouterLink>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;
@use '@/styles/mixins' as mq;

.ex-subnav {
  height: $subnav-height;
  border-bottom: 1px solid $color-border;
  background: $color-bg-base;
  position: sticky;
  top: $header-height;
  z-index: $z-sticky;
}

.ex-subnav__inner {
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 $space-4;
  height: 100%;
  display: flex;
  align-items: center;
  gap: $space-4;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-x: contain;
  flex-wrap: nowrap;
}

@include mq.media-down(md) {
  .ex-subnav__inner {
    gap: $space-3;
    padding: 0 var(--ex-gutter-x, #{$space-4});
  }

  .ex-subnav__item {
    flex: 0 0 auto;
    white-space: nowrap;
  }
}

.ex-subnav__item {
  font-size: $font-size-sm;
  color: $color-text-tertiary;
  padding: $space-2 0;
  border-bottom: 2px solid transparent;
}

.ex-subnav__item:hover {
  color: $color-text-primary;
}

.ex-subnav__item--active {
  color: $color-brand;
  border-bottom-color: $color-brand;
}
</style>
