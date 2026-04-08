<template>
  <div class="ex-page-state">
    <div v-if="loading && useSkeleton" class="ex-page-state__block">
      <slot name="skeleton">
        <ExSkeleton :variant="skeletonVariant" />
      </slot>
    </div>

    <div v-else-if="loading" class="ex-page-state__block">
      <ExLoading :text="loadingText" />
    </div>

    <div v-else-if="errorMessage != null" class="ex-page-state__block">
      <ExStateError :message="errorMessage" @retry="onChildRetry" />
    </div>

    <div v-else-if="unauthorized" class="ex-page-state__block">
      <ExUnauthorized />
    </div>

    <div v-else-if="empty" class="ex-page-state__block">
      <ExEmpty :title="emptyTitle" :description="emptyDescription">
        <slot name="empty-actions" />
      </ExEmpty>
    </div>

    <div v-else class="ex-page-state__content">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ExSkeleton from './ExSkeleton.vue'
import ExLoading from './ExLoading.vue'
import ExStateError from '@/components/state/ExStateError.vue'
import ExUnauthorized from '@/components/state/ExUnauthorized.vue'
import ExEmpty from '@/components/state/ExEmpty.vue'

const props = withDefaults(
  defineProps<{
    loading?: boolean
    useSkeleton?: boolean
    skeletonVariant?: 'card' | 'table' | 'list' | 'stats' | 'panel' | 'chart'
    error?: string | boolean | null
    unauthorized?: boolean
    empty?: boolean
    emptyTitle?: string
    emptyDescription?: string
    loadingText?: string
  }>(),
  {
    loading: false,
    useSkeleton: false,
    skeletonVariant: 'panel',
    error: null,
    unauthorized: false,
    empty: false,
    emptyTitle: '暂无数据',
    emptyDescription: '',
    loadingText: '加载中…',
  },
)

const emit = defineEmits<{
  (e: 'retry'): void
}>()

const errorMessage = computed((): string | null => {
  const e = props.error
  if (e == null || e === false) return null
  if (typeof e === 'string') return e || null
  return '加载失败'
})

function onChildRetry() {
  emit('retry')
}
</script>

<style scoped lang="scss">
.ex-page-state {
  position: relative;
  width: 100%;
  min-width: 0;
  min-height: 200px;
}

.ex-page-state__block,
.ex-page-state__content {
  width: 100%;
  min-width: 0;
}

.ex-page-state__block {
  position: relative;
  z-index: 1;
}
</style>
