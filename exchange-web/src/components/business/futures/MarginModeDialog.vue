<script setup lang="ts">
import { ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useFuturesTradeStore } from '@/stores/futuresTrade'
import type { FuturesMarginMode } from '@/types/futuresTrade'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
}>()

const store = useFuturesTradeStore()
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
      class="mdlg-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="切换保证金模式"
      @click.self="close"
    >
      <div class="mdlg">
        <div class="mdlg__head">
          <span class="mdlg__title">保证金模式</span>
          <button type="button" class="mdlg__x" aria-label="关闭" @click="close">×</button>
        </div>
        <div class="mdlg__body">
          <label class="mdlg__opt">
            <input v-model="local" type="radio" value="CROSS" class="mdlg__radio" />
            <span>
              <strong>全仓</strong>
              <span class="mdlg__sub">共用保证金池，强平风险与全仓仓位联动</span>
            </span>
          </label>
          <label class="mdlg__opt">
            <input v-model="local" type="radio" value="ISOLATED" class="mdlg__radio" />
            <span>
              <strong>逐仓</strong>
              <span class="mdlg__sub">单笔仓位独立保证金与强平价</span>
            </span>
          </label>
        </div>
        <p class="mdlg__warn">切换模式可能影响强平价与可用保证金，需无持仓或接口允许时切换。</p>
        <div class="mdlg__foot">
          <button type="button" class="mdlg__btn mdlg__btn--ghost" @click="close">取消</button>
          <button type="button" class="mdlg__btn mdlg__btn--primary" @click="confirm">确认</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.mdlg-overlay {
  position: fixed;
  inset: 0;
  z-index: 500;
  background: var(--ex-overlay-backdrop);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $space-4;
}

.mdlg {
  width: 100%;
  max-width: 440px;
  border-radius: $radius-md;
  border: 1px solid $color-border;
  background: $color-bg-elevated;
}

.mdlg__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $space-3 $space-4;
  border-bottom: 1px solid $color-border;
}

.mdlg__title {
  font-weight: $font-weight-bold;
}

.mdlg__x {
  border: none;
  background: transparent;
  color: $color-text-tertiary;
  font-size: 22px;
  cursor: pointer;
}

.mdlg__body {
  padding: $space-3 $space-4;
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.mdlg__opt {
  display: flex;
  gap: $space-2;
  padding: $space-2;
  border-radius: $radius-sm;
  border: 1px solid $color-border;
  cursor: pointer;
  align-items: flex-start;
}

.mdlg__radio {
  margin-top: 4px;
  accent-color: #3084fc;
}

.mdlg__sub {
  display: block;
  font-size: $font-size-xs;
  color: $color-text-tertiary;
  font-weight: $font-weight-regular;
  margin-top: 4px;
}

.mdlg__warn {
  margin: 0 $space-4 $space-2;
  font-size: 10px;
  color: $color-brand;
  line-height: 1.45;
}

.mdlg__foot {
  display: flex;
  justify-content: flex-end;
  gap: $space-2;
  padding: $space-3 $space-4;
  border-top: 1px solid $color-border;
}

.mdlg__btn {
  padding: $space-2 $space-4;
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  border-radius: $radius-sm;
  cursor: pointer;
  border: 1px solid transparent;
}

.mdlg__btn--ghost {
  background: transparent;
  border-color: $color-border;
  color: $color-text-secondary;
}

.mdlg__btn--primary {
  background: linear-gradient(180deg, #4a8efc 0%, #3084fc 100%);
  color: #fff;
}
</style>
