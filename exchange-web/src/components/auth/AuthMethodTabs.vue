<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { AuthChannel } from '@/types/auth'

const { t } = useI18n()

const props = withDefaults(
  defineProps<{
    modelValue: AuthChannel
    /** 影响无障碍名称 */
    variant?: 'login' | 'register'
  }>(),
  { variant: 'login' },
)

const emit = defineEmits<{
  (e: 'update:modelValue', v: AuthChannel): void
}>()

const items = computed(() => [
  { key: 'email' as const, label: t('auth.channel.email') },
  { key: 'phone' as const, label: t('auth.channel.phone') },
  { key: 'account' as const, label: t('auth.channel.account') },
])

const ariaLabel = computed(() =>
  props.variant === 'register' ? t('auth.methodTabs.ariaRegister') : t('auth.methodTabs.ariaLogin'),
)
</script>

<template>
  <div class="auth-method-tabs" role="tablist" :aria-label="ariaLabel">
    <button
      v-for="it in items"
      :key="it.key"
      type="button"
      class="auth-method-tabs__btn"
      role="tab"
      :aria-selected="modelValue === it.key"
      :class="{ 'auth-method-tabs__btn--active': modelValue === it.key }"
      @click="emit('update:modelValue', it.key)"
    >
      {{ it.label }}
    </button>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.auth-method-tabs {
  display: flex;
  gap: $space-1;
  padding: 3px;
  margin-bottom: $space-5;
  border-radius: $radius-md;
  background: var(--ex-fill-ghost);
  border: 1px solid var(--ex-border);
}

.auth-method-tabs__btn {
  flex: 1;
  padding: $space-2 $space-2;
  font-size: $font-size-sm;
  font-weight: $font-weight-medium;
  color: var(--ex-text-secondary);
  background: transparent;
  border: none;
  border-radius: $radius-sm;
  cursor: pointer;
  font-family: inherit;
  transition:
    color $duration-fast $ease-standard,
    background $duration-fast $ease-standard;
}

.auth-method-tabs__btn:hover {
  color: var(--ex-text-primary);
}

.auth-method-tabs__btn--active {
  color: var(--ex-text-primary);
  background: var(--ex-bg-elevated);
  box-shadow: var(--ex-shadow-card);
}

/*
 * 深色终端（登录/注册）：轨道与选中态点缀品牌色
 * 注意：须把完整选择器包进 :global(...)，否则 vue scoped 编译后会丢弃规则（父选择器在组件根外）。
 */
:global([data-theme='default'] .auth-method-tabs),
:global([data-theme='dark'] .auth-method-tabs),
:global(html.dark .auth-method-tabs) {
  background: color-mix(in srgb, var(--ex-brand-subtle) 55%, var(--ex-fill-ghost));
  border-color: color-mix(in srgb, var(--ex-brand) 32%, var(--ex-border));
  box-shadow:
    0 0 0 1px color-mix(in srgb, var(--ex-brand) 10%, transparent) inset,
    0 10px 28px color-mix(in srgb, #000000 28%, transparent);
}

:global([data-theme='default'] .auth-method-tabs__btn:hover:not(.auth-method-tabs__btn--active)),
:global([data-theme='dark'] .auth-method-tabs__btn:hover:not(.auth-method-tabs__btn--active)),
:global(html.dark .auth-method-tabs__btn:hover:not(.auth-method-tabs__btn--active)) {
  color: color-mix(in srgb, var(--ex-brand-hover) 50%, var(--ex-text-secondary));
}

:global([data-theme='default'] .auth-method-tabs__btn--active),
:global([data-theme='dark'] .auth-method-tabs__btn--active),
:global(html.dark .auth-method-tabs__btn--active) {
  color: var(--ex-brand);
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--ex-brand) 26%, var(--ex-bg-elevated)) 0%,
    color-mix(in srgb, var(--ex-brand) 11%, var(--ex-bg-surface)) 100%
  );
  font-weight: $font-weight-semibold;
  box-shadow:
    0 0 0 1px color-mix(in srgb, var(--ex-brand) 38%, transparent),
    0 0 24px color-mix(in srgb, var(--ex-brand) 18%, transparent),
    0 8px 20px color-mix(in srgb, #000000 42%, transparent);
}

:global([data-theme='default'] .auth-method-tabs__btn--active:focus-visible),
:global([data-theme='dark'] .auth-method-tabs__btn--active:focus-visible),
:global(html.dark .auth-method-tabs__btn--active:focus-visible) {
  outline: 2px solid color-mix(in srgb, var(--ex-brand) 55%, transparent);
  outline-offset: 2px;
}
</style>
