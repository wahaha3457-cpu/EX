<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { mockDelay, useAdminListUi } from '@/composables/admin/useAdminListUi'

const { t } = useI18n()
const { loading, withLoading } = useAdminListUi()

const form = reactive({
  oldPwd: '',
  newPwd: '',
  confirmPwd: '',
})

const formRef = ref()

async function submit() {
  if (form.newPwd.length < 8) {
    ElMessage.warning(t('admin.account.loginPassword.errShort'))
    return
  }
  if (form.newPwd !== form.confirmPwd) {
    ElMessage.warning(t('admin.account.loginPassword.errMismatch'))
    return
  }
  await withLoading(async () => {
    await mockDelay()
    ElMessage.success(t('admin.account.loginPassword.ok'))
    form.oldPwd = ''
    form.newPwd = ''
    form.confirmPwd = ''
  })
}
</script>

<template>
  <div class="adm-acct-pwd" v-loading="loading">
    <header class="adm-acct-pwd__head">
      <h1 class="adm-acct-pwd__title">{{ t('routes.meta.adminAccountLoginPassword') }}</h1>
      <p class="adm-acct-pwd__desc">{{ t('admin.account.loginPassword.desc') }}</p>
    </header>
    <el-card shadow="never" class="adm-acct-pwd__card">
      <el-form
        ref="formRef"
        label-width="140px"
        class="adm-acct-pwd__form"
        @submit.prevent="submit"
      >
        <el-form-item :label="t('admin.account.loginPassword.old')">
          <el-input v-model="form.oldPwd" type="password" show-password autocomplete="current-password" />
        </el-form-item>
        <el-form-item :label="t('admin.account.loginPassword.new')">
          <el-input v-model="form.newPwd" type="password" show-password autocomplete="new-password" />
        </el-form-item>
        <el-form-item :label="t('admin.account.loginPassword.confirm')">
          <el-input v-model="form.confirmPwd" type="password" show-password autocomplete="new-password" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="submit">{{ t('admin.account.loginPassword.submit') }}</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.adm-acct-pwd__head {
  margin-bottom: 14px;
}

.adm-acct-pwd__title {
  margin: 0 0 6px;
  font-size: 18px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.adm-acct-pwd__desc {
  margin: 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  line-height: 1.5;
  max-width: 720px;
}

.adm-acct-pwd__card {
  max-width: 520px;
  border-radius: 12px;
  border: 1px solid var(--el-border-color-light);
  background: var(--el-bg-color);
}

.adm-acct-pwd__form :deep(.el-input) {
  max-width: 320px;
}
</style>
