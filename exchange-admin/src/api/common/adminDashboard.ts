import type { AdminDashboardPayload } from '@/types/admin'

/**
 * GET /api/v1/admin/dashboard/summary
 */
export async function fetchAdminDashboard(): Promise<AdminDashboardPayload> {
  // return apiGet<AdminDashboardPayload>('/v1/admin/dashboard/summary')
  return {
    stats: {
      totalUsers: 128_400,
      activeSymbols: 186,
      ordersToday: 42_800,
      quoteVolumeTodayUsdt: 96_500_000,
      pendingWithdrawals: 17,
      riskEventsCount: 0,
    },
    todayStats: {
      usdtAccountBalance: 1_011_049_835.733_977_1,
      totalAccountAmount: 1_011_049_835.733_977_1,
      depositAmountToday: 10_000,
      withdrawAmountToday: 0,
      earningsToday: -13_557.07,
      newUsersToday: 1,
      depositUsersToday: 1,
      totalUsers: 4327,
    },
    pendingReminders: {
      depositOrders: 2,
      withdrawOrders: 412,
      kycBasic: 3,
      kycAdvanced: 0,
    },
    announcements: [
      {
        id: 'a1',
        title: '关于系统维护窗口的通知',
        updatedAt: new Date(Date.now() - 3600_000).toISOString(),
        pinned: true,
      },
      {
        id: 'a2',
        title: '新上线交易对公告（演示）',
        updatedAt: new Date(Date.now() - 7200_000).toISOString(),
        pinned: false,
      },
    ],
  }
}
