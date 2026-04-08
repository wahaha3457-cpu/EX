<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { CopyFollowSettings, LeadTrader } from '@/types/copyTrading'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    trader: LeadTrader | null
    /** 编辑已有跟单时传入 */
    initial?: Partial<CopyFollowSettings> | null
    /** 是否为调整参数（已跟单） */
    editMode?: boolean
  }>(),
  { initial: null, editMode: false },
)

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (
    e: 'save',
    v: Omit<CopyFollowSettings, 'traderId' | 'startedAt' | 'updatedAt' | 'status'>,
  ): void
}>()

const marginStr = ref('50')
const ratioStr = ref('1')
const lossStr = ref('8')
const copySpot = ref(true)
const copyFutures = ref(true)
const agreed = ref(false)

watch(
  () => props.modelValue,
  (open) => {
    if (!open || !props.trader) return
    const i = props.initial
    if (i) {
      marginStr.value = String(i.marginPerOrderUsdt ?? 50)
      ratioStr.value = String(i.copyRatio ?? 1)
      lossStr.value = String(i.maxDailyLossPct ?? 8)
      copySpot.value = i.copySpot ?? true
      copyFutures.value = i.copyFutures ?? true
    } else {
      marginStr.value = '50'
      ratioStr.value = '1'
      lossStr.value = '8'
      copySpot.value = props.trader.markets.includes('SPOT')
      copyFutures.value = props.trader.markets.includes('FUTURES')
    }
    agreed.value = false
  },
)

const isEdit = computed(() => props.editMode)

const marginNum = computed(() => {
  const n = Number.parseFloat(marginStr.value)
  return Number.isFinite(n) ? n : 0
})
const ratioNum = computed(() => {
  const n = Number.parseFloat(ratioStr.value)
  return Number.isFinite(n) ? n : 0
})
const lossNum = computed(() => {
  const n = Number.parseFloat(lossStr.value)
  return Number.isFinite(n) ? n : 0
})

const err = computed(() => {
  if (marginNum.value < 10 || marginNum.value > 100_000) return '单笔跟单金额建议 10 – 100,000 USDT（演示）'
  if (ratioNum.value < 0.1 || ratioNum.value > 3) return '跟单倍数需在 0.1x – 3x'
  if (lossNum.value < 1 || lossNum.value > 80) return '单日止损比例建议 1% – 80%'
  if (!copySpot.value && !copyFutures.value) return '请至少选择一种市场'
  return ''
})

const canSubmit = computed(() => !err.value && agreed.value)

function close() {
  emit('update:modelValue', false)
}

function submit() {
  if (!canSubmit.value || !props.trader) return
  let spot = copySpot.value
  let fut = copyFutures.value
  if (!props.trader.markets.includes('SPOT')) spot = false
  if (!props.trader.markets.includes('FUTURES')) fut = false
  if (!spot && !fut) {
    spot = props.trader.markets.includes('SPOT')
    fut = props.trader.markets.includes('FUTURES')
  }
  emit('save', {
    marginPerOrderUsdt: Math.round(marginNum.value * 100) / 100,
    copyRatio: Math.round(ratioNum.value * 1000) / 1000,
    maxDailyLossPct: Math.round(lossNum.value * 10) / 10,
    copySpot: spot,
    copyFutures: fut,
  })
}

