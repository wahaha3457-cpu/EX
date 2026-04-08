/**
 * 频道命名约定：与网关文档对齐后可整体替换前缀。
 * 路由键 = 此处返回值，须与后端推送 envelope.channel 一致。
 */

export const SpotChannel = {
  ticker: (symbol: string) => `market.${symbol}.ticker`,
  depth: (symbol: string) => `market.${symbol}.depth`,
  trade: (symbol: string) => `market.${symbol}.trade`,
  kline: (symbol: string, interval: string) => `market.${symbol}.kline.${interval}`,
} as const

export const FuturesChannel = {
  mark: (symbol: string) => `market.${symbol}.mark`,
  depth: (symbol: string) => `market.${symbol}.depth`,
  trade: (symbol: string) => `market.${symbol}.trade`,
  funding: (symbol: string) => `market.${symbol}.funding`,
  kline: (symbol: string, interval: string) => `market.${symbol}.kline.${interval}`,
} as const

/** 用户私有（示例命名） */
export const UserChannel = {
  order: (userId: string) => `user.${userId}.order`,
  wallet: (userId: string) => `user.${userId}.wallet`,
  position: (userId: string) => `user.${userId}.position`,
} as const
