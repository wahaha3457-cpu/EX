<script setup lang="ts">
import { useRouter } from 'vue-router'
import { RouteNames } from '@/constants/routeNames'

defineProps<{
  title: string
}>()

const router = useRouter()

function back() {
  if (window.history.length > 1) router.back()
  else router.push({ name: RouteNames.MobileHome })
}
</script>

<template>
  <header class="mp-back">
    <button type="button" class="mp-back__btn" aria-label="返回" @click="back">←</button>
    <h1 class="mp-back__title">{{ title }}</h1>
    <span class="mp-back__slot"><slot /></span>
  </header>
</template>

<style scoped lang="scss">
.mp-back {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0 16px;
}

.mp-back__btn {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(22, 28, 38, 0.82);
  color: #4dc4ff;
  font-size: 20px;
  cursor: pointer;
  flex-shrink: 0;
}

.mp-back__title {
  flex: 1;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.02em;
  min-width: 0;
}

.mp-back__slot {
  width: 44px;
  flex-shrink: 0;
  display: flex;
  justify-content: flex-end;
}
</style>
