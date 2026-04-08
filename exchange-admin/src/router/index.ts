import { createRouter, createWebHistory } from 'vue-router'
import { adminPortalRouteGuard } from '@/router/adminPortalGuard'
import { RouteNames } from '@/constants/routeNames'
import { adminShellChildRoutes } from '@/router/adminRoutes'
import { mobileShellRoutes } from '@/router/mobileRoutes'
import { adminPath } from '@/utils/adminPublicPath'
import { i18n } from '@/i18n'
import { useThemeStore } from '@/stores/theme'

const AdminLayout = () => import('@/layouts/AdminLayout.vue')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: RouteNames.AdminPortalLogin,
      meta: { guestOnly: true, title: '运营后台登录' },
      component: () => import('@/views/admin-portal/AdminPortalLogin.vue'),
    },
    ...mobileShellRoutes,
    {
      path: '/',
      name: RouteNames.AdminRoot,
      component: AdminLayout,
      meta: { requiresAuth: true, requiresAdmin: true },
      redirect: adminPath('/dashboard'),
      children: adminShellChildRoutes,
    },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

router.beforeEach(adminPortalRouteGuard)

router.afterEach((to) => {
  useThemeStore().ensureApplied()
  if (typeof document !== 'undefined') {
    document.body.style.overflow = ''
  }
  const appTitle = import.meta.env.VITE_APP_TITLE || (i18n.global.t('routes.brand') as string)
  const key = to.meta.titleKey as string | undefined
  const titleMeta = to.meta.title as string | undefined
  const segment = titleMeta
    ? titleMeta
    : key
      ? (i18n.global.t(key) as string)
      : (i18n.global.t('routes.brand') as string)
  document.title = `${segment} · ${appTitle}`
})

export default router
