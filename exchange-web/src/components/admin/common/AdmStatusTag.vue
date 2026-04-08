<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    /** 业务状态码或枚举名 */
    status: string
    /** 自定义映射表 */
    map?: Record<string, { label: string; type: 'success' | 'warning' | 'danger' | 'info' }>
  }>(),
  {
    map: () => ({}),
  },
)

const DEFAULT_MAP: Record<string, { label: string; type: 'success' | 'warning' | 'danger' | 'info' }> = {
  ACTIVE: { label: '正常', type: 'success' },
  ENABLED: { label: '启用', type: 'success' },
  SUCCESS: { label: '成功', type: 'success' },
  PENDING: { label: '待处理', type: 'warning' },
  AUDIT: { label: '审核中', type: 'warning' },
  DISABLED: { label: '停用', type: 'info' },
  REJECTED: { label: '拒绝', type: 'danger' },
  FAILED: { label: '失败', type: 'danger' },
  RISK: { label: '风险', type: 'danger' },
}

const resolved = computed(() => {
  const m = props.map[props.status] ?? DEFAULT_MAP[props.status]
  if (m) return m
  return { label: props.status, type: 'info' as const }
})
</script>

<template>
  <el-tag :type="resolved.type" effect="dark" size="small" class="adm-tag">
    {{ resolved.label }}
  </el-tag>
</template>

<style scoped lang="scss">
.adm-tag {
  font-weight: 600;
  border: none;
}
</style>
