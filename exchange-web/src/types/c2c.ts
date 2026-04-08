/** C2C / P2P 法币交易（演示域模型，可对齐币安 P2P 流程） */

/** 广告方向：商家卖币 ↔ 用户买；商家收币 ↔ 用户卖 */
export type C2cListingSide = 'MERCHANT_SELLS' | 'MERCHANT_BUYS'

export type C2cPayMethod = 'bank' | 'alipay' | 'wechat'

export interface C2cMerchantBadge {
  key: string
  label: string
}

export interface C2cMerchant {
  id: string
  displayName: string
  trades30d: number
  /** 0–1 */
  completionRate: number
  avgReleaseMin: number
  badges: C2cMerchantBadge[]
}

export interface C2cAd {
  id: string
  listingSide: C2cListingSide
  fiat: string
  crypto: string
  /** 1 crypto 的法币价格 */
  price: number
  minFiat: number
  maxFiat: number
  availableCrypto: number
  methods: C2cPayMethod[]
  merchant: C2cMerchant
  tag?: string
}

export type C2cOrderStatus =
  | 'pending_payment'
  | 'pending_release'
  | 'completed'
  | 'cancelled'
  | 'appeal'

/** 卖家收款信息（演示，勿填真实卡号） */
export interface C2cPaymentLine {
  method: C2cPayMethod
  bankName?: string
  /** 脱敏账号 */
  accountMask: string
  holder: string
  /** 转账备注要求 */
  transferMemo?: string
}

/** 订单内即时沟通（演示：localStorage，对齐 P2P 聊天场景） */
export interface C2cChatMessage {
  id: string
  orderId: string
  /** 当前登录用户 / 交易对手（商家或买家侧由演示统一为「对方」） */
  sender: 'user' | 'counterparty'
  text: string
  createdAt: string
}

/** 申诉原因（参考 P2P 常见类型） */
export type C2cAppealReason =
  | 'paid_not_release'
  | 'wrong_amount'
  | 'payment_not_received'
  | 'malicious_behavior'
  | 'other'

/**
 * 申诉单阶段：提交 → 客服处理 → 结案/撤诉
 * 演示用 localStorage，生产应对接工单与 IM
 */
export type C2cAppealStage = 'submitted' | 'cs_processing' | 'resolved' | 'withdrawn'

export interface C2cAppealTimelineEvent {
  id: string
  at: string
  kind: 'user' | 'system' | 'cs'
  title: string
  detail?: string
}

export interface C2cAppealRecord {
  ticketId: string
  orderId: string
  reason: C2cAppealReason
  reasonLabel: string
  detail: string
  stage: C2cAppealStage
  createdAt: string
  updatedAt: string
  timeline: C2cAppealTimelineEvent[]
}

export interface C2cOrder {
  id: string
  adId: string
  userSide: 'buy' | 'sell'
  fiat: string
  crypto: string
  fiatAmount: number
  cryptoAmount: number
  price: number
  status: C2cOrderStatus
  counterpartyMasked: string
  methods: C2cPayMethod[]
  merchantDisplayName: string
  createdAt: string
  updatedAt: string
  payDeadlineAt?: string
  /** 买入待付款时展示；卖出单为空 */
  sellerPayments?: C2cPaymentLine[]
  /** 关联申诉工单号（status 为 appeal 时通常有值） */
  appealTicketId?: string
}
