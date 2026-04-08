<script setup lang="ts">
import type { AnnounceCenterItem } from '@/types/supportHub'
import { computed } from 'vue'

const props = defineProps<{
  modelValue: boolean
  item: AnnounceCenterItem | null
  categoryLabel: (c: AnnounceCenterItem['category']) => string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
}>()

function close() {
  emit('update:modelValue', false)
}

const fmt = computed(() => {
  if (!props.item) return ''
  const d = new Date(props.item.publishedAt)
  return Number.isNaN(d.getTime()) ? props.item.publishedAt : d.toLocaleString('zh-CN')
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="modelValue && item"
      class="adm-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="公告详情"
      @click.self="close"
    >
      <div class="adm">
        <div class="adm__head">
          <div class="adm__tags">
            <span v-if="item.pinned" class="adm__pin">置顶</span>
            <span class="adm__cat">{{ categoryLabel(item.category) }}</span>
          </div>
          <button type="button" class="adm__x" aria-label="关闭" @click="close">×</button>
        </div>
        <h2 class="adm__title">{{ item.title }}</h2>
        <time class="adm__time" :datetime="item.publishedAt">{{ fmt }}</time>
        <div class="adm__body">
          <p v-for="(p, i) in item.paragraphs" :key="i" class="adm__p">{{ p }}</p>
        </div>
        <div class="adm__foot">
          <button type="button" class="adm__btn" @click="close">关闭</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.adm-overlay {
  position: fixed;
  inset: 0;
  z-index: 520;
  background: var(--ex-overlay-backdrop);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $space-4;
}

.adm {
  width: 100%;
  max-width: 560px;
  max-height: min(85vh, 720px);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border-radius: $radius-md;
  border: 1px solid $color-border;
  background: var(--ex-modal-surface);
  box-shadow: var(--ex-modal-shadow-elevated);
}

.adm__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: $space-3 $space-4 0;
  gap: $space-2;
}

.adm__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.adm__pin {
  font-size: 10px;
  font-weight: $font-weight-bold;
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(240, 185, 11, 0.2);
  color: $color-brand;
}

.adm__cat {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(48, 132, 252, 0.15);
  color: #6bb6ff;
}

.adm__x {
  border: none;
  background: transparent;
  color: $color-text-tertiary;
  font-size: 22px;
  cursor: pointer;
  line-height: 1;
  flex-shrink: 0;
}

.adm__title {
  margin: $space-2 $space-4 0;
  font-size: $font-size-lg;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
  line-height: 1.35;
}

.adm__time {
  display: block;
  margin: $space-2 $space-4 0;
  font-size: $font-size-xs;
  color: $color-text-tertiary;
}

.adm__body {
  margin-top: $space-3;
  padding: 0 $space-4;
  overflow-y: auto;
  flex: 1;
}

.adm__p {
  margin: 0 0 $space-3;
  font-size: $font-size-sm;
  color: $color-text-secondary;
  line-height: 1.65;
}

.adm__foot {
  padding: $space-3 $space-4;
  border-top: 1px solid $color-border;
  display: flex;
  justify-content: flex-end;
}

.adm__btn {
  padding: $space-2 $space-5;
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  border-radius: $radius-sm;
  border: 1px solid rgba(240, 185, 11, 0.4);
  background: rgba(240, 185, 11, 0.12);
  color: $color-brand;
  cursor: pointer;
}

.adm__btn:hover {
  background: rgba(240, 185, 11, 0.18);
}
</style>
