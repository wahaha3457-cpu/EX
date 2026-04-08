<script setup lang="ts">
/**
 * 单行密码输入 + 显示/隐藏（与登录页、六格 Pin 的睁眼/闭眼图标一致）。
 */
import { ref } from 'vue'

withDefaults(
  defineProps<{
    modelValue: string
    id?: string
    placeholder?: string
    autocomplete?: string
    disabled?: boolean
    /** 合并到内部 input，如站点的 ex-input */
    inputClass?: string | string[] | Record<string, boolean>
  }>(),
  {
    id: undefined,
    placeholder: '',
    autocomplete: 'current-password',
    disabled: false,
    inputClass: undefined,
  },
)

const emit = defineEmits<{ 'update:modelValue': [string] }>()

const reveal = ref(false)

function onInput(e: Event) {
  emit('update:modelValue', (e.target as HTMLInputElement).value)
}
</script>

<template>
  <div class="ex-pw">
    <input
      :id="id"
      class="ex-pw__input"
      :class="inputClass"
      :type="reveal ? 'text' : 'password'"
      :value="modelValue"
      :placeholder="placeholder"
      :autocomplete="autocomplete"
      :disabled="disabled"
      @input="onInput"
    />
    <button
      type="button"
      class="ex-pw__toggle"
      :aria-label="reveal ? '隐藏密码' : '显示密码'"
      :disabled="disabled"
      tabindex="-1"
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
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.ex-pw {
  position: relative;
  display: flex;
  align-items: center;
}

.ex-pw__input {
  width: 100%;
  padding: 12px 44px 12px $space-3;
  border-radius: $radius-sm;
  border: 1px solid $color-border;
  background: var(--ex-surface-inset-strong);
  color: $color-text-primary;
  font-size: $font-size-sm;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: rgba(240, 185, 11, 0.45);
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
}

.ex-pw__toggle {
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  width: 36px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: $radius-sm;
  background: transparent;
  color: $color-text-tertiary;
  cursor: pointer;
  transition: color 0.15s ease;

  &:hover:not(:disabled) {
    color: $color-brand;
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
}
</style>
