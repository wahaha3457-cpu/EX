import type { ActivityCenterItem } from '@/types/supportHub'

export const ACTIVITY_SEED: ActivityCenterItem[] = [
  {
    id: '2',
    title: '新用户交易赛',
    subtitle: '完成首笔现货委托，瓜分 50,000 USDT 奖池',
    status: 'ONGOING',
    startAt: '2026-03-20T00:00:00+08:00',
    endAt: '2026-04-20T23:59:59+08:00',
    rewardHint: '最高单人 2,000 USDT（演示）',
    tone: 'gold',
    rules: [
      '完成高级认证（KYC）且在活动期间完成至少一笔现货成交。',
      '奖励按有效交易量加权随机瓜分，细则以活动页公示为准。',
      '禁止对敲、刷量等作弊行为，违者取消资格。',
    ],
  },
  {
    id: 'act-defi',
    title: '质押赚息加码周',
    subtitle: '指定理财产品额外 +0.3% 参考年化（演示）',
    status: 'ONGOING',
    startAt: '2026-03-25T00:00:00+08:00',
    endAt: '2026-04-01T23:59:59+08:00',
    rewardHint: '加息券自动发放至卡包',
    tone: 'violet',
    joined: true,
    rules: ['仅限活动页标注的指定产品；加息部分以实际到账为准。', '活动解释权归平台所有。'],
  },
  {
    id: 'act-futures',
    title: '合约交易量挑战',
    subtitle: '周交易量达标领抵扣金',
    status: 'UPCOMING',
    startAt: '2026-04-01T00:00:00+08:00',
    endAt: '2026-04-07T23:59:59+08:00',
    rewardHint: '最高 500 USDT 抵扣金',
    tone: 'cyan',
    rules: ['自然周内合约折合交易量达到指定档位即可领取对应奖励。', '每个账户仅可领取一次当周最高档奖励。'],
  },
  {
    id: 'act-ended',
    title: '春节红包雨（已结束）',
    subtitle: '完成分享任务领随机红包',
    status: 'ENDED',
    startAt: '2026-01-20T00:00:00+08:00',
    endAt: '2026-02-10T23:59:59+08:00',
    rewardHint: '活动已结算',
    tone: 'green',
    rules: ['本活动已结束，奖励发放完毕。'],
  },
]

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

export async function fetchActivityList(): Promise<ActivityCenterItem[]> {
  await delay(100)
  return ACTIVITY_SEED.map((x) => ({ ...x }))
}
