import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { fetchStakingLoanCatalog, STAKING_COLLATERALS } from '@/api/finance/stakingLoanCatalog'
import type { StakingCollateralAsset, StakingLedgerEntry, StakingLoanPosition } from '@/types/financeCredit'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'

function uid(p: string) {
  return `${p}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

const INDEX_PRICE: Record<string, number> = {
  BTC: 98_500,
  ETH: 3450,
}

export const useStakingBorrowStore = defineStore('stakingBorrow', () => {
  const loading = ref(false)
  const loadError = ref<string | null>(null)
  const booted = ref(false)
  const collaterals = ref<StakingCollateralAsset[]>([])
  const positions = ref<StakingLoanPosition[]>([])
  const stakingLedger = ref<StakingLedgerEntry[]>([])

  const totalBorrowed = computed(() => positions.value.reduce((s, p) => s + p.borrowedUsdt + p.accruedInterestUsdt, 0))

  function px(sym: string): number {
    return INDEX_PRICE[sym] ?? 0
  }

  function collateralUsd(pos: StakingLoanPosition): number {
    return pos.collateralAmount * px(pos.collateralAsset)
  }

  function recalcLtv(pos: StakingLoanPosition) {
    const u = collateralUsd(pos)
    pos.currentLtvPct = u > 0 ? Number((((pos.borrowedUsdt + pos.accruedInterestUsdt) / u) * 100).toFixed(2)) : 0
  }

  function syncLockedFromPositions() {
    for (const c of collaterals.value) {
      c.lockedAmount = positions.value
        .filter((p) => p.collateralAsset === c.symbol)
        .reduce((s, p) => s + p.collateralAmount, 0)
    }
  }

  async function bootstrap(force = false) {
    if (booted.value && !force) return
    loading.value = true
    loadError.value = null
    try {
      const data = await fetchStakingLoanCatalog()
      collaterals.value = data.collaterals
      if (!booted.value) {
        positions.value = data.positions
        stakingLedger.value = [...data.ledger]
      }
      booted.value = true
      syncLockedFromPositions()
      for (const p of positions.value) recalcLtv(p)
    } catch {
      loadError.value = '质押借币数据加载失败'
      collaterals.value = STAKING_COLLATERALS.map((c) => ({ ...c }))
      if (!booted.value) {
        positions.value = []
        stakingLedger.value = []
      }
      booted.value = true
    } finally {
      loading.value = false
    }
  }

  function requireAuth(): boolean {
    if (!useAuthStore().isAuthenticated) {
      useAppStore().pushToast('warning', '请先登录后再操作质押借贷')
      return false
    }
    return true
  }

  function pushLedger(kind: StakingLedgerEntry['kind'], summary: string) {
    stakingLedger.value = [
      { id: uid('sl'), time: new Date().toISOString(), kind, summary },
      ...stakingLedger.value,
    ]
  }

  function maxBorrowFor(collateralSymbol: string, addCollateral: number): number {
    const col = collaterals.value.find((c) => c.symbol === collateralSymbol)
    const pos = positions.value.find((p) => p.collateralAsset === collateralSymbol)
    if (!col) return 0
    const newAmt = (pos?.collateralAmount ?? 0) + addCollateral
    const usd = newAmt * px(collateralSymbol)
    return (usd * col.maxInitialLtvPct) / 100 - (pos ? pos.borrowedUsdt + pos.accruedInterestUsdt : 0)
  }

  /** @returns 是否提交成功（失败时已 Toast；成功态由调用方展示弹窗内结果） */
  function borrow(collateralSymbol: string, addCollateral: number, borrowUsdt: number): boolean {
    if (!requireAuth()) return false
    const app = useAppStore()
    const col = collaterals.value.find((c) => c.symbol === collateralSymbol)
    if (!col || addCollateral <= 0 || borrowUsdt <= 0) {
      app.pushToast('error', '请填写质押数量与借币金额')
      return false
    }
    if (addCollateral > col.walletBalance) {
      app.pushToast('error', '钱包可用质押物不足')
      return false
    }
    const pos = positions.value.find((p) => p.collateralAsset === collateralSymbol)
    const newCol = (pos?.collateralAmount ?? 0) + addCollateral
    const newDebt = (pos?.borrowedUsdt ?? 0) + borrowUsdt
    const newInt = pos?.accruedInterestUsdt ?? 0
    const usd = newCol * px(collateralSymbol)
    const ltv = ((newDebt + newInt) / usd) * 100
    if (ltv > col.maxInitialLtvPct + 0.05) {
      app.pushToast(
        'error',
        `质押率过高：测算 LTV ${ltv.toFixed(2)}%，初始上限 ${col.maxInitialLtvPct}%。可减少借币或增加质押。`,
      )
      return false
    }
    col.walletBalance -= addCollateral
    if (pos) {
      pos.collateralAmount = newCol
      pos.borrowedUsdt = newDebt
      recalcLtv(pos)
    } else {
      const np: StakingLoanPosition = {
        id: uid('sp'),
        collateralAsset: collateralSymbol,
        collateralAmount: addCollateral,
        borrowedUsdt: borrowUsdt,
        accruedInterestUsdt: 0,
        currentLtvPct: 0,
        openedAt: new Date().toISOString(),
      }
      recalcLtv(np)
      positions.value.push(np)
    }
    syncLockedFromPositions()
    pushLedger(
      'BORROW',
      pos
        ? `追加质押 ${addCollateral} ${collateralSymbol} · 新增借入 ${borrowUsdt} USDT`
        : `开仓 · 质押 ${addCollateral} ${collateralSymbol} · 借入 ${borrowUsdt} USDT`,
    )
    return true
  }

  /** @returns false 失败；partial 部分还款；closed 已全部结清 */
  function repay(positionId: string, payUsdt: number): false | 'partial' | 'closed' {
    if (!requireAuth()) return false
    const app = useAppStore()
    const pos = positions.value.find((p) => p.id === positionId)
    if (!pos) {
      app.pushToast('error', '仓位不存在')
      return false
    }
    const due = pos.borrowedUsdt + pos.accruedInterestUsdt
    if (payUsdt <= 0 || payUsdt > due + 1e-6) {
      app.pushToast('error', '还款金额无效')
      return false
    }
    let r = payUsdt
    const ip = Math.min(r, pos.accruedInterestUsdt)
    pos.accruedInterestUsdt -= ip
    r -= ip
    const pr = Math.min(r, pos.borrowedUsdt)
    pos.borrowedUsdt -= pr
    if (pos.borrowedUsdt <= 1e-6 && pos.accruedInterestUsdt <= 1e-6) {
      const col = collaterals.value.find((c) => c.symbol === pos.collateralAsset)
      const backAmt = pos.collateralAmount
      const sym = pos.collateralAsset
      if (col) col.walletBalance += pos.collateralAmount
      positions.value = positions.value.filter((p) => p.id !== positionId)
      pushLedger('CLOSED', `仓位结清 · 还款 ${payUsdt.toFixed(2)} USDT · 退回质押 ${backAmt} ${sym}`)
      syncLockedFromPositions()
      return 'closed'
    }
    recalcLtv(pos)
    pushLedger(
      'REPAY',
      `还款 ${payUsdt.toFixed(2)} USDT · 剩余负债 ${(pos.borrowedUsdt + pos.accruedInterestUsdt).toFixed(2)} USDT`,
    )
    syncLockedFromPositions()
    return 'partial'
  }

  function addCollateral(positionId: string, amount: number): boolean {
    if (!requireAuth()) return false
    const app = useAppStore()
    const pos = positions.value.find((p) => p.id === positionId)
    const col = collaterals.value.find((c) => c.symbol === pos?.collateralAsset)
    if (!pos || !col || amount <= 0 || amount > col.walletBalance) {
      app.pushToast('error', '追加数量无效或余额不足')
      return false
    }
    col.walletBalance -= amount
    pos.collateralAmount += amount
    recalcLtv(pos)
    syncLockedFromPositions()
    pushLedger('ADD_COLLATERAL', `追加质押 ${amount} ${pos.collateralAsset}`)
    return true
  }

  function dailyBorrowRateFraction(symbol: string): number {
    const col = collaterals.value.find((c) => c.symbol === symbol)
    const pct = col?.dailyBorrowRatePct ?? 0.002
    return pct / 100
  }

  /** 按未偿本金与资产日利率粗算日利息（USDT，演示） */
  function estimatedDailyInterestUsdt(pos: StakingLoanPosition): number {
    return pos.borrowedUsdt * dailyBorrowRateFraction(pos.collateralAsset)
  }

  function accrueDemoInterest() {
    for (const pos of positions.value) {
      const dailyFrac = dailyBorrowRateFraction(pos.collateralAsset)
      const hourly = (pos.borrowedUsdt * dailyFrac) / 24
      pos.accruedInterestUsdt += hourly
      recalcLtv(pos)
    }
  }

  return {
    loading,
    loadError,
    booted,
    collaterals,
    positions,
    stakingLedger,
    totalBorrowed,
    INDEX_PRICE,
    px,
    maxBorrowFor,
    bootstrap,
    borrow,
    repay,
    addCollateral,
    accrueDemoInterest,
    dailyBorrowRateFraction,
    estimatedDailyInterestUsdt,
    syncLockedFromPositions,
    recalcLtv,
  }
})
