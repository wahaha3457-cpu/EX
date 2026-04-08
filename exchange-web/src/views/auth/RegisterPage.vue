<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { RouteNames } from '@/constants/routeNames'
import { isMockMode } from '@/config/env'
import { sendVerifyCodeApi } from '@/api/auth'
import AuthMethodTabs from '@/components/auth/AuthMethodTabs.vue'
import ExPasswordRevealInput from '@/components/common/ExPasswordRevealInput.vue'
import ExSixDigitPinInput from '@/components/common/ExSixDigitPinInput.vue'
import type { AuthChannel } from '@/types/auth'
import {
  normalizeAccount,
  normalizeEmail,
  normalizePhone,
  isValidAccount,
  isValidEmail,
  isValidPassword,
  isValidPhone,
} from '@/utils/authValidation'

const { t } = useI18n()
const auth = useAuthStore()
const app = useAppStore()
const route = useRoute()
const router = useRouter()

const channel = ref<AuthChannel>('email')
const form = reactive({
  principal: '',
  password: '',
  confirmPassword: '',
  verifyCode: '',
  inviteCode: '',
  agree: false,
})

const phoneCountryCode = ref('+86')

const submitting = ref(false)
const sendingCode = ref(false)
const codeCooldown = ref(0)
let cooldownTimer: number | null = null

const principalLabel = computed(() => {
  if (channel.value === 'email') return t('auth.channel.email')
  if (channel.value === 'phone') return t('auth.channel.phoneNumber')
  return t('auth.channel.account')
})

const principalInputType = computed(() => {
  if (channel.value === 'email') return 'email'
  if (channel.value === 'phone') return 'tel'
  return 'text'
})

watch(channel, () => {
  form.principal = ''
  form.verifyCode = ''
  if (channel.value === 'phone') phoneCountryCode.value = '+86'
})

function normalizePrincipal(): string {
  if (channel.value === 'email') return normalizeEmail(form.principal)
  if (channel.value === 'phone') {
    const local = normalizePhone(form.principal)
    const cc = phoneCountryCode.value.replace(/\D/g, '')
    return cc ? `+${cc}${local}` : local
  }
  return normalizeAccount(form.principal)
}

const needVerifyCode = computed(() => channel.value === 'email' || channel.value === 'phone')

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

async function onSendCode() {
  const p = normalizePrincipal()
  if (channel.value === 'email' && !isValidEmail(p)) {
    app.pushToast('warning', t('auth.register.warnEmailFirst'))
    return
  }
  if (channel.value === 'phone' && !isValidPhoneWithCountry()) {
    app.pushToast('warning', t('auth.register.warnPhoneFirst'))
    return
  }
  if (codeCooldown.value > 0 || sendingCode.value) return
  sendingCode.value = true
  try {
    await sendVerifyCodeApi({
      channel: channel.value === 'email' ? 'email' : 'phone',
      target: p,
    })
    app.pushToast('success', t('auth.register.sendCodeOk'))
    if (isMockMode()) {
      const { mockPeekVerifyCode } = await import('@/mocks/authMockService')
      const code = mockPeekVerifyCode(p)
      if (code) {
        app.pushToast('info', t('auth.register.mockCode', { code }))
      }
    }
    startCooldown()
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : t('auth.register.sendFailed')
    app.pushToast('error', msg)
  } finally {
    sendingCode.value = false
  }
}

function validate(): string | null {
  const p = normalizePrincipal()
  if (!p) return t('auth.validation.enterPrincipal', { field: principalLabel.value })
  if (channel.value === 'email' && !isValidEmail(p)) return t('auth.validation.emailInvalid')
  if (channel.value === 'phone' && !isValidPhoneWithCountry()) return t('auth.validation.phoneInvalid')
  if (channel.value === 'account' && !isValidAccount(p)) return t('auth.validation.accountInvalid')
  if (!isValidPassword(form.password)) return t('auth.validation.passwordRule')
  if (form.password !== form.confirmPassword) return t('auth.validation.passwordMismatch')
  if (needVerifyCode.value && !/^\d{6}$/.test(form.verifyCode.trim())) return t('auth.validation.verifyRequired')
  if (!form.agree) return t('auth.validation.agreeRequired')
  return null
}

onMounted(() => {
  const r = route.query.ref ?? route.query.invite
  const s = typeof r === 'string' ? r : Array.isArray(r) ? r[0] : ''
  if (s) form.inviteCode = s
})

onUnmounted(() => {
  if (cooldownTimer) {
    clearInterval(cooldownTimer)
    cooldownTimer = null
  }
})

