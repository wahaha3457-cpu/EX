import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { RouteNames } from '@/constants/routeNames'
import { isAdminProfile } from '@/utils/adminAccess'

export function routeGuard(
  to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext,
) {
  const auth = useAuthStore()

  if (to.meta.guestOnly && auth.isAuthenticated) {
    next({ name: RouteNames.Home })
    return
  }

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    next({
      name: RouteNames.Login,
      query: { redirect: to.fullPath },
    })
    return
  }

  if (to.meta.requiresAdmin) {
    if (!auth.isAuthenticated) {
      next({
        name: RouteNames.Login,
        query: { redirect: to.fullPath },
      })
      return
    }
    /** 生产环境要求管理员（roles 或 userCode 前缀 A，与后端 SecurityUser 一致） */
    if (import.meta.env.PROD && !isAdminProfile(auth.user)) {
      next({ name: RouteNames.Home })
      return
    }
  }

  next()
}
