<script setup lang="ts">
import { computed, onUnmounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/stores/app'
import { RouteNames } from '@/constants/routeNames'
import { allowDemoPasswordResetFallback, isMockMode } from '@/config/env'
import { resetPasswordApi, sendPasswordResetCodeApi } from '@/api/auth'
import { normalizeEmail, normalizePhone, isValidEmail, isValidPassword, isValidPhone } from '@/utils/authValidation'
import ExPasswordRevealInput from '@/components/common/ExPasswordRevealInput.vue'
import ExSixDigitPinInput from '@/components/common/ExSixDigitPinInput.vue'

type ResetChannel = 'email' | 'phone'

const { t } = useI18n()
const app = useAppStore()
const router = useRouter()

const channel = ref<ResetChannel>('email')
const phoneCountryCode = ref('+86')

const step = ref<1 | 2 | 3>(1)
const form = reactive({
  principal: '',
  verifyCode: '',
  newPassword: '',
  confirmPassword: '',
})

const sendingCode = ref(false)
const codeCooldown = ref(0)
let cooldownTimer: number | null = null

const submitting = ref(false)
const principalLabel = computed(() =>
  channel.value === 'email' ? t('auth.channel.email') : t('auth.channel.phoneNumber'),
)

/** 开发/演示：提示验证码来源与登录方式，避免误以为接了真实短信 */
const showDemoResetHint = computed(() => allowDemoPasswordResetFallback())

watch(channel, () => {
  form.principal = ''
  form.verifyCode = ''
  if (channel.value === 'phone') phoneCountryCode.value = '+86'
})

function normalizePrincipal(): string {
  if (channel.value === 'email') return normalizeEmail(form.principal)
  const local = normalizePhone(form.principal)
  const cc = phoneCountryCode.value.replace(/\D/g, '')
  return cc ? `+${cc}${local}` : local
}

function isValidPhoneWithCountry(): boolean {
  const local = normalizePhone(form.principal)
  const cc = phoneCountryCode.value.replace(/\D/g, '')
  if (!cc || cc === '86') return isValidPhone(local)
  const e164 = `${cc}${local}`.replace(/\D/g, '')
  return e164.length >= 8 && e164.length <= 15
}

function startCooldown() {
  if (cooldownTimer) {
    clearInterval(cooldownTimer)
    cooldownTimer = null
  }
  codeCooldown.value = 60
  cooldownTimer = window.setInterval(() => {
    codeCooldown.value -= 1
    if (codeCooldown.value <= 0 && cooldownTimer) {
      clearInterval(cooldownTimer)
      cooldownTimer = null
    }
  }, 1000)
}

onUnmounted(() => {
  if (cooldownTimer) {
    clearInterval(cooldownTimer)
    cooldownTimer = null
  }
})

async function onSendCode() {
  const p = normalizePrincipal()
  if (channel.value === 'email' && !isValidEmail(p)) {
    app.pushToast('warning', t('auth.forgot.warnEmailFirst'))
    return
  }
  if (channel.value === 'phone' && !isValidPhoneWithCountry()) {
    app.pushToast('warning', t('auth.forgot.warnPhoneFirst'))
    return
  }
  if (codeCooldown.value > 0 || sendingCode.value) return
  sendingCode.value = true
  let usedLocalDemo = false
  try {
    try {
      await sendPasswordResetCodeApi({ channel: channel.value, target: p })
    } catch (apiErr: unknown) {
      if (!allowDemoPasswordResetFallback()) throw apiErr
      const m = await import('@/mocks/authMockService')
      await m.mockSendPasswordResetCode(p)
      usedLocalDemo = true
      app.pushToast('info', t('auth.forgot.demoModeHint'))
    }
    app.pushToast('success', t('auth.forgot.sendCodeOk'))
    if (isMockMode() || usedLocalDemo) {
      const { mockPeekResetCode } = await import('@/mocks/authMockService')
      const code = mockPeekResetCode(p)
      if (code) app.pushToast('info', t('auth.forgot.mockCode', { code }))
    }
    startCooldown()
    step.value = 2
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : t('auth.forgot.sendFailed')
    app.pushToast('error', msg)
  } finally {
    sendingCode.value = false
  }
}

function validateStep2(): string | null {
  const p = normalizePrincipal()
  if (!p) return t('auth.validation.enterPrincipal', { field: principalLabel.value })
  if (channel.value === 'email' && !isValidEmail(p)) return t('auth.validation.emailInvalid')
  if (channel.value === 'phone' && !isValidPhoneWithCountry()) return t('auth.validation.phoneInvalid')
  if (!/^\d{6}$/.test(form.verifyCode.trim())) return t('auth.validation.verifyRequired')
  if (!isValidPassword(form.newPassword)) return t('auth.validation.passwordRule')
  if (form.newPassword !== form.confirmPassword) return t('auth.validation.passwordMismatch')
  return null
}

async function onReset() {
  const err = validateStep2()
  if (err) {
    app.pushToast('warning', err)
    return
  }
  submitting.value = true
  const body = {
    channel: channel.value,
    target: normalizePrincipal(),
    verifyCode: form.verifyCode.trim(),
    newPassword: form.newPassword,
  }
  try {
    try {
      await resetPasswordApi(body)
    } catch (apiErr: unknown) {
      if (!allowDemoPasswordResetFallback()) throw apiErr
      const m = await import('@/mocks/authMockService')
      try {
        await m.mockResetPassword(body)
      } catch (inner) {
        const raw = inner instanceof Error ? inner.message : ''
        if (raw.includes('账号不存在') || raw.toLowerCase().includes('not exist')) {
          app.pushToast('error', t('auth.forgot.demoUnknownAccount'))
        } else {
          app.pushToast('error', raw || t('auth.forgot.resetFailed'))
        }
        return
      }
      app.pushToast('info', t('auth.forgot.demoResetOkHint'))
    }
    step.value = 3
    app.openWelcomeModal(
      {
        illustration: 'spark',
        title: t('auth.forgot.resetOkTitle'),
        subtitle: t('auth.forgot.resetOkSub'),
      },
      2200,
    )
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : t('auth.forgot.resetFailed')
    app.pushToast('error', msg)
  } finally {
    submitting.value = false
  }
}

async function goLogin() {
  const p = normalizePrincipal()
  await router.replace({ name: RouteNames.Login, query: { principal: p } })
}
</script>

<template>
  <div class="auth-forgot">
    <div class="auth-forgot__steps" aria-label="找回密码步骤">
      <div class="auth-forgot__step" :data-active="step === 1">
        <span class="auth-forgot__dot">1</span>
        <span class="auth-forgot__lbl">{{ t('auth.forgot.stepIdentify') }}</span>
      </div>
      <div class="auth-forgot__line" />
      <div class="auth-forgot__step" :data-active="step === 2">
        <span class="auth-forgot__dot">2</span>
        <span class="auth-forgot__lbl">{{ t('auth.forgot.stepReset') }}</span>
      </div>
      <div class="auth-forgot__line" />
      <div class="auth-forgot__step" :data-active="step === 3">
        <span class="auth-forgot__dot">3</span>
        <span class="auth-forgot__lbl">{{ t('auth.forgot.stepDone') }}</span>
      </div>
    </div>

    <div class="auth-forgot__tabs" role="tablist" :aria-label="t('auth.forgot.methodAria')">
      <button
        type="button"
        class="auth-forgot__tab"
        :class="{ 'auth-forgot__tab--on': channel === 'email' }"
        role="tab"
        :aria-selected="channel === 'email'"
        @click="channel = 'email'"
      >
        {{ t('auth.channel.email') }}
      </button>
      <button
        type="button"
        class="auth-forgot__tab"
        :class="{ 'auth-forgot__tab--on': channel === 'phone' }"
        role="tab"
        :aria-selected="channel === 'phone'"
        @click="channel = 'phone'"
      >
        {{ t('auth.channel.phone') }}
      </button>
    </div>

    <div class="ex-field">
      <label class="ex-label" :for="'fp-p-' + channel">{{ principalLabel }}</label>
      <div v-if="channel === 'phone'" class="auth-forgot__phone-row">
        <select v-model="phoneCountryCode" class="auth-forgot__cc" aria-label="国家区号">
          <option value="+86">🇨🇳 +86</option>
          <option value="+1">🇺🇸 +1</option>
          <option value="+44">🇬🇧 +44</option>
          <option value="+81">🇯🇵 +81</option>
          <option value="+82">🇰🇷 +82</option>
          <option value="+65">🇸🇬 +65</option>
          <option value="+61">🇦🇺 +61</option>
        </select>
        <input
          :id="'fp-p-' + channel"
          v-model="form.principal"
          class="ex-input auth-forgot__phone-input"
          type="tel"
          autocomplete="tel"
          :placeholder="t('auth.login.placeholderPhone')"
        />
      </div>
      <input
        v-else
        :id="'fp-p-' + channel"
        v-model="form.principal"
        class="ex-input"
        type="email"
        autocomplete="username"
        :placeholder="t('auth.login.placeholderEmail')"
      />
    </div>

    <div v-if="step === 1" class="auth-forgot__cta">
      <button type="button" class="ex-btn ex-btn--primary ex-btn--block" :disabled="sendingCode" @click="onSendCode">
        {{
          sendingCode
            ? t('auth.forgot.sending')
            : codeCooldown > 0
              ? t('auth.forgot.resendIn', { s: codeCooldown })
              : t('auth.forgot.sendCode')
        }}
      </button>
      <button type="button" class="ex-btn ex-btn--secondary ex-btn--block" @click="goLogin">
        {{ t('auth.forgot.backToLogin') }}
      </button>
    </div>

    <div v-else-if="step === 2">
      <div class="ex-field">
        <div id="fp-code-label" class="ex-label">{{ t('auth.register.verifyCode') }}</div>
        <div class="auth-forgot__code-row">
          <div class="auth-forgot__pin-wrap" aria-labelledby="fp-code-label">
            <ExSixDigitPinInput v-model="form.verifyCode" autocomplete="one-time-code" plain />
          </div>
          <button
            type="button"
            class="ex-btn ex-btn--secondary auth-forgot__resend"
            :disabled="sendingCode || codeCooldown > 0"
            @click="onSendCode"
          >
            {{ codeCooldown > 0 ? t('auth.forgot.resendIn', { s: codeCooldown }) : t('auth.forgot.resend') }}
          </button>
        </div>
        <p v-if="showDemoResetHint" class="auth-forgot__demo-hint">{{ t('auth.forgot.demoFlowHint') }}</p>
      </div>

      <div class="ex-field">
        <label class="ex-label" for="fp-new">{{ t('auth.forgot.newPassword') }}</label>
        <ExPasswordRevealInput
          id="fp-new"
          v-model="form.newPassword"
          autocomplete="new-password"
          :placeholder="t('auth.login.placeholderPassword')"
          :input-class="['ex-input', 'auth-forgot__pw-input']"
        />
      </div>

      <div class="ex-field">
        <label class="ex-label" for="fp-cp">{{ t('auth.register.confirmPassword') }}</label>
        <ExPasswordRevealInput
          id="fp-cp"
          v-model="form.confirmPassword"
          autocomplete="new-password"
          :placeholder="t('auth.register.placeholderConfirm')"
          :input-class="['ex-input', 'auth-forgot__pw-input']"
        />
      </div>

      <button type="button" class="ex-btn ex-btn--primary ex-btn--block" :disabled="submitting" @click="onReset">
        {{ submitting ? t('auth.forgot.submitting') : t('auth.forgot.resetSubmit') }}
      </button>

      <button type="button" class="ex-btn ex-btn--secondary ex-btn--block" @click="step = 1">
        {{ t('auth.forgot.back') }}
      </button>
    </div>

    <div v-else class="auth-forgot__done">
      <p class="auth-forgot__done-title">{{ t('auth.forgot.doneTitle') }}</p>
      <p class="auth-forgot__done-sub">{{ t('auth.forgot.doneSub') }}</p>
      <button type="button" class="ex-btn ex-btn--primary ex-btn--block" @click="goLogin">
        {{ t('auth.forgot.goLogin') }}
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.auth-forgot__steps {
  display: grid;
  grid-template-columns: 1fr auto 1fr auto 1fr;
  align-items: center;
  gap: $space-2;
  margin-bottom: $space-5;
}

.auth-forgot__line {
  height: 1px;
  background: var(--ex-border);
}

.auth-forgot__step {
  display: flex;
  align-items: center;
  gap: $space-2;
  color: var(--ex-text-tertiary);
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  letter-spacing: 0.02em;
}

.auth-forgot__step[data-active='true'] {
  color: var(--ex-text-primary);
}

.auth-forgot__dot {
  width: 22px;
  height: 22px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  border: 1px solid var(--ex-border);
  background: var(--ex-fill-ghost);
  font-size: 12px;
  font-weight: 800;
}

.auth-forgot__step[data-active='true'] .auth-forgot__dot {
  border-color: color-mix(in srgb, var(--ex-brand) 35%, var(--ex-border));
  background: var(--ex-brand-muted);
  color: var(--ex-brand);
}

.auth-forgot__tabs {
  display: flex;
  gap: $space-1;
  padding: 3px;
  margin-bottom: $space-5;
  border-radius: $radius-md;
  background: var(--ex-fill-ghost);
  border: 1px solid var(--ex-border);
}

.auth-forgot__tab {
  flex: 1;
  padding: $space-2 $space-2;
  font-size: $font-size-sm;
  font-weight: $font-weight-medium;
  color: var(--ex-text-secondary);
  background: transparent;
  border: none;
  border-radius: $radius-sm;
  cursor: pointer;
  font-family: inherit;
}

.auth-forgot__tab--on {
  color: var(--ex-text-primary);
  background: var(--ex-bg-elevated);
  box-shadow: var(--ex-shadow-card);
}

.auth-forgot__phone-row {
  display: flex;
  gap: $space-2;
  align-items: stretch;
}

.auth-forgot__cc {
  flex: 0 0 116px;
  height: $control-height-md;
  padding: 0 $space-2;
  border-radius: $radius-sm;
  border: 1px solid var(--ex-border);
  background: var(--ex-bg-elevated);
  color: var(--ex-text-primary);
  font-weight: $font-weight-semibold;
}

.auth-forgot__phone-input {
  flex: 1;
  min-width: 0;
}

.auth-forgot__cta {
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.auth-forgot__code-row {
  display: flex;
  gap: $space-2;
  align-items: flex-start;
}

.auth-forgot__pin-wrap {
  flex: 1;
  min-width: 0;
}

.auth-forgot__resend {
  flex: 0 0 auto;
  min-width: 110px;
}

.auth-forgot__demo-hint {
  margin: $space-2 0 0;
  font-size: $font-size-xs;
  line-height: 1.55;
  color: var(--ex-text-tertiary);
}

.auth-forgot__pw-input {
  padding-right: 44px;
}

.auth-forgot__done {
  margin-top: $space-2;
  text-align: center;
}

.auth-forgot__done-title {
  margin: 0;
  font-size: $font-size-lg;
  font-weight: 800;
  color: var(--ex-text-primary);
}

.auth-forgot__done-sub {
  margin: $space-2 0 $space-4;
  font-size: $font-size-sm;
  color: var(--ex-text-tertiary);
  line-height: 1.6;
}
</style>

