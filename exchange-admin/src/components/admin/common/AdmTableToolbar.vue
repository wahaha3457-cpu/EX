<script setup lang="ts">
defineProps<{
  title?: string
}>()
</script>

<template>
  <div class="adm-tb">
    <div class="adm-tb__left">
      <span v-if="title" class="adm-tb__title">{{ title }}</span>
      <slot name="left" />
    </div>
    <div class="adm-tb__right">
      <slot name="right" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.adm-tb {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px 12px;
  margin-bottom: 10px;
}

.adm-tb__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  letter-spacing: 0.02em;
}

.adm-tb__left,
.adm-tb__right {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
</style>
