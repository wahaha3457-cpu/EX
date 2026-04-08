<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'

const route = useRoute()
const { t } = useI18n()

const crumbs = computed(() =>
  route.matched
    .filter((r) => r.meta?.titleKey || r.meta?.title)
    .map((r) => ({
      title: (r.meta.titleKey ? (t(r.meta.titleKey as string) as string) : r.meta.title) as string,
      path: r.path,
    })),
)
</script>

<template>
  <el-breadcrumb separator="/" class="admin-bc">
    <el-breadcrumb-item v-for="(c, i) in crumbs" :key="i">
      <router-link v-if="i < crumbs.length - 1" :to="c.path" class="admin-bc__link">
        {{ c.title }}
      </router-link>
      <span v-else class="admin-bc__current">{{ c.title }}</span>
    </el-breadcrumb-item>
  </el-breadcrumb>
</template>

<style scoped lang="scss">
.admin-bc {
  font-size: 13px;
}

.admin-bc__current {
  color: var(--el-text-color-secondary);
  font-weight: 600;
}

.admin-bc__link {
  color: var(--el-color-primary);
  font-weight: 500;
}
</style>
