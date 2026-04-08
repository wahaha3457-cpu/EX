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
  gap: 10px 14px;
  margin-bottom: 12px;
  padding: 12px 14px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 14px;
  background: linear-gradient(180deg, #fbfdff 0%, #f6f9fc 100%);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.92) inset,
    0 8px 18px rgba(15, 23, 42, 0.035);
}

.adm-tb__title {
  font-size: 14px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  letter-spacing: 0.03em;
}

.adm-tb__left,
.adm-tb__right {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
</style>
