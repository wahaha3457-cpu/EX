import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { fetchLendingCatalog, LENDING_PLANS } from '@/api/finance/lendingCatalog'
import type { LendingAssistPlan, LendingLoan } from '@/types/financeCredit'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'
import { useAnnounceCenterStore } from '@/stores/announceCenter'
import { formatPrice } from '@/utils/format/number'

function uid(p: string) {
  return `${p}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export const useLendingAssistStore = defineStore('lendingAssist', () => {
  const loading = ref(false)
  const loadError = ref<string | null>(null)
  const booted = ref(false)
  const plans = ref<LendingAssistPlan[]>([])
  const loans = ref<LendingLoan[]>([])
  /** 总额度（演示） */
  const totalQuotaUsdt = ref(300_000)

  const planMap = computed(() => new Map(plans.value.map((p) => [p.id, p])))

  const usedPrincipal = computed(() =>
    loans.value
      .filter((l) => l.status === 'PENDING_REVIEW' || l.status === 'ACTIVE' || l.status === 'OVERDUE')
      .reduce((s, l) => s + l.principal, 0),
  )

  const availableQuota = computed(() => Math.max(0, totalQuotaUsdt.value - usedPrincipal.value))

  async function bootstrap(force = false) {
    if (booted.value && !force) return
    loading.value = true
    loadError.value = null
    try {
      const data = await fetchLendingCatalog()
      plans.value = data.plans
      if (!booted.value) loans.value = data.loans
      booted.value = true
    } catch {
      loadError.value = '助力贷产品加载失败'
      plans.value = [...LENDING_PLANS]
      if (!booted.value) loans.value = []
      booted.value = true
    } finally {
      loading.value = false
    }
  }

  function requireAuth(): boolean {
    if (!useAuthStore().isAuthenticated) {
      useAppStore().pushToast('warning', '请先登录后再申请/还款')
      return false
    }
    return true
  }

  function apply(planId: string, amount: number): LendingLoan | null {
    if (!requireAuth()) return null
    const app = useAppStore()
    const plan = planMap.value.get(planId)
    if (!plan) {
      app.pushToast('error', '产品不存在')
      return null
    }
    if (amount < plan.minAmount || amount > plan.maxAmount) {
      app.pushToast('error', `单笔需在 ${plan.minAmount} ~ ${plan.maxAmount} USDT`)
      return null
    }
    if (amount > availableQuota.value) {
      app.pushToast('error', '剩余助力额度不足')
      return null
    }
    const now = Date.now()
    const submittedAt = new Date(now).toISOString()
    const loan: LendingLoan = {
      id: uid('ll'),
      planId,
      principal: amount,
      accruedInterest: 0,
      borrowedAt: submittedAt,
      dueAt: '',
      status: 'PENDING_REVIEW',
    }
    loans.value.unshift(loan)
    app.pushToast('success', '贷款申请已提交审核，请等待平台审批（演示）')
    return loan
  }

  /**
   * 演示：模拟运营后台审核通过 —— 放款、写借条状态，并向公告中心注入一条「审核通过」通知。
   */
  function approveDemoApplication(loanId: string) {
    if (!requireAuth()) return
    const app = useAppStore()
    const loan = loans.value.find((l) => l.id === loanId)
    if (!loan) {
      app.pushToast('error', '申请不存在')
      return
    }
    if (loan.status !== 'PENDING_REVIEW') {
      app.pushToast('info', '该笔不在待审核状态')
      return
    }
    const plan = planMap.value.get(loan.planId)
    if (!plan) {
      app.pushToast('error', '产品不存在')
      return
    }
    const now = Date.now()
    const disbursedAt = new Date(now).toISOString()
    const dueAt = new Date(now + plan.termDays * 86400000).toISOString()
    loan.status = 'ACTIVE'
    loan.borrowedAt = disbursedAt
    loan.dueAt = dueAt
    loan.accruedInterest = 0

    const announce = useAnnounceCenterStore()
    const title = `【助力贷】借款申请已审核通过（${loan.id}）`
    const summary = `您申请的 ${formatPrice(loan.principal)} USDT 已放款（演示），请在「我的借款」查看还款计划。`
    announce.prependInjectedNotice({
      id: `rt-lending-${loan.id}`,
      title,
      category: 'SYSTEM',
      publishedAt: disbursedAt,
      pinned: true,
      summary,
      paragraphs: [
        '尊敬的用户：',
        `您于平台提交的助力贷申请（申请编号 ${loan.id}，产品 ${plan.name}）已通过风控审核并完成放款（演示环境）。`,
        `放款金额：${formatPrice(loan.principal)} USDT；起息日：${new Date(disbursedAt).toLocaleString('zh-CN')}；到期日：${new Date(dueAt).toLocaleString('zh-CN')}。`,
        '后续账单、还款与逾期规则请以站内协议及正式合同为准。您也可前往「首页 · 公告中心」查看平台通知。',
      ],
    })
    app.pushToast('success', '审核已通过：已模拟放款并同步公告通知（演示）')
  }

  function repay(loanId: string, payUsdt: number) {
    if (!requireAuth()) return
    const app = useAppStore()
    const idx = loans.value.findIndex((l) => l.id === loanId)
    if (idx < 0) {
      app.pushToast('error', '借据不存在')
      return
    }
    const loan = loans.value[idx]!
    if (loan.status === 'PENDING_REVIEW') {
      app.pushToast('warning', '该笔尚在审核中，通过后方可还款')
      return
    }
    if (loan.status === 'SETTLED') {
      app.pushToast('info', '该笔已结清')
      return
    }
    const totalDue = loan.principal + loan.accruedInterest
    if (payUsdt <= 0 || payUsdt > totalDue + 1e-6) {
      app.pushToast('error', '还款金额无效')
      return
    }
    let rest = payUsdt
    const intPay = Math.min(rest, loan.accruedInterest)
    loan.accruedInterest -= intPay
    rest -= intPay
    const prPay = Math.min(rest, loan.principal)
    loan.principal -= prPay
    if (loan.principal <= 1e-6 && loan.accruedInterest <= 1e-6) {
      loan.principal = 0
      loan.accruedInterest = 0
      loan.status = 'SETTLED'
    }
    app.pushToast('success', `还款受理 · 本次 ${payUsdt.toFixed(2)} USDT（演示）`)
  }

  /** 演示：每日计息 tick */
  function accrueDemoInterest() {
    const now = Date.now()
    for (const loan of loans.value) {
      if (loan.status !== 'ACTIVE' && loan.status !== 'OVERDUE') continue
      const plan = planMap.value.get(loan.planId)
      if (!plan) continue
      const daily = (plan.dailyRatePct / 100) * loan.principal
      loan.accruedInterest += daily * 0.001
      if (new Date(loan.dueAt).getTime() < now && loan.status === 'ACTIVE') {
        loan.status = 'OVERDUE'
      }
    }
  }

  return {
    loading,
    loadError,
    booted,
    plans,
    loans,
    totalQuotaUsdt,
    planMap,
    usedPrincipal,
    availableQuota,
    bootstrap,
    apply,
    repay,
    accrueDemoInterest,
    approveDemoApplication,
  }
})
