import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { fetchFundCatalog, FUND_PRODUCTS } from '@/api/finance/fundCatalog'
import type { FundHistoryEntry, FundPosition, FundProduct } from '@/types/financeEarn'
import { fundEstimatedDailyUsdt } from '@/utils/finance/earnYield'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export const useFinanceFundStore = defineStore('financeFund', () => {
  const loading = ref(false)
  const loadError = ref<string | null>(null)
  const products = ref<FundProduct[]>([])
  const positions = ref<FundPosition[]>([])
  const fundHistory = ref<FundHistoryEntry[]>([])
  /** 可申购余额（演示，与资产中心可后续打通） */
  const availableUsdt = ref(12_580.55)

  const productMap = computed(() => new Map(products.value.map((p) => [p.id, p])))

  const totalPrincipal = computed(() => positions.value.reduce((s, p) => s + p.amount, 0))

  const totalAccrued = computed(() => positions.value.reduce((s, p) => s + p.accruedInterest, 0))

  /** 持仓日估收益合计（USDT/天），按各产品参考年化均摊至日 */
  const totalEstimatedDailyUsdt = computed(() =>
    positions.value.reduce((s, pos) => {
      const p = productMap.value.get(pos.productId)
      return s + (p ? fundEstimatedDailyUsdt(pos.amount, p.apyPct) : 0)
    }, 0),
  )

  /** 持仓加权参考日收益率（%） */
  const portfolioDailyYieldPct = computed(() => {
    const tp = totalPrincipal.value
    if (tp <= 0) return 0
    return (totalEstimatedDailyUsdt.value / tp) * 100
  })

  const booted = ref(false)

  async function bootstrap(force = false) {
    if (booted.value && !force) return
    loading.value = true
    loadError.value = null
    try {
      const data = await fetchFundCatalog()
      products.value = data.products
      if (!booted.value) {
        positions.value = data.positions
        fundHistory.value = [...data.history]
      }
      booted.value = true
    } catch {
      loadError.value = '理财产品加载失败'
      products.value = [...FUND_PRODUCTS]
      if (!booted.value) {
        positions.value = []
        fundHistory.value = []
      }
      booted.value = true
    } finally {
      loading.value = false
    }
  }

  function requireAuth(): boolean {
    const auth = useAuthStore()
    if (!auth.isAuthenticated) {
      useAppStore().pushToast('warning', '请先登录后再进行申购/赎回')
      return false
    }
    return true
  }

  function pushHistory(entry: Omit<FundHistoryEntry, 'id' | 'time'> & { id?: string; time?: string }) {
    const row: FundHistoryEntry = {
      id: entry.id ?? uid('fh'),
      time: entry.time ?? new Date().toISOString(),
      kind: entry.kind,
      productId: entry.productId,
      amountUsdt: entry.amountUsdt,
      note: entry.note,
    }
    fundHistory.value = [row, ...fundHistory.value]
  }

  /** @returns 是否成功（失败已 Toast；成功态由申购弹窗承接） */
  function subscribe(productId: string, amount: number): boolean {
    if (!requireAuth()) return false
    const app = useAppStore()
    const p = productMap.value.get(productId)
    if (!p) {
      app.pushToast('error', '产品不存在')
      return false
    }
    if (amount < p.minAmount) {
      app.pushToast('error', `最低申购 ${p.minAmount} ${p.asset}`)
      return false
    }
    if (p.maxPerUser != null) {
      const held = positions.value.filter((x) => x.productId === productId).reduce((s, x) => s + x.amount, 0)
      if (held + amount > p.maxPerUser) {
        app.pushToast('error', '超过单产品持仓上限')
        return false
      }
    }
    if (amount > availableUsdt.value) {
      app.pushToast('error', '可用余额不足')
      return false
    }
    availableUsdt.value = Math.max(0, availableUsdt.value - amount)
    const now = new Date()
    const maturityAt =
      p.kind === 'FIXED' && p.durationDays != null
        ? new Date(now.getTime() + p.durationDays * 86400000).toISOString()
        : null
    positions.value.push({
      id: uid('fp'),
      productId,
      amount,
      accruedInterest: 0,
      subscribedAt: now.toISOString(),
      maturityAt,
      autoRenew: p.kind === 'FIXED',
    })
    pushHistory({
      kind: 'SUBSCRIBE',
      productId,
      amountUsdt: amount,
      note: `申购 ${p.name}`,
    })
    return true
  }

  /** @returns 是否成功（成功态由赎回弹窗承接） */
  function redeemFlexible(positionId: string, amount: number): boolean {
    if (!requireAuth()) return false
    const app = useAppStore()
    const idx = positions.value.findIndex((x) => x.id === positionId)
    if (idx < 0) {
      app.pushToast('error', '持仓不存在')
      return false
    }
    const pos = positions.value[idx]!
    const p = productMap.value.get(pos.productId)
    if (!p || p.kind !== 'FLEXIBLE') {
      app.pushToast('error', '仅活期持仓可赎回')
      return false
    }
    if (amount <= 0 || amount > pos.amount) {
      app.pushToast('error', '赎回数量无效')
      return false
    }
    const interestPart = (amount / pos.amount) * pos.accruedInterest
    availableUsdt.value += amount + interestPart
    const remain = pos.amount - amount
    if (remain <= 1e-8) {
      positions.value.splice(idx, 1)
    } else {
      positions.value[idx] = {
        ...pos,
        amount: remain,
        accruedInterest: pos.accruedInterest - interestPart,
      }
    }
    pushHistory({
      kind: 'REDEEM',
      productId: pos.productId,
      amountUsdt: amount,
      note: `赎回本金 ${amount.toFixed(2)} USDT`,
    })
    return true
  }

  function toggleAutoRenew(positionId: string) {
    if (!requireAuth()) return
    const pos = positions.value.find((x) => x.id === positionId)
    if (!pos || pos.maturityAt == null) {
      useAppStore().pushToast('info', '仅定期持仓支持自动续投')
      return
    }
    pos.autoRenew = !pos.autoRenew
    const p = productMap.value.get(pos.productId)
    pushHistory({
      kind: 'RENEW_TOGGLE',
      productId: pos.productId,
      amountUsdt: 0,
      note: pos.autoRenew ? `开启自动续投 · ${p?.name ?? pos.productId}` : `关闭自动续投 · ${p?.name ?? pos.productId}`,
    })
    useAppStore().pushToast('success', pos.autoRenew ? '已开启到期自动续投' : '已关闭自动续投')
  }

  return {
    loading,
    loadError,
    products,
    positions,
    fundHistory,
    availableUsdt,
    productMap,
    totalPrincipal,
    totalAccrued,
    totalEstimatedDailyUsdt,
    portfolioDailyYieldPct,
    booted,
    bootstrap,
    subscribe,
    redeemFlexible,
    toggleAutoRenew,
  }
})
