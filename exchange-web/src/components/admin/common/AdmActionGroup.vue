<script setup lang="ts">
/**
 * 表格行内操作按钮组：统一间距与文字按钮风格。
 */
</script>

<template>
  <div class="adm-act">
    <slot />
  </div>
</template>

<style scoped lang="scss">
.adm-act {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
}

.adm-act :deep(.el-button.is-link) {
  padding: 4px 6px;
  font-weight: 600;
}
</style>
