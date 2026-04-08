<script setup lang="ts">
import type { AdminMenuNode } from '@/config/adminMenu'
import AdminMenuNodes from '@/components/admin/layout/AdminMenuNodes.vue'

defineProps<{
  node: AdminMenuNode
}>()
</script>

<template>
  <el-sub-menu :index="node.key" :class="{ 'admin-sidebar__quick-root': node.quickAccess }">
    <template #title>
      <span
        class="admin-sidebar__quick-title-wrap"
        :class="{ 'admin-sidebar__quick-title-wrap--hot': node.quickAccess }"
      >
        <el-icon v-if="node.icon" class="admin-sidebar__quick-ic"><component :is="node.icon" /></el-icon>
        <span class="admin-sidebar__quick-txt">{{ node.title }}</span>
      </span>
    </template>
    <AdminMenuNodes :nodes="node.children!" :depth="1" :quick-access="!!node.quickAccess" />
  </el-sub-menu>
</template>

<style scoped lang="scss">
@use '@/styles/admin/tokens' as *;

/* 常用功能列表：一级入口高亮 */
.admin-sidebar__quick-root :deep(.el-sub-menu__title) {
  margin: 4px 8px 6px;
  padding: 10px 12px !important;
  border-radius: 12px;
  border: 1px solid color-mix(in srgb, #a78bfa 42%, #{$adm-border-subtle});
  background: linear-gradient(
    125deg,
    color-mix(in srgb, #7c3aed 28%, #{$adm-bg-sidebar}),
    color-mix(in srgb, #2563eb 14%, #{$adm-bg-sidebar}) 55%,
    color-mix(in srgb, #0f172a 20%, #{$adm-bg-sidebar})
  );
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.07) inset,
    0 10px 26px rgba(0, 0, 0, 0.28);
}

.admin-sidebar__quick-title-wrap {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-width: 0;
}

.admin-sidebar__quick-title-wrap--hot .admin-sidebar__quick-txt {
  font-weight: 800;
  letter-spacing: 0.04em;
  background: linear-gradient(90deg, #f5f3ff, #c4b5fd 45%, #93c5fd);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

/* 图标颜色由全局 admin _sidebar-icons.scss 统一（避免折叠态线/面/灰白不一致） */
.admin-sidebar__quick-ic {
  flex-shrink: 0;
}

.admin-sidebar__quick-title-wrap:not(.admin-sidebar__quick-title-wrap--hot) .admin-sidebar__quick-txt {
  font-weight: 700;
  color: var(--el-text-color-primary);
}
</style>
