<script setup lang="ts">
/**
 * 6 格数字输入：默认掩码 + 显示/隐藏（资金密码）；`plain` 时为明文且无眼睛按钮（验证码）。
 */
import { computed, nextTick, onMounted, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: string
    autocomplete?: string
    disabled?: boolean
    /** 跳过自动聚焦第 1 格（同一弹窗多个 Pin 时由外层把 noAutoFocus 置为 true） */
    noAutoFocus?: boolean
    /** 明文显示、不展示切换按钮（短信/邮箱/Google 验证码等） */
    plain?: boolean
  }>(),
  {
    autocomplete: 'one-time-code',
    disabled: false,
    noAutoFocus: false,
    plain: false,
  },
)

const emit = defineEmits<{ 'update:modelValue': [string] }>()

const reveal = ref(false)
const inputs = ref<(HTMLInputElement | null)[]>([])

const cellInputType = computed(() => (props.plain || reveal.value ? 'text' : 'password'))
const groupAriaLabel = computed(() => (props.plain ? '6 位数字验证码' : '6 位数字密码'))

function setInputRef(el: Element | null, i: number) {
  if (el && el instanceof HTMLInputElement) inputs.value[i] = el
}

function digitAt(i: number): string {
  return props.modelValue[i] ?? ''
}

function onInput(i: number, e: Event) {
  const el = e.target as HTMLInputElement
  const ch = el.value.replace(/\D/g, '').slice(-1) || ''
  const cur = props.modelValue.replace(/\D/g, '').slice(0, 6)
  const before = cur.slice(0, i)
  const after = cur.slice(i + 1)
  const next = (before + ch + after).slice(0, 6)
  emit('update:modelValue', next)
  nextTick(() => {
    el.value = digitAt(i)
    if (ch && i < 5) inputs.value[i + 1]?.focus()
  })
}

function onKeydown(i: number, e: KeyboardEvent) {
  if (e.key === 'Backspace') {
    const el = e.target as HTMLInputElement
    if (!el.value && i > 0) {
      const cur = props.modelValue.replace(/\D/g, '')
      const next = cur.slice(0, i - 1) + cur.slice(i)
      emit('update:modelValue', next)
      nextTick(() => {
        inputs.value[i - 1]?.focus()
        const prev = inputs.value[i - 1]
        if (prev) prev.value = digitAt(i - 1)
        el.value = ''
      })
    }
  }
  if (e.key === 'ArrowLeft' && i > 0) {
    e.preventDefault()
    inputs.value[i - 1]?.focus()
  }
  if (e.key === 'ArrowRight' && i < 5) {
    e.preventDefault()
    inputs.value[i + 1]?.focus()
  }
}

function onPaste(e: ClipboardEvent) {
  e.preventDefault()
  const text = e.clipboardData?.getData('text').replace(/\D/g, '').slice(0, 6) ?? ''
  emit('update:modelValue', text)
  nextTick(() => {
    for (let k = 0; k < 6; k++) {
      const el = inputs.value[k]
      if (el) el.value = digitAt(k)
    }
    const j = Math.min(Math.max(text.length - 1, 0), 5)
    inputs.value[j]?.focus()
  })
}

function onFocus(i: number) {
  const el = inputs.value[i]
  if (el) el.select()
}

watch(
  () => props.modelValue,
  () => {
    nextTick(() => {
      for (let k = 0; k < 6; k++) {
        const el = inputs.value[k]
        if (el && el !== document.activeElement) el.value = digitAt(k)
      }
    })
  },
)

onMounted(() => {
  nextTick(() => {
    for (let k = 0; k < 6; k++) {
      const el = inputs.value[k]
      if (el) el.value = digitAt(k)
    }
    if (!props.noAutoFocus) inputs.value[0]?.focus()
  })
})
</script>

