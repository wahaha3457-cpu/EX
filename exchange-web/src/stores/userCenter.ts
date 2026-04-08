import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { fetchUserCenterPayload } from '@/api/userCenter'
import type { UserCenterNavTab, UserCenterPayload, UserKycStatus } from '@/types/userCenter'
import { useAuthStore } from '@/stores/auth'
import { kycStepToOverviewStatus, readKycState } from '@/api/kyc/kycMock'
import { isFundPasswordSet } from '@/api/fundPassword/fundPasswordMock'

export const useUserCenterStore = defineStore('userCenter', () => {
  const loading = ref(false)
  const loadError = ref<string | null>(null)
  const activeTab = ref<UserCenterNavTab>('overview')
  const payload = ref<UserCenterPayload | null>(null)

  const account = computed(() => payload.value?.account ?? null)
  const overview = computed(() => payload.value?.overview ?? null)
  const securityItems = computed(() => payload.value?.securityItems ?? [])
  const loginRecords = computed(() => payload.value?.loginRecords ?? [])

  /** 与登录态 UID 合并展示 */
  const displayUid = computed(() => {
    const auth = useAuthStore()
    const fromAuth = auth.user?.userCode
    const fromPayload = payload.value?.account.uid
    return fromAuth || fromPayload || '—'
  })

  function setTab(tab: UserCenterNavTab) {
    activeTab.value = tab
  }

  function applyKycSnapshot(kycStatus: UserKycStatus, kycTier: 0 | 1 | 2) {
    if (!payload.value) return
    payload.value = {
      ...payload.value,
      overview: {
        ...payload.value.overview,
        kycStatus,
        kycTier,
      },
    }
  }

  /** 资金密码设置/修改后同步安全列表展示（与 localStorage 一致） */
  function patchFundPasswordRow(set: boolean) {
    if (!payload.value) return
    payload.value = {
      ...payload.value,
      securityItems: payload.value.securityItems.map((si) =>
        si.id === 'fund_password'
          ? {
              ...si,
              status: set ? 'ON' : 'OFF',
              statusLabel: set ? '已设置' : '未设置',
              actionLabel: set ? '修改' : '设置',
            }
          : si,
      ),
    }
  }

  function mergeFundPasswordIntoSecurityItems(
    items: UserCenterPayload['securityItems'],
    userCode: string | undefined,
    emailMasked: string | undefined,
  ): UserCenterPayload['securityItems'] {
    const fundSet = isFundPasswordSet(userCode, emailMasked)
    return items.map((si) =>
      si.id === 'fund_password'
        ? {
            ...si,
            status: fundSet ? 'ON' : 'OFF',
            statusLabel: fundSet ? '已设置' : '未设置',
            actionLabel: fundSet ? '修改' : '设置',
          }
        : si,
    )
  }

  /** 登出或会话失效时清空缓存，避免顶栏未登录仍展示上一用户资料 */
  function clearPrivatePayload() {
    loading.value = false
    loadError.value = null
    activeTab.value = 'overview'
    payload.value = null
  }

  async function bootstrap() {
    loading.value = true
    loadError.value = null
    try {
      const data = await fetchUserCenterPayload()
      const auth = useAuthStore()
      const uc = auth.user?.userCode
      const em = auth.user?.emailMasked
      const kycSnap = uc ? kycStepToOverviewStatus(readKycState(uc)) : null
      payload.value = {
        ...data,
        account: {
          ...data.account,
          uid: auth.user?.userCode ?? data.account.uid,
        },
        overview: {
          ...data.overview,
          emailMasked: auth.user?.emailMasked ?? data.overview.emailMasked,
          emailBound: data.overview.emailBound || !!auth.user?.emailMasked,
          kycStatus: kycSnap ? kycSnap.kycStatus : data.overview.kycStatus,
          kycTier: kycSnap ? kycSnap.tier : (data.overview.kycTier ?? 0),
        },
        securityItems: mergeFundPasswordIntoSecurityItems(data.securityItems, uc, em),
      }
    } catch {
      loadError.value = '用户数据加载失败，请稍后重试'
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    loadError,
    activeTab,
    payload,
    account,
    overview,
    securityItems,
    loginRecords,
    displayUid,
    setTab,
    bootstrap,
    clearPrivatePayload,
    applyKycSnapshot,
    patchFundPasswordRow,
  }
})
