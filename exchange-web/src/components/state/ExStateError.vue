<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string
    message?: string
    retryLabel?: string
    showRetry?: boolean
    tight?: boolean
  }>(),
  {
    title: '加载失败',
    message: '网络异常或服务暂时不可用，请稍后重试。',
    retryLabel: '重试',
    showRetry: true,
    tight: false,
  },
)

const emit = defineEmits<{
  (e: 'retry'): void
}>()

function onRetryClick() {
  emit('retry')
}
</script>

<template>
  <div class="ex-state-block ex-state-block--error" :class="{ 'ex-state-block--tight': tight }">
    <svg class="ex-state-block__icon" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="24" cy="24" r="18" stroke="#f6465d" stroke-width="1.5" opacity="0.6" />
      <path d="M18 18l12 12M30 18L18 30" stroke="#f6465d" stroke-width="1.5" stroke-linecap="round" />
    </svg>
    <h3 class="ex-state-block__title">{{ title }}</h3>
    <p class="ex-state-block__desc">{{ message }}</p>
    <div v-if="showRetry" class="ex-state-block__actions">
      <button type="button" class="ex-btn-brand" @click="onRetryClick">{{ retryLabel }}</button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.ex-state-block--error .ex-state-block__title {
  color: #eaecef;
}
</style>