async function onSubmit() {
  const err = validate()
  if (err) {
    app.pushToast('warning', err)
    return
  }
  submitting.value = true
  try {
    await auth.register({
      channel: channel.value,
      principal: normalizePrincipal(),
      password: form.password,
      verifyCode: needVerifyCode.value ? form.verifyCode.trim() : undefined,
      inviteCode: form.inviteCode.trim() || undefined,
    })
    app.pushToast('success', t('auth.register.success'))
    const redirect = (route.query.redirect as string) || '/'
    await router.replace(redirect)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : t('auth.register.failed')
    app.pushToast('error', msg)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <form class="auth-form" @submit.prevent="onSubmit">
    <AuthMethodTabs v-model="channel" variant="register" />

    <div class="ex-field">
      <label class="ex-label" :for="'reg-p-' + channel">{{ principalLabel }}</label>
      <div v-if="channel === 'phone'" class="auth-form__phone-row">
        <select v-model="phoneCountryCode" class="auth-form__cc" aria-label="国家区号">
          <option value="+86">🇨🇳 +86</option>
          <option value="+1">🇺🇸 +1</option>
          <option value="+44">🇬🇧 +44</option>
          <option value="+81">🇯🇵 +81</option>
          <option value="+82">🇰🇷 +82</option>
          <option value="+65">🇸🇬 +65</option>
          <option value="+61">🇦🇺 +61</option>
        </select>
        <input
          :id="'reg-p-' + channel"
          v-model="form.principal"
          class="ex-input auth-form__phone-input"
          type="tel"
          autocomplete="tel"
          :placeholder="t('auth.login.placeholderPhone')"
        />
      </div>
      <input
        v-else
        :id="'reg-p-' + channel"
        v-model="form.principal"
        class="ex-input"
        :type="principalInputType"
        autocomplete="off"
        :placeholder="
          channel === 'email'
            ? t('auth.login.placeholderEmail')
            : t('auth.login.placeholderAccount')
        "
      />
    </div>

    <div v-if="needVerifyCode" class="ex-field ex-field--code">
      <div id="reg-code-label" class="ex-label">{{ t('auth.register.verifyCode') }}</div>
      <div class="auth-form__code-row">
        <div class="auth-form__pin-wrap" aria-labelledby="reg-code-label">
          <ExSixDigitPinInput v-model="form.verifyCode" autocomplete="one-time-code" plain />
        </div>
        <button
          type="button"
          class="ex-btn ex-btn--secondary ex-btn--sm auth-form__code-btn"
          :disabled="sendingCode || codeCooldown > 0"
          @click="onSendCode"
        >
          {{
            sendingCode
              ? t('auth.register.sending')
              : codeCooldown > 0
                ? `${codeCooldown}s`
                : t('auth.register.sendCode')
          }}
        </button>
      </div>
    </div>

    <div class="ex-field">
      <label class="ex-label" for="reg-pw">{{ t('auth.register.password') }}</label>
      <ExPasswordRevealInput
        id="reg-pw"
        v-model="form.password"
        autocomplete="new-password"
        :placeholder="t('auth.validation.passwordRule')"
        :input-class="['ex-input', 'auth-form__pw-input']"
      />
    </div>
    <div class="ex-field">
      <label class="ex-label" for="reg-pw2">{{ t('auth.register.confirmPassword') }}</label>
      <ExPasswordRevealInput
        id="reg-pw2"
        v-model="form.confirmPassword"
        autocomplete="new-password"
        :placeholder="t('auth.register.placeholderConfirm')"
        :input-class="['ex-input', 'auth-form__pw-input']"
      />
    </div>

    <div class="ex-field">
      <label class="ex-label" for="reg-invite">{{ t('auth.register.inviteOptional') }}</label>
      <input
        id="reg-invite"
        v-model="form.inviteCode"
        class="ex-input"
        type="text"
        autocomplete="off"
        :placeholder="t('auth.register.invitePlaceholder')"
      />
    </div>

    <label class="auth-form__agree">
      <input v-model="form.agree" type="checkbox" />
      <span>
        {{ t('auth.register.agreePrefix') }}
        <a href="javascript:void(0)" @click.prevent>{{ t('auth.register.terms') }}</a>
        {{ t('auth.register.and') }}
        <a href="javascript:void(0)" @click.prevent>{{ t('auth.register.privacy') }}</a>
      </span>
    </label>

    <button type="submit" class="ex-btn ex-btn--primary ex-btn--logo-grad ex-btn--block" :disabled="submitting">
      {{ submitting ? t('auth.register.submitting') : t('auth.register.submit') }}
    </button>
    <p class="auth-form__foot">
      {{ t('auth.register.hasAccount') }}
      <RouterLink :to="{ name: RouteNames.Login }">{{ t('auth.register.goLogin') }}</RouterLink>
    </p>
  </form>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.auth-form__phone-row {
  display: flex;
  gap: $space-2;
  align-items: stretch;
}

.auth-form__cc {
  flex: 0 0 116px;
  height: $control-height-md;
  padding: 0 $space-2;
  border-radius: $radius-sm;
  border: 1px solid var(--ex-border);
  background: var(--ex-bg-elevated);
  color: var(--ex-text-primary);
  font-weight: $font-weight-semibold;
}

.auth-form__phone-input {
  flex: 1;
  min-width: 0;
}

.auth-form__pw-input {
  padding-right: 44px;
}

.auth-form__foot {
  margin: $space-4 0 0;
  text-align: center;
  font-size: $font-size-sm;
  color: var(--ex-text-tertiary);
}

.auth-form__code-row {
  display: flex;
  gap: $space-2;
  align-items: flex-start;
}

.auth-form__pin-wrap {
  flex: 1;
  min-width: 0;
}

.auth-form__code-btn {
  flex-shrink: 0;
  white-space: nowrap;
  min-width: 104px;
}

.auth-form__agree {
  display: flex;
  align-items: flex-start;
  gap: $space-2;
  margin: 0 0 $space-4;
  font-size: $font-size-xs;
  line-height: 1.5;
  color: var(--ex-text-secondary);
  cursor: pointer;
}

.auth-form__agree input {
  margin-top: 2px;
  flex-shrink: 0;
}

.auth-form__agree a {
  color: var(--ex-brand);
  text-decoration: none;
}

.auth-form__agree a:hover {
  text-decoration: underline;
}
</style>
