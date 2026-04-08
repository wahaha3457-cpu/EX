import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type {
  CopyClosedRound,
  CopyFollowSettings,
  CopyMarket,
  CopyOpenPosition,
  CopySubscription,
  LeadTrader,
} from '@/types/copyTrading'
import {
  fetchHistory,
  fetchLeadTraders,
  fetchOpenPositions,
  fetchSubscriptions,
  followTrader,
  jitterPositions,
  removeSubscription,
  togglePause,
  updateFollowSettings,
} from '@/api/copyTrading/copyTradingMock'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'

export type CopyPlazaSort = 'roi30d' | 'drawdown' | 'followers' | 'aum'
export type CopyMainTab = 'plaza' | 'mine' | 'rules'
export type CopyRiskTierFilter = 'all' | 'low' | 'mid' | 'high'

function riskTierOf(l: LeadTrader): Exclude<CopyRiskTierFilter, 'all'> {
  if (l.riskLevel <= 2) return 'low'
  if (l.riskLevel === 3) return 'mid'
  return 'high'
}

function userKey(): string | null {
  const u = useAuthStore().user?.userCode
  return u && u.length > 0 ? u : null
}

export const useCopyTradingStore = defineStore('copyTrading', () => {
  const leaders = ref<LeadTrader[]>([])
  const subscriptions = ref<CopySubscription[]>([])
  const positions = ref<CopyOpenPosition[]>([])
  const history = ref<CopyClosedRound[]>([])

  const loadingLeaders = ref(false)
  const loadingMine = ref(false)
  const leadersError = ref<string | null>(null)
  const mineError = ref<string | null>(null)

  const mainTab = ref<CopyMainTab>('plaza')
  const marketFilter = ref<'ALL' | CopyMarket>('ALL')
  const riskFilter = ref<CopyRiskTierFilter>('all')
  const sortKey = ref<CopyPlazaSort>('roi30d')
  const searchQuery = ref('')

  const filteredLeaders = computed(() => {
    let list = [...leaders.value]
    const mf = marketFilter.value
    if (mf !== 'ALL') {
      list = list.filter((l) => l.markets.includes(mf))
    }
    const rf = riskFilter.value
    if (rf !== 'all') {
      list = list.filter((l) => riskTierOf(l) === rf)
    }
    const q = searchQuery.value.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (l) =>
          l.displayName.toLowerCase().includes(q) ||
          l.tags.some((t) => t.toLowerCase().includes(q)),
      )
    }
    switch (sortKey.value) {
      case 'roi30d':
        list.sort((a, b) => b.roi30dPct - a.roi30dPct)
        break
      case 'drawdown':
        list.sort((a, b) => a.maxDrawdownPct - b.maxDrawdownPct)
        break
      case 'followers':
        list.sort((a, b) => b.followers - a.followers)
        break
      case 'aum':
        list.sort((a, b) => b.aumUsdt - a.aumUsdt)
        break
      default:
        break
    }
    return list
  })

  const subscribedIds = computed(() => new Set(subscriptions.value.map((s) => s.traderId)))

  const totalUnrealizedUsdt = computed(() =>
    positions.value.reduce((s, p) => s + p.uPnlUsdt, 0),
  )

  const activeSubscriptions = computed(() => subscriptions.value.filter((s) => s.status === 'active'))

  function isFollowing(traderId: string) {
    return subscribedIds.value.has(traderId)
  }

  async function bootstrapLeaders(force = false) {
    if (leaders.value.length && !force) return
    loadingLeaders.value = true
    leadersError.value = null
    try {
      leaders.value = await fetchLeadTraders()
    } catch {
      leadersError.value = '交易员列表加载失败'
    } finally {
      loadingLeaders.value = false
    }
  }

  async function refreshMine() {
    const key = userKey()
    if (!key) {
      subscriptions.value = []
      positions.value = []
      history.value = []
      return
    }
    loadingMine.value = true
    mineError.value = null
    try {
      const [subs, pos, hist] = await Promise.all([
        fetchSubscriptions(key),
        fetchOpenPositions(key),
        fetchHistory(key),
      ])
      subscriptions.value = subs
      positions.value = pos
      history.value = hist
    } catch {
      mineError.value = '跟单数据加载失败'
    } finally {
      loadingMine.value = false
    }
  }

  async function refreshPositionsLive() {
    const key = userKey()
    if (!key || !positions.value.length) return
    try {
      positions.value = await jitterPositions(key)
    } catch {
      /* ignore */
    }
  }

  async function startFollow(
    traderId: string,
    draft: Omit<CopyFollowSettings, 'traderId' | 'startedAt' | 'updatedAt' | 'status'>,
  ) {
    const app = useAppStore()
    const key = userKey()
    if (!key) {
      app.pushToast('warning', '请先登录后再跟单')
      return false
    }
    try {
      const sub = await followTrader(key, traderId, draft)
      const idx = subscriptions.value.findIndex((s) => s.traderId === traderId)
      if (idx >= 0) subscriptions.value[idx] = sub
      else subscriptions.value.push(sub)
      const [pos, hist] = await Promise.all([fetchOpenPositions(key), fetchHistory(key)])
      positions.value = pos
      history.value = hist
      app.pushToast('success', '已开启跟单（演示）')
      return true
    } catch {
      app.pushToast('error', '跟单失败，请重试')
      return false
    }
  }

  async function saveSettings(traderId: string, patch: Partial<Omit<CopyFollowSettings, 'traderId' | 'startedAt'>>) {
    const app = useAppStore()
    const key = userKey()
    if (!key) return false
    try {
      const sub = await updateFollowSettings(key, traderId, patch)
      if (!sub) {
        app.pushToast('error', '未找到跟单记录')
        return false
      }
      const idx = subscriptions.value.findIndex((s) => s.traderId === traderId)
      if (idx >= 0) subscriptions.value[idx] = sub
      app.pushToast('success', '已保存设置')
      return true
    } catch {
      app.pushToast('error', '保存失败')
      return false
    }
  }

  async function stopFollow(traderId: string) {
    const app = useAppStore()
    const key = userKey()
    if (!key) return
    try {
      await removeSubscription(key, traderId)
      subscriptions.value = subscriptions.value.filter((s) => s.traderId !== traderId)
      positions.value = positions.value.filter((p) => p.traderId !== traderId)
      app.pushToast('info', '已停止跟单并移除演示持仓')
    } catch {
      app.pushToast('error', '操作失败')
    }
  }

  async function pauseFollow(traderId: string, paused: boolean) {
    const app = useAppStore()
    const key = userKey()
    if (!key) return
    try {
      const sub = await togglePause(key, traderId, paused)
      if (!sub) return
      const idx = subscriptions.value.findIndex((s) => s.traderId === traderId)
      if (idx >= 0) subscriptions.value[idx] = sub
      app.pushToast('success', paused ? '已暂停跟单' : '已恢复跟单')
    } catch {
      app.pushToast('error', '操作失败')
    }
  }

  return {
    leaders,
    subscriptions,
    positions,
    history,
    loadingLeaders,
    loadingMine,
    leadersError,
    mineError,
    mainTab,
    marketFilter,
    riskFilter,
    sortKey,
    searchQuery,
    riskTierOf,
    filteredLeaders,
    subscribedIds,
    totalUnrealizedUsdt,
    activeSubscriptions,
    isFollowing,
    bootstrapLeaders,
    refreshMine,
    refreshPositionsLive,
    startFollow,
    saveSettings,
    stopFollow,
    pauseFollow,
  }
})
