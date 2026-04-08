<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { RouterLink } from 'vue-router'
import { RouteNames } from '@/constants/routeNames'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { useKycStore } from '@/stores/kyc'
import type { KycDocKind, KycPersonalAdvanced, KycPersonalBasic } from '@/types/kyc'
import ExPageState from '@/components/common/ExPageState.vue'
import {
  isAgeAtLeast,
  isReasonablePassportNumber,
  isValidCnIdCard,
} from '@/utils/kyc/validate'

const { t } = useI18n()
const kyc = useKycStore()
const auth = useAuthStore()
const app = useAppStore()
const { state, loading, loadError } = storeToRefs(kyc)

const COUNTRY_CODES = ['CN', 'HK', 'MO', 'TW', 'US', 'SG', 'JP', 'GB', 'OTHER'] as const

const basicForm = ref({
  countryCode: 'CN',
  fullName: '',
  idType: 'ID_CARD' as KycPersonalBasic['idType'],
  idNumber: '',
  dateOfBirth: '',
})

const advancedForm = ref({
  residentialAddress: '',
  city: '',
  postalCode: '',
})

const basicErr = ref('')
const advErr = ref('')
const basicConsent = ref(false)
const advConsent = ref(false)

/** 本地上传预览 objectURL，key: basic-ID_FRONT 等 */
const previewUrls = ref<Record<string, string>>({})

function previewKey(tier: 'basic' | 'advanced', kind: KycDocKind) {
  return `${tier}-${kind}`
}

function revokeAllPreviews() {
  for (const u of Object.values(previewUrls.value)) {
    if (u) URL.revokeObjectURL(u)
  }
  previewUrls.value = {}
}

const limitRows = computed(() => [
  {
    label: t('kyc.limitWithdraw24h'),
    tier0: t('kyc.limitV0w'),
    tier1: t('kyc.limitV1w'),
    tier2: t('kyc.limitV2w'),
  },
  {
    label: t('kyc.limitC2c'),
    tier0: t('kyc.limitV0c'),
    tier1: t('kyc.limitV1c'),
    tier2: t('kyc.limitV2c'),
  },
  {
    label: t('kyc.limitFiat'),
    tier0: t('kyc.limitV0f'),
    tier1: t('kyc.limitV1f'),
    tier2: t('kyc.limitV2f'),
  },
  {
    label: t('kyc.limitContract'),
    tier0: t('kyc.limitV0x'),
    tier1: t('kyc.limitV1x'),
    tier2: t('kyc.limitV2x'),
  },
])

function countryName(code: string) {
  const k = `kyc.country.${code}` as const
  return t(k)
}

function hydrateForms() {
  const s = state.value
  if (!s) return
  if (s.basic.personal) {
    const p = s.basic.personal
    basicForm.value = {
      countryCode: p.countryCode,
      fullName: p.fullName,
      idType: p.idType,
      idNumber: p.idNumber,
      dateOfBirth: p.dateOfBirth,
    }
  }
  if (s.advanced.personal) {
    const p = s.advanced.personal
    advancedForm.value = {
      residentialAddress: p.residentialAddress,
      city: p.city,
      postalCode: p.postalCode,
    }
  }
}

onMounted(() => {
  void kyc.bootstrap().then(() => hydrateForms())
})

onUnmounted(() => {
  revokeAllPreviews()
})

watch(state, () => hydrateForms(), { deep: true })

watch(
  () => auth.isAuthenticated,
  (v) => {
    if (v) void kyc.bootstrap(true).then(() => hydrateForms())
    else {
      basicConsent.value = false
      advConsent.value = false
      revokeAllPreviews()
    }
  },
)

watch(
  () => basicForm.value.idType,
  async (next, prev) => {
    if (prev === undefined) return
    if (next === prev) return
    if (basicBlocked.value) return
    await kyc.syncBasicDocLayout(next)
    revokeAllPreviews()
  },
)

const currentTier = computed(() => state.value?.tier ?? 0)

const basicBlocked = computed(() => {
  const st = state.value?.basic.status
  return st === 'IN_REVIEW' || st === 'PASSED'
})

const advancedBlocked = computed(() => {
  const st = state.value?.advanced.status
  return st === 'IN_REVIEW' || st === 'PASSED'
})

const showAdvanced = computed(() => currentTier.value >= 1)

const progressPercent = computed(() => {
  const tier = currentTier.value
  if (tier >= 2) return 100
  if (tier >= 1) return 68
  const st = state.value?.basic.status
  if (st === 'IN_REVIEW') return 48
  if (st === 'PASSED') return 68
  const docs = state.value?.basic.docs ?? []
  const n = docs.filter((x) => x.uploaded).length
  const total = Math.max(1, docs.length)
  return Math.min(42, 12 + Math.round((n / total) * 30))
})

watch(basicBlocked, (b) => {
  if (b) basicConsent.value = false
})

watch(advancedBlocked, (b) => {
  if (b) advConsent.value = false
})

function docTitle(label: string) {
  return t(`kyc.doc.${label}.title`)
}

