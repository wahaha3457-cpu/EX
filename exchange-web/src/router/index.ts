import { createRouter, createWebHistory } from 'vue-router'
import { RouteNames } from '@/constants/routeNames'
import { routeGuard } from '@/router/guards/index'
import { i18n } from '@/i18n'
import { useThemeStore } from '@/stores/theme'

const MainLayout = () => import('@/layouts/MainLayout.vue')
const AuthLayout = () => import('@/layouts/AuthLayout.vue')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: MainLayout,
      children: [
        {
          path: '',
          name: RouteNames.Home,
          meta: { titleKey: 'routes.meta.home' },
          component: () => import('@/views/home/HomePage.vue'),
        },
        {
          path: 'market',
          name: RouteNames.Market,
          meta: { titleKey: 'routes.meta.market' },
          component: () => import('@/views/market/MarketPage.vue'),
        },
        {
          path: 'demo/binance-kline',
          name: RouteNames.BinanceKlineDemo,
          meta: { title: 'Binance 行情 K 线' },
          component: () => import('@/views/demo/BinanceKlinePage.vue'),
        },
        {
          path: 'more/global-news/article/:slug',
          name: RouteNames.MoreGlobalNewsArticle,
          meta: { titleKey: 'routes.meta.moreGlobalNewsArticle' },
          component: () => import('@/views/news/GlobalNewsArticlePage.vue'),
        },
        {
          path: 'more/global-news',
          name: RouteNames.MoreGlobalNews,
          meta: { titleKey: 'routes.meta.moreGlobalNews' },
          component: () => import('@/views/news/GlobalNewsPage.vue'),
        },
        {
          path: 'more/nft',
          name: RouteNames.MoreNft,
          meta: { titleKey: 'routes.meta.moreNft' },
          component: () => import('@/views/nft/NftMarketPage.vue'),
        },
        {
          path: 'more/nft/my',
          name: RouteNames.NftMy,
          meta: { title: '我的 NFT', requiresAuth: true },
          component: () => import('@/views/nft/NftMyPage.vue'),
        },
        {
          path: 'more/charity',
          name: RouteNames.MoreCharity,
          meta: { titleKey: 'routes.meta.moreCharity' },
          component: () => import('@/views/charity/CharityPage.vue'),
        },
        {
          path: 'trade/spot/:symbol?',
          name: RouteNames.SpotTrade,
          meta: { titleKey: 'routes.meta.spotTrade' },
          component: () => import('@/views/trade/spot/SpotTradePage.vue'),
        },
        {
          path: 'trade/contract/:symbol?',
          name: RouteNames.ContractTrade,
          meta: { titleKey: 'routes.meta.contractTrade' },
          component: () => import('@/views/trade/contract/ContractTradePage.vue'),
        },
        {
          path: 'account',
          name: RouteNames.AccountHub,
          component: () => import('@/layouts/AccountHubLayout.vue'),
          meta: { requiresAuth: true, titleKey: 'routes.meta.accountHub' },
          redirect: { name: RouteNames.AccountOverview },
          children: [
            {
              path: 'overview',
              name: RouteNames.AccountOverview,
              meta: { titleKey: 'routes.meta.accountOverview' },
              component: () => import('@/views/account/AccountOverviewPage.vue'),
            },
            {
              path: 'profile',
              name: RouteNames.AccountProfile,
              redirect: { name: RouteNames.AccountOverview },
            },
            {
              path: 'assets',
              name: RouteNames.Assets,
              meta: { titleKey: 'routes.meta.assets', requiresAuth: true },
              component: () => import('@/views/assets/AssetsPage.vue'),
            },
            {
              path: 'orders',
              name: RouteNames.OrdersCenter,
              meta: { titleKey: 'routes.meta.orders', requiresAuth: true },
              component: () => import('@/views/orders/OrdersCenterPage.vue'),
              redirect: { name: RouteNames.OrdersLedger },
              children: [
                {
                  path: 'ledger',
                  name: RouteNames.OrdersLedger,
                  meta: { titleKey: 'routes.meta.ordersLedger' },
                  component: () => import('@/views/orders/OrdersLedgerView.vue'),
                },
                {
                  path: 'spot',
                  name: RouteNames.OrdersSpot,
                  meta: { titleKey: 'routes.meta.ordersSpot' },
                  component: () => import('@/views/orders/OrdersSpotView.vue'),
                },
                {
                  path: 'contract',
                  name: RouteNames.OrdersContract,
                  meta: { titleKey: 'routes.meta.ordersContract' },
                  component: () => import('@/views/orders/OrdersContractView.vue'),
                },
                {
                  path: 'c2c',
                  name: RouteNames.OrdersC2C,
                  meta: { titleKey: 'routes.meta.ordersC2c' },
                  component: () => import('@/views/orders/OrdersC2CView.vue'),
                },
                {
                  path: 'convert',
                  name: RouteNames.OrdersConvert,
                  meta: { titleKey: 'routes.meta.ordersConvert' },
                  component: () => import('@/views/orders/OrdersConvertView.vue'),
                },
                {
                  path: 'earn',
                  name: RouteNames.OrdersEarn,
                  meta: { titleKey: 'routes.meta.ordersEarn' },
                  component: () => import('@/views/orders/OrdersEarnView.vue'),
                },
                {
                  path: 'nft',
                  name: RouteNames.OrdersNft,
                  meta: { titleKey: 'routes.meta.ordersNft' },
                  component: () => import('@/views/orders/OrdersNftView.vue'),
                },
              ],
            },
            {
              path: 'security',
              name: RouteNames.AccountSecurity,
              meta: { titleKey: 'routes.meta.accountSecurity' },
              component: () => import('@/views/account/AccountSecurityPage.vue'),
            },
            {
              path: 'verification',
              name: RouteNames.Verification,
              meta: { titleKey: 'routes.meta.verification', requiresAuth: true },
              component: () => import('@/views/account/AccountVerificationPage.vue'),
            },
            {
              path: 'api',
              name: RouteNames.AccountApi,
              meta: { titleKey: 'routes.meta.accountApi' },
              component: () => import('@/views/account/AccountApiPage.vue'),
            },
            {
              path: 'sessions',
              name: RouteNames.AccountSessions,
              meta: { titleKey: 'routes.meta.accountSessions' },
              component: () => import('@/views/account/AccountSessionsPage.vue'),
            },
            {
              path: 'preferences',
              name: RouteNames.Preferences,
              meta: { titleKey: 'routes.meta.preferences', requiresAuth: true },
              component: () => import('@/views/account/AccountPreferencesPage.vue'),
            },
          ],
        },
        {
          path: 'user',
          redirect: (to) => {
            const tab = to.query.tab
            const map: Record<string, string> = {
              overview: '/account/overview',
              security: '/account/security',
              kyc: '/account/verification',
              api: '/account/api',
              login: '/account/sessions',
              preferences: '/account/preferences',
            }
            if (typeof tab === 'string' && map[tab]) {
              return { path: map[tab], query: {}, hash: to.hash }
            }
            return { path: '/account/overview', query: {}, hash: to.hash }
          },
        },
        {
          path: 'assets',
          redirect: (to) => ({ path: '/account/assets', query: to.query, hash: to.hash }),
        },
        {
          path: 'orders/:sub',
          redirect: (to) => ({
            path: `/account/orders/${to.params.sub as string}`,
            query: to.query,
            hash: to.hash,
          }),
        },
        {
          path: 'orders',
          redirect: (to) => ({ path: '/account/orders', query: to.query, hash: to.hash }),
        },
        {
          path: 'invite',
          name: RouteNames.ReferralInvite,
          meta: { titleKey: 'routes.meta.referralInvite', requiresAuth: true },
          component: () => import('@/views/referral/ReferralInvitePage.vue'),
        },
        {
          path: 'trade/copy',
          name: RouteNames.CopyTrading,
          meta: { titleKey: 'routes.meta.copyTrading' },
          component: () => import('@/views/copyTrading/CopyTradingPage.vue'),
        },
        {
          path: 'trade/demo',
          component: () => import('@/layouts/RouterPassLayout.vue'),
          children: [
            {
              path: '',
              name: RouteNames.DemoTrading,
              meta: { titleKey: 'routes.meta.demoTrading' },
              component: () => import('@/views/demo/DemoTradingHubPage.vue'),
            },
            {
              path: 'spot/:symbol?',
              name: RouteNames.DemoSpotTrade,
              meta: { titleKey: 'routes.meta.demoSpotTrade', demoMode: true },
              component: () => import('@/views/trade/spot/SpotTradePage.vue'),
            },
          ],
        },
        {
          path: 'convert',
          name: RouteNames.Convert,
          meta: { titleKey: 'routes.meta.convert' },
          component: () => import('@/views/convert/ConvertPage.vue'),
        },
        {
          path: 'c2c',
          component: () => import('@/views/c2c/C2CLayout.vue'),
          meta: { titleKey: 'routes.meta.c2c' },
          redirect: { name: RouteNames.C2CMarket },
          children: [
            {
              path: 'market',
              name: RouteNames.C2CMarket,
              component: () => import('@/views/c2c/C2CMarketView.vue'),
            },
            {
              path: 'orders/running',
              redirect: { name: RouteNames.C2COrdersRunning, params: { filter: 'all' } },
            },
            {
              path: 'orders/running/:filter',
              name: RouteNames.C2COrdersRunning,
              meta: { titleKey: 'routes.meta.c2c' },
              component: () => import('@/views/c2c/C2COrdersRunningView.vue'),
              props: true,
            },
            {
              path: 'orders/ended',
              redirect: { name: RouteNames.C2COrdersEnded, params: { filter: 'all' } },
            },
            {
              path: 'orders/ended/:filter',
              name: RouteNames.C2COrdersEnded,
              meta: { titleKey: 'routes.meta.c2c' },
              component: () => import('@/views/c2c/C2COrdersEndedView.vue'),
              props: true,
            },
          ],
        },
        {
          path: 'trade/delivery/:symbol?',
          name: RouteNames.DeliveryContract,
          meta: { titleKey: 'routes.meta.deliveryContract' },
          component: () => import('@/views/trade/delivery/DeliveryTradePage.vue'),
        },
        {
          path: 'finance/fund',
          name: RouteNames.FinanceFund,
          meta: { titleKey: 'routes.meta.financeFund' },
          component: () => import('@/views/finance/FundFinancePage.vue'),
        },
        {
          path: 'finance/miner',
          name: RouteNames.SmartMiner,
          meta: { titleKey: 'routes.meta.smartMiner' },
          component: () => import('@/views/finance/SmartMinerPage.vue'),
        },
        {
          path: 'finance/lending',
          name: RouteNames.LendingAssist,
          meta: { titleKey: 'routes.meta.lendingAssist' },
          component: () => import('@/views/finance/LendingAssistPage.vue'),
        },
        {
          path: 'finance/staking',
          name: RouteNames.StakingBorrow,
          meta: { titleKey: 'routes.meta.stakingBorrow' },
          component: () => import('@/views/finance/StakingBorrowPage.vue'),
        },
        {
          path: 'support/announce',
          name: RouteNames.AnnounceCenter,
          meta: { titleKey: 'routes.meta.announceCenter' },
          component: () => import('@/views/support/AnnounceCenterPage.vue'),
        },
        {
          path: 'support/activity',
          name: RouteNames.ActivityCenter,
          meta: { title: '活动中心' },
          component: () => import('@/views/support/ActivityCenterPage.vue'),
        },
        {
          path: 'support/service',
          name: RouteNames.SupportCenter,
          meta: { titleKey: 'routes.meta.supportCenter' },
          component: () => import('@/views/support/SupportCenterPage.vue'),
        },
        {
          path: 'app',
          name: RouteNames.AppDownload,
          meta: { title: 'APP 下载' },
          component: () => import('@/views/feature/FeaturePlaceholderPage.vue'),
        },
      ],
    },
    {
      path: '/auth',
      component: AuthLayout,
      children: [
        {
          path: 'login',
          name: RouteNames.Login,
          meta: { titleKey: 'routes.meta.login', guestOnly: true },
          component: () => import('@/views/auth/LoginPage.vue'),
        },
        {
          path: 'register',
          name: RouteNames.Register,
          meta: { title: '注册', guestOnly: true },
          component: () => import('@/views/auth/RegisterPage.vue'),
        },
        {
          path: 'forgot',
          name: RouteNames.ForgotPassword,
          meta: { titleKey: 'routes.meta.forgotPassword', guestOnly: true },
          component: () => import('@/views/auth/ForgotPasswordPage.vue'),
        },
      ],
    },
    { path: '/login', redirect: '/auth/login' },
    { path: '/register', redirect: '/auth/register' },
    {
      path: '/trade/options/:symbol?',
      redirect: (to) =>
        `/trade/delivery/${typeof to.params.symbol === 'string' && to.params.symbol ? to.params.symbol : 'BTCUSDT_250627'}`,
    },
    {
      path: '/admin/:pathMatch(.*)*',
      name: 'AdminExternalPortal',
      beforeEnter(to) {
        const portal = (import.meta.env.VITE_ADMIN_PORTAL_URL as string | undefined)?.trim().replace(/\/$/, '')
        if (!portal) {
          return { path: '/' }
        }
        const stripped = to.path.replace(/^\/admin\/?/, '')
        const segment = stripped || 'login'
        const pathOnPortal = segment.startsWith('/') ? segment : `/${segment}`
        window.location.replace(`${portal}${pathOnPortal}${to.search}${to.hash}`)
        return false
      },
      component: () => import('@/layouts/RouterPassLayout.vue'),
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      redirect: '/',
    },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

router.beforeEach(routeGuard)

router.afterEach((to) => {
  useThemeStore().ensureApplied()
  /**
   * 仅在无 Element Plus 全屏遮罩时清理 body 滚动锁，避免与 el-drawer/dialog 不同步导致
   * 透明遮罩残留、顶栏点击/下拉/搜索全部失效。
   */
  if (typeof document !== 'undefined') {
    requestAnimationFrame(() => {
      if (!document.querySelector('.el-overlay')) {
        document.body.style.overflow = ''
      }
    })
  }
  if (import.meta.env.DEV) {
    console.debug('[router] afterEach', to.fullPath)
  }
  const appTitle = import.meta.env.VITE_APP_TITLE || (i18n.global.t('routes.brand') as string)
  const key = to.meta.titleKey as string | undefined
  const segment = key ? (i18n.global.t(key) as string) : (i18n.global.t('routes.brand') as string)
  document.title = `${segment} · ${appTitle}`
})

export default router
