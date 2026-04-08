import type { FundHistoryEntry, FundPosition, FundProduct } from '@/types/financeEarn'

export const FUND_PRODUCTS: FundProduct[] = [
  {
    id: 'flex-usdt',
    name: 'USDT 活期宝',
    asset: 'USDT',
    kind: 'FLEXIBLE',
    apyPct: 4.2,
    durationDays: null,
    minAmount: 10,
    maxPerUser: 500_000,
    redeemRule: '随时赎回，T+0 到账（演示）',
    riskTag: 'LOW',
  },
  {
    id: 'fix-30-usdt',
    name: 'USDT 定期 30 天',
    asset: 'USDT',
    kind: 'FIXED',
    apyPct: 7.5,
    durationDays: 30,
    minAmount: 100,
    maxPerUser: 1_000_000,
    redeemRule: '锁定期内不可提前赎回；到期本息自动赎回至资金账户',
    riskTag: 'LOW',
  },
  {
    id: 'fix-90-usdt',
    name: 'USDT 定期 90 天',
    asset: 'USDT',
    kind: 'FIXED',
    apyPct: 9.8,
    durationDays: 90,
    minAmount: 500,
    maxPerUser: 2_000_000,
    redeemRule: '锁定期内不可提前赎回；支持到期自动续投（可关闭）',
    riskTag: 'MEDIUM',
  },
]

export function mockInitialFundPositions(): FundPosition[] {
  const t = new Date()
  const sub = new Date(t.getTime() - 5 * 86400000).toISOString()
  return [
    {
      id: 'fp-1',
      productId: 'flex-usdt',
      amount: 2500,
      accruedInterest: 1.42,
      subscribedAt: sub,
      maturityAt: null,
      autoRenew: false,
    },
  ]
}

export function mockInitialFundHistory(): FundHistoryEntry[] {
  const t = Date.now()
  return [
    {
      id: 'fh-seed-1',
      time: new Date(t - 45 * 86400000).toISOString(),
      kind: 'SUBSCRIBE',
      productId: 'fix-30-usdt',
      amountUsdt: 5000,
      note: '定期申购',
    },
    {
      id: 'fh-seed-2',
      time: new Date(t - 18 * 86400000).toISOString(),
      kind: 'REDEEM',
      productId: 'flex-usdt',
      amountUsdt: 800,
      note: '活期赎回',
    },
    {
      id: 'fh-seed-3',
      time: new Date(t - 3 * 86400000).toISOString(),
      kind: 'RENEW_TOGGLE',
      productId: 'fix-90-usdt',
      amountUsdt: 0,
      note: '关闭到期自动续投',
    },
  ]
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

export async function fetchFundCatalog(): Promise<{
  products: FundProduct[]
  positions: FundPosition[]
  history: FundHistoryEntry[]
}> {
  await delay(120)
  return {
    products: [...FUND_PRODUCTS],
    positions: mockInitialFundPositions(),
    history: mockInitialFundHistory(),
  }
}
