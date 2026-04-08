<template>
  <div class="portal-login">
    <!-- 背景舞台：层次由远及近 -->
    <div class="portal-login__stage" aria-hidden="true">
      <div class="portal-login__bg-base" />
      <div class="portal-login__bg-aurora portal-login__bg-aurora--a" />
      <div class="portal-login__bg-aurora portal-login__bg-aurora--b" />
      <div class="portal-login__bg-aurora portal-login__bg-aurora--c" />
      <div class="portal-login__bg-grid" />
      <div class="portal-login__bg-nodes" />
      <div class="portal-login__bg-code" aria-hidden="true">
        <pre class="portal-login__bg-code-text">{{ codeBackdrop }}</pre>
        <div class="portal-login__bg-code-beam" />
      </div>
      <svg
        class="portal-login__robot"
        viewBox="0 0 360 480"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="pl-robot-g" x1="40" y1="0" x2="320" y2="480" gradientUnits="userSpaceOnUse">
            <stop stop-color="#22d3ee" stop-opacity="0.95" />
            <stop offset="0.45" stop-color="#a5b4fc" stop-opacity="0.85" />
            <stop offset="1" stop-color="#f0abfc" stop-opacity="0.75" />
          </linearGradient>
          <linearGradient id="pl-visor" x1="120" y1="120" x2="240" y2="200" gradientUnits="userSpaceOnUse">
            <stop stop-color="#67e8f9" stop-opacity="0.9" />
            <stop offset="1" stop-color="#c4b5fd" stop-opacity="0.5" />
          </linearGradient>
          <filter id="pl-soft-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <g class="portal-login__robot-group" filter="url(#pl-soft-glow)">
          <!-- 天线 / 传感 -->
          <path
            d="M180 28v32M168 44h24M180 18l8-12M172 18l-8-12"
            stroke="url(#pl-robot-g)"
            stroke-width="1.5"
            stroke-linecap="round"
          />
          <!-- 头部轮廓 -->
          <path
            d="M180 68c-48 0-86 38-86 86v12c0 22 18 40 40 40h92c22 0 40-18 40-40v-12c0-48-38-86-86-86Z"
            stroke="url(#pl-robot-g)"
            stroke-width="1.35"
          />
          <!-- 面罩 / 视觉核心 -->
          <path
            class="portal-login__robot-visor"
            d="M118 142h124a8 8 0 0 1 8 8v28a8 8 0 0 1-8 8H118a8 8 0 0 1-8-8v-28a8 8 0 0 1 8-8Z"
            stroke="url(#pl-robot-g)"
            stroke-width="1.2"
            fill="url(#pl-visor)"
            fill-opacity="0.12"
          />
          <!-- 胸腔骨架 -->
          <path
            d="M96 248c0-8 6-14 14-14h140c8 0 14 6 14 14v118c0 10-8 18-18 18H114c-10 0-18-8-18-18V248Z"
            stroke="url(#pl-robot-g)"
            stroke-width="1.25"
          />
          <!-- 能量芯 -->
          <circle
            class="portal-login__robot-core"
            cx="180"
            cy="310"
            r="22"
            stroke="url(#pl-robot-g)"
            stroke-width="1.2"
            fill="none"
          />
          <circle cx="180" cy="310" r="6" fill="url(#pl-visor)" fill-opacity="0.35" />
          <!-- 肩臂结构线 -->
          <path
            d="M96 268H52c-12 0-22 10-22 22v56M264 268h44c12 0 22 10 22 22v56M72 388v52M288 388v52"
            stroke="url(#pl-robot-g)"
            stroke-width="1.15"
            stroke-linecap="round"
          />
          <!-- 数据流竖线 -->
          <path
            class="portal-login__robot-pulse"
            d="M180 352v88"
            stroke="url(#pl-robot-g)"
            stroke-width="2"
            stroke-linecap="round"
            stroke-dasharray="6 14"
          />
        </g>
      </svg>
      <div class="portal-login__bg-vignette" />
    </div>

    <div class="portal-login__panel">
      <div class="portal-login__panel-rim" aria-hidden="true" />
      <div class="portal-login__panel-glow" aria-hidden="true" />
      <div class="portal-login__panel-sheen" aria-hidden="true" />

      <header class="portal-login__panel-head">
        <span class="portal-login__kicker">
          <span class="portal-login__kicker-dot" />
          {{ t('admin.portalLogin.kicker') }}
        </span>
        <div
          class="portal-login__lang"
          role="group"
          :aria-label="t('admin.portalLogin.langAria')"
        >
          <button
            type="button"
            class="portal-login__lang-btn"
            :class="{ 'is-active': isZhLocale }"
            @click="setLoginLang('zh-CN')"
          >
            {{ t('admin.portalLogin.langZh') }}
          </button>
          <button
            type="button"
            class="portal-login__lang-btn"
            :class="{ 'is-active': locale === 'en' }"
            @click="setLoginLang('en')"
          >
            {{ t('admin.portalLogin.langEn') }}
          </button>
        </div>
      </header>

      <div class="portal-login__brand">
        <OpsAiMark class="portal-login__logo" :size="60" glow />
        <h1 class="portal-login__title">{{ t('admin.portalLogin.title') }}</h1>
        <p class="portal-login__subtitle">{{ t('admin.portalLogin.subtitle') }}</p>
      </div>

      <div class="portal-login__form-wrap">
        <el-form
          ref="formRef"
          class="portal-login__form"
          :model="form"
          :rules="rules"
          label-position="top"
          @submit.prevent="onSubmit"
        >
          <el-form-item :label="t('admin.portalLogin.account')" prop="username">
            <el-input
              v-model="form.username"
              size="large"
              :placeholder="t('admin.portalLogin.accountPh')"
              autocomplete="username"
              @keyup.enter="onSubmit"
            />
          </el-form-item>
          <el-form-item :label="t('admin.portalLogin.password')" prop="password">
            <el-input
              v-model="form.password"
              type="password"
              size="large"
              show-password
              :placeholder="t('admin.portalLogin.passwordPh')"
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
            {{ t('admin.portalLogin.submit') }}
          </el-button>
        </el-form>
      </div>

      <p class="portal-login__hint">
        {{ t('admin.portalLogin.hint') }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import type { FormInstance, FormRules } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { RouteNames } from '@/constants/routeNames'
import OpsAiMark from '@/components/brand/OpsAiMark.vue'

/** 登录页背景装饰：静态代码质感（无逻辑，仅展示） */
const codeBackdrop = [
  '7a3f2b01  e4c8902a  01101001  // ops.auth.signaling',
  'b91e44c7  3f802d11  11010010  // vault.session.rotate',
  '4c00a8ff  9b2e7710  00110101  // risk.engine.shard_03',
  '2d8f1a3e  55cc0091  10011001  // ledger.snapshot.delta',
  'e903bb12  7a0043f2  01101100  // match.depth.replay',
  '1f44c0aa  c18d2200  10101010  // ws.gateway.backpressure',
  '88aa3901  02ff91ab  01000111  // custody.hot.wallet_sig',
  '0c71de4f  6e10aa33  11001100  // audit.trail.append',
  'f4002b9c  31c0dead  00110011  // ops.neural.infer_stub',
  '5aa501ef  90ab1240  11110000  // margin.cross.liquidator',
  '3c9f01aa  77220011  01010101  // index.price.aggregate',
  'd0d0beef  00c0ffee  10000110  // chain.watch.confirm_12',
  '9e01face  41414141  01111000  // api.rate.token_bucket',
  'cafebabe  600dcafe  10110110  // mock.seed.admin_user',
].join('\n')

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const appStore = useAppStore()
const { locale } = storeToRefs(appStore)
const { t } = useI18n()

const formRef = ref<FormInstance>()
const loading = ref(false)
const errorMessage = ref('')

const form = reactive({
  username: '',
  password: '',
})

const rules = computed<FormRules>(() => ({
  username: [{ required: true, message: t('admin.portalLogin.ruleUser'), trigger: 'blur' }],
  password: [{ required: true, message: t('admin.portalLogin.rulePass'), trigger: 'blur' }],
}))

const isZhLocale = computed(() => String(locale.value).startsWith('zh'))

function setLoginLang(code: 'zh-CN' | 'en') {
  appStore.setLocale(code)
  void nextTick(() => formRef.value?.clearValidate())
}

watch(locale, () => {
  void nextTick(() => formRef.value?.clearValidate())
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
      const msg = e instanceof Error ? e.message : t('admin.portalLogin.loginFail')
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
  padding: clamp(16px, 4vw, 48px);
  position: relative;
  overflow: hidden;
  background: #010409;
}

.portal-login__stage {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.portal-login__bg-base {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 95% 65% at 50% 115%, rgba(49, 46, 129, 0.22), transparent 52%),
    radial-gradient(ellipse 75% 48% at 0% 0%, rgba(8, 51, 68, 0.28), transparent 55%),
    radial-gradient(ellipse 65% 50% at 100% 12%, rgba(49, 46, 129, 0.18), transparent 50%),
    linear-gradient(180deg, #010409 0%, #0b1220 42%, #010409 100%);
}

/* 极光：静态、压低亮度 */
.portal-login__bg-aurora {
  position: absolute;
  border-radius: 50%;
  filter: blur(88px);
  mix-blend-mode: screen;
  opacity: 0.32;
}

.portal-login__bg-aurora--a {
  width: min(95vw, 720px);
  height: min(95vw, 720px);
  left: -24%;
  top: -32%;
  background: radial-gradient(circle, rgba(34, 211, 238, 0.35) 0%, transparent 62%);
}

.portal-login__bg-aurora--b {
  width: min(85vw, 600px);
  height: min(85vw, 600px);
  right: -28%;
  bottom: -22%;
  background: radial-gradient(circle, rgba(129, 140, 248, 0.28) 0%, transparent 65%);
}

.portal-login__bg-aurora--c {
  width: min(55vw, 420px);
  height: min(55vw, 420px);
  left: 32%;
  top: 36%;
  background: radial-gradient(circle, rgba(56, 189, 248, 0.15) 0%, transparent 68%);
}

.portal-login__bg-grid {
  position: absolute;
  left: -35%;
  right: -35%;
  top: -12%;
  bottom: -45%;
  background-image:
    linear-gradient(rgba(56, 189, 248, 0.055) 1px, transparent 1px),
    linear-gradient(90deg, rgba(148, 163, 184, 0.04) 1px, transparent 1px);
  background-size: 52px 52px;
  transform-origin: 50% 0%;
  transform: perspective(820px) rotateX(74deg) scale(1.2);
  mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.2) 0%, rgba(0, 0, 0, 0.55) 40%, transparent 88%);
  opacity: 0.45;
}

.portal-login__bg-nodes {
  position: absolute;
  inset: 0;
  opacity: 0.35;
  background-image:
    radial-gradient(circle at 10% 20%, rgba(56, 189, 248, 0.2) 0, transparent 2px),
    radial-gradient(circle at 90% 15%, rgba(129, 140, 248, 0.18) 0, transparent 2px),
    radial-gradient(circle at 82% 68%, rgba(34, 211, 238, 0.14) 0, transparent 2px),
    radial-gradient(circle at 18% 75%, rgba(148, 163, 184, 0.12) 0, transparent 2px);
  background-size:
    200px 200px,
    240px 240px,
    220px 220px,
    200px 200px;
}

/* 代码底纹 + 横向荧光扫描（唯一主动态） */
.portal-login__bg-code {
  position: absolute;
  inset: 0;
  overflow: hidden;
  z-index: 0;
}

.portal-login__bg-code-text {
  margin: 0;
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  padding: 2vh 4vw;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: clamp(9px, 1.05vw, 11px);
  line-height: 1.85;
  letter-spacing: 0.04em;
  color: rgba(100, 116, 139, 0.38);
  text-align: left;
  white-space: pre;
  user-select: none;
  pointer-events: none;
}

.portal-login__bg-code-beam {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: min(42vw, 420px);
  margin-left: -42vw;
  max-width: 420px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(34, 211, 238, 0.04) 18%,
    rgba(165, 243, 252, 0.14) 42%,
    rgba(103, 232, 249, 0.32) 50%,
    rgba(165, 243, 252, 0.14) 58%,
    rgba(34, 211, 238, 0.04) 82%,
    transparent 100%
  );
  box-shadow:
    0 0 40px 2px rgba(56, 189, 248, 0.12),
    0 0 80px 8px rgba(103, 232, 249, 0.06);
  mix-blend-mode: screen;
  filter: blur(0.5px);
  pointer-events: none;
  animation: pl-code-sweep 18s cubic-bezier(0.45, 0.05, 0.25, 1) infinite;
}

@keyframes pl-code-sweep {
  0% {
    transform: translateX(0);
    opacity: 0;
  }
  6% {
    opacity: 1;
  }
  44% {
    transform: translateX(200vw);
    opacity: 1;
  }
  52% {
    transform: translateX(200vw);
    opacity: 0;
  }
  100% {
    transform: translateX(200vw);
    opacity: 0;
  }
}

.portal-login__robot {
  position: absolute;
  right: max(-5vw, -56px);
  top: 50%;
  width: min(46vw, 400px);
  max-height: 88vh;
  transform: translateY(-50%);
  opacity: 0.26;
  z-index: 1;
  filter: drop-shadow(0 0 20px rgba(56, 189, 248, 0.18));
}

.portal-login__bg-vignette {
  position: absolute;
  inset: 0;
  box-shadow: inset 0 0 120px rgba(0, 0, 0, 0.62);
  z-index: 2;
}

/* —— 登录面板：约为原尺寸 5/6，精致；宽度随视口自适应 —— */
.portal-login__panel {
  position: relative;
  z-index: 10;
  width: min(100%, calc(100vw - clamp(20px, 5vw, 40px)));
  max-width: min(394px, calc(100vw - 24px));
  padding: 0 0 27px;
  border-radius: 20px;
  background: linear-gradient(
    168deg,
    rgba(71, 85, 105, 0.5) 0%,
    rgba(51, 65, 85, 0.72) 22%,
    rgba(30, 41, 59, 0.88) 55%,
    rgba(15, 23, 42, 0.92) 100%
  );
  border: 1px solid rgba(255, 255, 255, 0.14);
  box-shadow:
    0 0 0 1px rgba(56, 189, 248, 0.12),
    0 1px 0 rgba(255, 255, 255, 0.2) inset,
    0 -1px 0 rgba(0, 0, 0, 0.2) inset,
    0 40px 100px rgba(0, 0, 0, 0.55),
    0 0 80px rgba(56, 189, 248, 0.14),
    0 0 120px rgba(129, 140, 248, 0.1);
  backdrop-filter: blur(26px) saturate(1.35);
  -webkit-backdrop-filter: blur(26px) saturate(1.35);
  overflow: hidden;
}

.portal-login__panel-rim {
  position: absolute;
  inset: 0;
  border-radius: 20px;
  padding: 1px;
  background: linear-gradient(
    145deg,
    rgba(103, 232, 249, 0.55) 0%,
    rgba(129, 140, 248, 0.35) 35%,
    rgba(244, 114, 182, 0.25) 70%,
    rgba(56, 189, 248, 0.4) 100%
  );
  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
  z-index: 3;
  opacity: 0.75;
}

.portal-login__panel-glow {
  position: absolute;
  inset: -30%;
  border-radius: 34px;
  pointer-events: none;
  background: radial-gradient(
    circle at 50% 0%,
    rgba(56, 189, 248, 0.2) 0%,
    transparent 42%
  );
  z-index: 0;
  filter: blur(40px);
  opacity: 0.9;
}

.portal-login__panel-sheen {
  position: absolute;
  top: 0;
  left: 10%;
  right: 10%;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.55),
    rgba(186, 230, 253, 0.8),
    rgba(255, 255, 255, 0.55),
    transparent
  );
  z-index: 4;
  pointer-events: none;
}

