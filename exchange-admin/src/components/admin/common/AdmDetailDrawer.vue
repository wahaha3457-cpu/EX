<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    modelValue: boolean
    title: string
    size?: string | number
  }>(),
  {
    size: '520px',
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
}>()
</script>

<template>
  <el-drawer
    :model-value="props.modelValue"
    :title="title"
    :size="size"
    destroy-on-close
    append-to-body
    class="adm-drawer"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <slot />
    <template v-if="$slots.footer" #footer>
      <slot name="footer" />
    </template>
  </el-drawer>
</template>

<style scoped lang="scss">
.adm-drawer :deep(.el-drawer__header) {
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--el-border-color-light);
  font-weight: 700;
}
</style>
