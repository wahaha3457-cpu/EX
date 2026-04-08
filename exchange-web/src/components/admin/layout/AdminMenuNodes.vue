<script setup lang="ts">
/**
 * 递归渲染后台侧栏子项：支持任意层级。
 * depth=1 视为「二级」（相对一级分组如订单管理）；depth≥2 为更深子级，样式逐级区分。
 */
import type { AdminMenuNode } from '@/config/adminMenu'
/** 自引用递归子树（打包器支持循环依赖） */
import AdminMenuNodesRecursive from './AdminMenuNodes.vue'

withDefaults(
  defineProps<{
    nodes: AdminMenuNode[]
    /** 相对当前一级 SubMenu（如「订单管理」）的深度，从 1 开始 */
    depth: number
    /** 常用功能列表：淡紫分组 + 高亮叶子 */
    quickAccess?: boolean
  }>(),
  { quickAccess: false },
)

function isBranch(n: AdminMenuNode): boolean {
  return !!(n.children && n.children.length > 0)
}
</script>

<template>
  <template v-for="node in nodes" :key="node.key">
    <el-sub-menu
      v-if="isBranch(node)"
      :index="node.key"
      :class="[
        'admin-menu-nodes__sub',
        `admin-menu-nodes__sub--d${depth}`,
        { 'admin-quick__block': quickAccess },
      ]"
    >
      <template #title>
        <span v-if="quickAccess" class="admin-quick__title-wrap">
          <span class="admin-quick__bar" aria-hidden="true" />
          <span class="admin-quick__group-title">{{ node.title }}</span>
          <el-badge
            v-if="node.groupBadge != null && node.groupBadge > 0"
            :max="999"
            :value="node.groupBadge"
            class="admin-quick__group-badge"
          />
        </span>
        <template v-else>
          <span class="admin-menu-nodes__group-title" :data-depth="depth">{{ node.title }}</span>
          <el-badge
            v-if="node.badge != null && node.badge > 0"
            :max="99"
            :value="node.badge"
            class="admin-menu-nodes__group-badge"
          />
        </template>
      </template>
      <AdminMenuNodesRecursive :nodes="node.children!" :depth="depth + 1" :quick-access="quickAccess" />
    </el-sub-menu>
    <el-menu-item
      v-else-if="node.path"
      :index="node.path"
      :class="[
        'admin-menu-nodes__leaf',
        `admin-menu-nodes__leaf--d${depth}`,
        { 'admin-quick__leaf': quickAccess },
      ]"
    >
      <span class="admin-menu-nodes__leaf-inner">
        <el-icon v-if="node.icon" class="admin-menu-nodes__leaf-ic">
          <component :is="node.icon" />
        </el-icon>
        <span class="admin-menu-nodes__leaf-txt">{{ node.title }}</span>
        <el-badge
          v-if="node.badge != null && node.badge > 0"
          :max="99"
          :value="node.badge"
          class="admin-menu-nodes__leaf-badge"
        />
      </span>
    </el-menu-item>
  </template>
</template>

<style scoped lang="scss">
@use '@/styles/admin/tokens' as *;

/* 二级分组标题（合约订单 / 理财订单 / 充提订单） */
.admin-menu-nodes__group-title[data-depth='1'] {
  font-size: 13px;
  font-weight: 650;
  letter-spacing: 0.02em;
  color: color-mix(in srgb, var(--el-text-color-primary) 92%, transparent);
}

/* 二级分组（合约/理财/充提）：圆角线框包裹标题 + 三级区，展开时高度随内容增高 */
.admin-menu-nodes__sub--d1.el-sub-menu {
  margin: 8px 10px 10px;
  padding: 2px 2px 6px;
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 44%, #{$adm-border-subtle});
  border-radius: 12px;
  background: color-mix(in srgb, var(--el-color-primary) 7%, #{$adm-bg-sidebar});
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.06) inset,
    0 0 0 1px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
  box-sizing: border-box;
}

.admin-menu-nodes__sub--d1 :deep(.el-sub-menu__title) {
  padding-left: 12px !important;
  margin: 4px 4px 0;
  border-radius: 10px;
}

