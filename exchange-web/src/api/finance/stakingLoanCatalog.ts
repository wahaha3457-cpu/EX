import type { StakingCollateralAsset, StakingLedgerEntry, StakingLoanPosition } from '@/types/financeCredit'

export const STAKING_COLLATERALS: StakingCollateralAsset[] = [
  {
    id: 'col-btc',
    symbol: 'BTC',
    walletBalance: 0.42,
    lockedAmount: 0.08,
    maxInitialLtvPct: 65,
    liquidationLtvPct: 85,
    dailyBorrowRatePct: 0.002,
  },
  {
    id: 'col-eth',
    symbol: 'ETH',
    walletBalance: 3.2,
    lockedAmount: 0,
    maxInitialLtvPct: 65,
    liquidationLtvPct: 85,
    dailyBorrowRatePct: 0.0025,
  },
]

export function mockInitialStakingPositions(): StakingLoanPosition[] {
  const now = Date.now()
  return [
    {
      id: 'sp-1',
      collateralAsset: 'BTC',
      collateralAmount: 0.08,
      borrowedUsdt: 18_200,
      accruedInterestUsdt: 24.5,
      currentLtvPct: 52,
      openedAt: new Date(now - 20 * 86400000).toISOString(),
    },
  ]
}

export function mockInitialStakingLedger(): StakingLedgerEntry[] {
  const t = Date.now()
  return [
    {
      id: 'sl-seed-1',
      time: new Date(t - 60 * 86400000).toISOString(),
      kind: 'BORROW',
      summary: 'BTC 质押 0.05 · 借入 9,200 USDT',
    },
    {
      id: 'sl-seed-2',
      time: new Date(t - 35 * 86400000).toISOString(),
      kind: 'REPAY',
      summary: '部分还款 3,000 USDT（本+息）',
    },
    {
      id: 'sl-seed-3',
      time: new Date(t - 32 * 86400000).toISOString(),
      kind: 'CLOSED',
      summary: '仓位已结清 · 质押物 0.05 BTC 已退回钱包',
    },
  ]
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

export async function fetchStakingLoanCatalog(): Promise<{
  collaterals: StakingCollateralAsset[]
  positions: StakingLoanPosition[]
  ledger: StakingLedgerEntry[]
}> {
  await delay(100)
  return {
    collaterals: STAKING_COLLATERALS.map((c) => ({ ...c })),
    positions: mockInitialStakingPositions(),
    ledger: mockInitialStakingLedger(),
  }
}
