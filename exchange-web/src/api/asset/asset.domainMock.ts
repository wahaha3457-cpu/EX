import type { AssetsCenterPayload } from '@/types/assetsCenter'

type OverviewRow = AssetsCenterPayload['balances']['overview'][0]

function roundN(n: number, dp = 2) {
  const f = 10 ** dp
  return Math.round(n * f) / f
}

function scaleBalanceRows(rows: OverviewRow[], factor: number): OverviewRow[] {
  return rows.map((r) => ({
    ...r,
    total: Math.round(r.total * factor * 100) / 100,
    available: Math.round(r.available * factor * 100) / 100,
    frozen: Math.round(r.frozen * factor * 100) / 100,
    marginOccupied:
      r.marginOccupied == null ? null : Math.round(r.marginOccupied * factor * 100) / 100,
    valueUsdt: Math.round(r.valueUsdt * factor * 100) / 100,
  }))
}

/** 管理员 Mock：在默认资产上乘以系数，便于资金类页面测试 */
export function getAssetsCenterAdminDomainMock(): AssetsCenterPayload {
  const factor = 2500
  const base = getAssetsCenterDomainMock()
  const overview = scaleBalanceRows(base.balances.overview, factor)
  const spot = scaleBalanceRows(base.balances.spot, factor)
  const futures = scaleBalanceRows(base.balances.futures, factor)
  const funding = scaleBalanceRows(base.balances.funding, factor)
  const nftEst = roundN(base.overview.nftEstimatedUsdt * factor, 2)
  const spotSum = roundN(spot.reduce((s, r) => s + r.valueUsdt, 0), 2)
  const futSum = roundN(futures.reduce((s, r) => s + r.valueUsdt, 0), 2)
  const fundSum = roundN(funding.reduce((s, r) => s + r.valueUsdt, 0), 2)
  const earnRaw = base.overview.distribution.find((d) => d.account === 'earn')?.valueUsdt ?? 0
  const earnVal = roundN(earnRaw * factor, 2)
  const totalUsdt = roundN(spotSum + futSum + fundSum + earnVal + nftEst, 2)
  return {
    ...base,
    overview: {
      ...base.overview,
      nftEstimatedUsdt: nftEst,
      nftHoldingsCount: base.overview.nftHoldingsCount,
      totalUsdt: totalUsdt,
      todayPnlUsdt: base.overview.todayPnlUsdt,
      todayPnlPct: base.overview.todayPnlPct,
      distribution: [
        { account: 'spot', label: '现货', ratio: totalUsdt ? spotSum / totalUsdt : 0, valueUsdt: spotSum },
        { account: 'futures', label: '合约', ratio: totalUsdt ? futSum / totalUsdt : 0, valueUsdt: futSum },
        { account: 'funding', label: '资金', ratio: totalUsdt ? fundSum / totalUsdt : 0, valueUsdt: fundSum },
        { account: 'earn', label: '理财', ratio: totalUsdt ? earnVal / totalUsdt : 0, valueUsdt: earnVal },
        { account: 'nft', label: 'NFT', ratio: totalUsdt ? nftEst / totalUsdt : 0, valueUsdt: nftEst },
      ],
    },
    balances: {
      overview,
      spot,
      futures,
      funding,
    },
  }
}

