/** 移动端可交互演示 — 数据模型（Mock / 可对接真 API） */

export type OtcOrderStatus =
  | 'pending_payment'
  | 'pending_confirm'
  | 'pending_release'
  | 'completed'
  | 'cancelled'

export type TaskStatus =
  | 'open'
  | 'in_progress'
  | 'delivered'
  | 'pending_confirm_done'
  | 'completed'
  | 'cancelled'

export type EscrowStatus =
  | 'holding'
  | 'delivered'
  | 'pending_release'
  | 'completed'
  | 'cancelled'

export interface Merchant {
  id: string
  name: string
  priceCny: number
  limitMin: number
  limitMax: number
  completionRate: number
  payMethods: string[]
  responseNote: string
}

export interface OtcOrder {
  id: string
  side: 'buy' | 'sell'
  merchantId: string
  merchantName: string
  amountUsdt: number
  totalCny: number
  status: OtcOrderStatus
  createdAt: number
}

export interface TaskItem {
  id: string
  title: string
  category: string
  description: string
  rewardUsdt: number
  deadline: string
  needEscrow: boolean
  status: TaskStatus
  publisherId: string
  acceptedBy?: string
  attachmentNames: string[]
}

export interface EscrowItem {
  id: string
  title: string
  counterparty: string
  description: string
  amountUsdt: number
  deliveryMethod: string
  status: EscrowStatus
  createdAt: number
  proofNames: string[]
}

export type LedgerKind =
  | 'task_in'
  | 'task_out'
  | 'escrow_lock'
  | 'escrow_release'
  | 'otc_buy'
  | 'otc_sell'
  | 'withdraw'
  | 'deposit'
  | 'fee'

export interface LedgerRow {
  id: string
  kind: LedgerKind
  title: string
  amountUsdt: number
  at: number
  status: string
  relatedId?: string
}

export interface MobileDemoUser {
  nickname: string
  uid: string
  creditScore: number
  levelLabel: string
  badges: string[]
}

export interface ServiceListing {
  id: string
  title: string
  category: string
  description: string
  priceUsdt: number
  sellerId: string
  sellerName: string
  createdAt: number
}

/** 消息中心（演示：与订单/任务等联动） */
export type InboxLinkType = 'task' | 'order' | 'escrow' | 'assets' | 'service' | 'none'

export interface DemoInboxItem {
  id: string
  title: string
  preview: string
  body: string
  at: number
  read: boolean
  linkType: InboxLinkType
  /** task / order / escrow id */
  linkId?: string
}
