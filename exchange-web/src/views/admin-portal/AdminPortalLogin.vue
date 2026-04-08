<template>
  <div class="portal-login">
    <div class="portal-login__bg" aria-hidden="true" />
    <div class="portal-login__panel">
      <div class="portal-login__brand">
        <img class="portal-login__logo" src="/brand-logo.png" alt="" width="52" height="52" decoding="async" />
        <div>
          <h1 class="portal-login__title">运营后台</h1>
          <p class="portal-login__subtitle">Operations Console · 独立站点</p>
        </div>
      </div>

      <el-form
        ref="formRef"
        class="portal-login__form"
        :model="form"
        :rules="rules"
        label-position="top"
        @submit.prevent="onSubmit"
      >
        <el-form-item label="账号" prop="username">
          <el-input
            v-model="form.username"
            size="large"
            placeholder="邮箱或用户名"
            autocomplete="username"
            @keyup.enter="onSubmit"
          />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            size="large"
            show-password
            placeholder="登录密码"
            autocomplete="current-password"
            @keyup.enter="onSubmit"
          />
        </el-form-item>

        <el-alert
          v-if="errorMessage"
          type="error"
          :closable="false"
          class="portal-login__alert"
          :title="errorMessage"
        />

        <el-button
          type="primary"
          size="large"
          class="portal-login__submit"
          :loading="loading"
          native-type="submit"
          @click="onSubmit"
        >
          登录
        </el-button>
      </el-form>

      <p class="portal-login__hint">
        Mock 环境可使用测试账号登录；生产环境请使用具备管理员权限的账号。
      </p>
      <a
        v-if="exchangePublicUrl"
        class="portal-login__link"
        :href="exchangePublicUrl"
        target="_blank"
        rel="noopener noreferrer"
      >
        前往交易前台
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { RouteNames } from '@/constants/routeNames'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const formRef = ref<FormInstance>()
const loading = ref(false)
const errorMessage = ref('')

const form = reactive({
  username: '',
  password: '',
})

const rules: FormRules = {
  username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

const exchangePublicUrl = computed(() => {
  const u = import.meta.env.VITE_EXCHANGE_PUBLIC_URL as string | undefined
  return u?.trim() || ''
})

async function onSubmit() {
  errorMessage.value = ''
  await formRef.value?.validate(async (valid) => {
    if (!valid) return
    loading.value = true
    try {
      const u = form.username.trim()
      const channel = u.includes('@') ? 'email' : 'account'
      await auth.login({
        channel,
        principal: u,
        password: form.password,
      })
      const redirect = (route.query.redirect as string) || ''
      if (redirect && redirect.startsWith('/')) {
        await router.replace(redirect)
      } else {
        await router.replace({ name: RouteNames.AdminDashboard })
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '登录失败，请重试'
      errorMessage.value = msg
    } finally {
      loading.value = false
    }
  })
}
</script>

<style scoped>
.portal-login {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  position: relative;
  overflow: hidden;
  background: #0b1220;
}

.portal-login__bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 80% 50% at 50% -20%, rgba(59, 130, 246, 0.35), transparent),
    radial-gradient(ellipse 60% 40% at 100% 0%, rgba(16, 185, 129, 0.2), transparent),
    radial-gradient(ellipse 50% 30% at 0% 100%, rgba(99, 102, 241, 0.25), transparent);
  pointer-events: none;
}

.portal-login__panel {
  position: relative;
  width: 100%;
  max-width: 420px;
  padding: 40px 36px 32px;
  border-radius: 16px;
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(148, 163, 184, 0.2);
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(12px);
}

.portal-login__brand {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 28px;
}

.portal-login__logo {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  object-fit: contain;
  display: block;
  flex-shrink: 0;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
}

.portal-login__title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #f8fafc;
  letter-spacing: 0.02em;
}

.portal-login__subtitle {
  margin: 4px 0 0;
  font-size: 13px;
  color: #94a3b8;
}

.portal-login__form :deep(.el-form-item__label) {
  color: #cbd5e1;
  font-weight: 500;
}

.portal-login__form :deep(.el-input__wrapper) {
  background: rgba(30, 41, 59, 0.8);
  box-shadow: 0 0 0 1px rgba(148, 163, 184, 0.25) inset;
}

.portal-login__alert {
  margin-bottom: 16px;
}

.portal-login__submit {
  width: 100%;
  margin-top: 8px;
  font-weight: 600;
}

.portal-login__hint {
  margin: 20px 0 0;
  font-size: 12px;
  line-height: 1.5;
  color: #64748b;
  text-align: center;
}

.portal-login__link {
  display: block;
  margin-top: 12px;
  text-align: center;
  font-size: 13px;
  color: #60a5fa;
  text-decoration: none;
}

.portal-login__link:hover {
  text-decoration: underline;
}
</style>
