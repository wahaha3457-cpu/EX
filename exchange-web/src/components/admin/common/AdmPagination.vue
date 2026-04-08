<script setup lang="ts">
withDefaults(
  defineProps<{
    total: number
    page: number
    pageSize: number
    pageSizes?: number[]
  }>(),
  {
    pageSizes: () => [10, 20, 50, 100],
  },
)

const emit = defineEmits<{
  (e: 'update:page', v: number): void
  (e: 'update:pageSize', v: number): void
}>()

function onSizeChange(s: number) {
  emit('update:pageSize', s)
  emit('update:page', 1)
}
</script>

<template>
  <div class="adm-page-wrap">
    <el-pagination
      background
      layout="total, sizes, prev, pager, next, jumper"
      :total="total"
      :current-page="page"
      :page-size="pageSize"
      :page-sizes="pageSizes"
      @current-change="emit('update:page', $event)"
      @size-change="onSizeChange"
    />
  </div>
</template>

<style scoped lang="scss">
.adm-page-wrap {
  display: flex;
  justify-content: flex-end;
  padding: 14px 0 0;
}

.adm-page-wrap :deep(.el-pagination) {
  padding: 8px 10px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 14px;
  background: linear-gradient(180deg, #fbfdff 0%, #f6f9fc 100%);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.92) inset,
    0 8px 18px rgba(15, 23, 42, 0.035);
}
</style>
