import type { Component } from 'vue'
import {
  Odometer,
  User,
  Coin,
  Guide,
  Connection,
  Document,
  Wallet,
  Bell,
  Key,
  Memo,
  Trophy,
  Money,
  TrendCharts,
  SetUp,
  Tools,
  Search,
  Setting,
  DataLine,
  EditPen,
  Sort,
  Cpu,
  Operation,
  Top,
  Bottom,
} from '@element-plus/icons-vue'
import { adminPath } from '@/utils/adminPublicPath'

export interface AdminMenuNode {
  /** 唯一键，用于 SubMenu index */
  key: string
  /** 叶子节点路由；分组节点可省略 */
  path?: string
  title: string
  icon?: Component
  /** 子级角标（待办数量等） */
  badge?: number
  /** 二级分组标题角标（常用功能列表 · 财务 汇总等） */
  groupBadge?: number
  /** 常用功能列表：侧栏高亮样式（淡紫分组 + 白字三级） */
  quickAccess?: boolean
  children?: AdminMenuNode[]
}

const ADMIN_SIDEBAR_DASHBOARD_KEY = 'dashboard'

/** 侧栏顺序：仪表盘固定置顶；其余含子路由的分组在上，仅一级路由的叶子在下；同组内保持配置顺序 */
function sortAdminSidebarEntries(nodes: AdminMenuNode[]): AdminMenuNode[] {
  const dashboard = nodes.find((n) => n.key === ADMIN_SIDEBAR_DASHBOARD_KEY)
  const rest = nodes.filter((n) => n.key !== ADMIN_SIDEBAR_DASHBOARD_KEY)
  const sortedRest = [...rest].sort((a, b) => {
    const aBranch = !!(a.children?.length)
    const bBranch = !!(b.children?.length)
    if (aBranch === bBranch) return 0
    return aBranch ? -1 : 1
  })
  return dashboard ? [dashboard, ...sortedRest] : sortedRest
}

