<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { RouteNames } from '@/constants/routeNames'

const route = useRoute()

const tabs = [
  { key: 'home', name: RouteNames.MobileHome, to: '/m/home', label: '首页', icon: '⌂' },
  { key: 'market', name: RouteNames.MobileMarket, to: '/m/market', label: '市场', icon: '≋' },
  { key: 'publish', name: RouteNames.MobilePublish, to: '/m/publish', label: '发布', icon: '⊕' },
  { key: 'assets', name: RouteNames.MobileAssets, to: '/m/assets', label: '资产', icon: '◈' },
  { key: 'profile', name: RouteNames.MobileProfile, to: '/m/profile', label: '我的', icon: '◎' },
] as const

/** 子页面仍高亮所属 Tab */
function resolveTabKey(path: string): string {
  if (path.startsWith('/m/home')) return 'home'
  if (
    path.startsWith('/m/market') ||
    path.startsWith('/m/otc/') ||
    path.startsWith('/m/task/') ||
    path.startsWith('/m/service/')
  )
    return 'market'
  if (path.startsWith('/m/publish') || path.startsWith('/m/escrow/')) return 'publish'
  if (path.startsWith('/m/assets')) return 'assets'
  if (
    path.startsWith('/m/profile') ||
    path.startsWith('/m/me/') ||
    path.startsWith('/m/settings') ||
    path.startsWith('/m/help') ||
    path.startsWith('/m/security') ||
    path.startsWith('/m/inbox')
  )
    return 'profile'
  return 'home'
}

const activeKey = computed(() => resolveTabKey(route.path))
</script>

<template>
  <nav class="m-tabbar" aria-label="主导航">
    <div class="m-tabbar__inner">
      <RouterLink
        v-for="t in tabs"
        :key="t.name"
        :to="{ name: t.name }"
        class="m-tab"
        :class="{ 'is-active': activeKey === t.key }"
      >
        <span class="m-tab__ic" aria-hidden="true">{{ t.icon }}</span>
        <span class="m-tab__tx">{{ t.label }}</span>
        <span class="m-tab__dot" aria-hidden="true" />
      </RouterLink>
    </div>
  </nav>
</template>

<style scoped lang="scss">
.m-tabbar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 200;
  padding: 10px 10px max(12px, env(safe-area-inset-bottom));
  background: linear-gradient(180deg, transparent 0%, rgba(10, 12, 16, 0.92) 28%);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 -20px 48px rgba(0, 0, 0, 0.35);
}

.m-tabbar__inner {
  max-width: 390px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: stretch;
  gap: 2px;
}

.m-tab {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  padding: 6px 2px 4px;
  text-decoration: none;
  color: #8b95a8;
  border-radius: 14px;
  transition:
    color 0.2s ease,
    background 0.2s ease;
  -webkit-tap-highlight-color: transparent;

  &:active {
    background: rgba(46, 230, 200, 0.06);
  }
}

.m-tab__ic {
  font-size: 20px;
  line-height: 1;
  opacity: 0.92;
}

.m-tab__tx {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.02em;
  white-space: nowrap;
}

.m-tab.is-active {
  color: #2ee6c8;

  .m-tab__ic {
    filter: drop-shadow(0 0 10px rgba(46, 230, 200, 0.45));
  }

  .m-tab__tx {
    font-weight: 700;
  }
}

.m-tab__dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #2ee6c8;
  margin-top: 2px;
  opacity: 0;
  transform: scale(0);
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.m-tab.is-active .m-tab__dot {
  opacity: 1;
  transform: scale(1);
}
</style>
