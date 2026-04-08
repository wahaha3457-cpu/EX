<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useDeliveryTradeStore } from '@/stores/deliveryTrade'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
}>()

const store = useDeliveryTradeStore()
const { leverage, instrument } = storeToRefs(store)

const localLev = ref(1)

watch(
  () => props.modelValue,
  (v) => {
    if (v) localLev.value = leverage.value
  },
)

const maxLev = computed(() => instrument.value?.maxLeverage ?? 75)

const presets = computed(() =>
  [1, 2, 5, 10, 15, 20, 25, 35, 50, 75].filter((x) => x <= maxLev.value),
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
      class="dldlg-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="交割合约调整杠杆"
      @click.self="close"
    >
      <div class="dldlg">
        <div class="dldlg__head">
          <span class="dldlg__title">调整杠杆 · 交割</span>
          <button type="button" class="dldlg__x" aria-label="关闭" @click="close">×</button>
        </div>
        <p class="dldlg__warn">
          交割合约临近到期流动性可能下降，杠杆与保证金规则以产品说明为准；演示环境为占位逻辑。
        </p>
        <div class="dldlg__row">
          <span class="dldlg__lab">{{ localLev }}x</span>
          <input
            v-model.number="localLev"
            class="dldlg__range"
            type="range"
            :min="1"
            :max="maxLev"
            step="1"
          />
        </div>
        <div class="dldlg__presets">
          <button
            v-for="p in presets"
            :key="p"
            type="button"
            class="dldlg__chip"
            :class="{ 'dldlg__chip--on': localLev === p }"
            @click="localLev = p"
          >
            {{ p }}x
          </button>
        </div>
        <div class="dldlg__foot">
          <button type="button" class="dldlg__btn dldlg__btn--ghost" @click="close">取消</button>
          <button type="button" class="dldlg__btn dldlg__btn--primary" @click="confirm">确认</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.dldlg-overlay {
  position: fixed;
  inset: 0;
  z-index: 500;
  background: var(--ex-overlay-backdrop);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $space-4;
}

.dldlg {
  width: 100%;
  max-width: 420px;
  border-radius: $radius-md;
  border: 1px solid $color-border;
  background: $color-bg-elevated;
  box-shadow: var(--ex-modal-shadow-elevated);
}

.dldlg__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $space-3 $space-4;
  border-bottom: 1px solid $color-border;
}

.dldlg__title {
  font-weight: $font-weight-bold;
  font-size: $font-size-md;
}

.dldlg__x {
  border: none;
  background: transparent;
  color: $color-text-tertiary;
  font-size: 22px;
  cursor: pointer;
  line-height: 1;
}

.dldlg__warn {
  margin: 0;
  padding: $space-3 $space-4;
  font-size: $font-size-xs;
  line-height: 1.5;
  color: $color-brand;
  background: rgba(240, 185, 11, 0.08);
}

.dldlg__row {
  padding: $space-3 $space-4 0;
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.dldlg__lab {
  font-size: $font-size-xl;
  font-weight: $font-weight-bold;
  font-family: $font-family-mono;
  color: #8ab4ff;
}

.dldlg__range {
  width: 100%;
  accent-color: #3084fc;
}

.dldlg__presets {
  display: flex;
  flex-wrap: wrap;
  gap: $space-1;
  padding: $space-3 $space-4;
}

.dldlg__chip {
  padding: 4px $space-2;
  font-size: 10px;
  font-weight: $font-weight-semibold;
  border: 1px solid $color-border;
  border-radius: $radius-sm;
  background: $color-bg-base;
  color: $color-text-tertiary;
  cursor: pointer;
}

.dldlg__chip--on {
  border-color: rgba(48, 132, 252, 0.5);
  color: #8ab4ff;
}

.dldlg__foot {
  display: flex;
  justify-content: flex-end;
  gap: $space-2;
  padding: $space-3 $space-4;
  border-top: 1px solid $color-border;
}

.dldlg__btn {
  padding: $space-2 $space-4;
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  border-radius: $radius-sm;
  cursor: pointer;
  border: 1px solid transparent;
}

.dldlg__btn--ghost {
  background: transparent;
  border-color: $color-border;
  color: $color-text-secondary;
}

.dldlg__btn--primary {
  background: linear-gradient(180deg, #4a8efc 0%, #3084fc 100%);
  color: #fff;
}
</style>
