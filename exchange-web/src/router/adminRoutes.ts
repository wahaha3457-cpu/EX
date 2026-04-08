import type { RouteRecordRaw } from 'vue-router'
import { RouteNames } from '@/constants/routeNames'
import { adminPath } from '@/utils/adminPublicPath'

const UserMgmtPage = () => import('@/views/admin/users/UserMgmtModulePage.vue')
const RouterPass = () => import('@/layouts/RouterPassLayout.vue')
const AdminPlaceholder = () => import('@/views/admin/PlaceholderPage.vue')
const AdminFinanceDepositsPage = () => import('@/views/admin/finance/FinanceDepositsPage.vue')
const AdminFinanceWithdrawalsPage = () => import('@/views/admin/finance/FinanceWithdrawalsPage.vue')
const AdminFinanceChainWithdrawAddressesPage = () =>
  import('@/views/admin/finance/FinanceChainWithdrawAddressesPage.vue')
const AdminFinanceChainPersonalDepositAddressesPage = () =>
  import('@/views/admin/finance/FinanceChainPersonalDepositAddressesPage.vue')
const AdminFinanceChainPublicDepositAddressesPage = () =>
  import('@/views/admin/finance/FinanceChainPublicDepositAddressesPage.vue')
const AdminFinanceWithdrawLimitsPage = () => import('@/views/admin/finance/FinanceWithdrawLimitsPage.vue')
const AdminReportsTotalDwPage = () => import('@/views/admin/reports/ReportsTotalDwPage.vue')
const AdminReportsAgentDwPage = () => import('@/views/admin/reports/ReportsAgentDwPage.vue')
const AdminReportsUserEarningsPage = () => import('@/views/admin/reports/ReportsUserEarningsPage.vue')
const ConfigLeafPage = () => import('@/views/admin/config/ConfigLeafPage.vue')
const QuickGeneralQueryPage = () => import('@/views/admin/quick/QuickGeneralQueryPage.vue')
const AdminLoginPasswordPage = () => import('@/views/admin/account/AdminLoginPasswordPage.vue')
const AdminFundPasswordPage = () => import('@/views/admin/account/AdminFundPasswordPage.vue')