function docHint(label: string) {
  return t(`kyc.doc.${label}.hint`)
}

function translateReject(reason: string | null | undefined) {
  if (!reason) return ''
  if (reason.startsWith('kyc.')) return t(reason)
  return reason
}

function validateBasic(): boolean {
  basicErr.value = ''
  const f = basicForm.value
  if (!f.fullName.trim() || f.fullName.trim().length < 2) {
    basicErr.value = t('kyc.error.name')
    return false
  }
  const id = f.idNumber.trim()
  if (!id) {
    basicErr.value = t('kyc.error.idNumber')
    return false
  }
  if (f.countryCode === 'CN' && f.idType === 'ID_CARD') {
    if (!isValidCnIdCard(id)) {
      basicErr.value = t('kyc.error.idCnInvalid')
      return false
    }
  } else if (f.idType === 'PASSPORT') {
    if (!isReasonablePassportNumber(id)) {
      basicErr.value = t('kyc.error.idPassportInvalid')
      return false
    }
  } else if (id.length < 4) {
    basicErr.value = t('kyc.error.idNumber')
    return false
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(f.dateOfBirth)) {
    basicErr.value = t('kyc.error.dob')
    return false
  }
  if (!isAgeAtLeast(f.dateOfBirth, 18)) {
    basicErr.value = t('kyc.error.adult')
    return false
  }
  const docs = state.value?.basic.docs ?? []
  if (!docs.every((d) => d.uploaded)) {
    basicErr.value = t('kyc.error.uploadAllIdDocs')
    return false
  }
  if (!basicConsent.value) {
    basicErr.value = t('kyc.error.consentBasic')
    return false
  }
  return true
}

function validateAdvanced(): boolean {
  advErr.value = ''
  const f = advancedForm.value
  if (!f.residentialAddress.trim() || f.residentialAddress.length < 4) {
    advErr.value = t('kyc.error.address')
    return false
  }
  if (!f.city.trim()) {
    advErr.value = t('kyc.error.city')
    return false
  }
  const docs = state.value?.advanced.docs ?? []
  if (!docs.every((d) => d.uploaded)) {
    advErr.value = t('kyc.error.uploadAllAdvanced')
    return false
  }
  if (!advConsent.value) {
    advErr.value = t('kyc.error.consentAdv')
    return false
  }
  return true
}

async function onSubmitBasic() {
  if (!validateBasic()) return
  const f = basicForm.value
  const p: KycPersonalBasic = {
    countryCode: f.countryCode,
    countryName: countryName(f.countryCode),
    fullName: f.fullName.trim(),
    idType: f.idType,
    idNumber: f.idNumber.trim(),
    dateOfBirth: f.dateOfBirth,
  }
  await kyc.saveBasicDraftFields(p)
  await kyc.submitBasic(p)
}

async function onSubmitAdvanced() {
  if (!validateAdvanced()) return
  const f = advancedForm.value
  const p: KycPersonalAdvanced = {
    residentialAddress: f.residentialAddress.trim(),
    city: f.city.trim(),
    postalCode: f.postalCode.trim() || '—',
  }
  await kyc.saveAdvancedDraftFields(p)
  await kyc.submitAdvanced(p)
}

const ALLOWED_IMG = ['image/jpeg', 'image/png', 'image/webp']

function onFile(tier: 'basic' | 'advanced', kind: KycDocKind, e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) {
    input.value = ''
    return
  }
  if (!ALLOWED_IMG.includes(file.type)) {
    app.pushToast('error', t('kyc.error.fileType'))
    input.value = ''
    return
  }
  const pk = previewKey(tier, kind)
  const prev = previewUrls.value[pk]
  if (prev) URL.revokeObjectURL(prev)
  previewUrls.value[pk] = URL.createObjectURL(file)
  void kyc.uploadDoc(tier, kind, file)
  input.value = ''
}

function fmtTime(iso: string | null | undefined) {
  if (!iso) return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString()
}

const FAQ_KEYS = ['why', 'time', 'reject', 'privacy'] as const

const PHOTO_DO_IDX = [0, 1, 2, 3] as const
const PHOTO_DONT_IDX = [0, 1, 2] as const
</script>

