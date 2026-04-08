/** 顶栏搜索弹层 — Mock 热门与理财卡片（参考币安布局） */
export interface HeaderHotPair {
  symbol: string
  label: string
  price: number
  chgPct: number
}

export interface HeaderEarnCard {
  asset: string
  apy: string
}

export const HEADER_HOT_PAIRS: HeaderHotPair[] = [
  { symbol: 'BTC_USDT', label: 'BTC/USDT', price: 66749.78, chgPct: 1.05 },
  { symbol: 'ETH_USDT', label: 'ETH/USDT', price: 3508.42, chgPct: -0.62 },
  { symbol: 'SOL_USDT', label: 'SOL/USDT', price: 178.91, chgPct: 2.31 },
  { symbol: 'BNB_USDT', label: 'BNB/USDT', price: 612.3, chgPct: 0.88 },
  { symbol: 'XRP_USDT', label: 'XRP/USDT', price: 2.084, chgPct: -1.12 },
]

export const HEADER_EARN_CARDS: HeaderEarnCard[] = [
  { asset: 'USDT', apy: '15.43' },
  { asset: 'ETH', apy: '8.2' },
  { asset: 'BTC', apy: '5.1' },
]
