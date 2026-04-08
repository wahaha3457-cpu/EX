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
  margin-bottom: 12px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  background: var(--el-fill-color-light);
}

.adm-filter__form {
  width: 100%;
}

.adm-filter__row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 12px 16px;
}

.adm-filter__fields {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  flex: 1;
  min-width: 0;
}

.adm-filter__actions {
  display: flex;
  flex-shrink: 0;
  gap: 8px;
}
</style>
