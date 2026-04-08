<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'
import { RouteNames } from '@/constants/routeNames'

const route = useRoute()

const links = [
  { name: RouteNames.AnnounceCenter, to: '/support/announce', label: '公告中心' },
  { name: RouteNames.ActivityCenter, to: '/support/activity', label: '活动中心' },
  { name: RouteNames.SupportCenter, to: '/support/service', label: '客服中心' },
]
</script>

<template>
  <nav class="sh-nav" aria-label="支持中心导航">
    <RouterLink
      v-for="l in links"
      :key="l.to"
      :to="l.to"
      class="sh-nav__a"
      :class="{ 'sh-nav__a--on': route.name === l.name }"
    >
      {{ l.label }}
    </RouterLink>
  </nav>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;
@use '@/styles/mixins' as mq;

.sh-nav {
  display: flex;
  flex-wrap: wrap;
  gap: $space-1;
  padding: 4px;
  margin-bottom: $space-4;
  border-radius: $radius-md;
  background: var(--ex-surface-inset);
  border: 1px solid $color-border;
}

.sh-nav__a {
  flex: 1;
  min-width: 96px;
  text-align: center;
  padding: $space-2 $space-3;
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  color: $color-text-tertiary;
  text-decoration: none;
  border-radius: $radius-sm;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: color 0.15s, background 0.15s;

  @include mq.media-up(md) {
    min-width: 120px;
  }
}

.sh-nav__a:hover {
  color: $color-text-primary;
  background: var(--ex-fill-ghost);
}

.sh-nav__a--on {
  color: $color-text-primary;
  background: rgba(240, 185, 11, 0.14);
  box-shadow: 0 0 0 1px rgba(240, 185, 11, 0.25);
}
</style>