<template>
  <div class="kyc">
    <header class="kyc__hero">
      <div class="kyc__hero-text">
        <h2 class="kyc__title">{{ t('kyc.heroTitle') }}</h2>
        <p class="kyc__lead">{{ t('kyc.heroLead') }}</p>
        <p class="kyc__route-hint">
          {{ t('kyc.routeHint') }}
          <RouterLink :to="{ name: RouteNames.Verification }" class="kyc__route-link kyc__mono"
            >/account/verification</RouterLink
          >
        </p>
      </div>
      <aside class="kyc__hero-aside" :aria-label="t('kyc.progressLabel')">
        <div class="kyc__prog-head">
          <span class="kyc__prog-lab">{{ t('kyc.progressLabel') }}</span>
          <span class="kyc__prog-val ex-num">{{ progressPercent }}%</span>
        </div>
        <div
          class="kyc__prog-track"
          role="progressbar"
          :aria-valuenow="progressPercent"
          aria-valuemin="0"
          aria-valuemax="100"
        >
          <div class="kyc__prog-fill" :style="{ width: `${progressPercent}%` }" />
        </div>
        <ul class="kyc__prog-legend">
          <li :data-on="currentTier === 0" :data-done="currentTier >= 1">{{ t('kyc.progLv0') }}</li>
          <li :data-on="currentTier === 1" :data-done="currentTier >= 2">{{ t('kyc.progLv1') }}</li>
          <li :data-on="currentTier === 2" :data-done="currentTier >= 2">{{ t('kyc.progLv2') }}</li>
        </ul>
      </aside>
    </header>

    <ExPageState
      :unauthorized="!auth.isAuthenticated"
      :loading="loading && !state"
      use-skeleton
      skeleton-variant="panel"
      :error="loadError"
      :loading-text="t('kyc.loading')"
      @retry="kyc.bootstrap(true)"
    >
      <template v-if="state">
        <div class="kyc__badge-row">
          <span class="kyc__tier" :data-t="currentTier">{{ t('kyc.badgeCurrent', { n: currentTier }) }}</span>
          <span v-if="currentTier >= 2" class="kyc__done">{{ t('kyc.badgeDone') }}</span>
          <span v-else-if="currentTier === 1" class="kyc__hint">{{ t('kyc.badgeHint1') }}</span>
          <span v-else class="kyc__hint">{{ t('kyc.badgeHint0') }}</span>
        </div>

        <section class="kyc__tips" aria-label="tips">
          <div class="kyc__tips-col kyc__tips-col--ok">
            <h4 class="kyc__tips-h">{{ t('kyc.tipsOkTitle') }}</h4>
            <ul>
              <li v-for="i in PHOTO_DO_IDX" :key="'d' + i">{{ t(`kyc.photoDo.${i}`) }}</li>
            </ul>
          </div>
          <div class="kyc__tips-col kyc__tips-col--no">
            <h4 class="kyc__tips-h">{{ t('kyc.tipsNoTitle') }}</h4>
            <ul>
              <li v-for="i in PHOTO_DONT_IDX" :key="'n' + i">{{ t(`kyc.photoDont.${i}`) }}</li>
            </ul>
          </div>
        </section>

        <section class="kyc__card" :aria-label="t('kyc.limitsTitle')">
          <h3 class="kyc__h">{{ t('kyc.limitsTitle') }}</h3>
          <p class="kyc__sub">{{ t('kyc.limitsSub') }}</p>
          <div class="kyc__table-wrap">
            <table class="kyc__table">
              <thead>
                <tr>
                  <th>{{ t('kyc.limitColPermission') }}</th>
                  <th>{{ t('kyc.limitCol0') }}</th>
                  <th>{{ t('kyc.limitCol1') }}</th>
                  <th>{{ t('kyc.limitCol2') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in limitRows" :key="row.label">
                  <td>{{ row.label }}</td>
                  <td>{{ row.tier0 }}</td>
                  <td :class="{ 'kyc__td--on': currentTier >= 1 }">{{ row.tier1 }}</td>
                  <td :class="{ 'kyc__td--on': currentTier >= 2 }">{{ row.tier2 }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="kyc__note">
            {{ t('kyc.limitsNoteRef') }}
            <a
              class="kyc__a"
              href="https://www.binance.com/zh-CN/support/faq/kyc"
              target="_blank"
              rel="noopener noreferrer"
              >{{ t('kyc.binanceRef') }}</a
            >
          </p>
        </section>

        <div class="kyc__steps-wrap">
          <ol class="kyc__steps" :aria-label="t('kyc.stepsTitle')">
            <li
              class="kyc__step"
              :data-on="state.basic.status !== 'LOCKED'"
              :data-done="state.basic.status === 'PASSED' ? '1' : '0'"
            >
              <span class="kyc__sn">1</span>
              <div class="kyc__step-body">
                <span class="kyc__slab">{{ t('kyc.step1Title') }}</span>
                <span class="kyc__sst">{{ t(`kyc.status.${state.basic.status}`) }}</span>
                <span v-if="state.basic.submittedAt && state.basic.status === 'IN_REVIEW'" class="kyc__smeta">{{
                  t('kyc.submittedAt', { time: fmtTime(state.basic.submittedAt) })
                }}</span>
              </div>
            </li>
            <li class="kyc__steps-line" aria-hidden="true" />
            <li class="kyc__step" :data-on="showAdvanced" :data-done="currentTier >= 2 ? '1' : '0'">
              <span class="kyc__sn">2</span>
              <div class="kyc__step-body">
                <span class="kyc__slab">{{ t('kyc.step2Title') }}</span>
                <span class="kyc__sst">{{ t(`kyc.status.${state.advanced.status}`) }}</span>
                <span v-if="state.advanced.submittedAt && state.advanced.status === 'IN_REVIEW'" class="kyc__smeta">{{
                  t('kyc.submittedAt', { time: fmtTime(state.advanced.submittedAt) })
                }}</span>
              </div>
            </li>
          </ol>
        </div>

        <section class="kyc__card" aria-labelledby="kyc-basic-h">
          <h3 id="kyc-basic-h" class="kyc__h">{{ t('kyc.basicTitle') }}</h3>
          <p class="kyc__sub">{{ t('kyc.basicSub') }}</p>

          <div v-if="state.basic.status === 'IN_REVIEW'" class="kyc__banner kyc__banner--pend">
            {{ t('kyc.bannerBasicReview', { time: fmtTime(state.basic.submittedAt) }) }}
          </div>
          <div v-if="state.basic.status === 'PASSED'" class="kyc__banner kyc__banner--ok">
            {{ t('kyc.bannerBasicOk', { time: fmtTime(state.basic.reviewedAt) }) }}
          </div>
          <div v-if="state.basic.status === 'REJECTED' && state.basic.rejectReason" class="kyc__banner kyc__banner--bad">
            {{ translateReject(state.basic.rejectReason) }}
          </div>

          <div
            v-if="state.basic.status === 'IN_REVIEW'"
            class="kyc__demo-bar"
            role="group"
            :aria-label="t('kyc.demoReviewTitle')"
          >
            <span class="kyc__demo-bar-title">{{ t('kyc.demoReviewTitle') }}</span>
            <div class="kyc__demo-bar-actions">
              <button type="button" class="kyc__demo-btn kyc__demo-btn--ok" @click="kyc.demoApproveBasic()">
                {{ t('kyc.demoApprove') }}
              </button>
              <button
                type="button"
                class="kyc__demo-btn"
                @click="kyc.demoRejectBasic('kyc.rejectReason.blur')"
              >
                {{ t('kyc.demoRejectBlur') }}
              </button>
              <button
                type="button"
                class="kyc__demo-btn"
                @click="kyc.demoRejectBasic('kyc.rejectReason.mismatch')"
              >
                {{ t('kyc.demoRejectMismatch') }}
              </button>
            </div>
          </div>

          <div class="kyc__grid">
            <label class="kyc__field">
              <span class="kyc__lab">{{ t('kyc.fieldCountry') }}</span>
              <select v-model="basicForm.countryCode" class="kyc__input" :disabled="basicBlocked">
                <option v-for="c in COUNTRY_CODES" :key="c" :value="c">{{ t(`kyc.country.${c}`) }}</option>
              </select>
            </label>
            <label class="kyc__field">
              <span class="kyc__lab">{{ t('kyc.fieldIdType') }}</span>
              <select v-model="basicForm.idType" class="kyc__input" :disabled="basicBlocked">
                <option value="ID_CARD">{{ t('kyc.idTypeIdCard') }}</option>
                <option value="PASSPORT">{{ t('kyc.idTypePassport') }}</option>
              </select>
            </label>
            <label class="kyc__field kyc__field--full">
              <span class="kyc__lab">{{ t('kyc.fieldFullName') }}</span>
              <input v-model="basicForm.fullName" type="text" class="kyc__input" :disabled="basicBlocked" />
            </label>
            <label class="kyc__field kyc__field--full">
              <span class="kyc__lab">{{ t('kyc.fieldIdNumber') }}</span>
              <input v-model="basicForm.idNumber" type="text" class="kyc__input" :disabled="basicBlocked" />
            </label>
            <label class="kyc__field">
              <span class="kyc__lab">{{ t('kyc.fieldDob') }}</span>
              <input v-model="basicForm.dateOfBirth" type="date" class="kyc__input" :disabled="basicBlocked" />
            </label>
          </div>

          <h4 class="kyc__h4">{{ t('kyc.sectionIdPhotos') }}</h4>
          <ul class="kyc__docs">
            <li v-for="d in state.basic.docs" :key="d.kind" class="kyc__doc">
              <div class="kyc__doc-text">
                <span class="kyc__dn">{{ docTitle(d.label) }}</span>
                <p class="kyc__dh">{{ docHint(d.label) }}</p>
                <p v-if="d.uploaded" class="kyc__df">{{ d.fileName }}</p>
                <div v-if="previewUrls[previewKey('basic', d.kind)]" class="kyc__preview">
                  <img
                    :src="previewUrls[previewKey('basic', d.kind)]"
                    :alt="t('kyc.previewAlt')"
                    class="kyc__preview-img"
                  />
                </div>
              </div>
              <label class="kyc__file" :class="{ 'kyc__file--disabled': basicBlocked }">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  class="kyc__file-input"
                  :disabled="basicBlocked"
                  @change="onFile('basic', d.kind, $event)"
                />
                <span class="kyc__file-btn">{{ d.uploaded ? t('kyc.reupload') : t('kyc.upload') }}</span>
              </label>
            </li>
          </ul>

          <p v-if="basicErr" class="kyc__err">{{ basicErr }}</p>
          <label v-if="!basicBlocked" class="kyc__consent">
            <input v-model="basicConsent" type="checkbox" class="kyc__consent-input" />
            <span>{{ t('kyc.consentBasic') }}</span>
          </label>
          <button v-if="!basicBlocked" type="button" class="kyc__submit" @click="onSubmitBasic">
            {{ t('kyc.submitBasic') }}
          </button>
        </section>

        <section v-if="showAdvanced" class="kyc__card" aria-labelledby="kyc-adv-h">
          <h3 id="kyc-adv-h" class="kyc__h">{{ t('kyc.advTitle') }}</h3>
          <p class="kyc__sub">{{ t('kyc.advSub') }}</p>

          <div v-if="state.advanced.status === 'IN_REVIEW'" class="kyc__banner kyc__banner--pend">
            {{ t('kyc.bannerAdvReview', { time: fmtTime(state.advanced.submittedAt) }) }}
          </div>
          <div v-if="state.advanced.status === 'PASSED'" class="kyc__banner kyc__banner--ok">
            {{ t('kyc.bannerAdvOk', { time: fmtTime(state.advanced.reviewedAt) }) }}
          </div>
          <div
            v-if="state.advanced.status === 'REJECTED' && state.advanced.rejectReason"
            class="kyc__banner kyc__banner--bad"
          >
            {{ translateReject(state.advanced.rejectReason) }}
          </div>

          <div
            v-if="state.advanced.status === 'IN_REVIEW'"
            class="kyc__demo-bar"
            role="group"
            :aria-label="t('kyc.demoReviewTitle')"
          >
            <span class="kyc__demo-bar-title">{{ t('kyc.demoReviewTitle') }}</span>
            <div class="kyc__demo-bar-actions">
              <button type="button" class="kyc__demo-btn kyc__demo-btn--ok" @click="kyc.demoApproveAdvanced()">
                {{ t('kyc.demoApprove') }}
              </button>
              <button
                type="button"
                class="kyc__demo-btn"
                @click="kyc.demoRejectAdvanced('kyc.rejectReason.address')"
              >
                {{ t('kyc.demoRejectAddress') }}
              </button>
              <button
                type="button"
                class="kyc__demo-btn"
                @click="kyc.demoRejectAdvanced('kyc.rejectReason.selfie')"
              >
                {{ t('kyc.demoRejectSelfie') }}
              </button>
            </div>
          </div>

          <div class="kyc__grid">
            <label class="kyc__field kyc__field--full">
              <span class="kyc__lab">{{ t('kyc.fieldResidential') }}</span>
              <input v-model="advancedForm.residentialAddress" type="text" class="kyc__input" :disabled="advancedBlocked" />
            </label>
            <label class="kyc__field">
              <span class="kyc__lab">{{ t('kyc.fieldCity') }}</span>
              <input v-model="advancedForm.city" type="text" class="kyc__input" :disabled="advancedBlocked" />
            </label>
            <label class="kyc__field">
              <span class="kyc__lab">{{ t('kyc.fieldPostal') }}</span>
              <input v-model="advancedForm.postalCode" type="text" class="kyc__input" :disabled="advancedBlocked" />
            </label>
          </div>

          <h4 class="kyc__h4">{{ t('kyc.sectionAdvDocs') }}</h4>
          <ul class="kyc__docs">
            <li v-for="d in state.advanced.docs" :key="d.kind" class="kyc__doc">
              <div class="kyc__doc-text">
                <span class="kyc__dn">{{ docTitle(d.label) }}</span>
                <p class="kyc__dh">{{ docHint(d.label) }}</p>
                <p v-if="d.uploaded" class="kyc__df">{{ d.fileName }}</p>
                <div v-if="previewUrls[previewKey('advanced', d.kind)]" class="kyc__preview">
                  <img
                    :src="previewUrls[previewKey('advanced', d.kind)]"
                    :alt="t('kyc.previewAlt')"
                    class="kyc__preview-img"
                  />
                </div>
              </div>
              <label class="kyc__file" :class="{ 'kyc__file--disabled': advancedBlocked }">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  class="kyc__file-input"
                  :disabled="advancedBlocked"
                  @change="onFile('advanced', d.kind, $event)"
                />
                <span class="kyc__file-btn">{{ d.uploaded ? t('kyc.reupload') : t('kyc.upload') }}</span>
              </label>
            </li>
          </ul>

          <p v-if="advErr" class="kyc__err">{{ advErr }}</p>
          <label v-if="!advancedBlocked" class="kyc__consent">
            <input v-model="advConsent" type="checkbox" class="kyc__consent-input" />
            <span>{{ t('kyc.consentAdv') }}</span>
          </label>
          <button
            v-if="!advancedBlocked"
            type="button"
            class="kyc__submit"
            :disabled="currentTier < 1"
            @click="onSubmitAdvanced"
          >
            {{ t('kyc.submitAdv') }}
          </button>
        </section>

        <section class="kyc__faq" :aria-label="t('kyc.faqTitle')">
          <h3 class="kyc__faq-title">{{ t('kyc.faqTitle') }}</h3>
          <details v-for="fk in FAQ_KEYS" :key="fk" class="kyc__faq-item">
            <summary class="kyc__faq-q">{{ t(`kyc.faq.${fk}.q`) }}</summary>
            <p class="kyc__faq-a">{{ t(`kyc.faq.${fk}.a`) }}</p>
          </details>
        </section>

        <p class="kyc__reset">
          <button type="button" class="kyc__linkish" @click="kyc.resetDemo()">{{ t('kyc.reset') }}</button>
          <span class="kyc__reset-hint">{{ t('kyc.resetHint') }}</span>
        </p>
      </template>
    </ExPageState>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;
@use '@/styles/mixins' as mq;

.kyc {
  min-width: 0;
}

.kyc__hero {
  display: grid;
  gap: $space-4;
  margin-bottom: $space-4;
  align-items: start;

  @include mq.media-up(md) {
    grid-template-columns: 1fr minmax(200px, 280px);
    gap: $space-5;
  }
}

.kyc__hero-text {
  min-width: 0;
}

.kyc__title {
  margin: 0 0 $space-2;
  font-size: $font-size-lg;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.kyc__lead {
  margin: 0;
  font-size: $font-size-sm;
  color: $color-text-tertiary;
  line-height: 1.55;
  max-width: 720px;
}

.kyc__route-hint {
  margin: $space-3 0 0;
  font-size: 11px;
  color: $color-text-tertiary;
}

.kyc__mono {
  font-family: $font-family-mono;
  font-size: 11px;
}

.kyc__route-link {
  color: $color-brand;
  font-weight: $font-weight-semibold;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

.kyc__hero-aside {
  padding: $space-3 $space-4;
  border-radius: $radius-md;
  border: 1px solid $color-border;
  background: var(--ex-card-surface);
}

.kyc__prog-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: $space-2;
  margin-bottom: $space-2;
}

.kyc__prog-lab {
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  color: $color-text-secondary;
}

.kyc__prog-val {
  font-size: $font-size-md;
  font-weight: $font-weight-bold;
  color: $color-brand;
}

.kyc__prog-track {
  height: 6px;
  border-radius: 3px;
  background: var(--ex-fill-ghost);
  overflow: hidden;
}

.kyc__prog-fill {
  height: 100%;
  border-radius: 3px;
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--ex-brand) 88%, transparent),
    color-mix(in srgb, var(--ex-rise) 75%, var(--ex-brand))
  );
  transition: width 0.35s ease;
}

.kyc__prog-legend {
  list-style: none;
  margin: $space-3 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 10px;
  color: $color-text-tertiary;

  li {
    display: flex;
    align-items: center;
    gap: 6px;
    opacity: 0.4;

    &::before {
      content: '';
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: $color-border;
      flex-shrink: 0;
    }

    &[data-done='true'] {
      opacity: 0.85;
      color: $color-text-tertiary;

      &::before {
        background: var(--ex-rise);
        box-shadow: none;
      }
    }

    &[data-on='true'] {
      opacity: 1;
      color: $color-text-secondary;
      font-weight: $font-weight-semibold;

      &::before {
        background: var(--ex-brand);
        box-shadow: 0 0 0 2px color-mix(in srgb, var(--ex-brand) 22%, transparent);
      }
    }

    &[data-done='true'][data-on='true'] {
      &::before {
        background: var(--ex-rise);
        box-shadow: 0 0 0 2px color-mix(in srgb, var(--ex-rise) 22%, transparent);
      }
    }
  }
}

.kyc__tips {
  display: grid;
  gap: $space-3;
  margin-bottom: $space-4;

  @include mq.media-up(sm) {
    grid-template-columns: 1fr 1fr;
  }
}

.kyc__tips-col {
  padding: $space-3;
  border-radius: $radius-sm;
  border: 1px solid $color-border;
  font-size: $font-size-xs;
  line-height: 1.5;

  ul {
    margin: 0;
    padding-left: 1.1em;
    color: $color-text-secondary;
  }

  li + li {
    margin-top: 6px;
  }

  &--ok {
    background: color-mix(in srgb, var(--ex-rise) 6%, transparent);
    border-color: color-mix(in srgb, var(--ex-rise) 18%, transparent);
  }

  &--no {
    background: color-mix(in srgb, var(--ex-fall) 5%, transparent);
    border-color: color-mix(in srgb, var(--ex-fall) 14%, transparent);
  }
}

.kyc__tips-h {
  margin: 0 0 $space-2;
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.kyc__step-body {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  min-width: 0;
}

.kyc__smeta {
  font-size: 10px;
  color: $color-text-tertiary;
}

.kyc__consent {
  display: flex;
  gap: $space-2;
  align-items: flex-start;
  margin-top: $space-3;
  padding: $space-3;
  border-radius: $radius-sm;
  border: 1px solid $color-border;
  background: var(--ex-bg-muted);
  font-size: 11px;
  line-height: 1.5;
  color: $color-text-secondary;
  cursor: pointer;
}

.kyc__consent-input {
  margin-top: 3px;
  flex-shrink: 0;
  accent-color: var(--ex-brand);
}

.kyc__faq {
  margin: $space-5 0 0;
  padding: $space-4;
  border-radius: $radius-md;
  border: 1px solid $color-border;
  background: var(--ex-card-surface);
}

.kyc__faq-title {
  margin: 0 0 $space-3;
  font-size: $font-size-md;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.kyc__faq-item {
  border-bottom: 1px solid $color-border;

  &:last-child {
    border-bottom: none;
  }
}

.kyc__faq-q {
  padding: $space-3 0;
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  color: $color-text-primary;
  cursor: pointer;
  list-style: none;

  &::-webkit-details-marker {
    display: none;
  }

  &::after {
    content: '';
    float: right;
    width: 8px;
    height: 8px;
    margin-top: 6px;
    border-right: 2px solid $color-text-tertiary;
    border-bottom: 2px solid $color-text-tertiary;
    transform: rotate(45deg);
    transition: transform 0.2s ease;
  }
}

.kyc__faq-item[open] .kyc__faq-q::after {
  transform: rotate(-135deg);
  margin-top: 8px;
}

.kyc__faq-a {
  margin: 0 0 $space-3;
  padding: 0 0 $space-2;
  font-size: $font-size-xs;
  color: $color-text-tertiary;
  line-height: 1.55;
}

.kyc__badge-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: $space-3;
  margin-bottom: $space-4;
}

.kyc__tier {
  display: inline-flex;
  align-items: center;
  padding: 6px 14px;
  border-radius: $radius-sm;
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  background: var(--ex-brand-muted);
  color: $color-brand;
  border: 1px solid color-mix(in srgb, var(--ex-brand) 30%, transparent);

  &[data-t='2'] {
    background: var(--ex-rise-bg);
    color: $color-rise;
    border-color: color-mix(in srgb, var(--ex-rise) 28%, transparent);
  }
}

.kyc__done {
  font-size: $font-size-sm;
  color: $color-rise;
  font-weight: $font-weight-semibold;
}

.kyc__hint {
  font-size: $font-size-xs;
  color: $color-text-tertiary;
}

.kyc__card {
  margin-bottom: $space-4;
  padding: $space-4;
  border-radius: $radius-md;
  border: 1px solid $color-border;
  background: var(--ex-card-surface);
}

.kyc__h {
  margin: 0 0 $space-2;
  font-size: $font-size-md;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.kyc__sub {
  margin: 0 0 $space-4;
  font-size: $font-size-xs;
  color: $color-text-tertiary;
  line-height: 1.5;
}

.kyc__h4 {
  margin: $space-4 0 $space-2;
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  color: $color-text-secondary;
}

.kyc__table-wrap {
  overflow-x: auto;
  border-radius: $radius-sm;
  border: 1px solid $color-border;
}

.kyc__table {
  width: 100%;
  border-collapse: collapse;
  font-size: $font-size-xs;

  th,
  td {
    padding: $space-2 $space-3;
    text-align: left;
    border-bottom: 1px solid $color-border;
  }

  th {
    background: var(--ex-bg-muted);
    color: $color-text-tertiary;
    font-weight: $font-weight-semibold;
    white-space: nowrap;
  }

  td {
    color: $color-text-secondary;
  }

  tr:last-child td {
    border-bottom: none;
  }
}

.kyc__td--on {
  color: $color-rise !important;
  font-weight: $font-weight-semibold;
}

.kyc__note {
  margin: $space-3 0 0;
  font-size: 11px;
  color: $color-text-tertiary;
  line-height: 1.45;
}

.kyc__a {
  color: $color-brand;
  text-decoration: none;
  font-weight: $font-weight-semibold;
}

.kyc__a:hover {
  text-decoration: underline;
}

.kyc__steps-wrap {
  margin-bottom: $space-4;
}

.kyc__steps {
  list-style: none;
  margin: 0;
  padding: $space-3 $space-4;
  display: flex;
  flex-wrap: nowrap;
  align-items: flex-start;
  gap: 0;
  border-radius: $radius-md;
  border: 1px solid $color-border;
  background: var(--ex-bg-muted);

  @include mq.media-down(sm) {
    flex-wrap: wrap;
  }
}

.kyc__steps-line {
  flex: 1 1 24px;
  min-width: 12px;
  height: 2px;
  margin-top: 14px;
  background: color-mix(in srgb, var(--ex-border) 55%, var(--ex-brand) 45%);
  opacity: 0.7;

  @include mq.media-down(sm) {
    display: none;
  }
}

.kyc__step {
  display: flex;
  align-items: flex-start;
  gap: $space-2;
  opacity: 0.45;
  flex: 0 1 auto;

  &[data-on='true'] {
    opacity: 1;
  }
}

.kyc__sn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: $font-weight-bold;
  background: var(--ex-fill-ghost);
  border: 1px solid $color-border;
  color: $color-text-secondary;
  flex-shrink: 0;
}

.kyc__step[data-done='1'] .kyc__sn {
  background: var(--ex-rise-bg);
  color: $color-rise;
  border-color: color-mix(in srgb, var(--ex-rise) 25%, transparent);
}

.kyc__slab {
  display: block;
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.kyc__sst {
  font-size: 11px;
  color: $color-text-tertiary;
}

.kyc__banner {
  margin-bottom: $space-3;
  padding: $space-3;
  border-radius: $radius-sm;
  font-size: $font-size-sm;
  line-height: 1.45;

  &--pend {
    background: color-mix(in srgb, var(--ex-brand) 12%, transparent);
    border: 1px solid color-mix(in srgb, var(--ex-brand) 28%, transparent);
    color: $color-text-primary;
  }

  &--ok {
    background: var(--ex-rise-bg);
    border: 1px solid color-mix(in srgb, var(--ex-rise) 22%, transparent);
    color: $color-rise;
  }

  &--bad {
    background: var(--ex-fall-bg);
    border: 1px solid color-mix(in srgb, var(--ex-fall) 22%, transparent);
    color: $color-fall;
  }
}

.kyc__demo-bar {
  margin-bottom: $space-4;
  padding: $space-3;
  border-radius: $radius-sm;
  border: 1px dashed color-mix(in srgb, var(--ex-brand) 35%, $color-border);
  background: color-mix(in srgb, var(--ex-brand) 5%, transparent);
}

.kyc__demo-bar-title {
  display: block;
  font-size: 11px;
  font-weight: $font-weight-bold;
  color: $color-text-secondary;
  margin-bottom: $space-2;
}

.kyc__demo-bar-actions {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
}

.kyc__demo-btn {
  padding: 8px 12px;
  border-radius: $radius-sm;
  font-size: 11px;
  font-weight: $font-weight-semibold;
  border: 1px solid $color-border;
  background: var(--ex-bg-elevated);
  color: $color-text-primary;
  cursor: pointer;

  &:hover {
    border-color: color-mix(in srgb, var(--ex-brand) 40%, transparent);
  }

  &--ok {
    background: $color-brand;
    color: var(--ex-on-brand);
    border-color: transparent;

    &:hover {
      filter: brightness(1.05);
    }
  }
}

.kyc__grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: $space-3;

  @include mq.media-up(sm) {
    grid-template-columns: 1fr 1fr;
  }
}

.kyc__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.kyc__field--full {
  @include mq.media-up(sm) {
    grid-column: 1 / -1;
  }
}

.kyc__lab {
  font-size: 11px;
  font-weight: $font-weight-semibold;
  color: $color-text-tertiary;
}

.kyc__input {
  padding: 10px 12px;
  border-radius: $radius-sm;
  border: 1px solid $color-border;
  background: var(--ex-bg-elevated);
  color: $color-text-primary;
  font-size: $font-size-sm;

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  &:focus {
    outline: none;
    border-color: color-mix(in srgb, var(--ex-brand) 45%, transparent);
  }
}

.kyc__docs {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.kyc__doc {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: flex-start;
  gap: $space-3;
  padding: $space-3;
  border-radius: $radius-sm;
  border: 1px solid $color-border;
  background: var(--ex-bg-muted);
}

.kyc__doc-text {
  min-width: 0;
  flex: 1 1 200px;
}

.kyc__dn {
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  color: $color-text-primary;
}

.kyc__dh {
  margin: 6px 0 0;
  font-size: 11px;
  color: $color-text-tertiary;
  line-height: 1.45;
}

.kyc__df {
  margin: $space-2 0 0;
  font-size: 11px;
  color: $color-brand;
  font-family: $font-family-mono;
}

.kyc__preview {
  margin-top: $space-2;
}

.kyc__preview-img {
  display: block;
  max-height: 120px;
  max-width: 100%;
  border-radius: $radius-sm;
  border: 1px solid $color-border;
  object-fit: contain;
  background: var(--ex-bg-elevated);
}

.kyc__file {
  position: relative;
  flex-shrink: 0;
  cursor: pointer;

  &--disabled {
    opacity: 0.45;
    pointer-events: none;
    cursor: not-allowed;
  }
}

.kyc__file-input {
  position: absolute;
  inset: 0;
  opacity: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
}

.kyc__file-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  border-radius: $radius-sm;
  font-size: $font-size-xs;
  font-weight: $font-weight-bold;
  border: 1px solid $color-border;
  background: var(--ex-bg-elevated);
  color: $color-brand;
}

.kyc__err {
  margin: $space-3 0 0;
  font-size: $font-size-xs;
  color: $color-fall;
}

.kyc__submit {
  margin-top: $space-4;
  width: 100%;
  max-width: 280px;
  padding: 12px $space-4;
  border: none;
  border-radius: $radius-sm;
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  cursor: pointer;
  background: $color-brand;
  color: var(--ex-on-brand);

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
}

.kyc__reset {
  margin: $space-6 0 0;
  font-size: 11px;
  color: $color-text-tertiary;
}

.kyc__linkish {
  background: none;
  border: none;
  padding: 0;
  color: $color-brand;
  font-weight: $font-weight-semibold;
  cursor: pointer;
  text-decoration: underline;
  font-size: inherit;
}

.kyc__reset-hint {
  margin-left: 8px;
}
</style>
