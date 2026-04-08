<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  kind: 'kyc' | 'api'
}>()

const copy = computed(() => {
  if (props.kind === 'kyc') {
    return {
      title: '身份认证（KYC）',
      body: '接入第三方或自建 KYC 后，在此展示认证等级、限额与审核状态。建议 REST：GET /v1/users/kyc/status。',
      code: 'user.kyc.updated',
    }
  }
  return {
    title: 'API 管理',
    body: '创建与管理 API Key、绑定 IP 白名单与权限范围。生产需独立审计与风控策略。',
    code: 'POST /v1/users/api-keys',
  }
})
</script>

<template>
  <div class="uc-ph">
    <h2 class="uc-ph__title">{{ copy.title }}</h2>
    <p class="uc-ph__body">{{ copy.body }}</p>
    <p class="uc-ph__code">
      <span class="uc-ph__code-label">对接参考</span>
      <code class="uc-ph__code-val">{{ copy.code }}</code>
    </p>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.uc-ph {
  padding: $space-2 0 $space-4;
}

.uc-ph__title {
  margin: 0 0 $space-2;
  font-size: $font-size-lg;
  font-weight: $font-weight-bold;
}

.uc-ph__body {
  margin: 0 0 $space-4;
  font-size: $font-size-sm;
  color: $color-text-secondary;
  line-height: 1.6;
  max-width: 560px;
}

.uc-ph__code {
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: $space-2;
}

.uc-ph__code-label {
  font-size: $font-size-xs;
  color: $color-text-tertiary;
}

.uc-ph__code-val {
  padding: $space-2 $space-3;
  font-size: 11px;
  font-family: $font-family-mono;
  color: #8ab4ff;
  background: var(--ex-surface-inset-strong);
  border-radius: $radius-sm;
  border: 1px solid rgba(48, 132, 252, 0.25);
}
</style>
