<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string
    description?: string
    tight?: boolean
  }>(),
  {
    title: '暂无数据',
    description: '',
    tight: false,
  },
)
</script>

<template>
  <div class="ex-state-block" :class="{ 'ex-state-block--tight': tight }">
    <svg class="ex-state-block__icon" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        opacity="0.35"
        d="M8 14h32v22a2 2 0 01-2 2H10a2 2 0 01-2-2V14z"
        stroke="currentColor"
        stroke-width="1.5"
      />
      <path d="M8 14L14 8h20l6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
      <path opacity="0.5" d="M16 22h16M16 28h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
    </svg>
    <h3 class="ex-state-block__title">{{ title }}</h3>
    <p v-if="description" class="ex-state-block__desc">{{ description }}</p>
    <div v-if="$slots.default" class="ex-state-block__actions">
      <slot />
    </div>
  </div>
</template>
