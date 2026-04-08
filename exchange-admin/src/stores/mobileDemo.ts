import { defineStore } from 'pinia'
import { useAppStore } from '@/stores/app'
import {
  SEED_MERCHANTS,
  SEED_TASKS,
  SEED_SERVICES,
  SEED_INBOX,
  DEMO_USER,
  initialLedger,
} from '@/mocks/mobile/seed'
import type {
  DemoInboxItem,
  EscrowItem,
  LedgerRow,
  Merchant,
  OtcOrder,
  ServiceListing,
  TaskItem,
  MobileDemoUser,
  InboxLinkType,
} from '@/types/mobileDemo'

const STORAGE_KEY = 'exchange-admin-mobile-demo-v1'

function genId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function toast(msg: string, type: 'success' | 'info' | 'warning' | 'error' = 'success') {
  useAppStore().pushToast(type, msg)
}

interface PersistShape {
  availableUsdt: number
  frozenUsdt: number
  escrowTaskUsdt: number
  escrowDealUsdt: number
  merchants: Merchant[]
  otcOrders: OtcOrder[]
  tasks: TaskItem[]
  escrows: EscrowItem[]
  ledger: LedgerRow[]
  user: MobileDemoUser
  notifications: DemoInboxItem[]
  services: ServiceListing[]
}

