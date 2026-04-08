/** 跟单交易 / Copy Trading（演示域模型，可对齐币安跟单） */

export type CopyMarket = 'SPOT' | 'FUTURES'

export type CopyRiskLevel = 1 | 2 | 3 | 4 | 5

export interface LeadTrader {
  id: string
  displayName: string
  /** 头像占位色或首字母 */
  avatarHue: number
  roi30dPct: number
  roi90dPct: number
  winRatePct: number
  maxDrawdownPct: number
  followers: number
  /** 跟单资金规模示意 USDT */
  aumUsdt: number
  tags: string[]
  markets: CopyMarket[]
  riskLevel: CopyRiskLevel
  /** 近 30 日带单笔数（示意） */
  trades30d: number
  bio: string
}

export interface CopyFollowSettings {
  traderId: string
  /** 单笔跟单保证金 / 本金（USDT，演示） */
  marginPerOrderUsdt: number
  /** 跟单倍数 0.1 – 3 */
  copyRatio: number
  /** 单日最大亏损达此比例时暂停跟单（%） */
  maxDailyLossPct: number
  copySpot: boolean
  copyFutures: boolean
  status: 'active' | 'paused'
  startedAt: string
  updatedAt: string
}

export interface CopySubscription extends CopyFollowSettings {
  trader: Pick<LeadTrader, 'id' | 'displayName' | 'avatarHue' | 'roi30dPct' | 'followers'>
}

export interface CopyOpenPosition {
  id: string
  traderId: string
  traderName: string
  market: CopyMarket
  symbol: string
  side: 'LONG' | 'SHORT' | 'BUY' | 'SELL'
  entryPrice: number
  markPrice: number
  qty: number
  leverage?: number
  uPnlUsdt: number
  openedAt: string
}

export interface CopyClosedRound {
  id: string
  traderId: string
  traderName: string
  symbol: string
  market: CopyMarket
  pnlUsdt: number
  closedAt: string
}