/* 二级叶子（现货 / NFT 等）：独立圆角线框，与分组块风格一致 */
.admin-menu-nodes__leaf--d1.el-menu-item {
  margin: 6px 10px 8px !important;
  height: auto !important;
  min-height: 40px;
  padding-top: 10px !important;
  padding-bottom: 10px !important;
  line-height: 1.35 !important;
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 44%, #{$adm-border-subtle});
  border-radius: 12px;
  background: color-mix(in srgb, var(--el-color-primary) 6%, #{$adm-bg-sidebar});
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.05) inset;
  box-sizing: border-box;
}

.admin-menu-nodes__leaf--d1.el-menu-item.is-active {
  border-color: color-mix(in srgb, var(--el-color-primary) 72%, #{$adm-border-subtle});
  background: color-mix(in srgb, var(--el-color-primary) 12%, #{$adm-bg-sidebar});
}

/*
 * 三级路由串联：二级分组（d1）下的内层菜单整体左侧粗色竖线 + 节点刻度，
 * 所有三级 el-menu-item 在同一条竖轨上，层级更醒目。
 */
.admin-menu-nodes__sub--d1 :deep(.el-menu.el-menu--inline) {
  position: relative;
  margin: 6px 6px 8px 8px;
  padding: 8px 8px 10px 18px !important;
  border-left: 4px solid var(--el-color-primary);
  border-radius: 0 12px 12px 0;
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--el-color-primary) 16%, transparent),
    color-mix(in srgb, var(--el-color-primary) 2%, transparent) 48%,
    transparent 85%
  );
  box-shadow:
    inset 2px 0 0 color-mix(in srgb, var(--el-color-primary) 45%, transparent),
    0 1px 0 rgba(255, 255, 255, 0.04);
}

.admin-menu-nodes__sub--d1 :deep(.el-menu--inline > .el-menu-item) {
  position: relative;
  margin-bottom: 2px;
  border-radius: 8px;
}

/* 竖线上的节点圆点（落在粗线中心附近） */
.admin-menu-nodes__sub--d1 :deep(.el-menu--inline > .el-menu-item::before) {
  content: '';
  position: absolute;
  left: -22px;
  top: 50%;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  transform: translateY(-50%);
  background: $adm-bg-sidebar;
  border: 2px solid var(--el-color-primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 22%, transparent);
  z-index: 1;
  pointer-events: none;
}

.admin-menu-nodes__sub--d1 :deep(.el-menu--inline > .el-menu-item.is-active::before) {
  background: var(--el-color-primary);
  border-color: color-mix(in srgb, #fff 55%, var(--el-color-primary));
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 35%, transparent);
}

/* 若日后存在更深分组，用略细、略哑光的线区分 */
.admin-menu-nodes__sub--d2 :deep(.el-menu.el-menu--inline) {
  margin: 4px 4px 8px 8px;
  padding: 6px 8px 8px 16px !important;
  border-left: 3px solid
    color-mix(in srgb, var(--el-color-primary) 65%, var(--el-text-color-secondary));
  border-radius: 0 10px 10px 0;
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--el-color-primary) 8%, transparent),
    transparent 75%
  );
}

/* 三级分组（若以后继续嵌套）*/
.admin-menu-nodes__group-title[data-depth='2'] {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
}

.admin-menu-nodes__sub--d2 :deep(.el-sub-menu__title) {
  padding-left: 22px !important;
}

.admin-menu-nodes__group-badge {
  margin-left: 8px;
}

.admin-menu-nodes__group-badge :deep(.el-badge__content) {
  border: none;
}

/* 二级叶子：现货 / NFT 等 */
.admin-menu-nodes__leaf--d1 {
  padding-right: 10px !important;
}

