import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { KycDocKind, KycPersonalAdvanced, KycPersonalBasic, KycStoredState } from '@/types/kyc'
import {
  ensureBasicDocsForIdType,
  fetchKycState,
  kycStepToOverviewStatus,
  markDocUploaded,
  resetKycDemo,
  saveKycDraft,
  simulateAdvancedApproved,
  simulateAdvancedRejected,
  simulateBasicApproved,
  simulateBasicRejected,
  submitAdvancedKyc,
  submitBasicKyc,
} from '@/api/kyc/kycMock'
import { translate } from '@/i18n'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'
import { useUserCenterStore } from '@/stores/userCenter'

function te(msg: string) {
  if (msg.startsWith('kyc.') || msg.startsWith('common.')) return translate(msg)
  return msg
}

export const useKycStore = defineStore('kyc', () => {
  const state = ref<KycStoredState | null>(null)
  const loading = ref(false)
  const loadError = ref<string | null>(null)

  const tier = computed(() => state.value?.tier ?? 0)

  function userCode(): string | null {
    const u = useAuthStore().user?.userCode
    return u && u.length > 0 ? u : null
  }

  function syncDownstream() {
    const code = userCode()
    if (!code || !state.value) return
    const m = kycStepToOverviewStatus(state.value)
    useUserCenterStore().applyKycSnapshot(m.kycStatus, m.tier)
    useAuthStore().patchUser({ kycLevel: m.tier })
  }

  async function bootstrap(force = false) {
    const code = userCode()
    if (!code) {
      state.value = null
      return
    }
    if (state.value && !force) return
    loading.value = true
    loadError.value = null
    try {
      state.value = await fetchKycState(code)
      syncDownstream()
    } catch {
      loadError.value = translate('kyc.error.load')
      state.value = null
    } finally {
      loading.value = false
    }
  }

  async function saveBasicDraftFields(p: KycPersonalBasic) {
    const code = userCode()
    if (!code) return
    state.value = await saveKycDraft(code, { basicPersonal: p })
  }

  async function saveAdvancedDraftFields(p: KycPersonalAdvanced) {
    const code = userCode()
    if (!code) return
    state.value = await saveKycDraft(code, { advancedPersonal: p })
  }

  async function syncBasicDocLayout(idType: 'ID_CARD' | 'PASSPORT') {
    const code = userCode()
    if (!code) return
    state.value = await ensureBasicDocsForIdType(code, idType)
  }

  async function uploadDoc(tier: 'basic' | 'advanced', kind: KycDocKind, file: File) {
    const code = userCode()
    const app = useAppStore()
    if (!code) return
    if (!file.size || file.size > 5 * 1024 * 1024) {
      app.pushToast('error', te('kyc.error.fileSize'))
      return
    }
    state.value = await markDocUploaded(code, tier, kind, file.name)
    app.pushToast('success', te('kyc.toast.fileRecorded'))
  }

  async function submitBasic(personal: KycPersonalBasic) {
    const code = userCode()
    const app = useAppStore()
    if (!code) return false
    try {
      state.value = await submitBasicKyc(code, personal)
      syncDownstream()
      app.pushToast('success', te('kyc.toast.submittedBasic'))
      return true
    } catch (e) {
      app.pushToast('error', te(e instanceof Error ? e.message : 'common.requestFailed'))
      return false
    }
  }

  async function demoApproveBasic() {
    const code = userCode()
    const app = useAppStore()
    if (!code) return
    state.value = await simulateBasicApproved(code)
    syncDownstream()
    app.pushToast('success', te('kyc.toast.demoBasicPass'))
  }

  async function demoRejectBasic(reasonKey: string) {
    const code = userCode()
    const app = useAppStore()
    if (!code) return
    state.value = await simulateBasicRejected(code, reasonKey)
    syncDownstream()
    app.pushToast('warning', te('kyc.toast.demoBasicReject'))
  }

  async function submitAdvanced(personal: KycPersonalAdvanced) {
    const code = userCode()
    const app = useAppStore()
    if (!code) return false
    try {
      state.value = await submitAdvancedKyc(code, personal)
      syncDownstream()
      app.pushToast('success', te('kyc.toast.submittedAdvanced'))
      return true
    } catch (e) {
      app.pushToast('error', te(e instanceof Error ? e.message : 'common.requestFailed'))
      return false
    }
  }

  async function demoApproveAdvanced() {
    const code = userCode()
    const app = useAppStore()
    if (!code) return
    state.value = await simulateAdvancedApproved(code)
    syncDownstream()
    app.pushToast('success', te('kyc.toast.demoAdvPass'))
  }

  async function demoRejectAdvanced(reasonKey: string) {
    const code = userCode()
    const app = useAppStore()
    if (!code) return
    state.value = await simulateAdvancedRejected(code, reasonKey)
    syncDownstream()
    app.pushToast('warning', te('kyc.toast.demoAdvReject'))
  }

  async function resetDemo() {
    const code = userCode()
    const app = useAppStore()
    if (!code) return
    state.value = await resetKycDemo(code)
    syncDownstream()
    app.pushToast('info', te('kyc.toast.reset'))
  }

  return {
    state,
    loading,
    loadError,
    tier,
    bootstrap,
    saveBasicDraftFields,
    saveAdvancedDraftFields,
    syncBasicDocLayout,
    uploadDoc,
    submitBasic,
    submitAdvanced,
    demoApproveBasic,
    demoRejectBasic,
    demoApproveAdvanced,
    demoRejectAdvanced,
    resetDemo,
    syncDownstream,
  }
})