function setRatio(preset: number) {
  ratioStr.value = String(preset)
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="modelValue && trader"
      class="cfs-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="跟单设置"
      @click.self="close"
    >
      <div class="cfs">
        <div class="cfs__head">
          <div>
            <span class="cfs__title">{{ isEdit ? '调整跟单参数' : '确认跟单' }}</span>
            <p class="cfs__sub">{{ trader.displayName }}</p>
          </div>
          <button type="button" class="cfs__x" aria-label="关闭" @click="close">×</button>
        </div>
        <div class="cfs__body">
          <div class="cfs__field">
            <label class="cfs__lab">单笔跟单金额（USDT）</label>
            <input v-model="marginStr" type="text" inputmode="decimal" class="cfs__input" />
            <p class="cfs__hint">与带单员开仓时，按此金额与倍数计算您的下单规模（演示）。</p>
          </div>

          <div class="cfs__field">
            <label class="cfs__lab">跟单倍数</label>
            <input v-model="ratioStr" type="text" inputmode="decimal" class="cfs__input cfs__input--sm" />
            <div class="cfs__presets">
              <button type="button" class="cfs__p" @click="setRatio(0.5)">0.5x</button>
              <button type="button" class="cfs__p" @click="setRatio(1)">1x</button>
              <button type="button" class="cfs__p" @click="setRatio(1.5)">1.5x</button>
              <button type="button" class="cfs__p" @click="setRatio(2)">2x</button>
            </div>
          </div>

          <div class="cfs__field">
            <label class="cfs__lab">单日亏损达此比例时暂停跟单（%）</label>
            <input v-model="lossStr" type="text" inputmode="decimal" class="cfs__input cfs__input--sm" />
          </div>

          <div class="cfs__field">
            <span class="cfs__lab">复制市场</span>
            <div class="cfs__checks">
              <label v-if="trader.markets.includes('SPOT')" class="cfs__ck">
                <input v-model="copySpot" type="checkbox" />
                现货
              </label>
              <label v-if="trader.markets.includes('FUTURES')" class="cfs__ck">
                <input v-model="copyFutures" type="checkbox" />
                合约
              </label>
            </div>
          </div>

          <p v-if="err" class="cfs__err">{{ err }}</p>

          <label class="cfs__agree">
            <input v-model="agreed" type="checkbox" />
            <span
              >我已阅读并理解跟单将放大盈亏，历史收益不代表未来表现；演示环境不产生真实成交与资金划转。</span
            >
          </label>
        </div>
        <div class="cfs__foot">
          <button type="button" class="cfs__btn cfs__btn--ghost" @click="close">取消</button>
          <button type="button" class="cfs__btn cfs__btn--primary" :disabled="!canSubmit" @click="submit">
            {{ isEdit ? '保存' : '确认跟单' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.cfs-overlay {
  position: fixed;
  inset: 0;
  z-index: 540;
  background: var(--ex-overlay-backdrop);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $space-4;
}

.cfs {
  width: 100%;
  max-width: 440px;
  border-radius: $radius-md;
  border: 1px solid $color-border;
  background: var(--ex-card-surface);
  box-shadow: var(--ex-modal-shadow-elevated);
}

.cfs__head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: $space-3 $space-4;
  border-bottom: 1px solid $color-border;
}

.cfs__title {
  font-size: $font-size-md;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.cfs__sub {
  margin: 4px 0 0;
  font-size: $font-size-sm;
  color: $color-brand;
  font-weight: $font-weight-semibold;
}

.cfs__x {
  border: none;
  background: transparent;
  color: $color-text-tertiary;
  font-size: 22px;
  cursor: pointer;
}

.cfs__body {
  padding: $space-4;
  max-height: min(70vh, 520px);
  overflow-y: auto;
}

.cfs__field {
  margin-bottom: $space-4;
}

.cfs__lab {
  display: block;
  font-size: $font-size-xs;
  color: $color-text-tertiary;
  font-weight: $font-weight-semibold;
  margin-bottom: 8px;
}

.cfs__input {
  width: 100%;
  box-sizing: border-box;
  padding: $space-3;
  border-radius: $radius-md;
  border: 1px solid var(--ex-border);
  background: var(--ex-surface-inset-strong);
  color: $color-text-primary;
  font-size: $font-size-md;
  font-weight: $font-weight-bold;
  font-family: $font-family-mono;

  &--sm {
    max-width: 160px;
  }

  &:focus {
    outline: none;
    border-color: rgba(240, 185, 11, 0.4);
  }
}

.cfs__hint {
  margin: 8px 0 0;
  font-size: 11px;
  color: $color-text-tertiary;
  line-height: 1.45;
}

.cfs__presets {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.cfs__p {
  padding: 6px 12px;
  font-size: 11px;
  font-weight: $font-weight-bold;
  border-radius: $radius-sm;
  border: 1px solid $color-border;
  background: var(--ex-fill-hover-subtle);
  color: $color-text-secondary;
  cursor: pointer;
}

.cfs__p:hover {
  border-color: rgba(240, 185, 11, 0.35);
  color: $color-brand;
}

.cfs__checks {
  display: flex;
  gap: $space-4;
}

.cfs__ck {
  font-size: $font-size-sm;
  color: $color-text-secondary;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.cfs__err {
  font-size: $font-size-xs;
  color: $color-fall;
  margin: 0 0 $space-3;
}

.cfs__agree {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  font-size: 11px;
  color: $color-text-secondary;
  line-height: 1.5;
  cursor: pointer;
}

.cfs__foot {
  display: flex;
  justify-content: flex-end;
  gap: $space-2;
  padding: $space-3 $space-4;
  border-top: 1px solid $color-border;
}

.cfs__btn {
  padding: 10px 20px;
  border-radius: $radius-sm;
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  cursor: pointer;
  border: none;
}

.cfs__btn--ghost {
  background: transparent;
  color: $color-text-secondary;
  border: 1px solid $color-border;
}

.cfs__btn--primary {
  background: $color-brand;
  color: var(--ex-on-brand);
}

.cfs__btn--primary:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
</style>