.admin-menu-nodes__leaf--d1 :deep(.el-menu-item__title),
.admin-menu-nodes__leaf--d1 .admin-menu-nodes__leaf-txt {
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

/* 三级叶子：永续 / 矿机等 — 略小、略淡，左侧由 EP 缩进体现层级 */
.admin-menu-nodes__leaf--d2 {
  padding-right: 10px !important;
}

.admin-menu-nodes__leaf--d2 .admin-menu-nodes__leaf-txt {
  font-size: 12px;
  font-weight: 500;
  color: color-mix(
    in srgb,
    var(--el-text-color-secondary) 45%,
    var(--el-text-color-primary) 55%
  );
}

.admin-menu-nodes__leaf--d2.admin-menu-nodes__leaf.is-active .admin-menu-nodes__leaf-txt {
  color: var(--el-color-primary);
  font-weight: 600;
}

.admin-menu-nodes__leaf-inner {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-width: 0;
}

.admin-menu-nodes__leaf-ic {
  flex-shrink: 0;
  font-size: 16px;
}

.admin-menu-nodes__leaf-txt {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.admin-menu-nodes__leaf-badge {
  flex-shrink: 0;
  margin-left: auto;
}

.admin-menu-nodes__leaf-badge :deep(.el-badge__content) {
  border: none;
}

/* —— 常用功能列表：二级分组（淡紫）+ 三级（亮字 + 图标） —— */
.admin-menu-nodes__sub.admin-quick__block.el-sub-menu {
  margin: 8px 8px 10px !important;
  padding: 4px 4px 8px !important;
  border: 1px solid color-mix(in srgb, #a78bfa 34%, #{$adm-border-subtle}) !important;
  border-radius: 12px !important;
  background: linear-gradient(
    180deg,
    color-mix(in srgb, #7c3aed 14%, #{$adm-bg-sidebar}),
    color-mix(in srgb, #0f172a 18%, #{$adm-bg-sidebar})
  ) !important;
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.05) inset,
    0 8px 20px rgba(0, 0, 0, 0.2) !important;
}

.admin-menu-nodes__sub.admin-quick__block :deep(.el-sub-menu__title) {
  padding-left: 8px !important;
  margin: 4px 4px 0 !important;
  border-radius: 8px;
}

.admin-quick__title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-width: 0;
}

.admin-quick__bar {
  width: 3px;
  height: 14px;
  border-radius: 2px;
  flex-shrink: 0;
  background: linear-gradient(180deg, #ddd6fe, #7c3aed);
  box-shadow: 0 0 12px color-mix(in srgb, #a78bfa 45%, transparent);
}

.admin-quick__group-title {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.06em;
  color: #ddd6fe !important;
}

.admin-quick__group-badge {
  margin-left: auto;
  flex-shrink: 0;
}

.admin-quick__group-badge :deep(.el-badge__content) {
  border: none;
  font-weight: 800;
}

.admin-menu-nodes__sub.admin-quick__block :deep(.el-menu.el-menu--inline) {
  /* 三级区域整体左移，给标题留宽；勿过大 padding-left 叠 EP 默认缩进 */
  margin: 4px 4px 6px 4px !important;
  padding: 4px 4px 6px 6px !important;
  border-left: 2px solid color-mix(in srgb, #c4b5fd 50%, transparent) !important;
  border-radius: 0 10px 10px 0;
  background: color-mix(in srgb, #020617 25%, transparent) !important;
  box-shadow: none !important;
}

/* 覆盖 Element Plus 对嵌套 menu-item 的 padding-left（默认约 20×层级），避免三级文字被挤成省略号 */
.admin-menu-nodes__sub.admin-quick__block :deep(.el-menu--inline > .el-menu-item) {
  padding-left: 8px !important;
  padding-right: 6px !important;
}

.admin-menu-nodes__sub.admin-quick__block :deep(.el-menu--inline > .el-menu-item::before) {
  display: none !important;
}

.admin-quick__leaf.el-menu-item {
  border-radius: 8px !important;
  margin-bottom: 4px !important;
}

.admin-quick__leaf .admin-menu-nodes__leaf-txt {
  color: rgba(248, 250, 252, 0.96) !important;
  font-weight: 600 !important;
  font-size: 13px !important;
}

.admin-quick__leaf .admin-menu-nodes__leaf-ic {
  color: #c4b5fd !important;
  opacity: 1 !important;
}

.admin-quick__leaf.admin-menu-nodes__leaf.is-active .admin-menu-nodes__leaf-txt {
  color: #fff !important;
}

.admin-quick__leaf.admin-menu-nodes__leaf.is-active {
  background: color-mix(in srgb, var(--el-color-primary) 22%, transparent) !important;
}
</style>
