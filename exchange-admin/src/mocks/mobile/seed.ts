import type { DemoInboxItem, Merchant, ServiceListing, TaskItem } from '@/types/mobileDemo'

export const SEED_MERCHANTS: Merchant[] = [
  {
    id: 'm1',
    name: 'LedgerPro',
    priceCny: 7.232,
    limitMin: 500,
    limitMax: 50000,
    completionRate: 99.6,
    payMethods: ['银行卡', '支付宝'],
    responseNote: '通常 3 分钟内响应',
  },
  {
    id: 'm2',
    name: 'NovaOTC',
    priceCny: 7.229,
    limitMin: 1000,
    limitMax: 200000,
    completionRate: 99.2,
    payMethods: ['银行卡', '微信'],
    responseNote: '工作时段即时接单',
  },
  {
    id: 'm3',
    name: 'KiteFlow',
    priceCny: 7.241,
    limitMin: 200,
    limitMax: 20000,
    completionRate: 98.8,
    payMethods: ['支付宝'],
    responseNote: '夜间在线',
  },
]

const DEMO_USER = 'demo-user'

export const SEED_TASKS: TaskItem[] = [
  {
    id: 't_seed_1',
    title: 'SaaS 控制台信息架构 + 高保真界面',
    category: '设计',
    description: '需交付 Figma 与组件说明，2 轮修改。',
    rewardUsdt: 2800,
    deadline: '2026-04-20',
    needEscrow: true,
    status: 'open',
    publisherId: 'other_1',
    attachmentNames: [],
  },
  {
    id: 't_seed_2',
    title: '白皮书节选 · 中译英（金融合规术语）',
    category: '翻译',
    description: '约 8000 字，附术语表。',
    rewardUsdt: 960,
    deadline: '灵活',
    needEscrow: true,
    status: 'open',
    publisherId: 'other_2',
    attachmentNames: [],
  },
  {
    id: 't_seed_3',
    title: '跨境收款架构咨询（60 分钟）',
    category: '咨询',
    description: '含会前问卷与会议纪要。',
    rewardUsdt: 350,
    deadline: '预约制',
    needEscrow: false,
    status: 'open',
    publisherId: 'other_3',
    attachmentNames: [],
  },
]

export { DEMO_USER }

export const SEED_SERVICES: ServiceListing[] = (() => {
  const t = Date.now()
  return [
    {
      id: 'sv_seed_1',
      title: '交易终端深色主题 · Figma 组件库',
      category: '设计',
      description: '含订单区、资产卡、行情条等 40+ 组件，可商用授权（演示文案）。',
      priceUsdt: 680,
      sellerId: 'other_1',
      sellerName: 'North Studio',
      createdAt: t - 3600000,
    },
    {
      id: 'sv_seed_2',
      title: 'OTC 风控规则表模板（Notion + Sheets）',
      category: '咨询',
      description: '限额、KYC 分级、争议处理 checklist，可二次修改。',
      priceUsdt: 120,
      sellerId: 'other_2',
      sellerName: 'RiskDesk',
      createdAt: t - 86400000 * 2,
    },
  ]
})()

export const SEED_INBOX: DemoInboxItem[] = (() => {
  const t = Date.now()
  return [
    {
      id: 'n_seed_1',
      title: '系统 · 欢迎使用演示环境',
      preview: '数据仅存于本机浏览器，可随时在设置或资产页重置。',
      body: '本应用为高保真前端演示：USDT 余额、订单、任务与托管均在 Pinia + localStorage 中模拟。正式环境需对接后端与风控。',
      at: t - 7200000,
      read: false,
      linkType: 'none',
    },
    {
      id: 'n_seed_2',
      title: '安全提醒 · OTC 交易',
      preview: '切勿脱离平台私下转账；确认收款账户实名一致。',
      body: '买入/卖出请仅在订单详情内按指引付款或确认收款。若对方要求站外沟通，请拒绝并举报（演示文案）。',
      at: t - 86400000,
      read: true,
      linkType: 'assets',
    },
    {
      id: 'n_seed_3',
      title: '任务市场已更新',
      preview: '新一批托管任务上线，可在「市场 · 任务」查看。',
      body: '推荐您优先选择开启托管的任务，赏金由平台锁定，验收后自动结算给承接方。',
      at: t - 172800000,
      read: true,
      linkType: 'none',
    },
  ]
})()

export function initialLedger(): import('@/types/mobileDemo').LedgerRow[] {
  const t = Date.now()
  return [
    {
      id: 'l1',
      kind: 'task_in',
      title: '任务赏金到账',
      amountUsdt: 120,
      at: t - 86400000,
      status: '已完成',
    },
    {
      id: 'l2',
      kind: 'otc_buy',
      title: '买入 USDT · 已成交',
      amountUsdt: 2000,
      at: t - 172800000,
      status: '已完成',
    },
  ]
}
