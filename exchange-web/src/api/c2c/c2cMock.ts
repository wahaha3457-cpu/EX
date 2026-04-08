import type {
  C2cAd,
  C2cAppealRecord,
  C2cAppealReason,
  C2cAppealTimelineEvent,
  C2cChatMessage,
  C2cOrder,
  C2cOrderStatus,
  C2cPayMethod,
  C2cPaymentLine,
} from '@/types/c2c'

function mockSellerPayments(methods: C2cPayMethod[], orderId: string): C2cPaymentLine[] {
  const ref = orderId.replace(/[^a-zA-Z0-9]/g, '').slice(-8).toUpperCase() || 'C2CDEMO'
  return methods.map((m, i) => {
    const memo = `C2C${ref.slice(-6)}`
    if (m === 'bank') {
      return {
        method: m,
        bankName: '招商银行（演示）',
        accountMask: `6225 **** **** ${String(1000 + ((i + 3) * 7919) % 9000)}`,
        holder: '张**',
        transferMemo: memo,
      }
    }
    if (m === 'alipay') {
      return {
        method: m,
        accountMask: `138****${String(1000 + i * 2111).slice(-4)}`,
        holder: '支**',
        transferMemo: memo,
      }
    }
    return {
      method: m,
      accountMask: `wxid_***${String((i + 9) * 131 % 9000)}`,
      holder: '微**',
      transferMemo: memo,
    }
  })
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

function lsKey(userCode: string) {
  return `ex.c2c.orders.${userCode}`
}

function readOrders(userCode: string): C2cOrder[] {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(lsKey(userCode))
    if (!raw) return []
    return JSON.parse(raw) as C2cOrder[]
  } catch {
    return []
  }
}

function writeOrders(userCode: string, orders: C2cOrder[]) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(lsKey(userCode), JSON.stringify(orders))
}

const MERCHANTS: C2cAd['merchant'][] = [
  {
    id: 'm1',
    displayName: '承兑_极速',
    trades30d: 1288,
    completionRate: 0.993,
    avgReleaseMin: 3,
    badges: [
      { key: 'pro', label: '认证商家' },
      { key: 'fast', label: '平均 3 分钟放币' },
    ],
  },
  {
    id: 'm2',
    displayName: '币安优选店',
    trades30d: 5620,
    completionRate: 0.998,
    avgReleaseMin: 5,
    badges: [{ key: 'pro', label: '认证商家' }],
  },
  {
    id: 'm3',
    displayName: '老用户_阿强',
    trades30d: 420,
    completionRate: 0.981,
    avgReleaseMin: 8,
    badges: [{ key: 'diamond', label: '钻石' }],
  },
  {
    id: 'm4',
    displayName: 'OTC_星辰',
    trades30d: 2100,
    completionRate: 0.995,
    avgReleaseMin: 4,
    badges: [
      { key: 'pro', label: '认证商家' },
      { key: 'fast', label: '5 分钟内' },
    ],
  },
  {
    id: 'm5',
    displayName: '小额友好',
    trades30d: 890,
    completionRate: 0.988,
    avgReleaseMin: 12,
    badges: [],
  },
]

