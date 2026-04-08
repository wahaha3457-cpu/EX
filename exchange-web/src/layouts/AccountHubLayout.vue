<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { RouteNames } from '@/constants/routeNames'
import { useUserCenterStore } from '@/stores/userCenter'
import SecurityCenterFlowModals from '@/components/business/userCenter/SecurityCenterFlowModals.vue'

const route = useRoute()
const { t } = useI18n()
const userCenter = useUserCenterStore()

const ORDER_WORKSPACE_NAMES = [
  RouteNames.OrdersSpot,
  RouteNames.OrdersContract,
  RouteNames.OrdersC2C,
  RouteNames.OrdersConvert,
  RouteNames.OrdersEarn,
  RouteNames.OrdersNft,
] as const

const nav = computed(() => [
  { name: RouteNames.AccountOverview, label: t('accountHub.nav.overview'), kind: 'route' as const },
  { name: RouteNames.Assets, label: t('accountHub.nav.assets'), kind: 'route' as const },
  { name: RouteNames.OrdersSpot, label: t('accountHub.nav.orders'), kind: 'orders' as const },
  { name: RouteNames.OrdersLedger, label: t('accountHub.nav.ledger'), kind: 'route' as const },
  { name: RouteNames.AccountSecurity, label: t('accountHub.nav.security'), kind: 'route' as const },
  { name: RouteNames.Verification, label: t('accountHub.nav.verification'), kind: 'route' as const },
  { name: RouteNames.AccountApi, label: t('accountHub.nav.api'), kind: 'route' as const },
  { name: RouteNames.AccountSessions, label: t('accountHub.nav.sessions'), kind: 'route' as const },
  { name: RouteNames.Preferences, label: t('accountHub.nav.preferences'), kind: 'route' as const },
])

function isActive(item: { name: string; kind: string }) {
  const n = route.name as string | undefined
  if (item.kind === 'orders') {
    return n ? ORDER_WORKSPACE_NAMES.includes(n as (typeof ORDER_WORKSPACE_NAMES)[number]) : false
  }
  return n === item.name
}

onMounted(() => {
  void userCenter.bootstrap()
})
</script>

<template>
  <div class="ex-account-hub">
    <header class="ex-account-hub__mast">
      <h1 class="ex-account-hub__title">{{ t('accountHub.title') }}</h1>
      <p class="ex-account-hub__lead">{{ t('accountHub.lead') }}</p>
    </header>

    <div class="ex-account-hub__shell">
      <aside class="ex-account-hub__side" aria-label="Account">
        <nav class="ex-hub-nav" :aria-label="t('accountHub.navAria')">
          <RouterLink
            v-for="item in nav"
            :key="item.name"
            :to="{ name: item.name }"
            class="ex-hub-nav__link"
            :class="{ 'ex-hub-nav__link--on': isActive(item) }"
          >
            {{ item.label }}
          </RouterLink>
        </nav>
      </aside>

      <div class="ex-account-hub__main">
        <RouterView v-slot="{ Component }">
          <component :is="Component" />
        </RouterView>
      </div>
    </div>

    <!-- 账户总览与安全页共用同一套演示弹窗，避免总览页未挂载安全面板时无法打开流程 -->
    <SecurityCenterFlowModals />
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;
@use '@/styles/mixins' as mq;

.ex-account-hub {
  width: 100%;
  max-width: min(1400px, var(--ex-container-max));
  margin: 0 auto;
  padding: $space-5 var(--ex-gutter-x, 16px) $space-8;
  box-sizing: border-box;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: $space-5;
}

.ex-account-hub__mast {
  display: flex;
  flex-direction: column;
  gap: $space-1;
  padding-bottom: 2px;
  border-bottom: 1px solid var(--ex-border-subtle);
}

.ex-account-hub__title {
  margin: 0;
  font-size: $font-size-xxl;
  font-weight: $font-weight-bold;
  letter-spacing: -0.02em;
  color: var(--ex-text-primary);
}

.ex-account-hub__lead {
  margin: 0;
  font-size: $font-size-sm;
  color: var(--ex-text-tertiary);
  line-height: 1.55;
  max-width: 56ch;
}

.ex-account-hub__shell {
  display: grid;
  grid-template-columns: 232px minmax(0, 1fr);
  gap: $space-6;
  align-items: start;
}

.ex-account-hub__side {
  position: sticky;
  top: calc(var(--ex-header-height, 56px) + 12px);
  min-width: 0;
}

.ex-account-hub__main {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

@include mq.media-down(lg) {
  .ex-account-hub__shell {
    grid-template-columns: 1fr;
    gap: $space-4;
  }

  .ex-account-hub__side {
    position: static;
    top: auto;
  }
}

.ex-hub-nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: $space-2;
  border-radius: var(--ex-radius-lg);
  border: 1px solid var(--ex-border);
  background: var(--ex-bg-elevated);
  box-shadow: var(--ex-shadow-sm);
}

.ex-hub-nav__link {
  display: block;
  padding: $space-2 $space-3;
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  color: var(--ex-text-secondary);
  text-decoration: none;
  border-radius: var(--ex-radius-md);
  transition:
    background var(--ex-transition-fast),
    color var(--ex-transition-fast);
}

.ex-hub-nav__link:hover {
  color: var(--ex-text-primary);
  background: var(--ex-fill-hover-subtle);
}

.ex-hub-nav__link--on {
  color: var(--ex-text-primary);
  background: var(--ex-fill-ghost);
  box-shadow: inset 3px 0 0 var(--ex-brand);
}

@include mq.media-down(lg) {
  .ex-hub-nav {
    flex-direction: row;
    flex-wrap: nowrap;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    padding: $space-2;
    gap: $space-1;
  }

  .ex-hub-nav__link {
    flex: 0 0 auto;
    white-space: nowrap;
  }

  .ex-hub-nav__link--on {
    box-shadow: inset 0 -2px 0 var(--ex-brand);
  }
}
</style>
