<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { RouteNames } from '@/constants/routeNames'

const route = useRoute()
const inHub = computed(() => route.path.startsWith('/account/'))
const { t } = useI18n()

const orderNav = computed(() => [
  { name: RouteNames.OrdersLedger, label: t('layout.ordersLedger') },
  { name: RouteNames.OrdersSpot, label: t('layout.ordersSpot') },
  { name: RouteNames.OrdersContract, label: t('layout.ordersContract') },
  { name: RouteNames.OrdersC2C, label: t('layout.ordersC2c') },
  { name: RouteNames.OrdersConvert, label: t('layout.ordersConvert') },
  { name: RouteNames.OrdersEarn, label: t('layout.ordersEarn') },
  { name: RouteNames.OrdersNft, label: t('layout.ordersNft') },
])
</script>

<template>
  <div class="oc" :class="{ 'oc--hub': inHub }">
    <header class="oc__hero">
      <div>
        <h1 class="oc__title">{{ t('layout.ordersCenterTitle') }}</h1>
        <p class="oc__sub">{{ t('layout.ordersCenterSub') }}</p>
      </div>
    </header>

    <div class="oc__body">
      <aside class="oc__side" aria-label="订单导航">
        <nav class="oc__nav" aria-label="订单类型">
          <p class="oc__nav-head">{{ t('layout.ordersCenterNavCaption') }}</p>
          <RouterLink
            v-for="item in orderNav"
            :key="item.name"
            :to="{ name: item.name }"
            class="oc__nav-item"
            :class="{ 'oc__nav-item--on': route.name === item.name }"
          >
            {{ item.label }}
          </RouterLink>
        </nav>
      </aside>

      <main class="oc__main">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;
@use '@/styles/mixins' as mq;

.oc {
  width: 100%;
  max-width: min(1120px, var(--ex-container-max));
  margin: 0 auto;
  padding-bottom: $space-8;
  min-width: 0;
  box-sizing: border-box;
}

.oc__hero {
  margin-bottom: $space-4;
}

.oc__title {
  margin: 0 0 $space-1;
  font-size: $font-size-xxl;
  font-weight: $font-weight-bold;
  letter-spacing: -0.02em;
  color: $color-text-primary;
}

.oc__sub {
  margin: 0;
  font-size: $font-size-sm;
  color: $color-text-tertiary;
  line-height: 1.55;
  max-width: 720px;
}

.oc__body {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: $space-5;
  align-items: start;
}

@include mq.media-down(lg) {
  .oc__body {
    grid-template-columns: 1fr;
    gap: $space-3;
  }
}

.oc__side {
  min-width: 0;
}

.oc__nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: $space-3;
  border: 1px solid $color-border;
  border-radius: $radius-lg;
  background: var(--ex-card-surface);
}

.oc__nav-head {
  margin: 0 0 $space-2;
  padding: 0 $space-1;
  font-size: 11px;
  font-weight: $font-weight-bold;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: $color-text-tertiary;
}

.oc__nav-item {
  display: block;
  padding: $space-3 $space-3;
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  color: $color-text-tertiary;
  text-decoration: none;
  border-radius: $radius-md;
  transition:
    background 0.15s ease,
    color 0.15s ease;

  &:hover {
    color: $color-text-secondary;
    background: var(--ex-fill-ghost);
  }
}

.oc__nav-item--on {
  color: $color-text-primary;
  background: var(--ex-panel-sunken);
  box-shadow: inset 3px 0 0 $color-brand;
}

.oc__main {
  min-width: 0;
}

@include mq.media-down(lg) {
  .oc__nav {
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    gap: $space-1;
    padding: $space-2;
  }

  .oc__nav-head {
    flex: 1 1 100%;
    margin-bottom: $space-1;
  }

  .oc__nav-item {
    flex: 1 1 auto;
    text-align: center;
    min-width: calc(50% - 4px);
    padding: $space-2 $space-3;
  }

  .oc__nav-item--on {
    box-shadow: inset 0 -2px 0 $color-brand;
    background: var(--ex-fill-ghost);
  }
}

@include mq.media-down(md) {
  .oc__title {
    font-size: $font-size-xl;
  }
}

.oc--hub {
  max-width: none;
  margin: 0;
  padding-bottom: 0;
}

.oc--hub .oc__hero {
  margin-bottom: $space-3;
}

.oc--hub .oc__title {
  font-size: $font-size-xl;
}

.oc--hub .oc__sub {
  font-size: $font-size-xs;
  max-width: 100%;
}
</style>
