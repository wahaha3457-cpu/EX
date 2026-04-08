import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { RouteNames } from '@/constants/routeNames'
import { isAdminProfile } from '@/utils/adminAccess'

/** 独立运营后台站点专用（VITE_ADMIN_STANDALONE） */
export function adminPortalRouteGuard(
  to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext,
) {
  const auth = useAuthStore()

  if (to.meta.guestOnly && auth.isAuthenticated) {
    next({ name: RouteNames.AdminDashboard })
    return
  }

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    next({ name: RouteNames.AdminPortalLogin, query: { redirect: to.fullPath } })
    return
  }

  if (to.meta.requiresAdmin) {
    if (!auth.isAuthenticated) {
      next({ name: RouteNames.AdminPortalLogin, query: { redirect: to.fullPath } })
      return
    }
    if (import.meta.env.PROD && !isAdminProfile(auth.user)) {
      next({ name: RouteNames.AdminPortalLogin })
      return
    }
  }

  next()
}
