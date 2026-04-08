<script setup lang="ts">
/**
 * 通用查询筛选栏：左侧/默认插槽放表单项，右侧插槽放查询/重置。
 */
</script>

<template>
  <el-card class="adm-filter" shadow="never">
    <el-form class="adm-filter__form" label-position="left" label-width="auto" @submit.prevent>
      <div class="adm-filter__row">
        <div class="adm-filter__fields">
          <slot />
        </div>
        <div class="adm-filter__actions">
          <slot name="actions">
            <el-button type="primary">查询</el-button>
            <el-button>重置</el-button>
          </slot>
        </div>
      </div>
    </el-form>
  </el-card>
</template>

<style scoped lang="scss">
.adm-filter {
  margin-bottom: 16px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 14px;
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--el-bg-color) 92%, var(--el-fill-color-light)),
    color-mix(in srgb, var(--el-fill-color-light) 86%, var(--el-bg-color))
  );
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.92) inset,
    0 8px 18px rgba(15, 23, 42, 0.04);
}

.adm-filter__form {
  width: 100%;
}

.adm-filter :deep(.el-card__body) {
  padding: 16px 18px;
}

.adm-filter__row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 14px 18px;
}

.adm-filter__fields {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 18px;
  flex: 1;
  min-width: 0;
}

.adm-filter__actions {
  display: flex;
  flex-shrink: 0;
  gap: 10px;
  padding: 6px;
  border: 1px solid color-mix(in srgb, var(--el-border-color-light) 85%, white);
  border-radius: 12px;
  background: color-mix(in srgb, var(--el-bg-color) 88%, var(--el-fill-color-light));
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.9) inset;
}
</style>
