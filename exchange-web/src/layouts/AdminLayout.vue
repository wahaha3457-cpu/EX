<script setup lang="ts">
import { useRoute } from 'vue-router'
import AdminSidebar from '@/components/admin/layout/AdminSidebar.vue'
import AdminHeader from '@/components/admin/layout/AdminHeader.vue'
import AdminTagsView from '@/components/admin/layout/AdminTagsView.vue'
import AdminReviewAlertHost from '@/components/admin/notice/AdminReviewAlertHost.vue'

const route = useRoute()
</script>

<template>
  <div class="admin-console">
    <AdminSidebar />
    <div class="admin-main">
      <AdminHeader />
      <div class="admin-main__workspace">
        <div class="admin-main__panel">
          <AdminTagsView />
          <main class="admin-main__body">
            <router-view v-slot="{ Component }">
              <keep-alive :max="30">
                <component :is="Component" v-if="Component" :key="route.fullPath" />
              </keep-alive>
            </router-view>
          </main>
        </div>
      </div>
    </div>
    <AdminReviewAlertHost />
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/admin/tokens' as *;

.admin-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: $adm-bg-main;
  /* 与侧栏接缝：细内阴影强调「主工作区」边界 */
  box-shadow: inset 1px 0 0 $adm-border-sidebar;
}

.admin-main__workspace {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  margin: 12px 20px 24px;
}

.admin-main__panel {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: $adm-bg-well;
  border: 1px solid $adm-border;
  border-radius: 20px;
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.06) inset,
    0 20px 50px rgba(0, 0, 0, 0.38);
  overflow: hidden;
}

.admin-main__body {
  flex: 1;
  min-height: 0;
  padding: 22px 24px 30px;
  overflow: auto;
}

.admin-console {
  display: flex;
  min-height: 100vh;
}

</style>
