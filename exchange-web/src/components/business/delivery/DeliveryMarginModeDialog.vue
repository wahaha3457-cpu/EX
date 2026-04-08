<script setup lang="ts">
import { ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useDeliveryTradeStore } from '@/stores/deliveryTrade'
import type { FuturesMarginMode } from '@/types/futuresTrade'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
}>()

const store = useDeliveryTradeStore()
const { marginMode } = storeToRefs(store)

const local = ref<FuturesMarginMode>('CROSS')

watch(
  () => props.modelValue,
  (v) => {
    if (v) local.value = marginMode.value
  },
)

function close() {
  emit('update:modelValue', false)
}

function confirm() {
  store.setMarginMode(local.value)
  emit('update:modelValue', false)
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="dmdlg-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="交割合约保证金模式"
      @click.self="close"
    >
      <div class="dmdlg">
        <div class="dmdlg__head">
          <span class="dmdlg__title">保证金模式 · 交割</span>
          <button type="button" class="dmdlg__x" aria-label="关闭" @click="close">×</button>
        </div>
        <div class="dmdlg__body">
          <label class="dmdlg__opt">
            <input v-model="local" type="radio" value="CROSS" class="dmdlg__radio" />
            <span>
              <strong>全仓</strong>
              <span class="dmdlg__sub">同一计价币保证金共用，盈亏互抵；可开名义 ≈ 总可用×杠杆（简约估算）。</span>
            </span>
          </label>
          <label class="dmdlg__opt">
            <input v-model="local" type="radio" value="ISOLATED" class="dmdlg__radio" />
            <span>
              <strong>逐仓</strong>
              <span class="dmdlg__sub">仅冻结本仓位所需保证金，与其他交割/永续仓位隔离；爆仓不自动扣其他仓余额。</span>
            </span>
          </label>
        </div>
        <p class="dmdlg__warn">临近交割日请留意仓位与保证金，避免无法展期带来的强制平仓风险。</p>
        <div class="dmdlg__foot">
          <button type="button" class="dmdlg__btn dmdlg__btn--ghost" @click="close">取消</button>
          <button type="button" class="dmdlg__btn dmdlg__btn--primary" @click="confirm">确认</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.dmdlg-overlay {
  position: fixed;
  inset: 0;
  z-index: 500;
  background: var(--ex-overlay-backdrop);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $space-4;
}

.dmdlg {
  width: 100%;
  max-width: 440px;
  border-radius: $radius-md;
  border: 1px solid $color-border;
  background: $color-bg-elevated;
}

.dmdlg__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $space-3 $space-4;
  border-bottom: 1px solid $color-border;
}

.dmdlg__title {
  font-weight: $font-weight-bold;
}

.dmdlg__x {
  border: none;
  background: transparent;
  color: $color-text-tertiary;
  font-size: 22px;
  cursor: pointer;
}

.dmdlg__body {
  padding: $space-3 $space-4;
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.dmdlg__opt {
  display: flex;
  gap: $space-2;
  padding: $space-2;
  border-radius: $radius-sm;
  border: 1px solid $color-border;
  cursor: pointer;
  align-items: flex-start;
}

.dmdlg__radio {
  margin-top: 4px;
  accent-color: #3084fc;
}

.dmdlg__sub {
  display: block;
  font-size: $font-size-xs;
  color: $color-text-tertiary;
  font-weight: $font-weight-regular;
  margin-top: 4px;
}

.dmdlg__warn {
  margin: 0 $space-4 $space-2;
  font-size: 10px;
  color: $color-fall;
  line-height: 1.45;
}

.dmdlg__foot {
  display: flex;
  justify-content: flex-end;
  gap: $space-2;
  padding: $space-3 $space-4;
  border-top: 1px solid $color-border;
}

.dmdlg__btn {
  padding: $space-2 $space-4;
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  border-radius: $radius-sm;
  cursor: pointer;
  border: 1px solid transparent;
}

.dmdlg__btn--ghost {
  background: transparent;
  border-color: $color-border;
  color: $color-text-secondary;
}

.dmdlg__btn--primary {
  background: linear-gradient(180deg, #4a8efc 0%, #3084fc 100%);
  color: #fff;
}
</style>
