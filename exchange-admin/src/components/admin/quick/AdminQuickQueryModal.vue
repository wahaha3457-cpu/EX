<script setup lang="ts">
import { computed } from 'vue'
import { Search } from '@element-plus/icons-vue'
import AdminQuickQueryPanel from './AdminQuickQueryPanel.vue'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v),
})

</script>

<template>
  <el-dialog
    v-model="visible"
    class="adm-quick-query-dialog"
    width="min(1100px, 94vw)"
    top="4vh"
    destroy-on-close
    append-to-body
    :close-on-click-modal="false"
  >
    <template #header>
      <div class="adm-quick-query-dialog__head">
        <span class="adm-quick-query-dialog__icon" aria-hidden="true">
          <el-icon><Search /></el-icon>
        </span>
        <div class="adm-quick-query-dialog__titles">
          <span class="adm-quick-query-dialog__badge">常用 · 快捷</span>
          <span class="adm-quick-query-dialog__title">综合查询</span>
        </div>
        <p class="adm-quick-query-dialog__sub">
          一站式检索用户、订单与资金流水
          <code class="adm-quick-query-dialog__code">POST /v1/admin/search</code>
        </p>
      </div>
    </template>
    <div class="adm-quick-query-dialog__body">
      <AdminQuickQueryPanel />
    </div>
  </el-dialog>
</template>

<style lang="scss">
.adm-quick-query-dialog.el-dialog {
  border-radius: 18px !important;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, #a78bfa 35%, rgba(255, 255, 255, 0.1)) !important;
  background: linear-gradient(
    165deg,
    #1a1f2a 0%,
    #1e1b2e 45%,
    #151a22 100%
  ) !important;
  box-shadow:
    0 24px 64px rgba(0, 0, 0, 0.55),
    0 0 80px color-mix(in srgb, #7c3aed 12%, transparent) !important;
}

.adm-quick-query-dialog .el-dialog__header {
  margin: 0 !important;
  padding: 18px 20px 14px !important;
  border-bottom: 1px solid color-mix(in srgb, #6366f1 22%, rgba(255, 255, 255, 0.08));
  background: color-mix(in srgb, #7c3aed 8%, transparent);
}

.adm-quick-query-dialog .el-dialog__title {
  width: 100%;
}

.adm-quick-query-dialog .el-dialog__body {
  padding: 16px 20px 22px !important;
  max-height: calc(100vh - 200px);
  overflow: auto;
}

.adm-quick-query-dialog__head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 12px 14px;
}

.adm-quick-query-dialog__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  font-size: 22px;
  color: #e0e7ff;
  background: linear-gradient(
    145deg,
    color-mix(in srgb, #7c3aed 45%, transparent),
    color-mix(in srgb, #0891b2 28%, transparent)
  );
  border: 1px solid color-mix(in srgb, #a78bfa 35%, transparent);
  box-shadow: 0 0 28px color-mix(in srgb, #7c3aed 25%, transparent);
}

.adm-quick-query-dialog__titles {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.adm-quick-query-dialog__badge {
  display: inline-block;
  width: fit-content;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.06em;
  color: #e9d5ff;
  background: color-mix(in srgb, #7c3aed 42%, transparent);
  border: 1px solid color-mix(in srgb, #c4b5fd 38%, transparent);
}

.adm-quick-query-dialog__title {
  font-size: 20px;
  font-weight: 800;
  letter-spacing: 0.02em;
  color: #f8fafc;
}

.adm-quick-query-dialog__sub {
  flex: 1 1 100%;
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  color: #9aa3b5;
}

.adm-quick-query-dialog__code {
  display: inline-block;
  margin-left: 8px;
  padding: 2px 8px;
  font-size: 11px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid color-mix(in srgb, #22d3ee 22%, transparent);
  color: #c4b5fd;
}

.adm-quick-query-dialog__body {
  min-height: 0;
}
</style>
