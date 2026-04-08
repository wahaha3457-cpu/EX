import type { AnnounceCenterItem, AnnounceCategory } from '@/types/supportHub'

const PARA = (lines: string[]) => lines

export const ANNOUNCE_SEED: AnnounceCenterItem[] = [
  {
    id: '1',
    title: '关于 USDT 本位永续合约保证金档位调整公告',
    category: 'RISK',
    publishedAt: '2026-03-28T10:00:00+08:00',
    pinned: true,
    summary: '为提升市场稳定性，平台将调整部分合约档位起始保证金率，详见正文。',
    paragraphs: PARA([
      '尊敬的用户：',
      '为进一步提升市场稳定性与风险控制能力，平台将于 2026-04-01 00:00 (UTC+8) 起，调整 USDT 本位永续合约部分档位的起始保证金率与维持保证金率。',
      '调整范围仅影响新开仓与加仓；已有仓位在规则生效后的维持保证金要求以页面展示为准。请您在交易前仔细阅读合约规则并合理控制杠杆。',
      '如有疑问，请联系在线客服或提交工单。感谢您的理解与支持。',
    ]),
  },
  {
    id: '2',
    title: '新用户交易赛：完成首笔现货委托即参与瓜分',
    category: 'ACTIVITY',
    publishedAt: '2026-03-27T14:30:00+08:00',
    summary: '活动期间完成身份认证与首笔现货委托即可参与，奖励以 USDT 形式发放（演示）。',
    paragraphs: PARA([
      '活动说明：本则与「活动中心」联动展示，完整任务与奖励规则请以活动页为准。',
      '参与条件：完成注册、KYC、并在活动期间完成一笔现货市价或限价成交。',
      '风险提示：数字资产交易存在高风险，请您根据自身情况谨慎参与。',
    ]),
  },
  {
    id: '3',
    title: '钱包服务升级预告：3 月 30 日 02:00–04:00 (UTC+8)',
    category: 'MAINTENANCE',
    publishedAt: '2026-03-26T09:00:00+08:00',
    pinned: true,
    summary: '升级期间充值、提现将短暂暂停，现货与合约交易不受影响。',
    paragraphs: PARA([
      '为提升充提速度与链上监控能力，平台计划于 2026-03-30 02:00–04:00 (UTC+8) 进行钱包服务升级。',
      '影响范围：链上充值与提现可能出现 5–30 分钟延迟；站内划转与交易不受影响。',
      '请勿在维护窗口前后重复发起同一笔链上提现，以免造成拥堵。维护结束后系统将自动恢复。',
    ]),
  },
  {
    id: '4',
    title: '现货 VIP 阶梯费率与 API 限频规则说明',
    category: 'SYSTEM',
    publishedAt: '2026-03-25T16:00:00+08:00',
    summary: '说明近 30 日交易量统计口径、VIP 升降级与 API 限频策略（演示）。',
    paragraphs: PARA([
      'VIP 等级依据近 30 日现货与合约折合交易量滚动统计，每日 UTC+8 02:00 更新。',
      'API 限频按账户维度与接口维度叠加计算，超出限制将返回 429，请合理设置重试与退避策略。',
      '做市商与机构用户可申请专属费率，请联系商务或提交工单咨询。',
    ]),
  },
  {
    id: 'ann-5',
    title: '上线 ARB、OP 等 Layer2 生态现货交易对',
    category: 'LISTING',
    publishedAt: '2026-03-24T11:20:00+08:00',
    summary: '新增多组 USDT 现货交易对，开盘集合竞价规则以市场页公告为准。',
    paragraphs: PARA([
      '平台已上线 ARB/USDT、OP/USDT 等交易对，具体开盘时间与最小价格精度请见行情页。',
      '新币波动较大，请注意仓位管理与滑点风险。',
    ]),
  },
  {
    id: 'ann-6',
    title: '关于防范钓鱼网站与假冒客服的重要提醒',
    category: 'OTHER',
    publishedAt: '2026-03-22T08:00:00+08:00',
    summary: '请勿向任何「客服」透露验证码、密码或私钥；官方不会致电索要资金密码。',
    paragraphs: PARA([
      '请仅通过官网与官方 App 登录账户，勿点击来源不明的链接。',
      '平台客服不会以任何理由索要您的短信验证码、谷歌验证码或私钥助记词。',
      '发现可疑行为请立即修改密码并联系官方渠道核实。',
    ]),
  },
]

export const ANNOUNCE_CATEGORY_LABEL: Record<AnnounceCategory, string> = {
  SYSTEM: '系统',
  MAINTENANCE: '维护',
  LISTING: '上新',
  ACTIVITY: '活动',
  RISK: '风控',
  OTHER: '其他',
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

export async function fetchAnnounceList(): Promise<AnnounceCenterItem[]> {
  await delay(120)
  return [...ANNOUNCE_SEED].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1
    if (!a.pinned && b.pinned) return 1
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  })
}

export async function fetchAnnounceDetail(id: string): Promise<AnnounceCenterItem | null> {
  await delay(80)
  return ANNOUNCE_SEED.find((x) => x.id === id) ?? null
}
