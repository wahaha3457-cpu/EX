<script setup lang="ts">
/** 条件单列表占位：接入 algo / conditional orders API 后替换为真实表格 */
</script>

<template>
  <div class="ccp-cond" role="region" aria-label="条件单">
    <div class="ccp-cond__inner">
      <p class="ccp-cond__title">条件单</p>
      <p class="ccp-cond__desc">
        触发价、计划委托、止损限价等将在此展示；订阅
        <code class="ccp-cond__code">user.conditional_orders</code>
        或 REST 分页拉取。
      </p>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.ccp-cond {
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $space-6;
}

.ccp-cond__inner {
  max-width: 480px;
  text-align: center;
}

.ccp-cond__title {
  margin: 0 0 $space-2;
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  color: $color-text-secondary;
}

.ccp-cond__desc {
  margin: 0;
  font-size: $font-size-xs;
  color: $color-text-tertiary;
  line-height: 1.6;
}

.ccp-cond__code {
  display: inline-block;
  margin-top: $space-2;
  padding: 2px $space-2;
  font-size: 10px;
  font-family: $font-family-mono;
  color: #8ab4ff;
  background: var(--ex-surface-inset-strong);
  border-radius: $radius-sm;
}
</style>
