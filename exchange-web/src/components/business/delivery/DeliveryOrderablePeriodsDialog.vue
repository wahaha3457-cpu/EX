<script setup lang="ts">
export interface OrderablePeriodRow {
  rank: number
  code: string
  /** UTC 分钟刻度说明 */
  utcHint: string
  /** 当前选中期（高亮边框） */
  isSelected: boolean
  /** 行角标：墙钟第 1 档为「当前」，其余选中为「已选」 */
  badge: 'current' | 'selected' | null
}

const props = defineProps<{
  modelValue: boolean
  periods: OrderablePeriodRow[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'select', rank: number): void
}>()

function close() {
  emit('update:modelValue', false)
}

function onPick(rank: number) {
  emit('select', rank)
  close()
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="dopdlg-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="最近可下单交割期"
      @click.self="close"
    >
      <div class="dopdlg">
        <div class="dopdlg__head">
          <span class="dopdlg__title">最近可下单 10 期</span>
          <button type="button" class="dopdlg__x" aria-label="关闭" @click="close">×</button>
        </div>
        <p class="dopdlg__hint">
          自当前 UTC 分钟起共 10 档，每档 1 分钟（演示）；期号为该分钟对应的合约展示码。
        </p>
        <ul class="dopdlg__list" role="list">
          <li v-for="p in props.periods" :key="p.code + p.rank" role="none">
            <button
              type="button"
              class="dopdlg__item"
              :class="{ 'dopdlg__item--on': p.isSelected }"
              :aria-current="p.isSelected ? 'true' : undefined"
              @click="onPick(p.rank)"
            >
              <div class="dopdlg__item-top">
                <span class="dopdlg__rank">第 {{ p.rank }} 档</span>
                <span v-if="p.badge === 'current'" class="dopdlg__tag">当前</span>
                <span v-else-if="p.badge === 'selected'" class="dopdlg__tag dopdlg__tag--sel">已选</span>
              </div>
              <span class="dopdlg__code ex-num">{{ p.code }}</span>
              <span class="dopdlg__utc">{{ p.utcHint }}</span>
            </button>
          </li>
        </ul>
        <div class="dopdlg__foot">
          <button type="button" class="dopdlg__btn dopdlg__btn--primary" @click="close">知道了</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.dopdlg-overlay {
  position: fixed;
  inset: 0;
  z-index: 500;
  background: var(--ex-overlay-backdrop);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $space-4;
}

.dopdlg {
  width: 100%;
  max-width: 400px;
  max-height: min(72vh, 520px);
  display: flex;
  flex-direction: column;
  border-radius: $radius-md;
  border: 1px solid $color-border;
  background: $color-bg-elevated;
  box-shadow: var(--ex-modal-shadow-elevated);
}

.dopdlg__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $space-3 $space-4;
  border-bottom: 1px solid $color-border;
  flex-shrink: 0;
}

.dopdlg__title {
  font-weight: $font-weight-bold;
  font-size: $font-size-sm;
}

.dopdlg__x {
  border: none;
  background: transparent;
  color: $color-text-tertiary;
  font-size: 22px;
  cursor: pointer;
  line-height: 1;
}

.dopdlg__hint {
  margin: 0;
  padding: $space-2 $space-4 0;
  font-size: 10px;
  line-height: 1.45;
  color: $color-text-tertiary;
}

.dopdlg__list {
  list-style: none;
  margin: $space-2 0 0;
  padding: 0 $space-3 $space-2;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
}

.dopdlg__item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
  margin: 0 0 $space-1;
  padding: $space-2 $space-2;
  border-radius: $radius-sm;
  border: 1px solid var(--ex-border-subtle);
  font-size: $font-size-xs;
  text-align: left;
  cursor: pointer;
  color: inherit;
  font-family: inherit;
  background: var(--ex-surface-inset, transparent);

  &:hover {
    border-color: color-mix(in srgb, $color-brand 28%, var(--ex-border-subtle));
  }

  &--on {
    border-color: rgba(240, 185, 11, 0.35);
    background: rgba(240, 185, 11, 0.06);
  }
}

.dopdlg__item-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-2;
}

.dopdlg__rank {
  color: $color-text-tertiary;
  font-weight: $font-weight-semibold;
  white-space: nowrap;
}

.dopdlg__code {
  font-weight: $font-weight-bold;
  color: $color-text-primary;
  word-break: break-all;
  line-height: 1.35;
}

.dopdlg__utc {
  font-size: 10px;
  color: $color-text-tertiary;
}

.dopdlg__tag {
  font-size: 9px;
  font-weight: $font-weight-bold;
  padding: 1px 6px;
  border-radius: 4px;
  background: rgba(240, 185, 11, 0.15);
  color: $color-brand;
  flex-shrink: 0;
}

.dopdlg__tag--sel {
  background: rgba(48, 132, 252, 0.14);
  color: #8ab4ff;
}

.dopdlg__foot {
  display: flex;
  justify-content: flex-end;
  padding: $space-3 $space-4;
  border-top: 1px solid $color-border;
  flex-shrink: 0;
}

.dopdlg__btn {
  padding: $space-2 $space-4;
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  border-radius: $radius-sm;
  cursor: pointer;
  border: 1px solid transparent;
}

.dopdlg__btn--primary {
  background: linear-gradient(180deg, #4a8efc 0%, #3084fc 100%);
  color: #fff;
}

.ex-num {
  font-family: $font-family-mono;
  font-variant-numeric: tabular-nums;
}
</style>
