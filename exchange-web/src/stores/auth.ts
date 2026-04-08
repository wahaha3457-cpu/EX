import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { UserProfile } from '@/types/user'
import { StorageKeys } from '@/constants/storageKeys'
import { clearTokens, setAccessToken, setRefreshToken, getAccessToken } from '@/utils/tokenStorage'
import { loginApi, registerApi, fetchProfileApi } from '@/api/auth'
import { isMockMode } from '@/config/env'
import type { LoginPayload, RegisterPayload } from '@/types/auth'

export const useAuthStore = defineStore('auth', () => {
  // 让登录态响应式：避免 Header 需要刷新才更新
  const accessToken = ref<string | null>(getAccessToken())
  const user = ref<UserProfile | null>(null)
  const loading = ref(false)

  /** 以 Access Token 存在为准；用户信息可异步补全 */
  const isAuthenticated = computed(() => !!accessToken.value)

  function setDemoScopeUserCode(code: string | undefined) {
    if (typeof localStorage === 'undefined') return
    try {
      if (code && code.trim().length > 0) {
        localStorage.setItem(StorageKeys.DEMO_SCOPE_USER_CODE, code.trim())
      } else {
        localStorage.removeItem(StorageKeys.DEMO_SCOPE_USER_CODE)
      }
    } catch {
      /* ignore */
    }
  }

  function setSession(token: string, profile: UserProfile, refreshToken?: string) {
    setAccessToken(token)
    setRefreshToken(refreshToken)
    // 同步到响应式状态
    accessToken.value = token
    user.value = profile
    setDemoScopeUserCode(profile.userCode)
  }

  async function clearSession() {
    clearTokens()
    accessToken.value = null
    user.value = null
    setDemoScopeUserCode(undefined)
    try {
      const { useUserCenterStore } = await import('@/stores/userCenter')
      useUserCenterStore().clearPrivatePayload()
    } catch {
      /* ignore */
    }
  }

  async function login(payload: LoginPayload) {
    loading.value = true
    try {
      const res = await loginApi(payload)
      setSession(res.accessToken, res.user, res.refreshToken)
      return res
    } finally {
      loading.value = false
    }
  }

  async function register(payload: RegisterPayload) {
    loading.value = true
    try {
      const res = await registerApi(payload)
      setSession(res.accessToken, res.user, res.refreshToken)
      return res
    } finally {
      loading.value = false
    }
  }

  async function loadProfile() {
    if (!accessToken.value) return
    loading.value = true
    try {
      const profile = await fetchProfileApi()
      user.value = profile
      setDemoScopeUserCode(profile.userCode)
    } catch {
      await clearSession()
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    if (isMockMode()) {
      await import('@/mocks/authMockService').then((m) => m.mockClearAuthStorage())
    }
    try {
      const [{ useDeliveryTradeStore }, { useFuturesTradeStore }] = await Promise.all([
        import('@/stores/deliveryTrade'),
        import('@/stores/futuresTrade'),
      ])
      useDeliveryTradeStore().stripLocalDemoFromUiState()
      useFuturesTradeStore().stripLocalDemoFromUiState()
    } catch {
      /* Pinia 未就绪时忽略 */
    }
    await clearSession()
  }

  /** 本地合并资料（如 KYC 等级），不触发接口 */
  function patchUser(partial: Partial<UserProfile>) {
    if (!user.value) return
    user.value = { ...user.value, ...partial }
  }

  return {
    accessToken,
    user,
    loading,
    isAuthenticated,
    setSession,
    clearSession,
    login,
    register,
    loadProfile,
    logout,
    patchUser,
  }
})
