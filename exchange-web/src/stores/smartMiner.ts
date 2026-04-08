import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { fetchMinerCatalog, MINER_PRODUCTS } from '@/api/finance/minerCatalog'
import type { MinerOrder, MinerProduct } from '@/types/financeEarn'
import { minerOrderDailyYieldPct, minerOrderEstimatedDailyUsdt } from '@/utils/finance/earnYield'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export const useSmartMinerStore = defineStore('smartMiner', () => {
  const loading = ref(false)
  const loadError = ref<string | null>(null)
  const products = ref<MinerProduct[]>([])
  const orders = ref<MinerOrder[]>([])
  const walletUsdt = ref(15_200)

  const productMap = computed(() => new Map(products.value.map((p) => [p.id, p])))

  const activeOrders = computed(() => orders.value.filter((o) => o.status === 'MINING'))

  const totalHashrate = computed(() =>
    activeOrders.value.reduce((s, o) => {
      const p = productMap.value.get(o.productId)
      return s + (p ? p.hashrateTh * o.quantity : 0)
    }, 0),
  )

  const estDailyTotal = computed(() =>
    activeOrders.value.reduce((s, o) => {
      const p = productMap.value.get(o.productId)
      return s + (p ? minerOrderEstimatedDailyUsdt(p, o.quantity) : 0)
    }, 0),
  )

  /** 进行中订单实付本金合计（用于组合日收益率） */
  const totalPaidActive = computed(() => activeOrders.value.reduce((s, o) => s + o.paidUsdt, 0))

  /** 组合参考日收益率（%）：日估产出合计 / 实付合计 */
  const portfolioDailyYieldPct = computed(() => {
    if (totalPaidActive.value <= 0) return 0
    return (estDailyTotal.value / totalPaidActive.value) * 100
  })

  function orderEstimatedDailyUsdt(o: MinerOrder): number {
    const p = productMap.value.get(o.productId)
    return p ? minerOrderEstimatedDailyUsdt(p, o.quantity) : 0
  }

  function orderDailyYieldPct(o: MinerOrder): number {
    const p = productMap.value.get(o.productId)
    return p ? minerOrderDailyYieldPct(o, p) : 0
  }

  const booted = ref(false)

  async function bootstrap(force = false) {
    if (booted.value && !force) return
    loading.value = true
    loadError.value = null
    try {
      const data = await fetchMinerCatalog()
      products.value = data.products
      if (!booted.value) orders.value = data.orders
      booted.value = true
    } catch {
      loadError.value = '矿机产品加载失败'
      products.value = [...MINER_PRODUCTS]
      if (!booted.value) orders.value = []
      booted.value = true
    } finally {
      loading.value = false
    }
  }

  function requireAuth(): boolean {
    if (!useAuthStore().isAuthenticated) {
      useAppStore().pushToast('warning', '请先登录后再购买算力')
      return false
    }
    return true
  }

  /** @returns 是否下单成功（成功 Toast 与结果态由购买弹窗承接） */
  function purchase(productId: string, quantity: number): boolean {
    if (!requireAuth()) return false
    const app = useAppStore()
    const p = productMap.value.get(productId)
    if (!p) {
      app.pushToast('error', '套餐不存在')
      return false
    }
    const q = Math.max(1, Math.floor(quantity))
    const pay = p.priceUsdt * q
    if (pay > walletUsdt.value) {
      app.pushToast('error', 'USDT 余额不足，请先划转或充值')
      return false
    }
    walletUsdt.value -= pay
    const now = Date.now()
    orders.value.unshift({
      id: uid('mo'),
      productId,
      quantity: q,
      purchasedAt: new Date(now).toISOString(),
      endAt: new Date(now + p.durationDays * 86400000).toISOString(),
      status: 'MINING',
      paidUsdt: pay,
    })
    return true
  }

  function settleDemo(orderId: string) {
    const o = orders.value.find((x) => x.id === orderId)
    if (!o || o.status !== 'MINING') return
    o.status = 'SETTLED'
    const p = productMap.value.get(o.productId)
    const bonus = p ? p.estDailyUsdt * p.durationDays * o.quantity * 0.85 : 0
    walletUsdt.value += bonus
    useAppStore().pushToast('info', `演示结算：${orderId} 已结束，预估收益 ${bonus.toFixed(2)} USDT 已入账`)
  }

  return {
    loading,
    loadError,
    products,
    orders,
    walletUsdt,
    productMap,
    activeOrders,
    totalHashrate,
    estDailyTotal,
    totalPaidActive,
    portfolioDailyYieldPct,
    orderEstimatedDailyUsdt,
    orderDailyYieldPct,
    booted,
    bootstrap,
    purchase,
    settleDemo,
  }
})
