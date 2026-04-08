<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useUserCenterStore } from '@/stores/userCenter'
import type { UserCenterNavTab } from '@/types/userCenter'

const store = useUserCenterStore()
const { activeTab } = storeToRefs(store)

const items: { key: UserCenterNavTab; label: string; tag?: string }[] = [
  { key: 'overview', label: '账户总览' },
  { key: 'security', label: '安全中心' },
  { key: 'kyc', label: '身份认证' },
  { key: 'api', label: 'API 管理', tag: '预留' },
  { key: 'login', label: '登录记录' },
  { key: 'preferences', label: '偏好设置' },
]
</script>

<template>
  <nav class="uc-nav" aria-label="用户中心菜单">
    <button
      v-for="item in items"
      :key="item.key"
      type="button"
      class="uc-nav__item"
      :class="{ 'uc-nav__item--on': activeTab === item.key }"
      @click="store.setTab(item.key)"
    >
      <span class="uc-nav__text">{{ item.label }}</span>
      <span v-if="item.tag" class="uc-nav__tag">{{ item.tag }}</span>
    </button>
  </nav>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;
@use '@/styles/mixins' as mq;

.uc-nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: $space-2;
  border: 1px solid $color-border;
  border-radius: $radius-lg;
  background: $color-bg-elevated;
  min-width: 200px;
}

.uc-nav__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-2;
  width: 100%;
  padding: $space-3 $space-3;
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  color: $color-text-tertiary;
  background: transparent;
  border: none;
  border-radius: $radius-md;
  cursor: pointer;
  text-align: left;
  transition:
    background 0.15s ease,
    color 0.15s ease;
}

.uc-nav__item:hover {
  color: $color-text-secondary;
  background: var(--ex-fill-ghost);
}

.uc-nav__item--on {
  color: $color-text-primary;
  background: $color-bg-surface;
  box-shadow: inset 3px 0 0 $color-brand;
}

@include mq.media-down(lg) {
  .uc-nav {
    flex-direction: row;
    flex-wrap: nowrap;
    min-width: 0;
    width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior-x: contain;
    padding: $space-2;
    gap: $space-1;
  }

  .uc-nav__item {
    flex: 0 0 auto;
    justify-content: center;
    min-height: $control-height-lg;
    padding: $space-2 $space-4;
    border-radius: $radius-md;
  }

  .uc-nav__item--on {
    box-shadow: inset 0 -2px 0 $color-brand;
  }
}

.uc-nav__tag {
  font-size: 9px;
  padding: 1px 5px;
  border-radius: 2px;
  background: rgba(240, 185, 11, 0.12);
  color: $color-brand;
  font-weight: $font-weight-bold;
}
</style>
