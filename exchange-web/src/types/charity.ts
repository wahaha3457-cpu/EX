/** 加密慈善 / 公益（演示域模型，对标交易所慈善频道） */

export type CharityCategory = 'EDUCATION' | 'DISASTER' | 'ENVIRONMENT' | 'CHILDREN' | 'HEALTH'

export type CharityStatus = 'ACTIVE' | 'COMPLETED'

export type CharitySegment = 'all' | 'active' | 'completed'

/** 用户维度的演示捐赠流水（本地 Pinia，刷新页面会丢除非后续接持久化） */
export interface CharityDonationLedgerEntry {
  id: string
  time: string
  slug: string
  amountUsdt: number
  /** 与抽屉内「演示单号」一致 */
  orderRef: string
}

export interface CharityCampaign {
  slug: string
  category: CharityCategory
  status: CharityStatus
  /** 已筹 USDT（演示） */
  raisedUsdt: number
  /** 目标 USDT */
  goalUsdt: number
  donors: number
  coverSeed: string
  /** 受益地区示意 */
  regionKey: string
  /** 结束时间 ISO，已完成可为 null */
  endAt: string | null
}
