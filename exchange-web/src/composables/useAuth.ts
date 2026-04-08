import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth'

/** 在组件中统一访问登录态与用户信息 */
export function useAuth() {
  const store = useAuthStore()
  const { user, loading, isAuthenticated } = storeToRefs(store)
  return {
    user,
    loading,
    isAuthenticated,
    login: store.login,
    logout: store.logout,
    loadProfile: store.loadProfile,
  }
}
