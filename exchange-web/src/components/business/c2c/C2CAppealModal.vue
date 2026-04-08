<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { C2cAppealReason, C2cOrder } from '@/types/c2c'
import { useAppStore } from '@/stores/app'
import { useC2cMarketStore } from '@/stores/c2cMarket'

const props = defineProps<{
  modelValue: boolean
  order: C2cOrder | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'submitted'): void
}>()

const app = useAppStore()
const store = useC2cMarketStore()

const visible = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v),
})

const reason = ref<C2cAppealReason>('paid_not_release')
const detail = ref('')
const submitting = ref(false)

const reasonOptions: { value: C2cAppealReason; label: string }[] = [
  { value: 'paid_not_release', label: '已付款，对方未放币 / 未确认收款' },
  { value: 'wrong_amount', label: '付款金额、备注与订单不一致' },
  { value: 'payment_not_received', label: '作为卖方未收到买方付款' },
  { value: 'malicious_behavior', label: '对方要求私下交易或存在恶意行为' },
  { value: 'other', label: '其他原因' },
]

watch(
  () => props.modelValue,
  (v) => {
    if (v) {
      reason.value = 'paid_not_release'
      detail.value = ''
    }
  },
)

function close() {
  visible.value = false
}

async function onSubmit() {
  const o = props.order
  if (!o || o.status !== 'pending_release') {
    app.pushToast('warning', '仅「待放币」订单可发起申诉')
    return
  }
  const t = detail.value.trim()
  if (t.length < 8) {
    app.pushToast('warning', '请至少填写 8 个字的说明，便于客服核对')
    return
  }
  submitting.value = true
  try {
    const r = await store.submitAppeal(o.id, { reason: reason.value, detail: t })
    if (r) {
      emit('submitted')
      visible.value = false
    }
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="visible && order"
      class="c2c-ap-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="发起申诉"
      @click.self="close"
    >
      <div class="c2c-ap">
        <div class="c2c-ap__head">
          <div>
            <h2 class="c2c-ap__title">发起申诉</h2>
            <p class="c2c-ap__id">订单 {{ order.id }}</p>
          </div>
          <button type="button" class="c2c-ap__x" aria-label="关闭" @click="close">×</button>
        </div>

        <div class="c2c-ap__body">
          <p class="c2c-ap__lead">
            请如实描述争议情况。提交后订单进入<strong>申诉中</strong>，客服将结合订单聊天与凭证处理（演示流程）。
          </p>

          <label class="c2c-ap__lab">申诉类型</label>
          <div class="c2c-ap__reasons" role="radiogroup" aria-label="申诉类型">
            <label v-for="opt in reasonOptions" :key="opt.value" class="c2c-ap__rrow">
              <input v-model="reason" type="radio" name="c2c-appeal-reason" :value="opt.value" />
              <span>{{ opt.label }}</span>
            </label>
          </div>

          <label class="c2c-ap__lab" for="c2c-appeal-detail">详细说明</label>
          <textarea
            id="c2c-appeal-detail"
            v-model="detail"
            class="c2c-ap__ta"
            rows="4"
            maxlength="800"
            placeholder="请说明时间、付款方式、是否已上传凭证等（不少于 8 个字）"
          />

          <p class="c2c-ap__hint">
            正式环境需上传付款/收款截图；此处为演示，提交后可通过<strong>在线客服</strong>继续补充材料。
          </p>
        </div>

        <div class="c2c-ap__foot">
          <button type="button" class="c2c-ap__btn c2c-ap__btn--ghost" @click="close">取消</button>
          <button type="button" class="c2c-ap__btn c2c-ap__btn--primary" :disabled="submitting" @click="onSubmit">
            提交申诉
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.c2c-ap-overlay {
  position: fixed;
  inset: 0;
  z-index: 560;
  background: var(--ex-overlay-backdrop);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $space-4;
}

.c2c-ap {
  width: 100%;
  max-width: 420px;
  border-radius: $radius-md;
  border: 1px solid $color-border;
  background: var(--ex-card-surface);
  box-shadow: var(--ex-modal-shadow-elevated);
  max-height: min(90vh, 560px);
  display: flex;
  flex-direction: column;
}

.c2c-ap__head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: $space-3 $space-4;
  border-bottom: 1px solid $color-border;
  flex-shrink: 0;
}

.c2c-ap__title {
  margin: 0;
  font-size: $font-size-md;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.c2c-ap__id {
  margin: 4px 0 0;
  font-size: 10px;
  color: $color-text-tertiary;
  font-family: $font-family-mono;
  word-break: break-all;
}

.c2c-ap__x {
  border: none;
  background: transparent;
  color: $color-text-tertiary;
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
}

.c2c-ap__body {
  padding: $space-4;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
}

.c2c-ap__lead {
  margin: 0 0 $space-3;
  font-size: $font-size-xs;
  color: $color-text-secondary;
  line-height: 1.55;
}

.c2c-ap__lab {
  display: block;
  margin-bottom: $space-2;
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  color: $color-text-secondary;
}

.c2c-ap__reasons {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: $space-4;
}

.c2c-ap__rrow {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: $font-size-xs;
  color: $color-text-primary;
  cursor: pointer;

  input {
    margin-top: 3px;
    accent-color: $color-brand;
  }
}

.c2c-ap__ta {
  width: 100%;
  box-sizing: border-box;
  padding: $space-2 $space-3;
  font-size: $font-size-xs;
  color: $color-text-primary;
  background: var(--ex-surface-inset);
  border: 1px solid $color-border;
  border-radius: $radius-sm;
  resize: vertical;
  min-height: 88px;
  font-family: inherit;
  line-height: 1.5;

  &:focus {
    outline: none;
    border-color: rgba(240, 185, 11, 0.45);
  }
}

.c2c-ap__hint {
  margin: $space-3 0 0;
  font-size: 10px;
  color: $color-text-tertiary;
  line-height: 1.5;
}

.c2c-ap__foot {
  display: flex;
  justify-content: flex-end;
  gap: $space-2;
  padding: $space-3 $space-4;
  border-top: 1px solid $color-border;
  flex-shrink: 0;
}

.c2c-ap__btn {
  padding: 10px 16px;
  border-radius: $radius-sm;
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  cursor: pointer;
  border: none;
}

.c2c-ap__btn--ghost {
  background: transparent;
  color: $color-text-secondary;
  border: 1px solid $color-border;
}

.c2c-ap__btn--primary {
  background: $color-brand;
  color: var(--ex-on-brand);
}

.c2c-ap__btn--primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