.portal-login__panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 20px 13px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.06) 0%, transparent 100%);
  position: relative;
  z-index: 2;
}

.portal-login__kicker {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(103, 232, 249, 0.9);
}

.portal-login__kicker-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: linear-gradient(135deg, #22d3ee, #a78bfa);
  box-shadow: 0 0 12px rgba(56, 189, 248, 0.85);
  animation: pl-kicker-pulse 2s ease-in-out infinite;
}

@keyframes pl-kicker-pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.75;
    transform: scale(0.92);
  }
}

.portal-login__lang {
  display: inline-flex;
  padding: 3px;
  border-radius: 10px;
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.25);
  gap: 3px;
}

.portal-login__lang-btn {
  margin: 0;
  padding: 6px 12px;
  border: none;
  border-radius: 7px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  cursor: pointer;
  color: #94a3b8;
  background: transparent;
  transition:
    color 0.2s ease,
    background 0.2s ease,
    box-shadow 0.2s ease;
}

.portal-login__lang-btn:hover {
  color: #f1f5f9;
  background: rgba(255, 255, 255, 0.08);
}

.portal-login__lang-btn.is-active {
  color: #0f172a;
  background: linear-gradient(135deg, #67e8f9, #a5b4fc);
  box-shadow: 0 2px 14px rgba(56, 189, 248, 0.35);
}

.portal-login__brand {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 23px 26px 6px;
}

.portal-login__logo {
  margin-bottom: 15px;
}

.portal-login__title {
  margin: 0;
  font-size: clamp(1.28rem, 3.4vw, 1.54rem);
  font-weight: 800;
  letter-spacing: 0.05em;
  line-height: 1.2;
  color: #f8fafc;
  text-shadow: 0 2px 20px rgba(15, 23, 42, 0.5);
}

.portal-login__subtitle {
  margin: 10px 0 0;
  max-width: min(268px, 100%);
  font-size: 12px;
  line-height: 1.55;
  color: #cbd5e1;
  font-weight: 500;
}

.portal-login__form-wrap {
  position: relative;
  z-index: 2;
  margin: 7px 20px 0;
  padding: 20px 18px 18px;
  border-radius: 15px;
  background: linear-gradient(165deg, rgba(15, 23, 42, 0.55) 0%, rgba(2, 6, 23, 0.45) 100%);
  border: 1px solid rgba(255, 255, 255, 0.07);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.05) inset,
    0 12px 40px rgba(0, 0, 0, 0.22);
}

