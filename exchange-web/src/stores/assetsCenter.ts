import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { fetchAssetsCenter } from '@/api/assetsCenter'
import { isExchangeSpotApiEnabled } from '@/config/env'
import { getAccessToken } from '@/utils/tokenStorage'
import type {
  AssetsAccountTab,
  AssetsBalanceRow,
  AssetsCenterPayload,
  AssetsLedgerRow,
  AssetsOverviewStats,
  AssetsRecordTab,
} from '@/types/assetsCenter'

const SMALL_USDT = 10

function uid(p: string) {
  return `${p}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function roundN(n: number, dp = 8) {
  const f = 10 ** dp
  return Math.round(n * f) / f
}

function findBalanceRow(rows: AssetsBalanceRow[], asset: string) {
  return rows.find((r) => r.asset === asset)
}

/** 由子账户合并总览与分布（演示调账后调用） */
function mergeOverviewBalances(p: AssetsCenterPayload) {
  const map = new Map<string, AssetsBalanceRow>()
  const take = (r: AssetsBalanceRow) => {
    const x = map.get(r.asset)
    if (!x) {
      map.set(r.asset, {
        asset: r.asset,
        total: r.total,
        available: r.available,
        frozen: r.frozen,
        marginOccupied: r.marginOccupied,
        valueUsdt: r.valueUsdt,
      })
    } else {
      x.total = roundN(x.total + r.total)
      x.available = roundN(x.available + r.available)
      x.frozen = roundN(x.frozen + r.frozen)
      const m1 = x.marginOccupied ?? 0
      const m2 = r.marginOccupied ?? 0
      x.marginOccupied = m1 + m2 !== 0 ? roundN(m1 + m2) : null
      x.valueUsdt = roundN(x.valueUsdt + r.valueUsdt, 2)
    }
  }
  p.balances.spot.forEach(take)
  p.balances.futures.forEach(take)
  p.balances.funding.forEach(take)
  p.balances.overview = Array.from(map.values()).sort((a, b) => b.valueUsdt - a.valueUsdt)

  const spotSum = roundN(p.balances.spot.reduce((s, r) => s + r.valueUsdt, 0), 2)
  const futSum = roundN(p.balances.futures.reduce((s, r) => s + r.valueUsdt, 0), 2)
  const fundSum = roundN(p.balances.funding.reduce((s, r) => s + r.valueUsdt, 0), 2)
  const earnSlice = p.overview.distribution.find((d) => d.account === 'earn')
  const earnVal = earnSlice?.valueUsdt ?? 0
  const nftVal = roundN(p.overview.nftEstimatedUsdt ?? 0, 2)
  const total = roundN(spotSum + futSum + fundSum + earnVal + nftVal, 2)
  p.overview.totalUsdt = total
  p.overview.nftEstimatedUsdt = nftVal
  p.overview.distribution = [
    { account: 'spot', label: '现货', ratio: total ? spotSum / total : 0, valueUsdt: spotSum },
    { account: 'futures', label: '合约', ratio: total ? futSum / total : 0, valueUsdt: futSum },
    { account: 'funding', label: '资金', ratio: total ? fundSum / total : 0, valueUsdt: fundSum },
    { account: 'earn', label: '理财', ratio: total ? earnVal / total : 0, valueUsdt: earnVal },
    { account: 'nft', label: 'NFT', ratio: total ? nftVal / total : 0, valueUsdt: nftVal },
  ]
}

export const useAssetsCenterStore = defineStore('assetsCenter', () => {
  const loading = ref(false)
  const loadError = ref<string | null>(null)
  const activeAccountTab = ref<AssetsAccountTab>('overview')
  const activeRecordTab = ref<AssetsRecordTab>('ledger')
  /** 隐藏折合低于阈值的资产（预留能力） */
  const hideSmallAssets = ref(false)
  /** 账户分布图（预留） */
  const showDistributionChart = ref(true)

  const payload = ref<AssetsCenterPayload | null>(null)

  const overview = computed<AssetsOverviewStats | null>(() => payload.value?.overview ?? null)

  const records = computed(() => payload.value?.records ?? null)

  const rawRowsForAccount = computed<AssetsBalanceRow[]>(() => {
    const p = payload.value
    if (!p) return []
    const { balances } = p
    switch (activeAccountTab.value) {
      case 'overview':
        return balances.overview
      case 'spot':
        return balances.spot
      case 'futures':
        return balances.futures
      case 'funding':
        return balances.funding
      case 'earn':
        return []
      case 'nft':
        return []
      default:
        return []
    }
  })

  const balanceRows = computed(() => {
    let rows = rawRowsForAccount.value
    if (hideSmallAssets.value) {
      rows = rows.filter((r) => r.valueUsdt >= SMALL_USDT)
    }
    return rows
  })

  const showMarginColumn = computed(() => activeAccountTab.value === 'futures')

  async function bootstrap(force = false) {
    if (payload.value && !force) return
    loading.value = true
    loadError.value = null
    try {
      payload.value = await fetchAssetsCenter()
      if (payload.value && isExchangeSpotApiEnabled() && getAccessToken()) {
        mergeOverviewBalances(payload.value)
      }
    } catch {
      loadError.value = '资产数据加载失败，请稍后重试'
    } finally {
      loading.value = false
    }
  }

  function requirePayload(): AssetsCenterPayload {
    const p = payload.value
    if (!p) throw new Error('Assets payload not loaded')
    return p
  }

  /**
   * 调整单账户单币种余额（演示）；正数增加、负数减少。
   * 稳定币 USDT/USDC 的 valueUsdt 与 total 对齐；其它币种按原 total/value 比例估算。
   */
  function adjustWalletBalance(
    account: 'spot' | 'futures' | 'funding',
    asset: string,
    deltaAvailable: number,
    deltaTotal: number,
  ) {
    const p = requirePayload()
    const rows = p.balances[account]
    let row = findBalanceRow(rows, asset)
    if (!row) {
      row = {
        asset,
        total: 0,
        available: 0,
        frozen: 0,
        marginOccupied: account === 'futures' ? 0 : null,
        valueUsdt: 0,
      }
      rows.push(row)
    }
    const prevTotal = row.total
    const prevVal = row.valueUsdt
    row.available = roundN(row.available + deltaAvailable)
    row.total = roundN(row.total + deltaTotal)
    if (row.available < -1e-12 || row.total < -1e-12) {
      row.available = Math.max(0, row.available)
      row.total = Math.max(0, row.total)
    }
    if (asset === 'USDT' || asset === 'USDC') {
      row.valueUsdt = roundN(row.total, 2)
    } else if (row.total > 0 && prevTotal > 0) {
      row.valueUsdt = roundN(row.total * (prevVal / prevTotal), 2)
    } else if (row.total > 0) {
      row.valueUsdt = roundN(row.total, 2)
    } else {
      row.valueUsdt = 0
    }
    mergeOverviewBalances(p)
  }

  /** C2C 演示：现货可用 → 冻结（卖出挂单） */
  function c2cSpotFreeze(asset: string, amount: number): boolean {
    const p = requirePayload()
    const row = findBalanceRow(p.balances.spot, asset)
    if (!row || row.available < amount - 1e-12) return false
    row.available = roundN(row.available - amount)
    row.frozen = roundN(row.frozen + amount)
    mergeOverviewBalances(p)
    return true
  }

  /** C2C 演示：冻结 → 可用（卖出取消） */
  function c2cSpotUnfreeze(asset: string, amount: number): boolean {
    const p = requirePayload()
    const row = findBalanceRow(p.balances.spot, asset)
    if (!row || row.frozen < amount - 1e-12) return false
    row.frozen = roundN(row.frozen - amount)
    row.available = roundN(row.available + amount)
    mergeOverviewBalances(p)
    return true
  }

  /** C2C 演示：从冻结划出成交（卖出完成） */
  function c2cSpotConsumeFrozen(asset: string, amount: number): boolean {
    const p = requirePayload()
    const row = findBalanceRow(p.balances.spot, asset)
    if (!row || row.frozen < amount - 1e-12) return false
    const prevTotal = row.total
    const prevVal = row.valueUsdt
    row.frozen = roundN(row.frozen - amount)
    row.total = roundN(row.total - amount)
    if (row.frozen < 0) row.frozen = 0
    if (row.total < 0) row.total = 0
    if (asset === 'USDT' || asset === 'USDC') {
      row.valueUsdt = roundN(row.total, 2)
    } else if (row.total > 0 && prevTotal > 0) {
      row.valueUsdt = roundN(row.total * (prevVal / prevTotal), 2)
    } else if (row.total > 0) {
      row.valueUsdt = roundN(row.total, 2)
    } else {
      row.valueUsdt = 0
    }
    mergeOverviewBalances(p)
    return true
  }

  function pushLedger(entry: Omit<AssetsLedgerRow, 'id' | 'time'> & { id?: string; time?: string }) {
    const p = requirePayload()
    p.records.ledger.unshift({
      id: entry.id ?? uid('L'),
      time: entry.time ?? new Date().toISOString(),
      type: entry.type,
      asset: entry.asset,
      amount: entry.amount,
      balanceAfter: entry.balanceAfter ?? null,
      remark: entry.remark,
    })
  }

  function applyDemoDeposit(asset: string, network: string, amount: number) {
    const p = requirePayload()
    if (amount <= 0) return
    adjustWalletBalance('spot', asset, amount, amount)
    const spot = findBalanceRow(p.balances.spot, asset)
    p.records.deposits.unshift({
      id: uid('D'),
      time: new Date().toISOString(),
      asset,
      amount,
      status: 'SUCCESS',
      txId: `0x${Math.random().toString(16).slice(2, 14)}…`,
      network,
    })
    pushLedger({
      type: 'OTHER',
      asset,
      amount,
      balanceAfter: spot?.available ?? null,
      remark: `链上充值 · ${network}（演示）`,
    })
  }

  function applyDemoWithdraw(
    asset: string,
    network: string,
    amount: number,
    fee: number,
    address: string,
    memo?: string | null,
  ) {
    const p = requirePayload()
    const deduct = amount + fee
    if (deduct <= 0) return
    adjustWalletBalance('spot', asset, -deduct, -deduct)
    const spot = findBalanceRow(p.balances.spot, asset)
    const m = memo?.trim()
    p.records.withdraws.unshift({
      id: uid('W'),
      time: new Date().toISOString(),
      asset,
      amount,
      fee,
      status: 'PENDING',
      address: address.slice(0, 10) + '…' + address.slice(-4),
      network,
      memo: m || undefined,
    })
    pushLedger({
      type: 'OTHER',
      asset,
      amount: -deduct,
      balanceAfter: spot?.available ?? null,
      remark: `提现申请 · ${network} · 手续费 ${fee} ${asset}${m ? ` · Tag ${m}` : ''}（演示）`,
    })
  }

  function applyDemoTransfer(
    from: 'spot' | 'futures' | 'funding',
    to: 'spot' | 'futures' | 'funding',
    asset: string,
    amount: number,
  ) {
    const p = requirePayload()
    if (amount <= 0 || from === to) return
    adjustWalletBalance(from, asset, -amount, -amount)
    adjustWalletBalance(to, asset, amount, amount)
    p.records.transfers.unshift({
      id: uid('T'),
      time: new Date().toISOString(),
      from,
      to,
      asset,
      amount,
      status: 'SUCCESS',
    })
    const labels: Record<string, string> = { spot: '现货', futures: '合约', funding: '资金' }
    pushLedger({
      type: 'TRANSFER',
      asset,
      amount: from === 'spot' ? -amount : amount,
      balanceAfter: null,
      remark: `${labels[from]} → ${labels[to]}（演示）`,
    })
  }

  function setAccountTab(tab: AssetsAccountTab) {
    activeAccountTab.value = tab
  }

  function setRecordTab(tab: AssetsRecordTab) {
    activeRecordTab.value = tab
  }

  function toggleHideSmall() {
    hideSmallAssets.value = !hideSmallAssets.value
  }

  return {
    loading,
    loadError,
    activeAccountTab,
    activeRecordTab,
    hideSmallAssets,
    showDistributionChart,
    payload,
    overview,
    records,
    balanceRows,
    showMarginColumn,
    bootstrap,
    setAccountTab,
    setRecordTab,
    toggleHideSmall,
    adjustWalletBalance,
    c2cSpotFreeze,
    c2cSpotUnfreeze,
    c2cSpotConsumeFrozen,
    pushLedger,
    applyDemoDeposit,
    applyDemoWithdraw,
    applyDemoTransfer,
  }
})