function buildAds(): C2cAd[] {
  const rows: C2cAd[] = []
  let id = 0
  const mk = (partial: Omit<C2cAd, 'id' | 'merchant'> & { merchantIdx: number }): C2cAd => {
    id += 1
    const { merchantIdx, ...rest } = partial
    return {
      id: `ad-${id}`,
      ...rest,
      merchant: MERCHANTS[merchantIdx % MERCHANTS.length]!,
    }
  }

  // CNY / USDT — 买（商家卖）
  rows.push(
    mk({
      listingSide: 'MERCHANT_SELLS',
      fiat: 'CNY',
      crypto: 'USDT',
      price: 7.18,
      minFiat: 200,
      maxFiat: 50_000,
      availableCrypto: 120_000,
      methods: ['bank', 'alipay'],
      merchantIdx: 0,
      tag: '免手续费',
    }),
    mk({
      listingSide: 'MERCHANT_SELLS',
      fiat: 'CNY',
      crypto: 'USDT',
      price: 7.19,
      minFiat: 500,
      maxFiat: 100_000,
      availableCrypto: 88_000,
      methods: ['bank', 'wechat', 'alipay'],
      merchantIdx: 1,
    }),
    mk({
      listingSide: 'MERCHANT_SELLS',
      fiat: 'CNY',
      crypto: 'USDT',
      price: 7.2,
      minFiat: 100,
      maxFiat: 20_000,
      availableCrypto: 15_000,
      methods: ['alipay'],
      merchantIdx: 2,
    }),
    mk({
      listingSide: 'MERCHANT_SELLS',
      fiat: 'CNY',
      crypto: 'USDT',
      price: 7.17,
      minFiat: 1000,
      maxFiat: 200_000,
      availableCrypto: 500_000,
      methods: ['bank'],
      merchantIdx: 3,
      tag: '大额专享',
    }),
    mk({
      listingSide: 'MERCHANT_SELLS',
      fiat: 'CNY',
      crypto: 'USDT',
      price: 7.21,
      minFiat: 50,
      maxFiat: 5000,
      availableCrypto: 8000,
      methods: ['wechat', 'alipay'],
      merchantIdx: 4,
    }),
  )

  // CNY / USDT — 卖（商家收）
  rows.push(
    mk({
      listingSide: 'MERCHANT_BUYS',
      fiat: 'CNY',
      crypto: 'USDT',
      price: 7.22,
      minFiat: 300,
      maxFiat: 80_000,
      availableCrypto: 200_000,
      methods: ['bank', 'alipay'],
      merchantIdx: 1,
    }),
    mk({
      listingSide: 'MERCHANT_BUYS',
      fiat: 'CNY',
      crypto: 'USDT',
      price: 7.23,
      minFiat: 200,
      maxFiat: 30_000,
      availableCrypto: 45_000,
      methods: ['bank', 'wechat'],
      merchantIdx: 0,
    }),
    mk({
      listingSide: 'MERCHANT_BUYS',
      fiat: 'CNY',
      crypto: 'USDT',
      price: 7.24,
      minFiat: 1000,
      maxFiat: 150_000,
      availableCrypto: 320_000,
      methods: ['bank'],
      merchantIdx: 3,
      tag: '企业认证',
    }),
  )

  // USD
  rows.push(
    mk({
      listingSide: 'MERCHANT_SELLS',
      fiat: 'USD',
      crypto: 'USDT',
      price: 1.001,
      minFiat: 50,
      maxFiat: 20_000,
      availableCrypto: 400_000,
      methods: ['bank'],
      merchantIdx: 1,
    }),
    mk({
      listingSide: 'MERCHANT_BUYS',
      fiat: 'USD',
      crypto: 'USDT',
      price: 0.998,
      minFiat: 100,
      maxFiat: 50_000,
      availableCrypto: 250_000,
      methods: ['bank'],
      merchantIdx: 4,
    }),
  )

  // BTC / CNY 卖
  rows.push(
    mk({
      listingSide: 'MERCHANT_SELLS',
      fiat: 'CNY',
      crypto: 'BTC',
      price: 612_800,
      minFiat: 5000,
      maxFiat: 500_000,
      availableCrypto: 12.5,
      methods: ['bank'],
      merchantIdx: 3,
      tag: '链上可查',
    }),
    mk({
      listingSide: 'MERCHANT_BUYS',
      fiat: 'CNY',
      crypto: 'BTC',
      price: 611_200,
      minFiat: 10_000,
      maxFiat: 800_000,
      availableCrypto: 8,
      methods: ['bank', 'alipay'],
      merchantIdx: 1,
    }),
  )

  return rows
}

const STATIC_ADS = buildAds()

export async function fetchC2cAds(): Promise<C2cAd[]> {
  await delay(100)
  return STATIC_ADS.map((a) => ({
    ...a,
    merchant: { ...a.merchant, badges: a.merchant.badges.map((b) => ({ ...b })) },
  }))
}

