import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { fetchReferralDashboard } from '@/api/referral/referralMock'
import type { ReferralDashboard } from '@/types/referralInvite'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'

function buildInviteCode(userCode: string): string {
  const raw = userCode.toUpperCase().replace(/[^A-Z0-9]/g, '')
  const pad = (raw + 'INVITE').replace(/[^A-Z0-9]/g, '')
  return pad.slice(0, 8).padEnd(8, 'X')
}

export const useReferralInviteStore = defineStore('referralInvite', () => {
  const loading = ref(false)
  const loadError = ref<string | null>(null)
  const dashboard = ref<ReferralDashboard | null>(null)

  const inviteCode = computed(() => {
    const u = useAuthStore().user?.userCode
    return u ? buildInviteCode(u) : ''
  })

  const inviteLink = computed(() => {
    if (!inviteCode.value || typeof window === 'undefined') return ''
    const base = new URL(import.meta.env.BASE_URL || '/', window.location.origin).href.replace(/\/$/, '')
    return `${base}/auth/register?ref=${encodeURIComponent(inviteCode.value)}`
  })

  async function bootstrap(force = false) {
    if (!useAuthStore().isAuthenticated) {
      dashboard.value = null
      return
    }
    if (dashboard.value && !force) return
    const u = useAuthStore().user?.userCode
    if (!u) return
    loading.value = true
    loadError.value = null
    try {
      dashboard.value = await fetchReferralDashboard(u)
    } catch {
      loadError.value = '邀请返佣数据加载失败'
      dashboard.value = null
    } finally {
      loading.value = false
    }
  }

  function copyText(text: string, okMsg = '已复制到剪贴板') {
    if (!text) return
    void navigator.clipboard.writeText(text).then(
      () => useAppStore().pushToast('success', okMsg),
      () => useAppStore().pushToast('error', '复制失败，请手动选择复制'),
    )
  }

  function claimPending() {
    const app = useAppStore()
    const d = dashboard.value
    if (!d || d.stats.pendingUsdt <= 0) {
      app.pushToast('info', '暂无待结算返佣')
      return
    }
    const p = d.stats.pendingUsdt
    dashboard.value = {
      ...d,
      stats: {
        ...d.stats,
        pendingUsdt: 0,
        settledUsdt: Math.round((d.stats.settledUsdt + p) * 100) / 100,
        totalCommissionUsdt: d.stats.totalCommissionUsdt,
      },
    }
    app.pushToast('success', `已领取 ${p.toFixed(2)} USDT 至现货账户（演示）`)
  }

  return {
    loading,
    loadError,
    dashboard,
    inviteCode,
    inviteLink,
    bootstrap,
    copyText,
    claimPending,
  }
})
