<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAdminLayoutStore } from '@/stores/adminLayout'
import { ADMIN_MENU, type AdminMenuNode } from '@/config/adminMenu'
import AdminSidebarRootSubmenu from '@/components/admin/layout/AdminSidebarRootSubmenu.vue'

const route = useRoute()
const layout = useAdminLayoutStore()
const { sidebarCollapsed } = storeToRefs(layout)

const activePath = computed(() => route.path)

function renderSub(node: AdminMenuNode): boolean {
  return !!node.children?.length
}
</script>

<template>
  <aside class="admin-sidebar" :class="{ 'admin-sidebar--collapsed': sidebarCollapsed }">
    <div class="admin-sidebar__brand">
      <img class="admin-sidebar__logo" src="/brand-logo.png" alt="" width="32" height="32" decoding="async" />
      <span v-if="!sidebarCollapsed" class="admin-sidebar__name">运营控制台</span>
    </div>
    <el-scrollbar class="admin-sidebar__scroll">
      <el-menu
        :default-active="activePath"
        :collapse="sidebarCollapsed"
        :collapse-transition="false"
        menu-trigger="click"
        router
        class="admin-sidebar__menu"
      >
        <template v-for="node in ADMIN_MENU" :key="node.key">
          <AdminSidebarRootSubmenu v-if="renderSub(node)" :node="node" />
          <el-menu-item v-else :index="node.path">
            <el-icon v-if="node.icon"><component :is="node.icon" /></el-icon>
            <template #title>{{ node.title }}</template>
          </el-menu-item>
        </template>
      </el-menu>
    </el-scrollbar>
  </aside>
</template>

<style scoped lang="scss">
@use '@/styles/admin/tokens' as *;

/* $adm-* 仍用于侧栏底色等壳层；文案跟随 .admin-console 的 --el-text-* */

.admin-sidebar {
  display: flex;
  flex-direction: column;
  width: 220px;
  min-height: 100vh;
  background: $adm-bg-sidebar;
  border-right: 1px solid $adm-border-sidebar;
  box-shadow: 4px 0 24px rgba(0, 0, 0, 0.22);
  transition: width 0.2s ease;
}

.admin-sidebar--collapsed {
  width: 64px;
}

.admin-sidebar__brand {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 52px;
  padding: 0 16px;
  border-bottom: 1px solid $adm-border-subtle;
  flex-shrink: 0;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.04) 0%, transparent 100%);
}

.admin-sidebar__logo {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  object-fit: contain;
  display: block;
  flex-shrink: 0;
}

.admin-sidebar__name {
  font-size: 14px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  white-space: nowrap;
}

.admin-sidebar__scroll {
  flex: 1;
  min-height: 0;
}

.admin-sidebar__menu {
  padding: 8px 0 24px;
}

.admin-sidebar--collapsed .admin-sidebar__brand {
  justify-content: center;
  padding: 0 8px;
}
</style>