export async function fetchC2cOrders(userCode: string): Promise<C2cOrder[]> {
  await delay(70)
  return readOrders(userCode).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export interface CreateC2cOrderPayload {
  ad: C2cAd
  userSide: 'buy' | 'sell'
  fiatAmount: number
}

export async function createC2cOrder(userCode: string, payload: CreateC2cOrderPayload): Promise<C2cOrder> {
  await delay(180)
  const cryptoAmount = Math.round((payload.fiatAmount / payload.ad.price) * 1e8) / 1e8
  const id = `c2c-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  const order: C2cOrder = {
    id,
    adId: payload.ad.id,
    userSide: payload.userSide,
    fiat: payload.ad.fiat,
    crypto: payload.ad.crypto,
    fiatAmount: Math.round(payload.fiatAmount * 100) / 100,
    cryptoAmount,
    price: payload.ad.price,
    status: 'pending_payment',
    counterpartyMasked: `${payload.ad.merchant.displayName.slice(0, 2)}***`,
    methods: [...payload.ad.methods],
    merchantDisplayName: payload.ad.merchant.displayName,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    payDeadlineAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    sellerPayments: payload.userSide === 'buy' ? mockSellerPayments(payload.ad.methods, id) : undefined,
  }
  const list = readOrders(userCode)
  list.unshift(order)
  writeOrders(userCode, list)
  return order
}

export async function patchC2cOrderStatus(
  userCode: string,
  orderId: string,
  status: C2cOrderStatus,
): Promise<C2cOrder | null> {
  await delay(100)
  const list = readOrders(userCode)
  const i = list.findIndex((o) => o.id === orderId)
  if (i < 0) return null
  const next = { ...list[i]!, status, updatedAt: new Date().toISOString() }
  list[i] = next
  writeOrders(userCode, list)
  return next
}

// —— 订单聊天（演示：按 orderId 存 localStorage，无后端） ——

function chatLsKey(orderId: string) {
  return `ex.c2c.chat.${orderId}`
}

function readChatMessages(orderId: string): C2cChatMessage[] {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(chatLsKey(orderId))
    if (!raw) return []
    const arr = JSON.parse(raw) as C2cChatMessage[]
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

function writeChatMessages(orderId: string, messages: C2cChatMessage[]) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(chatLsKey(orderId), JSON.stringify(messages))
}

function cmUid() {
  return `cm-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/** 拉取聊天记录（按时间升序） */
export async function fetchC2cChatMessages(orderId: string): Promise<C2cChatMessage[]> {
  await delay(40)
  return [...readChatMessages(orderId)].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

/** 首条对方欢迎语（仅空会话时写入） */
export async function ensureC2cChatWelcome(
  orderId: string,
  params: {
    merchantDisplayName: string
    userSide: 'buy' | 'sell'
    fiatAmount: number
    fiat: string
    cryptoAmount: number
    crypto: string
  },
): Promise<void> {
  await delay(20)
  const list = readChatMessages(orderId)
  if (list.length) return
  const text =
    params.userSide === 'buy'
      ? `您好，我是 ${params.merchantDisplayName}。请按订单支付 ${params.fiatAmount} ${params.fiat}（约 ${params.cryptoAmount} ${params.crypto}），转账后请在此留言以便核对。请勿脱离平台私下交易。`
      : `您好，我是 ${params.merchantDisplayName}。您的卖单 ${params.cryptoAmount} ${params.crypto} 已冻结；买家付款后我会在此与您确认收款与放币。请勿脱离平台私下交易。`
  const m: C2cChatMessage = {
    id: cmUid(),
    orderId,
    sender: 'counterparty',
    text,
    createdAt: new Date().toISOString(),
  }
  writeChatMessages(orderId, [m])
}

/** 发送消息（用户或演示对方） */
export async function sendC2cChatMessage(
  orderId: string,
  text: string,
  sender: 'user' | 'counterparty',
): Promise<C2cChatMessage[]> {
  await delay(50)
  const t = text.trim()
  if (!t) return fetchC2cChatMessages(orderId)
  const list = readChatMessages(orderId)
  list.push({
    id: cmUid(),
    orderId,
    sender,
    text: t,
    createdAt: new Date().toISOString(),
  })
  writeChatMessages(orderId, list)
  return fetchC2cChatMessages(orderId)
}

// —— 申诉工单（演示：localStorage） ——

const APPEAL_REASON_LABEL: Record<C2cAppealReason, string> = {
  paid_not_release: '已付款，对方未放币 / 未确认收款',
  wrong_amount: '付款金额或备注与订单不一致',
  payment_not_received: '未收到买方付款（卖方）',
  malicious_behavior: '对方要求私下交易或存在恶意行为',
  other: '其他原因',
}

function appealLsKey(orderId: string) {
  return `ex.c2c.appeal.${orderId}`
}

function readAppeal(orderId: string): C2cAppealRecord | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(appealLsKey(orderId))
    if (!raw) return null
    return JSON.parse(raw) as C2cAppealRecord
  } catch {
    return null
  }
}

function writeAppeal(orderId: string, rec: C2cAppealRecord) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(appealLsKey(orderId), JSON.stringify(rec))
}

function removeAppeal(orderId: string) {
  if (typeof localStorage === 'undefined') return
  localStorage.removeItem(appealLsKey(orderId))
}

