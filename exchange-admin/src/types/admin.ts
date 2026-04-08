/** 运营后台 — 仪表盘与通用列表占位类型 */

export interface AdminDashboardStats {
  totalUsers: number
  activeSymbols: number
  ordersToday: number
  quoteVolumeTodayUsdt: number
  pendingWithdrawals: number
  riskEventsCount: number
}

export interface AdminAnnouncementBrief {
  id: string
  title: string
  updatedAt: string
  pinned: boolean
}

/** 今日 00:00–24:00 统计卡片（仪表盘） */
export interface AdminTodayStats {
  /** USDT 账户余额 */
  usdtAccountBalance: number
  /** 与余额一致的总账户金额（展示用） */
  totalAccountAmount: number
  /** 充值金额 */
  depositAmountToday: number
  /** 提现金额 */
  withdrawAmountToday: number
  /** 收益（可为负） */
  earningsToday: number
  /** 新增用户 */
  newUsersToday: number
  /** 今日充值人数 */
  depositUsersToday: number
  /** 总用户数 */
  totalUsers: number
}

/** 待处理提醒角标 */
export interface AdminPendingReminders {
  depositOrders: number
  withdrawOrders: number
  kycBasic: number
  kycAdvanced: number
}

export interface AdminDashboardPayload {
  stats: AdminDashboardStats
  announcements: AdminAnnouncementBrief[]
  /** 今日数据统计 */
  todayStats: AdminTodayStats
  /** 待处理提醒 */
  pendingReminders: AdminPendingReminders
}

/** 列表分页请求占位 */
export interface AdminPageQuery {
  page: number
  pageSize: number
  keyword?: string
}

export interface AdminPageResult<T> {
  list: T[]
  total: number
}