/** 与适配层解耦的域数据 mock（仅用于本地模拟「接口返回 Raw」前的金标准） */
export function getAssetsCenterDomainMock(): AssetsCenterPayload {
  const overviewRows: AssetsCenterPayload['balances']['overview'] = [
    {
      asset: 'USDT',
      total: 128_560.42,
      available: 98_200,
      frozen: 1200,
      marginOccupied: 29_160.42,
      valueUsdt: 128_560.42,
    },
    {
      asset: 'BTC',
      total: 2.15,
      available: 1.85,
      frozen: 0.1,
      marginOccupied: 0.2,
      valueUsdt: 154_320.5,
    },
    {
      asset: 'ETH',
      total: 48.6,
      available: 40,
      frozen: 2,
      marginOccupied: 6.6,
      valueUsdt: 98_400,
    },
    {
      asset: 'BNB',
      total: 120,
      available: 100,
      frozen: 20,
      marginOccupied: null,
      valueUsdt: 42_000,
    },
  ]

  const spot: AssetsCenterPayload['balances']['spot'] = [
    {
      asset: 'USDT',
      total: 85_000,
      available: 82_000,
      frozen: 3_000,
      marginOccupied: null,
      valueUsdt: 85_000,
    },
    {
      asset: 'BTC',
      total: 1.2,
      available: 1.1,
      frozen: 0.1,
      marginOccupied: null,
      valueUsdt: 86_200,
    },
    {
      asset: 'ETH',
      total: 25,
      available: 24,
      frozen: 1,
      marginOccupied: null,
      valueUsdt: 50_500,
    },
  ]

  const futures: AssetsCenterPayload['balances']['futures'] = [
    {
      asset: 'USDT',
      total: 29_160.42,
      available: 12_000,
      frozen: 800,
      marginOccupied: 16_360.42,
      valueUsdt: 29_160.42,
    },
    {
      asset: 'BTC',
      total: 0.95,
      available: 0.75,
      frozen: 0,
      marginOccupied: 0.2,
      valueUsdt: 68_120,
    },
  ]

  const funding: AssetsCenterPayload['balances']['funding'] = [
    {
      asset: 'USDT',
      total: 14_400,
      available: 14_400,
      frozen: 0,
      marginOccupied: null,
      valueUsdt: 14_400,
    },
    {
      asset: 'USDC',
      total: 5_000,
      available: 5_000,
      frozen: 0,
      marginOccupied: null,
      valueUsdt: 5_000,
    },
  ]

  const spotSum = roundN(spot.reduce((s, r) => s + r.valueUsdt, 0), 2)
  const futSum = roundN(futures.reduce((s, r) => s + r.valueUsdt, 0), 2)
  const fundSum = roundN(funding.reduce((s, r) => s + r.valueUsdt, 0), 2)
  const earnVal = 21164.05
  const nftEstimatedUsdt = 1018.5
  const nftHoldingsCount = 2
  const totalUsdt = roundN(spotSum + futSum + fundSum + earnVal + nftEstimatedUsdt, 2)

  return {
    overview: {
      totalUsdt,
      todayPnlUsdt: 1240.55,
      todayPnlPct: 0.42,
      nftEstimatedUsdt,
      nftHoldingsCount,
      distribution: [
        { account: 'spot', label: '现货', ratio: totalUsdt ? spotSum / totalUsdt : 0, valueUsdt: spotSum },
        { account: 'futures', label: '合约', ratio: totalUsdt ? futSum / totalUsdt : 0, valueUsdt: futSum },
        { account: 'funding', label: '资金', ratio: totalUsdt ? fundSum / totalUsdt : 0, valueUsdt: fundSum },
        { account: 'earn', label: '理财', ratio: totalUsdt ? earnVal / totalUsdt : 0, valueUsdt: earnVal },
        { account: 'nft', label: 'NFT', ratio: totalUsdt ? nftEstimatedUsdt / totalUsdt : 0, valueUsdt: nftEstimatedUsdt },
      ],
    },
    balances: {
      overview: overviewRows,
      spot,
      futures,
      funding,
    },
    records: {
      ledger: [
        {
          id: 'L1',
          time: new Date(Date.now() - 3600_000).toISOString(),
          type: 'TRADE',
          asset: 'BTC',
          amount: -0.001,
          balanceAfter: 1.199,
          remark: '现货卖出 BTC/USDT',
        },
        {
          id: 'L2',
          time: new Date(Date.now() - 7200_000).toISOString(),
          type: 'TRANSFER',
          asset: 'USDT',
          amount: 5000,
          balanceAfter: 85_000,
          remark: '资金账户 → 现货账户',
        },
        {
          id: 'L3',
          time: new Date(Date.now() - 86400_000).toISOString(),
          type: 'FUNDING',
          asset: 'USDT',
          amount: -12.34,
          balanceAfter: null,
          remark: '永续资金费',
        },
      ],
      deposits: [
        {
          id: 'D1',
          time: new Date(Date.now() - 5000_000).toISOString(),
          asset: 'USDT',
          amount: 10_000,
          status: 'SUCCESS',
          txId: '0xabc…f21',
          network: 'TRC20',
        },
        {
          id: 'D2',
          time: new Date(Date.now() - 172800_000).toISOString(),
          asset: 'ETH',
          amount: 2.5,
          status: 'CONFIRMING',
          txId: '0xdef…88a',
          network: 'ERC20',
        },
      ],
      withdraws: [
        {
          id: 'W1',
          time: new Date(Date.now() - 2500_000).toISOString(),
          asset: 'USDT',
          amount: 3000,
          fee: 1,
          status: 'SUCCESS',
          address: 'TXyz…9ab',
          network: 'TRC20',
        },
      ],
      transfers: [
        {
          id: 'T1',
          time: new Date(Date.now() - 4000_000).toISOString(),
          from: 'funding',
          to: 'spot',
          asset: 'USDT',
          amount: 8000,
          status: 'SUCCESS',
        },
        {
          id: 'T2',
          time: new Date(Date.now() - 9000_000).toISOString(),
          from: 'spot',
          to: 'futures',
          asset: 'USDT',
          amount: 5000,
          status: 'SUCCESS',
        },
      ],
    },
  }
}