.portal-login__form :deep(.el-form-item) {
  margin-bottom: 17px;
}

.portal-login__form :deep(.el-form-item__label) {
  color: #e2e8f0;
  font-weight: 600;
  font-size: 12px;
}

.portal-login__form :deep(.el-input__wrapper) {
  background: rgba(15, 23, 42, 0.65);
  box-shadow:
    0 0 0 1px rgba(148, 163, 184, 0.25) inset,
    0 2px 14px rgba(0, 0, 0, 0.18) inset;
  border-radius: 10px;
  transition: box-shadow 0.2s ease;
}

.portal-login__form :deep(.el-input__wrapper:hover) {
  box-shadow:
    0 0 0 1px rgba(56, 189, 248, 0.45) inset,
    0 2px 14px rgba(0, 0, 0, 0.18) inset;
}

.portal-login__form :deep(.el-input__wrapper.is-focus) {
  box-shadow:
    0 0 0 1px rgba(129, 140, 248, 0.65) inset,
    0 0 0 3px rgba(56, 189, 248, 0.15),
    0 2px 14px rgba(0, 0, 0, 0.18) inset;
}

/* 已输入的账号/密码：纯白可读；占位符略透明白 */
.portal-login__form :deep(.el-input__inner) {
  color: #ffffff;
  -webkit-text-fill-color: #ffffff;
}

