import type { LendingAssistPlan, LendingLoan } from '@/types/financeCredit'

export const LENDING_PLANS: LendingAssistPlan[] = [
  {
    id: 'la-7',
    name: '助力贷 · 7 天',
    termDays: 7,
    dailyRatePct: 0.05,
    minAmount: 500,
    maxAmount: 50_000,
    purposeHint: '短期周转，到期一次性还本付息（演示）',
  },
  {
    id: 'la-30',
    name: '助力贷 · 30 天',
    termDays: 30,
    dailyRatePct: 0.035,
    minAmount: 1000,
    maxAmount: 200_000,
    purposeHint: '经营/消费类助力额度，支持提前还款（演示）',
  },
  {
    id: 'la-90',
    name: '助力贷 · 90 天',
    termDays: 90,
    dailyRatePct: 0.028,
    minAmount: 5000,
    maxAmount: 500_000,
    purposeHint: '中长期资金规划，分期付息到期还本（演示）',
  },
]

export function mockInitialLendingLoans(): LendingLoan[] {
  const now = Date.now()
  return [
    {
      id: 'll-1',
      planId: 'la-30',
      principal: 8000,
      accruedInterest: 12.6,
      borrowedAt: new Date(now - 12 * 86400000).toISOString(),
      dueAt: new Date(now + 18 * 86400000).toISOString(),
      status: 'ACTIVE',
    },
    {
      id: 'll-0',
      planId: 'la-7',
      principal: 0,
      accruedInterest: 0,
      borrowedAt: new Date(now - 90 * 86400000).toISOString(),
      dueAt: new Date(now - 83 * 86400000).toISOString(),
      status: 'SETTLED',
    },
  ]
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

export async function fetchLendingCatalog(): Promise<{ plans: LendingAssistPlan[]; loans: LendingLoan[] }> {
  await delay(100)
  return { plans: [...LENDING_PLANS], loans: mockInitialLendingLoans() }
}
