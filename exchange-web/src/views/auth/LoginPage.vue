<script setup lang="ts">
import { computed, reactive, ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { RouteNames } from '@/constants/routeNames'
import { isMockMode } from '@/config/env'
import AuthMethodTabs from '@/components/auth/AuthMethodTabs.vue'
import ExPasswordRevealInput from '@/components/common/ExPasswordRevealInput.vue'
import type { AuthChannel } from '@/types/auth'
import {
  normalizeAccount,
  normalizeEmail,
  normalizePhone,
  isValidAccount,
  isValidEmail,
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
})

const phoneCountryCode = ref('+86')
const submitting = ref(false)

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

const principalAutocomplete = computed(() => {
  if (channel.value === 'email') return 'username'
  if (channel.value === 'phone') return 'tel'
  return 'username'
})

watch(channel, () => {
  form.principal = ''
  if (channel.value === 'phone') phoneCountryCode.value = '+86'
})

onMounted(() => {
  const qp = route.query.principal
  const p = typeof qp === 'string' ? qp.trim() : Array.isArray(qp) ? (qp[0] || '').trim() : ''
  if (!p) return
  form.principal = p
  if (p.includes('@')) {
    channel.value = 'email'
  } else if (p.startsWith('+')) {
    channel.value = 'phone'
  }
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

function isValidPhoneWithCountry(): boolean {
  const local = normalizePhone(form.principal)
  const cc = phoneCountryCode.value.replace(/\D/g, '')
  if (!cc || cc === '86') return isValidPhone(local)
  const e164 = `${cc}${local}`.replace(/\D/g, '')
  return e164.length >= 8 && e164.length <= 15
}

function validate(): string | null {
  const p = normalizePrincipal()
  if (!p) return t('auth.validation.enterPrincipal', { field: principalLabel.value })
  if (channel.value === 'email' && !isValidEmail(p)) return t('auth.validation.emailInvalid')
  if (channel.value === 'phone' && !isValidPhoneWithCountry()) return t('auth.validation.phoneInvalid')
  if (channel.value === 'account' && !isValidAccount(p)) return t('auth.validation.accountInvalid')
  if (!form.password) return t('auth.validation.passwordRequired')
  return null
}

async function onSubmit() {
  const err = validate()
  if (err) {
    app.pushToast('warning', err)
    return
  }
  submitting.value = true
  try {
    const res = await auth.login({
      channel: channel.value,
      principal: normalizePrincipal(),
      password: form.password,
    })
    const nick = res?.user?.nickname || res?.user?.emailMasked || res?.user?.userCode
    app.openWelcomeModal(
      {
        illustration: 'rocket',
        title: nick ? `欢迎回来，${nick}` : t('auth.login.success'),
        subtitle: '已成功登录，祝你交易顺利。',
      },
      2600,
    )
    const redirect = (route.query.redirect as string) || '/'
    await router.replace(redirect)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : t('auth.login.failed')
    app.pushToast('error', msg)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <form class="auth-form" @submit.prevent="onSubmit">
    <AuthMethodTabs v-model="channel" />

    <div class="ex-field">
      <label class="ex-label" :for="'login-p-' + channel">{{ principalLabel }}</label>
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
          :id="'login-p-' + channel"
          v-model="form.principal"
          class="ex-input auth-form__phone-input"
          type="tel"
          autocomplete="tel"
          :placeholder="t('auth.login.placeholderPhone')"
        />
      </div>
      <input
        v-else
        :id="'login-p-' + channel"
        v-model="form.principal"
        class="ex-input"
        :type="principalInputType"
        :autocomplete="principalAutocomplete"
        :placeholder="
          channel === 'email'
            ? t('auth.login.placeholderEmail')
            : t('auth.login.placeholderAccount')
        "
      />
    </div>
    <div class="ex-field">
      <label class="ex-label" for="login-pw">{{ t('auth.login.password') }}</label>
      <ExPasswordRevealInput
        id="login-pw"
        v-model="form.password"
        autocomplete="current-password"
        :placeholder="t('auth.login.placeholderPassword')"
        :input-class="['ex-input', 'auth-form__pw-input']"
      />
      <div class="auth-form__forgot-row">
        <RouterLink class="auth-form__forgot" :to="{ name: RouteNames.ForgotPassword }">
          {{ t('auth.login.forgot') }}
        </RouterLink>
      </div>
    </div>

    <p v-if="isMockMode()" class="auth-form__mock-tip">
      {{ t('auth.login.mockRegular') }} <code>demo@exchange.com</code> / <code>Demo12345</code>
      <br />
      {{ t('auth.login.mockAdmin') }} <code>admin@exchange.com</code> / <code>Admin12345</code>
    </p>

    <button type="submit" class="ex-btn ex-btn--primary ex-btn--logo-grad ex-btn--block" :disabled="submitting">
      {{ submitting ? t('auth.login.submitting') : t('auth.login.submit') }}
    </button>
    <p class="auth-form__foot">
      {{ t('auth.login.noAccount') }}
      <RouterLink :to="{ name: RouteNames.Register }">{{ t('auth.login.goRegister') }}</RouterLink>
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

.auth-form__forgot-row {
  display: flex;
  justify-content: flex-end;
  margin-top: $space-2;
}

.auth-form__forgot {
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  color: var(--ex-text-tertiary);
  text-decoration: none;
}

.auth-form__forgot:hover {
  color: var(--ex-brand);
  text-decoration: underline;
}

.auth-form__foot {
  margin: $space-4 0 0;
  text-align: center;
  font-size: $font-size-sm;
  color: var(--ex-text-tertiary);
}

.auth-form__mock-tip {
  margin: 0 0 $space-3;
  padding: $space-2 $space-3;
  font-size: $font-size-xs;
  line-height: 1.5;
  color: var(--ex-text-secondary);
  background: var(--ex-fill-ghost);
  border: 1px dashed var(--ex-border);
  border-radius: $radius-sm;
}

.auth-form__mock-tip code {
  font-family: var(--ex-font-mono);
  font-size: 1em;
  color: var(--ex-brand);
}
</style>