/** 运营后台 shell 内子路由（主站挂载于 /admin，独立门户挂载于 /） */
export const adminShellChildRoutes: RouteRecordRaw[] = [
    {
      path: 'dashboard',
      name: RouteNames.AdminDashboard,
      meta: { titleKey: 'routes.meta.adminDashboard' },
      component: () => import('@/views/admin/DashboardPage.vue'),
    },
    {
      path: 'account',
      name: RouteNames.AdminAccount,
      component: RouterPass,
      meta: { titleKey: 'routes.meta.adminAccount' },
      redirect: adminPath('/account/login-password'),
      children: [
        {
          path: 'login-password',
          name: RouteNames.AdminAccountLoginPassword,
          meta: { titleKey: 'routes.meta.adminAccountLoginPassword' },
          component: AdminLoginPasswordPage,
        },
        {
          path: 'fund-password',
          name: RouteNames.AdminAccountFundPassword,
          meta: { titleKey: 'routes.meta.adminAccountFundPassword' },
          component: AdminFundPasswordPage,
        },
      ],
    },
    {
      path: 'quick',
      name: RouteNames.AdminQuickAccess,
      component: RouterPass,
      meta: { title: '常用功能列表' },
      redirect: adminPath('/quick/mgmt/general-query'),
      children: [
        {
          path: 'mgmt/general-query',
          name: RouteNames.AdminQuickGeneralQuery,
          meta: { title: '综合查询' },
          component: QuickGeneralQueryPage,
        },
      ],
    },
    {
      path: 'users',
      name: RouteNames.AdminUsers,
      component: RouterPass,
      meta: { title: '用户管理' },
      redirect: adminPath('/users/list'),
      children: [
        {
          path: 'agents',
          name: RouteNames.AdminUserAgents,
          meta: { title: '代理商', userModule: 'agents' },
          component: UserMgmtPage,
        },
        {
          path: 'referrals',
          name: RouteNames.AdminUserReferrals,
          meta: { title: '推荐关系', userModule: 'referrals' },
          component: UserMgmtPage,
        },
        {
          path: 'kyc-basic',
          name: RouteNames.AdminUserKycBasic,
          meta: { title: '用户基础认证', userModule: 'kycBasic' },
          component: UserMgmtPage,
        },
        {
          path: 'kyc-c2c',
          name: RouteNames.AdminUserKycC2c,
          meta: { title: '用户C2C认证', userModule: 'kycC2c' },
          component: UserMgmtPage,
        },
        {
          path: 'kyc-advanced',
          name: RouteNames.AdminUserKycAdvanced,
          meta: { title: '用户高级认证', userModule: 'kycAdvanced' },
          component: UserMgmtPage,
        },
        {
          path: 'manual-reset',
          name: RouteNames.AdminUserManualReset,
          meta: { title: '人工重置管理', userModule: 'manualReset' },
          component: UserMgmtPage,
        },
        {
          path: 'basic-profiles',
          name: RouteNames.AdminUserBasicProfiles,
          meta: { title: '用户基础管理', userModule: 'basicProfiles' },
          component: UserMgmtPage,
        },
        {
          path: 'list',
          name: RouteNames.AdminUserList,
          /* 面包肩与侧栏区分：侧栏仍为「用户管理」 */
          meta: { title: '用户列表', userModule: 'list' },
          component: UserMgmtPage,
        },
        {
          path: 'contacts',
          name: RouteNames.AdminUserContacts,
          meta: { title: '用户通讯录', userModule: 'contacts' },
          component: UserMgmtPage,
        },
      ],
    },
    {
      path: 'currencies',
      name: RouteNames.AdminCurrencies,
      meta: { title: '币种管理' },
      component: () => import('@/views/admin/PlaceholderPage.vue'),
    },
    {
      path: 'symbols',
      name: RouteNames.AdminSymbols,
      meta: { titleKey: 'routes.meta.adminSymbols' },
      component: () => import('@/views/admin/PlaceholderPage.vue'),
    },
    {
      path: 'orders',
      name: RouteNames.AdminOrders,
      component: RouterPass,
      meta: { title: '业务/订单管理' },
      redirect: adminPath('/orders/spot'),
      children: [
        {
          path: 'c2c',
          name: RouteNames.AdminOrdersC2c,
          component: RouterPass,
          meta: { title: 'C2C' },
          redirect: adminPath('/orders/c2c/payment-templates'),
          children: [
            {
              path: 'payment-templates',
              name: RouteNames.AdminOrdersC2cPayTemplates,
              meta: { title: 'C2C支付方式模版' },
              component: AdminPlaceholder,
            },
            {
              path: 'payment-methods',
              name: RouteNames.AdminOrdersC2cPayMethods,
              meta: { title: 'C2C支付方式管理' },
              component: AdminPlaceholder,
            },
            {
              path: 'merchants',
              name: RouteNames.AdminOrdersC2cMerchants,
              meta: { title: 'C2C承兑商管理' },
              component: AdminPlaceholder,
            },
            {
              path: 'ads-config',
              name: RouteNames.AdminOrdersC2cAds,
              meta: { title: 'C2C广告配置' },
              component: AdminPlaceholder,
            },
            {
              path: 'orders',
              name: RouteNames.AdminOrdersC2cOrders,
              meta: { title: 'C2C订单' },
              component: AdminPlaceholder,
            },
            {
              path: 'appeals',
              name: RouteNames.AdminOrdersC2cAppeals,
              meta: { title: 'C2C申诉' },
              component: AdminPlaceholder,
            },
          ],
        },
        {
          path: 'ico',
          name: RouteNames.AdminOrdersIco,
          component: RouterPass,
          meta: { title: 'ICO' },
          redirect: adminPath('/orders/ico/products'),
          children: [
            {
              path: 'products',
              name: RouteNames.AdminOrdersIcoProducts,
              meta: { title: 'ICO产品配置' },
              component: AdminPlaceholder,
            },
            {
              path: 'user-orders',
              name: RouteNames.AdminOrdersIcoUserOrders,
              meta: { title: 'ICO用户订单' },
              component: AdminPlaceholder,
            },
          ],
        },
        {
          path: 'spot',
          name: RouteNames.AdminOrdersSpot,
          meta: { title: '现货订单' },
          component: AdminPlaceholder,
        },
        {
          path: 'contract',
          name: RouteNames.AdminOrdersContract,
          component: RouterPass,
          meta: { title: '合约订单' },
          redirect: adminPath('/orders/contract/perpetual-orders'),
          children: [
            {
              path: 'perpetual-orders',
              name: RouteNames.AdminOrdersContractPerpOrders,
              meta: { title: '永续合约单' },
              component: AdminPlaceholder,
            },
            {
              path: 'perpetual-entrust',
              name: RouteNames.AdminOrdersContractPerpEntrust,
              meta: { title: '永续委托单' },
              component: AdminPlaceholder,
            },
            {
              path: 'delivery-orders',
              name: RouteNames.AdminOrdersContractDelOrders,
              meta: { title: '交割合约单' },
              component: AdminPlaceholder,
            },
            {
              path: 'delivery-venue-settings',
              name: RouteNames.AdminOrdersContractDelVenueSettings,
              meta: { title: '交割场控设置' },
              component: AdminPlaceholder,
            },
            {
              path: 'delivery-global-venue',
              name: RouteNames.AdminOrdersContractDelGlobalVenue,
              meta: { title: '交割合约全局场控' },
              component: AdminPlaceholder,
            },
            {
              path: 'delivery-team-venue',
              name: RouteNames.AdminOrdersContractDelTeamVenue,
              meta: { title: '团队交割场控' },
              component: AdminPlaceholder,
            },
            {
              path: 'delivery-copy',
              name: RouteNames.AdminOrdersContractDelCopy,
              meta: { title: '交割跟单管理' },
              component: AdminPlaceholder,
            },
          ],
        },
        {
          path: 'finance',
          name: RouteNames.AdminOrdersFinance,
          component: RouterPass,
          meta: { title: '理财订单' },
          redirect: adminPath('/orders/finance/miner'),
          children: [
            {
              path: 'miner',
              name: RouteNames.AdminOrdersFinanceMiner,
              meta: { title: '矿机理财' },
              component: AdminPlaceholder,
            },
            {
              path: 'smart-miner',
              name: RouteNames.AdminOrdersFinanceSmartMiner,
              meta: { title: '智能矿机' },
              component: AdminPlaceholder,
            },
            {
              path: 'bots',
              name: RouteNames.AdminOrdersFinanceBots,
              meta: { title: '交易机器人' },
              component: AdminPlaceholder,
            },
          ],
        },
        {
          path: 'nft',
          name: RouteNames.AdminOrdersNft,
          meta: { title: 'NFT订单' },
          component: AdminPlaceholder,
        },
        {
          path: 'convert',
          name: RouteNames.AdminOrdersConvert,
          meta: { title: '闪兑订单' },
          component: AdminPlaceholder,
        },
        {
          path: 'staking',
          name: RouteNames.AdminOrdersStaking,
          meta: { title: '质押订单' },
          component: AdminPlaceholder,
        },
        {
          path: 'lending',
          name: RouteNames.AdminOrdersLending,
          meta: { title: '借贷订单' },
          component: AdminPlaceholder,
        },
        {
          path: 'funding',
          name: RouteNames.AdminOrdersFunding,
          component: RouterPass,
          meta: { title: '充提订单' },
          redirect: adminPath('/orders/funding/deposit'),
          children: [
            {
              path: 'deposit',
              name: RouteNames.AdminOrdersFundingDeposit,
              meta: { title: '充值订单' },
              component: AdminPlaceholder,
            },
            {
              path: 'withdraw',
              name: RouteNames.AdminOrdersFundingWithdraw,
              meta: { title: '提现订单' },
              component: AdminPlaceholder,
            },
          ],
        },
      ],
    },
    {
      path: 'assets',
      name: RouteNames.AdminAssets,
      meta: { titleKey: 'routes.meta.adminAssets' },
      component: () => import('@/views/admin/PlaceholderPage.vue'),
    },
    {
      path: 'announcements',
      name: RouteNames.AdminAnnouncements,
      meta: { title: '公告管理' },
      component: () => import('@/views/admin/PlaceholderPage.vue'),
    },
    {
      path: 'rbac',
      name: RouteNames.AdminRbac,
      meta: { titleKey: 'routes.meta.adminRbac' },
      component: () => import('@/views/admin/PlaceholderPage.vue'),
    },
    {
      path: 'logs',
      name: RouteNames.AdminLogs,
      meta: { titleKey: 'routes.meta.adminLogs' },
      component: () => import('@/views/admin/PlaceholderPage.vue'),
    },
    {
      path: 'activities',
      name: RouteNames.AdminActivities,
      meta: { title: '活动管理' },
      component: AdminPlaceholder,
    },
    {
      path: 'finance-mgmt',
      name: RouteNames.AdminFinanceMgmt,
      component: RouterPass,
      meta: { title: '财务管理' },
      redirect: adminPath('/finance-mgmt/deposits'),
      children: [
        {
          path: 'deposits',
          name: RouteNames.AdminFinanceDeposits,
          meta: { title: '充值订单' },
          component: AdminFinanceDepositsPage,
        },
        {
          path: 'withdrawals',
          name: RouteNames.AdminFinanceWithdrawals,
          meta: { title: '提现订单' },
          component: AdminFinanceWithdrawalsPage,
        },
        {
          path: 'chain/withdraw-addresses',
          name: RouteNames.AdminFinanceChainWithdrawAddresses,
          meta: { title: '区块链提现地址维护' },
          component: AdminFinanceChainWithdrawAddressesPage,
        },
        {
          path: 'chain/personal-deposit-addresses',
          name: RouteNames.AdminFinanceChainPersonalDepositAddresses,
          meta: { title: '区块链个人充值地址维护' },
          component: AdminFinanceChainPersonalDepositAddressesPage,
        },
        {
          path: 'chain/public-deposit-addresses',
          name: RouteNames.AdminFinanceChainPublicDepositAddresses,
          meta: { title: '区块链公共充值地址维护' },
          component: AdminFinanceChainPublicDepositAddressesPage,
        },
        {
          path: 'withdraw-limits',
          name: RouteNames.AdminFinanceWithdrawLimits,
          meta: { title: '提现限额管理' },
          component: AdminFinanceWithdrawLimitsPage,
        },
      ],
    },
    {
      path: 'reports',
      name: RouteNames.AdminReports,
      component: RouterPass,
      meta: { title: '报表管理' },
      redirect: adminPath('/reports/total-dw'),
      children: [
        {
          path: 'total-dw',
          name: RouteNames.AdminReportsTotalDw,
          meta: { title: '总充提报表' },
          component: AdminReportsTotalDwPage,
        },
        {
          path: 'agent-dw',
          name: RouteNames.AdminReportsAgentDw,
          meta: { title: '代理商充提报表' },
          component: AdminReportsAgentDwPage,
        },
        {
          path: 'user-earnings',
          name: RouteNames.AdminReportsUserEarnings,
          meta: { title: '用户收益报表' },
          component: AdminReportsUserEarningsPage,
        },
      ],
    },
    {
      path: 'config',
      name: RouteNames.AdminConfigCenter,
      component: RouterPass,
      meta: { title: '配置管理' },
      redirect: adminPath('/config/market/overview'),
      children: [
        {
          path: 'market',
          name: RouteNames.AdminConfigMarket,
          component: RouterPass,
          meta: { title: '行情' },
          redirect: adminPath('/config/market/overview'),
          children: [
            {
              path: 'overview',
              name: RouteNames.AdminConfigMarketOverview,
              meta: { title: '行情管理' },
              component: ConfigLeafPage,
            },
            {
              path: 'symbols',
              name: RouteNames.AdminConfigMarketSymbols,
              meta: { title: '行情品种管理' },
              component: ConfigLeafPage,
            },
          ],
        },
        {
          path: 'exchange-rates',
          name: RouteNames.AdminConfigExchangeRates,
          component: RouterPass,
          meta: { title: '汇率' },
          redirect: adminPath('/config/exchange-rates/settings'),
          children: [
            {
              path: 'settings',
              name: RouteNames.AdminConfigExchangeRatesSettings,
              meta: { title: '汇率配置' },
              component: ConfigLeafPage,
            },
          ],
        },
        {
          path: 'wealth',
          name: RouteNames.AdminConfigWealth,
          component: RouterPass,
          meta: { title: '财富' },
          redirect: adminPath('/config/wealth/earn'),
          children: [
            {
              path: 'earn',
              name: RouteNames.AdminConfigWealthEarn,
              meta: { title: '理财配置' },
              component: ConfigLeafPage,
            },
            {
              path: 'miner',
              name: RouteNames.AdminConfigWealthMiner,
              meta: { title: '矿机配置' },
              component: ConfigLeafPage,
            },
            {
              path: 'bots',
              name: RouteNames.AdminConfigWealthBots,
              meta: { title: '交易机器人配置' },
              component: ConfigLeafPage,
            },
            {
              path: 'lending',
              name: RouteNames.AdminConfigWealthLending,
              meta: { title: '借贷配置' },
              component: ConfigLeafPage,
            },
            {
              path: 'team-withdraw',
              name: RouteNames.AdminConfigWealthTeamWithdraw,
              meta: { title: '团队提现配置' },
              component: ConfigLeafPage,
            },
          ],
        },
        {
          path: 'contract',
          name: RouteNames.AdminConfigContract,
          component: RouterPass,
          meta: { title: '合约' },
          redirect: adminPath('/config/contract/perpetual'),
          children: [
            {
              path: 'perpetual',
              name: RouteNames.AdminConfigContractPerpetual,
              meta: { title: '永续合约管理' },
              component: ConfigLeafPage,
            },
            {
              path: 'delivery',
              name: RouteNames.AdminConfigContractDelivery,
              meta: { title: '交割合约管理' },
              component: ConfigLeafPage,
            },
          ],
        },
        {
          path: 'content',
          name: RouteNames.AdminConfigContent,
          component: RouterPass,
          meta: { title: '内容' },
          redirect: adminPath('/config/content/client'),
          children: [
            {
              path: 'client',
              name: RouteNames.AdminConfigContentClient,
              meta: { title: '用户端内容管理' },
              component: ConfigLeafPage,
            },
            {
              path: 'news',
              name: RouteNames.AdminConfigContentNews,
              meta: { title: '新闻管理' },
              component: ConfigLeafPage,
            },
            {
              path: 'banners',
              name: RouteNames.AdminConfigContentBanners,
              meta: { title: '横幅管理' },
              component: ConfigLeafPage,
            },
          ],
        },
      ],
    },
    {
      path: 'system',
      name: RouteNames.AdminSystemMgmt,
      component: RouterPass,
      meta: { title: '系统管理' },
      redirect: adminPath('/system/sys/root-params'),
      children: [
        {
          path: 'sys',
          name: RouteNames.AdminSystemSys,
          component: RouterPass,
          meta: { title: '系统管理' },
          redirect: adminPath('/system/sys/root-params'),
          children: [
            {
              path: 'root-params',
              name: RouteNames.AdminSystemSysRootParams,
              meta: { title: '系统参数(ROOT)' },
              component: ConfigLeafPage,
            },
            {
              path: 'params',
              name: RouteNames.AdminSystemSysParams,
              meta: { title: '系统参数' },
              component: ConfigLeafPage,
            },
            {
              path: 'support',
              name: RouteNames.AdminSystemSysSupport,
              meta: { title: '客服管理' },
              component: ConfigLeafPage,
            },
          ],
        },
        {
          path: 'users',
          name: RouteNames.AdminSystemUsers,
          component: RouterPass,
          meta: { title: '系统用户' },
          redirect: adminPath('/system/users/roles'),
          children: [
            {
              path: 'roles',
              name: RouteNames.AdminSystemUsersRoles,
              meta: { title: '角色管理' },
              component: ConfigLeafPage,
            },
            {
              path: 'list',
              name: RouteNames.AdminSystemUsersList,
              meta: { title: '系统用户管理' },
              component: ConfigLeafPage,
            },
          ],
        },
        {
          path: 'logs',
          name: RouteNames.AdminSystemLogs,
          component: RouterPass,
          meta: { title: '日志' },
          redirect: adminPath('/system/logs/account-ledger'),
          children: [
            {
              path: 'account-ledger',
              name: RouteNames.AdminSystemLogsLedger,
              meta: { title: '账变记录' },
              component: ConfigLeafPage,
            },
            {
              path: 'operations',
              name: RouteNames.AdminSystemLogsOperations,
              meta: { title: '操作日志' },
              component: ConfigLeafPage,
            },
            {
              path: 'frontend',
              name: RouteNames.AdminSystemLogsFrontend,
              meta: { title: '前端日志' },
              component: ConfigLeafPage,
            },
            {
              path: 'verify-codes',
              name: RouteNames.AdminSystemLogsVerifyCodes,
              meta: { title: '验证码发送日志' },
              component: ConfigLeafPage,
            },
          ],
        },
        {
          path: 'ip',
          name: RouteNames.AdminSystemIp,
          component: RouterPass,
          meta: { title: 'IP管理' },
          redirect: adminPath('/system/ip/list'),
          children: [
            {
              path: 'list',
              name: RouteNames.AdminSystemIpList,
              meta: { title: 'IP列表' },
              component: ConfigLeafPage,
            },
          ],
        },
      ],
    },
    {
      path: ':pathMatch(.*)*',
      redirect: adminPath('/dashboard'),
    },
  ]

/** 主站：/admin 下的完整路由记录 */
export const adminRoute: RouteRecordRaw = {
  path: '/admin',
  name: RouteNames.AdminRoot,
  component: () => import('@/layouts/AdminLayout.vue'),
  meta: {
    requiresAuth: true,
    requiresAdmin: true,
    title: '运营后台',
  },
  redirect: adminPath('/dashboard'),
  children: adminShellChildRoutes,
}
