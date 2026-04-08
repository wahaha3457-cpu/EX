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
  padding: 12px 0 0;
}
</style>
