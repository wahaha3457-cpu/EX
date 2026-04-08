<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { ArrowDown, Close } from '@element-plus/icons-vue'
import { useAdminLayoutStore, type AdminTabItem } from '@/stores/adminLayout'
import { getAdminRouteLeafTitle } from '@/utils/adminRouteTitle'
import { adminPath } from '@/utils/adminPublicPath'

const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n()
const layout = useAdminLayoutStore()
const { tabs } = storeToRefs(layout)

const itemEls = ref<Map<string, HTMLElement>>(new Map())

function setTabEl(fullPath: string, el: unknown) {
  if (el instanceof HTMLElement) itemEls.value.set(fullPath, el)
  else itemEls.value.delete(fullPath)
}

function syncFromRoute() {
  const title = getAdminRouteLeafTitle(route, t)
  layout.upsertTabFromRoute(route, title)
}

watch(
  () => [route.fullPath, route.matched.length, locale.value] as const,
  () => {
    syncFromRoute()
    void nextTick(() => scrollActiveIntoView())
  },
  { immediate: true },
)

function scrollActiveIntoView() {
  const el = itemEls.value.get(route.fullPath)
  el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
}

function onTabClick(tab: AdminTabItem) {
  if (tab.fullPath !== route.fullPath) void router.push(tab.fullPath)
}

function onCloseTab(tab: AdminTabItem, e?: Event) {
  e?.preventDefault()
  e?.stopPropagation()
  const current = route.fullPath
  const list = layout.tabs
  const idx = list.findIndex((x) => x.fullPath === tab.fullPath)
  if (idx === -1) return
  const neighbor = list[idx + 1] ?? list[idx - 1]
  layout.removeTab(tab.fullPath)
  if (current === tab.fullPath) {
    if (neighbor) void router.push(neighbor.fullPath)
    else void router.push({ path: adminPath('/dashboard') })
  }
}

function onDropCommand(cmd: string) {
  if (cmd === 'closeOthers') {
    layout.closeOtherTabs(route.fullPath)
    return
  }
  if (cmd === 'closeAll') {
    layout.closeAllTabs()
    void router.push({ path: adminPath('/dashboard') })
  }
}
</script>

<template>
  <div v-if="tabs.length" class="admin-tags">
    <div class="admin-tags__scroll">
      <button
        v-for="tab in tabs"
        :key="tab.fullPath"
        :ref="(el) => setTabEl(tab.fullPath, el)"
        type="button"
        class="admin-tags__item"
        :class="{ 'admin-tags__item--active': tab.fullPath === route.fullPath }"
        @click="onTabClick(tab)"
        @click.middle.prevent="onCloseTab(tab)"
      >
        <span class="admin-tags__text">{{ tab.title }}</span>
        <span
          class="admin-tags__close"
          role="button"
          tabindex="-1"
          aria-label="关闭"
          @click.stop="onCloseTab(tab, $event)"
        >
          <el-icon><Close /></el-icon>
        </span>
      </button>
    </div>
    <el-dropdown trigger="click" @command="onDropCommand">
      <el-button class="admin-tags__more" text :icon="ArrowDown" aria-label="页签菜单" />
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item command="closeOthers">关闭其他</el-dropdown-item>
          <el-dropdown-item command="closeAll" divided>关闭全部</el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/admin/tokens' as *;

.admin-tags {
  display: flex;
  align-items: stretch;
  gap: 6px;
  flex-shrink: 0;
  padding: 8px 10px 8px 12px;
  background: color-mix(in srgb, $adm-bg-well 88%, $adm-bg-header);
  border-bottom: 1px solid $adm-border-subtle;
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.04) inset;
}

.admin-tags__scroll {
  display: flex;
  align-items: stretch;
  gap: 4px;
  flex: 1;
  min-width: 0;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: thin;

  &::-webkit-scrollbar {
    height: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: color-mix(in srgb, var(--el-text-color-secondary) 35%, transparent);
    border-radius: 4px;
  }
}

.admin-tags__item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 200px;
  padding: 6px 8px 6px 12px;
  margin: 0;
  border: 1px solid transparent;
  border-radius: 8px;
  background: color-mix(in srgb, var(--el-bg-color) 72%, transparent);
  color: var(--el-text-color-secondary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  transition:
    color 0.12s ease,
    background 0.12s ease,
    border-color 0.12s ease;

  &:hover {
    color: var(--el-text-color-primary);
    background: color-mix(in srgb, var(--el-bg-color) 88%, transparent);
  }
}

.admin-tags__item--active {
  color: var(--el-text-color-primary);
  font-weight: 600;
  background: color-mix(in srgb, var(--el-color-primary) 14%, var(--el-bg-color));
  border-color: color-mix(in srgb, var(--el-color-primary) 42%, var(--el-border-color-light));
  box-shadow: 0 2px 0 var(--el-color-primary);
}

.admin-tags__text {
  overflow: hidden;
  text-overflow: ellipsis;
}

.admin-tags__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 4px;
  color: var(--el-text-color-secondary);
  flex-shrink: 0;

  &:hover {
    color: var(--el-text-color-primary);
    background: color-mix(in srgb, var(--el-fill-color) 80%, transparent);
  }

  .el-icon {
    font-size: 12px;
  }
}

.admin-tags__more {
  flex-shrink: 0;
  align-self: center;
  color: var(--el-text-color-secondary);
  padding: 6px 8px;
  border-radius: 8px;

  &:hover {
    color: var(--el-text-color-primary);
    background: color-mix(in srgb, var(--el-fill-color) 70%, transparent);
  }
}
</style>