export const useMobileDemoStore = defineStore('mobileDemo', {
  state: () => ({
    hydrated: false,
    availableUsdt: 10240.5,
    frozenUsdt: 0,
    /** 任务赏金锁定（平台托管） */
    escrowTaskUsdt: 0,
    /** 担保交易锁定 */
    escrowDealUsdt: 0,
    merchants: [] as Merchant[],
    otcOrders: [] as OtcOrder[],
    tasks: [] as TaskItem[],
    escrows: [] as EscrowItem[],
    ledger: [] as LedgerRow[],
    user: {
      nickname: 'Alex Chen',
      uid: 'UF-8K2M-91Q',
      creditScore: 86,
      levelLabel: '黄金交易者',
      badges: ['已实名', 'Pro'],
    } as MobileDemoUser,
    /** 列表加载演示 */
    listLoading: false,
    notifications: [] as DemoInboxItem[],
    services: [] as ServiceListing[],
  }),
  getters: {
    unreadInboxCount(state): number {
      return state.notifications.filter((n) => !n.read).length
    },
    totalUsdt(state): number {
      return (
        state.availableUsdt +
        state.frozenUsdt +
        state.escrowTaskUsdt +
        state.escrowDealUsdt
      )
    },
    marketTasks(state): TaskItem[] {
      return state.tasks.filter(
        (t) => t.status === 'open' && t.publisherId !== DEMO_USER,
      )
    },
    myPublishedTasks(state): TaskItem[] {
      return state.tasks.filter((t) => t.publisherId === DEMO_USER)
    },
    myAcceptedTasks(state): TaskItem[] {
      return state.tasks.filter((t) => t.acceptedBy === DEMO_USER)
    },
    openOrders(state): OtcOrder[] {
      return state.otcOrders.filter((o) => o.status !== 'completed' && o.status !== 'cancelled')
    },
    marketServices(state): ServiceListing[] {
      return state.services.filter((s) => s.sellerId !== DEMO_USER)
    },
    myPublishedServices(state): ServiceListing[] {
      return state.services.filter((s) => s.sellerId === DEMO_USER)
    },
  },
  actions: {
    hydrate() {
      if (this.hydrated) return
      this.hydrated = true
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) {
          const p = JSON.parse(raw) as PersistShape
          this.availableUsdt = p.availableUsdt
          this.frozenUsdt = p.frozenUsdt
          this.escrowTaskUsdt = p.escrowTaskUsdt
          this.escrowDealUsdt = p.escrowDealUsdt
          this.merchants = p.merchants
          this.otcOrders = p.otcOrders
          this.tasks = p.tasks
          this.escrows = p.escrows
          this.ledger = p.ledger
          this.user = p.user
          this.notifications = Array.isArray(p.notifications)
            ? p.notifications
            : (JSON.parse(JSON.stringify(SEED_INBOX)) as DemoInboxItem[])
          this.services = Array.isArray(p.services)
            ? p.services
            : (JSON.parse(JSON.stringify(SEED_SERVICES)) as ServiceListing[])
          return
        }
      } catch {
        /* ignore */
      }
      this.resetSeed()
    },

    persist() {
      const p: PersistShape = {
        availableUsdt: this.availableUsdt,
        frozenUsdt: this.frozenUsdt,
        escrowTaskUsdt: this.escrowTaskUsdt,
        escrowDealUsdt: this.escrowDealUsdt,
        merchants: this.merchants,
        otcOrders: this.otcOrders,
        tasks: this.tasks,
        escrows: this.escrows,
        ledger: this.ledger,
        user: this.user,
        notifications: this.notifications,
        services: this.services,
      }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(p))
      } catch {
        /* ignore */
      }
    },

    resetSeed() {
      this.merchants = JSON.parse(JSON.stringify(SEED_MERCHANTS)) as Merchant[]
      this.tasks = JSON.parse(JSON.stringify(SEED_TASKS)) as TaskItem[]
      this.otcOrders = []
      this.escrows = []
      this.ledger = initialLedger()
      this.availableUsdt = 10240.5
      this.frozenUsdt = 0
      this.escrowTaskUsdt = 0
      this.escrowDealUsdt = 0
      this.notifications = JSON.parse(JSON.stringify(SEED_INBOX)) as DemoInboxItem[]
      this.services = JSON.parse(JSON.stringify(SEED_SERVICES)) as ServiceListing[]
      this.persist()
      toast('已重置演示数据', 'info')
    },

    pushInboxNotification(payload: {
      title: string
      preview: string
      body: string
      linkType: InboxLinkType
      linkId?: string
    }) {
      const n: DemoInboxItem = {
        id: genId('n'),
        at: Date.now(),
        read: false,
        ...payload,
      }
      this.notifications.unshift(n)
      this.persist()
    },

    markInboxRead(id: string) {
      const n = this.notifications.find((x) => x.id === id)
      if (n && !n.read) {
        n.read = true
        this.persist()
      }
    },

    markAllInboxRead() {
      let ch = false
      for (const n of this.notifications) {
        if (!n.read) {
          n.read = true
          ch = true
        }
      }
      if (ch) this.persist()
    },

    pushLedger(row: Omit<LedgerRow, 'id' | 'at'> & { at?: number }) {
      const item: LedgerRow = {
        id: genId('l'),
        at: row.at ?? Date.now(),
        ...row,
      }
      this.ledger.unshift(item)
      this.persist()
    },

    /** 买入下单：法币应付 mock = amount * price */
    createBuyOrder(merchantId: string, amountUsdt: number) {
      const m = this.merchants.find((x) => x.id === merchantId)
      if (!m) {
        toast('商家不存在', 'error')
        return null
      }
      if (amountUsdt < m.limitMin || amountUsdt > m.limitMax) {
        toast(`限额 ${m.limitMin} – ${m.limitMax} USDT`, 'warning')
        return null
      }
      const order: OtcOrder = {
        id: genId('o'),
        side: 'buy',
        merchantId,
        merchantName: m.name,
        amountUsdt,
        totalCny: Math.round(amountUsdt * m.priceCny * 100) / 100,
        status: 'pending_payment',
        createdAt: Date.now(),
      }
      this.otcOrders.unshift(order)
      this.pushLedger({
        kind: 'otc_buy',
        title: `买入 USDT · 待付款 · ${m.name}`,
        amountUsdt: 0,
        status: '待支付',
        relatedId: order.id,
      })
      this.persist()
      this.pushInboxNotification({
        title: 'OTC · 买入订单已创建',
        preview: `${m.name} · ${amountUsdt} USDT`,
        body: `请在订单详情内按指引完成法币付款，付款后点击「我已付款」。订单号：${order.id}`,
        linkType: 'order',
        linkId: order.id,
      })
      toast('订单已创建，请按提示完成支付')
      return order
    },

    otcMarkPaid(orderId: string) {
      const o = this.otcOrders.find((x) => x.id === orderId)
      if (!o || o.side !== 'buy') return
      if (o.status !== 'pending_payment') {
        toast('当前状态不可操作', 'warning')
        return
      }
      o.status = 'pending_confirm'
      this.syncLedgerOrder(o)
      this.persist()
      this.pushInboxNotification({
        title: 'OTC · 已标记付款',
        preview: `${o.merchantName} · ${o.amountUsdt} USDT`,
        body: '请等待对方确认放币；您也可在订单详情使用「模拟商家放币」完成演示闭环。',
        linkType: 'order',
        linkId: o.id,
      })
      toast('已标记付款，等待对方确认')
    },

    /** 模拟商家放币（演示） */
    otcSimulateRelease(orderId: string) {
      const o = this.otcOrders.find((x) => x.id === orderId)
      if (!o || o.side !== 'buy') return
      if (o.status !== 'pending_confirm') {
        toast('请先完成「我已付款」', 'warning')
        return
      }
      o.status = 'completed'
      this.availableUsdt += o.amountUsdt
      const row = this.ledger.find((l) => l.relatedId === o.id && l.kind === 'otc_buy')
      if (row) {
        row.title = `买入 USDT · 已到账 · ${o.merchantName}`
        row.amountUsdt = o.amountUsdt
        row.status = '已完成'
      } else {
        this.pushLedger({
          kind: 'otc_buy',
          title: `买入 USDT · 已到账 · ${o.merchantName}`,
          amountUsdt: o.amountUsdt,
          status: '已完成',
          relatedId: o.id,
        })
      }
      this.persist()
      this.pushInboxNotification({
        title: 'OTC · 买入已完成',
        preview: `+${o.amountUsdt} USDT 已入账`,
        body: `与 ${o.merchantName} 的买入订单已完成，余额已更新。订单号：${o.id}`,
        linkType: 'order',
        linkId: o.id,
      })
      toast(`+${o.amountUsdt} USDT 已入账`, 'success')
    },

    /** 卖出：冻结 USDT */
    createSellOrder(merchantId: string, amountUsdt: number) {
      const m = this.merchants.find((x) => x.id === merchantId)
      if (!m) {
        toast('收单方不存在', 'error')
        return null
      }
      if (amountUsdt < m.limitMin || amountUsdt > m.limitMax) {
        toast(`限额 ${m.limitMin} – ${m.limitMax} USDT`, 'warning')
        return null
      }
      if (this.availableUsdt < amountUsdt) {
        toast('可用余额不足', 'error')
        return null
      }
      this.availableUsdt -= amountUsdt
      this.frozenUsdt += amountUsdt
      const order: OtcOrder = {
        id: genId('o'),
        side: 'sell',
        merchantId,
        merchantName: m.name,
        amountUsdt,
        totalCny: Math.round(amountUsdt * m.priceCny * 100) / 100,
        status: 'pending_payment',
        createdAt: Date.now(),
      }
      this.otcOrders.unshift(order)
      this.pushLedger({
        kind: 'otc_sell',
        title: `卖出 USDT · 冻结 · ${m.name}`,
        amountUsdt: -amountUsdt,
        status: '进行中',
        relatedId: order.id,
      })
      this.persist()
      this.pushInboxNotification({
        title: 'OTC · 卖单已创建',
        preview: `${m.name} · 冻结 ${amountUsdt} USDT`,
        body: `请等待买家付款，到账后在订单详情点击「确认已收款」。订单号：${order.id}`,
        linkType: 'order',
        linkId: order.id,
      })
      toast('卖单已创建，USDT 已冻结')
      return order
    },

    sellConfirmReceived(orderId: string) {
      const o = this.otcOrders.find((x) => x.id === orderId)
      if (!o || o.side !== 'sell') return
      if (o.status !== 'pending_payment') {
        toast('当前状态不可确认收款', 'warning')
        return
      }
      this.frozenUsdt -= o.amountUsdt
      o.status = 'completed'
      const row = this.ledger.find((l) => l.relatedId === o.id && l.kind === 'otc_sell')
      if (row) {
        row.title = `卖出 USDT · 已完成 · ${o.merchantName}`
        row.status = '已完成'
      } else {
        this.pushLedger({
          kind: 'otc_sell',
          title: `卖出 USDT · 已完成 · ${o.merchantName}`,
          amountUsdt: -o.amountUsdt,
          status: '已完成',
          relatedId: o.id,
        })
      }
      this.persist()
      this.pushInboxNotification({
        title: 'OTC · 卖出已完成',
        preview: `${o.merchantName} · ${o.amountUsdt} USDT`,
        body: `卖单已交割，冻结已释放。订单号：${o.id}`,
        linkType: 'order',
        linkId: o.id,
      })
      toast('已确认收款，冻结已释放并完成交割', 'success')
    },

    syncLedgerOrder(o: OtcOrder) {
      const row = this.ledger.find((l) => l.relatedId === o.id)
      if (!row) return
      if (o.side === 'buy') {
        if (o.status === 'pending_confirm') row.title = `买入 USDT · 待放币 · ${o.merchantName}`
        if (o.status === 'completed') row.status = '已完成'
      }
    },

    /** 与托管状态联动的「锁定」流水行 */
    syncEscrowLockLedger(e: EscrowItem) {
      const row = this.ledger.find((l) => l.relatedId === e.id && l.kind === 'escrow_lock')
      if (!row) return
      const short = e.title.slice(0, 12)
      if (e.status === 'holding') {
        row.title = `担保托管 · 锁定 · ${short}`
        row.status = '托管中'
      } else if (e.status === 'delivered') {
        row.title = `担保托管 · 待收货 · ${short}`
        row.status = '待确认收货'
      } else if (e.status === 'pending_release') {
        row.title = `担保托管 · 待放款 · ${short}`
        row.status = '待放款'
      } else if (e.status === 'completed') {
        row.title = `担保托管 · 已结束 · ${short}`
        row.status = '已完成'
      } else if (e.status === 'cancelled') {
        row.title = `担保托管 · 已取消 · ${short}`
        row.amountUsdt = 0
        row.status = '已取消'
      }
    },

    /** 任务赏金锁定流水与任务状态联动 */
    syncTaskEscrowLedger(t: TaskItem) {
      if (!t.needEscrow) return
      const row = this.ledger.find((l) => l.relatedId === t.id && l.kind === 'task_out')
      if (!row) return
      const short = t.title.slice(0, 12)
      if (t.status === 'open' || t.status === 'in_progress') {
        row.title = `发布任务 · 赏金锁定 · ${short}`
        row.status = '托管中'
      } else if (t.status === 'delivered' || t.status === 'pending_confirm_done') {
        row.title = `发布任务 · 赏金锁定 · 待验收 · ${short}`
        row.status = '待验收'
      } else if (t.status === 'completed') {
        row.title = `任务完成 · 赏金已划转承接方 · ${short}`
        row.amountUsdt = 0
        row.status = '已划转'
      } else if (t.status === 'cancelled') {
        row.title = `发布任务 · 已取消 · 赏金退回 · ${short}`
        row.amountUsdt = 0
        row.status = '已取消'
      }
    },

    /** 演示：仅「待支付」阶段可取消；卖单会解冻 USDT */
    otcCancelOrder(orderId: string) {
      const o = this.otcOrders.find((x) => x.id === orderId)
      if (!o) {
        toast('订单不存在', 'error')
        return
      }
      if (o.status === 'completed' || o.status === 'cancelled') {
        toast('订单已结束', 'warning')
        return
      }
      if (o.status !== 'pending_payment') {
        toast('当前阶段不可取消（演示仅支持待支付）', 'warning')
        return
      }
      if (o.side === 'sell') {
        this.frozenUsdt -= o.amountUsdt
        this.availableUsdt += o.amountUsdt
      }
      o.status = 'cancelled'
      const row = this.ledger.find((l) => l.relatedId === o.id && (l.kind === 'otc_buy' || l.kind === 'otc_sell'))
      if (row) {
        row.title =
          o.side === 'buy'
            ? `买入 USDT · 已取消 · ${o.merchantName}`
            : `卖出 USDT · 已取消 · ${o.merchantName}`
        row.status = '已取消'
      }
      this.persist()
      this.pushInboxNotification({
        title: 'OTC · 订单已取消',
        preview: `${o.side === 'buy' ? '买入' : '卖出'} · ${o.merchantName}`,
        body: `订单已关闭。${o.side === 'sell' ? '冻结 USDT 已退回可用余额。' : ''}`,
        linkType: 'order',
        linkId: o.id,
      })
      toast('订单已取消', 'info')
    },

    /** 发布方取消「待接单」任务；托管赏金退回可用 */
    cancelPublishedTask(taskId: string) {
      const t = this.tasks.find((x) => x.id === taskId)
      if (!t || t.publisherId !== DEMO_USER) {
        toast('仅发布方可取消', 'warning')
        return
      }
      if (t.status !== 'open') {
        toast('仅「待接单」状态可取消', 'warning')
        return
      }
      if (t.needEscrow) {
        this.availableUsdt += t.rewardUsdt
        this.escrowTaskUsdt -= t.rewardUsdt
      }
      t.status = 'cancelled'
      this.syncTaskEscrowLedger(t)
      this.persist()
      this.pushInboxNotification({
        title: '任务 · 已取消',
        preview: t.title.slice(0, 24),
        body: t.needEscrow ? '托管赏金已退回可用余额。' : '任务已从市场下架。',
        linkType: 'task',
        linkId: t.id,
      })
      toast('任务已取消', 'info')
    },

    /** 托管「仅锁定中」取消，全额退回可用 */
    escrowCancelHolding(id: string) {
      const e = this.escrows.find((x) => x.id === id)
      if (!e || e.status !== 'holding') {
        toast('仅「托管中」可取消', 'warning')
        return
      }
      this.availableUsdt += e.amountUsdt
      this.escrowDealUsdt -= e.amountUsdt
      e.status = 'cancelled'
      this.syncEscrowLockLedger(e)
      this.persist()
      this.pushInboxNotification({
        title: '托管 · 已取消',
        preview: `${e.title.slice(0, 18)} · ${e.amountUsdt} USDT`,
        body: '锁定资金已退回可用余额（演示）。',
        linkType: 'escrow',
        linkId: e.id,
      })
      toast('托管已取消，资金已退回', 'success')
    },

    /** 流水详情：将「处理中」提现标为已完成（演示） */
    simulateWithdrawLedgerComplete(ledgerRowId: string) {
      const row = this.ledger.find((x) => x.id === ledgerRowId && x.kind === 'withdraw')
      if (!row) {
        toast('记录不存在', 'error')
        return
      }
      if (row.status !== '处理中') {
        toast('当前状态无需操作', 'info')
        return
      }
      row.status = '已完成'
      row.title = row.title.includes('提现申请')
        ? row.title.replace('提现申请', '提现已完成（演示）')
        : `提现已完成（演示） · ${row.title.slice(0, 14)}`
      this.persist()
      this.pushInboxNotification({
        title: '资产 · 提现已完成',
        preview: '审核/链上通过（演示）',
        body: '该笔提现已标记完成。申请时已从可用余额扣减，此处仅更新流水状态。',
        linkType: 'assets',
      })
      toast('提现已标记完成（演示）', 'success')
    },

    publishTask(payload: {
      title: string
      category: string
      description: string
      rewardUsdt: number
      deadline: string
      needEscrow: boolean
      attachmentNames: string[]
    }) {
      const taskId = genId('t')
      if (payload.needEscrow) {
        if (this.availableUsdt < payload.rewardUsdt) {
          toast('可用余额不足以锁定赏金', 'error')
          return null
        }
        this.availableUsdt -= payload.rewardUsdt
        this.escrowTaskUsdt += payload.rewardUsdt
        this.pushLedger({
          kind: 'task_out',
          title: `发布任务 · 赏金锁定 · ${payload.title.slice(0, 16)}`,
          amountUsdt: -payload.rewardUsdt,
          status: '托管中',
          relatedId: taskId,
        })
      }
      const task: TaskItem = {
        id: taskId,
        title: payload.title,
        category: payload.category,
        description: payload.description,
        rewardUsdt: payload.rewardUsdt,
        deadline: payload.deadline,
        needEscrow: payload.needEscrow,
        status: 'open',
        publisherId: DEMO_USER,
        attachmentNames: [...payload.attachmentNames],
      }
      this.tasks.unshift(task)
      this.persist()
      this.pushInboxNotification({
        title: '任务 · 发布成功',
        preview: task.title.slice(0, 28),
        body: `您发布的任务已进入市场${
          payload.needEscrow ? '，赏金已锁定在托管中。' : '。'
        }可在「我的任务」查看进度。`,
        linkType: 'task',
        linkId: task.id,
      })
      toast('任务已发布')
      return task
    },

    publishService(payload: { title: string; category: string; description: string; priceUsdt: number }) {
      if (!payload.title.trim()) {
        toast('请填写服务标题', 'warning')
        return null
      }
      if (payload.priceUsdt <= 0) {
        toast('标价需大于 0', 'warning')
        return null
      }
      const s: ServiceListing = {
        id: genId('sv'),
        title: payload.title.trim(),
        category: payload.category,
        description: payload.description.trim(),
        priceUsdt: payload.priceUsdt,
        sellerId: DEMO_USER,
        sellerName: this.user.nickname,
        createdAt: Date.now(),
      }
      this.services.unshift(s)
      this.persist()
      this.pushInboxNotification({
        title: '服务 · 上架成功',
        preview: `${s.title.slice(0, 24)} · ${s.priceUsdt} USDT`,
        body: '您的服务已出现在「市场 · 服务」列表，买家可发起意向沟通（演示）。',
        linkType: 'service',
        linkId: s.id,
      })
      toast('服务已上架')
      return s
    },

    /** 买家对服务表达意向（演示：无真实 IM） */
    expressServiceInterest(serviceId: string) {
      const s = this.services.find((x) => x.id === serviceId)
      if (!s) {
        toast('服务不存在', 'error')
        return
      }
      if (s.sellerId === DEMO_USER) {
        toast('这是您上架的服务', 'info')
        return
      }
      this.pushInboxNotification({
        title: '服务 · 意向已发送',
        preview: `您对「${s.title.slice(0, 18)}…」表达了购买意向`,
        body: `演示环境：已通知卖家（模拟）。服务标价 ${s.priceUsdt} USDT，请通过平台内后续流程完成交易（正式环境对接客服/IM）。`,
        linkType: 'service',
        linkId: s.id,
      })
      toast('已发送意向，卖家将尽快联系（演示）', 'success')
    },

    acceptTask(taskId: string): boolean {
      const t = this.tasks.find((x) => x.id === taskId)
      if (!t || t.status !== 'open') {
        toast('任务不可接', 'warning')
        return false
      }
      if (t.publisherId === DEMO_USER) {
        toast('不能接自己发布的任务', 'warning')
        return false
      }
      t.acceptedBy = DEMO_USER
      t.status = 'in_progress'
      this.syncTaskEscrowLedger(t)
      this.persist()
      this.pushInboxNotification({
        title: '任务 · 接单成功',
        preview: `您已承接「${t.title.slice(0, 22)}${t.title.length > 22 ? '…' : ''}」`,
        body: '请在截止日期前完成交付，并在任务详情提交交付说明。验收通过后赏金将按规则结算。',
        linkType: 'task',
        linkId: t.id,
      })
      toast('接单成功，祝交付顺利！')
      return true
    },

    submitTaskDelivery(taskId: string) {
      const t = this.tasks.find((x) => x.id === taskId)
      if (!t || t.acceptedBy !== DEMO_USER || t.status !== 'in_progress') {
        toast('当前不可提交交付', 'warning')
        return
      }
      t.status = 'delivered'
      this.syncTaskEscrowLedger(t)
      this.persist()
      this.pushInboxNotification({
        title: '任务 · 交付已提交',
        preview: t.title.slice(0, 24),
        body: '已通知发布方验收；请等待对方在任务详情确认完成。',
        linkType: 'task',
        linkId: t.id,
      })
      toast('已提交交付，等待发布方确认')
    },

    confirmTaskDone(taskId: string) {
      const t = this.tasks.find((x) => x.id === taskId)
      if (!t || t.publisherId !== DEMO_USER) {
        toast('仅发布方可确认验收', 'warning')
        return
      }
      if (t.status !== 'delivered' && t.status !== 'pending_confirm_done') {
        toast('请先等待承接方提交交付', 'warning')
        return
      }
      t.status = 'completed'
      if (t.needEscrow && t.acceptedBy) {
        this.escrowTaskUsdt -= t.rewardUsdt
        /** 与锁定流水同一行联动，不重复记账 */
        this.syncTaskEscrowLedger(t)
      } else if (!t.needEscrow) {
        this.pushLedger({
          kind: 'task_in',
          title: `任务完成 · ${t.title.slice(0, 12)}`,
          amountUsdt: 0,
          status: '已完成',
          relatedId: t.id,
        })
      }
      this.persist()
      this.pushInboxNotification({
        title: '任务 · 验收完成',
        preview: t.title.slice(0, 24),
        body: t.needEscrow
          ? '托管赏金已从任务托管划出并结算给承接方（演示单钱包：不增加您的可用余额）。'
          : '任务已关闭，感谢使用演示环境。',
        linkType: 'task',
        linkId: t.id,
      })
      toast(
        t.needEscrow
          ? '验收完成，赏金已从托管划转承接方（演示）'
          : '已确认完成（演示）',
        'success',
      )
    },

    createEscrow(payload: {
      title: string
      counterparty: string
      description: string
      amountUsdt: number
      deliveryMethod: string
      proofNames: string[]
    }) {
      if (this.availableUsdt < payload.amountUsdt) {
        toast('可用余额不足', 'error')
        return null
      }
      this.availableUsdt -= payload.amountUsdt
      this.escrowDealUsdt += payload.amountUsdt
      const e: EscrowItem = {
        id: genId('e'),
        title: payload.title,
        counterparty: payload.counterparty,
        description: payload.description,
        amountUsdt: payload.amountUsdt,
        deliveryMethod: payload.deliveryMethod,
        status: 'holding',
        createdAt: Date.now(),
        proofNames: [...payload.proofNames],
      }
      this.escrows.unshift(e)
      this.pushLedger({
        kind: 'escrow_lock',
        title: `担保托管 · 锁定 · ${payload.title.slice(0, 12)}`,
        amountUsdt: -payload.amountUsdt,
        status: '托管中',
        relatedId: e.id,
      })
      this.persist()
      this.pushInboxNotification({
        title: '担保 · 托管已创建',
        preview: `${payload.title.slice(0, 20)} · ${payload.amountUsdt} USDT`,
        body: `资金已锁定。请按约定交付，双方确认收货后可执行放款。托管 ID：${e.id}`,
        linkType: 'escrow',
        linkId: e.id,
      })
      toast('托管已创建，资金已锁定')
      return e
    },

    escrowSubmitDelivery(id: string) {
      const e = this.escrows.find((x) => x.id === id)
      if (!e || e.status !== 'holding') return
      e.status = 'delivered'
      this.syncEscrowLockLedger(e)
      this.persist()
      this.pushInboxNotification({
        title: '托管 · 已提交交付',
        preview: e.title.slice(0, 20),
        body: '请交易对方在托管详情确认收货后继续放款流程。',
        linkType: 'escrow',
        linkId: e.id,
      })
      toast('已标记交付')
    },

    escrowConfirmReceive(id: string) {
      const e = this.escrows.find((x) => x.id === id)
      if (!e || e.status !== 'delivered') return
      e.status = 'pending_release'
      this.syncEscrowLockLedger(e)
      this.persist()
      this.pushInboxNotification({
        title: '托管 · 已确认收货',
        preview: e.title.slice(0, 20),
        body: '可进行放款操作，资金将按演示规则退回可用余额。',
        linkType: 'escrow',
        linkId: e.id,
      })
      toast('已确认收货，可执行放款')
    },

    escrowRelease(id: string) {
      const e = this.escrows.find((x) => x.id === id)
      if (!e || e.status !== 'pending_release') {
        toast('请先完成收货确认', 'warning')
        return
      }
      this.escrowDealUsdt -= e.amountUsdt
      this.availableUsdt += e.amountUsdt
      e.status = 'completed'
      this.syncEscrowLockLedger(e)
      this.pushLedger({
        kind: 'escrow_release',
        title: `担保托管 · 放款完成 · ${e.title.slice(0, 12)}`,
        amountUsdt: e.amountUsdt,
        status: '已完成',
        relatedId: e.id,
      })
      this.persist()
      this.pushInboxNotification({
        title: '托管 · 放款完成',
        preview: `${e.amountUsdt} USDT 已释放`,
        body: `托管「${e.title.slice(0, 16)}」已结束，余额已更新。`,
        linkType: 'escrow',
        linkId: e.id,
      })
      toast('放款完成，资金已释放（演示退回可用余额）', 'success')
    },

    withdrawApply(address: string, amountUsdt: number) {
      if (amountUsdt <= 0) {
        toast('金额无效', 'warning')
        return
      }
      if (this.availableUsdt < amountUsdt) {
        toast('可用余额不足', 'error')
        return
      }
      this.availableUsdt -= amountUsdt
      this.pushLedger({
        kind: 'withdraw',
        title: `提现申请 · ${address.slice(0, 10)}…`,
        amountUsdt: -amountUsdt,
        status: '处理中',
      })
      this.persist()
      this.pushInboxNotification({
        title: '资产 · 提现已提交',
        preview: `${amountUsdt} USDT · 处理中`,
        body: `提现至 ${address.slice(0, 14)}… 已进入审核队列（演示）。可在资金记录查看状态。`,
        linkType: 'assets',
      })
      toast('提现已提交（演示）', 'success')
    },

    simulateDeposit(amountUsdt: number) {
      if (amountUsdt <= 0) return
      this.availableUsdt += amountUsdt
      this.pushLedger({
        kind: 'deposit',
        title: '充值到账（模拟）',
        amountUsdt,
        status: '已完成',
      })
      this.persist()
      this.pushInboxNotification({
        title: '资产 · 充值到账',
        preview: `+${amountUsdt} USDT`,
        body: '模拟充值已入账，可在资金流水查看记录。',
        linkType: 'assets',
      })
      toast(`+${amountUsdt} USDT 充值成功（模拟）`)
    },

    async simulateListLoad() {
      this.listLoading = true
      await new Promise((r) => setTimeout(r, 400))
      this.listLoading = false
    },
  },
})
