<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { RouteNames } from '@/constants/routeNames'

withDefaults(
  defineProps<{
    title?: string
    description?: string
  }>(),
  {
    title: '请先登录',
    description: '登录后可查看完整功能与资产数据。',
  },
)

const route = useRoute()
const loginTo = computed(() => ({
  name: RouteNames.Login,
  query: { redirect: route.fullPath },
}))
const registerTo = computed(() => ({
  name: RouteNames.Register,
  query: { redirect: route.fullPath },
}))
</script>

<template>
  <div class="ex-state-block">
    <svg class="ex-state-block__icon" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M24 10a6 6 0 016 6v2h4a2 2 0 012 2v16a2 2 0 01-2 2H14a2 2 0 01-2-2V20a2 2 0 012-2h4v-2a6 6 0 016-6z"
        stroke="#f0b90b"
        stroke-width="1.5"
        opacity="0.85"
      />
      <circle cx="24" cy="28" r="2" fill="#f0b90b" opacity="0.9" />
    </svg>
    <h3 class="ex-state-block__title">{{ title }}</h3>
    <p class="ex-state-block__desc">{{ description }}</p>
    <div class="ex-state-block__actions">
      <RouterLink class="ex-btn-brand" :to="loginTo">登录</RouterLink>
      <RouterLink class="ex-btn-ghost" :to="registerTo">注册</RouterLink>
    </div>
  </div>
</template>
