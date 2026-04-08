<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { mockDelay, useAdminListUi } from '@/composables/admin/useAdminListUi'

const route = useRoute()
const title = computed(() => (route.meta.title as string) || '配置')

const { loading, withLoading } = useAdminListUi()

const form = ref({
  enabled: true,
  threshold: '1000',
  remark: '',
})

const initial = () => ({ ...form.value })

const snapshot = ref(initial())

function handleReset() {
  form.value = { ...snapshot.value }
  ElMessage.info('已恢复为上次保存内容')
}

async function handleSave() {
  await withLoading(async () => {
    await mockDelay()
    snapshot.value = { ...form.value }
    ElMessage.success('已保存（演示，未调用接口）')
  })
}
</script>

<template>
  <div class="adm-cfg-leaf" v-loading="loading">
    <header class="adm-cfg-leaf__head">
      <h1 class="adm-cfg-leaf__title">{{ title }}</h1>
      <p class="adm-cfg-leaf__desc">
        以下为演示表单：保存 / 重置会给出反馈；接入接口后可替换为真实读写与审计日志。
      </p>
    </header>
    <el-card shadow="never" class="adm-cfg-leaf__card">
      <el-form label-width="120px" class="adm-cfg-leaf__form">
        <el-form-item label="开关">
          <el-switch v-model="form.enabled" />
        </el-form-item>
        <el-form-item label="阈值（演示）">
          <el-input v-model="form.threshold" placeholder="数值字符串" style="max-width: 280px" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="form.remark"
            type="textarea"
            :rows="4"
            placeholder="运维备注（演示）"
            style="max-width: 520px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSave">保存</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.adm-cfg-leaf__head {
  margin-bottom: 14px;
}

.adm-cfg-leaf__title {
  margin: 0 0 6px;
  font-size: 18px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.adm-cfg-leaf__desc {
  margin: 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  line-height: 1.5;
}

.adm-cfg-leaf__card {
  border-radius: 12px;
  border: 1px solid var(--el-border-color-light);
  background: var(--el-bg-color);
}

.adm-cfg-leaf__form {
  max-width: 640px;
  padding: 8px 0;
}
</style>
