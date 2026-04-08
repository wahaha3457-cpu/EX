import type { RouteRecordRaw } from 'vue-router'
import { RouteNames } from '@/constants/routeNames'

const MobileShellLayout = () => import('@/layouts/MobileShellLayout.vue')

/**
 * 移动端可交互演示：/m/* 全树
 */
export const mobileShellRoutes: RouteRecordRaw[] = [
  {
    path: '/m',
    name: RouteNames.MobileRoot,
    component: MobileShellLayout,
    redirect: { name: RouteNames.MobileHome },
    children: [
      {
        path: 'home',
        name: RouteNames.MobileHome,
        meta: { title: '首页' },
        component: () => import('@/views/mobile/MobileHomePage.vue'),
      },
      {
        path: 'market',
        name: RouteNames.MobileMarket,
        meta: { title: '市场' },
        component: () => import('@/views/mobile/MobileMarketPage.vue'),
      },
      {
        path: 'publish',
        name: RouteNames.MobilePublish,
        meta: { title: '发布' },
        component: () => import('@/views/mobile/MobilePublishPage.vue'),
      },
      {
        path: 'publish/task',
        name: RouteNames.MobilePublishTask,
        meta: { title: '发布任务' },
        component: () => import('@/views/mobile/MobilePublishTaskPage.vue'),
      },
      {
        path: 'publish/escrow',
        name: RouteNames.MobilePublishEscrow,
        meta: { title: '创建托管' },
        component: () => import('@/views/mobile/MobilePublishEscrowPage.vue'),
      },
      {
        path: 'publish/service',
        name: RouteNames.MobilePublishService,
        meta: { title: '上架服务' },
        component: () => import('@/views/mobile/MobilePublishServicePage.vue'),
      },
      {
        path: 'service/:id',
        name: RouteNames.MobileServiceDetail,
        meta: { title: '服务详情' },
        component: () => import('@/views/mobile/MobileServiceDetailPage.vue'),
      },
      {
        path: 'me/services',
        name: RouteNames.MobileMeServices,
        meta: { title: '我的服务' },
        component: () => import('@/views/mobile/MobileMeServicesPage.vue'),
      },
      {
        path: 'assets',
        name: RouteNames.MobileAssets,
        meta: { title: '资产' },
        component: () => import('@/views/mobile/MobileAssetsPage.vue'),
      },
      {
        path: 'assets/deposit',
        name: RouteNames.MobileAssetsDeposit,
        meta: { title: '充值' },
        component: () => import('@/views/mobile/MobileDepositPage.vue'),
      },
      {
        path: 'assets/withdraw',
        name: RouteNames.MobileAssetsWithdraw,
        meta: { title: '提现' },
        component: () => import('@/views/mobile/MobileWithdrawPage.vue'),
      },
      {
        path: 'assets/ledger/:id',
        name: RouteNames.MobileLedgerDetail,
        meta: { title: '流水详情' },
        component: () => import('@/views/mobile/MobileLedgerDetailPage.vue'),
      },
      {
        path: 'profile',
        name: RouteNames.MobileProfile,
        meta: { title: '我的' },
        component: () => import('@/views/mobile/MobileProfilePage.vue'),
      },
      {
        path: 'otc/merchant/:id',
        name: RouteNames.MobileOtcMerchant,
        meta: { title: '下单' },
        component: () => import('@/views/mobile/MobileOtcMerchantPage.vue'),
      },
      {
        path: 'otc/order/:id',
        name: RouteNames.MobileOtcOrder,
        meta: { title: '订单详情' },
        component: () => import('@/views/mobile/MobileOtcOrderDetailPage.vue'),
      },
      {
        path: 'task/:id',
        name: RouteNames.MobileTaskDetail,
        meta: { title: '任务详情' },
        component: () => import('@/views/mobile/MobileTaskDetailPage.vue'),
      },
      {
        path: 'escrow/:id',
        name: RouteNames.MobileEscrowDetail,
        meta: { title: '托管详情' },
        component: () => import('@/views/mobile/MobileEscrowDetailPage.vue'),
      },
      {
        path: 'me/orders',
        name: RouteNames.MobileMeOrders,
        meta: { title: '我的订单' },
        component: () => import('@/views/mobile/MobileMeOrdersPage.vue'),
      },
      {
        path: 'me/tasks',
        name: RouteNames.MobileMeTasks,
        meta: { title: '我的任务' },
        component: () => import('@/views/mobile/MobileMeTasksPage.vue'),
      },
      {
        path: 'me/accepts',
        name: RouteNames.MobileMeAccepts,
        meta: { title: '我的接单' },
        component: () => import('@/views/mobile/MobileMeAcceptsPage.vue'),
      },
      {
        path: 'me/escrows',
        name: RouteNames.MobileMeEscrows,
        meta: { title: '我的托管' },
        component: () => import('@/views/mobile/MobileMeEscrowsPage.vue'),
      },
      {
        path: 'settings',
        name: RouteNames.MobileSettings,
        meta: { title: '设置' },
        component: () => import('@/views/mobile/MobileSettingsPage.vue'),
      },
      {
        path: 'help',
        name: RouteNames.MobileHelp,
        meta: { title: '帮助中心' },
        component: () => import('@/views/mobile/MobileHelpPage.vue'),
      },
      {
        path: 'security',
        name: RouteNames.MobileSecurity,
        meta: { title: '安全中心' },
        component: () => import('@/views/mobile/MobileSecurityPage.vue'),
      },
      {
        path: 'inbox',
        name: RouteNames.MobileInbox,
        meta: { title: '消息' },
        component: () => import('@/views/mobile/MobileInboxPage.vue'),
      },
      {
        path: 'inbox/:id',
        name: RouteNames.MobileInboxDetail,
        meta: { title: '消息详情' },
        component: () => import('@/views/mobile/MobileInboxDetailPage.vue'),
      },
    ],
  },
]
