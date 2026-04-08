import type { SupportFaqCategory, SupportFaqItem, SupportTicketItem } from '@/types/supportHub'

export const FAQ_CATEGORIES: SupportFaqCategory[] = [
  { id: 'acct', name: '账户与安全' },
  { id: 'deposit', name: '充值与提现' },
  { id: 'trade', name: '交易与订单' },
  { id: 'api', name: 'API 与开发者' },
]

export const FAQ_SEED: SupportFaqItem[] = [
  {
    id: 'faq-1',
    categoryId: 'acct',
    question: '如何开启谷歌验证（2FA）？',
    answer:
      '登录后在「用户中心 - 安全设置」绑定谷歌验证器。请妥善备份密钥；开启后提现将强制校验 2FA。若手机丢失请联系客服冻结账户后按流程重置。',
    hot: true,
  },
  {
    id: 'faq-2',
    categoryId: 'acct',
    question: '忘记登录密码怎么办？',
    answer: '在登录页选择「忘记密码」，通过注册邮箱或手机完成验证后重置。若无法收验证码，请提交工单并准备身份证明材料。',
    hot: true,
  },
  {
    id: 'faq-3',
    categoryId: 'deposit',
    question: '链上充值多久到账？',
    answer:
      '到账时间取决于区块链网络确认数。USDT-TRC20 通常数分钟内；BTC/ETH 在网络拥堵时可能延长。可在「资产 - 充值记录」查看进度。',
  },
  {
    id: 'faq-4',
    categoryId: 'deposit',
    question: '提现已提交但长时间未到账？',
    answer:
      '请先确认链上 TxID 是否已有确认；若链上已成功而站内未入账，请提交工单并附上 TxID、币种与网络类型，客服将为您核对。',
  },
  {
    id: 'faq-5',
    categoryId: 'trade',
    question: '市价单与限价单有什么区别？',
    answer: '市价单按当前对手盘立即成交，存在滑点；限价单按您指定价格挂单，不保证一定成交。合约下单前请留意杠杆与强平价。',
    hot: true,
  },
  {
    id: 'faq-6',
    categoryId: 'trade',
    question: '为什么委托显示「已拒绝」？',
    answer: '常见原因：余额不足、超出单笔限额、触发风控规则或交易对维护。请查看订单详情错误码或联系在线客服。',
  },
  {
    id: 'faq-7',
    categoryId: 'api',
    question: 'API Key 泄露了怎么办？',
    answer: '请立即在「API 管理」删除泄露的 Key 并重新创建；检查近期 IP 白名单与权限设置。切勿在代码仓库或公开场合明文保存 Secret。',
  },
]

export const TICKET_SEED: SupportTicketItem[] = [
  {
    id: 'tk-demo-1',
    subject: '咨询 USDT 提现手续费规则',
    categoryId: 'deposit',
    status: 'RESOLVED',
    updatedAt: '2026-03-26T15:20:00+08:00',
    preview: '感谢您的咨询，当前各链手续费以提现场展示为准…',
  },
  {
    id: 'tk-demo-2',
    subject: 'API 返回 429 限频',
    categoryId: 'api',
    status: 'PENDING',
    updatedAt: '2026-03-28T09:10:00+08:00',
    preview: '技术已查看日志，建议将轮询间隔调整为…',
  },
]

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

export async function fetchSupportFaq(): Promise<{ categories: SupportFaqCategory[]; faqs: SupportFaqItem[] }> {
  await delay(90)
  return {
    categories: [...FAQ_CATEGORIES],
    faqs: FAQ_SEED.map((x) => ({ ...x })),
  }
}

export async function fetchSupportTickets(): Promise<SupportTicketItem[]> {
  await delay(90)
  return TICKET_SEED.map((x) => ({ ...x }))
}