function tlUid() {
  return `tl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export async function fetchC2cAppeal(orderId: string): Promise<C2cAppealRecord | null> {
  await delay(40)
  return readAppeal(orderId)
}

export interface SubmitC2cAppealPayload {
  reason: C2cAppealReason
  detail: string
}

/** 发起申诉：仅「待放币」可提交（对齐币安：争议多发生在付款后） */
export async function submitC2cAppeal(
  userCode: string,
  orderId: string,
  payload: SubmitC2cAppealPayload,
): Promise<{ order: C2cOrder; appeal: C2cAppealRecord } | null> {
  await delay(120)
  const list = readOrders(userCode)
  const i = list.findIndex((o) => o.id === orderId)
  if (i < 0) return null
  const cur = list[i]!
  if (cur.status !== 'pending_release') return null
  const detail = payload.detail.trim()
  if (detail.length < 8) return null

  const ticketId = `AP-${Date.now().toString(36).toUpperCase()}`
  const now = new Date().toISOString()
  const tUser: C2cAppealTimelineEvent = {
    id: tlUid(),
    at: now,
    kind: 'user',
    title: '已提交申诉',
    detail: `${APPEAL_REASON_LABEL[payload.reason]}：${detail}`,
  }
  const appeal: C2cAppealRecord = {
    ticketId,
    orderId,
    reason: payload.reason,
    reasonLabel: APPEAL_REASON_LABEL[payload.reason],
    detail,
    stage: 'submitted',
    createdAt: now,
    updatedAt: now,
    timeline: [tUser],
  }
  writeAppeal(orderId, appeal)

  const nextOrder: C2cOrder = {
    ...cur,
    status: 'appeal',
    appealTicketId: ticketId,
    updatedAt: now,
  }
  list[i] = nextOrder
  writeOrders(userCode, list)

  window.setTimeout(() => {
    const a = readAppeal(orderId)
    if (!a || a.stage !== 'submitted') return
    const t2: C2cAppealTimelineEvent = {
      id: tlUid(),
      at: new Date().toISOString(),
      kind: 'cs',
      title: '客服已接单',
      detail: '工作人员将核对双方凭证与订单聊天记录；您也可通过在线客服补充材料（演示）。',
    }
    a.timeline.push(t2)
    a.stage = 'cs_processing'
    a.updatedAt = t2.at
    writeAppeal(orderId, a)
  }, 650)

  return { order: nextOrder, appeal }
}

/** 撤诉：回到待放币，删除申诉单（演示） */
export async function withdrawC2cAppeal(userCode: string, orderId: string): Promise<C2cOrder | null> {
  await delay(100)
  const list = readOrders(userCode)
  const i = list.findIndex((o) => o.id === orderId)
  if (i < 0) return null
  const cur = list[i]!
  if (cur.status !== 'appeal') return null
  const appeal = readAppeal(orderId)
  if (appeal?.stage === 'resolved') return null

  removeAppeal(orderId)
  const now = new Date().toISOString()
  const nextOrder: C2cOrder = {
    ...cur,
    status: 'pending_release',
    appealTicketId: undefined,
    updatedAt: now,
  }
  list[i] = nextOrder
  writeOrders(userCode, list)
  return nextOrder
}

/** 演示：客服裁定后同步订单终态（与 setOrderStatus 资产逻辑在 store 层调用） */
export async function markC2cAppealResolved(orderId: string, note: string): Promise<C2cAppealRecord | null> {
  await delay(40)
  const a = readAppeal(orderId)
  if (!a) return null
  const t: C2cAppealTimelineEvent = {
    id: tlUid(),
    at: new Date().toISOString(),
    kind: 'system',
    title: '申诉已结案',
    detail: note,
  }
  a.timeline.push(t)
  a.stage = 'resolved'
  a.updatedAt = t.at
  writeAppeal(orderId, a)
  return a
}

/** 历史订单已标为申诉但无工单数据时补齐（迁移） */
export async function ensureLegacyAppealStub(userCode: string, orderId: string): Promise<C2cAppealRecord | null> {
  await delay(20)
  const list = readOrders(userCode)
  const o = list.find((x) => x.id === orderId)
  if (!o || o.status !== 'appeal') return null
  if (readAppeal(orderId)) return readAppeal(orderId)
  const now = new Date().toISOString()
  const ticketId = `AP-LEGACY-${orderId.slice(-10)}`
  const appeal: C2cAppealRecord = {
    ticketId,
    orderId,
    reason: 'other',
    reasonLabel: APPEAL_REASON_LABEL.other,
    detail: '（演示）历史申诉记录已自动补齐，请使用在线客服继续沟通。',
    stage: 'cs_processing',
    createdAt: now,
    updatedAt: now,
    timeline: [
      {
        id: tlUid(),
        at: now,
        kind: 'system',
        title: '申诉记录已同步',
        detail: '若需补充材料，请联系在线客服并说明订单号。',
      },
    ],
  }
  writeAppeal(orderId, appeal)
  const idx = list.findIndex((x) => x.id === orderId)
  if (idx >= 0) {
    list[idx] = { ...list[idx]!, appealTicketId: ticketId }
    writeOrders(userCode, list)
  }
  return appeal
}
