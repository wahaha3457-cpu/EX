<script setup lang="ts">
import { computed } from 'vue'
import { RouterView } from 'vue-router'
import { useRoute } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import AppMobileDock from '@/components/layout/AppMobileDock.vue'
import { FundPasswordModal } from '@/components/business/fundPassword'
import { RouteNames } from '@/constants/routeNames'

const route = useRoute()

const isHome = computed(() => route.name === RouteNames.Home)

const isTrade = computed(
  () =>
    route.name === RouteNames.SpotTrade ||
    route.name === RouteNames.DemoSpotTrade ||
    route.name === RouteNames.ContractTrade ||
    route.name === RouteNames.DeliveryContract,
)
</script>

<template>
  <div class="ex-layout">
    <AppHeader />
    <main
      class="ex-layout__main"
      :class="{ 'ex-layout__main--flush': isHome, 'ex-layout__main--trade': isTrade }"
    >
      <RouterView />
    </main>
    <AppFooter />
    <AppMobileDock />
    <FundPasswordModal />
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;
@use '@/styles/mixins' as mq;

.ex-layout {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--ex-bg-base);
}

.ex-layout__main {
  flex: 1;
  min-height: 0;
  max-width: 1920px;
  width: 100%;
  margin: 0 auto;
  padding: $space-4;
}

.ex-layout__main--flush {
  padding: 0;
  max-width: none;
}

.ex-layout__main--trade {
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding-top: var(--ex-trade-gap, #{$space-3});
  padding-bottom: var(--ex-trade-gap, #{$space-3});
  padding-left: max(#{$space-3}, env(safe-area-inset-left, 0px));
  padding-right: max(#{$space-3}, env(safe-area-inset-right, 0px));
  max-width: none;
  width: 100%;
  scroll-behavior: smooth;
}

/** 移动端底部主导航占位，避免内容被遮挡 */
@include mq.media-down(md) {
  .ex-layout__main--flush {
    padding-bottom: calc(#{$mobile-dock-height} + env(safe-area-inset-bottom, 0));
  }

  .ex-layout__main:not(.ex-layout__main--flush):not(.ex-layout__main--trade) {
    padding-bottom: calc(#{$mobile-dock-height} + env(safe-area-inset-bottom, 0) + #{$space-4});
  }

  .ex-layout__main--trade {
    padding-bottom: calc(
      #{$mobile-dock-height} + env(safe-area-inset-bottom, 0) + var(--ex-trade-gap, #{$space-3})
    );
    padding-left: max(#{$space-2}, env(safe-area-inset-left, 0px));
    padding-right: max(#{$space-2}, env(safe-area-inset-right, 0px));
  }
}
</style>