.portal-login__form :deep(.el-input__inner::placeholder) {
  color: rgba(248, 250, 252, 0.42);
  -webkit-text-fill-color: rgba(248, 250, 252, 0.42);
}

.portal-login__form :deep(.el-input .el-input__suffix .el-icon) {
  color: rgba(248, 250, 252, 0.75);
}

.portal-login__alert {
  margin-bottom: 16px;
}

.portal-login__submit {
  width: 100%;
  margin-top: 7px;
  height: 42px !important;
  font-weight: 700 !important;
  font-size: 13px !important;
  letter-spacing: 0.1em !important;
  border: none !important;
  border-radius: 10px !important;
  background: linear-gradient(115deg, #0ea5e9 0%, #4f46e5 45%, #a855f7 100%) !important;
  box-shadow:
    0 14px 44px rgba(79, 70, 229, 0.5),
    0 0 0 1px rgba(255, 255, 255, 0.18) inset !important;
  transition:
    transform 0.2s ease,
    filter 0.2s ease,
    box-shadow 0.2s ease !important;
}

.portal-login__submit:hover:not(:disabled) {
  filter: brightness(1.1) saturate(1.08);
  box-shadow:
    0 18px 52px rgba(79, 70, 229, 0.58),
    0 0 0 1px rgba(255, 255, 255, 0.24) inset,
    0 0 40px rgba(56, 189, 248, 0.28) !important;
  transform: translateY(-2px);
}

.portal-login__submit:active:not(:disabled) {
  transform: translateY(0);
}

.portal-login__hint {
  position: relative;
  z-index: 2;
  margin: 18px min(23px, 4vw) 0;
  padding-top: 3px;
  font-size: 10px;
  line-height: 1.7;
  color: #94a3b8;
  text-align: center;
  letter-spacing: 0.02em;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

@media (max-width: 900px) {
  .portal-login__robot {
    width: min(56vw, 300px);
    opacity: 0.18;
    right: -10vw;
  }
}

@media (max-width: 640px) {
  .portal-login__robot {
    display: none;
  }
}

@media (max-width: 480px) {
  .portal-login__panel {
    border-radius: 18px;
    width: min(100%, calc(100vw - 20px));
    max-width: none;
    padding-bottom: 22px;
  }

  .portal-login__panel-rim {
    border-radius: 18px;
  }

  .portal-login__panel-head {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
    padding: 13px 14px 11px;
  }

  .portal-login__lang {
    align-self: flex-end;
  }

  .portal-login__brand {
    padding: 18px 16px 4px;
  }

  .portal-login__form-wrap {
    margin: 6px 14px 0;
    padding: 17px 14px 15px;
    border-radius: 14px;
  }

  .portal-login__hint {
    margin: 15px 14px 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .portal-login__bg-code-beam,
  .portal-login__kicker-dot {
    animation: none !important;
  }

  .portal-login__bg-code-beam {
    opacity: 0;
  }
}
</style>
