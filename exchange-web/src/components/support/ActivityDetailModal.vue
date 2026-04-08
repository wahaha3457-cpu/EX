<script setup lang="ts">
import type { ActivityCenterItem } from '@/types/supportHub'
import { computed } from 'vue'

const props = defineProps<{
  modelValue: boolean
  item: ActivityCenterItem | null
  statusLabel: (s: ActivityCenterItem['status']) => string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'join', id: string): void
}>()

function close() {
  emit('update:modelValue', false)
}

function join() {
  if (props.item) emit('join', props.item.id)
}

const range = computed(() => {
  if (!props.item) return ''
  const s = new Date(props.item.startAt)
  const e = new Date(props.item.endAt)
  const f = (d: Date) => (Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('zh-CN', { dateStyle: 'short' }))
  return `${f(s)} — ${f(e)}`
})

const canJoin = computed(() => props.item?.status === 'ONGOING' && !props.item?.joined)
</script>

<template>
  <Teleport to="body">
    <div
      v-if="modelValue && item"
      class="acm-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="活动详情"
      @click.self="close"
    >
      <div class="acm">
        <div class="acm__head">
          <span
            class="acm__st"
            :class="{
              'acm__st--on': item.status === 'ONGOING',
              'acm__st--soon': item.status === 'UPCOMING',
              'acm__st--end': item.status === 'ENDED',
            }"
          >
            {{ statusLabel(item.status) }}
          </span>
          <button type="button" class="acm__x" aria-label="关闭" @click="close">×</button>
        </div>
        <h2 class="acm__title">{{ item.title }}</h2>
        <p class="acm__sub">{{ item.subtitle }}</p>
        <p class="acm__reward">{{ item.rewardHint }}</p>
        <p class="acm__range">{{ range }}</p>
        <div class="acm__rules">
          <h3 class="acm__rh">活动规则</h3>
          <ol class="acm__ol">
            <li v-for="(r, i) in item.rules" :key="i" class="acm__li">{{ r }}</li>
          </ol>
        </div>
        <div class="acm__foot">
          <button type="button" class="acm__btn acm__btn--ghost" @click="close">关闭</button>
          <button v-if="canJoin" type="button" class="acm__btn acm__btn--primary" @click="join">立即报名</button>
          <button v-else-if="item.joined && item.status === 'ONGOING'" type="button" class="acm__btn acm__btn--done" disabled>
            已报名
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.acm-overlay {
  position: fixed;
  inset: 0;
  z-index: 520;
  background: var(--ex-overlay-backdrop);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $space-4;
}

.acm {
  width: 100%;
  max-width: 480px;
  max-height: min(85vh, 640px);
  overflow-y: auto;
  border-radius: $radius-md;
  border: 1px solid $color-border;
  background: var(--ex-modal-surface);
  box-shadow: var(--ex-modal-shadow-elevated);
  padding: $space-4;
}

.acm__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $space-2;
}

.acm__st {
  font-size: 10px;
  font-weight: $font-weight-bold;
  padding: 2px 8px;
  border-radius: 4px;
}

.acm__st--on {
  background: rgba(14, 203, 129, 0.15);
  color: $color-rise;
}

.acm__st--soon {
  background: rgba(48, 132, 252, 0.15);
  color: #6bb6ff;
}

.acm__st--end {
  background: var(--ex-fill-hover-subtle);
  color: $color-text-tertiary;
}

.acm__x {
  border: none;
  background: transparent;
  color: $color-text-tertiary;
  font-size: 22px;
  cursor: pointer;
  line-height: 1;
}

.acm__title {
  margin: 0 0 $space-2;
  font-size: $font-size-lg;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
  line-height: 1.35;
}

.acm__sub {
  margin: 0 0 $space-2;
  font-size: $font-size-sm;
  color: $color-text-secondary;
  line-height: 1.5;
}

.acm__reward {
  margin: 0 0 $space-2;
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  color: $color-brand;
}

.acm__range {
  margin: 0 0 $space-3;
  font-size: $font-size-xs;
  color: $color-text-tertiary;
}

.acm__rules {
  padding: $space-3;
  border-radius: $radius-sm;
  background: var(--ex-surface-inset);
  border: 1px solid var(--ex-border-subtle);
}

.acm__rh {
  margin: 0 0 $space-2;
  font-size: $font-size-xs;
  font-weight: $font-weight-bold;
  color: $color-text-tertiary;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.acm__ol {
  margin: 0;
  padding-left: 1.2rem;
}

.acm__li {
  margin-bottom: $space-2;
  font-size: $font-size-xs;
  color: $color-text-secondary;
  line-height: 1.55;

  &:last-child {
    margin-bottom: 0;
  }
}

.acm__foot {
  display: flex;
  justify-content: flex-end;
  gap: $space-2;
  margin-top: $space-4;
  padding-top: $space-3;
  border-top: 1px solid $color-border;
}

.acm__btn {
  padding: $space-2 $space-4;
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  border-radius: $radius-sm;
  cursor: pointer;
  border: 1px solid transparent;
}

.acm__btn--ghost {
  background: transparent;
  border-color: $color-border;
  color: $color-text-secondary;
}

.acm__btn--primary {
  background: var(--ex-brand);
  color: var(--ex-on-brand);
}

.acm__btn--done {
  opacity: 0.5;
  cursor: not-allowed;
  border-color: $color-border;
  background: var(--ex-panel-sunken);
  color: $color-text-tertiary;
}
</style>