const ADMIN_MENU_ENTRIES: AdminMenuNode[] = [
  { key: 'dashboard', path: adminPath('/dashboard'), title: '仪表盘', icon: Odometer },
  {
    key: 'common-quick',
    title: '常用功能列表',
    icon: Guide,
    quickAccess: true,
    children: [
      {
        key: 'quick-mgmt',
        title: '管理',
        children: [
          { key: 'q-general-query', path: adminPath('/quick/mgmt/general-query'), title: '综合查询', icon: Search },
          { key: 'q-basic-profiles', path: adminPath('/users/basic-profiles'), title: '用户基础管理', icon: Setting },
          { key: 'q-user-list', path: adminPath('/users/list'), title: '用户管理', icon: User },
          { key: 'q-market', path: adminPath('/config/market/overview'), title: '行情管理', icon: TrendCharts },
          { key: 'q-ledger', path: adminPath('/system/logs/account-ledger'), title: '账变记录', icon: Document },
        ],
      },
      {
        key: 'quick-contract',
        title: '合约',
        children: [
          { key: 'q-perp-pos', path: adminPath('/orders/contract/perpetual-orders'), title: '永续持仓单', icon: DataLine },
          { key: 'q-perp-entrust', path: adminPath('/orders/contract/perpetual-entrust'), title: '永续委托单', icon: EditPen },
          { key: 'q-del-orders', path: adminPath('/orders/contract/delivery-orders'), title: '交割合约单', icon: Sort },
          { key: 'q-del-venue', path: adminPath('/orders/contract/delivery-venue-settings'), title: '交割场控设置', icon: Tools },
        ],
      },
      {
        key: 'quick-spot',
        title: '币币',
        children: [
          { key: 'q-spot-orders', path: adminPath('/orders/spot'), title: '币币交易单', icon: Coin },
        ],
      },
      {
        key: 'quick-wealth',
        title: '财富',
        children: [
          { key: 'q-fin-earn', path: adminPath('/orders/finance/miner'), title: '理财订单', icon: Wallet },
          { key: 'q-fin-miner', path: adminPath('/orders/finance/smart-miner'), title: '矿机订单', icon: Cpu },
          { key: 'q-fin-bots', path: adminPath('/orders/finance/bots'), title: '交易机器人订单', icon: Operation },
          { key: 'q-fin-lending', path: adminPath('/orders/lending'), title: '质押借币订单', icon: Money },
        ],
      },
      {
        key: 'quick-finance',
        title: '财务',
        groupBadge: 414,
        children: [
          { key: 'q-f-withdraw', path: adminPath('/finance-mgmt/withdrawals'), title: '提现订单', icon: Top, badge: 412 },
          { key: 'q-f-deposit', path: adminPath('/finance-mgmt/deposits'), title: '充值订单', icon: Bottom, badge: 2 },
        ],
      },
    ],
  },
  {
    key: 'users',
    title: '用户管理',
    icon: User,
    children: [
      { key: 'users-agents', path: adminPath('/users/agents'), title: '代理商' },
      { key: 'users-referrals', path: adminPath('/users/referrals'), title: '推荐关系' },
      {
        key: 'users-kyc-basic',
        path: adminPath('/users/kyc-basic'),
        title: '用户基础认证',
        badge: 3,
      },
      { key: 'users-kyc-c2c', path: adminPath('/users/kyc-c2c'), title: '用户C2C认证' },
      { key: 'users-kyc-advanced', path: adminPath('/users/kyc-advanced'), title: '用户高级认证' },
      { key: 'users-manual-reset', path: adminPath('/users/manual-reset'), title: '人工重置管理' },
      { key: 'users-basic-profiles', path: adminPath('/users/basic-profiles'), title: '用户基础管理' },
      { key: 'users-list', path: adminPath('/users/list'), title: '用户管理' },
      { key: 'users-contacts', path: adminPath('/users/contacts'), title: '用户通讯录' },
    ],
  },
  { key: 'currencies', path: adminPath('/currencies'), title: '币种管理', icon: Coin },
  { key: 'symbols', path: adminPath('/symbols'), title: '交易对管理', icon: Connection },
  {
    key: 'orders',
    title: '业务/订单管理',
    icon: Document,
    children: [
      {
        key: 'orders-c2c',
        title: 'C2C',
        children: [
          { key: 'orders-c2c-pay-templates', path: adminPath('/orders/c2c/payment-templates'), title: 'C2C支付方式模版' },
          { key: 'orders-c2c-pay-methods', path: adminPath('/orders/c2c/payment-methods'), title: 'C2C支付方式管理' },
          { key: 'orders-c2c-merchants', path: adminPath('/orders/c2c/merchants'), title: 'C2C承兑商管理' },
          { key: 'orders-c2c-ads', path: adminPath('/orders/c2c/ads-config'), title: 'C2C广告配置' },
          { key: 'orders-c2c-orders', path: adminPath('/orders/c2c/orders'), title: 'C2C订单' },
          { key: 'orders-c2c-appeals', path: adminPath('/orders/c2c/appeals'), title: 'C2C申诉' },
        ],
      },
      {
        key: 'orders-ico',
        title: 'ICO',
        children: [
          { key: 'orders-ico-products', path: adminPath('/orders/ico/products'), title: 'ICO产品配置' },
          { key: 'orders-ico-user-orders', path: adminPath('/orders/ico/user-orders'), title: 'ICO用户订单' },
        ],
      },
      { key: 'orders-spot', path: adminPath('/orders/spot'), title: '现货订单' },
      {
        key: 'orders-contract',
        title: '合约订单',
        children: [
          { key: 'orders-contract-perp-orders', path: adminPath('/orders/contract/perpetual-orders'), title: '永续合约单' },
          { key: 'orders-contract-perp-entrust', path: adminPath('/orders/contract/perpetual-entrust'), title: '永续委托单' },
          { key: 'orders-contract-del-orders', path: adminPath('/orders/contract/delivery-orders'), title: '交割合约单' },
          { key: 'orders-contract-del-venue', path: adminPath('/orders/contract/delivery-venue-settings'), title: '交割场控设置' },
          { key: 'orders-contract-del-global', path: adminPath('/orders/contract/delivery-global-venue'), title: '交割合约全局场控' },
          { key: 'orders-contract-del-team', path: adminPath('/orders/contract/delivery-team-venue'), title: '团队交割场控' },
          { key: 'orders-contract-del-copy', path: adminPath('/orders/contract/delivery-copy'), title: '交割跟单管理' },
        ],
      },
      {
        key: 'orders-finance',
        title: '理财订单',
        children: [
          { key: 'orders-finance-miner', path: adminPath('/orders/finance/miner'), title: '矿机理财' },
          { key: 'orders-finance-smart', path: adminPath('/orders/finance/smart-miner'), title: '智能矿机' },
          { key: 'orders-finance-bots', path: adminPath('/orders/finance/bots'), title: '交易机器人' },
        ],
      },
      { key: 'orders-nft', path: adminPath('/orders/nft'), title: 'NFT订单' },
      { key: 'orders-convert', path: adminPath('/orders/convert'), title: '闪兑订单' },
      { key: 'orders-staking', path: adminPath('/orders/staking'), title: '质押订单' },
      { key: 'orders-lending', path: adminPath('/orders/lending'), title: '借贷订单' },
      {
        key: 'orders-funding',
        title: '充提订单',
        children: [
          { key: 'orders-funding-in', path: adminPath('/orders/funding/deposit'), title: '充值订单' },
          { key: 'orders-funding-out', path: adminPath('/orders/funding/withdraw'), title: '提现订单' },
        ],
      },
    ],
  },
  { key: 'assets', path: adminPath('/assets'), title: '资产审核', icon: Wallet },
  { key: 'announcements', path: adminPath('/announcements'), title: '公告管理', icon: Bell },
  { key: 'rbac', path: adminPath('/rbac'), title: '权限管理', icon: Key },
  { key: 'logs', path: adminPath('/logs'), title: '系统日志', icon: Memo },
  { key: 'activities', path: adminPath('/activities'), title: '活动管理', icon: Trophy },
  {
    key: 'finance-mgmt',
    title: '财务管理',
    icon: Money,
    children: [
      { key: 'finance-deposits', path: adminPath('/finance-mgmt/deposits'), title: '充值订单' },
      { key: 'finance-withdrawals', path: adminPath('/finance-mgmt/withdrawals'), title: '提现订单' },
      { key: 'finance-chain-withdraw-addresses', path: adminPath('/finance-mgmt/chain/withdraw-addresses'), title: '区块链提现地址维护' },
      {
        key: 'finance-chain-personal-deposit-addresses',
        path: adminPath('/finance-mgmt/chain/personal-deposit-addresses'),
        title: '区块链个人充值地址维护',
      },
      {
        key: 'finance-chain-public-deposit-addresses',
        path: adminPath('/finance-mgmt/chain/public-deposit-addresses'),
        title: '区块链公共充值地址维护',
      },
      { key: 'finance-withdraw-limits', path: adminPath('/finance-mgmt/withdraw-limits'), title: '提现限额管理' },
    ],
  },
  {
    key: 'reports',
    title: '报表管理',
    /** 一级侧栏统一线型图标：折线趋势（避免 TrendCharts 偏实心块面） */
    icon: DataLine,
    children: [
      { key: 'reports-total-dw', path: adminPath('/reports/total-dw'), title: '总充提报表' },
      { key: 'reports-agent-dw', path: adminPath('/reports/agent-dw'), title: '代理商充提报表' },
      { key: 'reports-user-earnings', path: adminPath('/reports/user-earnings'), title: '用户收益报表' },
    ],
  },
  {
    key: 'config-center',
    title: '配置管理',
    icon: SetUp,
    children: [
      {
        key: 'config-market',
        title: '行情',
        children: [
          { key: 'config-market-overview', path: adminPath('/config/market/overview'), title: '行情管理' },
          { key: 'config-market-symbols', path: adminPath('/config/market/symbols'), title: '行情品种管理' },
        ],
      },
      {
        key: 'config-fx-rates',
        title: '汇率',
        children: [{ key: 'config-fx-settings', path: adminPath('/config/exchange-rates/settings'), title: '汇率配置' }],
      },
      {
        key: 'config-wealth',
        title: '财富',
        children: [
          { key: 'config-wealth-earn', path: adminPath('/config/wealth/earn'), title: '理财配置' },
          { key: 'config-wealth-miner', path: adminPath('/config/wealth/miner'), title: '矿机配置' },
          { key: 'config-wealth-bots', path: adminPath('/config/wealth/bots'), title: '交易机器人配置' },
          { key: 'config-wealth-lending', path: adminPath('/config/wealth/lending'), title: '借贷配置' },
          { key: 'config-wealth-team-withdraw', path: adminPath('/config/wealth/team-withdraw'), title: '团队提现配置' },
        ],
      },
      {
        key: 'config-contract',
        title: '合约',
        children: [
          { key: 'config-contract-perp', path: adminPath('/config/contract/perpetual'), title: '永续合约管理' },
          { key: 'config-contract-delivery', path: adminPath('/config/contract/delivery'), title: '交割合约管理' },
        ],
      },
      {
        key: 'config-content',
        title: '内容',
        children: [
          { key: 'config-content-client', path: adminPath('/config/content/client'), title: '用户端内容管理' },
          { key: 'config-content-news', path: adminPath('/config/content/news'), title: '新闻管理' },
          { key: 'config-content-banners', path: adminPath('/config/content/banners'), title: '横幅管理' },
        ],
      },
    ],
  },
  {
    key: 'system-mgmt',
    title: '系统管理',
    /** 一级侧栏统一线型图标：齿轮轮廓（避免 Tools 偏粗实心） */
    icon: Setting,
    children: [
      {
        key: 'system-mgmt-sys',
        title: '系统管理',
        children: [
          { key: 'system-sys-root-params', path: adminPath('/system/sys/root-params'), title: '系统参数(ROOT)' },
          { key: 'system-sys-params', path: adminPath('/system/sys/params'), title: '系统参数' },
          { key: 'system-sys-support', path: adminPath('/system/sys/support'), title: '客服管理' },
        ],
      },
      {
        key: 'system-mgmt-users',
        title: '系统用户',
        children: [
          { key: 'system-users-roles', path: adminPath('/system/users/roles'), title: '角色管理' },
          { key: 'system-users-list', path: adminPath('/system/users/list'), title: '系统用户管理' },
        ],
      },
      {
        key: 'system-mgmt-logs',
        title: '日志',
        children: [
          { key: 'system-logs-ledger', path: adminPath('/system/logs/account-ledger'), title: '账变记录' },
          { key: 'system-logs-ops', path: adminPath('/system/logs/operations'), title: '操作日志' },
          { key: 'system-logs-frontend', path: adminPath('/system/logs/frontend'), title: '前端日志' },
          { key: 'system-logs-verify', path: adminPath('/system/logs/verify-codes'), title: '验证码发送日志' },
        ],
      },
      {
        key: 'system-mgmt-ip',
        title: 'IP管理',
        children: [{ key: 'system-ip-list', path: adminPath('/system/ip/list'), title: 'IP列表' }],
      },
    ],
  },
]

export const ADMIN_MENU: AdminMenuNode[] = sortAdminSidebarEntries(ADMIN_MENU_ENTRIES)