<template>
  <div class="ex-pin" :class="{ 'ex-pin--plain': plain }">
    <div class="ex-pin__row">
      <div class="ex-pin__cells" role="group" :aria-label="groupAriaLabel">
        <div v-for="i in 6" :key="i" class="ex-pin__slot">
          <input
            :ref="(el) => setInputRef(el, i - 1)"
            class="ex-pin__cell"
            :type="cellInputType"
            inputmode="numeric"
            maxlength="1"
            :autocomplete="i === 1 ? autocomplete : 'off'"
            :disabled="disabled"
            autocorrect="off"
            spellcheck="false"
            @input="onInput(i - 1, $event)"
            @keydown="onKeydown(i - 1, $event)"
            @focus="onFocus(i - 1)"
            @paste="i === 1 ? onPaste($event) : undefined"
          />
        </div>
      </div>
      <button
        v-if="!plain"
        type="button"
        class="ex-pin__toggle"
        :aria-label="reveal ? '隐藏密码' : '显示密码'"
        :disabled="disabled"
        @click="reveal = !reveal"
      >
        <svg v-if="reveal" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path
            fill="currentColor"
            d="M2.1 3.51 3.51 2.1 21.9 20.49 20.49 21.9l-2.19-2.19A11.8 11.8 0 0 1 12 21C7 21 2.73 17.89 1 13.5c.74-1.86 1.93-3.5 3.42-4.82L2.1 3.51Zm9.9 5.34a3.99 3.99 0 0 0-3.15 3.15l-2.2-2.2A7.93 7.93 0 0 1 12 6c1.6 0 3.1.37 4.43 1.02l-1.64 1.64A3.97 3.97 0 0 0 12 8.85Zm0 6.3c-.6 0-1.17-.13-1.68-.36l-1.26 1.26c.88.58 1.93.92 2.94.92a4 4 0 0 0 4-4c0-1.01-.34-2.06-.92-2.94l-1.26 1.26c.23.51.36 1.08.36 1.68a2.5 2.5 0 0 1-2.5 2.5ZM12 3c5 0 9.27 3.11 11 7.5a12.7 12.7 0 0 1-2.85 4.2l-1.45-1.45A10.5 10.5 0 0 0 21 10.5C19.55 7 16 4.5 12 4.5c-1.1 0-2.16.17-3.16.49L7.6 3.75C8.98 3.26 10.46 3 12 3Z"
          />
        </svg>
        <svg v-else viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path
            fill="currentColor"
            d="M12 5c-5 0-9.27 3.11-11 7.5C2.73 16.89 7 20 12 20s9.27-3.11 11-7.5C21.27 8.11 17 5 12 5Zm0 12a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9Zm0-2.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"
          />
        </svg>
      </button>
    </div>
    <div class="ex-pin__meta">
      <span class="ex-pin__track" aria-hidden="true">
        <span v-for="j in 6" :key="j" class="ex-pin__dot" :class="{ 'ex-pin__dot--on': modelValue.length >= j }" />
      </span>
      <span class="ex-pin__count">{{ modelValue.length }} / 6</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.ex-pin {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/** 验证码：六格铺满可用宽度，等分格宽，首尾贴齐容器左右 */
.ex-pin--plain {
  width: 100%;
}

.ex-pin--plain .ex-pin__row {
  width: 100%;
}

.ex-pin--plain .ex-pin__cells {
  flex: 1 1 auto;
  width: 100%;
  min-width: 0;
}

.ex-pin--plain .ex-pin__slot {
  flex: 1 1 0;
  min-width: 0;
  max-width: none;
}

.ex-pin__row {
  display: flex;
  align-items: center;
  gap: $space-2;
}

.ex-pin__cells {
  display: flex;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.ex-pin__slot {
  flex: 1;
  min-width: 0;
  max-width: 52px;
  border-radius: 8px;
  border: 1px solid $color-border;
  background: var(--ex-surface-inset-strong);
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease,
    background 0.15s ease;

  &:focus-within {
    border-color: rgba(240, 185, 11, 0.55);
    box-shadow: 0 0 0 1px rgba(240, 185, 11, 0.18);
  }
}

.ex-pin__cell {
  width: 100%;
  min-height: 46px;
  margin: 0;
  padding: 0;
  border: none;
  background: transparent;
  text-align: center;
  font-size: 20px;
  font-family: $font-family-mono;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
  border-radius: inherit;

  &:focus {
    outline: none;
  }

  &::-ms-reveal {
    display: none;
  }
}

.ex-pin__toggle {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid $color-border;
  border-radius: 8px;
  background: var(--ex-surface-inset);
  color: $color-text-tertiary;
  cursor: pointer;
  transition:
    color 0.15s ease,
    border-color 0.15s ease;

  &:hover:not(:disabled) {
    color: $color-brand;
    border-color: rgba(240, 185, 11, 0.35);
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
}

.ex-pin__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-2;
}

.ex-pin__track {
  display: flex;
  gap: 5px;
}

.ex-pin__dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--ex-border-subtle);
  transition: background 0.12s ease;
}

.ex-pin__dot--on {
  background: rgba(240, 185, 11, 0.75);
}

.ex-pin__count {
  font-size: 10px;
  font-family: $font-family-mono;
  color: $color-text-tertiary;
}
</style>
