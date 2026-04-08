<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useFuturesTradeStore } from '@/stores/futuresTrade'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
}>()

const store = useFuturesTradeStore()
const { leverage, instrument } = storeToRefs(store)

const localLev = ref(1)

watch(
  () => props.modelValue,
  (v) => {
    if (v) localLev.value = leverage.value
  },
)

const maxLev = computed(() => instrument.value?.maxLeverage ?? 125)

const presets = computed(() =>
  [1, 2, 5, 10, 15, 20, 25, 50, 75, 100, 125].filter((x) => x <= maxLev.value),
)

function close() {
  emit('update:modelValue', false)
}

function confirm() {
  store.setLeverage(localLev.value)
  emit('update:modelValue', false)
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="ldlg-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="调整杠杆"
      @click.self="close"
    >
      <div class="ldlg">
        <div class="ldlg__head">
          <span class="ldlg__title">调整杠杆</span>
          <button type="button" class="ldlg__x" aria-label="关闭" @click="close">×</button>
        </div>
        <p class="ldlg__warn">
          高杠杆放大收益与亏损。调整仅对当前合约生效；实际以账户风险限额与接口校验为准。
        </p>
        <div class="ldlg__row">
          <span class="ldlg__lab">{{ localLev }}x</span>
          <input
            v-model.number="localLev"
            class="ldlg__range"
            type="range"
            :min="1"
            :max="maxLev"
            step="1"
          />
        </div>
        <div class="ldlg__presets">
          <button
            v-for="p in presets"
            :key="p"
            type="button"
            class="ldlg__chip"
            :class="{ 'ldlg__chip--on': localLev === p }"
            @click="localLev = p"
          >
            {{ p }}x
          </button>
        </div>
        <div class="ldlg__foot">
          <button type="button" class="ldlg__btn ldlg__btn--ghost" @click="close">取消</button>
          <button type="button" class="ldlg__btn ldlg__btn--primary" @click="confirm">确认</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.ldlg-overlay {
  position: fixed;
  inset: 0;
  z-index: 500;
  background: var(--ex-overlay-backdrop);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $space-4;
}

.ldlg {
  width: 100%;
  max-width: 420px;
  border-radius: $radius-md;
  border: 1px solid $color-border;
  background: $color-bg-elevated;
  box-shadow: var(--ex-modal-shadow-elevated);
}

.ldlg__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $space-3 $space-4;
  border-bottom: 1px solid $color-border;
}

.ldlg__title {
  font-weight: $font-weight-bold;
  font-size: $font-size-md;
}

.ldlg__x {
  border: none;
  background: transparent;
  color: $color-text-tertiary;
  font-size: 22px;
  cursor: pointer;
  line-height: 1;
}

.ldlg__warn {
  margin: 0;
  padding: $space-3 $space-4;
  font-size: $font-size-xs;
  line-height: 1.5;
  color: $color-fall;
  background: rgba(246, 70, 93, 0.06);
}

.ldlg__row {
  padding: $space-3 $space-4 0;
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.ldlg__lab {
  font-size: $font-size-xl;
  font-weight: $font-weight-bold;
  font-family: $font-family-mono;
  color: #8ab4ff;
}

.ldlg__range {
  width: 100%;
  accent-color: #3084fc;
}

.ldlg__presets {
  display: flex;
  flex-wrap: wrap;
  gap: $space-1;
  padding: $space-3 $space-4;
}

.ldlg__chip {
  padding: 4px $space-2;
  font-size: 10px;
  font-weight: $font-weight-semibold;
  border: 1px solid $color-border;
  border-radius: $radius-sm;
  background: $color-bg-base;
  color: $color-text-tertiary;
  cursor: pointer;
}

.ldlg__chip--on {
  border-color: rgba(48, 132, 252, 0.5);
  color: #8ab4ff;
}

.ldlg__foot {
  display: flex;
  justify-content: flex-end;
  gap: $space-2;
  padding: $space-3 $space-4;
  border-top: 1px solid $color-border;
}

.ldlg__btn {
  padding: $space-2 $space-4;
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  border-radius: $radius-sm;
  cursor: pointer;
  border: 1px solid transparent;
}

.ldlg__btn--ghost {
  background: transparent;
  border-color: $color-border;
  color: $color-text-secondary;
}

.ldlg__btn--primary {
  background: linear-gradient(180deg, #4a8efc 0%, #3084fc 100%);
  color: #fff;
}
</style>
