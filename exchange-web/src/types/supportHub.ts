/** 公告中心 / 活动中心 / 客服中心 — 域模型（演示，可对接运营与工单 API） */

export type AnnounceCategory = 'SYSTEM' | 'MAINTENANCE' | 'LISTING' | 'ACTIVITY' | 'RISK' | 'OTHER'

export interface AnnounceCenterItem {
  id: string
  title: string
  category: AnnounceCategory
  publishedAt: string
  pinned?: boolean
  summary: string
  /** 正文段落（纯文本，避免 v-html 风险） */
  paragraphs: string[]
}

export type ActivityStatus = 'ONGOING' | 'UPCOMING' | 'ENDED'

export interface ActivityCenterItem {
  id: string
  title: string
  subtitle: string
  status: ActivityStatus
  startAt: string
  endAt: string
  rewardHint: string
  rules: string[]
  /** 渐变主题 token */
  tone: 'gold' | 'cyan' | 'violet' | 'green'
  /** 演示：当前用户是否已报名 */
  joined?: boolean
}

export interface SupportFaqCategory {
  id: string
  name: string
}

export interface SupportFaqItem {
  id: string
  categoryId: string
  question: string
  answer: string
  hot?: boolean
}

export type SupportTicketStatus = 'OPEN' | 'PENDING' | 'RESOLVED'

export interface SupportTicketItem {
  id: string
  subject: string
  categoryId: string
  status: SupportTicketStatus
  updatedAt: string
  preview: string
}
