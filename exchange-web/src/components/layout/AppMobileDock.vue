<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Coin, Histogram, HomeFilled, User, Wallet } from '@element-plus/icons-vue'
import { MOBILE_DOCK_ITEMS } from '@/config/mainNav'

const { t } = useI18n()
const route = useRoute()

const icons: Record<string, typeof HomeFilled> = {
  home: HomeFilled,
  market: Histogram,
  trade: Coin,
  assets: Wallet,
  user: User,
}

function isActive(names: string[]) {
  return names.includes((route.name as string) || '')
}
</script>

<template>
  <nav class="ex-mdock" :aria-label="t('layout.dockNavAria')">
    <RouterLink
      v-for="item in MOBILE_DOCK_ITEMS"
      :key="item.key"
      :to="item.to"
      class="ex-mdock__item"
      :class="{ 'ex-mdock__item--on': isActive(item.routeNames) }"
    >
      <span class="ex-mdock__icon" aria-hidden="true">
        <component :is="icons[item.key]" class="ex-mdock__svg" />
      </span>
      <span class="ex-mdock__label">{{ t(item.labelKey) }}</span>
    </RouterLink>
  </nav>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;
@use '@/styles/mixins' as mq;

.ex-mdock {
  display: none;
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 90;
  height: calc(#{$mobile-dock-height} + env(safe-area-inset-bottom, 0));
  padding-bottom: env(safe-area-inset-bottom, 0);
  box-sizing: border-box;
  border-top: 1px solid var(--ex-border);
  /* 禁用 backdrop-filter：fixed 底栏 + blur 在 WebKit 上易触发整视口发灰/白朦（SPA 切页不卸载底栏，现象会带到其他页） */
  background: color-mix(in srgb, var(--ex-bg-elevated) 96%, var(--ex-border));
  flex-direction: row;
  align-items: stretch;
  justify-content: space-around;
  gap: 0;
  box-shadow: var(--ex-shadow-card);
}

@include mq.media-down(md) {
  .ex-mdock {
    display: flex;
  }
}

.ex-mdock__item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  min-width: 0;
  padding: $space-1 $space-1;
  font-size: $font-size-xxs;
  font-weight: $font-weight-semibold;
  color: var(--ex-text-tertiary);
  text-decoration: none;
  border: none;
  background: transparent;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.ex-mdock__item:hover,
.ex-mdock__item:focus-visible {
  color: var(--ex-text-secondary);
  background: var(--ex-fill-hover-subtle);
}

.ex-mdock__item--on {
  color: var(--ex-brand);
}

:global([data-theme='monochrome']) .ex-mdock__item--on {
  color: var(--ex-link-hover);
}

.ex-mdock__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 0;
  opacity: 0.95;
}

.ex-mdock__svg {
  width: 20px;
  height: 20px;
}

.ex-mdock__item--on .ex-mdock__svg {
  color: var(--ex-brand);
  filter: drop-shadow(0 0 6px color-mix(in srgb, var(--ex-brand) 45%, transparent));
}

:global([data-theme='monochrome']) .ex-mdock__item--on .ex-mdock__svg {
  color: var(--ex-link-hover);
  filter: drop-shadow(0 0 4px rgba(90, 66, 0, 0.35));
}

.ex-mdock__label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}
</style>
